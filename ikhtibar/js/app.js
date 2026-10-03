/* اختبارات إيليا — العلوم والاجتماعيات (الصف الأول)
   المحرّك: لكل نوع سؤالٍ عارضٌ في R يرسم المسرح ويعيد وعداً يُحَلّ عند الإجابة الصحيحة.
   النجوم: من أول محاولة ٣، بخطأ أو خطأين ٢، وأكثر ١ — ولا يَعلَق أبداً: بعد خطأين يظهر التلميح.
   وضع الاختبار: #test في الرابط يعلّم الصحيح بـdata-ok ويكشف window.__t.solve(). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.random() * a.length | 0];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const TEST = /#test/.test(location.hash);
const KEY = 'elia-tests-v1';

/* ---------- القوام (نفس قوام الموقع) ---------- */
(function tex() {
  const R = document.documentElement.style;
  const make = (fn, seed) => { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); let s = seed;
    const r = () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.fillStyle = fn(i, j, r); x.fillRect(i, j, 1, 1); } return 'url(' + c.toDataURL() + ')'; };
  const p = a => r => a[r() * a.length | 0];
  const blk = (base, lite, dark) => (i, j, r) => (i === 0 || j === 0) ? lite : (i === 15 || j === 15) ? dark : p(base)(r);
  R.setProperty('--tex-grass', make((i, j, r) => p(['#5d9c33', '#6aad3a', '#4f8a2b', '#79bd45', '#5d9c33'])(r), 11));
  R.setProperty('--tex-dirt', make((i, j, r) => p(['#8b5a2b', '#79502a', '#9a6a3a', '#6b4423'])(r), 5));
  R.setProperty('--tex-stone', make((i, j, r) => p(['#7f7f7f', '#747474', '#8c8c8c', '#6a6a6a'])(r), 3));
  R.setProperty('--tex-plank', make((i, j, r) => (j % 4 === 3) ? '#6b4a25' : p(['#a0763e', '#9a7038', '#ab8045'])(r), 9));
  R.setProperty('--tex-gold', make(blk(['#f9d63b', '#f5c518', '#ffe36e', '#e8b90f'], '#fff3a8', '#b8860b'), 29));
  R.setProperty('--tex-diamond', make(blk(['#4ae3e0', '#35c9c5', '#76f0ec', '#2bb3b0'], '#c9fffd', '#1b8a87'), 31));
  R.setProperty('--tex-obsidian', make((i, j, r) => p(['#1b1030', '#2a1846', '#140b24', '#3b2360'])(r), 37));
})();
const STAR = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges"><path fill="#000" d="M3 0h1v1H3zM2 1h1v1H2zM4 1h1v1H4zM0 2h2v1H0zM5 2h2v1H5zM0 3h1v1H0zM6 3h1v1H6zM1 4h1v2H1zM5 4h1v2H5zM0 6h2v1H0zM5 6h2v1H5zM3 5h1v1H3z"/><path fill="#ffd83d" d="M3 1h1v1H3zM2 2h3v1H2zM1 3h5v1H1zM2 4h3v1H2zM2 5h1v1H2zM4 5h1v1H4z"/></svg>';
const STAR0 = STAR.replace('#ffd83d', '#6b6b6b');
const GEM = '<svg viewBox="0 0 8 7" shape-rendering="crispEdges"><path fill="#000" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v2H0zM7 2h1v2H7zM1 4h1v1H1zM6 4h1v1H6zM2 5h1v1H2zM5 5h1v1H5zM3 6h2v1H3z"/><path fill="#4ae3e0" d="M2 1h4v1H2zM1 2h6v2H1zM2 4h4v1H2zM3 5h2v1H3z"/><path fill="#e9ffff" d="M2 1h2v1H2zM1 2h1v1H1z"/></svg>';
const stars = n => STAR.repeat(n) + STAR0.repeat(3 - n);

/* ---------- الصوت ---------- */
const T = k => `audio/${k}.mp3?v=1`;                                // صوت المعلّمة
const EL = k => `../huruf/assets/audio/elia/${k}.mp3?v=5`;          // صوت إيليا الحقيقي
const UI = k => `../huruf/assets/audio/ui/${k}.mp3`;
const voice = new Audio(); voice.preload = 'auto';
let vTok = 0, vRes = null;
function play(src) {
  stopVoice(); const my = ++vTok;
  return new Promise(res => {
    vRes = res; let fin = false;
    const done = ok => { if (fin) return; fin = true; if (vRes === res) vRes = null; res(ok && my === vTok); };
    voice.onended = () => done(true); voice.onerror = () => done(false);
    voice.src = src; const p = voice.play(); if (p && p.catch) p.catch(() => done(false));
    setTimeout(() => done(true), 15000);
  });
}
function stopVoice() { vTok++; try { voice.pause(); } catch (e) {} if (vRes) { const r = vRes; vRes = null; r(false); } }
let AC = null;
const ac = () => { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; };
function tone(f, d, type = 'triangle', vol = .1, when = 0, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  click: () => tone(560, .06, 'square', .05),
  ding: () => { tone(880, .1); tone(1320, .16, 'triangle', .1, .08); },
  good: () => { tone(523, .12); tone(659, .12, 'triangle', .12, .1); tone(784, .22, 'triangle', .12, .2); },
  bad: () => tone(200, .28, 'sawtooth', .06, 0, 100),
  bump: () => tone(130, .12, 'square', .05),
  step: () => tone(660 + Math.random() * 200, .04, 'sine', .04),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .22, 'triangle', .1, i * .1)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ---------- الاحتفال والتشجيع ---------- */
