import os

import pytest
from fastapi.testclient import TestClient

H = {"X-API-Key": "k"}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("API_KEY", "k")
    from app import db
    monkeypatch.setattr(db, "DB_PATH", str(tmp_path / "t.db"))
    from app.main import app
    return TestClient(app)


def test_auth_required(client):
    assert client.post("/webhook/wallet", json={"merchant": "x", "amount": "1", "card": "Nu"}).status_code == 401


def test_no_budget_alert_then_budget_alerts(client):
    r = client.post("/webhook/message", headers=H, json={"text": "Pagaste 55.200,00 en Mercado Pago*EINTELIGE"}).json()
    assert r["transaction"]["category"] == "Compras en línea"
    assert "Sin presupuesto" in r["alerts"][0]

    month = r["transaction"]["ts"][:7]
    client.put("/budgets", headers=H, json={"month": month, "category": "Domicilios", "limit_amount": 100000})
    r = client.post("/webhook/wallet", headers=H,
                    json={"merchant": "RAPPI COLOMBIA", "amount": "$85.000", "card": "Nu Mastercard"}).json()
    assert r["transaction"]["issuer"] == "Nu" and "80 %" in r["alerts"][0]
    r = client.post("/webhook/wallet", headers=H,
                    json={"merchant": "RAPPI COLOMBIA", "amount": "$30.000", "card": "Davivienda Visa"}).json()
    assert "superaste" in r["alerts"][0]


def test_duplicate_wallet_and_sms_collapse(client):
    a = client.post("/webhook/wallet", headers=H, json={"merchant": "Mercado Pago*EINTELIGE", "amount": "$55.200", "card": "Nequi"})
    b = client.post("/webhook/message", headers=H, json={"text": "Pagaste 55.200,00 en Mercado Pago*EINTELIGE"})
    assert a.json()["duplicate"] is False and b.json()["duplicate"] is True


def test_declined_not_counted_and_reports(client):
    client.post("/webhook/message", headers=H, json={"text": "Compra . Declinada(o) Tarjeta Reexpedida, $32,850, Tarjeta   *3256, Hora 13:17,Lugar RAPPI COLOMBIA*DL"})
    client.post("/webhook/message", headers=H, json={"text": "Pagaste 20.000,00 en Uber"})
    d = client.get("/reports/daily", headers=H).json()
    assert d["total_spent"] == 20000 and d["declined"] == 1
    w = client.get("/reports/weekly", headers=H).json()
    assert "Resumen semanal" in w["text"] and "Transporte" in w["by_category"]
