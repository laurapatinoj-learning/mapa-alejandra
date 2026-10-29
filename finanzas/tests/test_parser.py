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


# ---- Mensajes reales (segunda ronda) ----
from app.parser import TRANSFER  # noqa: E402
from app.categories import categorize, bucket_of  # noqa: E402


def test_nu_approved():
    p = parse_message("Tu compra en TOSTAO CAFE Y PAN TORR por $3.800,00 con tu tarjeta terminada en 6347 ha sido APROBADA.")
    assert (p.issuer, p.kind, p.amount, p.merchant, p.card) == ("Nu", PURCHASE, 3800.0, "TOSTAO CAFE Y PAN TORR", "6347")


def test_daviplata_variants():
    p = parse_message("Pago exitoso con su DaviPlata por $34,522. Consulte sus movimientos el App DaviPlata.")
    assert (p.kind, p.amount) == (PURCHASE, 34522.0)
    p = parse_message("Compra exitosa con su DaviPlata por PSE de $44,590. Consulte sus movimientos en el App.")
    assert (p.kind, p.amount, p.merchant) == (PURCHASE, 44590.0, "PSE")
    p = parse_message("Su DaviPlata fue cargado desde una cuenta Davivienda con $100,000.")
    assert (p.kind, p.amount) == (TRANSFER, 100000.0)
    p = parse_message("DaviPlata: recibiste $10,000 desde una cuenta Davivienda. Usalos para pagar, comprar y mucho mas! "
                      "Conoce todo lo que puedes hacer en www.daviplata.com .")
    assert (p.kind, p.amount) == (INCOME, 10000.0)


def test_davivienda_prefix_and_approved():
    p = parse_message("DAVIVIENDA: Compra . Aprobado(a), $252,865, Tarjeta   *9440, Hora 14:32,Lugar AMAZON MKTPLACE PMTS  .")
    assert (p.kind, p.amount, p.card, p.merchant) == (PURCHASE, 252865.0, "9440", "AMAZON MKTPLACE PMTS")
    p = parse_message("DAVIVIENDA: Compra . Declinada(o), $1,712,176, Tarjeta   *3256, Hora 18:55,Lugar SUPERTIENDA OLIMPICA")
    assert (p.kind, p.amount) == (DECLINED, 1712176.0)
    p = parse_message("DAVIVIENDA: Compra . Aprobado(a), $1,749,050, Tarjeta   *3256, Hora 17:39,Lugar ALKOSTO AVX 68  .")
    assert p.amount == 1749050.0 and p.merchant == "ALKOSTO AVX 68"


@pytest.mark.parametrize("merchant,cat,bucket", [
    ("TOSTAO CAFE Y PAN TORR", "Alimentación", "Necesidades"), ("TIENDAS ARA", "Alimentación", "Necesidades"),
    ("NOVAVENTA", "Alimentación", "Necesidades"), ("FARMATODO CONNECTA", "Salud", "Necesidades"),
    ("DOLLARCITY CONNECTA", "Hogar y compras", "Deseos"), ("ALKOSTO AVX 68", "Hogar y compras", "Deseos"),
    ("AMAZON MKTPLACE PMTS", "Compras en línea", "Deseos"), ("RAPPI COLOMBIA*DL", "Domicilios", "Deseos"),
    ("SUPERTIENDA OLIMPICA", "Alimentación", "Necesidades"), ("PARAISO", "Otros", "Deseos"),
])
def test_categories(merchant, cat, bucket):
    assert categorize(merchant) == cat and bucket_of(cat) == bucket
