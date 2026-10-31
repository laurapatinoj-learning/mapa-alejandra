/* Actividades tipo juego: memory (parejas), truefalse (vidas + combo), fillblank (completar espacios). */
(function () {
  const A = window.AIQ, { h, shuffle } = A.ui;
  const fb = (ok, html) => h('div', { class: 'fb ' + (ok === null ? 'info' : ok ? 'ok' : 'bad'), role: 'status', html });
  const sfx = (n) => A.audio.sfx(n);

  /* ---------- Memoria: une concepto ↔ significado ---------- */
  A.act.memory = function (cfg, ctx) {
    const root = h('div', { class: 'act memory' }), pairs = cfg.pairs;
    let cards, open, matched, moves, lock;
    const grid = h('div', { class: 'mem-grid' }), note = h('div'), info = h('div', { class: 'row' });
    function start() {
      cards = shuffle(pairs.flatMap((p, i) => [{ pair: i, t: p[0], term: true }, { pair: i, t: p[1], term: false }]));
      open = []; matched = new Set(); moves = 0; lock = false; note.innerHTML = ''; draw(); upd();
    }
    function upd() { info.innerHTML = ''; info.append(h('span', { class: 'chip' }, `Parejas ${matched.size}/${pairs.length}`), h('span', { class: 'chip violet' }, `Intentos ${moves}`)); }
    function draw() {
      grid.innerHTML = '';
      cards.forEach((c, i) => {
        const on = open.includes(i) || matched.has(c.pair);
        grid.append(h('button', { class: 'mem' + (on ? ' on' : '') + (matched.has(c.pair) ? ' ok' : '') + (c.term ? ' term' : ''), type: 'button', disabled: matched.has(c.pair), 'aria-label': on ? c.t : 'Carta oculta ' + (i + 1), onclick: () => pick(i) }, on ? c.t : '?'));
      });
    }
    function pick(i) {
      if (lock || open.includes(i) || matched.has(cards[i].pair)) return;
      sfx('click'); open.push(i); draw();
      if (open.length < 2) return;
      moves++; lock = true; const [a, b] = open.map((k) => cards[k]); upd();
      if (a.pair === b.pair) setTimeout(() => {
        matched.add(a.pair); open = []; lock = false; sfx('correct'); draw(); upd();
        note.innerHTML = ''; note.append(fb(true, `<b>${A.util.esc(pairs[a.pair][0])}</b> = ${A.util.esc(pairs[a.pair][1])}`));
        if (matched.size === pairs.length) finish();
      }, 400);
      else setTimeout(() => { open = []; lock = false; sfx('wrong'); draw(); }, 900);
    }
    function finish() {
      const score = A.util.clamp(100 - Math.max(0, moves - pairs.length * 3) * 3, 80, 100);
      note.append(fb(true, `<b>¡Tablero completo!</b> ${moves} intentos.`), h('button', { class: 'btn', type: 'button', onclick: start }, '↻ Jugar de nuevo'));
      ctx.report(score);
    }
    root.append(info, grid, note); start(); return root;
  };

  /* ---------- Verdadero o falso con vidas y combo ---------- */
  A.act.truefalse = function (cfg, ctx) {
    const root = h('div', { class: 'act tf' }), n = cfg.items.length, hearts = n - Math.ceil(0.8 * n) + 1;
    let order, i, right, lives, combo;
    function start() { order = shuffle(cfg.items); i = 0; right = 0; lives = hearts; combo = 0; render(); }
    function hud() { return h('div', { class: 'hud-tf' }, h('span', { class: 'hearts', 'aria-label': lives + ' vidas' }, '❤️'.repeat(lives) + '🖤'.repeat(hearts - lives)), h('span', { class: 'chip violet' }, '🔥 Combo x' + Math.max(1, combo)), h('span', { class: 'muted small' }, `${Math.min(i + 1, n)}/${n}`)); }
    function render() {
      root.innerHTML = ''; if (i >= n || lives <= 0) return end();
      const q = order[i], out = h('div');
      const mk = (v, label, cls) => h('button', { class: 'btn tf-b ' + cls, type: 'button', onclick: () => answer(v) }, label), bt = [mk(true, '✔ Verdadero', 'pri'), mk(false, '✘ Falso', '')];
      function answer(v) {
        bt.forEach((b) => (b.disabled = true)); const ok = v === q.a;
        if (ok) { right++; combo++; sfx('correct'); } else { lives--; combo = 0; sfx('wrong'); }
        out.append(fb(ok, (ok ? '<b>¡Correcto!</b> ' : '<b>No.</b> ') + q.e), h('button', { class: 'btn pri', type: 'button', onclick: () => { i++; render(); } }, (i + 1 >= n || lives <= 0) ? 'Ver resultado' : 'Siguiente →'));
        root.firstChild.replaceWith(hud());
      }
      root.append(hud(), h('div', { class: 'tf-card' }, h('div', { class: 'tf-q', html: q.t })), h('div', { class: 'row tf-row' }, bt), out);
    }
    function end() {
      const score = Math.round(right / n * 100), dead = lives <= 0;
      root.append(h('h3', null, `${right} de ${n} (${score}%)`), A.ui.bar(score), fb(score >= ctx.pass, dead ? '💔 Te quedaste sin vidas. Revisa las explicaciones y vuelve a intentarlo.' : score >= ctx.pass ? '¡Ronda superada!' : 'Casi. Inténtalo de nuevo.'));
      if (score < ctx.pass) root.append(h('button', { class: 'btn pri', type: 'button', onclick: start }, 'Reintentar'));
      ctx.report(score);
    }
    start(); return root;
  };

  /* ---------- Completar espacios (listas desplegables inline) ---------- */
  A.act.fillblank = function (cfg, ctx) {
    const root = h('div', { class: 'act fillblank' }), out = h('div'), sels = [];
    root.append(h('p', { class: 'muted' }, cfg.instructions || 'Elige la palabra correcta para cada espacio.'));
    cfg.items.forEach((it, qi) => {
      const parts = it.t.split('___'), line = h('div', { class: 'blank-line' });
      parts.forEach((txt, k) => {
        line.append(txt);
        if (k < parts.length - 1) {
          const b = it.blanks[k], s = h('select', { 'aria-label': `Espacio ${k + 1} de la frase ${qi + 1}`, class: 'blank' }, h('option', { value: '' }, '…'), shuffle(b.opts).map((o) => h('option', { value: o }, o)));
          sels.push({ s, b, qi }); line.append(s);
        }
      });
      root.append(h('div', { class: 'card blank-card' }, line));
    });
    root.append(h('button', { class: 'btn pri', type: 'button', onclick: () => {
      let ok = 0; const wrong = new Set();
      sels.forEach(({ s, b, qi }) => { const good = s.value === b.ans; s.className = 'blank ' + (good ? 'ok' : 'bad'); if (good) ok++; else wrong.add(qi); });
      const sc = Math.round(ok / sels.length * 100); out.innerHTML = '';
      out.append(fb(sc >= ctx.pass, `<b>${ok} de ${sels.length} espacios correctos (${sc}%).</b>` + (wrong.size ? '<ul>' + [...wrong].map((q) => `<li>${cfg.items[q].e}</li>`).join('') + '</ul>' : ' ' + (cfg.items[0].e ? '' : ''))));
      sc >= ctx.pass ? sfx('correct') : sfx('wrong'); ctx.report(sc);
    } }, 'Comprobar'), out);
    return root;
  };
})();