const SHOP = window.EliaShop || null;
function burst(n = 30, cx = innerWidth / 2, cy = innerHeight * .55, k = 1) {
  const F = SHOP ? SHOP.fx() : { colors: ['#29d162', '#4ae3e0', '#ffd83d', '#fff'], shape: '' };
  for (let i = 0; i < Math.round(n * (F.more || 1)); i++) {
    const b = el('i', 'burst ' + (F.shape || '')), a = Math.random() * Math.PI * 2, d = (160 + Math.random() * 320) * k, sz = (k < 1 ? 12 : 16) + Math.random() * 10;
    Object.assign(b.style, { left: cx - sz / 2 + 'px', top: cy - sz / 2 + 'px', width: sz + 'px', height: sz + 'px', background: pick(F.colors) });
    b.style.setProperty('--dx', Math.cos(a) * d + 'px'); b.style.setProperty('--dy', Math.sin(a) * d - 120 * k + 'px'); b.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(b); setTimeout(() => b.remove(), 1200);
  }
}
const burstAt = (e, n = 12, k = .4) => { const r = e.getBoundingClientRect(); burst(n, r.left + r.width / 2, r.top + r.height / 2, k); };
const CELEB = {
  siuuu: { img: 'siuuu', say: 'سِيييييي!', au: 'siuuu', anim: 'siuuu' },
  smart: { img: 'smart', say: 'أَنا ذَكِيٌّ!', au: 'smart', anim: 'smart' },
  easy: { img: 'smart', say: 'سَهْلَةٌ!', au: 'easy', anim: 'smart' },
  hero: { img: 'siuuu', say: 'أَنا بَطَلٌ!', au: 'hero', anim: 'siuuu' },
  genius: { img: 'smart', say: 'أَنا عَبْقَرِيٌّ!', au: 'genius', anim: 'smart' },
};
let bag = [];
const nextCeleb = () => { if (!bag.length) bag = shuffle(['siuuu', 'smart', 'genius', 'hero', 'easy', 'siuuu', 'genius', 'smart']); return bag.pop(); };
function celebrate(n) {
  const c = CELEB[nextCeleb()], box = $('#celebrate'), img = $('#c-img');
  img.src = `../assets/elia/${c.img}.webp`; img.className = 'who pix'; void img.offsetWidth; img.classList.add(c.anim);
  $('#c-say').textContent = c.say; $('#c-stars').innerHTML = n ? stars(n) : '';
  box.classList.add('on'); SFX.good(); setTimeout(() => burst(n === 3 ? 44 : 28), c.anim === 'siuuu' ? 900 : 350);
  return new Promise(res => {
    let closed = false; const close = () => { if (closed) return; closed = true; box.classList.remove('on'); box.onclick = null; res(); };
    box.onclick = () => { stopVoice(); close(); };
    (async () => {
      const t0 = Date.now(); await play(EL(c.au));
      if (Math.random() < .35 && !closed) await play(UI(pick(['great1', 'great2', 'great3'])));
      const left = 1700 - (Date.now() - t0); if (left > 0) await sleep(left); close();
    })();
  });
}
let oopsT = 0;
async function oops(extra) {
  const o = $('#oops'); o.classList.add('on'); clearTimeout(oopsT);
  await play(EL('tryagain')); if (extra) await play(T(extra));
  oopsT = setTimeout(() => o.classList.remove('on'), 700);
}

