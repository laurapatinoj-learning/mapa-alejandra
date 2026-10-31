/* Persistencia del progreso en localStorage (todo ocurre en el navegador). */
(function () {
  const A = window.AIQ;
  const KEY = 'aiquest.v1';
  const def = () => ({
    profile: null, diag: null, xp: 0,
    streak: { count: 0, last: null, best: 0 },
    levels: {}, badges: {}, ach: {},
    settings: { muted: false, volume: 0.8, subs: true, motion: true, contrast: false, font: 1, rate: 1 },
    stats: { labRuns: 0, surprise: 0, surpriseDay: null, surpriseToday: 0, hints: 0 },
    labLog: [],
  });
  let S;
  function load() {
    try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); S = Object.assign(def(), o); S.settings = Object.assign(def().settings, o.settings); S.stats = Object.assign(def().stats, o.stats); }
    catch (e) { S = def(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* modo privado: se sigue sin persistir */ } }
  load();

  const store = {
    get: () => S, save,
    reset() { S = def(); save(); },
    exportJSON: () => JSON.stringify(S, null, 2),
    importJSON(t) { const o = JSON.parse(t); if (typeof o !== 'object' || !('levels' in o)) throw new Error('Archivo inválido'); S = Object.assign(def(), o); save(); },
    level(n) { return S.levels[n] || (S.levels[n] = { seen: {}, acts: {}, mastery: { best: 0, attempts: 0 }, done: false, hints: 0 }); },
    act(n, id) { const L = store.level(n); return L.acts[id] || (L.acts[id] = { done: false, score: 0, xp: 0, attempts: 0 }); },
    unlocked: (n) => n === 1 || !!(S.levels[n - 1] && S.levels[n - 1].done),
    completed: () => Object.values(S.levels).filter((l) => l.done).length,
    progress() {
      let total = 0, done = 0;
      Object.keys(A.levels).forEach((k) => { const lv = A.levels[k]; const L = store.level(k); const acts = lv.practice.concat([lv.challenge]); total += acts.length + 1; done += acts.filter((a) => L.acts[a.id] && L.acts[a.id].done).length + (L.done ? 1 : 0); });
      return total ? Math.round((done / total) * 100) : 0;
    },
    addXP(n) { S.xp += n; save(); const e = document.getElementById('hud-xp'); if (e) e.textContent = S.xp; },
    playerLevel: () => Math.floor(S.xp / 300) + 1,
    markStudy() {
      const t = A.util.today(), s = S.streak;
      if (s.last === t) return;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      s.count = s.last === ys ? s.count + 1 : 1; s.last = t; s.best = Math.max(s.best, s.count); save();
    },
    streakNow() { const s = S.streak, t = A.util.today(); if (!s.last) return 0; const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); return (s.last === t || s.last === ys) ? s.count : 0; },
    grant(id, title, icon) { if (S.ach[id]) return false; S.ach[id] = { t: Date.now(), title, icon }; save(); A.ui.toast(`${icon} Logro: ${title}`, 'ok'); A.audio.sfx('badge'); return true; },
  };
  A.store = store;
})();
