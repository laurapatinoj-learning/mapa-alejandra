"""Interpreta notificaciones de Nequi, DaviPlata, Davivienda, Nu y Apple Wallet."""
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

PURCHASE, DECLINED, INCOME, TRANSFER = "purchase", "declined", "income", "transfer"


@dataclass
class Parsed:
    issuer: str
    kind: str  # purchase | declined | income | transfer
    amount: float
    merchant: str
    card: Optional[str] = None
    currency: str = "COP"


def parse_amount(text: str) -> float:
    """Convierte '55.200,00', '$59,000', '32,850' o '1.250' a float (formato colombiano)."""
    s = re.sub(r"[^\d.,]", "", text).strip(".,")
    if not s:
        raise ValueError(f"monto inválido: {text!r}")
    if "." in s and "," in s:
        dec = "," if s.rfind(",") > s.rfind(".") else "."
        thou = "." if dec == "," else ","
        s = s.replace(thou, "").replace(dec, ".")
    elif "." in s or "," in s:
        sep = "." if "." in s else ","
        parts = s.split(sep)
        # un solo separador seguido de 1-2 dígitos es decimal; en otro caso, miles
        if len(parts) == 2 and len(parts[1]) in (1, 2):
            s = parts[0] + "." + parts[1]
        else:
            s = s.replace(sep, "")
    return float(s)


_AMOUNT = r"\$?\s*([\d][\d.,]*)"


def _nequi(t: str) -> Optional[Parsed]:
    m = re.search(r"Pagaste\s+" + _AMOUNT + r"\s+en\s+(.+)", t, re.I)
    if m:
        return Parsed("Nequi", PURCHASE, parse_amount(m[1]), m[2].strip(" ."))
    m = re.search(r"Recibiste\s+" + _AMOUNT + r"\s+de\s+(.+)", t, re.I)
    if m:
        return Parsed("Nequi", INCOME, parse_amount(m[1]), m[2].strip(" ."))
    return None


def _daviplata(t: str) -> Optional[Parsed]:
    if not re.search(r"daviplata", t, re.I):
        return None
    # Recarga desde tu propia cuenta Davivienda: movimiento entre tus cuentas, no es gasto ni ingreso
    m = re.search(r"cargado desde una cuenta\s+(\w+)\s+con\s+" + _AMOUNT, t, re.I)
    if m:
        return Parsed("DaviPlata", TRANSFER, parse_amount(m[2]), f"Recarga desde {m[1]}")
    m = re.search(r"(?:recibir|recibiste)\s+" + _AMOUNT + r"(?:\s+en tu DaviPlata)?\s+desde\s+(.+?)\.(?:\s|$)", t, re.I)
    if m:
        return Parsed("DaviPlata", INCOME, parse_amount(m[1]), m[2].strip())
    m = re.search(r"(?:Pago|Compra)\s+exitos[oa]\s+con su DaviPlata\s+por\s+(?:(PSE)\s+de\s+)?" + _AMOUNT, t, re.I)
    if m:
        return Parsed("DaviPlata", PURCHASE, parse_amount(m[2]), "PSE" if m[1] else "DaviPlata (comercio no indicado)")
    m = re.search(r"(?:pagaste|compraste|retiraste)\s+" + _AMOUNT + r"(?:\s+en\s+(.+?))?\.", t, re.I)
    if m:
        return Parsed("DaviPlata", PURCHASE, parse_amount(m[1]), (m[2] or "DaviPlata").strip())
    return None


def _davivienda(t: str) -> Optional[Parsed]:
    t = re.sub(r"^\s*DAVIVIENDA:\s*", "", t, flags=re.I)
    if not re.search(r"^\s*Compra", t, re.I):
        return None
    amt = re.search(r"\$\s*([\d][\d.,]*)", t)
    if not amt:
        return None
    card = re.search(r"\*(\d{4})", t)
    place = re.search(r"Lugar\s+(.+)$", t, re.I | re.S)
    kind = DECLINED if re.search(r"declinad", t, re.I) else PURCHASE
    return Parsed("Davivienda", kind, parse_amount(amt[1]),
                  place[1].strip(" .") if place else "desconocido",
                  card[1] if card else None)


def _nu(t: str) -> Optional[Parsed]:
    m = re.search(r"compra en\s+(.+?)\s+por\s+" + _AMOUNT + r"\s+con tu tarjeta terminada en\s+(\d{4})", t, re.I)
    if not m:
        return None
    kind = DECLINED if re.search(r"rechazad|declinad", t, re.I) else PURCHASE
    return Parsed("Nu", kind, parse_amount(m[2]), m[1].strip(), m[3])


_PARSERS = (_nequi, _daviplata, _davivienda, _nu)

# Emisor a partir del nombre de la tarjeta en Apple Wallet
_WALLET_ISSUERS = (("nu", "Nu"), ("davivienda", "Davivienda"), ("nequi", "Nequi"),
                   ("daviplata", "DaviPlata"))


def issuer_from_card(card: str) -> str:
    low = (card or "").lower()
    for key, name in _WALLET_ISSUERS:
        if re.search(rf"\b{key}\b", low):
            return name
    return card or "Desconocido"


def parse_message(text: str) -> Optional[Parsed]:
    """Prueba cada banco; devuelve None si el texto no es una transacción conocida."""
    text = " ".join((text or "").split()) if "\n" not in (text or "") else text.strip()
    for p in _PARSERS:
        res = p(text)
        if res:
            return res
    return None


def parse_wallet(merchant: str, amount: str, card: str) -> Parsed:
    """Payload de la automatización 'Transacción' de Atajos (comercio, monto, tarjeta)."""
    return Parsed(issuer_from_card(card), PURCHASE, parse_amount(str(amount)),
                  merchant.strip(), card)


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")
