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

## Plan 50/30/20 sobre tu salario neto
```bash
curl -X PUT https://TU_DOMINIO/plan -H "X-API-Key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"month":"2026-11","gross_salary":3516000}'
```
Descuenta 4 % salud y 4 % pensión → **neto $3.234.720**: Necesidades $1.617.360 · Deseos $970.416 · Ahorro $646.944.
Repite el comando cada mes (o cuando cambie tu salario). Las categorías se asignan así (editable con
`PUT /categories/{categoria}/bucket`): **Necesidades** = Alimentación, Transporte, Salud, Servicios;
**Deseos** = Domicilios, Suscripciones, Compras en línea, Hogar y compras, Entretenimiento, Otros.

## Despliegue en Fly.io (recomendado: ~US$2–5/mes, HTTPS incluido, disco persistente)
```bash
brew install flyctl && fly auth signup          # o fly auth login
cd finanzas
# edita app = "..." en fly.toml con un nombre único
fly launch --no-deploy --copy-config --name TU_NOMBRE
fly volumes create finanzas_data --size 1 --region mia
fly secrets set API_KEY=$(openssl rand -hex 32)  # guarda esta clave: la usarás en los Atajos
fly deploy
curl https://TU_NOMBRE.fly.dev/health
```
Alternativa: un VPS de US$5 (Hetzner/DigitalOcean) con `docker run` + Caddy para HTTPS.
Tus datos financieros viven en ese volumen: no compartas la API key ni el dominio.

## Reglas de alerta
- **Sin presupuesto**: si no hay plan 50/30/20 ni tope de categoría para ese mes, la compra dispara "no se está considerando el presupuesto".
- **Plan 50/30/20**: aviso al 80 % y 100 % de Necesidades y de Deseos, y aviso cuando el gasto total ya compromete tu 20 % de ahorro (90 % y 100 %).
- Las recargas DaviPlata desde tu cuenta Davivienda se registran como transferencia propia (no suman gasto).
- **80 %** y **100 %** del tope por categoría (una vez por mes y umbral; si cambias el tope se reinician).
- Las compras **declinadas** se registran pero no suman al gasto.
- Categorías en `app/categories.py` (palabras clave editables).

## Limitaciones conocidas
- **Nu no manda SMS, solo notificaciones push de su app, y iOS no permite que Atajos lea notificaciones de otras apps.** Las compras de Nu se capturan solo si la tarjeta está en Apple Wallet y pagas con Apple Pay (automatización de Transacción). El parser de Nu existe y funciona con el texto de la notificación (`/webhook/message`), por si más adelante hay un camino de correo o de pegado manual.
- Dos compras idénticas (mismo comercio y monto) en menos de ~10 minutos se cuentan como una.
- iOS puede pedir confirmación en algunas automatizaciones de Mensaje; Transacción de Wallet sí corre sin preguntar.
- Pagos de Nequi/DaviPlata sin Apple Pay solo se capturan por SMS/notificación.