/* ---------- الرسوم ---------- */
const SVG = {
  plantOk: () => `<svg viewBox="0 0 120 140"><path d="M60 100 C60 80 59 62 60 42" stroke="#2f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="44" cy="70" rx="17" ry="8" fill="#3fa34d" transform="rotate(-30 44 70)"/><ellipse cx="76" cy="60" rx="17" ry="8" fill="#4fbf5c" transform="rotate(30 76 60)"/>
    <ellipse cx="47" cy="44" rx="14" ry="7" fill="#4fbf5c" transform="rotate(-45 47 44)"/><ellipse cx="72" cy="38" rx="14" ry="7" fill="#3fa34d" transform="rotate(45 72 38)"/>
    <rect x="26" y="94" width="68" height="12" rx="3" fill="#b5532c"/><path d="M31 106 H89 L83 136 H37 Z" fill="#c8643b"/><ellipse cx="60" cy="96" rx="30" ry="4" fill="#5b3a1e"/></svg>`,
  plantBad: () => `<svg viewBox="0 0 120 140"><path d="M60 100 C60 82 64 66 80 62 C90 60 92 70 90 78" stroke="#8a7a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="46" cy="86" rx="15" ry="6" fill="#a8873a" transform="rotate(40 46 86)"/><ellipse cx="74" cy="84" rx="14" ry="6" fill="#b89a4a" transform="rotate(-50 74 84)"/>
    <ellipse cx="92" cy="86" rx="9" ry="5" fill="#9a7a30" transform="rotate(70 92 86)"/>
    <rect x="26" y="94" width="68" height="12" rx="3" fill="#b5532c"/><path d="M31 106 H89 L83 136 H37 Z" fill="#c8643b"/><ellipse cx="60" cy="96" rx="30" ry="4" fill="#5b3a1e"/></svg>`,
  roots: () => `<svg viewBox="0 0 120 120"><g stroke="#b88a52" stroke-width="4" fill="none" stroke-linecap="round"><path d="M60 8 V60 M60 30 C45 45 35 60 30 95 M60 30 C75 45 88 62 92 98 M60 50 C52 70 48 85 50 112 M60 50 C70 70 72 88 70 110 M40 70 C30 78 22 84 14 86 M84 72 C94 78 100 84 108 84"/></g></svg>`,
  stem: () => `<svg viewBox="0 0 120 120"><rect x="50" y="6" width="20" height="108" rx="6" fill="#7cb342"/><g fill="#5a8f2a"><rect x="47" y="30" width="26" height="5"/><rect x="47" y="62" width="26" height="5"/><rect x="47" y="92" width="26" height="5"/></g></svg>`,
  soilPile: () => `<svg viewBox="0 0 120 120"><path d="M8 100 C20 60 45 40 62 42 C85 44 104 70 114 100 Z" fill="#5b3a1e"/><g fill="#7a5230"><circle cx="40" cy="78" r="4"/><circle cx="62" cy="60" r="3"/><circle cx="80" cy="82" r="4"/><circle cx="55" cy="90" r="3"/><circle cx="92" cy="92" r="3"/></g><g fill="#3d2410"><circle cx="30" cy="92" r="3"/><circle cx="70" cy="74" r="3"/></g></svg>`,
  soilSprout: () => `<svg viewBox="0 0 160 120" width="220"><path d="M10 110 C30 78 60 70 80 70 C104 70 132 80 150 110 Z" fill="#5b3a1e"/><g fill="#7a5230"><circle cx="50" cy="96" r="4"/><circle cx="96" cy="90" r="4"/><circle cx="120" cy="100" r="3"/></g>
    <path d="M80 72 C80 55 80 45 80 30" stroke="#2f8a3a" stroke-width="5" fill="none"/><ellipse cx="68" cy="34" rx="13" ry="6" fill="#4fbf5c" transform="rotate(-30 68 34)"/><ellipse cx="92" cy="30" rx="13" ry="6" fill="#3fa34d" transform="rotate(30 92 30)"/></svg>`,
  room: () => `<svg viewBox="0 0 440 230" width="min(560px,86vw)" style="max-height:30vh;border:4px solid #000">
    <defs><linearGradient id="wall" x1="0" x2="1"><stop offset="0" stop-color="#1e1d24"/><stop offset=".55" stop-color="#4a4238"/><stop offset="1" stop-color="#8a7a60"/></linearGradient></defs>
    <rect width="440" height="230" fill="url(#wall)"/><rect y="180" width="440" height="50" fill="#5a4630"/>
    <rect x="320" y="26" width="90" height="110" fill="#fff6c8" stroke="#222" stroke-width="5"/><path d="M365 26 V136 M320 81 H410" stroke="#222" stroke-width="5"/>
    <polygon points="320,60 410,136 330,205 230,205" fill="rgba(255,240,170,.35)"/>
    <g transform="translate(236 88) scale(.85)">${SVG.plantOk().replace(/<\/?svg[^>]*>/g, '')}</g>
    <g transform="translate(22 88) scale(.85)">${SVG.plantBad().replace(/<\/?svg[^>]*>/g, '')}</g>
    <text x="287" y="84" font-size="26" text-anchor="middle">💧</text><text x="73" y="84" font-size="26" text-anchor="middle">💧</text></svg>`,
  plantParts: () => `<svg class="plant-svg" viewBox="0 0 300 430">
    <rect x="0" y="300" width="300" height="130" fill="#d9b98a" rx="8"/><path d="M0 300 H300" stroke="#8a6a3a" stroke-width="4"/>
    <g class="z" data-part="root"><rect x="70" y="300" width="160" height="125" fill="transparent"/>
      <g stroke="#9a6b38" stroke-width="5" fill="none" stroke-linecap="round"><path d="M150 300 V350 M150 318 C130 335 112 352 100 395 M150 318 C170 335 190 355 200 398 M150 345 C140 370 136 390 140 418 M150 345 C162 370 164 392 160 416 M120 360 C105 368 92 372 80 372 M182 362 C198 368 210 372 222 370"/></g></g>
    <g class="z" data-part="stem"><rect x="132" y="120" width="36" height="182" fill="transparent"/><path d="M150 302 V118" stroke="#4f9a2f" stroke-width="12" stroke-linecap="round"/></g>
    <g class="z" data-part="leaf"><ellipse cx="108" cy="240" rx="48" ry="17" fill="#3fa34d" transform="rotate(-28 108 240)"/><ellipse cx="194" cy="210" rx="48" ry="17" fill="#4fbf5c" transform="rotate(28 194 210)"/>
      <ellipse cx="112" cy="176" rx="38" ry="14" fill="#4fbf5c" transform="rotate(-38 112 176)"/></g>
    <g class="z" data-part="flower"><circle cx="150" cy="78" r="64" fill="transparent"/>
      ${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="150" cy="44" rx="18" ry="36" fill="#f39bc0" stroke="#d1608f" stroke-width="2" transform="rotate(${a} 150 80)"/>`).join('')}
      <circle cx="150" cy="80" r="16" fill="#ffd23d" stroke="#c99a00" stroke-width="2"/></g>
    <g id="tags"></g></svg>`,
};
const TAGPOS = { root: [252, 392], stem: [58, 290], leaf: [252, 160], flower: [262, 60] };
function flagSvg(c) {
  const F = {
    KWT: '<rect width="120" height="20" fill="#007a3d"/><rect y="20" width="120" height="20" fill="#fff"/><rect y="40" width="120" height="20" fill="#ce1126"/><path d="M0 0 L30 20 V40 L0 60 Z" fill="#000"/>',
    ARE: '<rect width="120" height="20" fill="#00732f"/><rect y="20" width="120" height="20" fill="#fff"/><rect y="40" width="120" height="20" fill="#000"/><rect width="30" height="60" fill="#ff0000"/>',
    BHR: '<rect width="120" height="60" fill="#ce1126"/><path d="M0 0 H30 L42 6 L30 12 L42 18 L30 24 L42 30 L30 36 L42 42 L30 48 L42 54 L30 60 H0 Z" fill="#fff"/>',
    QAT: '<rect width="120" height="60" fill="#8a1538"/><path d="M0 0 H34' + Array.from({ length: 9 }, (_, i) => ` L44 ${(i * 60 / 9 + 30 / 9).toFixed(1)} L34 ${((i + 1) * 60 / 9).toFixed(1)}`).join('') + ' H0 Z" fill="#fff"/>',
  };
  return `<svg viewBox="0 0 120 60">${F[c]}</svg>`;
}
const mapSvg = c => `<svg viewBox="0 0 200 200"><path d="${MAPS[c]}"/></svg>`;
const HTML = {
  bowlLive: () => `<div class="bowl live"><span class="num">١</span><span class="fish">🐠</span><i class="bub" style="left:60%"></i><i class="bub" style="left:30%;animation-delay:1s"></i><i class="flake" style="left:40%"></i><i class="flake" style="left:58%;animation-delay:1.3s"></i></div>`,
  bowlDead: () => `<div class="bowl dead"><span class="num">٢</span><span class="fish">🐠</span></div>`,
};
function icon(ic) {
  if (ic.startsWith('svg:')) return SVG[ic.slice(4)]();
  if (ic.startsWith('html:')) return HTML[ic.slice(5)]();
  if (ic.startsWith('flag:')) return flagSvg(ic.slice(5));
  if (ic.startsWith('map:')) return mapSvg(ic.slice(4));
  return ic;
}
const SCENE = {
  car: () => '<span style="font-size:70px">🎮</span><span class="drive">🚓</span>',
  living: () => '<span>🧒</span><span style="font-size:60px">+</span><span>🐪</span><span style="font-size:60px">+</span><span style="color:#e0342f">؟</span>',
  lean: () => '<span class="lean">🌻</span><span>☀️</span>',
  rabbit: () => '<span style="font-size:110px">🐇</span>',
  deer: () => '<span style="font-size:110px">🦌</span><span style="font-size:70px">🦌</span>',
  room: () => SVG.room(),
  soil: () => SVG.soilSprout(),
  civil: () => `<div class="civil"><div class="ttl"><span>دَوْلَةُ الْكُوَيْتِ</span><span style="width:54px">${flagSvg('KWT')}</span><span>الْبِطاقَةُ الْمَدَنِيَّةُ</span></div>
    <div class="ph"></div>
    <dl><dt>الِاسْمُ</dt><dd>إيليا حَيْدَر الْمَعاتيق</dd><dt>الْجِنْسِيَّةُ</dt><dd>كُوَيْتِيٌّ</dd><dt>الرَّقْمُ الْمَدَنِيُّ</dt><dd>٠٠٠٠٠٠٠٠٠٠٠٠</dd></dl></div>`,
};

/* ---------- العارضات ---------- */
const R = {};
function optBtn(o, i, wide) {
  const b = el('button', 'opt' + (wide ? ' wide' : ''), `<span class="ic">${icon(o.ic)}</span>${o.lb ? `<span class="lb">${o.lb}</span>` : ''}`);
  b.style.setProperty('--i', i); if (TEST && o.ok) b.dataset.ok = 1; return b;
}
function scene(q, st) { if (q.scene && q.scene !== 'none') { const s = el('div', 'scene', SCENE[q.scene]()); st.appendChild(s); } }
async function readOpts(q, btns) {     // المعلّمة تقرأ السؤال ثم الخيارات وكلُّ خيارٍ يتوهّج حين يُقرأ
  if (!await play(T(q.au))) return;
  if (!q.read) return;
  for (let i = 0; i < q.opts.length; i++) {
    const o = q.opts[i]; if (!o.say || btns[i].classList.contains('off')) continue;
    await sleep(250); btns[i].classList.add('reading'); const ok = await play(T(o.say)); btns[i].classList.remove('reading'); if (!ok) return;
  }
}

R.pick = (q, st, api) => new Promise(done => {
  scene(q, st);
  const box = el('div', 'opts ' + (q.cls || '')); st.appendChild(box);
  let locked = false; const btns = q.opts.map((o, i) => optBtn(o, i, q.wide)); btns.forEach(b => box.appendChild(b));
  const right = btns[q.opts.findIndex(o => o.ok)];
  readOpts(q, btns);
  btns.forEach((b, i) => b.onclick = async () => {
    if (locked) return; stopVoice(); btns.forEach(x => x.classList.remove('reading'));
    if (q.opts[i].ok) { locked = true; b.classList.add('right'); b.classList.remove('hint'); api.ok(b); return done(); }
    b.classList.add('wrong', 'off'); await api.bad(b);
    if (api.wrong() >= 2 && !locked) api.hint(right);
  });
  api.solve = () => right.click();
});

R.multi = (q, st, api) => new Promise(done => {
  scene(q, st);
  const need = q.opts.filter(o => o.ok).length; let got = 0;
  const cnt = el('div', 'counter', ''); const box = el('div', 'opts'); st.appendChild(box); st.appendChild(cnt);
  const upd = () => cnt.textContent = `وَجَدْتَ ${AR(got)} مِنْ ${AR(need)} ✔`; upd();
  const btns = q.opts.map((o, i) => optBtn(o, i)); btns.forEach(b => box.appendChild(b));
  readOpts(q, btns);
  btns.forEach((b, i) => b.onclick = async () => {
    const o = q.opts[i]; if (b.classList.contains('off')) return; stopVoice(); btns.forEach(x => x.classList.remove('reading'));
    if (o.ok) {
      b.classList.add('right', 'off'); b.classList.remove('hint'); got++; upd(); SFX.ding(); burstAt(b);
      if (got === need) { await sleep(300); return done(); }
      if (o.say) play(T(o.say));
    } else {
      b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); await api.bad(b);
      if (api.wrong() >= 3) btns.forEach((x, j) => q.opts[j].ok && !x.classList.contains('off') && api.hint(x, true));
    }
  });
  api.solve = () => btns.forEach((b, i) => q.opts[i].ok && !b.classList.contains('off') && b.click());
});

R.sort = (q, st, api) => new Promise(done => {
  const wrap = el('div', 'sortwrap'), pool = el('div', 'pool'), bins = el('div', 'bins'); st.appendChild(wrap);
  const binEls = {};
  q.bins.forEach(b => { const e = el('div', 'bin ' + b.cls, `<h4>${b.label}</h4><div class="got"></div>`); e.dataset.bin = b.id; binEls[b.id] = e; bins.appendChild(e); });
  wrap.appendChild(pool); wrap.appendChild(bins);
  let left = q.items.filter(i => i.bin).length, sel = null;
  const items = shuffle(q.items).map((it, i) => {
    const e = el('div', 'item' + (it.big ? ' big' : ''), it.img ? `<img src="img/${it.img}.webp" alt="" draggable="false">` : it.ic);
    e.style.setProperty('--i', i); e._it = it; if (TEST && it.bin) e.dataset.ok = it.bin; pool.appendChild(e); return e;
  });
  const binAt = (x, y) => { for (const k in binEls) { const r = binEls[k].getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return k; } return null; };
  const back = e => { e.classList.add('back'); e.style.transform = ''; setTimeout(() => e.classList.remove('back'), 360); };
  async function place(e, bin) {
    Object.values(binEls).forEach(b => b.classList.remove('hot'));
    if (sel) { sel.classList.remove('sel'); sel = null; }
    if (e._it.bin === bin) {
      e.style.transform = ''; e.classList.remove('drag', 'hint'); e.classList.add('in'); binEls[bin].querySelector('.got').appendChild(e);
      SFX.ding(); burstAt(e); if (e._it.say) play(T(e._it.say)); left--; if (!left) { await sleep(450); done(); }
    } else {
      back(e); await api.bad(e, q.wrongAu);
      if (api.wrong() >= 3) items.forEach(x => !x.classList.contains('in') && x._it.bin && api.hint(x, true));
    }
  }
  items.forEach(e => {
    let x0, y0, drag = false, id = null;
    e.addEventListener('pointerdown', ev => { if (e.classList.contains('in')) return; id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; drag = false; try { e.setPointerCapture(id); } catch (er) {} });
    e.addEventListener('pointermove', ev => {
      if (ev.pointerId !== id) return; const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!drag && Math.hypot(dx, dy) > 10) { drag = true; e.classList.add('drag'); stopVoice(); }
      if (drag) { e.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`; const b = binAt(ev.clientX, ev.clientY); Object.entries(binEls).forEach(([k, x]) => x.classList.toggle('hot', k === b)); }
    });
    const up = ev => {
      if (ev.pointerId !== id) return; id = null;
      if (drag) { e.classList.remove('drag'); const b = binAt(ev.clientX, ev.clientY); if (b) place(e, b); else { back(e); Object.values(binEls).forEach(x => x.classList.remove('hot')); } }
      else { SFX.click(); if (sel) sel.classList.remove('sel'); sel = sel === e ? null : e; if (sel) { e.classList.add('sel'); if (e._it.say) play(T(e._it.say)); } }
    };
    e.addEventListener('pointerup', up); e.addEventListener('pointercancel', ev => { if (ev.pointerId === id) { id = null; e.classList.remove('drag'); back(e); } });
  });
  Object.entries(binEls).forEach(([k, b]) => b.addEventListener('click', () => { if (sel) place(sel, k); }));
  api.solve = () => items.filter(e => e._it.bin && !e.classList.contains('in')).forEach(e => place(e, e._it.bin));
  play(T(q.au));
});

