import os
import secrets
from datetime import date
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from . import notify, service
from .parser import parse_message, parse_wallet

app = FastAPI(title="Finanzas personales", version="0.1.0")


def auth(x_api_key: str = Header(default="")):
    expected = os.environ.get("API_KEY", "")
    if not expected or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(401, "API key inválida")


class WalletTx(BaseModel):
    merchant: str
    amount: str   # tal como lo entrega Atajos, p. ej. "$32.850"
    card: str     # nombre de la tarjeta en Wallet, p. ej. "Nu Mastercard"


class SmsTx(BaseModel):
    text: str


class PlanIn(BaseModel):
    month: str                  # YYYY-MM
    gross_salary: float         # salario bruto; se descuentan salud y pensión
    health_pct: float = 4
    pension_pct: float = 4
    needs_pct: float = 50
    wants_pct: float = 30
    savings_pct: float = 20


class BucketIn(BaseModel):
    bucket: str  # Necesidades | Deseos


class BudgetIn(BaseModel):
    month: str  # YYYY-MM
    category: str
    limit_amount: float


def _respond(result: dict) -> dict:
    for a in result.get("alerts", []):
        notify.push("Alerta de gasto", a, priority="high")
    return result


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/webhook/wallet", dependencies=[Depends(auth)])
def wallet(tx: WalletTx):
    try:
        p = parse_wallet(tx.merchant, tx.amount, tx.card)
    except ValueError as e:
        raise HTTPException(422, str(e))
    return _respond(service.record(p, "wallet"))


@app.post("/webhook/message", dependencies=[Depends(auth)])
def message(m: SmsTx):
    p = parse_message(m.text)
    if not p:
        raise HTTPException(422, "Mensaje no reconocido como transacción")
    return _respond(service.record(p, "message", raw=m.text))


@app.get("/transactions", dependencies=[Depends(auth)])
def transactions(limit: int = 50):
    return service.list_transactions(limit)


@app.put("/budgets", dependencies=[Depends(auth)])
def put_budget(b: BudgetIn):
    service.set_budget(b.month, b.category, b.limit_amount)
    return {"ok": True}


@app.get("/budgets/{month}", dependencies=[Depends(auth)])
def get_budgets(month: str):
    return service.budgets(month)


@app.get("/reports/{period}", dependencies=[Depends(auth)])
def get_report(period: str, ref: Optional[date] = None, push: bool = False):
    if period not in ("daily", "weekly"):
        raise HTTPException(404, "period debe ser daily o weekly")
    r = service.report(period, ref)
    if push:  # lo invoca un cron diario/semanal
        notify.push("Resumen " + ("diario" if period == "daily" else "semanal"), r["text"])
    return r


@app.put("/plan", dependencies=[Depends(auth)])
def put_plan(p: PlanIn):
    try:
        return service.set_plan(p.month, p.gross_salary, p.health_pct, p.pension_pct,
                                p.needs_pct, p.wants_pct, p.savings_pct)
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.get("/plan/{month}", dependencies=[Depends(auth)])
def get_plan(month: str):
    r = service.plan(month)
    if not r:
        raise HTTPException(404, "No hay plan para ese mes")
    return r


@app.put("/categories/{category}/bucket", dependencies=[Depends(auth)])
def put_bucket(category: str, b: BucketIn):
    if b.bucket not in ("Necesidades", "Deseos"):
        raise HTTPException(422, "bucket debe ser Necesidades o Deseos")
    service.set_category_bucket(category, b.bucket)
    return {"ok": True}
