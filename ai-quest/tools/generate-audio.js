/* Genera assets/audio/<id>.mp3 con la API de ElevenLabs a partir de assets/audio/manifest.json.
   Uso:  ELEVENLABS_API_KEY=xxx node tools/generate-audio.js [--dry-run]
   - Omite los archivos que ya existen (se puede reanudar si se acaba la cuota).
   - Voz por defecto: «Andrea - Clear, Warm & Dynamic» (es-latinoamericano). Cambia con VOICE_ID=...
   - Coste: 1 crédito por carácter (el manifest actual suma ~3.600 caracteres). Nota: no se ha podido probar aquí (cuota agotada). */
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '../assets/audio'), man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const KEY = process.env.ELEVENLABS_API_KEY, VOICE = process.env.VOICE_ID || 'attjAvEwtUIAm108to6B', dry = process.argv.includes('--dry-run');
const todo = man.lines.filter((l) => !fs.existsSync(path.join(dir, l.file)));
console.log(`${todo.length} de ${man.lines.length} archivos por generar · ${todo.reduce((a, l) => a + l.text.length, 0)} caracteres (≈ créditos)`);
if (dry) process.exit(0);
if (!KEY) { console.error('Falta ELEVENLABS_API_KEY'); process.exit(1); }
(async () => {
  for (const l of todo) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json' }, body: JSON.stringify({ text: l.text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.8 } }) });
    if (!r.ok) { console.error('✗', l.id, r.status, (await r.text()).slice(0, 200)); process.exit(1); }
    fs.writeFileSync(path.join(dir, l.file), Buffer.from(await r.arrayBuffer())); console.log('✓', l.file);
  }
  console.log('Listo. Activa AIQ.audio.cfg.useAudioFiles = true (js/core/audio.js).');
})();