R.parts = (q, st, api) => new Promise(async done => {
  const holder = el('div', 'plant-holder', SVG.plantParts()); st.appendChild(holder);
  const svg = holder.querySelector('svg'), tags = svg.querySelector('#tags'); let cur = null, miss = 0;
  const zones = [...svg.querySelectorAll('.z')];
  if (TEST) zones.forEach(z => z.dataset.ok = z.dataset.part);
  zones.forEach(z => z.addEventListener('click', async () => {
    if (!cur || z.classList.contains('found')) return; stopVoice();
    if (z.dataset.part === cur.part) {
      z.classList.add('found'); z.style.animation = ''; const [x, y] = TAGPOS[cur.part];
      tags.insertAdjacentHTML('beforeend', `<g><rect x="${x - 50}" y="${y - 26}" width="100" height="40" fill="#ffe94d" stroke="#000" stroke-width="3"/><text class="tag" x="${x}" y="${y + 3}" text-anchor="middle">${cur.lb}</text></g>`);
      SFX.ding(); burstAt(z, 14); const r = cur.res; cur = null; r();
    } else {
      miss++; await api.bad(z);
      if (miss >= 2 && cur) { const t = zones.find(x => x.dataset.part === cur.part); t.style.animation = 'hint 1s ease-in-out infinite'; t.style.transformBox = 'fill-box'; t.style.transformOrigin = 'center'; play(T('hint')); }
    }
  }));
  api.solve = () => cur && zones.find(z => z.dataset.part === cur.part).dispatchEvent(new Event('click'));
  await play(T(q.au));
  for (const s of shuffle(q.steps)) {
    miss = 0; api.setText(s.t, s.au);
    await new Promise(res => { cur = { ...s, res }; play(T(s.au)); });
    await sleep(500);
  }
  done();
});

