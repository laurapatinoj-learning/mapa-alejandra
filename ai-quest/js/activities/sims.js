/* Simuladores: apisim (API REST simulada), jsonexplorer, mcpsim (ciclo MCP simulado).
   IMPORTANTE: todo se ejecuta localmente en el navegador; no se envía ninguna petición real. */
(function () {
  const A = window.AIQ, { h, esc } = A.ui;
  const fb = (ok, html) => h('div', { class: 'fb ' + (ok === null ? 'info' : ok ? 'ok' : 'bad'), role: 'status', html });
  const sfx = (n) => A.audio.sfx(n);
  const pretty = (o) => JSON.stringify(o, null, 2);
  const simBanner = (t) => h('div', { class: 'callout simbox', html: '<b>🧪 Simulación local.</b> ' + t });

  /* =============== API simulada =============== */
  function mockServer(m, u, hdText, bodyText, scn) {
    const R = (status, body, hd) => ({ status, body, hd: hd || {} });
    if (scn === '500') return R(500, { type: 'error', error: { type: 'api_error', message: 'Error interno del servidor (simulado). Reintenta con espera exponencial.' } });
    if (scn === '429') return R(429, { type: 'error', error: { type: 'rate_limit_error', message: 'Demasiadas solicitudes (simulado).' } }, { 'retry-after': '20' });
    let url; try { url = new URL(u); } catch (e) { return R(0, { error: 'URL inválida: ' + u }); }
    if (url.host !== 'api.ejemplo-ia.test') return R(0, { error: 'No se pudo resolver el host «' + url.host + '». Esta simulación solo conoce api.ejemplo-ia.test' });
    if (url.pathname !== '/v1/messages') return R(404, { type: 'error', error: { type: 'not_found_error', message: 'Ruta no encontrada: ' + url.pathname } });
    if (m !== 'POST') return R(405, { type: 'error', error: { type: 'invalid_request_error', message: 'Método ' + m + ' no permitido en este endpoint.' } }, { allow: 'POST' });
    const hd = {}; hdText.split('\n').forEach((l) => { const i = l.indexOf(':'); if (i > 0) hd[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); });
    const key = hd['x-api-key'] || (hd.authorization || '').replace(/^Bearer\s+/i, '');
    if (!key) return R(401, { type: 'error', error: { type: 'authentication_error', message: 'Falta la credencial. Envía tu API key en el encabezado «Authorization: Bearer <clave>» o «x-api-key».' } });
    if (key !== 'demo-key-123') return R(401, { type: 'error', error: { type: 'authentication_error', message: 'La API key no es válida.' } });
    if (!/application\/json/i.test(hd['content-type'] || '')) return R(415, { type: 'error', error: { type: 'invalid_request_error', message: 'Content-Type debe ser application/json.' } });
    let b; try { b = JSON.parse(bodyText); } catch (e) { return R(400, { type: 'error', error: { type: 'invalid_request_error', message: 'El cuerpo no es JSON válido: ' + e.message } }); }
    const bad = (msg) => R(400, { type: 'error', error: { type: 'invalid_request_error', message: msg } });
    if (!b.model) return bad('model: campo obligatorio.');
    if (b.model !== 'demo-llm') return R(404, { type: 'error', error: { type: 'not_found_error', message: 'model: «' + b.model + '» no existe. Usa «demo-llm».' } });
    if (!Array.isArray(b.messages) || !b.messages.length) return bad('messages: debe ser una lista con al menos un mensaje.');
    for (const x of b.messages) if (!x || !['user', 'assistant'].includes(x.role) || typeof x.content !== 'string' || !x.content.trim()) return bad('messages: cada mensaje necesita «role» (user|assistant) y «content» (texto).');
    if (!Number.isInteger(b.max_tokens) || b.max_tokens <= 0) return bad('max_tokens: campo obligatorio (entero mayor que 0).');
    if (b.max_tokens > 4096) return bad('max_tokens: el máximo de esta API de práctica es 4096.');
    const last = b.messages[b.messages.length - 1].content, txt = 'Respuesta simulada de «demo-llm» a: «' + last.slice(0, 80) + (last.length > 80 ? '…' : '') + '». (Plantilla local: no proviene de un modelo real.)';
    const inT = Math.ceil(b.messages.reduce((a, x) => a + x.content.length, 0) / 4);
    return R(200, { id: 'msg_demo_01', type: 'message', role: 'assistant', model: 'demo-llm', content: [{ type: 'text', text: txt }], stop_reason: 'end_turn', usage: { input_tokens: inT, output_tokens: Math.ceil(txt.length / 4) } });
  }
  A.mockServer = mockServer;

  A.act.apisim = function (cfg, ctx) {
    const root = h('div', { class: 'act apisim' }), st = { e401: false, e400: false, ok: false, usage: null, ans: false };
    const method = h('select', { 'aria-label': 'Método HTTP' }, ['GET', 'POST', 'PUT', 'DELETE'].map((m) => h('option', { selected: m === 'POST' }, m)));
    const url = h('input', { type: 'text', value: 'https://api.ejemplo-ia.test/v1/messages', 'aria-label': 'URL del endpoint' });
    const hdr = h('textarea', { rows: 3, 'aria-label': 'Encabezados' }, 'Content-Type: application/json');
    const body = h('textarea', { rows: 9, class: 'mono', 'aria-label': 'Cuerpo JSON' }, pretty({ model: 'demo-llm', max_tokens: 256, messages: [{ role: 'user', content: 'Resume en una frase qué es una API.' }] }));
    const scn = h('select', { 'aria-label': 'Escenario del servidor' }, h('option', { value: '' }, 'Servidor normal'), h('option', { value: '500' }, 'Simular fallo 500'), h('option', { value: '429' }, 'Simular límite de tasa 429'));
    const resp = h('div', { class: 'term', style: 'height:auto;min-height:200px' }, h('span', { class: 'muted' }, 'La respuesta aparecerá aquí…'));
    const tasks = h('div'), ansBox = h('div');
    const T = () => [['Provoca un 401 enviando la petición sin credencial', st.e401], ['Provoca un 400 (quita max_tokens o rompe el JSON)', st.e400], ['Consigue un 200 corrigiendo credencial, encabezados y cuerpo', st.ok], ['Interpreta la respuesta (campos y tokens)', st.ans]];
    function drawTasks() { if (cfg.free) return; tasks.innerHTML = ''; tasks.append(h('div', { class: 'lbl' }, 'Misión'), T().map(([t, d]) => h('div', { class: 'task' + (d ? ' on' : '') }, d ? '✓' : '○', t))); if (T().every((x) => x[1])) ctx.report(100); }
    function send() {
      const r = mockServer(method.value, url.value.trim(), hdr.value, body.value, scn.value); sfx('click');
      if (r.status === 401) st.e401 = true; if (r.status === 400) st.e400 = true; if (r.status === 200) { st.ok = true; st.usage = r.body.usage.input_tokens; showQ(); }
      const cls = r.status >= 500 ? 's5' : r.status >= 400 || r.status === 0 ? (r.status === 0 ? 's5' : 's4') : 's2';
      resp.innerHTML = ''; resp.append(h('div', null, h('span', { class: 'status ' + cls }, r.status === 0 ? 'Error de red' : 'HTTP ' + r.status)), Object.keys(r.hd).length ? h('pre', null, Object.entries(r.hd).map(([k, v]) => k + ': ' + v).join('\n')) : null, h('pre', null, pretty(r.body)));
      r.status === 200 ? sfx('correct') : sfx('warn'); if (!cfg.free) { A.store.get().stats.labRuns++; A.store.save(); } drawTasks();
    }
    function showQ() {
      if (cfg.free || ansBox.childNodes.length) return;
      const sel = h('select', { 'aria-label': 'Campo con el texto' }, h('option', { value: '' }, '— elige —'), ['content[0].text', 'message', 'choices[0].text', 'id'].map((o) => h('option', null, o)));
      const num = h('input', { type: 'number', placeholder: 'input_tokens', 'aria-label': 'Tokens de entrada' }); const o = h('div');
      ansBox.append(h('div', { class: 'card', style: 'margin-top:12px' }, h('h3', null, 'Interpreta tu respuesta 200'), h('div', { class: 'fld' }, h('label', { class: 'fl' }, '¿En qué campo viene el texto generado?'), sel), h('div', { class: 'fld' }, h('label', { class: 'fl' }, '¿Cuántos tokens de entrada reportó el uso (usage.input_tokens)?'), num),
        h('button', { class: 'btn pri', type: 'button', onclick: () => { const ok = sel.value === 'content[0].text' && +num.value === st.usage; o.innerHTML = ''; o.append(fb(ok, ok ? '<b>Correcto.</b> El texto está en <code>content[0].text</code> y <code>usage</code> informa los tokens de entrada y salida, que determinan el costo y el límite de contexto.' : 'Revisa el JSON de tu última respuesta 200: busca el arreglo <code>content</code> y el objeto <code>usage</code>.')); if (ok) { st.ans = true; sfx('correct'); drawTasks(); } else sfx('wrong'); } }, 'Comprobar'), o));
    }
    root.append(simBanner('No se envía ninguna petición real: un servidor ficticio (<code>api.ejemplo-ia.test</code>) responde desde tu navegador. Clave de práctica ficticia: <code>demo-key-123</code>.'),
      h('div', { class: 'sim' }, h('div', null, h('div', { class: 'lbl' }, 'Solicitud'), h('div', { class: 'row' }, h('div', { style: 'width:110px' }, method), h('div', { class: 'sp' }, url)),
        h('div', { class: 'fld', style: 'margin-top:8px' }, h('label', { class: 'fl' }, 'Encabezados (uno por línea)'), hdr), h('div', { class: 'fld' }, h('label', { class: 'fl' }, 'Cuerpo (JSON)'), body), h('div', { class: 'fld' }, h('label', { class: 'fl' }, 'Estado del servidor'), scn),
        h('button', { class: 'btn pri', type: 'button', onclick: send }, 'Enviar solicitud ▶')), h('div', null, h('div', { class: 'lbl' }, 'Respuesta'), resp)), tasks, ansBox);
    drawTasks(); return root;
  };

  /* =============== Explorador de JSON =============== */
  A.act.jsonexplorer = function (cfg, ctx) {
    const root = h('div', { class: 'act jsonx' }); let qi = 0, wrong = 0;
    const qBox = h('div', { class: 'callout' }), out = h('div'), tree = h('div', { class: 'term jt', style: 'height:auto;max-height:440px' });
    function walk(v, path, parent) {
      const wrap = h('div');
      if (v && typeof v === 'object') {
        const arr = Array.isArray(v); wrap.append(arr ? '[' : '{');
        Object.keys(v).forEach((k) => {
          const p = arr ? path + '[' + k + ']' : (path ? path + '.' : '') + k;
          const line = h('div', { class: 'kid' }); const kEl = h('span', { class: 'k', role: 'button', tabindex: 0, onclick: () => pick(p, v[k]), onkeydown: (e) => { if (e.key === 'Enter') pick(p, v[k]); } }, arr ? '[' + k + ']' : '"' + k + '"');
          line.append(kEl, ': '); const c = walk(v[k], p); line.append(c); wrap.append(line);
        });
        wrap.append(arr ? ']' : '}');
      } else wrap.append(h('span', { style: 'color:#fca5a5' }, JSON.stringify(v)));
      return wrap;
    }
    function ask() { qBox.innerHTML = `<b>Pregunta ${qi + 1} de ${cfg.questions.length}:</b> ${cfg.questions[qi].q}<br><span class="muted small">Haz clic en la clave (o el índice) que contiene ese dato.</span>`; }
    function pick(p, val) {
      if (qi >= cfg.questions.length) return; const q = cfg.questions[qi]; out.innerHTML = '';
      if (p === q.path) { sfx('correct'); qi++; out.append(fb(true, `<b>Correcto:</b> <code>${esc(p)}</code>. ${q.e || ''}`)); if (qi >= cfg.questions.length) { const sc = Math.round(cfg.questions.length / (cfg.questions.length + wrong) * 100); qBox.innerHTML = `<b>Terminaste.</b> Errores: ${wrong}.`; ctx.report(sc); if (sc < ctx.pass) out.append(h('button', { class: 'btn pri', type: 'button', onclick: () => { qi = 0; wrong = 0; out.innerHTML = ''; ask(); } }, 'Reintentar')); } else ask(); }
      else { wrong++; sfx('wrong'); out.append(fb(false, `Elegiste <code>${esc(p)}</code> (${Array.isArray(val) ? 'una lista' : typeof val === 'object' ? 'un objeto' : 'un valor: ' + esc(JSON.stringify(val))}). No es el dato pedido. Recuerda que la ruta se lee de afuera hacia adentro.`)); }
    }
    tree.append(walk(cfg.json, '')); ask(); root.append(qBox, tree, out); return root;
  };

  /* =============== Simulador MCP =============== */
  const HOSTS = [
    { id: 'desktop', name: 'Asistente de escritorio con IA', ok: true, d: 'App de chat en tu equipo con cliente MCP integrado.' },
    { id: 'ide', name: 'IDE con asistente de código', ok: true, d: 'Editor con agente; incluye clientes MCP.' },
    { id: 'corp', name: 'App corporativa de capacitación (host propio)', ok: true, d: 'Tu propia aplicación que implementa clientes MCP con un SDK.' },
    { id: 'web', name: 'Chatbot web básico', ok: false, d: 'Solo conversa; no incluye cliente MCP.' },
  ];
  const SERVERS = {
    kb: { name: 'kb-capacitacion', label: 'Base de conocimiento de capacitación', transport: 'http', scopeReq: 'kb:read', caps: { resources: { subscribe: false, listChanged: false }, prompts: { listChanged: false } },
      resources: [{ uri: 'kb://manuales/onboarding.md', name: 'Manual de onboarding', mimeType: 'text/markdown', text: '# Onboarding\n1. Semana 1: seguridad de la información (3 h).\n2. Semana 2: herramientas internas.\n3. Semana 3: mentoría con tu líder.' }, { uri: 'kb://politicas/certificaciones.md', name: 'Política de certificaciones', mimeType: 'text/markdown', text: '# Certificaciones\nCada colaborador puede inscribirse en 2 certificaciones por año con aprobación de su líder.' }],
      prompts: [{ name: 'plan_capacitacion', description: 'Plantilla para generar un plan de capacitación', arguments: [{ name: 'area', required: true }] }] },
    lms: { name: 'lms-cursos', label: 'LMS: catálogo e inscripciones', transport: 'http', caps: { tools: { listChanged: false } },
      tools: [{ name: 'buscar_cursos', description: 'Busca cursos del catálogo por tema (solo lectura)', scope: 'lms:read', write: false, inputSchema: { type: 'object', properties: { tema: { type: 'string' } }, required: ['tema'] }, sample: { tema: 'seguridad' }, run: (a) => 'Cursos para «' + a.tema + '»: SEG-101 Fundamentos de seguridad (3 h), SEG-201 Phishing en la práctica (2 h).' },
        { name: 'inscribir_colaborador', description: 'Inscribe a un colaborador en un curso (ESCRITURA)', scope: 'lms:write', write: true, inputSchema: { type: 'object', properties: { colaborador_id: { type: 'string' }, curso_id: { type: 'string' } }, required: ['colaborador_id', 'curso_id'] }, sample: { colaborador_id: 'C-1042', curso_id: 'SEG-101' }, run: (a) => 'Inscripción registrada: ' + a.colaborador_id + ' → ' + a.curso_id + '. Se notificó al líder.' }] },
    erp: { name: 'erp-legado', label: 'ERP heredado (fuera de línea)', transport: 'http', offline: true, caps: { tools: {} }, tools: [] },
  };
  const SCOPES = ['kb:read', 'lms:read', 'lms:write'];
  const ERRQ = [
    { q: '<b>Caso 1.</b> El cliente se conecta y envía enseguida:<pre>{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"buscar_cursos","arguments":{"tema":"seguridad"}}}</pre>Respuesta: <pre>{"jsonrpc":"2.0","id":1,"error":{"code":-32600,"message":"Servidor no inicializado"}}</pre>¿Qué falló?', o: ['Se omitió el ciclo de inicialización (initialize → notifications/initialized)', 'La API key del modelo de lenguaje expiró', 'El servidor no tiene herramientas', 'El host no soporta JSON'], a: 0, e: 'Antes de cualquier operación el cliente debe negociar versión y capacidades con <code>initialize</code> y confirmar con <code>notifications/initialized</code>. (El código de error exacto de este caso es ilustrativo de la simulación.)' },
    { q: '<b>Caso 2.</b> Respuesta HTTP del servidor remoto al intentar inscribir:<pre>HTTP/1.1 403 Forbidden\nWWW-Authenticate: Bearer error="insufficient_scope", scope="lms:write"</pre>', o: ['El token no incluye el scope necesario: hay que reautorizar con el alcance mínimo requerido', 'El servidor está caído', 'El JSON de los argumentos está mal formado', 'El host no tiene cliente MCP'], a: 0, e: 'Autenticaste (el servidor te reconoce) pero no estás <b>autorizado</b> para esa acción. Se soluciona pidiendo el scope necesario, no ampliando permisos «por si acaso».' },
    { q: '<b>Caso 3.</b> Al conectar con <code>erp-legado</code>: <pre>Error: connection timed out after 30000 ms</pre>', o: ['El servidor no está disponible o no es alcanzable: verificar que esté en ejecución y la ruta de transporte', 'La herramienta devolvió isError: true', 'Falta el campo inputSchema', 'El modelo alucinó'], a: 0, e: 'Es un problema de <b>conexión/transporte</b>, anterior al protocolo: ni siquiera hubo mensajes JSON-RPC.' },
    { q: '<b>Caso 4.</b> Respuesta a un <code>tools/call</code>:<pre>{"jsonrpc":"2.0","id":7,"result":{"content":[{"type":"text","text":"Curso lleno"}],"isError":true}}</pre>', o: ['La llamada llegó y se ejecutó, pero la herramienta reportó un error de negocio (no es un error de protocolo)', 'El mensaje JSON-RPC es inválido', 'Falló la negociación de capacidades', 'El token expiró'], a: 0, e: 'En MCP los errores de ejecución de una herramienta se devuelven dentro del <code>result</code> con <code>isError: true</code>, para que el modelo pueda leerlos y reaccionar; los errores de protocolo usan <code>error</code> JSON-RPC.' },
    { q: '<b>Caso 5.</b> El cliente pide <code>prompts/list</code> a <code>lms-cursos</code>:<pre>{"jsonrpc":"2.0","id":4,"error":{"code":-32601,"message":"Method not found"}}</pre>', o: ['El servidor no declaró la capacidad «prompts» en la inicialización', 'El token no tiene permisos', 'El servidor está fuera de línea', 'El host rechazó la herramienta'], a: 0, e: 'Las capacidades negociadas definen qué puede usarse. <code>lms-cursos</code> solo declaró <code>tools</code>.' },
  ];

  A.act.mcpsim = function (cfg, ctx) {
    const root = h('div', { class: 'act mcpsim' });
    const G = { host: null, readOk: false, calledOk: false, writeOk: false, interp: false, errs: false, connectedOnce: new Set() };
    let S, id, log = [];
    const fresh = () => ({ srv: null, client: false, transport: '', scopes: new Set(), linked: false, inited: false, ready: false, listed: {}, resSel: '', toolSel: '', args: '' });
    S = fresh(); id = 0;
    const term = h('div', { class: 'term', 'aria-live': 'polite' }), left = h('div');
    const L = (dir, head, obj) => { log.push({ dir, head, obj }); const m = h('div', { class: 'msg ' + dir }, h('div', { class: 'h' }, ({ c2s: '→ CLIENTE → SERVIDOR', s2c: '← SERVIDOR → CLIENTE', err: '⚠ ERROR', host: '▣ HOST' })[dir] + (head ? ' · ' + head : '')), typeof obj === 'string' ? obj : pretty(obj)); term.append(m); term.scrollTop = term.scrollHeight; };
    const req = (method, params) => { const o = { jsonrpc: '2.0', id: ++id, method }; if (params) o.params = params; return o; };
    const ok = (rid, result) => ({ jsonrpc: '2.0', id: rid, result });
    const er = (rid, code, message) => ({ jsonrpc: '2.0', id: rid, error: { code, message } });
    const srv = () => SERVERS[S.srv];
    const needScope = (sc) => { if (S.transport !== 'http') return null; if (!S.scopes.size) return 401; if (sc && !S.scopes.has(sc)) return 403; return null; };
    const httpErr = (code, sc) => { sfx('warn'); code === 401 ? L('err', 'HTTP 401 Unauthorized', 'WWW-Authenticate: Bearer resource_metadata="…"\n\nNo hay token de acceso. En transporte HTTP el servidor exige autorización (OAuth 2.1): concede al menos un scope en el paso 4 y vuelve a conectar.') : L('err', 'HTTP 403 Forbidden', 'WWW-Authenticate: Bearer error="insufficient_scope", scope="' + sc + '"\n\nEl token no incluye el scope necesario.'); };

    const act = {
      pickHost(hst) { if (!hst.ok) { sfx('wrong'); L('host', 'Host no compatible', hst.name + ': ' + hst.d + '\nUn host MCP debe incluir (o crear) clientes MCP. Elige otro host.'); return; } G.host = hst; sfx('correct'); L('host', 'Host seleccionado', hst.name + '\nEl host es la aplicación de IA que el usuario ve y que coordina a los clientes MCP.'); render(); },
      pickServer(k) { S = fresh(); S.srv = k; L('host', 'Servidor elegido', SERVERS[k].label); render(); },
      mkClient() { S.client = true; sfx('click'); L('host', 'Cliente MCP creado', 'El host instancia un cliente MCP dedicado: cada cliente mantiene una conexión 1:1 con un servidor.'); render(); },
      connect() {
        const s = srv();
        if (S.transport === 'stdio' && s.transport === 'http') { sfx('warn'); L('err', 'stdio', 'No se puede lanzar «' + s.name + '» como subproceso local: es un servidor remoto de la organización. stdio sirve para servidores locales que el host ejecuta como proceso hijo; para servidores remotos se usa Streamable HTTP.'); return; }
        if (s.offline) { sfx('warn'); L('err', 'Conexión', 'Error: connection timed out after 30000 ms\n(' + s.name + ' no responde)'); return; }
        if (S.transport === 'http' && !S.scopes.size) { httpErr(401); S.linked = false; render(); return; }
        S.linked = true; sfx('correct'); L('host', 'Transporte listo', (S.transport === 'http' ? 'Streamable HTTP' : 'stdio') + ' conectado' + (S.transport === 'http' ? ' · scopes concedidos: ' + [...S.scopes].join(', ') : '') + '\nAhora falta negociar el protocolo (initialize).'); render();
      },
      init() { const r = req('initialize', { protocolVersion: '2025-06-18', capabilities: { elicitation: {} }, clientInfo: { name: 'aiquest-host', version: '1.0.0' } }); L('c2s', 'initialize', r); L('s2c', 'respuesta', ok(r.id, { protocolVersion: '2025-06-18', capabilities: srv().caps, serverInfo: { name: srv().name, version: '0.3.1' } })); S.inited = true; sfx('click'); render(); },
      initialized() { if (!S.inited) { L('err', 'Orden incorrecto', 'Primero envía la petición initialize y espera su respuesta.'); return; } L('c2s', 'notificación (sin id)', { jsonrpc: '2.0', method: 'notifications/initialized' }); S.ready = true; G.connectedOnce.add(S.srv); sfx('unlock'); render(); },
      list(kind) {
        const m = kind + '/list', r = req(m);
        if (!S.ready) { L('c2s', m, r); L('err', 'Sin inicializar', er(r.id, -32600, 'Servidor no inicializado (ilustrativo): completa initialize + notifications/initialized.')); sfx('wrong'); return; }
        L('c2s', m, r); const s = srv();
        if (!s.caps[kind]) { L('err', 'respuesta', er(r.id, -32601, 'Method not found (el servidor no declaró la capacidad «' + kind + '» en initialize)')); sfx('wrong'); return; }
        const e = needScope(kind === 'resources' ? 'kb:read' : kind === 'tools' ? 'lms:read' : null); if (e) { httpErr(e, kind === 'resources' ? 'kb:read' : 'lms:read'); return; }
        const items = kind === 'resources' ? s.resources.map(({ uri, name, mimeType }) => ({ uri, name, mimeType })) : kind === 'prompts' ? s.prompts : s.tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
        S.listed[kind] = true; L('s2c', 'respuesta', ok(r.id, { [kind]: items })); sfx('click'); render();
      },
      read() { const s = srv(), r = req('resources/read', { uri: S.resSel }); L('c2s', 'resources/read', r); const e = needScope('kb:read'); if (e) { httpErr(e, 'kb:read'); return; } const res = s.resources.find((x) => x.uri === S.resSel); if (!res) { L('err', 'respuesta', er(r.id, -32002, 'Resource not found')); return; } L('s2c', 'respuesta', ok(r.id, { contents: [{ uri: res.uri, mimeType: res.mimeType, text: res.text }] })); G.readOk = true; sfx('correct'); render(); },
      call() {
        const s = srv(), t = s.tools.find((x) => x.name === S.toolSel); let args; try { args = JSON.parse(S.args || '{}'); } catch (e) { sfx('wrong'); L('err', 'Argumentos', 'JSON de argumentos inválido: ' + e.message); return; }
        const doCall = () => {
          const r = req('tools/call', { name: t.name, arguments: args }); L('c2s', 'tools/call', r);
          const e = needScope(t.scope); if (e) { httpErr(e, t.scope); return; }
          const miss = t.inputSchema.required.filter((k) => !(k in args)); if (miss.length) { L('s2c', 'respuesta', er(r.id, -32602, 'Invalid params: falta ' + miss.join(', '))); sfx('wrong'); return; }
          L('s2c', 'respuesta', ok(r.id, { content: [{ type: 'text', text: t.run(args) }], isError: false })); G.calledOk = true; if (t.write) G.writeOk = true; sfx('correct'); render();
        };
        if (t.write) { // consentimiento del usuario: lo gestiona el HOST
          const m = A.ui.modal('El host solicita tu aprobación', h('div', null, h('p', null, 'El asistente quiere ejecutar una herramienta que ', h('b', null, 'modifica datos'), ':'), h('pre', null, t.name + '(' + JSON.stringify(args) + ')'), h('p', { class: 'muted small' }, 'Human-in-the-loop: acciones de escritura requieren confirmación explícita.'), h('div', { class: 'row' }, h('button', { class: 'btn pri', type: 'button', onclick: () => { m.close(); L('host', 'Aprobado por el usuario', t.name); doCall(); } }, 'Aprobar'), h('button', { class: 'btn', type: 'button', onclick: () => { m.close(); sfx('warn'); L('host', 'Denegado por el usuario', 'No se envió ningún mensaje al servidor.'); } }, 'Denegar'))), { noClose: true, locked: true });
        } else doCall();
      },
    };

    function section(n, title, enabled, ...kids) { return h('div', { class: 'card', style: 'margin-bottom:10px;padding:14px;' + (enabled ? '' : 'opacity:.5') }, h('b', null, n + '. ' + title), h('div', { style: 'margin-top:8px' }, kids)); }
    function render() {
      left.innerHTML = '';
      left.append(section(1, 'Elige el host de IA', true, h('div', { class: 'opts' }, HOSTS.map((x) => h('button', { class: 'opt' + (G.host === x ? ' ok' : ''), type: 'button', onclick: () => act.pickHost(x) }, h('b', null, x.name), h('br'), h('small', { class: 'muted' }, x.d))))));
      left.append(section(2, 'Elige el servidor MCP', !!G.host, h('div', { class: 'opts' }, Object.keys(SERVERS).map((k) => h('button', { class: 'opt' + (S.srv === k ? ' sel' : ''), type: 'button', disabled: !G.host, onclick: () => act.pickServer(k) }, h('b', null, SERVERS[k].name), h('br'), h('small', { class: 'muted' }, SERVERS[k].label))))));
      left.append(section(3, 'Crea el cliente MCP', !!S.srv, h('button', { class: 'btn', type: 'button', disabled: !S.srv || S.client, onclick: act.mkClient }, S.client ? '✓ Cliente creado' : 'Instanciar cliente MCP')));
      const tr = h('select', { disabled: !S.client, 'aria-label': 'Transporte', onchange: (e) => { S.transport = e.target.value; render(); } }, h('option', { value: '' }, '— transporte —'), h('option', { value: 'stdio', selected: S.transport === 'stdio' }, 'stdio (proceso local)'), h('option', { value: 'http', selected: S.transport === 'http' }, 'Streamable HTTP (remoto)'));
      left.append(section(4, 'Transporte y autorización', S.client, tr,
        S.transport === 'http' ? h('div', { style: 'margin-top:8px' }, h('div', { class: 'lbl' }, 'Scopes que concedes al token (mínimo privilegio)'), SCOPES.map((sc) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: S.scopes.has(sc), onchange: (e) => { e.target.checked ? S.scopes.add(sc) : S.scopes.delete(sc); } }), h('span', null, h('code', null, sc))))) : null,
        h('button', { class: 'btn', type: 'button', style: 'margin-top:8px', disabled: !S.client || !S.transport, onclick: act.connect }, S.linked ? '✓ Conectado (reconectar)' : 'Conectar')));
      left.append(section(5, 'Ciclo de inicialización', S.linked, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', disabled: !S.linked, onclick: act.init }, (S.inited ? '✓ ' : '') + 'initialize'), h('button', { class: 'btn', type: 'button', disabled: !S.linked, onclick: act.initialized }, (S.ready ? '✓ ' : '') + 'notifications/initialized'))));
      const rs = srv() && S.listed.resources && srv().resources, ts = srv() && S.listed.tools && srv().tools;
      left.append(section(6, 'Descubre capacidades', S.linked, h('div', { class: 'row' }, ['resources', 'prompts', 'tools'].map((k) => h('button', { class: 'btn sm', type: 'button', disabled: !S.linked, onclick: () => act.list(k) }, k + '/list')))));
      left.append(section(7, 'Lee un Resource', S.linked && !!rs, rs ? h('div', null, h('select', { 'aria-label': 'Recurso', onchange: (e) => { S.resSel = e.target.value; render(); } }, h('option', { value: '' }, '— recurso —'), rs.map((r) => h('option', { value: r.uri, selected: S.resSel === r.uri }, r.name + ' (' + r.uri + ')'))), h('button', { class: 'btn sm', type: 'button', style: 'margin-top:8px', disabled: !S.resSel, onclick: act.read }, 'resources/read')) : h('span', { class: 'muted small' }, 'Lista primero los resources (paso 6) en un servidor que los ofrezca.')));
      left.append(section(8, 'Usa una Tool (flujo autorizado)', S.linked && !!ts && ts.length > 0, ts && ts.length ? h('div', null, h('select', { 'aria-label': 'Herramienta', onchange: (e) => { S.toolSel = e.target.value; const t = ts.find((x) => x.name === S.toolSel); S.args = t ? pretty(t.sample) : ''; render(); } }, h('option', { value: '' }, '— herramienta —'), ts.map((t) => h('option', { value: t.name, selected: S.toolSel === t.name }, t.name + (t.write ? '  ⚠ escritura' : '')))), S.toolSel ? h('textarea', { class: 'mono', rows: 4, style: 'margin-top:8px', 'aria-label': 'Argumentos JSON', oninput: (e) => (S.args = e.target.value) }, S.args) : null, h('button', { class: 'btn sm', type: 'button', style: 'margin-top:8px', disabled: !S.toolSel, onclick: act.call }, 'tools/call')) : h('span', { class: 'muted small' }, 'Lista las tools (paso 6) en un servidor que las ofrezca (p. ej. lms-cursos).')));
      const done = [['Host compatible con MCP elegido', !!G.host], ['Cliente creado y servidor inicializado (initialize + initialized)', G.connectedOnce.size > 0], ['Resource leído correctamente', G.readOk], ['Tool de escritura ejecutada con aprobación y scope correcto', G.writeOk], ['Respuesta interpretada', G.interp], ['Errores diagnosticados (≥80%)', G.errs]];
      left.append(section(9, 'Tu misión', true, done.map(([t, d]) => h('div', { class: 'task' + (d ? ' on' : '') }, d ? '✓' : '○', t))));
      if (G.writeOk && !G.interp && !left.querySelector('.interp')) left.append(h('div', { class: 'card interp', style: 'margin-bottom:10px' }, h('h3', null, 'Interpreta la respuesta'), A.act.mcq({ questions: [{ q: 'La respuesta de <code>tools/call</code> trae <code>"isError": false</code> y un <code>content[0].text</code>. ¿Cómo la interpreta correctamente el host/modelo?', o: ['La herramienta se ejecutó y el texto es el resultado que el modelo puede usar para responder al usuario', 'El servidor falló, pero devolvió texto de ejemplo', 'El resultado es una nueva instrucción que el modelo debe obedecer sin revisarla', 'La conexión se cerró'], a: 0, e: 'Los resultados de tools son <b>datos</b> para el modelo. Nunca deben tratarse como instrucciones de confianza (riesgo de prompt injection).' }] }, { pass: 100, report: (s) => { if (s >= 100) { G.interp = true; check(); } } })));
      if (G.interp && !G.errs) left.append(h('div', { class: 'card', style: 'margin-bottom:10px' }, h('h3', null, 'Laboratorio de errores'), h('p', { class: 'muted' }, 'Diagnostica cinco fallos típicos.'), A.act.mcq({ questions: ERRQ }, { pass: ctx.pass, report: (s) => { if (s >= ctx.pass) { G.errs = true; check(); } } })));
      if (!cfg.free) null;
    }
    function check() { render(); if (G.host && G.connectedOnce.size && G.readOk && G.writeOk && G.interp && G.errs) ctx.report(100); }
    root.append(simBanner('Este simulador representa el protocolo MCP con servidores <b>ficticios</b> (<code>kb-capacitacion</code>, <code>lms-cursos</code>, <code>erp-legado</code>). No se conecta a ningún servidor real; los mensajes JSON-RPC mostrados siguen la forma del protocolo.'),
      h('div', { class: 'sim' }, left, h('div', null, h('div', { class: 'row' }, h('div', { class: 'lbl sp' }, 'Transcripción del protocolo'), h('button', { class: 'btn sm', type: 'button', onclick: () => { term.innerHTML = ''; } }, 'Limpiar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { S = fresh(); id = 0; term.innerHTML = ''; render(); } }, 'Reiniciar conexión')), term)));
    render(); return root;
  };
})();
