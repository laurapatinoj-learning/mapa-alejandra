import pytest
from app.parser import DECLINED, INCOME, PURCHASE, parse_amount, parse_message, parse_wallet


@pytest.mark.parametrize("raw,expected", [
    ("55.200,00", 55200.0), ("$59,000", 59000.0), ("$32,850", 32850.0),
    ("1.250", 1250.0), ("1.250.000,50", 1250000.5), ("1,250,000.50", 1250000.5), ("12,5", 12.5),
])
def test_amounts(raw, expected):
    assert parse_amount(raw) == expected


def test_nequi_purchase():
    p = parse_message("Pagaste 55.200,00 en Mercado Pago*EINTELIGE")
    assert (p.issuer, p.kind, p.amount, p.merchant) == ("Nequi", PURCHASE, 55200.0, "Mercado Pago*EINTELIGE")


def test_daviplata_income():
    p = parse_message("acabas de recibir $59,000 en tu DaviPlata desde  otro banco. Para saber mas, "
                      "consulta tus movimientos desde el App DaviPlata.")
    assert (p.issuer, p.kind, p.amount) == ("DaviPlata", INCOME, 59000.0)


def test_davivienda_declined():
    p = parse_message("Compra . Declinada(o) Tarjeta Reexpedida, $32,850, Tarjeta   *3256, "
                      "Hora 13:17,Lugar RAPPI COLOMBIA*DL")
    assert (p.issuer, p.kind, p.amount, p.card, p.merchant) == \
        ("Davivienda", DECLINED, 32850.0, "3256", "RAPPI COLOMBIA*DL")


def test_davivienda_approved():
    p = parse_message("Compra aprobada, $10,000, Tarjeta *3256, Hora 09:00, Lugar EXITO")
    assert p.kind == PURCHASE and p.amount == 10000.0


def test_unknown_message():
    assert parse_message("Tu código de verificación es 123456") is None


def test_wallet_issuer_from_card():
    assert parse_wallet("RAPPI", "$32.850", "Nu Mastercard").issuer == "Nu"
    assert parse_wallet("EXITO", "$10.000", "Tarjeta Davivienda Visa").issuer == "Davivienda"