R.find = (q, st, api) => new Promise(async done => {
  const box = el('div', 'opts bigic'); st.appendChild(box); let cur = null, miss = 0;
  const btns = q.cards.map((c, i) => { const b = optBtn({ ic: `<img src="img/${c.img}.webp" alt="">` }, i); b._id = c.id; box.appendChild(b); return b; });
  btns.forEach(b => b.onclick = async () => {
    if (!cur || b.classList.contains('right')) return; stopVoice();
    if (b._id === cur.id) { b.classList.add('right'); b.classList.remove('hint'); SFX.ding(); burstAt(b); const r = cur.res; cur = null; r(); }
    else { miss++; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); await api.bad(b); if (miss >= 2 && cur) api.hint(btns.find(x => x._id === cur.id)); }
  });
  api.solve = () => cur && btns.find(x => x._id === cur.id).click();
  for (const s of q.steps) {
    miss = 0; api.setText(s.t, s.au);
    if (TEST) btns.forEach(b => b.dataset.ok = b._id === s.id ? 1 : '');
    await new Promise(res => { cur = { ...s, res }; play(T(s.au)); });
    await sleep(550);
  }
  done();
});

R.flag = (q, st, api) => new Promise(done => {
  const COL = [['green', '#007a3d', 'c_green'], ['white', '#ffffff', 'c_white'], ['red', '#ce1126', 'c_red'], ['black', '#000000', 'c_black'], ['blue', '#1e6fd9'], ['yellow', '#f5c518']];
  const wrap = el('div', 'flagwrap', `<svg class="flag-svg" viewBox="0 0 300 150">
    <defs><pattern id="un" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#eee"/><path d="M0 12 L12 0" stroke="#ccc" stroke-width="2"/></pattern></defs>
    <rect class="rg" data-c="green" width="300" height="50" fill="url(#un)"/><rect class="rg" data-c="white" y="50" width="300" height="50" fill="url(#un)"/>
    <rect class="rg" data-c="red" y="100" width="300" height="50" fill="url(#un)"/><path class="rg" data-c="black" d="M0 0 L75 50 V100 L0 150 Z" fill="url(#un)"/></svg>
    <div class="palette"></div>`);
  st.appendChild(wrap);
  const pal = wrap.querySelector('.palette'); let cur = null, left = 4;
  const sws = shuffle(COL).map(([id, hex, au]) => { const s = el('button', 'sw'); s.style.background = hex; s._id = id; s._au = au; pal.appendChild(s);
    s.onclick = () => { SFX.click(); sws.forEach(x => x.classList.remove('on')); s.classList.add('on'); cur = s; if (au) play(T(au)); }; return s; });
  const hexOf = id => COL.find(c => c[0] === id)[1];
  const regs = [...wrap.querySelectorAll('.rg')];
  regs.forEach(r => r.addEventListener('click', async () => {
    if (r._done) return;
    if (!cur) { pal.classList.remove('shake'); void pal.offsetWidth; pal.classList.add('shake'); return play(T(q.au)); }
    if (cur._id === r.dataset.c) { r._done = true; r.setAttribute('fill', hexOf(cur._id)); SFX.ding(); burstAt(r, 10); left--; if (!left) { await sleep(400); done(); } }
    else {
      r.setAttribute('fill', hexOf(cur._id)); setTimeout(() => !r._done && r.setAttribute('fill', 'url(#un)'), 450); await api.bad(r);
      if (api.wrong() >= 2) { const s = sws.find(x => x._id === r.dataset.c); api.hint(s, true); }
    }
  }));
  api.solve = () => regs.filter(r => !r._done).forEach(r => { cur = sws.find(s => s._id === r.dataset.c); r.dispatchEvent(new Event('click')); });
  if (TEST) regs.forEach(r => r.dataset.ok = r.dataset.c);
  play(T(q.au));
});

