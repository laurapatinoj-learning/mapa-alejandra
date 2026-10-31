# Audio de AI QUEST

## Intento con ElevenLabs (31-oct-2026)

Se eligió la voz **Andrea – Clear, Warm & Dynamic** (`attjAvEwtUIAm108to6B`, español latinoamericano). La generación **falló: la cuenta tenía 0 de 10.000 créditos**, por lo que no hay `.mp3` todavía. Los 57 guiones suman ~3.600 caracteres (≈ 3.600 créditos, 1 toma). Cuando se renueve la cuota:

```bash
ELEVENLABS_API_KEY=xxx node tools/generate-audio.js --dry-run   # ver el costo
ELEVENLABS_API_KEY=xxx node tools/generate-audio.js             # genera y guarda en assets/audio/
```
Luego pon `useAudioFiles: true` en `js/core/audio.js`. (Script no probado: no hubo cuota.)

## Estado actual (honesto)

| Elemento | Estado |
|---|---|
| Efectos (clic, acierto, error, desbloqueo, insignia, transición, alerta, subida de nivel) | **Generados en el navegador** con Web Audio. No hay archivos. |
| Voz de Nova | **Voz del navegador** (SpeechSynthesis, español latinoamericano si está instalado). Calidad variable. **No hay archivos .mp3 producidos todavía.** |
| Guiones | **57 líneas listas** en `voice-scripts.md` (bienvenida, 10 introducciones, 10 instrucciones de reto, 10 celebraciones, correcto/incorrecto, motivación, alertas). |

## Cómo sustituir la voz del navegador por audio de estudio

1. Produce un `.mp3` por cada fila de `docs/voice-scripts.md` con el nombre `<id>.mp3` (p. ej. `lvl9_intro.mp3`) en `assets/audio/`. Cualquier motor TTS o locutor sirve; mantén la misma voz para todo.
2. Activa el modo archivos antes de arrancar la app, p. ej. en `js/app.js`: `AIQ.audio.cfg.useAudioFiles = true;`
3. Si falta un archivo, la app **cae automáticamente** a la voz del navegador para esa línea.
4. Los subtítulos (globo de Nova) se muestran siempre que estén activados en ⚙, con o sin audio.

## Identidad sonora de Nova (guía de producción)

Voz femenina cálida, ritmo medio (~150 palabras/minuto), sonrisa audible, pausas breves antes de cada instrucción, sin muletillas. Efectos con timbres suaves (seno/triángulo) en la tonalidad de Do mayor; alertas discretas (dos pulsos cuadrados cortos y a bajo volumen).
