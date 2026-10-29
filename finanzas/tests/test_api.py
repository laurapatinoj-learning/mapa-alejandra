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


def test_plan_50_30_20_and_alerts(client):
    month = __import__("datetime").date.today().strftime("%Y-%m")
    p = client.put("/plan", headers=H, json={"month": month, "gross_salary": 3516000}).json()
    assert round(p["net"]) == 3234720
    assert round(p["buckets"]["Necesidades"]["limit"]) == 1617360
    assert round(p["buckets"]["Deseos"]["limit"]) == 970416
    assert round(p["savings"]["target"]) == 646944

    # Compra en Deseos que supera el 100 % del tope de Deseos (Alkosto $1.749.050 > $970.416)
    r = client.post("/webhook/message", headers=H, json={
        "text": "DAVIVIENDA: Compra . Aprobado(a), $1,749,050, Tarjeta   *3256, Hora 17:39,Lugar ALKOSTO AVX 68  ."}).json()
    assert any("Deseos" in a and "superaste" in a for a in r["alerts"])
    assert not any("Sin presupuesto" in a for a in r["alerts"])
    rep = client.get("/reports/daily", headers=H).json()
    assert "Plan" in rep["text"] and rep["plan"]["savings"]["on_track"] is False

    # Reclasificar la categoría a Necesidades
    client.put("/categories/Hogar y compras/bucket", headers=H, json={"bucket": "Necesidades"})
    assert client.get(f"/plan/{month}", headers=H).json()["buckets"]["Necesidades"]["spent"] == 1749050


def test_plan_must_sum_100(client):
    r = client.put("/plan", headers=H, json={"month": "2026-11", "gross_salary": 1, "needs_pct": 60})
    assert r.status_code == 422


def test_transfer_not_counted(client):
    client.post("/webhook/message", headers=H, json={"text": "Su DaviPlata fue cargado desde una cuenta Davivienda con $100,000."})
    assert client.get("/reports/daily", headers=H).json()["total_spent"] == 0
