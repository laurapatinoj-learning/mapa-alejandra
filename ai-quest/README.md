# AI QUEST — From Zero to AI Architect

E-learning interactivo y gamificado (HTML5 + CSS3 + JavaScript, sin dependencias ni build) que lleva a una persona sin conocimientos previos desde «¿qué es la IA?» hasta diseñar soluciones con prompts, workflows, agentes, APIs y MCP.

## Cómo abrirlo

```bash
cd ai-quest
python3 -m http.server 8080      # luego abre http://localhost:8080
```
También funciona abriendo `index.html` directamente (no usa módulos ES ni peticiones externas). El progreso se guarda en `localStorage` (se puede exportar/importar desde *Perfil*).

## Qué incluye

| Requisito | Dónde |
|---|---|
| Dashboard, mapa, misiones, insignias, perfil, laboratorio | `js/app.js` |
| Personaje guía **Nova** (original, inspirada en la imagen de referencia), 6 expresiones y 6 animaciones | `js/core/character.js` |
| Voz + efectos con controles (pausar, repetir, silenciar, volumen), subtítulos | `js/core/audio.js`, `js/core/voice.js` |
| 10 niveles (Bloom revisada), cada uno con objetivo medible, narrativa, conceptos, ejemplo, prácticas, reto y evaluación ≥ 80 % | `js/levels/level01…10.js` |
| 15 tipos de actividad (quiz, clasificar, emparejar, ordenar, flashcards, sliders, escenarios ramificados, hotspots, explorador, diagramas, constructor de flujos, diseñador con rúbrica, simulador API, explorador JSON, **simulador MCP**) | `js/activities/*.js` |
| Laboratorio de prompts (analizador A/B, bitácora, parámetros, conexión opcional a un modelo real) | `js/lab.js` |
| Gamificación: XP, rachas, insignias, logros, desafíos sorpresa, certificado PNG | `js/app.js`, `js/core/store.js` |
| Diagnóstico + evaluación formativa + sumativa + rúbrica final (20/25/25/15/15) | `js/levels/extra.js`, `level10.js` |

## Lo que es real y lo que es simulación (importante)

* **Real:** efectos de sonido (Web Audio), voz del navegador (SpeechSynthesis, `es-419`/`es-MX`), persistencia, XP/rachas/desbloqueos, analizador estructural de prompts, certificado, accesibilidad.
* **Simulado y rotulado como tal en pantalla:** la API (`api.ejemplo-ia.test`), los servidores MCP (`kb-capacitacion`, `lms-cursos`, `erp-legado`), las respuestas «del modelo» del simulador de prompts y la traza del agente. No se envía nada a ningún servicio.
* **Evaluación automática:** las rúbricas abiertas se corrigen con reglas locales (expresiones regulares), **no con un modelo de IA**. Sirven para dar retroalimentación inmediata; no sustituyen a un evaluador humano.
* **Personaje «3D»:** es una ilustración vectorial en capas con perspectiva y parallax CSS (2.5D), no un modelo 3D (GLB). Ver «Siguientes pasos».
* **Voz «profesional»:** por defecto usa la voz instalada en el navegador del usuario (la calidad varía). Para audio de estudio ver `docs/AUDIO.md`.
* **Modelo real opcional:** el laboratorio incluye un conector a la API de Anthropic con una clave que pega el usuario (solo en memoria). **No se pudo probar aquí** (no hay clave).

## Accesibilidad

Navegación por teclado, foco visible, enlaces de salto, `aria-*` en actividades, arrastrar-y-soltar con alternativa por teclado, subtítulos de todo lo que dice Nova, alto contraste, tamaño de texto, pausa de animaciones (⚙), diseño responsive.

## Pruebas

```bash
node tools/check-content.js        # integridad del contenido + las muestras de referencia superan la rúbrica
node tools/build-voice-docs.js     # regenera docs/voice-scripts.md y assets/audio/manifest.json
```

## Siguientes pasos recomendados

1. Producir los 57 audios (`docs/voice-scripts.md`) con una voz de estudio y activar `AIQ.audio.cfg.useAudioFiles`.
2. Generar un modelo 3D real (GLB) del personaje a partir de la imagen de referencia y cargarlo con `<model-viewer>`/three.js.
3. Revisar el contenido de MCP contra la especificación vigente en <https://modelcontextprotocol.io/> (al construir esta versión no hubo acceso de red a ese sitio; el contenido sigue JSON-RPC 2.0, `initialize`/`notifications/initialized`, resources/prompts/tools, transportes stdio y Streamable HTTP, y autorización OAuth 2.1).
4. Empaquetar como SCORM/xAPI si se va a publicar en un LMS (Rise/Storyline: cada actividad es un componente HTML5 autocontenido).
