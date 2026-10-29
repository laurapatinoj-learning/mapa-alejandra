"""Categorización por palabras clave y asignación a los grupos 50/30/20."""
import re

# Una palabra que termina en * coincide por prefijo; el resto, como palabra completa.
RULES = {
    "Domicilios": ["rappi", "ifood", "didi food", "uber eats", "domicilios"],
    "Alimentación": ["exito", "éxito", "jumbo", "d1", "ara", "carulla", "olimpica", "olímpica",
                     "supertienda", "tostao", "novaventa", "restaurante*", "frisby", "crepes",
                     "starbucks", "juan valdez", "panader*", "cafe*", "pan"],
    "Transporte": ["uber", "didi", "cabify", "beat", "indrive", "terpel", "primax", "transmilenio", "tullave"],
    "Suscripciones": ["netflix", "spotify", "disney", "hbo", "max", "youtube", "apple.com", "icloud",
                      "google *", "amazon prime", "openai", "claude"],
    "Compras en línea": ["mercado pago", "mercadopago", "mercadolibre", "mercado libre", "amazon",
                         "aliexpress", "temu", "shein"],
    "Hogar y compras": ["alkosto", "ktronix", "homecenter", "easy", "dollarcity", "miniso", "falabella"],
    "Salud": ["farmatodo", "farmacia*", "cruz verde", "locatel", "drog*", "eps", "clinica", "clínica", "medic*"],
    "Servicios": ["claro", "movistar", "tigo", "wom", "enel", "codensa", "vanti", "acueducto", "epm"],
    "Entretenimiento": ["cine", "cinemark", "procinal", "boleta*", "tuboleta", "steam", "playstation"],
}
DEFAULT = "Otros"

NEEDS, WANTS = "Necesidades", "Deseos"
BUCKETS = {
    NEEDS: ["Alimentación", "Transporte", "Salud", "Servicios"],
    WANTS: ["Domicilios", "Suscripciones", "Compras en línea", "Hogar y compras", "Entretenimiento", "Otros"],
}


def _match(word: str, text: str) -> bool:
    prefix = word.endswith("*")
    w = re.escape(word.rstrip("*"))
    return re.search(r"(?<![a-z0-9])" + w + ("" if prefix else r"(?![a-z0-9])"), text) is not None


def categorize(merchant: str) -> str:
    low = (merchant or "").lower()
    for cat, words in RULES.items():
        if any(_match(w, low) for w in words):
            return cat
    return DEFAULT


def bucket_of(category: str, overrides: dict | None = None) -> str:
    if overrides and category in overrides:
        return overrides[category]
    return NEEDS if category in BUCKETS[NEEDS] else WANTS
