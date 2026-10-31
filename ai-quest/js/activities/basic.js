/* Actividades base: mcq, classify, match, order, flashcards, slider, branch, hotspot.
   Contrato: A.act[tipo](cfg, ctx) -> HTMLElement; llaman ctx.report(score 0-100) tras cada comprobación. */
(function () {
  const A = window.AIQ, { h, shuffle } = A.ui;
  const fb = (ok, html) => h('div', { class: 'fb ' + (ok === null ? 'info' : ok ? 'ok' : 'bad'), role: 'status', html });
  const sfx = (n) => A.audio.sfx(n);

  /* ---------- Selección múltiple / respuesta múltiple (con retroalimentación por pregunta) ---------- */
  A.act.mcq = function (cfg, ctx) {
    const root = h('div', { class: 'act mcq' }), qs = cfg.questions;
    let i = 0, right = 0, order = [];
    const start = () => { i = 0; right = 0; order = cfg.keepOrder ? qs.slice() : shuffle(qs); render(); };
    function render() {
      root.innerHTML = '';
      if (i >= order.length) return summary();
      const q = order[i], ans = q.a !== undefined ? q.a : q.answer, multi = Array.isArray(ans), set = new Set([].concat(ans));
      const opts = shuffle((q.o || q.options).map((t, k) => ({ t, k }))), picked = new Set();
      let locked = false;
      root.append(h('div', { class: 'q-head' }, h('span', { class: 'chip' }, `Pregunta ${i + 1} de ${order.length}`), multi && h('span', { class: 'chip violet' }, 'Marca todas las correctas')));
      root.append(h('h3', { class: 'q-text', html: q.q }));
      const out = h('div'), list = h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup' });
      const btns = opts.map((o) => {
        const b = h('button', { class: 'opt', type: 'button', 'aria-pressed': 'false', onclick: () => {
          if (locked) return; sfx('click');
          if (multi) { picked.has(o.k) ? picked.delete(o.k) : picked.add(o.k); b.classList.toggle('sel', picked.has(o.k)); b.setAttribute('aria-pressed', picked.has(o.k)); go.disabled = !picked.size; }
          else { picked.clear(); picked.add(o.k); submit(); }
        } }, o.t);
        b.dataset.k = o.k; list.append(b); return b;
      });
      const go = h('button', { class: 'btn pri', type: 'button', disabled: true, onclick: () => submit() }, 'Comprobar');
      function submit() {
        locked = true;
        const ok = picked.size === set.size && [...picked].every((k) => set.has(k));
        if (ok) right++;
        btns.forEach((b) => { const k = +b.dataset.k; b.disabled = true; if (set.has(k)) b.classList.add('ok'); else if (picked.has(k)) b.classList.add('bad'); });
        out.append(fb(ok, (ok ? '<b>¡Correcto!</b> ' : '<b>No exactamente.</b> ') + (q.e || q.explain || '')));
        ok ? sfx('correct') : sfx('wrong');
        go.remove();
        out.append(h('button', { class: 'btn pri', type: 'button', onclick: () => { i++; sfx('transition'); render(); } }, i + 1 >= order.length ? 'Ver resultado' : 'Siguiente pregunta →'));
      }
      root.append(list, multi ? go : null, out);
    }
    function summary() {
      const score = Math.round((right / order.length) * 100), pass = ctx.pass;
      root.append(h('h3', null, `Resultado: ${right} de ${order.length} (${score}%)`), A.ui.bar(score),
        cfg.diagnostic ? fb(null, 'Diagnóstico registrado. No tiene nota: es tu punto de partida para medir cuánto avanzas.')
          : fb(score >= pass, score >= pass ? `Superaste el umbral de dominio (${pass}%).` : `Necesitas ${pass}% para continuar. Repasa las explicaciones y reintenta: las preguntas se barajan cada vez.`));
      if (score < pass && !cfg.diagnostic) root.append(h('button', { class: 'btn pri', type: 'button', onclick: start }, 'Reintentar'));
      ctx.report(score);
    }
    start(); return root;
  };

  /* ---------- Clasificación (arrastrar o seleccionar + pulsar categoría) ---------- */
  A.act.classify = function (cfg, ctx) {
    const root = h('div', { class: 'act classify' });
    let items = shuffle(cfg.items.map((it, i) => Object.assign({}, it, { id: i, place: null, st: null }))), sel = null, checked = false;
    function put(id, cat) { const it = items.find((x) => x.id === id); if (it && !checked) { it.place = cat; sel = null; render(); } }
    const chip = (x) => h('button', { class: 'ch' + (sel === x.id ? ' sel' : '') + (x.st ? ' ' + x.st : ''), type: 'button', draggable: !checked, 'aria-label': x.t, onclick: () => { if (checked) return; sfx('click'); sel = sel === x.id ? null : x.id; render(); },
      ondragstart: (e) => e.dataTransfer.setData('text/plain', String(x.id)) }, x.t);
    function render() {
      root.innerHTML = '';
      root.append(h('p', { class: 'muted' }, cfg.instructions || 'Arrastra cada elemento a su categoría, o selecciónalo y pulsa el título de la categoría (funciona también con teclado).'));
      const pool = h('div', { class: 'pool', ondragover: (e) => e.preventDefault(), ondrop: (e) => { e.preventDefault(); put(+e.dataTransfer.getData('text/plain'), null); }, onclick: (e) => { if (sel !== null && e.target === pool) put(sel, null); } });
      items.filter((x) => x.place === null).forEach((x) => pool.append(chip(x)));
      root.append(h('div', { class: 'pool-wrap' }, h('div', { class: 'lbl' }, `Por clasificar (${items.filter((x) => x.place === null).length})`), pool));
      const cats = h('div', { class: 'cats' });
      cfg.categories.forEach((c) => {
        const box = h('div', { class: 'cat', ondragover: (e) => { e.preventDefault(); box.classList.add('over'); }, ondragleave: () => box.classList.remove('over'), ondrop: (e) => { e.preventDefault(); put(+e.dataTransfer.getData('text/plain'), c.id); } },
          h('button', { class: 'cat-h', type: 'button', 'aria-label': 'Colocar en ' + c.label, onclick: () => { if (sel !== null) { sfx('click'); put(sel, c.id); } } }, h('b', null, c.label), c.desc && h('small', null, c.desc)),
          h('div', { class: 'cat-items' }, items.filter((x) => x.place === c.id).map(chip)));
        cats.append(box);
      });
      root.append(cats);
      const left = items.filter((x) => x.place === null).length;
      const out = h('div');
      if (!checked) root.append(h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn pri', type: 'button', disabled: left > 0, onclick: check }, 'Comprobar clasificación'), left ? h('span', { class: 'muted small' }, `Faltan ${left}`) : null));
      root.append(out);
      if (checked) {
        const wrong = items.filter((x) => x.st === 'bad'), ok = items.length - wrong.length, score = Math.round(ok / items.length * 100);
        out.append(fb(!wrong.length, `<b>${ok} de ${items.length} correctos (${score}%).</b>` + (wrong.length ? '<ul>' + wrong.map((x) => `<li><b>${A.util.esc(x.t)}</b> → ${A.util.esc(cfg.categories.find((c) => c.id === x.cat).label)}. ${A.util.esc(x.why || '')}</li>`).join('') + '</ul>' : ' Todo en su lugar.')));
        if (score < 100) out.append(h('button', { class: 'btn pri', type: 'button', onclick: () => { items.forEach((x) => { if (x.st === 'bad') x.place = null; x.st = x.st === 'ok' ? 'ok' : null; }); checked = false; render(); } }, 'Reintentar los incorrectos'));
      }
    }
    function check() { checked = true; items.forEach((x) => (x.st = x.place === x.cat ? 'ok' : 'bad')); const s = Math.round(items.filter((x) => x.st === 'ok').length / items.length * 100); s === 100 ? sfx('correct') : sfx('wrong'); render(); ctx.report(s); }
    render(); return root;
  };

  /* ---------- Emparejar (listas desplegables accesibles) ---------- */
  A.act.match = function (cfg, ctx) {
    const root = h('div', { class: 'act match' });
    const rights = shuffle(cfg.pairs.map((p) => p[1]));
    const sels = cfg.pairs.map((p) => { const s = h('select', { 'aria-label': 'Pareja de: ' + p[0] }, h('option', { value: '' }, '— elige —'), rights.map((r) => h('option', { value: r }, r))); return s; });
    const out = h('div');
    root.append(h('p', { class: 'muted' }, cfg.instructions || 'Une cada elemento de la izquierda con su pareja correcta.'));
    cfg.pairs.forEach((p, i) => root.append(h('div', { class: 'mrow' }, h('div', null, h('b', null, p[0])), sels[i])));
    root.append(h('button', { class: 'btn pri', type: 'button', onclick: () => {
      let ok = 0; out.innerHTML = '';
      const bad = [];
      cfg.pairs.forEach((p, i) => { const good = sels[i].value === p[1]; sels[i].className = good ? 'ok' : 'bad'; if (good) ok++; else bad.push(p); });
      const sc = Math.round(ok / cfg.pairs.length * 100);
      out.append(fb(!bad.length, `<b>${ok} de ${cfg.pairs.length} correctas.</b>` + (bad.length ? ' Revisa: ' + bad.map((p) => `<br>• <b>${A.util.esc(p[0])}</b> ↔ ${A.util.esc(p[1])}`).join('') : '')));
      sc === 100 ? sfx('correct') : sfx('wrong'); ctx.report(sc);
    } }, 'Comprobar emparejamientos'), out);
    return root;
  };

  /* ---------- Ordenar (arrastrar o botones ▲▼) ---------- */
  A.act.order = function (cfg, ctx) {
    const root = h('div', { class: 'act order' });
    let arr = shuffle(cfg.items.map((t, i) => ({ t, i, st: null }))), drag = null;
    if (arr.every((x, k) => x.i === k)) arr.reverse();
    function render(msg) {
      root.innerHTML = '';
      root.append(h('p', { class: 'muted' }, cfg.instructions || 'Ordena los pasos. Arrastra o usa los botones ▲ ▼.'));
      const ul = h('ol', { class: 'ord' });
      arr.forEach((x, k) => {
        const li = h('li', { class: x.st || '', draggable: 'true', ondragstart: () => { drag = k; li.classList.add('drag'); }, ondragend: () => li.classList.remove('drag'), ondragover: (e) => e.preventDefault(), ondrop: () => { if (drag === null) return; const [m] = arr.splice(drag, 1); arr.splice(k, 0, m); drag = null; arr.forEach((a) => (a.st = null)); render(); } },
          h('b', null, k + 1 + '.'), h('span', { class: 'sp' }, x.t),
          h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Subir', disabled: k === 0, onclick: () => { [arr[k - 1], arr[k]] = [arr[k], arr[k - 1]]; arr.forEach((a) => (a.st = null)); render(); } }, '▲'),
          h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Bajar', disabled: k === arr.length - 1, onclick: () => { [arr[k + 1], arr[k]] = [arr[k], arr[k + 1]]; arr.forEach((a) => (a.st = null)); render(); } }, '▼'));
        ul.append(li);
      });
      root.append(ul, h('button', { class: 'btn pri', type: 'button', onclick: () => {
        arr.forEach((x, k) => (x.st = x.i === k ? 'ok' : 'bad'));
        const ok = arr.filter((x) => x.st === 'ok').length, sc = Math.round(ok / arr.length * 100);
        sc === 100 ? sfx('correct') : sfx('wrong'); render(); root.append(fb(sc === 100, sc === 100 ? '<b>Secuencia correcta.</b> ' + (cfg.explain || '') : `<b>${ok} de ${arr.length} en su posición.</b> Las marcadas en rojo no están donde corresponde; piensa qué necesita cada paso del anterior.`)); ctx.report(sc);
      } }, 'Comprobar orden'));
      msg && root.append(msg);
    }
    render(); return root;
  };

  /* ---------- Flashcards ---------- */
  A.act.flashcards = function (cfg, ctx) {
    const root = h('div', { class: 'act flash' }), seen = new Set(), known = new Set();
    const info = h('p', { class: 'muted' });
    const upd = () => { info.textContent = `Giradas: ${seen.size}/${cfg.cards.length} · Dominadas: ${known.size}`; if (seen.size === cfg.cards.length && known.size === cfg.cards.length) ctx.report(100); };
    root.append(info, h('p', { class: 'small muted' }, 'Gira cada tarjeta (clic / Enter), intenta recordar la respuesta antes de verla y marca si la dominas.'));
    const g = h('div', { class: 'grid g3' });
    cfg.cards.forEach((c, i) => {
      const card = h('button', { class: 'flip', type: 'button', 'aria-label': 'Tarjeta ' + (i + 1) + ': ' + c.f, onclick: () => { sfx('click'); card.classList.toggle('on'); seen.add(i); upd(); } },
        h('div', null, h('div', { class: 'f' }, c.f), h('div', { class: 'b', html: c.b })));
      const mk = h('button', { class: 'btn sm', type: 'button', onclick: (e) => { known.has(i) ? known.delete(i) : known.add(i); mk.textContent = known.has(i) ? '✓ La domino' : 'Marcar como dominada'; mk.classList.toggle('pri', known.has(i)); if (known.has(i)) sfx('correct'); upd(); } }, 'Marcar como dominada');
      g.append(h('div', null, card, h('div', { style: 'margin-top:6px;text-align:center' }, mk)));
    });
    root.append(g); upd(); return root;
  };

  /* ---------- Sliders de criterio ---------- */
  A.act.slider = function (cfg, ctx) {
    const root = h('div', { class: 'act slider' }), out = h('div'), inputs = [];
    root.append(h('p', { class: 'muted' }, cfg.instructions || 'Ajusta cada control al valor que consideres adecuado y comprueba.'));
    cfg.items.forEach((it, i) => {
      const val = h('span', { class: 'val' });
      const inp = h('input', { type: 'range', min: it.min, max: it.max, step: it.step || 1, value: Math.round((it.min + it.max) / 2), 'aria-label': it.q, oninput: () => { val.textContent = fmt(); } });
      const fmt = () => inp.value + (it.unit ? ' ' + it.unit : '');
      val.textContent = fmt(); inputs.push(inp);
      root.append(h('div', { class: 'slr' }, h('div', { html: '<b>' + it.q + '</b>' }), inp, h('div', { class: 'ends' }, h('span', null, it.lo), val, h('span', null, it.hi))));
    });
    root.append(h('button', { class: 'btn pri', type: 'button', onclick: () => {
      out.innerHTML = ''; let ok = 0;
      cfg.items.forEach((it, i) => { const v = +inputs[i].value, good = v >= it.ok[0] && v <= it.ok[1]; if (good) ok++; out.append(fb(good, `<b>${good ? '✓' : '✗'} ${it.name || 'Valor ' + v}:</b> ${it.explain}${good ? '' : ` (rango recomendado: ${it.ok[0]}–${it.ok[1]}${it.unit ? ' ' + it.unit : ''})`}`)); });
      const sc = Math.round(ok / cfg.items.length * 100); sc >= ctx.pass ? sfx('correct') : sfx('wrong'); ctx.report(sc);
    } }, 'Comprobar'), out);
    return root;
  };

  /* ---------- Escenario ramificado ---------- */
  A.act.branch = function (cfg, ctx) {
    const root = h('div', { class: 'act branch' });
    function play() {
      let id = cfg.start, pts = 0; const trail = [];
      function scene() {
        root.innerHTML = ''; const s = cfg.scenes[id];
        if (trail.length) root.append(h('div', { class: 'muted small' }, 'Decisiones: ' + trail.join(' → ')));
        root.append(h('div', { class: 'callout', html: s.text }));
        if (s.end) {
          const sc = Math.min(100, Math.round(pts / cfg.max * 100));
          root.append(fb(sc >= ctx.pass, `<b>Puntaje de criterio: ${pts}/${cfg.max} (${sc}%).</b> ${s.lesson || ''}`));
          sc >= ctx.pass ? sfx('correct') : sfx('wrong'); ctx.report(sc);
          if (sc < 100) root.append(h('button', { class: 'btn pri', type: 'button', onclick: play }, 'Explorar otro camino'));
          return;
        }
        const list = h('div', { class: 'opts' });
        s.choices.forEach((c, k) => list.append(h('button', { class: 'opt', type: 'button', onclick: () => {
          sfx('click'); pts += c.pts; trail.push(String.fromCharCode(65 + k));
          root.innerHTML = ''; root.append(h('div', { class: 'callout', html: s.text }), fb(c.pts >= 2 ? true : c.pts === 1 ? null : false, `<b>Elegiste:</b> ${A.util.esc(c.t)}<br>${c.fb}`),
            h('button', { class: 'btn pri', type: 'button', onclick: () => { id = c.next; sfx('transition'); scene(); } }, 'Continuar'));
        } }, h('b', null, String.fromCharCode(65 + k) + '. '), c.t)));
        root.append(list);
      }
      scene();
    }
    play(); return root;
  };

  /* ---------- Hotspots sobre texto ---------- */
  A.act.hotspot = function (cfg, ctx) {
    const root = h('div', { class: 'act hotspot' }), sel = new Set(), out = h('div');
    root.append(h('p', { class: 'muted' }, cfg.instruction), cfg.intro ? h('div', { class: 'callout', html: cfg.intro }) : null);
    const box = h('div', { class: cfg.code ? 'term' : 'docbox', style: cfg.code ? 'height:auto;font-size:.85rem' : '' });
    const spans = cfg.segments.map((s, i) => {
      if (s.plain) { return h('span', null, s.t); }
      const el = h('span', { class: 'seg', role: 'button', tabindex: 0, 'aria-pressed': 'false', onclick: tog, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } } }, s.t);
      function tog() { sfx('click'); sel.has(i) ? sel.delete(i) : sel.add(i); el.classList.toggle('sel', sel.has(i)); el.setAttribute('aria-pressed', sel.has(i)); }
      box.append(el, ' '); return el;
    });
    // los segmentos de texto plano se insertan en orden
    box.innerHTML = ''; cfg.segments.forEach((s, i) => { box.append(spans[i], ' '); });
    root.append(box, h('button', { class: 'btn pri', type: 'button', style: 'margin-top:12px', onclick: () => {
      const flags = cfg.segments.map((s, i) => (s.flag ? i : -1)).filter((i) => i >= 0);
      let tp = 0, fp = 0;
      cfg.segments.forEach((s, i) => { const e = spans[i]; if (!e.classList || !e.classList.contains('seg')) return; e.classList.remove('sel');
        if (s.flag && sel.has(i)) { tp++; e.classList.add('ok'); } else if (s.flag) e.classList.add('bad'); else if (sel.has(i)) { fp++; e.classList.add('bad'); } });
      const sc = Math.max(0, Math.round((tp - fp * .5) / flags.length * 100));
      out.innerHTML = ''; out.append(fb(sc >= ctx.pass, `<b>Encontraste ${tp} de ${flags.length}${fp ? `, con ${fp} falsa(s) alarma(s)` : ''} (${sc}%).</b><ul>` + cfg.segments.filter((s) => s.why).map((s) => `<li><b>«${A.util.esc(s.t.slice(0, 60))}${s.t.length > 60 ? '…' : ''}»</b> — ${s.why}</li>`).join('') + '</ul>'));
      sc >= ctx.pass ? sfx('correct') : sfx('wrong'); ctx.report(sc);
    } }, 'Comprobar'), out);
    return root;
  };
})();
