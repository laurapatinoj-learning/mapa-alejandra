# Finanzas personales – captura automática de compras

Backend ligero (FastAPI + SQLite) que recibe cada transacción desde tu iPhone, la categoriza,
identifica el emisor (Nequi, DaviPlata, Davivienda, Nu), compara contra presupuestos y te avisa.

## Flujo
```
Apple Pay / SMS  ──(Atajos: automatización)──▶  POST /webhook/...  ──▶  parser → categoría → alertas
                                                                       └▶ push (ntfy) + reportes diario/semanal
```

## Despliegue en tu nube
```bash
cp .env.example .env        # edita API_KEY (openssl rand -hex 32)
docker build -t finanzas .
docker run -d --name finanzas --env-file .env -v finanzas-data:/data -p 8000:8000 finanzas
```
Ponlo detrás de HTTPS (Caddy, Cloudflare Tunnel o el balanceador de tu nube). Los Atajos exigen HTTPS.

Desarrollo local: `pip install -r requirements.txt && API_KEY=dev uvicorn app.main:app --reload` · Pruebas: `pytest`.

## Endpoints (todos con cabecera `X-API-Key`)
| Método | Ruta | Uso |
|---|---|---|
| POST | `/webhook/wallet` | `{merchant, amount, card}` desde la automatización de Wallet |
| POST | `/webhook/message` | `{text}` con el SMS/notificación del banco |
| PUT | `/budgets` | `{month:"2026-11", category:"Domicilios", limit_amount:150000}` |
| GET | `/budgets/{YYYY-MM}` | topes del mes |
| GET | `/reports/daily` · `/reports/weekly` | resumen (`?push=true` lo envía como notificación) |
| GET | `/transactions` | últimas transacciones |

## Configurar el iPhone (app Atajos → Automatización → Crear automatización personal)

**1. Apple Pay (Wallet)** — disparador **Transacción**:
- Tarjetas: las que quieras (Nu, Davivienda…). Ejecutar inmediatamente.
- Acción **Obtener contenido de URL**: URL `https://TU_DOMINIO/webhook/wallet`, método POST,
  cabecera `X-API-Key`, cuerpo JSON con tres campos de texto: `merchant` = *Comercio*,
  `amount` = *Monto*, `card` = *Tarjeta o pase*.

**2. SMS (Nequi, DaviPlata, Davivienda)** — disparador **Mensaje**:
- "El remitente es": el número/nombre del banco (uno por automatización). Ejecutar inmediatamente.
- Acción **Obtener contenido de URL** a `https://TU_DOMINIO/webhook/message`, POST, cabecera
  `X-API-Key`, cuerpo JSON `text` = *Mensaje* (entrada del atajo).

Si pagas con Apple Pay y llega también el SMS, el backend lo detecta como duplicado (mismo emisor, monto, comercio y ventana de ~10 min).

**3. Notificaciones** — instala la app **ntfy**, suscríbete a tu tema y pon `NTFY_URL` en `.env`.

**4. Resúmenes** — programa en tu nube un cron: `GET /reports/daily?push=true` (p. ej. 8 p. m.) y `GET /reports/weekly?push=true` (domingos).

## Reglas de alerta
- **Sin presupuesto**: una compra en una categoría sin tope en ese mes dispara "no se está considerando el presupuesto".
- **80 %** y **100 %** del tope por categoría (una vez por mes y umbral; si cambias el tope se reinician).
- Las compras **declinadas** se registran pero no suman al gasto.
- Categorías en `app/categories.py` (palabras clave editables).

## Limitaciones conocidas
- Los SMS de Nu y los de compras aprobadas de Davivienda/DaviPlata aún no tienen muestra real: envíame ejemplos para afinar `app/parser.py`.
- iOS puede pedir confirmación en algunas automatizaciones de Mensaje; Transacción de Wallet sí corre sin preguntar.
- Pagos de Nequi/DaviPlata sin Apple Pay solo se capturan por SMS/notificación.
