/* Comprobaciones de integridad del contenido y de las rúbricas (Node). Uso: node tools/check-content.js */
const path = require('path');
const A = require('../js/core/util.js');
require('../js/core/voice.js'); require('../js/levels/extra.js');
// El analizador de prompts vive en lab.js (usa DOM); lo reemplazamos por un stub mínimo para las plantillas.
A.prompt = { analyze: () => ({ score: 0 }) };
for (let i = 1; i <= 10; i++) require(`../js/levels/level${String(i).padStart(2, '0')}.js`);
let problems = 0; const bad = (m) => { problems++; console.log('✗', m); };
const ids = new Set();
for (const n of Object.keys(A.levels)) {
  const L = A.levels[n];
  ['name','subtitle','objective','narrative','voice','concept','example','practice','challenge','mastery','badge'].forEach((k) => { if (!L[k]) bad(`L${n} falta ${k}`); });
  ['intro','challenge','done'].forEach((k) => { if (!L.voice[k]) bad(`L${n} voz.${k}`); });
  [...L.practice, L.challenge].forEach((a) => {
    if (ids.has(a.id)) bad('id duplicado ' + a.id); ids.add(a.id);
    if (!a.title || !a.goal || !a.xp) bad(`${a.id} sin title/goal/xp`);
    if (!['mcq','classify','match','order','flashcards','slider','branch','hotspot','explorer','diagram','pipeline','designer','apisim','jsonexplorer','mcpsim'].includes(a.type)) bad(a.id + ' tipo ' + a.type);
  });
  const need = Math.ceil(0.8 * L.mastery.length); console.log(`L${n}: mastery ${L.mastery.length} preguntas (aciertos mínimos ${need}), práctica ${L.practice.length}`);
  L.mastery.forEach((q, i) => { const a = Array.isArray(q.a) ? q.a : [q.a]; if (!a.every((x) => x >= 0 && x < q.o.length)) bad(`L${n} mastery ${i} respuesta fuera de rango`); if (!q.e) bad(`L${n} mastery ${i} sin explicación`); });
  [...L.practice, L.challenge].filter((a) => a.type === 'classify').forEach((a) => a.items.forEach((it) => { if (!a.categories.some((c) => c.id === it.cat)) bad(`${a.id}: item con categoría inexistente ${it.cat}`); }));
  [...L.practice, L.challenge].filter((a) => a.type === 'branch').forEach((a) => Object.values(a.scenes).forEach((s) => (s.choices || []).forEach((c) => { if (!a.scenes[c.next]) bad(a.id + ' next inexistente ' + c.next); })));
}
// Rúbricas con muestra: la muestra de referencia debe superar el umbral
function rate(act, v, vid) { const rules = act.rules || (act.variants.find((x) => x.id === vid)).rules; const tot = rules.reduce((a, r) => a + (r.w || 1), 0); const ok = rules.filter((r) => { try { return r.check(v, vid); } catch (e) { return false; } }); return { pct: Math.round(ok.reduce((a, r) => a + (r.w || 1), 0) / tot * 100), fails: rules.filter((r) => !ok.includes(r)).map((r) => r.label) }; }
const t = (id, v, vid) => { const act = [].concat(...Object.values(A.levels).map((L) => L.practice.concat(L.challenge))).find((a) => a.id === id); const r = rate(act, v, vid); console.log(`${r.pct >= 80 ? '✓' : '✗'} ${id}${vid ? ':' + vid : ''} muestra → ${r.pct}%`, r.fails.length ? r.fails : ''); if (r.pct < 80) problems++; };
const smp = (id) => [].concat(...Object.values(A.levels).map((L) => L.practice.concat(L.challenge))).find((a) => a.id === id).sample;
t('l2-sim', { p: smp('l2-sim') }); t('l3-ch', { p: smp('l3-ch') });
t('l2-ch', { a: 'Redacta un correo cordial para un cliente, con asunto, para confirmar que su pedido llegará el viernes (máx. 100 palabras).', b: 'Resume el texto delimitado por ### en 5 viñetas para la gerente comercial. ### [texto] ###', c: 'Dame 10 ideas de marketing para nuestro curso dirigido a pymes, en una tabla, con presupuesto bajo.', d: 'Mejora la claridad y concisión de mi texto para un cliente; mantén mi tono y los datos.', e: 'Explícame la IA como a un gerente sin conocimientos técnicos, en 3 párrafos y con una analogía.' });
t('l8-ch', { m: 'POST', u: 'https://api.ejemplo-ia.test/v1/messages', h: 'Authorization: Bearer ${API_KEY}\nContent-Type: application/json', b: '{"model":"demo-llm","max_tokens":200,"messages":[{"role":"user","content":"¿Cuántas horas dura SEG-101?"}]}', s: 'Variable de entorno en el backend; nunca en el código ni en el navegador.' });
t('l9-ch', { host: 'mcp', m1: 'resource', m2: 'prompt', m3: 'tool', m4: 'resource', tr: 'http', au: 'oauth', sg: ['appr','ro','log','val'], why: 'MCP es un estándar reutilizable: en vez de integraciones a medida (N×M) cada sistema expone un servidor y varias aplicaciones pueden descubrir y usar sus capacidades. Cuidado: exige seguridad, aprobación humana y servidores de confianza.' });
t('l7-ch', { goal: 'Tramitar solicitudes de capacitación de líderes: consultar catálogo y cupos, proponer un plan y, tras aprobación, inscribir al equipo.', tools: ['cat','cup','enroll'], mem: '0', aut: '2', limits: ['approve','log','scope','steps','escal','pii'], metric: 'Precisión: 95% de inscripciones correctas; seguridad: 0 acciones sin aprobación.', sup: 'El responsable de capacitación revisa el log semanalmente y recibe alertas.' });
const long = (s) => s;
t('l10-ch', { dec: 'mcp', prob: 'El equipo de capacitación de 500 personas pierde horas buscando documentación y gestionando inscripciones manualmente; queremos respuestas fiables y acciones autorizadas.', just: 'Usamos MCP como capa estándar y reutilizable porque otras apps de IA necesitarán las mismas fuentes; un prompt no puede actuar, un workflow es rígido y un agente por sí solo no resuelve la conexión.', arch: 'Host corporativo con clientes MCP; servidor kb con resources y prompts; servidor lms con tools; transporte Streamable HTTP con OAuth y scopes.', sec: 'Aprobación humana para escrituras, mínimo privilegio con scopes, solo lectura en la KB, registro y auditoría, protección de datos personales e inyección en documentos.', qual: 'Precisión de respuestas ≥ 95% con citas de fuentes; 0 inscripciones sin aprobación; respuesta en menos de 10 segundos.', risk: 'Riesgo de inyección y fuga de datos: mitigación con revisión y plan de monitoreo. Alternativa descartada: integración directa por app; no se automatiza el despido ni decisiones disciplinarias.', pres: 'Proponemos un asistente de capacitación basado en MCP que consulta la base de conocimiento como resources, ofrece plantillas como prompts y ejecuta inscripciones como tools con aprobación humana y permisos mínimos, reduciendo tiempos y errores con trazabilidad completa.' }, 'A');
console.log(problems ? `\n${problems} problema(s)` : '\nContenido OK'); process.exit(problems ? 1 : 0);
