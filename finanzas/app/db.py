import hashlib
import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.environ.get("FINANZAS_DB", "finanzas.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key TEXT UNIQUE NOT NULL,
    ts TEXT NOT NULL,
    issuer TEXT NOT NULL,
    kind TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'COP',
    merchant TEXT NOT NULL,
    card TEXT,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    raw TEXT
);
CREATE INDEX IF NOT EXISTS idx_tx_ts ON transactions(ts);
CREATE TABLE IF NOT EXISTS budgets (
    month TEXT NOT NULL,          -- 'YYYY-MM'
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    PRIMARY KEY (month, category)
);
CREATE TABLE IF NOT EXISTS alerts_sent (
    key TEXT PRIMARY KEY,
    ts TEXT NOT NULL
);
"""


@contextmanager
def conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        c.executescript(SCHEMA)
        yield c
        c.commit()
    finally:
        c.close()


def dedupe_key(source: str, issuer: str, amount: float, merchant: str, ts: str) -> str:
    """Misma transacción notificada por Wallet y por SMS en la misma ventana de 2 min colapsa en una."""
    bucket = ts[:15]  # YYYY-MM-DDTHH:M (≈10 min)
    return hashlib.sha256(f"{issuer}|{amount:.2f}|{merchant.lower()}|{bucket}".encode()).hexdigest()


SCHEMA += """
CREATE TABLE IF NOT EXISTS plan (
    month TEXT PRIMARY KEY,
    gross REAL NOT NULL,
    health_pct REAL NOT NULL,
    pension_pct REAL NOT NULL,
    net REAL NOT NULL,
    needs_pct REAL NOT NULL,
    wants_pct REAL NOT NULL,
    savings_pct REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS category_bucket (
    category TEXT PRIMARY KEY,
    bucket TEXT NOT NULL
);
"""
