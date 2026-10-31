/* Genera docs/voice-scripts.md y assets/audio/manifest.json a partir de las líneas de voz del proyecto.
   Uso: node tools/build-voice-docs.js */
const fs = require('fs'), path = require('path');
const A = require('../js/core/util.js'); require('../js/core/voice.js'); require('../js/levels/extra.js');
A.prompt = { analyze: () => ({ score: 0 }) };
for (let i = 1; i <= 10; i++) require(`../js/levels/level${String(i).padStart(2, '0')}.js`);
const rows = [];
const group = (g, id, text) => rows.push({ group: g, id, text });
Object.entries(A.voice).forEach(([k, t]) => group(k.startsWith('correct') ? 'Retroalimentación: respuesta correcta' : k.startsWith('wrong') ? 'Retroalimentación: respuesta incorrecta' : k.startsWith('motivation') ? 'Mensajes motivacionales' : k.startsWith('warning') ? 'Alertas y advertencias' : 'Generales', k, t));
Object.keys(A.levels).forEach((n) => { const v = A.levels[n].voice; group('Nivel ' + n + ' · ' + A.levels[n].name, `lvl${n}_intro`, v.intro); group('Nivel ' + n + ' · ' + A.levels[n].name, `lvl${n}_challenge`, v.challenge); group('Nivel ' + n + ' · ' + A.levels[n].name, `lvl${n}_done`, v.done); });
let md = '# Guiones de voz de Nova\n\n_Español latinoamericano neutro · tono cálido, claro y profesional · ritmo medio._\n\nGenerado por `tools/build-voice-docs.js`. Cada `id` corresponde al archivo `assets/audio/<id>.mp3` que la app reproduce si activas `AIQ.audio.cfg.useAudioFiles = true`.\n\n';
let cur = ''; rows.forEach((r) => { if (r.group !== cur) { cur = r.group; md += `\n## ${cur}\n\n| id | guion |\n|---|---|\n`; } md += `| \`${r.id}\` | ${r.text.replace(/\|/g, '/')} |\n`; });
md += `\n---\nTotal: **${rows.length} líneas** · ${rows.reduce((a, r) => a + r.text.length, 0)} caracteres.\n`;
fs.writeFileSync(path.join(__dirname, '../docs/voice-scripts.md'), md);
fs.writeFileSync(path.join(__dirname, '../assets/audio/manifest.json'), JSON.stringify({ language: 'es-419', voice: 'Nova (pendiente de producir)', generated: false, note: 'Aún no hay archivos .mp3: la app usa la voz del navegador (SpeechSynthesis). Ver docs/AUDIO.md.', lines: rows.map((r) => ({ id: r.id, file: r.id + '.mp3', text: r.text })) }, null, 2));
console.log(rows.length + ' líneas escritas');
