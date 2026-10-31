/* Utilidades sin DOM (también se cargan en Node para generar los guiones de voz). */
(function (root) {
  const A = (root.AIQ = root.AIQ || {});
  A.levels = A.levels || {};
  A.act = A.act || {};
  A.util = {
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    clamp: (n, a, b) => Math.max(a, Math.min(b, n)),
    words: (s) => (String(s || '').trim().match(/\S+/g) || []).length,
    has: (s, re) => re.test(String(s || '')),
    pick: (a) => a[Math.floor(Math.random() * a.length)],
    today: () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    safeJSON(s) { try { return { ok: true, v: JSON.parse(s) }; } catch (e) { return { ok: false, err: e.message }; } },
  };
  if (typeof module !== 'undefined') module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
