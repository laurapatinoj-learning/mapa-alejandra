/* AI QUEST — shell de la aplicación: router, vistas, runner de niveles, gamificación. */
(function () {
  const A = window.AIQ, { h, esc, toast, modal, xpFloat, confetti } = A.ui, store = A.store, V = document.getElementById('view');
  const S = () => store.get(), say = (k, o) => A.guide.say(k, o), sfx = (n) => A.audio.sfx(n);
  const LV = () => Object.keys(A.levels).map(Number).sort((a, b) => a - b);
  const ACH = [
    ['first', '🚀', 'Primer paso', 'Completa tu primera actividad.'], ['perfect', '💎', 'Perfeccionista', 'Obtén 100% en una evaluación de dominio.'], ['streak3', '🔥', 'Constancia', 'Aprende 3 días seguidos.'],
    ['experimenter', '🧪', 'Experimentador', 'Guarda 5 experimentos en el laboratorio.'], ['hallu', '🔍', 'Cazador de alucinaciones', 'Detecta todas las afirmaciones dudosas del nivel 1.'], ['nohint', '🧠', 'Sin pistas', 'Completa un nivel sin pedir ayuda a Nova.'],
    ['reflex', '⚡', 'Reflejos', 'Resuelve 3 desafíos sorpresa.'], ['mcp90', '🛰', 'Especialista MCP', 'Obtén 90% o más en la evaluación del nivel 9.'], ['architect', '🏆', 'AI Architect', 'Completa la ruta completa.'],
  ];
  let activeCleanup = null;

  /* ---------- configuración / accesibilidad ---------- */
  function applySettings() { const s = S().settings; document.body.classList.toggle('hc', !!s.contrast); document.body.classList.toggle('nomotion', !s.motion); document.documentElement.style.setProperty('--fs', s.font); }
  function openSettings() {
    const s = S().settings, sw = (label, key, desc) => h('div', { class: 'setrow' }, h('div', null, h('b', null, label), desc ? h('div', { class: 'muted small' }, desc) : null), h('input', { type: 'checkbox', checked: !!s[key], 'aria-label': label, onchange: (e) => { s[key] = e.target.checked; store.save(); applySettings(); A.audio.setMuted(s.muted); A.guide.syncHud(); } }));
    modal('Accesibilidad y audio', h('div', null,
      sw('Audio silenciado', 'muted', 'Desactiva voz y efectos.'), sw('Subtítulos de Nova', 'subs', 'Muestra siempre el texto de lo que dice Nova.'), sw('Animaciones y efectos', 'motion', 'Desactiva animaciones, partículas y movimiento 3D.'), sw('Alto contraste', 'contrast'),
      h('div', { class: 'setrow' }, h('b', null, 'Tamaño de texto'), h('input', { type: 'range', min: .9, max: 1.4, step: .05, value: s.font, 'aria-label': 'Tamaño de texto', oninput: (e) => { s.font = +e.target.value; store.save(); applySettings(); } })),
      h('div', { class: 'setrow' }, h('b', null, 'Volumen'), h('input', { type: 'range', min: 0, max: 1, step: .05, value: s.volume, 'aria-label': 'Volumen', oninput: (e) => A.audio.setVolume(+e.target.value) })),
      h('div', { class: 'setrow' }, h('b', null, 'Velocidad de la voz'), h('input', { type: 'range', min: .7, max: 1.3, step: .05, value: s.rate, 'aria-label': 'Velocidad de voz', oninput: (e) => { s.rate = +e.target.value; store.save(); } })),
      h('p', { class: 'muted small' }, 'Navegación por teclado: Tab / Shift+Tab, Enter y Espacio para activar; Esc cierra ventanas. ' + (A.audio.hasTTS() ? '' : 'Tu navegador no ofrece síntesis de voz: se muestran subtítulos.'))));
  }

  /* ---------- cabecera ---------- */
  const NAV = [['dashboard', 'Inicio'], ['map', 'Mapa'], ['missions', 'Misiones'], ['badges', 'Insignias'], ['lab', 'Laboratorio'], ['profile', 'Perfil']];
  function buildHeader() {
    const top = document.getElementById('top'); top.innerHTML = '';
    const nav = h('nav', { id: 'nav', 'aria-label': 'Navegación principal' }, NAV.map(([k, t]) => h('a', { href: '#/' + k, 'data-k': k }, t)));
    top.append(h('div', { class: 'bar' }, h('a', { class: 'logo', href: '#/dashboard' }, '◆ AI QUEST'), nav,
      h('div', { class: 'hstats' }, h('span', { class: 'pill', title: 'Experiencia' }, '⚡ ', h('span', { id: 'hud-xp' }, S().xp)), h('span', { class: 'pill hide-s', title: 'Racha de aprendizaje' }, '🔥 ', h('span', { id: 'hud-st' }, store.streakNow())),
        h('button', { class: 'btn sm icon', id: 'hud-mute', type: 'button', 'aria-label': 'Silenciar o activar audio', onclick: () => { const m = !S().settings.muted; A.audio.setMuted(m); A.guide.syncHud(); } }, S().settings.muted ? '🔇' : '🔊'),
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Accesibilidad y audio', onclick: openSettings }, '⚙'),
        h('button', { class: 'btn sm icon menu-btn', type: 'button', 'aria-label': 'Menú', 'aria-expanded': 'false', onclick: (e) => { const o = nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); } }, '☰'))));
  }
  const hud = () => { const a = document.getElementById('hud-xp'), b = document.getElementById('hud-st'); a && (a.textContent = S().xp); b && (b.textContent = store.streakNow()); };

  /* ---------- router ---------- */
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function route() {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    const p = location.hash.replace(/^#\/?/, '').split('/'); let name = p[0] || 'dashboard';
    if (!S().profile && name !== 'welcome') name = 'welcome';
    A.audio.stop(); A.guide.hintFn = null; V.innerHTML = '';
    document.querySelectorAll('#nav a').forEach((a) => { if (a.dataset.k === name || (name === 'level' && a.dataset.k === 'map')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.getElementById('nav').classList.remove('open');
    const R = { welcome: vWelcome, dashboard: vDash, map: vMap, missions: vMissions, badges: vBadges, lab: vLab, profile: vProfile, certificate: vCert, diag: vDiag, level: () => vLevel(+p[1], p[2]) };
    (R[name] || vDash)(); hud(); window.scrollTo(0, 0); V.focus({ preventScroll: true });
    document.title = 'AI QUEST — ' + (name === 'level' ? 'Nivel ' + p[1] : (NAV.find((n) => n[0] === name) || ['', 'Bienvenida'])[1]);
  }

  /* ---------- progreso y misiones ---------- */
  function nextTask() {
    for (const n of LV()) { if (!store.unlocked(n)) break; const L = store.level(n); if (L.done) continue; const lv = A.levels[n]; const acts = lv.practice.concat([lv.challenge]); const pend = acts.find((a) => !(L.acts[a.id] && L.acts[a.id].done)); return { n, title: pend ? pend.title : 'Evaluación de dominio', step: pend ? (lv.practice.includes(pend) ? 'p' + lv.practice.indexOf(pend) : 'challenge') : 'mastery' }; }
    return null;
  }
  const rank = () => { const c = store.completed(); return ['AI Explorer', 'Prompt Initiate', 'Prompt Builder', 'Prompt Engineer', 'Advanced Prompt Master', 'Multimodal Creator', 'Workflow Designer', 'AI Agent Builder', 'API Integrator', 'MCP Specialist', 'AI Architect'][c]; };

  /* ---------- vistas ---------- */
  function vWelcome() {
    const stage = h('div', { class: 'stage' }, A.guide.create()), inp = h('input', { type: 'text', placeholder: 'Tu nombre para el certificado', maxlength: 60, 'aria-label': 'Tu nombre', value: S().profile ? S().profile.name : '' });
    const start = () => { const n = inp.value.trim(); if (!n) { inp.focus(); toast('Escribe tu nombre para continuar', 'warn'); return; } S().profile = { name: n, since: Date.now() }; store.save(); sfx('unlock'); go('#/diag'); };
    inp.addEventListener('keydown', (e) => e.key === 'Enter' && start());
    V.append(h('div', { class: 'card hero' }, h('div', null, h('span', { class: 'chip' }, 'E-learning interactivo · 10 niveles'), h('h1', { style: 'margin-top:10px' }, h('span', { class: 'grad-t' }, 'AI QUEST'), h('br'), 'From Zero to AI Architect'),
      h('p', { class: 'muted', style: 'font-size:1.1rem' }, 'Empieza como AI Explorer y avanza —practicando— hasta diseñar soluciones con prompts, workflows, agentes y servidores MCP. Sin conocimientos previos.'),
      h('div', { class: 'row' }, inp, h('button', { class: 'btn pri', type: 'button', onclick: start }, 'Comenzar la misión ▶')),
      h('p', { class: 'muted small', style: 'margin-top:12px' }, 'Tu progreso se guarda solo en este navegador. Puedes exportarlo desde tu perfil.')), stage));
    say('welcome', { expr: 'happy', anim: 'welcome', speak: false });
  }

  function vDiag() {
    if (S().diag) { toast('Ya hiciste el diagnóstico.'); return go('#/dashboard'); }
    say('diag_intro', { expr: 'explain', anim: 'explain', speak: false });
    V.append(h('div', { class: 'card' }, h('span', { class: 'chip violet' }, 'Evaluación diagnóstica'), h('h2', { style: 'margin-top:8px' }, '¿Desde dónde partes?'), h('p', { class: 'muted' }, 'Seis preguntas sin nota. Si no sabes, elige lo más razonable.'),
      A.act.mcq({ questions: A.diag, keepOrder: true, diagnostic: true }, { pass: 0, report: (sc) => { S().diag = { score: sc, total: A.diag.length, date: Date.now() }; store.save(); V.firstChild.append(h('button', { class: 'btn pri', type: 'button', style: 'margin-top:14px', onclick: () => { say('diag_done', { expr: 'happy' }); go('#/dashboard'); } }, 'Ir a mi panel ▶')); } })));
  }

  function vDash() {
    const nt = nextTask(), prog = store.progress(), s = S();
    V.append(h('div', { class: 'card hero' }, h('div', null, h('span', { class: 'chip' }, 'Rango actual: ' + rank()), h('h1', { style: 'margin:10px 0' }, 'Hola, ', h('span', { class: 'grad-t' }, s.profile.name)),
      h('p', { class: 'muted' }, nt ? `Tu siguiente paso: Nivel ${nt.n} — ${nt.title}.` : '¡Completaste toda la ruta! Descarga tu certificado.'),
      h('div', { class: 'meter', style: 'margin:14px 0' }, A.ui.bar(prog), h('b', null, prog + '%')),
      h('div', { class: 'row' }, nt ? h('button', { class: 'btn pri', type: 'button', onclick: () => go(`#/level/${nt.n}/${nt.step}`) }, 'Continuar ▶') : h('button', { class: 'btn pri', type: 'button', onclick: () => go('#/certificate') }, 'Ver certificado'), h('button', { class: 'btn', type: 'button', onclick: () => go('#/map') }, 'Ver mapa'))),
      h('div', { class: 'stage' }, A.guide.create())));
    V.append(h('div', { class: 'grid g3', style: 'margin-top:16px' }, [['Experiencia', s.xp + ' XP'], ['Nivel de jugador', store.playerLevel()], ['Racha', store.streakNow() + ' día(s)'], ['Niveles superados', store.completed() + '/10']].map(([a, b]) => h('div', { class: 'card stat' }, h('b', null, b), h('span', null, a)))));
    const miss = missionsToday();
    V.append(h('div', { class: 'sec-t' }, h('h2', null, 'Misiones de hoy')), h('div', { class: 'grid g3' }, miss.map((m) => h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', { style: 'font-size:1.5rem' }, m.done ? '✅' : m.icon), h('b', null, m.t)), h('p', { class: 'muted small' }, m.d), m.done ? h('span', { class: 'chip green' }, 'Completada') : h('button', { class: 'btn sm pri', type: 'button', onclick: m.go }, m.cta)))));
    if (!s.diag) V.append(h('div', { class: 'callout', style: 'margin-top:16px' }, 'Aún no hiciste el diagnóstico. ', h('a', { href: '#/diag' }, 'Hacerlo ahora')));
    else V.append(h('p', { class: 'muted small', style: 'margin-top:16px' }, `Diagnóstico inicial: ${s.diag.score}%.`));
    say('dashboard', { expr: 'happy', anim: 'welcome', speak: false });
  }
  function missionsToday() {
    const s = S(), t = A.util.today(); const nt = nextTask();
    return [
      { icon: '📚', t: 'Aprende hoy', d: 'Completa una actividad para mantener tu racha.', done: s.streak.last === t, cta: 'Ir a mi nivel', go: () => go(nt ? `#/level/${nt.n}/${nt.step}` : '#/map') },
      { icon: '⚡', t: 'Desafío sorpresa', d: 'Pregunta rápida con XP extra (máx. 3 al día).', done: s.stats.surpriseDay === t && s.stats.surpriseToday >= 3, cta: 'Aceptar desafío', go: surprise },
      { icon: '🧪', t: 'Experimenta en el laboratorio', d: 'Guarda una versión de prompt en la bitácora.', done: s.labLog.some((l) => new Date(l.ts).toDateString() === new Date().toDateString()), cta: 'Abrir laboratorio', go: () => go('#/lab') },
    ];
  }

  function vMap() {
    say('map', { expr: 'explain', speak: false });
    V.append(h('h1', null, 'Mapa de aprendizaje'), h('p', { class: 'muted' }, 'Cada nivel desbloquea una habilidad. Para avanzar demuestra dominio: ≥ 80% en la evaluación.'));
    const cur = nextTask(), m = h('div', { class: 'map' });
    LV().forEach((n) => { const lv = A.levels[n], L = store.level(n), un = store.unlocked(n), cl = 'node' + (L.done ? ' done' : '') + (!un ? ' locked' : '') + (cur && cur.n === n ? ' cur' : '');
      m.append(h('button', { class: cl, type: 'button', 'aria-disabled': !un, 'aria-label': `Nivel ${n}: ${lv.name}. ${L.done ? 'Superado' : un ? 'Disponible' : 'Bloqueado'}`, onclick: () => { if (!un) { sfx('warn'); toast('Supera el nivel anterior (≥80%) para desbloquear este.', 'warn'); return; } go('#/level/' + n); } },
        h('span', { class: 'n' }, 'NIVEL ' + n), h('span', { class: 'ico' }, L.done ? '✅' : un ? lv.icon : '🔒'), h('b', null, lv.name), h('span', { class: 'muted small' }, lv.subtitle), h('span', { class: 'sp' }), h('span', { class: 'chip' + (L.done ? ' green' : '') }, lv.bloom), L.mastery.best ? h('span', { class: 'small muted' }, 'Mejor evaluación: ' + L.mastery.best + '%') : null)); });
    V.append(m);
  }

  function vMissions() {
    V.append(h('h1', null, 'Panel de misiones'), h('p', { class: 'muted' }, 'Todas las actividades de la ruta y su estado.'));
    LV().forEach((n) => { const lv = A.levels[n], L = store.level(n), un = store.unlocked(n), all = lv.practice.map((a, i) => ({ a, step: 'p' + i })).concat([{ a: lv.challenge, step: 'challenge', ch: true }]);
      V.append(h('div', { class: 'card', style: 'margin-bottom:12px;' + (un ? '' : 'opacity:.55') }, h('div', { class: 'row' }, h('h3', { style: 'margin:0' }, `Nivel ${n} · ${lv.name}`), h('span', { class: 'sp' }), h('span', { class: 'chip ' + (L.done ? 'green' : '') }, L.done ? 'Superado' : un ? 'En curso' : 'Bloqueado')),
        h('ul', { class: 'rl' }, all.map(({ a, step, ch }) => { const r = L.acts[a.id]; return h('li', { class: r && r.done ? 'ok' : 'no' }, h('span', { class: 'i' }, r && r.done ? '✓' : '○'), h('div', null, (ch ? '🎯 Reto: ' : '') + a.title, h('small', null, (r ? `Mejor puntaje ${r.score}% · ` : '') + a.xp + ' XP máx.')), h('span', { class: 'sp' }), un ? h('button', { class: 'btn sm', type: 'button', onclick: () => go(`#/level/${n}/${step}`) }, r && r.done ? 'Repetir' : 'Ir') : null); }),
          h('li', { class: L.done ? 'ok' : 'no' }, h('span', { class: 'i' }, L.done ? '✓' : '○'), h('div', null, 'Evaluación de dominio (≥80%)', h('small', null, L.mastery.best ? 'Mejor: ' + L.mastery.best + '%' : 'Pendiente')), h('span', { class: 'sp' }), un ? h('button', { class: 'btn sm', type: 'button', onclick: () => go(`#/level/${n}/mastery`) }, 'Ir') : null)))); });
  }

  function vBadges() {
    V.append(h('h1', null, 'Centro de insignias'), h('p', { class: 'muted' }, 'Se otorgan por demostrar competencias, no por rapidez.'));
    V.append(h('div', { class: 'grid g3' }, LV().map((n) => { const b = A.levels[n].badge, got = S().badges[b.id]; return h('div', { class: 'card badge' + (got ? '' : ' lk') }, h('div', { class: 'em' }, got ? b.icon : '🔒'), h('b', null, b.name), h('span', { class: 'muted small' }, got ? 'Nivel ' + n + ' · ' + new Date(got.t).toLocaleDateString() : 'Supera el nivel ' + n)); })));
    V.append(h('div', { class: 'sec-t' }, h('h2', null, 'Logros especiales')), h('div', { class: 'grid g3' }, ACH.map(([id, ic, t, d]) => { const g = S().ach[id]; return h('div', { class: 'card badge' + (g ? '' : ' lk') }, h('div', { class: 'em', style: 'background:linear-gradient(135deg,#fbbf24,#f472b6)' }, g ? ic : '🔒'), h('b', null, t), h('span', { class: 'muted small' }, d)); })));
  }

  function vLab() {
    V.append(h('h1', null, 'Laboratorio de IA'), h('p', { class: 'muted' }, 'Espacio libre para experimentar. El laboratorio de prompts está siempre disponible; API y MCP se habilitan al superar sus niveles.'));
    const tabs = h('div', { class: 'tabs', role: 'tablist' }), body = h('div', { class: 'card' }), T = [['prompt', '✍ Prompts', true], ['api', '🔌 API', store.unlocked(9) || S().levels[8]], ['mcp', '🛰 MCP', store.unlocked(10) || S().levels[9]]];
    const open = (k) => { body.innerHTML = ''; tabs.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.k === k));
      if (k === 'prompt') body.append(A.lab.promptLab());
      else if (k === 'api') body.append(store.unlocked(9) ? A.act.apisim({ free: true }, { pass: 80, report() {} }) : h('div', { class: 'lock-msg' }, '🔒 Se habilita al superar el Nivel 8 (API & AI Integration).'));
      else body.append(store.unlocked(10) ? A.act.mcpsim({ free: true }, { pass: 80, report() {} }) : h('div', { class: 'lock-msg' }, '🔒 Se habilita al superar el Nivel 9 (MCP).')); };
    T.forEach(([k, t]) => tabs.append(h('button', { class: 'tab', role: 'tab', type: 'button', 'data-k': k, 'aria-selected': 'false', onclick: () => open(k) }, t)));
    V.append(tabs, body); open('prompt');
  }

  function vProfile() {
    const s = S(), nm = h('input', { type: 'text', value: s.profile.name, 'aria-label': 'Nombre' });
    V.append(h('h1', null, 'Perfil del participante'), h('div', { class: 'grid g2' }, h('div', { class: 'card' }, h('h3', null, 'Datos'), h('div', { class: 'fld' }, h('label', { class: 'fl' }, 'Nombre (aparece en el certificado)'), nm), h('button', { class: 'btn pri', type: 'button', onclick: () => { s.profile.name = nm.value.trim() || s.profile.name; store.save(); toast('Nombre actualizado', 'ok'); } }, 'Guardar'),
      h('p', { class: 'muted', style: 'margin-top:14px' }, `Rango: ${rank()} · ${s.xp} XP · jugador nivel ${store.playerLevel()} · racha ${store.streakNow()} (mejor ${s.streak.best})`), h('p', { class: 'muted' }, s.diag ? `Diagnóstico inicial: ${s.diag.score}%` : 'Diagnóstico pendiente.')),
      h('div', { class: 'card' }, h('h3', null, 'Dominio por nivel'), h('table', { class: 't' }, h('tr', null, h('th', null, 'Nivel'), h('th', null, 'Mejor evaluación'), h('th', null, 'Intentos')), LV().map((n) => { const L = store.level(n); return h('tr', null, h('td', null, n + '. ' + A.levels[n].name), h('td', null, L.mastery.best ? L.mastery.best + '%' + (L.done ? ' ✓' : '') : '—'), h('td', null, L.mastery.attempts)); })))));
    V.append(h('div', { class: 'card', style: 'margin-top:16px' }, h('h3', null, 'Tus datos'), h('p', { class: 'muted small' }, 'Se guardan solo en este navegador. Exporta una copia para llevarla a otro dispositivo.'), h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([store.exportJSON()], { type: 'application/json' })), download: 'aiquest-progreso.json' }); a.click(); } }, '⬇ Exportar progreso'),
      h('label', { class: 'btn' }, '⬆ Importar progreso', h('input', { type: 'file', accept: 'application/json', style: 'display:none', onchange: (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((t) => { try { store.importJSON(t); toast('Progreso importado', 'ok'); buildHeader(); applySettings(); route(); } catch (er) { toast('No se pudo importar: ' + er.message, 'bad'); } }); } })),
      h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm('¿Borrar TODO tu progreso en este navegador? Esta acción no se puede deshacer.')) { store.reset(); location.hash = '#/welcome'; location.reload(); } } }, '🗑 Reiniciar todo'))));
  }

  /* ---------- certificado ---------- */
  function vCert() {
    const s = S(), done = store.completed() === 10;
    if (!done) { V.append(h('div', { class: 'card lock-msg' }, h('h2', null, '🔒 Certificado bloqueado'), h('p', { class: 'muted' }, `Supera los 10 niveles para obtenerlo. Llevas ${store.completed()}/10.`), h('button', { class: 'btn pri', type: 'button', onclick: () => go('#/map') }, 'Ir al mapa'))); return; }
    const cv = h('canvas', { width: 1600, height: 1130, role: 'img', 'aria-label': 'Certificado AI Architect de ' + s.profile.name }), x = cv.getContext('2d'), W = 1600, H = 1130;
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#070a16'); g.addColorStop(1, '#1a1040'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#22d3ee'); gr.addColorStop(.5, '#3b82f6'); gr.addColorStop(1, '#8b5cf6');
    x.strokeStyle = gr; x.lineWidth = 8; x.strokeRect(40, 40, W - 80, H - 80); x.lineWidth = 2; x.strokeRect(62, 62, W - 124, H - 124);
    x.textAlign = 'center'; x.fillStyle = gr; x.font = '800 54px system-ui,sans-serif'; x.fillText('◆ AI QUEST', W / 2, 170);
    x.fillStyle = '#a3acd6'; x.font = '30px system-ui,sans-serif'; x.fillText('CERTIFICADO DE FINALIZACIÓN', W / 2, 235); x.fillText('Se certifica que', W / 2, 360);
    x.fillStyle = '#fff'; let fs = 92; x.font = `800 ${fs}px system-ui,sans-serif`; while (x.measureText(s.profile.name).width > W - 300 && fs > 40) { fs -= 4; x.font = `800 ${fs}px system-ui,sans-serif`; } x.fillText(s.profile.name, W / 2, 470);
    x.fillStyle = '#a3acd6'; x.font = '30px system-ui,sans-serif'; x.fillText('completó los 10 niveles de la ruta «From Zero to AI Architect»', W / 2, 550); x.fillText('demostrando dominio (≥ 80%) en cada evaluación y alcanzando el título', W / 2, 595);
    x.fillStyle = gr; x.font = '800 100px system-ui,sans-serif'; x.fillText('AI ARCHITECT', W / 2, 720);
    const avg = Math.round(LV().reduce((a, n) => a + store.level(n).mastery.best, 0) / 10); x.fillStyle = '#e9edff'; x.font = '28px system-ui,sans-serif';
    x.fillText(`Promedio de dominio: ${avg}%   ·   XP: ${s.xp}` + (s.diag ? `   ·   Diagnóstico inicial: ${s.diag.score}%` : ''), W / 2, 810);
    x.fillStyle = '#a3acd6'; x.font = '24px system-ui,sans-serif'; x.fillText('Prompts · Prompt engineering · Multimodal · Workflows · Agentes · APIs · MCP', W / 2, 870);
    const when = new Date(s.ach.architect ? s.ach.architect.t : Date.now()).toLocaleDateString('es'); x.fillText('Fecha: ' + when + '   ·   ID: AIQ-' + (s.profile.since || 0).toString(36).toUpperCase(), W / 2, 1010);
    x.fillStyle = '#6d7ab8'; x.font = '20px system-ui,sans-serif'; x.fillText('Certificado de práctica generado localmente; no constituye acreditación oficial.', W / 2, 1060);
    V.append(h('h1', null, '🏆 Tu certificado'), h('div', { class: 'cert-wrap' }, cv), h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn pri', type: 'button', onclick: () => { const a = h('a', { href: cv.toDataURL('image/png'), download: 'certificado-ai-architect.png' }); a.click(); } }, '⬇ Descargar PNG'), h('button', { class: 'btn', type: 'button', onclick: () => print() }, '🖨 Imprimir')));
    say('certificate', { expr: 'happy', anim: 'celebrate', speak: false });
  }

  /* ---------- desafío sorpresa ---------- */
  function surprise() {
    const s = S(), t = A.util.today(); if (s.stats.surpriseDay !== t) { s.stats.surpriseDay = t; s.stats.surpriseToday = 0; }
    if (s.stats.surpriseToday >= 3) { toast('Ya hiciste tus 3 desafíos sorpresa de hoy. ¡Vuelve mañana!'); return; }
    const q = A.util.pick(A.surprise); sfx('unlock'); say('surprise', { expr: 'surprise', anim: 'surprise' });
    const m = modal('⚡ Desafío sorpresa', h('div', null, h('p', { class: 'muted' }, 'Acierta para ganar +30 XP.'), A.act.mcq({ questions: [q], keepOrder: true }, { pass: 100, report: (sc) => { s.stats.surpriseToday++; s.stats.surprise++; if (sc >= 100) { store.addXP(30); toast('+30 XP', 'ok'); } if (s.stats.surprise >= 3) store.grant('reflex', 'Reflejos', '⚡'); store.save(); hud(); } })), { closeLabel: 'Cerrar' });
  }

  /* ---------- runner de niveles ---------- */
  function vLevel(n, stepId) {
    const lv = A.levels[n]; if (!lv) return go('#/map');
    if (!store.unlocked(n)) { V.append(h('div', { class: 'card lock-msg' }, h('h2', null, '🔒 Nivel bloqueado'), h('p', { class: 'muted' }, 'Supera la evaluación del nivel anterior con ≥ 80%.'), h('button', { class: 'btn pri', type: 'button', onclick: () => go('#/map') }, 'Volver al mapa'))); return; }
    const L = store.level(n);
    const steps = [{ id: 'intro', label: 'Misión', kind: 'text' }, { id: 'concept', label: 'Concepto', kind: 'text' }, { id: 'example', label: 'Ejemplo práctico', kind: 'text' }]
      .concat(lv.practice.map((a, i) => ({ id: 'p' + i, label: a.title, kind: 'act', act: a })), [{ id: 'challenge', label: 'Reto aplicado', kind: 'act', act: lv.challenge, ch: true }, { id: 'mastery', label: 'Evaluación de dominio', kind: 'mastery' }]);
    const done = (s) => s.kind === 'act' ? !!(L.acts[s.act.id] && L.acts[s.act.id].done) : s.kind === 'mastery' ? L.done : !!L.seen[s.id];
    const reach = (i) => steps.slice(0, i).every(done);
    let idx = steps.findIndex((s) => s.id === stepId); if (idx < 0) idx = Math.max(0, steps.findIndex((s) => !done(s)));
    if (idx < 0 || (steps[idx] && !reach(idx))) idx = Math.max(0, steps.findIndex((s) => !done(s)));
    const cur = steps[idx];
    if (cur.kind === 'text' && cur.id !== 'concept') { L.seen[cur.id] = true; store.save(); }
    const stepper = h('div', { class: 'stepper', role: 'navigation', 'aria-label': 'Pasos del nivel' }), bar = h('div', { class: 'stepbar' }), main = h('div');
    const drawNav = () => {
      stepper.innerHTML = ''; steps.forEach((s, i) => stepper.append(h('button', { class: 'st' + (i === idx ? ' cur' : '') + (done(s) ? ' done' : ''), type: 'button', disabled: !reach(i), 'aria-current': i === idx ? 'step' : null, onclick: () => go(`#/level/${n}/${s.id}`) }, h('span', { class: 'dot' }, done(s) ? '✓' : i + 1), s.label)));
      bar.innerHTML = ''; const prev = steps[idx - 1], next = steps[idx + 1], ok = done(cur);
      bar.append(prev ? h('button', { class: 'btn', type: 'button', onclick: () => go(`#/level/${n}/${prev.id}`) }, '← Anterior') : h('span'), h('span', { class: 'muted small' }, `Nivel ${n} · Paso ${idx + 1} de ${steps.length}` + (ok ? '' : ' · ' + req(cur))),
        next ? h('button', { class: 'btn pri', type: 'button', disabled: !ok, onclick: () => { sfx('transition'); go(`#/level/${n}/${next.id}`); } }, 'Siguiente →') : (L.done && n < 10 ? h('button', { class: 'btn pri', type: 'button', onclick: () => go('#/level/' + (n + 1)) }, `Ir al Nivel ${n + 1} →`) : L.done ? h('button', { class: 'btn pri', type: 'button', onclick: () => go('#/certificate') }, 'Ver certificado →') : h('span')));
    };
    const req = (s) => s.kind === 'act' ? `Para continuar: alcanza ≥ ${s.act.pass || 80}%` : s.kind === 'mastery' ? 'Para continuar: obtén ≥ 80%' : s.id === 'concept' ? 'Para continuar: abre todas las tarjetas' : '';
    const crumb = h('div', { class: 'row', style: 'margin-bottom:10px' }, h('span', { class: 'chip violet' }, `Nivel ${n} · ${lv.bloom}`), h('b', null, lv.name), h('span', { class: 'sp' }), h('div', { style: 'width:180px' }, A.ui.bar(Math.round(steps.filter(done).length / steps.length * 100))));
    V.append(h('div', { class: 'lvl' }, stepper, h('div', null, crumb, main, bar)));

    /* contenido del paso */
    if (cur.id === 'intro') {
      main.append(h('div', { class: 'card' }, h('h1', null, lv.icon + ' ' + lv.name), h('p', { class: 'muted', style: 'font-size:1.05rem' }, lv.narrative),
        h('div', { class: 'callout', html: '<b>🎯 Objetivo de aprendizaje (medible):</b> ' + lv.objective }),
        h('div', { class: 'where' }, h('div', null, h('b', null, 'Dónde estás'), `Nivel ${n} de 10 — ${lv.name}`), h('div', null, h('b', null, 'Qué aprenderás'), lv.subtitle), h('div', null, h('b', null, 'Qué harás'), `${lv.practice.length} práctica(s) interactiva(s), 1 reto aplicado y la evaluación de dominio.`), h('div', null, h('b', null, 'Para desbloquear el siguiente'), '≥ 80% en la evaluación de dominio, tras completar práctica y reto.'))));
      say(lv.voice.intro, { expr: 'explain', anim: 'welcome', key: `lvl${n}_intro` });
      A.guide.hintFn = () => say('Empieza leyendo el objetivo. Cada paso se desbloquea cuando demuestras lo aprendido en el anterior.', { expr: 'explain' });
    } else if (cur.id === 'concept') {
      const open = new Set(), cnt = h('p', { class: 'muted small' });
      const upd = () => { cnt.textContent = `Tarjetas abiertas: ${open.size}/${lv.concept.length}`; if (open.size === lv.concept.length && !L.seen.concept) { L.seen.concept = true; store.save(); drawNav(); sfx('unlock'); } };
      main.append(h('div', { class: 'card' }, h('h2', null, 'Conceptos clave'), h('p', { class: 'muted' }, 'Abre cada tarjeta. Está pensado para leer poco y practicar mucho.'), cnt, lv.concept.map((c, i) => { const body = h('div', { class: 'body', html: c.p, hidden: true }), tk = h('span', { class: 'tk' }); const a = h('div', { class: 'acc' }, h('button', { type: 'button', 'aria-expanded': 'false', onclick: () => { const o = a.classList.toggle('open'); body.hidden = !o; a.firstChild.setAttribute('aria-expanded', o); if (o) { open.add(i); tk.textContent = '✓'; sfx('click'); upd(); } } }, h('span', null, (i + 1) + '.'), c.h, tk), body); return a; })));
      upd();
      say('Lee con calma. Cuando abras todas las tarjetas se desbloquea el ejemplo.', { expr: 'explain', speak: false });
    } else if (cur.id === 'example') {
      main.append(h('div', { class: 'card' }, h('h2', null, 'Ejemplo práctico: ' + lv.example.title), h('div', { html: lv.example.html })));
      say('Observa el ejemplo: es el modelo de lo que vas a practicar.', { expr: 'explain', speak: false });
    } else if (cur.kind === 'act') {
      const a = cur.act, rec = store.act(n, a.id), pass = a.pass || 80; let hinted = false;
      const status = h('span', { class: 'chip ' + (rec.done ? 'green' : '') }, rec.done ? '✓ Completada · mejor ' + rec.score + '%' : 'Pendiente');
      const ctx = { pass, report(score, meta) {
        score = Math.max(0, Math.min(100, Math.round(score))); rec.attempts++; rec.score = Math.max(rec.score, score);
        const xpMax = Math.round(a.xp * (hinted ? .9 : 1) * rec.score / 100), d = xpMax - rec.xp;
        if (d > 0) { rec.xp = xpMax; store.addXP(d); xpFloat(d, status); }
        const first = !rec.done && score >= pass; if (first) { rec.done = true; store.markStudy(); store.grant('first', 'Primer paso', '🚀'); if (store.streakNow() >= 3) store.grant('streak3', 'Constancia', '🔥'); if (a.id === 'l1-hot' && score === 100) store.grant('hallu', 'Cazador de alucinaciones', '🔍'); }
        store.save(); status.className = 'chip ' + (rec.done ? 'green' : ''); status.textContent = rec.done ? '✓ Completada · mejor ' + rec.score + '%' : 'Intentos: ' + rec.attempts + ' · mejor ' + rec.score + '%';
        A.guide.react(score >= pass); if (first) { sfx('unlock'); toast('Actividad completada: +' + rec.xp + ' XP', 'ok'); } hud(); drawNav();
      } };
      A.guide.hintFn = () => { hinted = true; L.hints++; store.save(); say(a.hint || 'Lee la consigna con calma e intenta una primera respuesta; la retroalimentación te orientará.', { expr: 'think', anim: 'explain' }); };
      main.append(h('div', { class: 'card' }, h('div', { class: 'row', style: 'margin-bottom:8px' }, h('span', { class: 'chip ' + (cur.ch ? 'amber' : '') }, cur.ch ? '🎯 Reto aplicado' : '🧩 Práctica'), h('span', { class: 'chip violet' }, a.type === 'mcq' ? 'Quiz' : 'Interactivo'), h('span', { class: 'chip amber' }, '+' + a.xp + ' XP máx.'), status, h('span', { class: 'sp' }), h('button', { class: 'btn sm', type: 'button', onclick: () => A.guide.help() }, '💡 Pedir ayuda a Nova')),
        h('h2', null, a.title), h('div', { class: 'callout', html: '<b>Qué debes hacer:</b> ' + a.goal }), A.act[a.type](a, ctx)));
      say(cur.ch ? lv.voice.challenge : a.say || 'Adelante: lee la consigna y practica. Cuando necesites una pista, tócame.', { expr: 'explain', key: cur.ch ? `lvl${n}_challenge` : undefined, speak: !!cur.ch });
    } else if (cur.kind === 'mastery') {
      main.append(masteryCard(n, lv, L, drawNav));
      say('Evaluación de dominio. Necesitas ochenta por ciento o más para desbloquear el siguiente nivel. Puedes reintentar con retroalimentación.', { expr: 'explain', speak: false });
      A.guide.hintFn = () => say('Piensa en el porqué de cada respuesta. Las explicaciones al final de cada pregunta te ayudan a reintentar mejor.', { expr: 'think' });
    }
    drawNav();
  }

  function masteryCard(n, lv, L, drawNav) {
    const box = h('div', { class: 'card' }), start = () => {
      box.innerHTML = ''; box.append(h('span', { class: 'chip red' }, 'Evaluación sumativa · umbral 80%'), h('h2', { style: 'margin-top:8px' }, 'Evaluación de dominio — ' + lv.name),
        A.act.mcq({ questions: lv.mastery }, { pass: 80, report: (sc) => { L.mastery.attempts++; L.mastery.best = Math.max(L.mastery.best, sc); store.save(); if (sc >= 80) finish(n, lv, L, sc); drawNav(); if (sc >= 80 && n < 10) { box.append(h('button', { class: 'btn pri', type: 'button', style: 'margin-top:12px', onclick: () => go('#/level/' + (n + 1)) }, `Ir al Nivel ${n + 1} →`)); } else if (sc >= 80 && n === 10) box.append(h('button', { class: 'btn pri', type: 'button', style: 'margin-top:12px', onclick: () => go('#/certificate') }, 'Ver mi certificado →')); } }));
    };
    box.append(h('span', { class: 'chip red' }, 'Evaluación sumativa'), h('h2', { style: 'margin-top:8px' }, 'Evaluación de dominio'), h('p', { class: 'muted' }, `${lv.mastery.length} preguntas aplicadas. Necesitas 80% o más. Si no lo logras, recibes retroalimentación específica y puedes reintentar (las preguntas y opciones se barajan).`),
      L.mastery.best ? h('p', null, 'Tu mejor resultado: ', h('b', null, L.mastery.best + '%')) : null, h('button', { class: 'btn pri', type: 'button', onclick: start }, L.done ? 'Repetir evaluación' : 'Comenzar evaluación'));
    return box;
  }

  function finish(n, lv, L, score) {
    if (L.done) return; L.done = true; const bonus = 100 + Math.round(score / 2); store.addXP(bonus); const b = lv.badge; S().badges[b.id] = { t: Date.now(), level: n }; store.save();
    if (score === 100) store.grant('perfect', 'Perfeccionista', '💎'); if (!L.hints) store.grant('nohint', 'Sin pistas', '🧠'); if (n === 9 && score >= 90) store.grant('mcp90', 'Especialista MCP', '🛰');
    if (n === 10) { store.grant('architect', 'AI Architect', '🏆'); }
    sfx('levelup'); setTimeout(() => sfx('badge'), 700); confetti(); say(lv.voice.done, { expr: 'happy', anim: 'celebrate', key: `lvl${n}_done` });
    modal(n === 10 ? '🏆 ¡Eres AI ARCHITECT!' : '¡Nivel superado!', h('div', { class: 'badge' }, h('div', { class: 'em' }, b.icon), h('h3', null, 'Insignia: ' + b.name), h('p', { class: 'muted' }, `Evaluación: ${score}% · +${bonus} XP de bonificación.` + (n < 10 ? ` Se desbloquea el Nivel ${n + 1}.` : ' Tu certificado está disponible.'))), { closeLabel: 'Continuar' });
    hud();
  }

  /* ---------- arranque ---------- */
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => {
    applySettings(); buildHeader(); A.guide.mount();
    document.addEventListener('click', () => { }, { once: true });
    window.addEventListener('error', (e) => toast('Error inesperado: ' + e.message, 'bad'));
    route();
  });
  A.app = { go, surprise };
})();