R.maze = (q, st, api) => new Promise(done => {
  const C = 7, RW = 5, S = 100; let seed = 20261003;
  const rnd = () => (seed = seed * 16807 % 2147483647, (seed - 1) / 2147483646);
  const W = Array.from({ length: C * RW }, () => ({ n: 1, s: 1, e: 1, w: 1 })), at = (x, y) => W[y * C + x];
  const DIR = { n: [0, -1, 's'], s: [0, 1, 'n'], e: [1, 0, 'w'], w: [-1, 0, 'e'] };
  (function carve() {                              // متاهة كاملة بالتتبّع العكسي، ببذرةٍ ثابتة
    const seen = new Set(['0,0']), stack = [[0, 0]];
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nb = Object.entries(DIR).map(([d, [dx, dy]]) => [d, x + dx, y + dy]).filter(([, a, b]) => a >= 0 && b >= 0 && a < C && b < RW && !seen.has(a + ',' + b));
      if (!nb.length) { stack.pop(); continue; }
      const [d, a, b] = nb[rnd() * nb.length | 0]; at(x, y)[d] = 0; at(a, b)[DIR[d][2]] = 0; seen.add(a + ',' + b); stack.push([a, b]);
    }
  })();
  const start = [C - 1, 0], goal = [0, RW - 1];
  let lines = '';
  for (let y = 0; y < RW; y++) for (let x = 0; x < C; x++) {
    const c = at(x, y), X = x * S, Y = y * S;
    if (c.n && y === 0) lines += `M${X} ${Y}H${X + S}`; if (c.w && !(x === 0 && y === goal[1])) lines += `M${X} ${Y}V${Y + S}`;
    if (c.s) lines += `M${X} ${Y + S}H${X + S}`; if (c.e && !(x === C - 1 && y === start[1])) lines += `M${X + S} ${Y}V${Y + S}`;
  }
  const wrap = el('div', '', `<svg class="maze-svg" viewBox="-60 -10 ${C * S + 120} ${RW * S + 20}">
    <rect x="${goal[0] * S + 6}" y="${goal[1] * S + 6}" width="${S - 12}" height="${S - 12}" fill="#c9f7c4"/>
    <polyline id="mz-path" fill="none" stroke="#ff5a8a" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
    <path d="${lines}" stroke="#2b2b2b" stroke-width="10" stroke-linecap="round" fill="none"/>
    <g transform="translate(${goal[0] * S - 62} ${goal[1] * S + 14}) scale(.36)"><path d="${MAPS.KWT}" fill="#e0a24a" stroke="#6b3d0a" stroke-width="4"/></g>
    <text x="${goal[0] * S - 30}" y="${goal[1] * S + 4}" font-size="34" text-anchor="middle">🇰🇼</text>
    <text id="mz-dana" font-size="64" text-anchor="middle" dominant-baseline="central">👧</text></svg>`);
  st.appendChild(wrap);
  const svg = wrap.querySelector('svg'), pl = svg.querySelector('#mz-path'), dana = svg.querySelector('#mz-dana');
  const path = [start.slice()]; let bumps = 0, lastBump = 0, fin = false;
  const draw = () => { pl.setAttribute('points', path.map(([x, y]) => `${x * S + S / 2},${y * S + S / 2}`).join(' ')); const [x, y] = path[path.length - 1]; dana.setAttribute('x', x * S + S / 2); dana.setAttribute('y', y * S + S / 2); };
  draw();
  const open = ([x, y], d) => !at(x, y)[d];
  const dirTo = ([x, y], [a, b]) => a === x + 1 && b === y ? 'e' : a === x - 1 && b === y ? 'w' : b === y + 1 && a === x ? 's' : b === y - 1 && a === x ? 'n' : null;
  function toward(cx, cy) {
    if (fin) return;
    for (let guard = 0; guard < 12; guard++) {
      const last = path[path.length - 1]; if (last[0] === cx && last[1] === cy) return;
      const prev = path[path.length - 2]; if (prev && prev[0] === cx && prev[1] === cy) { path.pop(); draw(); return; }
      const dx = Math.sign(cx - last[0]), dy = Math.sign(cy - last[1]);
      const tries = Math.abs(cx - last[0]) >= Math.abs(cy - last[1]) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
      let moved = false;
      for (const [mx, my] of tries) {
        if (!mx && !my) continue; const nx = [last[0] + mx, last[1] + my], d = dirTo(last, nx);
        if (d && open(last, d)) {
          if (prev && prev[0] === nx[0] && prev[1] === nx[1]) path.pop(); else path.push(nx);
          SFX.step(); draw(); moved = true; break;
        }
      }
      if (!moved) { const now = Date.now(); if (now - lastBump > 700) { lastBump = now; bumps++; SFX.bump(); svg.classList.remove('shake'); void svg.getBBox; svg.classList.add('shake'); setTimeout(() => svg.classList.remove('shake'), 450); } return; }
      const l = path[path.length - 1]; if (l[0] === goal[0] && l[1] === goal[1]) { fin = true; api.addWrong(bumps <= 3 ? 0 : bumps <= 8 ? 1 : 3); setTimeout(done, 300); return; }
    }
  }
  const cell = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const m = p.matrixTransform(svg.getScreenCTM().inverse()); return [Math.max(0, Math.min(C - 1, Math.floor(m.x / S))), Math.max(0, Math.min(RW - 1, Math.floor(m.y / S)))]; };
  let down = false;
  svg.addEventListener('pointerdown', ev => { down = true; stopVoice(); try { svg.setPointerCapture(ev.pointerId); } catch (e) {} toward(...cell(ev)); });
  svg.addEventListener('pointermove', ev => { if (down) toward(...cell(ev)); });
  ['pointerup', 'pointercancel'].forEach(t => svg.addEventListener(t, () => down = false));
  api.solve = () => {                               // أقصر طريق (BFS)
    const k = ([x, y]) => x + ',' + y, from = { [k(start)]: null }, qq = [start];
    while (qq.length) { const c = qq.shift(); if (c[0] === goal[0] && c[1] === goal[1]) break;
      for (const [d, [dx, dy]] of Object.entries(DIR)) { const n = [c[0] + dx, c[1] + dy]; if (open(c, d) && n[0] >= 0 && n[1] >= 0 && n[0] < C && n[1] < RW && !(k(n) in from)) { from[k(n)] = c; qq.push(n); } } }
    const route = []; for (let c = goal; c; c = from[k(c)]) route.unshift(c);
    path.length = 0; route.forEach(c => path.push(c)); draw(); fin = true; setTimeout(done, 200);
  };
  play(T(q.au));
});

