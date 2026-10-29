"""Notificaciones push al iPhone vía ntfy (se puede autoalojar en tu propia nube)."""
import os
import urllib.request


def push(title: str, message: str, priority: str = "default") -> bool:
    url = os.environ.get("NTFY_URL")  # p. ej. https://ntfy.tudominio.com/finanzas
    if not url:
        return False
    req = urllib.request.Request(url, data=message.encode("utf-8"), method="POST",
                                 headers={"Title": title.encode("utf-8").decode("latin-1", "ignore") or "Finanzas",
                                          "Priority": priority})
    token = os.environ.get("NTFY_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        urllib.request.urlopen(req, timeout=5)
        return True
    except Exception:
        return False
