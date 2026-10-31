/* Audio: efectos sintetizados con Web Audio (reales, sin archivos) y voz.
   Voz: 1) si config.useAudioFiles y existe assets/audio/<clave>.mp3 se reproduce ese archivo;
        2) si no, se usa la síntesis de voz del navegador (SpeechSynthesis, es-419/es-MX/es-US). */
(function () {
  const A = window.AIQ;
  const cfg = { useAudioFiles: false, audioDir: 'assets/audio/' };
  let ctx = null, cur = null, last = null, paused = false;

  const PAT = {
    click: [[660, 0, .05, 'sine', .12]],
    correct: [[523, 0, .1, 'triangle', .2], [659, .1, .1, 'triangle', .2], [784, .2, .22, 'triangle', .2]],
    wrong: [[220, 0, .16, 'sawtooth', .07], [165, .13, .24, 'sawtooth', .07]],
    unlock: [[392, 0, .1, 'triangle', .2], [523, .1, .1, 'triangle', .2], [659, .2, .1, 'triangle', .2], [784, .3, .1, 'triangle', .2], [1047, .4, .35, 'triangle', .2]],
    badge: [[784, 0, .12, 'sine', .22], [988, .12, .12, 'sine', .22], [1319, .24, .4, 'sine', .22], [1760, .3, .5, 'sine', .08]],
    transition: [[300, 0, .22, 'sine', .1, 900]],
    warn: [[440, 0, .12, 'square', .05], [440, .2, .12, 'square', .05]],
    levelup: [[523, 0, .14, 'triangle', .22], [659, .14, .14, 'triangle', .22], [784, .28, .14, 'triangle', .22], [1047, .42, .5, 'triangle', .25], [1319, .55, .5, 'sine', .15]],
  };
  const st = () => A.store.get().settings;

  function ac() { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function sfx(name) {
    const s = st(); if (s.muted) return;
    const c = ac(); const p = PAT[name]; if (!c || !p) return;
    p.forEach(([f, t, d, type, g, f2]) => {
      const o = c.createOscillator(), gn = c.createGain(), t0 = c.currentTime + t;
      o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(g * s.volume, t0 + .01); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(gn).connect(c.destination); o.start(t0); o.stop(t0 + d + .05);
    });
  }

  function pickVoice() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const es = vs.filter((v) => /^es/i.test(v.lang));
    const score = (v) => (/419|MX|US|CO|AR|CL/i.test(v.lang) ? 4 : 0) + (/female|paulina|sabina|monica|mónica|helena|google|natural|online|sofia|elena/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
    return es.sort((a, b) => score(b) - score(a))[0] || null;
  }

  function stop() { if (window.speechSynthesis) speechSynthesis.cancel(); if (cur) { cur.pause(); cur = null; } paused = false; A.guide && A.guide.talking(false); }

  function speak(text, key) {
    last = { text, key };
    stop();
    if (st().muted) { A.guide.talking(false); return; }
    const viaTTS = () => {
      if (!window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text); const v = pickVoice();
      u.lang = v ? v.lang : 'es-MX'; if (v) u.voice = v; u.volume = st().volume; u.rate = st().rate || 1; u.pitch = 1.05;
      u.onstart = () => A.guide.talking(true); u.onend = u.onerror = () => A.guide.talking(false);
      speechSynthesis.speak(u);
    };
    if (cfg.useAudioFiles && key) {
      const a = new Audio(cfg.audioDir + key + '.mp3'); a.volume = st().volume; cur = a;
      a.onplay = () => A.guide.talking(true); a.onended = () => { cur = null; A.guide.talking(false); };
      a.onerror = () => { cur = null; viaTTS(); };
      a.play().catch(() => { cur = null; viaTTS(); });
    } else viaTTS();
  }
  function pause() { if (cur) cur.pause(); else if (window.speechSynthesis) speechSynthesis.pause(); paused = true; A.guide.talking(false); }
  function resume() { if (cur) cur.play(); else if (window.speechSynthesis) speechSynthesis.resume(); paused = false; A.guide.talking(true); }

  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => {};
  A.audio = {
    cfg, sfx, speak, stop, pause, resume,
    isPaused: () => paused,
    replay() { if (last) speak(last.text, last.key); },
    setMuted(m) { st().muted = m; if (m) stop(); A.store.save(); },
    setVolume(v) { st().volume = v; if (cur) cur.volume = v; A.store.save(); },
    hasTTS: () => !!window.speechSynthesis,
  };
})();
