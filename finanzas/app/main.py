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