R.order = (q, st, api) => new Promise(done => {
  const slots = el('div', 'slots'), box = el('div', 'opts'); st.appendChild(slots); st.appendChild(box);
  const sl = q.words.map(() => { const s = el('div', 'slot'); slots.appendChild(s); return s; });
  let next = 0, order;
  do order = shuffle(q.words.map((w, i) => i)); while (order.every((v, i) => v === i));
  const btns = order.map((wi, i) => { const b = el('button', 'opt word', q.words[wi].t); b.style.setProperty('--i', i); b._wi = wi; if (TEST) b.dataset.ok = wi; box.appendChild(b); return b; });
  btns.forEach(b => b.onclick = async () => {
    if (b.classList.contains('off')) return; stopVoice();
    if (b._wi === next) {
      b.classList.add('off'); b.style.visibility = 'hidden'; sl[next].textContent = q.words[next].t; sl[next].classList.add('full'); SFX.ding(); burstAt(sl[next], 10);
      play(T(q.words[next].au)); next++;
      if (next === q.words.length) { await sleep(700); for (const w of q.words) await play(T(w.au)); done(); }
    } else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); await api.bad(b); if (api.wrong() >= 2) api.hint(btns.find(x => x._wi === next)); }
  });
  api.solve = () => btns.find(x => x._wi === next).click();
  play(T(q.au));
});

R.tf = (q, st, api) => new Promise(async done => {
  const box = el('div', 'tfbox'); st.appendChild(box);
  const dots = el('div', 'tfdots', q.items.map(() => '<i></i>').join(''));
  const stmt = el('div', 'stmt'); stmt.style.visibility = 'hidden'; const btns = el('div', 'opts');
  const yes = el('button', 'opt wide', '<span class="ic">👍</span><span class="lb">صَحيحٌ</span>'), no = el('button', 'opt wide', '<span class="ic">👎</span><span class="lb">خَطَأٌ</span>');
  yes.style.background = '#d6f5d0'; no.style.background = '#ffe0dc'; btns.append(yes, no); box.append(dots, stmt, btns);
  await play(T(q.au));
  for (let i = 0; i < q.items.length; i++) {
    const it = q.items[i]; dots.children[i].className = 'cur'; stmt.style.visibility = ''; stmt.textContent = it.t; stmt.style.animation = 'none'; void stmt.offsetWidth; stmt.style.animation = '';
    api.setText(q.text, it.au); let miss = 0;
    if (TEST) { yes.dataset.ok = it.ok ? 1 : ''; no.dataset.ok = it.ok ? '' : 1; }
    play(T(it.au));
    await new Promise(res => {
      const pickA = async ans => {
        stopVoice(); const b = ans ? yes : no;
        if (ans === it.ok) { yes.onclick = no.onclick = null; [yes, no].forEach(x => x.classList.remove('hint')); SFX.ding(); burstAt(b); res(); }
        else { miss++; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); await api.bad(b); if (miss >= 2) api.hint(it.ok ? yes : no); }
      };
      yes.onclick = () => pickA(true); no.onclick = () => pickA(false); api.solve = () => pickA(it.ok);
    });
    dots.children[i].className = 'done'; await sleep(500);
  }
  done();
});

/* ---------- الحفظ ---------- */
const lget = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
let S = Object.assign({ gems: 0, done: {}, log: {} }, lget());
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (window.EliaSave) EliaSave.push(); }
if (window.EliaSave) EliaSave.on(KEY, st => { S = Object.assign({ gems: 0, done: {}, log: {} }, st); if ($('#home').classList.contains('on')) renderHome(); });

/* ---------- الشاشات ---------- */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
function renderHome() {
  const box = $('#subjects'); box.innerHTML = '';
  Object.entries(TESTS).forEach(([k, t]) => {
    const best = S.done[k] || 0, max = t.qs.length * 3;
    const b = el('button', 'subj', `<div class="face" style="background-image:var(--tex-${t.tex})"><img class="pix" src="../assets/elia/${t.img}.webp" alt=""><span>${t.icon}</span></div>
      <div class="body"><h3>${t.title}</h3><p>${t.desc}</p><div class="best">${best ? `أَفْضَلُ نَتيجَةٍ: ${AR(best)} / ${AR(max)} ⭐` : `${AR(t.qs.length)} سُؤالاً — هَلْ أَنْتَ جاهِزٌ؟`}</div><div class="go">${best ? 'اِخْتَبِرْ مَرَّةً ثانِيَةً ▶' : 'اِبْدَأِ الِاخْتِبارَ ▶'}</div></div>`);
    b.onclick = () => { SFX.click(); startTest(k); }; box.appendChild(b);
  });
  const tot = Object.values(S.done).reduce((a, b) => a + b, 0);
  $('#h-stars').innerHTML = `${STAR}<span>${AR(tot)}</span>`;
}

let RUN = null;
async function startTest(k) {
  const t = TESTS[k]; RUN = { k, t, i: 0, res: [], stars: 0, ts: Date.now(), alive: true }; const my = RUN;
  show('quiz'); $('#q-track').innerHTML = t.qs.map(() => '<i></i>').join(''); updHud();
  $('#q-text').textContent = 'هَيّا نَبْدَأْ! 🚀'; $('#stage').innerHTML = `<img class="pix" src="../assets/elia/${t.img}.webp" style="height:min(40vh,320px);animation:popin .6s cubic-bezier(.2,1.6,.4,1)" alt="">`;
  await play(T(t.intro)); if (!my.alive) return;
  for (; my.i < t.qs.length; my.i++) {
    const r = await runQuestion(t.qs[my.i], my); if (!my.alive) return;
    my.res.push(r); my.stars += r.stars; $('#q-track').children[my.i].className = 's' + r.stars; updHud();
  }
  finish(my);
}
function updHud() { $('#q-stars').innerHTML = `${STAR}<span>${AR(RUN.stars)}</span>`; [...$('#q-track').children].forEach((x, i) => { if (i === RUN.i && !x.className.startsWith('s')) x.className = 'cur'; }); }
let curAu = null;
function setText(t, au) { const h = $('#q-text'); h.textContent = t; h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); if (au) curAu = au; }
$('#q-say').onclick = () => { SFX.click(); if (curAu) play(T(curAu)); };
voice.addEventListener('play', () => $('#q-say').classList.add('talk'));
['pause', 'ended'].forEach(e => voice.addEventListener(e, () => $('#q-say').classList.remove('talk')));

async function runQuestion(q, my) {
  updHud(); setText(q.text, q.au); const st = $('#stage'); st.innerHTML = '';
  let wrong = 0;
  const api = {
    wrong: () => wrong, addWrong: n => wrong += n, setText,
    ok: b => { SFX.ding(); burstAt(b, 16); },
    bad: async (e, au) => { wrong++; SFX.bad(); if (e && e.classList) { e.classList.remove('shake'); void e.getBoundingClientRect(); e.classList.add('shake'); setTimeout(() => e.classList.remove('shake'), 460); } await oops(au); },
    hint: (b, silent) => { if (!b) return; b.classList.add('hint'); if (!silent) play(T('hint')); },
    solve: null,
  };
  window.__t = { q, api, solve: () => api.solve && api.solve() };
  await R[q.type](q, st, api);
  stopVoice(); if (!my.alive) return {};
  const n = wrong === 0 ? 3 : wrong <= 2 ? 2 : 1;
  await sleep(250); await celebrate(n);
  if (q.after && my.alive) { setText('السَّيّارَةُ لا تَأْكُلُ، وَلا تَتَنَفَّسُ، وَلا تَنْمو. 🚓', q.after); await play(T(q.after)); }
  return { id: q.id, stars: n, wrong };
}

