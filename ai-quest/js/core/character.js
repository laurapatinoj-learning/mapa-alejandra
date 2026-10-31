/* NOVA — personaje original de AI QUEST, inspirado en la imagen de referencia:
   cabello largo, liso, castaño con reflejos caramelo y raya al centro-lado; ojos marrones;
   piel cálida; sonrisa suave y segura; cabeza ligeramente inclinada; top tejido (trenzas) ámbar y hombros descubiertos.
   Es una ilustración vectorial en capas con profundidad 2.5D (parallax + perspectiva CSS), no un modelo 3D real. */
(function () {
  const A = window.AIQ;
  const { h } = A.ui;

  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="nvAura"><stop offset="0" stop-color="#22d3ee" stop-opacity=".45"/><stop offset=".6" stop-color="#8b5cf6" stop-opacity=".18"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
    <radialGradient id="nvAuraR"><stop offset="0" stop-color="#f87171" stop-opacity=".5"/><stop offset="1" stop-color="#f87171" stop-opacity="0"/></radialGradient>
    <radialGradient id="nvAuraG"><stop offset="0" stop-color="#fbbf24" stop-opacity=".55"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
    <linearGradient id="nvHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a2a1a"/><stop offset=".55" stop-color="#7a4426"/><stop offset="1" stop-color="#b8703c"/></linearGradient>
    <linearGradient id="nvSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1c4a0"/><stop offset="1" stop-color="#dca47f"/></linearGradient>
    <linearGradient id="nvTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9893a"/><stop offset="1" stop-color="#a8591c"/></linearGradient>
    <clipPath id="nvTopClip"><path d="M58 292 C58 252 74 228 100 212 C108 236 132 236 140 212 C166 228 182 252 182 292Z"/></clipPath>
  </defs></svg>`;

  function svg() {
    let knit = '';
    for (let x = 66; x <= 176; x += 13) knit += `<path d="M${x} 212 q6 9 0 18 q-6 9 0 18 q6 9 0 18 q-6 9 0 18"/>`;
    return `<svg class="nova-svg" viewBox="0 0 240 290" role="img" aria-label="Nova, guía de AI QUEST">
<g class="l-aura"><circle class="aura" cx="120" cy="150" r="118" fill="url(#nvAura)"/><ellipse class="ring" cx="120" cy="150" rx="106" ry="30" fill="none" stroke="#22d3ee" stroke-width="1.6" opacity=".65"/></g>
<g class="head hb"><path d="M64 120 C58 64 88 30 120 30 C152 30 182 64 176 120 C180 170 188 214 176 252 L64 252 C52 214 60 170 64 120Z" fill="url(#nvHair)"/></g>
<g class="body">
  <path d="M24 292 C24 246 52 222 100 208 L140 208 C188 222 216 246 216 292Z" fill="url(#nvSkin)"/>
  <path d="M103 160 L137 160 L139 214 C128 224 112 224 101 214Z" fill="#dba282"/>
  <path d="M58 292 C58 252 74 228 100 212 C108 236 132 236 140 212 C166 228 182 252 182 292Z" fill="url(#nvTop)"/>
  <g clip-path="url(#nvTopClip)"><g stroke="#7a3d10" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round">${knit}</g></g>
  <path d="M100 212 C108 236 132 236 140 212" fill="none" stroke="#7a3d10" stroke-width="2" opacity=".5"/>
</g>
<g class="head">
  <ellipse cx="120" cy="120" rx="52" ry="58" fill="url(#nvSkin)"/>
  <ellipse cx="88" cy="138" rx="11" ry="6.5" fill="#ef7f86" opacity=".45"/><ellipse cx="152" cy="138" rx="11" ry="6.5" fill="#ef7f86" opacity=".45"/>
  <g class="eyes">
    <g class="eye"><ellipse cx="98" cy="116" rx="9.5" ry="8" fill="#fff"/><g class="pupil"><circle cx="98" cy="116" r="6.6" fill="#5a3320"/><circle cx="98" cy="116" r="3.4" fill="#1d0f0a"/><circle cx="100.5" cy="113.5" r="2.1" fill="#fff"/></g><path d="M87 115 Q98 104 110 115" fill="none" stroke="#24120c" stroke-width="2.6" stroke-linecap="round"/><path d="M86 116 l-4 -3 M89 111 l-3 -4" stroke="#24120c" stroke-width="1.6" stroke-linecap="round"/></g>
    <g class="eye"><ellipse cx="142" cy="116" rx="9.5" ry="8" fill="#fff"/><g class="pupil"><circle cx="142" cy="116" r="6.6" fill="#5a3320"/><circle cx="142" cy="116" r="3.4" fill="#1d0f0a"/><circle cx="144.5" cy="113.5" r="2.1" fill="#fff"/></g><path d="M130 115 Q142 104 153 115" fill="none" stroke="#24120c" stroke-width="2.6" stroke-linecap="round"/><path d="M154 116 l4 -3 M151 111 l3 -4" stroke="#24120c" stroke-width="1.6" stroke-linecap="round"/></g>
  </g>
  <path class="brow brow-l" d="M84 99 Q97 92 110 98" fill="none" stroke="#3b2114" stroke-width="3.4" stroke-linecap="round"/>
  <path class="brow brow-r" d="M130 98 Q143 92 156 99" fill="none" stroke="#3b2114" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M120 124 Q116 138 119 142 Q124 144 126 141" fill="none" stroke="#c98b6c" stroke-width="2" stroke-linecap="round" opacity=".8"/>
  <g class="mouth">
    <g class="m-smile"><path d="M104 158 Q119 168 135 156 Q120 163 104 158Z" fill="#d2737b" stroke="#b9545c" stroke-width="2.4" stroke-linejoin="round"/></g>
    <g class="m-happy"><path d="M102 154 Q120 182 138 154 Q120 160 102 154Z" fill="#8a2f3b"/><path d="M106 155 Q120 162 134 155 Q120 158 106 155Z" fill="#fff"/></g>
    <g class="m-open"><ellipse cx="120" cy="164" rx="7" ry="9" fill="#7a2733"/></g>
    <g class="m-flat"><path d="M108 163 L132 163" stroke="#b9545c" stroke-width="3.2" stroke-linecap="round"/></g>
    <g class="m-think"><path d="M108 164 Q118 160 132 163" fill="none" stroke="#b9545c" stroke-width="3.2" stroke-linecap="round"/></g>
    <g class="m-talk"><ellipse cx="120" cy="162" rx="9" ry="7.5" fill="#7a2733"/></g>
  </g>
  <path d="M120 28 C92 28 66 56 64 112 C62 160 62 206 72 252 C82 258 92 254 94 244 C92 214 86 186 80 160 C76 140 78 118 88 96 C98 74 110 50 120 28Z" fill="url(#nvHair)"/>
  <path d="M120 28 C148 28 174 56 176 112 C178 160 178 206 168 252 C158 258 148 254 146 244 C148 214 154 186 160 160 C164 140 162 118 152 96 C142 74 130 50 120 28Z" fill="url(#nvHair)"/>
  <path d="M72 90 C68 140 70 200 76 240 M168 90 C172 140 170 200 164 240 M106 44 C90 62 84 84 84 110" fill="none" stroke="#d98a4e" stroke-width="2.4" opacity=".55" stroke-linecap="round"/>
  <circle cx="64" cy="130" r="10" fill="#0b1226" stroke="#22d3ee" stroke-width="2.4"/><circle cx="64" cy="130" r="4" fill="#22d3ee"/>
  <path d="M64 140 C66 170 86 176 106 170" fill="none" stroke="#22d3ee" stroke-width="2.4" stroke-linecap="round"/><circle cx="108" cy="170" r="3.6" fill="#22d3ee"/>
</g>
<g class="fx" fill="#fbbf24"><path d="M30 60 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><path d="M200 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M208 150 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#22d3ee"/><path d="M24 160 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#8b5cf6"/></g>
</svg>`;
  }

  const els = () => document.querySelectorAll('.nova');
  let t1 = 0, t2 = 0;
  function create(cls) { return h('div', { class: 'nova ' + (cls || ''), 'data-expr': 'neutral', html: svg() }); }
  function set(expr, anim) {
    els().forEach((e) => {
      e.dataset.expr = expr || 'neutral';
      e.dataset.mood = expr === 'warn' ? 'warn' : anim === 'celebrate' ? 'gold' : '';
      e.className = e.className.replace(/\ba-\w+/g, '').trim();
      if (anim) { void e.offsetWidth; e.classList.add('a-' + anim); }
    });
    clearTimeout(t1); t1 = setTimeout(() => els().forEach((e) => { e.className = e.className.replace(/\ba-\w+/g, '').trim(); e.dataset.mood = ''; if (e.dataset.expr !== 'neutral') e.dataset.expr = 'neutral'; }), anim === 'celebrate' ? 2600 : 3800);
  }

  /* Seguimiento del cursor: perspectiva + parallax + pupilas */
  document.addEventListener('pointermove', (e) => {
    if (!A.store.get().settings.motion) return;
    const nx = (e.clientX / innerWidth - .5) * 2, ny = (e.clientY / innerHeight - .5) * 2;
    els().forEach((n) => { n.style.setProperty('--ry', (nx * 10).toFixed(1) + 'deg'); n.style.setProperty('--rx', (-ny * 7).toFixed(1) + 'deg'); n.style.setProperty('--tx', (nx * 4).toFixed(1)); n.style.setProperty('--ty', (ny * 2).toFixed(1)); n.style.setProperty('--px', (nx * 3).toFixed(1) + 'px'); n.style.setProperty('--py', (ny * 2).toFixed(1) + 'px'); });
  });

  /* Guía permanente */
  let box, bubble, txt, playBtn, hideT = 0;
  function mount() {
    document.body.insertAdjacentHTML('afterbegin', DEFS);
    const root = document.getElementById('guide');
    txt = h('div', { class: 'txt', 'aria-live': 'polite' });
    playBtn = h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Pausar o reanudar voz', onclick: () => { A.audio.isPaused() ? A.audio.resume() : A.audio.pause(); playBtn.textContent = A.audio.isPaused() ? '▶' : '⏸'; } }, '⏸');
    const vol = h('input', { type: 'range', min: 0, max: 1, step: .05, value: A.store.get().settings.volume, 'aria-label': 'Volumen de la voz', oninput: (e) => A.audio.setVolume(+e.target.value) });
    const mute = h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Silenciar o activar audio', onclick: () => { const m = !A.store.get().settings.muted; A.audio.setMuted(m); mute.textContent = m ? '🔇' : '🔊'; syncHud(); } }, A.store.get().settings.muted ? '🔇' : '🔊');
    bubble = h('div', { class: 'bubble', role: 'complementary', 'aria-label': 'Mensaje de Nova' },
      h('div', { class: 'who' }, 'NOVA · tu guía'), txt,
      h('div', { class: 'ctl' }, playBtn,
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Repetir mensaje', onclick: () => { A.audio.replay(); playBtn.textContent = '⏸'; } }, '↻'), mute, vol,
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Ocultar mensaje', onclick: () => bubble.classList.add('hidden') }, '✕')));
    const ch = h('button', { class: 'gchar', type: 'button', 'aria-label': 'Pedir ayuda a Nova', onclick: () => { A.guide.help(); } }, create());
    root.append(bubble, ch);
    bubble.classList.add('hidden');
  }
  function syncHud() { const b = document.getElementById('hud-mute'); if (b) b.textContent = A.store.get().settings.muted ? '🔇' : '🔊'; }

  A.guide = {
    mount, create, set, syncHud,
    talking(on) { els().forEach((e) => e.classList.toggle('talking', !!on)); },
    /* say(clave|texto, {expr, anim, speak}) */
    say(k, o) {
      o = o || {};
      const text = (A.voice && A.voice[k]) || (k && k.length > 24 ? k : null) || k;
      if (!text) return;
      txt.textContent = text; clearTimeout(hideT); hideT = setTimeout(() => bubble.classList.add('hidden'), Math.max(9000, text.length * 75));
      const subs = A.store.get().settings.subs;
      bubble.classList.toggle('hidden', !subs && !o.force);
      set(o.expr || 'explain', o.anim || 'explain');
      if (o.speak !== false) { A.audio.speak(text, A.voice && A.voice[k] ? k : o.key); playBtn.textContent = '⏸'; }
    },
    help() { const fn = A.guide.hintFn; const s = A.store.get(); s.stats.hints++; A.store.save(); if (fn) { fn(); } else A.guide.say('help_default', { expr: 'happy', anim: 'welcome' }); },
    react(ok, bank) {
      if (ok) { A.audio.sfx('correct'); A.guide.say(A.util.pick(['correct_1', 'correct_2', 'correct_3', 'correct_4']), { expr: 'happy', anim: 'explain' }); }
      else { A.audio.sfx('wrong'); A.guide.say(A.util.pick(['wrong_1', 'wrong_2', 'wrong_3']), { expr: 'think', anim: 'surprise' }); }
    },
    hintFn: null,
  };
})();
