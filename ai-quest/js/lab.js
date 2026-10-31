/* Laboratorio de prompts (sandbox libre) + analizador de prompts reutilizable. */
(function () {
  const A = window.AIQ, { h, esc } = A.ui;

  const COMPS = [
    { id: 'rol', label: 'Rol', re: /(act[úu]a como|eres (un|una)|desempe[ñn]a el rol|rol:|como (un|una) (experto|especialista|analista|coach|tutor|consultor|dise[ñn]ador|instructor))/i, tip: 'Indica quién debe ser la IA: «Actúa como analista de capacitación…».' },
    { id: 'contexto', label: 'Contexto', re: /(contexto|situaci[oó]n|antecedentes|trabajo en|nuestra (empresa|[aá]rea|equipo)|somos|dado que|el p[uú]blico|los clientes|equipo de|colaboradores|empresa)/i, tip: 'Cuenta la situación, el público y los datos de partida que la IA no puede adivinar.' },
    { id: 'objetivo', label: 'Objetivo', re: /(objetivo|meta|con el fin|para (que|lograr|poder|convencer|informar|reducir|aumentar)|busco|necesito (que|lograr))/i, tip: 'Explica para qué lo necesitas: el objetivo orienta las decisiones de la IA.' },
    { id: 'tarea', label: 'Tarea', re: /(redacta|resume|clasifica|extrae|genera|crea|analiza|compara|traduce|explica|dise[ñn]a|elabora|escribe|lista|identifica|eval[úu]a|propón|prop[oó]n|mejora|reescribe)/i, tip: 'Usa un verbo de acción claro: redacta, clasifica, compara…' },
    { id: 'restricciones', label: 'Restricciones', re: /(no (uses|incluyas|menciones|inventes|superes|excedas|debe)|evita|sin [a-záéíóú]+|m[aá]ximo|m[ií]nimo|no m[aá]s de|l[ií]mite|[uú]nicamente|solo (usa|con|si)|nunca)/i, tip: 'Di qué debe evitar o qué límites respetar (longitud, tono, datos que no puede inventar).' },
    { id: 'formato', label: 'Formato', re: /(formato|en (una )?(tabla|lista|json|vi[ñn]etas|p[aá]rrafos?)|tabla|json|vi[ñn]etas|bullets|\d+\s*(palabras|p[aá]rrafos|puntos|l[ií]neas|ideas|pasos|opciones|semanas|frases)|t[ií]tulo|encabezado|markdown)/i, tip: 'Define cómo quieres la salida: tabla, JSON, viñetas, número de palabras…' },
    { id: 'ejemplos', label: 'Ejemplos', re: /(ejemplo|por ejemplo|entrada:|salida:|como en|modelo de respuesta|referencia:)/i, tip: 'Un ejemplo de entrada/salida ancla el estilo y reduce ambigüedades (one-shot / few-shot).' },
    { id: 'criterios', label: 'Criterios de calidad', re: /(criterios?|debe cumplir|aseg[uú]rate|verifica|calidad|se evaluar[aá]|[eé]xito|checklist|antes de responder|si no (tienes|sabes)|indica (tu )?nivel de (confianza|certeza)|cita)/i, tip: 'Dile cómo juzgarás la respuesta o qué verificar antes de entregar.' },
  ];
  const VAGUE = /\b(algo|cosas|etc\.?|lo que sea|como sea|bonito|bien|mejor posible|mejora esto|hazlo)\b/i;
  function analyze(text) {
    const t = String(text || ''), found = {}; let n = 0;
    COMPS.forEach((c) => { found[c.id] = c.re.test(t); if (found[c.id]) n++; });
    const words = A.util.words(t), warns = [];
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) warns.push('Contiene un correo electrónico: ¿es dato personal? Anonimízalo.');
    if (/\b\d{7,}\b/.test(t)) warns.push('Contiene una secuencia larga de números (¿documento, teléfono, cuenta?). No compartas datos sensibles.');
    if (/contrase[ñn]a|password|api[_ -]?key|token secreto/i.test(t)) warns.push('Menciona credenciales: nunca pegues contraseñas ni claves en un prompt.');
    if (VAGUE.test(t)) warns.push('Hay palabras vagas («algo», «cosas», «etc.»…): sustitúyelas por criterios concretos.');
    if (words && words < 12) warns.push('Es muy corto: probablemente le falta contexto.');
    const score = Math.round((n / COMPS.length) * 100);
    return { found, count: n, score, words, tokens: Math.ceil(t.length / 4), warns };
  }
  A.prompt = { COMPS, analyze };

  const TEMPLATES = {
    'Plan de capacitación': 'Actúa como diseñador instruccional senior. Contexto: trabajo en el área comercial de una empresa de 200 personas sin conocimientos técnicos. Objetivo: reducir incidentes de phishing. Diseña un plan de 4 semanas (3 horas por semana). Restricciones: no uses jerga técnica y no inventes estadísticas. Formato: tabla con semana, tema, actividad y evidencia. Criterios de calidad: cada semana debe tener una evaluación práctica; verifica que el total no supere 12 horas.',
    'Clasificar tickets (few-shot)': 'Clasifica el ticket en: facturación, acceso o error técnico. Ejemplo de entrada: "No puedo entrar a mi cuenta" → salida: {"categoria":"acceso"}. Ejemplo de entrada: "Me cobraron dos veces" → salida: {"categoria":"facturacion"}. Ahora clasifica el siguiente. Formato: solo JSON, sin texto adicional.',
    'Prompt vago (para mejorar)': 'Hazme algo bonito para capacitar a la gente, etc.',
  };

  function promptLab() {
    const root = h('div', { class: 'act promptlab' }); const st = A.store.get();
    const ta = h('textarea', { rows: 9, 'aria-label': 'Prompt A', placeholder: 'Escribe o pega aquí tu prompt…' }), tb = h('textarea', { rows: 9, 'aria-label': 'Prompt B', placeholder: 'Versión B (opcional) para comparar…' });
    const ra = h('div'), rb = h('div'), log = h('div'), real = h('div');
    const tpl = h('select', { 'aria-label': 'Plantillas', onchange: (e) => { if (e.target.value) { ta.value = TEMPLATES[e.target.value]; upd(); } } }, h('option', { value: '' }, 'Cargar una plantilla…'), Object.keys(TEMPLATES).map((k) => h('option', null, k)));
    const temp = h('input', { type: 'range', min: 0, max: 1, step: .1, value: .3, 'aria-label': 'Temperatura', oninput: () => tdesc() }), td = h('p', { class: 'muted small' });
    const tdesc = () => { const v = +temp.value; td.innerHTML = `<b>Temperatura ${v}:</b> ` + (v <= .3 ? 'respuestas más consistentes y predecibles: ideal para extraer datos, clasificar o responder políticas.' : v <= .7 ? 'equilibrio entre consistencia y variedad.' : 'respuestas más variadas y creativas: útil para lluvia de ideas, pero con más riesgo de divagar.') + ' <span class="muted">(Algunos modelos recientes fijan o limitan este parámetro: consulta la documentación de tu proveedor.)</span>'; }; tdesc();
    function view(t, box, name) {
      const a = analyze(t.value); box.innerHTML = '';
      box.append(h('div', { class: 'meter' }, h('b', null, name), A.ui.bar(a.score), h('b', null, a.score + '%')), h('p', { class: 'muted small' }, `${a.words} palabras · ≈${a.tokens} tokens (estimación: caracteres ÷ 4)`),
        h('ul', { class: 'rl' }, COMPS.map((c) => h('li', { class: a.found[c.id] ? 'ok' : 'no' }, h('span', { class: 'i' }, a.found[c.id] ? '✓' : '○'), h('div', null, c.label, !a.found[c.id] ? h('small', null, c.tip) : null)))),
        a.warns.length ? h('div', { class: 'callout warn', html: a.warns.map((w) => '⚠ ' + esc(w)).join('<br>') }) : null);
      return a;
    }
    function upd() { view(ta, ra, 'Prompt A'); if (tb.value.trim()) view(tb, rb, 'Prompt B'); else rb.innerHTML = ''; }
    ta.addEventListener('input', upd); tb.addEventListener('input', upd);
    function saveLog() { const t = ta.value.trim(); if (!t) return; const a = analyze(t); st.labLog.unshift({ ts: Date.now(), text: t, score: a.score }); st.labLog = st.labLog.slice(0, 30); st.stats.labRuns++; A.store.save(); A.audio.sfx('correct'); if (st.stats.labRuns >= 5) A.store.grant('experimenter', 'Experimentador', '🧪'); drawLog(); }
    function drawLog() { log.innerHTML = ''; log.append(h('div', { class: 'lbl' }, 'Bitácora de experimentos (guardada en tu navegador)'), st.labLog.length ? h('ul', { class: 'rl' }, st.labLog.slice(0, 8).map((l) => h('li', null, h('span', { class: 'i' }, l.score + '%'), h('div', null, new Date(l.ts).toLocaleString(), h('small', null, l.text.slice(0, 110) + (l.text.length > 110 ? '…' : '')), h('button', { class: 'btn sm', type: 'button', onclick: () => { ta.value = l.text; upd(); } }, 'Cargar en A'))))) : h('p', { class: 'muted small' }, 'Aún no hay versiones guardadas.')); }
    // Integración opcional con un modelo real (la clave solo vive en memoria)
    const key = h('input', { type: 'password', placeholder: 'API key (solo en memoria)', autocomplete: 'off', 'aria-label': 'API key' }), model = h('input', { type: 'text', value: 'claude-haiku-5-5', 'aria-label': 'Modelo' }), res = h('pre', null, 'Sin respuesta aún.');
    real.append(h('details', { class: 'card', style: 'margin-top:14px' }, h('summary', null, h('b', null, '🔌 Conectar un modelo real (opcional, avanzado)')),
      h('div', { class: 'callout warn', html: '<b>Úsalo solo con una clave de pruebas con límite de gasto.</b> La clave se mantiene en memoria y se envía directamente desde tu navegador a <code>api.anthropic.com</code>; no la guardamos. En producción las claves nunca van en el navegador: se usa un backend. <i>Integración incluida pero no probada en este entorno (no había clave disponible).</i>' }),
      h('div', { class: 'grid g2' }, key, model), h('button', { class: 'btn pri', type: 'button', style: 'margin:10px 0', onclick: async () => {
        if (!key.value || !ta.value.trim()) { res.textContent = 'Escribe un prompt en A y una API key.'; return; } res.textContent = 'Enviando…';
        try { const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key.value, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: model.value, max_tokens: 800, messages: [{ role: 'user', content: ta.value }] }) }); const j = await r.json(); res.textContent = r.ok ? (j.content || []).map((c) => c.text || '').join('') + '\n\n— uso: ' + JSON.stringify(j.usage) : 'HTTP ' + r.status + ': ' + JSON.stringify(j.error || j); } catch (e) { res.textContent = 'Error de red/CORS: ' + e.message; }
      } }, 'Enviar prompt A al modelo'), res));
    root.append(h('div', { class: 'callout simbox', html: '<b>Cómo funciona este laboratorio.</b> Analiza la <i>estructura</i> de tu prompt con reglas locales (no es un modelo de IA): te dice qué componentes tiene y cuáles faltan. Úsalo para iterar y comparar versiones A/B. Para ver respuestas reales conecta un modelo (opcional, abajo).' }),
      h('div', { class: 'row', style: 'margin:10px 0' }, h('div', { class: 'sp' }, tpl), h('button', { class: 'btn pri', type: 'button', onclick: saveLog }, '💾 Guardar versión A')),
      h('div', { class: 'grid g2' }, h('div', null, h('div', { class: 'lbl' }, 'Versión A'), ta, ra), h('div', null, h('div', { class: 'lbl' }, 'Versión B (comparar)'), tb, rb)),
      h('div', { class: 'card', style: 'margin-top:14px' }, h('div', { class: 'lbl' }, 'Experimento de parámetros'), temp, td), log, real);
    drawLog(); upd(); return root;
  }
  A.lab = { promptLab };
})();
