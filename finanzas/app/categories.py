"""Categorización por palabras clave del comercio."""
RULES = {
    "Domicilios": ["rappi", "ifood", "didi food", "uber eats", "domicilios"],
    "Alimentación": ["exito", "éxito", "jumbo", "d1", "ara ", "carulla", "olimpica", "olímpica",
                     "restaurante", "frisby", "crepes", "starbucks", "juan valdez", "panaderia"],
    "Transporte": ["uber", "didi", "cabify", "beat", "indrive", "terpel", "primax", "transmilenio", "tullave"],
    "Suscripciones": ["netflix", "spotify", "disney", "hbo", "max", "youtube", "apple.com", "icloud",
                      "google *", "amazon prime", "openai", "claude"],
    "Compras en línea": ["mercado pago", "mercadolibre", "mercado libre", "amazon", "aliexpress", "temu", "shein"],
    "Salud": ["farmacia", "cruz verde", "drogas", "eps", "clinica", "clínica", "medic"],
    "Servicios": ["claro", "movistar", "tigo", "wom", "enel", "codensa", "vanti", "acueducto", "epm"],
    "Entretenimiento": ["cine", "cinemark", "procinal", "boleta", "tuboleta", "steam", "playstation"],
}
DEFAULT = "Otros"


def categorize(merchant: str) -> str:
    low = (merchant or "").lower()
    for cat, words in RULES.items():
        if any(w in low for w in words):
            return cat
    return DEFAULT
