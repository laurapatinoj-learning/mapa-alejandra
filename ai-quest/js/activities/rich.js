/* Actividades ricas: explorer, diagram, pipeline, designer (rúbrica configurable). */
(function () {
  const A = window.AIQ, { h } = A.ui, NS = 'http://www.w3.org/2000/svg';
  const fb = (ok, html) => h('div', { class: 'fb ' + (ok === null ? 'info' : ok ? 'ok' : 'bad'), role: 'status', html });
  const sfx = (n) => A.audio.sfx(n);

  /* ---------- Explorer: pestañas con contenido + comprobación opcional ---------- */
  A.act.explorer = function (cfg, ctx) {
    const root = h('div', { class: 'act explorer' }), seen = new Set(), body = h('div', { class: 'card' }), tabs = h('div', { class: 'tabs', role: 'tablist' });
    let checkDone = !cfg.check, checkEl = null;
    const btns = cfg.items.map((it, i) => { const b = h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': 'false', onclick: () => open(i) }, it.label, h('span', { class: 'v' }, '')); tabs.append(b); return b; });
    const info = h('p', { class: 'muted small' });
    function open(i) { sfx('click'); seen.add(i); btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.querySelector('.v').textContent = seen.has(k) ? ' ✓' : ''; }); body.innerHTML = cfg.items[i].html; upd(); }
    function upd() {
      info.textContent = `Explorados: ${seen.size}/${cfg.items.length}` + (seen.size < cfg.items.length ? ' — revisa todos para continuar.' : '');
      if (seen.size === cfg.items.length) {
        if (cfg.check && !checkEl) { checkEl = h('div', { style: 'margin-top:18px' }, h('h3', null, 'Comprueba lo que viste'), A.act.mcq({ questions: cfg.check }, { pass: ctx.pass, report: (s) => { ctx.report(s); } })); root.append(checkEl); }
        else if (!cfg.check) ctx.report(100);
      }
    }
    root.append(cfg.intro ? h('p', { class: 'muted', html: cfg.intro }) : null, tabs, body, info); open(0); return root;
  };

  /* ---------- Diagrama interactivo SVG ---------- */
  A.act.diagram = function (cfg, ctx) {
    const root = h('div', { class: 'act diagram' }), vis = new Set(); let step = -1;
    const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = mk('svg', { viewBox: `0 0 ${cfg.w} ${cfg.h}`, class: 'dg', role: 'group', 'aria-label': cfg.title });
    svg.append((() => { const d = mk('defs', {}); const m = mk('marker', { id: 'ar' + cfg.id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }); m.append(mk('path', { d: 'M0 0 L10 5 L0 10z', fill: '#8fa0ea' })); d.append(m); return d; })());
    const byId = {}; cfg.nodes.forEach((n) => (byId[n.id] = n));
    const edge = (n, tx, ty) => { const cx = n.x + n.w / 2, cy = n.y + n.h / 2, dx = tx - cx, dy = ty - cy, s = Math.min((n.w / 2) / (Math.abs(dx) || 1e-9), (n.h / 2) / (Math.abs(dy) || 1e-9)); return [cx + dx * s, cy + dy * s]; };
    cfg.nodes.filter((n) => n.group).forEach((n) => { const g = mk('g', { class: 'grp' }); g.append(mk('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 18 })); const t = mk('text', { x: n.x + 12, y: n.y + 20, class: 'sub' }); t.textContent = n.label; g.append(t); svg.append(g); });
    const edgeEls = cfg.edges.map((e) => {
      const a = byId[e.a], b = byId[e.b], [x1, y1] = edge(a, b.x + b.w / 2, b.y + b.h / 2), [x2, y2] = edge(b, a.x + a.w / 2, a.y + a.h / 2);
      const l = mk('line', { x1, y1, x2, y2, class: 'ed' + (e.dash ? ' dash' : ''), 'marker-end': `url(#ar${cfg.id})` }); if (e.both) l.setAttribute('marker-start', `url(#ar${cfg.id})`); svg.append(l);
      if (e.label) { const t = mk('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, class: 'lb', 'text-anchor': 'middle' }); t.textContent = e.label; svg.append(t); } return l;
    });
    const nodeEls = {};
    const panel = h('div', { class: 'card', style: 'margin-top:12px' }, h('p', { class: 'muted' }, 'Selecciona cualquier elemento del diagrama (clic o Enter) para ver su rol.'));
    cfg.nodes.filter((n) => !n.group).forEach((n) => {
      const g = mk('g', { class: 'nd ' + (n.c || ''), tabindex: 0, role: 'button', 'aria-label': n.label + '. ' + (n.sub || '') });
      g.append(mk('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 12 }));
      const t = mk('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + (n.sub ? -2 : 5), 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 13 }); t.textContent = n.label; g.append(t);
      if (n.sub) { const s = mk('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + 14, 'text-anchor': 'middle', class: 'sub' }); s.textContent = n.sub; g.append(s); }
      const sel = () => { sfx('click'); vis.add(n.id); g.classList.add('vis'); panel.innerHTML = `<h3>${n.label}</h3>${n.info}`; upd(); };
      g.addEventListener('click', sel); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } });
      svg.append(g); nodeEls[n.id] = g;
    });
    const total = cfg.nodes.filter((n) => !n.group).length, prog = h('p', { class: 'muted small' }), fl = h('div', { class: 'callout', style: 'display:none' });
    function upd() { prog.textContent = `Elementos explorados: ${vis.size}/${total}` + (cfg.flow ? ` · Recorrido: ${Math.max(0, step + 1)}/${cfg.flow.length}` : ''); if (vis.size === total && (!cfg.flow || step >= cfg.flow.length - 1)) ctx.report(100); }
    root.append(cfg.intro ? h('p', { class: 'muted', html: cfg.intro }) : null, svg, panel);
    if (cfg.flow) {
      const nb = h('button', { class: 'btn pri', type: 'button', onclick: () => {
        step = (step + 1) % cfg.flow.length; if (step === 0) { sfx('transition'); }
        Object.values(nodeEls).forEach((n) => n.classList.remove('hl')); edgeEls.forEach((e) => e.classList.remove('hl'));
        const s = cfg.flow[step]; (s.nodes || []).forEach((id) => { nodeEls[id].classList.add('hl'); vis.add(id); nodeEls[id].classList.add('vis'); }); (s.edges || []).forEach((i) => edgeEls[i].classList.add('hl'));
        fl.style.display = 'block'; fl.innerHTML = `<b>Paso ${step + 1} de ${cfg.flow.length}.</b> ${s.text}`; sfx('click'); nb.textContent = step === cfg.flow.length - 1 ? '↻ Repetir recorrido' : 'Siguiente paso del recorrido →'; upd();
      } }, '▶ Iniciar recorrido animado');
      root.append(h('div', { class: 'row', style: 'margin-top:12px' }, nb), fl);
    }
    root.append(prog); upd(); return root;
  };

  /* ---------- Constructor de pipelines / workflows por bloques ---------- */
  A.act.pipeline = function (cfg, ctx) {
    const root = h('div', { class: 'act pipeline' }); let seq = [], tries = 0;
    const canvas = h('div', { class: 'pipe' }), out = h('div');
    const TYPES = { trigger: '⚡ Disparador', data: '🗂 Datos', ai: '🤖 IA', cond: '🔀 Condición', action: '▶ Acción', human: '🧑 Humano', bad: '⚠' };
    const pal = h('div', { class: 'palette' }, cfg.blocks.map((b) => h('button', { class: 'pb t-' + b.type, type: 'button', onclick: () => { sfx('click'); seq.push(b.id); draw(); } }, h('b', null, '+ ' + b.label), h('small', null, (TYPES[b.type] || '') + (b.desc ? ' · ' + b.desc : '')))));
    function draw() {
      canvas.innerHTML = '';
      if (!seq.length) canvas.append(h('p', { class: 'muted' }, 'Tu flujo está vacío. Añade bloques desde la paleta: se ejecutarán de arriba hacia abajo.'));
      seq.forEach((id, i) => {
        const b = cfg.blocks.find((x) => x.id === id);
        canvas.append(h('div', { class: 'pn t-' + b.type }, h('span', { class: 'no' }, i + 1), h('span', { class: 'tx' }, h('b', null, b.label), h('br'), h('small', { class: 'muted' }, TYPES[b.type] || '')),
          h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Subir', disabled: i === 0, onclick: () => { [seq[i - 1], seq[i]] = [seq[i], seq[i - 1]]; draw(); } }, '▲'),
          h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Bajar', disabled: i === seq.length - 1, onclick: () => { [seq[i + 1], seq[i]] = [seq[i], seq[i + 1]]; draw(); } }, '▼'),
          h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Quitar', onclick: () => { seq.splice(i, 1); draw(); } }, '✕')));
        if (i < seq.length - 1) canvas.append(h('div', { class: 'arr' }, '↓'));
      });
    }
    root.append(cfg.scenario ? h('div', { class: 'callout', html: cfg.scenario }) : null, h('div', { class: 'lbl' }, 'Paleta de bloques'), pal, h('div', { class: 'lbl', style: 'margin-top:14px' }, 'Tu flujo'), canvas,
      h('div', { class: 'row' }, h('button', { class: 'btn pri', type: 'button', onclick: () => {
        tries++; const res = cfg.rules.map((r) => ({ label: r.label, w: r.w || 1, ok: !!r.check(seq, cfg.blocks), hint: r.hint }));
        const tot = res.reduce((a, r) => a + r.w, 0), sc = Math.round(res.filter((r) => r.ok).reduce((a, r) => a + r.w, 0) / tot * 100);
        out.innerHTML = ''; out.append(h('div', { class: 'meter' }, A.ui.bar(sc), h('b', null, sc + '%')), A.ui.results(res)); sc >= ctx.pass ? sfx('correct') : sfx('wrong');
        if (sc < ctx.pass && tries >= 2 && cfg.solution) out.append(fb(null, '<b>Una solución posible:</b> ' + cfg.solution));
        ctx.report(sc);
      } }, 'Evaluar flujo'), h('button', { class: 'btn', type: 'button', onclick: () => { seq = []; draw(); out.innerHTML = ''; } }, 'Vaciar')), out);
    draw(); return root;
  };

  /* ---------- Designer: formulario con rúbrica, variantes, vista previa y extra ---------- */
  A.act.designer = function (cfg, ctx) {
    const root = h('div', { class: 'act designer' }); let vi = 0, tries = 0; const V = cfg.variants || [null]; const vals = V.map(() => ({}));
    const cur = () => V[vi], fieldsOf = () => (cur() && cur().fields) || cfg.fields, rulesOf = () => (cur() && cur().rules) || cfg.rules;
    const body = h('div'), out = h('div'), prevBox = h('div');
    function setPrev() { if (!cfg.preview) return; prevBox.innerHTML = ''; prevBox.append(h('div', { class: 'preview' }, h('div', { class: 'pl' }, cfg.previewLabel || 'Vista previa'), h('div', { html: cfg.preview(vals[vi], cur() && cur().id) }))); }
    function render() {
      body.innerHTML = '';
      if (V.length > 1) { const t = h('div', { class: 'tabs', role: 'tablist' }); V.forEach((v, i) => t.append(h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': i === vi, onclick: () => { vi = i; out.innerHTML = ''; render(); } }, v.label))); body.append(t); }
      const sc = (cur() && cur().scenario) || cfg.scenario; sc && body.append(h('div', { class: 'callout', html: sc }));
      fieldsOf().forEach((f) => {
        const v = vals[vi]; let inp;
        if (f.kind === 'select') { inp = h('select', { id: 'f_' + f.id, onchange: (e) => { v[f.id] = e.target.value; setPrev(); } }, h('option', { value: '' }, '— selecciona —'), f.options.map((o) => h('option', { value: o.v !== undefined ? o.v : o, selected: v[f.id] === (o.v !== undefined ? o.v : o) }, o.t || o))); }
        else if (f.kind === 'multi') { v[f.id] = v[f.id] || []; inp = h('div', null, f.options.map((o) => { const val = o.v !== undefined ? o.v : o; return h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: v[f.id].includes(val), onchange: (e) => { const s = new Set(v[f.id]); e.target.checked ? s.add(val) : s.delete(val); v[f.id] = [...s]; setPrev(); } }), h('span', null, o.t || o)); })); }
        else if (f.kind === 'line') inp = h('input', { type: 'text', id: 'f_' + f.id, value: v[f.id] || '', placeholder: f.ph || '', oninput: (e) => { v[f.id] = e.target.value; setPrev(); } });
        else inp = h('textarea', { id: 'f_' + f.id, rows: f.rows || 3, placeholder: f.ph || '', oninput: (e) => { v[f.id] = e.target.value; setPrev(); } }, v[f.id] || '');
        body.append(h('div', { class: 'fld' }, h('label', { for: 'f_' + f.id, class: 'fl' }, f.label), f.help ? h('small', { html: f.help }) : null, inp));
      });
      setPrev();
    }
    const evalBtn = h('button', { class: 'btn pri', type: 'button', onclick: () => {
      tries++; const v = vals[vi], rules = rulesOf();
      const res = rules.map((r) => { let ok = false; try { ok = !!r.check(v, cur() && cur().id); } catch (e) { ok = false; } return { label: r.label, w: r.w || 1, ok, hint: r.hint, cat: r.cat }; });
      const tot = res.reduce((a, r) => a + r.w, 0), sc = Math.round(res.filter((r) => r.ok).reduce((a, r) => a + r.w, 0) / tot * 100);
      out.innerHTML = ''; out.append(h('div', { class: 'meter' }, A.ui.bar(sc), h('b', null, sc + '%')));
      if (cfg.cats) { const cb = h('div', { class: 'cbars' }); cfg.cats.forEach((c) => { const rs = res.filter((r) => r.cat === c.id); if (!rs.length) return; const t = rs.reduce((a, r) => a + r.w, 0), p = Math.round(rs.filter((r) => r.ok).reduce((a, r) => a + r.w, 0) / t * 100); cb.append(h('div', { class: 'r' }, h('span', null, `${c.label} (${c.weight}%)`), A.ui.bar(p), h('b', null, p + '%'))); }); out.append(cb); }
      out.append(A.ui.results(res));
      sc >= ctx.pass ? sfx('correct') : sfx('wrong');
      const smp = (cur() && cur().sample) || cfg.sample; if (sc < ctx.pass && tries >= 2 && smp) out.append(fb(null, '<b>Ejemplo de referencia (compáralo con el tuyo, no lo copies):</b><pre>' + A.util.esc(smp) + '</pre>'));
      A.store.get().stats.labRuns++; A.store.save(); ctx.report(sc, { variant: cur() && cur().id });
    } }, cfg.evalLabel || 'Evaluar');
    root.append(body, prevBox, h('div', { class: 'row' }, evalBtn, cfg.extra ? h('button', { class: 'btn', type: 'button', onclick: () => { sfx('transition'); extraOut.innerHTML = ''; extraOut.append(h('div', { class: 'preview' }, h('div', { class: 'pl' }, 'Simulación (no es un sistema real)'), h('div', { html: cfg.extra.run(vals[vi], cur() && cur().id) }))); } }, cfg.extra.label) : null), out);
    const extraOut = h('div'); root.append(extraOut);
    render(); return root;
  };
})();