function finish(my) {
  const t = my.t, max = t.qs.length * 3, pct = my.stars / max, prev = S.done[my.k] || 0;
  const first = !prev, gain = Math.ceil(Math.max(0, my.stars - prev) / 3) + (first ? 3 : 0);   // جوهرة لكل ٣ نجوم جديدة + ٣ لأول مرة
  S.done[my.k] = Math.max(prev, my.stars); S.gems = (S.gems || 0) + gain;
  S.log[my.ts] = { t: my.k, s: my.stars, m: max, q: my.res.map(r => [r.id, r.stars, r.wrong]) };
  const keys = Object.keys(S.log).sort(); while (keys.length > 30) delete S.log[keys.shift()];
  save();
  show('end');
  $('#e-title').textContent = pct >= .9 ? 'بَطَلٌ خارِقٌ!' : pct >= .7 ? 'مُمْتازٌ!' : 'أَحْسَنْتَ!';
  $('#e-stars').innerHTML = `${STAR}<span>${AR(my.stars)} / ${AR(max)}</span>`;
  $('#e-msg').textContent = pct >= .9 ? `أَنْتَ بَطَلُ ${t.hero}! كُلُّ إِجاباتِكَ رائِعَةٌ يا إيليا 🏆`
    : pct >= .7 ? 'مُمْتازٌ يا إيليا! أَنْتَ ذَكِيٌّ جِدّاً، وَبِقَليلٍ مِنَ التَّدْريبِ تَصيرُ بَطَلاً 🌟'
    : 'أَحْسَنْتَ يا إيليا! كُلَّما تَدَرَّبْتَ صِرْتَ أَقْوى. هَيّا نُحاوِلُ مَرَّةً ثانِيَةً 💪';
  $('#e-gems').innerHTML = gain ? `${GEM}<span>+${AR(gain)} جَواهِرُ لِلْمَتْجَرِ!</span>` : '<span>اِجْمَعْ نُجوماً أَكْثَرَ لِتَرْبَحَ جَواهِرَ 💎</span>';
  SFX.win(); burst(70); setTimeout(() => burst(50, innerWidth * .3, innerHeight * .4), 600);
  (async () => { await play(T(t.end)); if ($('#end').classList.contains('on')) await play(EL('won')); })();
  $('#e-again').onclick = () => { SFX.click(); startTest(my.k); };
}
$('#e-home').onclick = () => { SFX.click(); stopVoice(); renderHome(); show('home'); };
$('#q-home').onclick = () => {
  if (!confirm('تُريدُ الْخُروجَ مِنَ الِاخْتِبارِ؟')) return;
  if (RUN) RUN.alive = false; stopVoice(); $('#celebrate').classList.remove('on'); renderHome(); show('home');
};

/* ---------- تقرير وليّ الأمر ---------- */
function report() {
  const body = $('#r-body'); body.innerHTML = '';
  const runs = Object.entries(S.log).sort((a, b) => b[0] - a[0]);
  if (!runs.length) { body.innerHTML = '<p class="rempty">لَمْ يُكْمِلْ إيليا أَيَّ اخْتِبارٍ بَعْدُ.</p>'; }
  Object.entries(TESTS).forEach(([k, t]) => {
    const mine = runs.filter(([, r]) => r.t === k); if (!mine.length) return;
    const [ts, last] = mine[0], d = new Date(+ts);
    const qmap = Object.fromEntries(t.qs.map(q => [q.id, q]));
    const rows = last.q.map(([id, s, w], i) => { const q = qmap[id] || {}; return `<tr class="${s < 3 ? 'weak' : ''}"><td>${AR(i + 1)}</td><td>${q.skill || id}</td><td>${q.page ? 'ص ' + AR(q.page) : ''}</td><td class="st">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</td><td>${w ? AR(w) : '—'}</td></tr>`; }).join('');
    const firstTry = last.q.filter(x => x[1] === 3).length, weak = last.q.filter(x => x[1] < 3).map(x => qmap[x[0]]).filter(Boolean);
    const sec = el('div', 'rsec', `<h3>${t.icon} ${t.title.replace(/[ًٌٍَُِّْ]/g, '')} <small>آخر محاولة: ${d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })} — ${d.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })}</small></h3>
      <table class="rtable"><tr><th>#</th><th>المهارة المقيسة</th><th>الكتاب</th><th>النجوم</th><th>الأخطاء</th></tr>${rows}</table>
      <p class="rnote">النتيجة: <b>${AR(last.s)} من ${AR(last.m)}</b> نجمة (${AR(Math.round(last.s / last.m * 100))}٪) — أجاب عن ${AR(firstTry)} من ${AR(last.q.length)} أسئلة من أول محاولة.</p>
      ${weak.length ? `<p class="rnote warn">يُستحسن مراجعته في: ${weak.map(q => `${q.skill} (ص ${AR(q.page)})`).join('، ')}.</p>` : '<p class="rnote">ممتاز — أتقن كل مهارات هذا الاختبار من أول محاولة.</p>'}
      <p class="rhist">سجل المحاولات: ${mine.slice(0, 8).map(([x, r]) => `${new Date(+x).toLocaleDateString('ar', { day: 'numeric', month: 'numeric' })}: ${AR(r.s)}/${AR(r.m)}`).join(' · ')}</p>`);
    body.appendChild(sec);
  });
  $('#report').classList.add('on');
}
$('#h-report').onclick = $('#e-report').onclick = () => { SFX.click(); report(); };
$('#r-close').onclick = () => $('#report').classList.remove('on');
$('#report').addEventListener('click', e => { if (e.target.id === 'report') $('#report').classList.remove('on'); });

renderHome();
addEventListener('pageshow', e => { if (e.persisted) renderHome(); });
const qs = new URLSearchParams(location.search);          // اختبار مباشر: ?t=sci&q=5#test
if (qs.get('t') && TESTS[qs.get('t')]) { const t = TESTS[qs.get('t')]; const n = +qs.get('q') || 0; if (n) { t.qs = t.qs.slice(n - 1); t.intro = t.intro; } startTest(qs.get('t')); }
})();
