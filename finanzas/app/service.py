"""Lógica de negocio: registrar transacciones, evaluar presupuestos y generar reportes."""
import sqlite3
from datetime import date, datetime, timedelta
from typing import Optional

from . import db
from .categories import categorize
from .parser import DECLINED, INCOME, PURCHASE, Parsed, now_iso

ALERT_THRESHOLDS = (0.8, 1.0)  # aviso al 80 % y al superar el tope


def fmt(n: float) -> str:
    return "$" + f"{n:,.0f}".replace(",", ".")


def record(p: Parsed, source: str, raw: str = "", ts: Optional[str] = None) -> dict:
    """Guarda la transacción y devuelve {'transaction', 'alerts', 'duplicate'}."""
    ts = ts or now_iso()
    category = categorize(p.merchant) if p.kind == PURCHASE else ("Ingresos" if p.kind == INCOME else "Declinada")
    key = db.dedupe_key(source if p.kind == DECLINED else "any", p.issuer, p.amount, p.merchant, ts)
    with db.conn() as c:
        try:
            cur = c.execute(
                "INSERT INTO transactions(dedupe_key,ts,issuer,kind,amount,currency,merchant,card,category,source,raw)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                (key, ts, p.issuer, p.kind, p.amount, p.currency, p.merchant, p.card, category, source, raw))
        except sqlite3.IntegrityError:
            return {"duplicate": True, "alerts": []}
        tx = {"id": cur.lastrowid, "ts": ts, "issuer": p.issuer, "kind": p.kind, "amount": p.amount,
              "merchant": p.merchant, "card": p.card, "category": category}
        alerts = check_alerts(c, tx) if p.kind == PURCHASE else []
    return {"duplicate": False, "transaction": tx, "alerts": alerts}


def month_of(ts: str) -> str:
    return ts[:7]


def spent(c, month: str, category: Optional[str] = None) -> float:
    q = "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE kind='purchase' AND substr(ts,1,7)=?"
    args = [month]
    if category:
        q += " AND category=?"
        args.append(category)
    return c.execute(q, args).fetchone()[0]


def check_alerts(c, tx: dict) -> list:
    month, cat = month_of(tx["ts"]), tx["category"]
    alerts = []

    def once(key: str, msg: str):
        if c.execute("SELECT 1 FROM alerts_sent WHERE key=?", (key,)).fetchone():
            return
        c.execute("INSERT INTO alerts_sent(key,ts) VALUES(?,?)", (key, now_iso()))
        alerts.append(msg)

    row = c.execute("SELECT limit_amount FROM budgets WHERE month=? AND category=?", (month, cat)).fetchone()
    if not row:
        # El gasto cae en una categoría sin presupuesto este mes: no se está considerando.
        once(f"nobudget:{month}:{cat}",
             f"⚠️ Sin presupuesto para «{cat}» en {month}. Gastaste {fmt(tx['amount'])} en {tx['merchant']}. "
             f"Define un tope para esta categoría.")
        return alerts

    limit, total = row[0], spent(c, month, cat)
    for th in ALERT_THRESHOLDS:
        if total >= limit * th:
            label = "superaste" if th >= 1 else f"llevas el {int(th*100)} % de"
            once(f"budget:{month}:{cat}:{th}",
                 f"🚨 {cat}: {label} tu tope ({fmt(total)} de {fmt(limit)}). Última compra: "
                 f"{tx['merchant']} {fmt(tx['amount'])} ({tx['issuer']}).")
    return alerts


def set_budget(month: str, category: str, limit_amount: float):
    with db.conn() as c:
        c.execute("INSERT INTO budgets(month,category,limit_amount) VALUES(?,?,?) "
                  "ON CONFLICT(month,category) DO UPDATE SET limit_amount=excluded.limit_amount",
                  (month, category, limit_amount))
        # Si se cambia el tope, permitir que las alertas vuelvan a dispararse
        c.execute("DELETE FROM alerts_sent WHERE key LIKE ?", (f"budget:{month}:{category}:%",))


def budgets(month: str) -> list:
    with db.conn() as c:
        return [dict(r) for r in c.execute(
            "SELECT category, limit_amount FROM budgets WHERE month=? ORDER BY category", (month,))]


def _summary(c, start: str, end: str) -> dict:
    rows = c.execute(
        "SELECT * FROM transactions WHERE substr(ts,1,10)>=? AND substr(ts,1,10)<=? ORDER BY ts", (start, end)
    ).fetchall()
    purchases = [r for r in rows if r["kind"] == PURCHASE]
    by_cat, by_issuer = {}, {}
    for r in purchases:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + r["amount"]
        by_issuer[r["issuer"]] = by_issuer.get(r["issuer"], 0) + r["amount"]
    month = end[:7]
    status = []
    for b in c.execute("SELECT category, limit_amount FROM budgets WHERE month=?", (month,)):
        used = spent(c, month, b["category"])
        status.append({"category": b["category"], "limit": b["limit_amount"], "spent_month": used,
                       "pct": round(100 * used / b["limit_amount"], 1) if b["limit_amount"] else None})
    return {
        "start": start, "end": end,
        "total_spent": sum(r["amount"] for r in purchases),
        "total_income": sum(r["amount"] for r in rows if r["kind"] == INCOME),
        "declined": sum(1 for r in rows if r["kind"] == DECLINED),
        "count": len(purchases),
        "by_category": dict(sorted(by_cat.items(), key=lambda kv: -kv[1])),
        "by_issuer": dict(sorted(by_issuer.items(), key=lambda kv: -kv[1])),
        "budget_status": status,
        "unbudgeted": sorted(set(by_cat) - {s["category"] for s in status}),
        "top": [{"merchant": r["merchant"], "amount": r["amount"], "category": r["category"],
                 "issuer": r["issuer"]} for r in sorted(purchases, key=lambda r: -r["amount"])[:5]],
    }


def report(period: str, ref: Optional[date] = None) -> dict:
    ref = ref or date.today()
    if period == "daily":
        start = end = ref
    else:  # semana lunes–domingo que contiene ref
        start = ref - timedelta(days=ref.weekday())
        end = start + timedelta(days=6)
    with db.conn() as c:
        s = _summary(c, start.isoformat(), end.isoformat())
    s["period"] = period
    s["text"] = render_text(s)
    return s


def render_text(s: dict) -> str:
    title = "Resumen diario" if s["period"] == "daily" else "Resumen semanal"
    lines = [f"📊 {title} ({s['start']}" + ("" if s["start"] == s["end"] else f" → {s['end']}") + ")",
             f"Gastado: {fmt(s['total_spent'])} en {s['count']} compras · Ingresos: {fmt(s['total_income'])}"]
    if s["declined"]:
        lines.append(f"Compras declinadas: {s['declined']}")
    if s["by_category"]:
        lines.append("Por categoría:")
        lines += [f"  • {k}: {fmt(v)}" for k, v in s["by_category"].items()]
    if s["by_issuer"]:
        lines.append("Por emisor: " + ", ".join(f"{k} {fmt(v)}" for k, v in s["by_issuer"].items()))
    for b in s["budget_status"]:
        flag = "🚨" if b["pct"] and b["pct"] >= 100 else "⚠️" if b["pct"] and b["pct"] >= 80 else "✅"
        lines.append(f"{flag} {b['category']}: {fmt(b['spent_month'])} / {fmt(b['limit'])} ({b['pct']} %)")
    if s["unbudgeted"]:
        lines.append("⚠️ Sin presupuesto: " + ", ".join(s["unbudgeted"]))
    return "\n".join(lines)


def list_transactions(limit: int = 50) -> list:
    with db.conn() as c:
        return [dict(r) for r in c.execute(
            "SELECT id,ts,issuer,kind,amount,merchant,card,category,source FROM transactions "
            "ORDER BY ts DESC, id DESC LIMIT ?", (limit,))]
