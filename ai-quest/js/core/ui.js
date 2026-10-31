(function () {
  const A = window.AIQ;
  const { esc, shuffle } = A.util;

  /* Element.append(null) escribiría el texto «null»: se ignoran null/undefined/false (patrón habitual en condicionales de UI). */
  const _append = Element.prototype.append;
  Element.prototype.append = function (...a) { return _append.apply(this, a.filter((x) => x != null && x !== false)); };

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(9).forEach((c) => { if (c == null || c === false) return; el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }

  function toast(msg, kind) {
    const t = h('div', { class: 'toast ' + (kind || ''), role: 'status' }, msg);
    document.getElementById('toasts').append(t);
    setTimeout(() => t.remove(), 4200);
  }

  function modal(title, content, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const prev = document.activeElement;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape' && !opts.locked) close(); };
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('h2', null, title), content,
      opts.noClose ? null : h('div', { class: 'row', style: 'margin-top:16px;justify-content:flex-end' }, h('button', { class: 'btn pri', onclick: close }, opts.closeLabel || 'Cerrar')));
    const bg = h('div', { class: 'modal-bg', onclick: (e) => { if (e.target === bg && !opts.locked) close(); } }, box);
    root.append(bg);
    document.addEventListener('keydown', onKey);
    const f = box.querySelector('button,input,select,textarea'); f && f.focus();
    return { close, box };
  }

  function xpFloat(n, anchor) {
    if (!n) return;
    const r = (anchor || document.body).getBoundingClientRect();
    const el = h('div', { class: 'xpfloat', style: `left:${Math.min(window.innerWidth - 90, Math.max(10, r.left + r.width / 2))}px;top:${Math.min(window.innerHeight - 100, Math.max(80, r.top))}px` }, '+' + n + ' XP');
    document.body.append(el);
    setTimeout(() => el.remove(), 1500);
  }

  function confetti() {
    if (!A.store.get().settings.motion) return;
    const c = document.getElementById('fx'), x = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const cols = ['#22d3ee', '#3b82f6', '#8b5cf6', '#fbbf24', '#34d399', '#f472b6'];
    const ps = Array.from({ length: 150 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 5, s: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }));
    let f = 0;
    (function tick() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.r += .1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); });
      if (++f < 170) requestAnimationFrame(tick); else x.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* Lista de criterios con ✓/✗ reutilizada por simuladores y retos. */
  function results(list) {
    return h('ul', { class: 'rl' }, list.map((r) => h('li', { class: r.ok ? 'ok' : 'no' }, h('span', { class: 'i' }, r.ok ? '✓' : '✗'), h('div', null, r.label, !r.ok && r.hint ? h('small', null, '💡 ' + r.hint) : null))));
  }
  function bar(pct) { return h('div', { class: 'bartrack', role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' })); }

  A.ui = { h, esc, shuffle, toast, modal, xpFloat, confetti, results, bar };
})();
