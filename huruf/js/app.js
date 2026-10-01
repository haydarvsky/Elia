/* عالم إيليا للحروف — محرّك اللعبة */
(() => {
'use strict';
const LET = window.LETTERS;
LET.forEach(L => { L.gen = L.name.replace('حَرْفُ', 'حَرْفِ'); });
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const HAR = /[ً-ْٰـ]/;
const HARg = /[ً-ْٰـ]/g;
const strip = s => s.replace(HARg, '');
const NONJOIN = new Set('اأإآدذرزوؤءة'.split(''));
const baseOf = c => (c === 'إ' || c === 'آ') ? 'أ' : c;
const glyph = L => L.base;                       // الحرف منفرداً للعرض

/* ============ الحفظ ============ */
const KEY = 'elia-letters-v1';
const TEST = location.hash === '#test';
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } })() || {
  unlocked: 1, done: {}, st: {}, xp: 0, gems: 0, last: '', streak: 0
};
const CLOUD = window.EliaSave;                    // المزامنة السحابية (assets/save.js)
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} CLOUD && CLOUD.push(); };
(function dayTick() {
  const t = today();
  if (S.last !== t) {
    const y = new Date(Date.now() - 864e5); const ys = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    S.streak = (S.last === ys) ? S.streak + 1 : 1; S.last = t; save();
  }
})();

/* ============ القوام البكسلي (مولَّد، لا صور منسوخة) ============ */
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function tex(fn, seed = 7, size = 16) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const r = rng(seed);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { x.fillStyle = fn(i, j, r); x.fillRect(i, j, 1, 1); }
  return 'url(' + c.toDataURL() + ')';
}
const pal = (arr, w) => r => { let v = r(), acc = 0; for (let k = 0; k < arr.length; k++) { acc += w ? w[k] : 1 / arr.length; if (v <= acc) return arr[k]; } return arr[arr.length - 1]; };
(function makeTextures() {
  const R = document.documentElement.style;
  const grass = pal(['#5d9c33', '#6aad3a', '#4f8a2b', '#79bd45', '#487d27'], [.3, .25, .2, .13, .12]);
  const dirt = pal(['#8b5a2b', '#79502a', '#9a6a3a', '#6b4423', '#5e3b1c'], [.3, .25, .2, .15, .1]);
  const stone = pal(['#7f7f7f', '#747474', '#8c8c8c', '#6a6a6a', '#999'], [.3, .25, .2, .15, .1]);
  const sand = pal(['#dccf8f', '#e6da9c', '#cfc080', '#efe4ab'], [.35, .25, .25, .15]);
  const snow = pal(['#f4fafc', '#e6f1f6', '#ffffff', '#d7e7ef'], [.35, .25, .25, .15]);
  R.setProperty('--tex-grass', tex((i, j, r) => grass(r), 11));
  R.setProperty('--tex-dirt', tex((i, j, r) => dirt(r), 5));
  R.setProperty('--tex-stone', tex((i, j, r) => stone(r), 3));
  R.setProperty('--tex-sand', tex((i, j, r) => sand(r), 17));
  R.setProperty('--tex-snow', tex((i, j, r) => snow(r), 23));
  R.setProperty('--tex-plank', tex((i, j, r) => (j % 4 === 3) ? '#6b4a25' : ((j < 4 && i === 12) || (j >= 4 && j < 8 && i === 4) || (j >= 8 && j < 12 && i === 9) || (j >= 12 && i === 1)) ? '#76532a' : pal(['#a0763e', '#9a7038', '#ab8045', '#93683a'])(r), 9));
  R.setProperty('--tex-cobble', tex((i, j, r) => { const e = ((i * 7 + j * 3) % 5 === 0) || ((i + j * 5) % 7 === 0); return e ? '#4f4f4f' : stone(r); }, 13));
  const block = (base, lite, dark, seed) => tex((i, j, r) => (i === 0 || j === 0) ? lite : (i === 15 || j === 15) ? dark : pal(base)(r), seed);
  R.setProperty('--tex-gold', block(['#f9d63b', '#f5c518', '#ffe36e', '#e8b90f'], '#fff3a8', '#b8860b', 29));
  R.setProperty('--tex-diamond', block(['#4ae3e0', '#35c9c5', '#76f0ec', '#2bb3b0'], '#c9fffd', '#1b8a87', 31));
  R.setProperty('--tex-hills', (() => {            // تلال وأشجار بكسلية خلف شاشة البداية
    const w = 160, h = 40, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), r = rng(41);
    const layer = (base, amp, per, col, top) => { for (let i = 0; i < w; i++) {
      const y = base + Math.sin(i / w * 6.2832 * per) * amp + Math.sin(i / w * 6.2832 * (per * 2 + 1) + 1) * amp * .4, ys = Math.floor(y / 2) * 2;
      x.fillStyle = col; x.fillRect(i, ys, 1, h - ys); x.fillStyle = top; x.fillRect(i, ys, 1, 1); } };
    layer(16, 7, 2, '#8fcfae', '#b4e3c9'); layer(27, 5, 3, '#62ad70', '#86cc90');
    for (let k = 0; k < 9; k++) { const tx = 2 + (r() * (w - 4) | 0), ty = 27 + (r() * 7 | 0); x.fillStyle = '#5e3b1c'; x.fillRect(tx, ty, 1, 3); x.fillStyle = '#2f7d32'; x.fillRect(tx - 1, ty - 3, 3, 3); x.fillStyle = '#46a34a'; x.fillRect(tx, ty - 4, 1, 1); }
    return 'url(' + c.toDataURL() + ')';
  })());
})();

/* ============ توسيط الحبر ============
   مقاييس الخط لا تضع الحرف العربي في وسط مربّعه (الهمزة والحركات والنقط تزيحه)،
   فنقيس حبره الحقيقي ونزيحه حتى يتوسّط. group = خطّ قاعدة واحد لكل المجموعة. */
const mctx = document.createElement('canvas').getContext('2d');
function centerInk(els, group) {
  els = [...els].filter(e => e && e.textContent.trim()); if (!els.length) return;
  const run = () => {
    const ms = els.map(e => { const cs = getComputedStyle(e); mctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return mctx.measureText(e.textContent); });
    const up = Math.max(...ms.map(m => m.actualBoundingBoxAscent)), dn = Math.max(...ms.map(m => m.actualBoundingBoxDescent));
    els.forEach((e, i) => {
      const m = ms[i], a = group ? up : m.actualBoundingBoxAscent, d = group ? dn : m.actualBoundingBoxDescent;
      const dy = ((m.fontBoundingBoxDescent - m.fontBoundingBoxAscent) - (d - a)) / 2;
      if (isFinite(dy)) e.style.transform = `translateY(${dy.toFixed(1)}px)`;
    });
  };
  document.fonts && document.fonts.ready ? document.fonts.ready.then(run) : run();
}
const ink = html => `<span class="ink">${html}</span>`;
/* دخول العناصر بالتتابع */
function enter(els, step = 45) {
  [...els].forEach((e, i) => {
    e.style.setProperty('--i', i); e.style.setProperty('--step', step + 'ms'); e.classList.add('enter');
    const end = ev => { if (ev.target !== e || ev.animationName !== 'enter') return; e.classList.remove('enter'); e.removeEventListener('animationend', end); };
    e.addEventListener('animationend', end);
  });
}

/* ============ أيقونات بكسل ============ */
function pix(map, colors, w) {
  const rows = map.trim().split('\n').map(s => s.trim()); w = w || rows[0].length; let out = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}
const IC = {
  heart: pix(`
.kk.kk.
krrkrrk
krwrrrk
krrrrrk
.krrrk.
..krk..
...k...`, { k: '#000', r: '#e0342f', w: '#fff' }),
  gem: pix(`
..kkkk..
.kcwwck.
kcwcccck
kcccccdk
.kcccdk.
..kcdk..
...kk...`, { k: '#000', c: '#4ae3e0', w: '#e9ffff', d: '#1b8a87' }),
  star: pix(`
...k...
..kyk..
kkkyykk
kyyyyyk
.kyyyk.
.kykyk.
kk...kk`, { k: '#000', y: '#ffd83d' }),
  fire: pix(`
...k...
..kok..
.koook.
kooyook
koyyyok
koyyyok
.kkkkk.`, { k: '#000', o: '#ff7a1a', y: '#ffe14d' }),
  speak: pix(`
....k...
...kk.w.
kkkwk..w
kwwwk.w.
kwwwk..w
kkkwk.w.
...kk...
....k...`, { k: '#000', w: '#fff' }),
  home: pix(`
...kk...
..kwwk..
.kwwwwk.
kwwwwwwk
.kwkkwk.
.kwkbwk.
.kwkkwk.
.kkkkkk.`, { k: '#000', w: '#fff', b: '#8b5a2b' }),
  back: pix(`
...k....
..kk....
.kwkkkkk
kwwwwwwk
.kwkkkkk
..kk....
...k....`, { k: '#000', w: '#fff' }),
  book: pix(`
kkkkkkkk
kwwrrwwk
kwwrrwwk
kwwrrwwk
kwwrrwwk
kbbbbbbk
kkkkkkkk`, { k: '#000', w: '#f4ecd6', r: '#e0342f', b: '#8b5a2b' }),
  note: pix(`
..kkkkkk
..kbbbbk
..kkkkbk
..k...bk
kkk..kkk
kbk..kbk
kkk..kkk`, { k: '#000', b: '#3d8bff' }),
  compass: pix(`
..kkkk..
.kyyyyk.
kyyrryyk
kyyrkyyk
kyykwyyk
kyywwyyk
.kyyyyk.
..kkkk..`, { k: '#000', y: '#ffd83d', r: '#e0342f', w: '#fff' }),
  pick: pix(`
.kkkkkk.
kcccccck
.kk..kk.
...kbk..
...kbk..
...kbk..
...kbk..
....k...`, { k: '#000', c: '#4ae3e0', b: '#8b5a2b' }),
  sword: pix(`
......kk
.....kck
....kck.
.k.kck..
..kck...
..kbk...
.kbk.k..
kk......`, { k: '#000', c: '#4ae3e0', b: '#8b5a2b' }),
  chest: pix(`
kkkkkkkk
kbbbbbbk
kkkyykkk
kbbkkbbk
kbbbbbbk
kkkkkkkk`, { k: '#000', b: '#a0763e', y: '#ffd83d' }),
  redo: pix(`
..kkkk..
.kwwwwk.
kwk..kwk
kwk..kkk
kwk..kwk
.kwwwwk.
..kkkk..`, { k: '#000', w: '#fff' }),
};

/* ============ الصوت ============ */
const MUSIC = window.EliaMusic;                    // الموسيقى الخلفية (assets/music.js)
const SHOP = window.EliaShop;                      // المتجر: السيف والرفيق والمؤثرات المجهَّزة (assets/shop.js)
const voice = new Audio(); voice.preload = 'auto'; MUSIC && MUSIC.watch(voice);
let playToken = 0;
function play(src) {
  const tok = ++playToken;
  return new Promise(res => {
    const done = () => { voice.onended = voice.onerror = null; res(tok === playToken); };
    voice.onended = done; voice.onerror = done;
    voice.src = src; voice.currentTime = 0;
    const p = voice.play(); if (p && p.catch) p.catch(done);
  });
}
function stopVoice() { playToken++; try { voice.pause(); } catch (e) {} }
async function seq(list) { for (const s of list) { const ok = await play(s); if (!ok) return false; await sleep(120); } return true; }
const pad = n => String(n).padStart(2, '0');
const AU = {
  name: L => `assets/audio/L${pad(L.id)}/n.mp3`,
  syl: (L, k) => `assets/audio/L${pad(L.id)}/s${k}.mp3`,
  story: L => `assets/audio/L${pad(L.id)}/story.mp3`,
  word: (L, w) => { const i = L.words.indexOf(w); return i < 0 ? null : `assets/audio/L${pad(L.id)}/w${pad(i)}.mp3`; },
  ui: k => `assets/audio/ui/${k}.mp3`,
  elia: k => `assets/audio/elia/${k}.mp3?v=5`,
};
function sayWord(L, w) { const s = AU.word(L, w); if (s) return play(s); return Promise.resolve(true); }

/* مؤثرات صوتية مولّدة بالمتصفح */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type = 'square', vol = .08, when = 0, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d = .15, vol = .25) {
  const a = ac(); if (!a) return; const b = a.createBuffer(1, a.sampleRate * d, a.sampleRate); const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = vol;
  s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
}
const SFX = {
  click: () => tone(520, .06, 'square', .05),
  good: () => { tone(523, .12, 'triangle', .12); tone(659, .12, 'triangle', .12, .1); tone(784, .22, 'triangle', .12, .2); },
  bad: () => tone(180, .3, 'sawtooth', .07, 0, 90),
  brk: () => { noise(.18, .35); tone(140, .08, 'square', .06); },
  slash: () => { noise(.1, .32); tone(900, .13, 'sawtooth', .05, 0, 180); },
  hit: () => noise(.06, .2),
  xp: () => tone(1100, .09, 'sine', .08, 0, 1700),
  lvl: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'triangle', .1, i * .09)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ============ لوحة المعلومات ============ */
const lvlOf = xp => Math.floor(xp / 100) + 1;
function renderHud() {
  const setXp = id => { const b = $(id); if (!b) return; b.querySelector('i').style.width = (S.xp % 100) + '%'; b.querySelector('b').textContent = AR(lvlOf(S.xp)); };
  setXp('#t-xp'); setXp('#m-xp'); setXp('#l-xp');
  const gems = `${IC.gem}<span>${AR(S.gems)}</span>`;
  ['#t-gems', '#m-gems', '#l-gems'].forEach(i => $(i).innerHTML = gems);
  $('#t-days').innerHTML = `${IC.fire}<span>الْيَوْمُ ${AR(S.streak)}</span>`;
}
function addXp(n, gems = 0) {
  const before = lvlOf(S.xp); S.xp += n; S.gems += gems; save(); renderHud(); SFX.xp();
  const on = document.querySelector('.screen.on'); if (on) { flyOrbs(on.querySelector('.xpbar'), Math.min(8, 2 + n / 8 | 0)); if (gems) flyOrbs(on.querySelector('.chip[id$=gems]'), Math.min(6, gems), 'gem'); }
  toast(`+${AR(n)} نِقاطُ خِبْرَةٍ` + (gems ? ` · <span class="ad">+${AR(gems)} 💎</span>` : ''));
  if (lvlOf(S.xp) > before) setTimeout(() => { SFX.lvl(); toast(`<span class="ad">⬆ الْمُسْتَوى ${AR(lvlOf(S.xp))}!</span>`); }, 900);
}
function flyOrbs(t, n = 5, cls = '') {            // كرات تطير إلى شريط الخبرة / الجواهر
  if (!t || !t.offsetParent) return; const r = t.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2, sx = innerWidth / 2, sy = innerHeight * .55;
  for (let i = 0; i < n; i++) {
    const o = el('i', 'orb ' + cls); document.body.appendChild(o);
    const mx = sx + (Math.random() - .5) * 320, my = sy + (Math.random() - .5) * 220;
    o.animate([{ transform: `translate(${sx}px,${sy}px) scale(.3)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.25)`, opacity: 1, offset: .35 }, { transform: `translate(${tx}px,${ty}px) scale(.6)`, opacity: 1 }],
      { duration: 620 + i * 70, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { o.remove(); t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); if (i % 2 === 0) tone(1300 + i * 90, .05, 'sine', .05); };
  }
}
let toastT;
function toast(h) { const t = $('#toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }

/* ============ الاحتفال ============ */
const CELEB = {
  siuuu: { img: 'siuuu', say: 'سِيييييييي!', au: 'siuuu', anim: 'siuuu' },
  smart: { img: 'smart', say: 'أَنا ذَكِيٌّ!', au: 'smart', anim: 'smart' },
  easy: { img: 'smart', say: 'سَهْلَةٌ!', au: 'easy', anim: 'smart' },
  hero: { img: 'siuuu', say: 'أَنا بَطَلٌ!', au: 'hero', anim: 'siuuu' },
  genius: { img: 'smart', say: 'أَنا عَبْقَرِيٌّ!', au: 'genius', anim: 'smart' },
  try: { img: 'tryagain', say: 'بَحاوِلْ مَرَّةً ثانْيَةً!', au: 'tryagain', anim: 'pop' },
  win: { img: 'trophy', say: 'فُزْتُ!', au: 'won', anim: 'pop' },
};
let celebBag = [];
function nextCelebration() {
  if (!celebBag.length) celebBag = shuffle(['siuuu', 'siuuu', 'smart', 'smart', 'genius', 'genius', 'hero', 'easy']);  // بصوت إيليا الحقيقي
  return celebBag.pop();
}
function burst(n = 26, colors, cx = innerWidth / 2, cy = innerHeight * .55, k = 1) {
  const F = SHOP ? SHOP.fx() : { colors: ['#29d162', '#4ae3e0', '#ffd83d', '#fff'], shape: '' }; if (!colors) { colors = F.colors; n = Math.round(n * (F.more || 1)); }
  for (let i = 0; i < n; i++) {
    const b = el('i', 'burst ' + (F.shape || '')); const a = Math.random() * Math.PI * 2, d = (160 + Math.random() * 320) * k, sz = (k < 1 ? 12 : 16) + Math.random() * 10;
    b.style.left = cx - sz / 2 + 'px'; b.style.top = cy - sz / 2 + 'px'; b.style.width = b.style.height = sz + 'px'; b.style.background = pick(colors);
    b.style.setProperty('--dx', Math.cos(a) * d + 'px'); b.style.setProperty('--dy', Math.sin(a) * d - 120 * k + 'px'); b.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(b); setTimeout(() => b.remove(), 1200);
  }
}
const burstAt = (e, n = 12, colors, k = .4) => { const r = e.getBoundingClientRect(); burst(n, colors, r.left + r.width / 2, r.top + r.height / 2, k); };
function celebrate(kind) {
  kind = kind || nextCelebration();
  const c = CELEB[kind]; const box = $('#celebrate'), img = $('#c-img'), say = $('#c-say');
  img.src = `../assets/elia/${c.img}.webp`; img.className = 'who pix'; void img.offsetWidth; img.classList.add(c.anim);
  say.textContent = c.say; say.style.animation = 'none'; void say.offsetWidth; say.style.animation = '';
  box.classList.toggle('sad', kind === 'try'); box.classList.add('on');
  if (kind !== 'try') { SFX.good(); setTimeout(() => burst(kind === 'win' ? 60 : 30), kind === 'siuuu' || kind === 'hero' ? 1000 : 350); }
  else SFX.bad();
  return new Promise(res => {
    let closed = false;
    const close = () => { if (closed) return; closed = true; box.classList.remove('on'); box.onclick = null; res(); };
    box.onclick = () => { stopVoice(); close(); };
    (async () => {
      const t0 = Date.now();
      if (c.au) await play(AU.elia(c.au));
      if (c.ui) await play(AU.ui(c.ui));
      if (kind !== 'try' && kind !== 'win' && Math.random() < .35) await play(AU.ui(pick(['great1', 'great2', 'great3'])));
      const min = kind === 'win' ? 2600 : 1700; const left = min - (Date.now() - t0); if (left > 0) await sleep(left);
      close();
    })();
  });
}

/* ============ الشاشات ============ */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); renderHud(); }
function currentLetterId() { for (let i = 1; i <= LET.length; i++) if (!S.done[i] && i <= S.unlocked) return i; return Math.min(S.unlocked, LET.length); }

/* ---- البداية ---- */
function factsFor(L) {
  const g = `<b>${glyph(L)}</b>`, n = L.name;
  const f = [
    `${n}: ${L.dots}.`,
    `${n} لَهُ ثَلاثَةُ أَصْواتٍ: <b>${L.syl.join(' ')}</b>`,
    `يُكْتَبُ ${n} في أَوَّلِ الْكَلِمَةِ هٰكَذا: <b>${L.forms.start.form || g}</b>`,
    `يُكْتَبُ ${n} في آخِرِ الْكَلِمَةِ هٰكَذا: <b>${L.forms.end.form || g}</b>`,
    `مِنْ كَلِماتِ ${L.gen}: <b>${L.sylWords.filter(Boolean).join('، ')}</b>`,
  ];
  if (L.sisters.length) f.push(`${n} يُشْبِهُ: <b>${L.sisters.join(' ')}</b>، وَالْفَرْقُ في النُّقَطِ!`);
  if (L.nonjoin) f.push(`${n} لا يَتَّصِلُ بِالْحَرْفِ الَّذي بَعْدَهُ.`);
  return f;
}
function renderTitle() {
  $('#t-pet').innerHTML = SHOP ? SHOP.pet() : '';
  const L = LET[currentLetterId() - 1]; const f = factsFor(L);
  const day = Math.floor(Date.now() / 864e5);
  $('#d-fact').innerHTML = f[day % f.length];
  $('#d-ic').innerHTML = `<span style="display:inline-block;width:30px;height:30px">${IC.chest}</span>`;
  $('#daily').onclick = () => { SFX.click(); play(AU.name(L)); };
}
$('#b-play').onclick = () => { SFX.click(); play(AU.elia('letsplay')); openLevel(currentLetterId()); };
$('#b-map').onclick = () => { SFX.click(); renderMap(); show('map'); };

/* ---- الخريطة ---- */
const BIOMES = [
  { u: 1, t: 'الْوَحْدَةُ الْأولى · سُهولُ الْعُشْبِ' },
  { u: 2, t: 'الْوَحْدَةُ الثّانِيَةُ · صَحْراءُ الرِّمالِ' },
  { u: 3, t: 'الْوَحْدَةُ الثّالِثَةُ · جِبالُ الثَّلْجِ' },
];
function renderMap() {
  const sc = $('#m-scroll'); sc.innerHTML = ''; const cur = currentLetterId();
  BIOMES.forEach(B => {
    const sec = el('div', 'biome u' + B.u); sec.appendChild(el('h3', 'sign mc-text', B.t)); const path = el('div', 'path');
    LET.filter(L => L.unit === B.u).forEach(L => {
      const st = S.done[L.id] ? 'done' : L.id <= S.unlocked ? 'open' : 'locked';
      const b = el('button', 'lvl ' + st, `<span class="n">${AR(L.id)}</span>${st === 'locked' ? '' : ink(glyph(L))}`);
      if (S.done[L.id]) { const s = el('div', 'stars'); for (let k = 0; k < 3; k++) s.innerHTML += `<span style="${k < S.done[L.id] ? '' : 'filter:grayscale(1) brightness(.5)'}">${IC.star}</span>`; b.appendChild(s); }
      if (L.id === cur) { const y = el('img', 'you pix'); y.src = '../assets/elia/hello.webp'; b.appendChild(y); }
      b.onclick = () => {
        if (st === 'locked') { SFX.bad(); b.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); toast('🔒 اِجْتَزْ تَحَدِّيَ الْحَرْفِ السّابِقِ أَوَّلاً'); return; }
        SFX.click(); openLevel(L.id);
      };
      path.appendChild(b);
    });
    sec.appendChild(path); sc.appendChild(sec);
  });
  enter(sc.querySelectorAll('.lvl'), 22); sc.querySelectorAll('.lvl .ink').forEach(e => centerInk([e]));
  requestAnimationFrame(() => { const y = sc.querySelector('.you'); if (y) y.parentElement.scrollIntoView({ block: 'center' }); });
}
$('#t-hub').innerHTML = IC.home; $('#t-shop').innerHTML = IC.chest; if (!SHOP) $('#t-shop').remove();
document.querySelectorAll('.musicbtn').forEach(b => { b.innerHTML = IC.note; b.onclick = () => { SFX.click(); MUSIC && MUSIC.toggle(); }; });
MUSIC ? MUSIC.onChange(on => document.querySelectorAll('.musicbtn').forEach(b => b.classList.toggle('off', !on))) : document.querySelectorAll('.musicbtn').forEach(b => b.remove());
$('#m-home').innerHTML = IC.home; $('#m-home').onclick = () => { SFX.click(); renderTitle(); show('title'); };

/* ---- مستوى الحرف ---- */
const STATIONS = [
  { k: 'shape', t: 'شَكْلُ الْحَرْفِ', ic: 'book' },
  { k: 'sound', t: 'صَوْتُ الْحَرْفِ', ic: 'note' },
  { k: 'pos', t: 'مَواضِعُ الْحَرْفِ', ic: 'compass' },
  { k: 'words', t: 'كَلِماتٌ بِالْحَرْفِ', ic: 'pick' },
  { k: 'boss', t: 'التَّحَدّي', ic: 'sword' },
];
let CUR = null, CURST = 0;
const stDone = (id, i) => !!(S.st[id] && S.st[id][i]);
const bossOpen = id => S.done[id] || [0, 1, 2, 3].every(i => stDone(id, i));
function openLevel(id) {
  CUR = LET[id - 1];
  $('#l-name').textContent = CUR.name;
  let first = [0, 1, 2, 3].find(i => !stDone(id, i)); if (first == null) first = 4;
  if (S.done[id]) first = 0;
  renderHearts(3, true); setCombo(0); show('level'); openStation(first); enter($('#l-stations').children, 60);
}
$('#l-back').innerHTML = IC.back; $('#l-back').onclick = () => { SFX.click(); stopVoice(); endBattle(); renderMap(); show('map'); };
function renderStations() {
  const box = $('#l-stations'); box.innerHTML = '';
  STATIONS.forEach((s, i) => {
    const lock = i === 4 && !bossOpen(CUR.id);
    const b = el('button', 'st panel' + (i === CURST ? ' cur' : '') + (lock ? ' lock' : '') + ((i < 4 && stDone(CUR.id, i)) || (i === 4 && S.done[CUR.id]) ? ' ok' : ''),
      `<span class="ic slot">${IC[s.ic]}</span><span>${s.t}</span>`);
    b.onclick = () => { if (lock) { SFX.bad(); toast('أَكْمِلِ الْمَحَطّاتِ الْأَرْبَعَ لِيُفْتَحَ التَّحَدّي ⚔'); return; } SFX.click(); stopVoice(); openStation(i); };
    box.appendChild(b);
  });
}
function renderHearts(n, hide) {
  const h = $('#l-hearts'); h.innerHTML = ''; h.style.display = hide ? 'none' : '';
  for (let i = 0; i < 3; i++) h.innerHTML += `<span class="${i < n ? '' : 'lost'}">${IC.heart}</span>`;
}
function openStation(i) {
  CURST = i; endBattle(); renderStations(); renderHearts(3, i !== 4);
  const stage = $('#stage'); stage.innerHTML = ''; stage.scrollTop = 0;
  ({ shape: stShape, sound: stSound, pos: stPos, words: stWords, boss: stBoss })[STATIONS[i].k](stage, CUR);
}
async function stationComplete(i) {
  if (!S.st[CUR.id]) S.st[CUR.id] = [0, 0, 0, 0];
  const first = !S.st[CUR.id][i]; S.st[CUR.id][i] = 1; save();
  await celebrate();
  if (first) addXp(20, 1);
  renderStations();
  const nxt = i + 1;
  const card = el('div', 'card panel', `<div class="row"><span style="font-size:34px">🎉 أَحْسَنْتَ! أَنْهَيْتَ مَحَطَّةَ «${STATIONS[i].t}»</span></div>`);
  const row = el('div', 'row'); row.style.marginTop = '12px';
  const b = el('button', 'btn green big', nxt === 4 ? (bossOpen(CUR.id) ? '⚔ إِلى التَّحَدّي' : 'الْمَحَطَّةُ التّالِيَةُ') : 'الْمَحَطَّةُ التّالِيَةُ ←');
  b.onclick = () => { SFX.click(); let n = nxt; if (n === 4 && !bossOpen(CUR.id)) n = [0, 1, 2, 3].find(k => !stDone(CUR.id, k)); openStation(n); if (n === 4) play(AU.ui('challenge')); };
  row.appendChild(b); card.appendChild(row); $('#stage').appendChild(card); card.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

/* ---- أدوات العرض ---- */
function hlWord(w, L) {           // يلوّن الحرف داخل الكلمة بالأحمر
  const ch = [...w]; let out = '';
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    if (!HAR.test(c) && baseOf(c) === L.base.replace('ـ', '')) {
      let g = c; while (i + 1 < ch.length && HAR.test(ch[i + 1])) g += ch[++i];
      out += `<span class="hl">${g}</span>`;
    } else out += c;
  }
  return out;
}
function speakBtn(fn, cls = 'btn icon') { const b = el('button', cls + ' speak', IC.speak); b.onclick = e => { e.stopPropagation(); SFX.click(); fn(); }; return b; }
function sectionCard(title, tag) { const c = el('div', 'card panel'); c.appendChild(el('h2', '', title + (tag ? ` <span class="tag">${tag}</span>` : ''))); return c; }
function letterIdx(w, L) {        // مواضع الحرف في الكلمة (فهارس المحارف الأساسية)
  const ch = [...w]; const base = []; ch.forEach((c, i) => { if (!HAR.test(c)) base.push(i); });
  const hits = base.filter(i => baseOf(ch[i]) === L.base); return { ch, base, hits };
}
function gapHTML(w, L, cat) {
  const { ch, base, hits } = letterIdx(w, L); if (!hits.length) return null;
  let idx;
  if (cat === 'start') idx = hits.find(i => i === base[0]);
  else if (cat === 'middle') idx = hits.find(i => i !== base[0] && i !== base[base.length - 1]);
  else idx = hits.slice().reverse().find(i => i === base[base.length - 1]);
  if (idx == null) idx = hits[0];
  let end = idx + 1; while (end < ch.length && HAR.test(ch[end])) end++;
  let pre = ch.slice(0, idx).join(''), post = ch.slice(end).join('');
  const prevBase = [...strip(pre)].pop();
  if (prevBase && !NONJOIN.has(prevBase)) pre += '‍';
  if (post && !NONJOIN.has(L.base)) post = '‍' + post;
  return `<span>${pre}</span><span class="gap"></span><span>${post}</span>`;
}
function catOf(L, w) { for (const k of ['start', 'middle', 'end', 'alone']) if (L.forms[k].words.includes(w)) return k; return null; }
const POSLBL = { start: 'أَوَّلَ الْكَلِمَةِ', middle: 'وَسَطَ الْكَلِمَةِ', end: 'آخِرَ الْكَلِمَةِ', alone: 'آخِرَ الْكَلِمَةِ' };
const POSTITLE = { start: 'في أَوَّلِ الْكَلِمَةِ', middle: 'في وَسَطِ الْكَلِمَةِ', end: 'في آخِرِ الْكَلِمَةِ مُتَّصِلاً', alone: 'في آخِرِ الْكَلِمَةِ مُنْفَصِلاً' };
const POSAU = { start: 'p_start', middle: 'p_middle', end: 'p_end', alone: 'p_alone' };
const containsLetter = (w, L) => letterIdx(w, L).hits.length > 0;
function otherWords(L, n) {
  const pool = []; LET.forEach(M => { if (M.id !== L.id) M.words.forEach(w => { if (!containsLetter(w, L) && strip(w).length >= 3 && strip(w).length <= 6 && !w.includes(' ')) pool.push(w); }); });
  return shuffle(pool).slice(0, n);
}

/* ============ أسئلة (كل سؤال يرجع وعداً بصحّته) ============ */
function optionsQ(host, { prompt, bigHTML, opts, correct, txt, onShow, replay }) {
  return new Promise(res => {
    const g = el('div', 'game'); const q = el('div', 'q', prompt + (bigHTML ? `<span class="big">${bigHTML}</span>` : '')); g.appendChild(q);
    if (replay) { const lb = el('button', 'btn listen-btn pulse', IC.speak); lb.onclick = () => { SFX.click(); replay(); }; g.appendChild(lb); }
    const box = el('div', 'opts'); let locked = false;
    opts.forEach(o => {
      const b = el('button', 'opt' + (txt ? ' txt' : ''), ink(o.html)); if (TEST && o.v === correct) b.dataset.c = 1;
      b.onclick = () => {
        if (locked) return; locked = true; const ok = o.v === correct;
        b.classList.add(ok ? 'good' : 'bad'); if (ok) burstAt(b, 14);
        if (!ok) box.querySelectorAll('.opt').forEach((x, i) => { if (opts[i].v === correct) setTimeout(() => x.classList.add('good'), 350); });
        setTimeout(() => res(ok), ok ? 350 : 900);
      };
      box.appendChild(b);
    });
    g.appendChild(box); host.appendChild(g); enter(box.children, 70); centerInk(box.querySelectorAll('.ink'), true); if (onShow) onShow();
  });
}
const Q = {
  syl(host, L) {
    const k = Math.random() * 3 | 0; if (!L.syl[k]) return Q.letterFind(host, L);
    const hear = () => play(AU.syl(L, k));
    return optionsQ(host, { prompt: 'اسْمَعْ وَاخْتَرِ الصَّوْتَ الصَّحيحَ', opts: shuffle(L.syl.map((s, i) => ({ v: i, html: s })).filter(o => o.html)), correct: k, replay: hear,
      onShow: () => seq([AU.ui('listen'), AU.syl(L, k)]) });
  },
  letterFind(host, L) {
    const pool = shuffle(LET.filter(M => M.id !== L.id && !L.sisters.includes(M.ch)).map(glyph));
    const d = shuffle(L.sisters.map(s => s === 'هـ' ? 'ه' : s)).slice(0, 2); while (d.length < 3) d.push(pool.pop());
    return optionsQ(host, { prompt: `أَيْنَ ${L.name}؟`, opts: shuffle([glyph(L), ...d].map(v => ({ v, html: v }))), correct: glyph(L), replay: () => play(AU.name(L)),
      onShow: () => seq([AU.ui('where'), AU.name(L)]) });
  },
  posQ(host, L) {
    const cats = ['start', 'middle', 'end', 'alone'].filter(k => L.forms[k].words.length); const cat = pick(cats); const w = pick(L.forms[cat].words);
    const ans = cat === 'alone' ? 'end' : cat;
    return optionsQ(host, { prompt: `أَيْنَ جاءَ ${L.name} في الْكَلِمَةِ؟`, bigHTML: hlWord(w, L), txt: true,
      opts: ['start', 'middle', 'end'].map(v => ({ v, html: POSLBL[v] })), correct: ans, replay: () => sayWord(L, w), onShow: () => seq([AU.ui('where'), AU.word(L, w)].filter(Boolean)) });
  },
  formGap(host, L) {
    const cats = ['start', 'middle', 'end', 'alone'].filter(k => L.forms[k].words.length && L.forms[k].form); const cat = pick(cats);
    const w = L.forms[cat].words.find(x => gapHTML(x, L, cat)) || L.forms[cat].words[0]; const gh = gapHTML(w, L, cat) || w;
    const forms = [...new Set(['start', 'middle', 'end', 'alone'].map(k => L.forms[k].form).filter(Boolean))];
    return optionsQ(host, { prompt: 'اخْتَرْ شَكْلَ الْحَرْفِ الْمُناسِبَ', bigHTML: `<span class="gapword">${gh}</span>`,
      opts: shuffle(forms.map(v => ({ v, html: v }))), correct: L.forms[cat].form, replay: () => sayWord(L, w), onShow: () => seq([AU.ui('form'), AU.word(L, w)].filter(Boolean)) });
  },
  whichWord(host, L) {
    const good = pick(L.words.filter(w => containsLetter(w, L) && !w.includes(' ') && strip(w).length <= 7)); const bad = otherWords(L, 2);
    return optionsQ(host, { prompt: `أَيُّ كَلِمَةٍ فيها <span class="hl" style="font-size:1.3em">${glyph(L)}</span>؟`, txt: true,
      opts: shuffle([good, ...bad].map(v => ({ v, html: v }))), correct: good, onShow: () => play(AU.ui('word')) });
  },
  listenWord(host, L) {
    const ws = shuffle(L.words.filter(w => AU.word(L, w) && !w.includes(' ') && strip(w).length <= 7)).slice(0, 3); const good = ws[0];
    return optionsQ(host, { prompt: 'اسْمَعْ وَاخْتَرِ الْكَلِمَةَ', txt: true, opts: shuffle(ws.map(v => ({ v, html: hlWord(v, L) }))), correct: good,
      replay: () => sayWord(L, good), onShow: () => seq([AU.ui('listen'), AU.word(L, good)]) });
  },
  build(host, L) {
    const cands = (L.build.length ? L.build : L.words).filter(w => { const n = strip(w).length; return n >= 3 && n <= 4 && !w.includes(' '); });
    if (!cands.length) return Q.whichWord(host, L);
    const w = pick(cands); const letters = [...strip(w)];
    return new Promise(res => {
      const g = el('div', 'game'); g.appendChild(el('div', 'q', 'رَكِّبِ الْحُروفَ لِتُكَوِّنَ الْكَلِمَةَ'));
      const lb = el('button', 'btn listen-btn pulse', IC.speak); lb.onclick = () => { SFX.click(); sayWord(L, w); }; g.appendChild(lb);
      const slots = el('div', 'slots'); letters.forEach(() => slots.appendChild(el('div', 's slot', ''))); g.appendChild(slots);
      const tiles = el('div', 'tiles'); let pos = 0, mist = 0;
      shuffle(letters.map((c, i) => ({ c, i }))).forEach(t => {
        const b = el('button', 'opt', ink(t.c)); if (TEST) b.dataset.i = t.i;
        b.onclick = () => {
          if (t.c === letters[pos]) {
            SFX.hit(); const sl = slots.children[pos]; sl.innerHTML = ink(t.c); centerInk(sl.children); sl.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 220 }); burstAt(sl, 6, ['#ffd83d', '#fff'], .22); b.classList.add('used'); pos++;
            if (pos === letters.length) {
              slots.innerHTML = `<div class="gapword">${hlWord(w, L)}</div>`; SFX.good(); burstAt(slots, 18, undefined, .5);
              sayWord(L, w).then(() => res(mist <= 1));
            }
          } else { mist++; SFX.bad(); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); }
        };
        tiles.appendChild(b);
      });
      g.appendChild(tiles); host.appendChild(g); enter(tiles.children, 60); centerInk(tiles.querySelectorAll('.ink'), true); seq([AU.ui('build'), AU.word(L, w)].filter(Boolean));
    });
  },
};


/* ============ تمارين قلم الآيباد ============ */
const SK = window.STROKES || {};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function inkBox(c2, W, ch) {        // موضع صندوق حبر الحرف داخل مربّع الرسم
  c2.textAlign = 'center'; c2.textBaseline = 'alphabetic';
  c2.font = `700 ${W * .7}px "Sakkal Saad"`; let m = c2.measureText(ch);
  const k = Math.min(W * .66 / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), W * .7 / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight)), fs = W * .7 * k;
  c2.font = `700 ${fs}px "Sakkal Saad"`; m = c2.measureText(ch);
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const y = W / 2 + h / 2 - m.actualBoundingBoxDescent, x = W / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  return { x, y, left: x - m.actualBoundingBoxLeft, top: y - m.actualBoundingBoxAscent, w, h };
}
function resample(pts, step) {      // نقاط متساوية البعد على المسار
  const out = [pts[0]]; let need = step;
  for (let i = 1; i < pts.length; i++) { let a = pts[i - 1]; const b = pts[i]; let d = dist(a, b);
    while (d >= need) { const t = need / d; a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; out.push(a); d -= need; need = step; } need -= d; }
  if (dist(out[out.length - 1], pts[pts.length - 1]) > step * .3) out.push(pts[pts.length - 1]); return out;
}
function penCanvas(box, n) {        // طبقات كانفس متراكبة بدقّة الشاشة
  const cs = Array.from({ length: n }, () => { const c = el('canvas'); box.appendChild(c); return c; });
  const fit = () => { const W = box.clientWidth, dpr = devicePixelRatio || 1; cs.forEach(c => { c.width = c.height = Math.round(W * dpr); c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }); return W; };
  return { cs, fit };
}
const pt = (cv, e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

/* ---- الكتابة بترتيب الخط: نقطة بداية وسهم، والقلم يتبع المسار بالاتجاه الصحيح ---- */
function strokeGame(host, L, opt = {}) {
  const D = SK[glyph(L)]; if (!D) return traceGame(host, L);
  return new Promise(res => {
    const wrap = el('div', 'game'), box = el('div', 'tracebox pen'), row = el('div', 'row');
    const { cs: [bg, gd, ink], fit } = penCanvas(box, 3), g = bg.getContext('2d'), x = gd.getContext('2d'), k = ink.getContext('2d');
    const show = el('button', 'btn', '👀 أَرِني'), clr = el('button', 'btn', `<span style="width:30px;height:30px;display:inline-block">${IC.redo}</span> امْسَحْ`);
    row.append(show, clr); wrap.append(box, row); host.appendChild(wrap);
    let W = 0, T = 0, steps = [], cur = 0, prog = 0, on = false, down = false, penSeen = false, last = null, done = false, demo = 0, miss = 0, off = false;
    function setup() {
      W = fit(); T = W * .085; const B = inkBox(g, W, glyph(L)), P = p => [B.left + p[0] / 100 * B.w, B.top + p[1] / 100 * B.h];
      g.clearRect(0, 0, W, W); g.fillStyle = '#e2d5ae'; g.fillText(glyph(L), B.x, B.y);
      steps = D.s.map(s => ({ pts: resample(s.map(P), W * .022) })).concat(D.d.map(d => ({ dot: P(d), r: Math.max(W * .03, D.r / 100 * B.h) })));
      cur = prog = 0; on = false; k.clearRect(0, 0, W, W);
    }
    const line = (pts, a, b) => { x.beginPath(); for (let i = a; i <= b; i++) i === a ? x.moveTo(pts[i][0], pts[i][1]) : x.lineTo(pts[i][0], pts[i][1]); x.stroke(); };
    function frame(t) {
      if (!document.body.contains(gd)) return; requestAnimationFrame(frame);
      if (!steps.length) return; x.clearRect(0, 0, W, W); x.lineCap = x.lineJoin = 'round';
      steps.forEach((s, i) => {
        const isCur = i === cur && !done, past = i < cur || done;
        if (s.dot) {
          if (past) { x.fillStyle = '#2f9e44'; x.beginPath(); x.arc(s.dot[0], s.dot[1], s.r, 0, 7); x.fill(); }
          else if (isCur) { const p = 1 + Math.sin(t / 160) * .18; x.strokeStyle = '#2f9e44'; x.lineWidth = 5; x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(s.dot[0], s.dot[1], s.r * 1.25 * p, 0, 7); x.fill(); x.stroke(); }
          return;
        }
        const n = s.pts.length - 1, upto = past ? n : isCur ? prog : -1;
        if (upto > 0) { x.strokeStyle = '#2f9e44'; x.lineWidth = W * .07; x.setLineDash([]); line(s.pts, 0, upto); }
        if (isCur && upto < n) {
          x.strokeStyle = '#8a6a3a'; x.lineWidth = Math.max(3, W * .011); x.setLineDash([W * .02, W * .024]); line(s.pts, Math.max(0, upto), n); x.setLineDash([]);
          const e = s.pts[n], f = s.pts[Math.max(0, n - 3)], a = Math.atan2(e[1] - f[1], e[0] - f[0]), r = W * .035;      // سهم النهاية
          x.fillStyle = '#8a6a3a'; x.beginPath(); x.moveTo(e[0] + Math.cos(a) * r, e[1] + Math.sin(a) * r); x.lineTo(e[0] + Math.cos(a + 2.4) * r, e[1] + Math.sin(a + 2.4) * r); x.lineTo(e[0] + Math.cos(a - 2.4) * r, e[1] + Math.sin(a - 2.4) * r); x.fill();
          if (!down && !demo) { const u = (t / 14) % ((n - upto) * 10 + 60) / 10, gi = Math.min(n, upto + Math.floor(u)), gp = s.pts[gi];              // نقطة شبحية تبيّن الاتجاه
            x.fillStyle = 'rgba(47,158,68,.55)'; x.beginPath(); x.arc(gp[0], gp[1], W * .028, 0, 7); x.fill(); }
          const st = s.pts[Math.max(0, upto)], p = 1 + Math.sin(t / 160) * .15;                                                                      // نقطة البداية
          x.fillStyle = off ? '#e0342f' : '#2f9e44'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.arc(st[0], st[1], W * .043 * p, 0, 7); x.fill(); x.stroke();
          x.fillStyle = '#fff'; x.font = `800 ${W * .05}px "Sakkal Saad"`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(AR(i + 1), st[0], st[1] + W * .004);
        }
      });
      if (demo) advanceDemo();
    }
    function stepDone() {
      cur++; prog = 0; on = false; tone(600 + cur * 120, .1, 'triangle', .1);
      if (cur >= steps.length) { done = true; SFX.good(); burstAt(box, 16, undefined, .5); setTimeout(() => res({ miss }), 600); }
    }
    function feed(p) {               // تقدّم القلم على المسار: كل نقطة تالية يجب أن يمرّ قربها بالترتيب
      const s = steps[cur]; if (!s || s.dot) return; const n = s.pts.length - 1;
      if (!on) { if (dist(p, s.pts[prog]) < T * 1.5) { on = true; off = false; } else return; }
      let moved = false; while (prog < n && dist(p, s.pts[prog + 1]) < T) { prog++; moved = true; }
      if (prog >= n) return stepDone();
      if (!moved && dist(p, s.pts[prog]) > T * 2.3) { on = false; off = true; miss++; SFX.bad(); }
    }
    function advanceDemo() {         // عرض طريقة الكتابة
      const s = steps[cur]; if (!s) { demo = 0; cur = prog = 0; done = false; return; }
      if (s.dot) { if (++demo > 22) { demo = 1; cur++; } return; }
      prog += 1; if (prog >= s.pts.length - 1) { cur++; prog = 0; }
      if (cur >= steps.length) { demo = 0; setTimeout(() => { if (!done) { cur = prog = 0; } }, 500); }
    }
    ink.addEventListener('pointerdown', e => {
      if (done || demo) return; if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
      e.preventDefault(); try { ink.setPointerCapture(e.pointerId); } catch (er) {} const p = pt(ink, e), s = steps[cur]; down = true; last = p;
      if (s && s.dot) { if (dist(p, s.dot) < s.r * 2.2 + T * .6) stepDone(); else { miss++; off = true; setTimeout(() => off = false, 400); SFX.bad(); } return; }
      feed(p);
    });
    ink.addEventListener('pointermove', e => {
      if (!down || done || demo) return; e.preventDefault();
      (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).concat([e]).forEach(ev => { const p = pt(ink, ev);
        k.strokeStyle = on ? 'rgba(20,60,30,.55)' : 'rgba(224,52,47,.5)'; k.lineWidth = W * .018 * (ev.pointerType === 'pen' && ev.pressure ? .6 + ev.pressure * 1.4 : 1); k.lineCap = 'round';
        k.beginPath(); k.moveTo(last[0], last[1]); k.lineTo(p[0], p[1]); k.stroke(); last = p; if (!done) feed(p); });
    });
    const up = () => { down = false; on = false; };
    ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up);
    clr.onclick = () => { if (done) return; SFX.click(); demo = 0; setup(); };
    show.onclick = () => { if (done) return; SFX.click(); setup(); demo = 1; };
    if (TEST) box._solve = () => { if (!done) { cur = steps.length - 1; prog = 0; stepDone(); } };
    document.fonts.ready.then(() => requestAnimationFrame(() => { setup(); if (opt.demo) demo = 1; requestAnimationFrame(frame); }));
  });
}

/* ---- ضع النقط: هيكل الحرف بلا نقط، والطفل يضعها بالقلم في مكانها ---- */
const dotFamily = L => [L, ...L.sisters.map(s => LET.find(M => M.ch === s || M.base === s)).filter(Boolean)].filter(M => M.ndots > 0 && SK[glyph(M)]);
Q.dots = (host, L) => {
  const fam = dotFamily(L); if (!fam.length) return Q.letterFind(host, L);
  const Tg = fam.includes(L) && Math.random() < .7 ? L : pick(fam), D = SK[glyph(Tg)];
  return new Promise(res => {
    const g = el('div', 'game'); g.appendChild(el('div', 'q', `ضَعِ النُّقَطَ بِالْقَلَمِ لِيَصيرَ <span class="hl">${Tg.name}</span>`));
    const lb = el('button', 'btn listen-btn pulse', IC.speak); lb.onclick = () => { SFX.click(); play(AU.name(Tg)); };
    const box = el('div', 'tracebox pen dots'), { cs: [bg, cv], fit } = penCanvas(box, 2), b = bg.getContext('2d'), x = cv.getContext('2d');
    const row = el('div', 'row'), clr = el('button', 'btn', `<span style="width:30px;height:30px;display:inline-block">${IC.redo}</span> امْسَحْ`), ok = el('button', 'btn green', '✔ تَمَّ');
    row.append(clr, ok); const top = el('div', 'row'); top.append(box, lb); g.append(top, row); host.appendChild(g);
    let W = 0, real = [], r = 10, put = [], locked = false, hint = false, tol = 0;
    function setup() {
      W = fit(); const B = inkBox(b, W, glyph(Tg)), P = p => [B.left + p[0] / 100 * B.w, B.top + p[1] / 100 * B.h];
      b.clearRect(0, 0, W, W); b.fillStyle = '#3b2a14'; b.fillText(glyph(Tg), B.x, B.y);
      D.e.forEach(q => { const a = P([q[0], q[1]]), c = P([q[2], q[3]]); b.clearRect(a[0] - 3, a[1] - 3, c[0] - a[0] + 6, c[1] - a[1] + 6); });      // امحُ النقط الأصلية
      real = D.d.map(P); r = Math.max(W * .035, D.r / 100 * B.h); tol = Math.max(B.w, B.h) * .24; draw();
    }
    function draw() {
      x.clearRect(0, 0, W, W);
      if (hint) real.forEach(p => { x.strokeStyle = '#e0342f'; x.lineWidth = 4; x.setLineDash([6, 5]); x.beginPath(); x.arc(p[0], p[1], r * 1.2, 0, 7); x.stroke(); x.setLineDash([]); });
      put.forEach(p => { x.fillStyle = locked ? '#2f9e44' : '#3b2a14'; x.beginPath(); x.moveTo(p[0], p[1] - r * 1.2); x.lineTo(p[0] + r * 1.2, p[1]); x.lineTo(p[0], p[1] + r * 1.2); x.lineTo(p[0] - r * 1.2, p[1]); x.closePath(); x.fill(); });
    }
    cv.addEventListener('pointerdown', e => {
      if (locked) return; e.preventDefault(); const p = pt(cv, e), i = put.findIndex(q => dist(p, q) < r * 1.8);
      if (i >= 0) put.splice(i, 1); else if (put.length < 4) put.push(p); SFX.hit(); draw();
    });
    function check() {
      if (locked) return; locked = true;
      const good = put.length === real.length && put.every(p => real.some(q => dist(p, q) < tol));
      if (good) { put = real.slice(); draw(); SFX.good(); burstAt(box, 14); setTimeout(() => res(true), 500); }
      else { SFX.bad(); hint = true; locked = false; draw(); locked = true; box.classList.add('nope'); setTimeout(() => res(false), 1300); }
    }
    ok.onclick = check; clr.onclick = () => { if (locked) return; SFX.click(); put = []; draw(); };
    if (TEST) box._solve = good => { put = good ? real.slice() : [[5, 5]]; check(); };
    document.fonts.ready.then(() => requestAnimationFrame(setup));
    seq([AU.ui('dots'), AU.name(Tg)]);
  });
};

/* ---- وصّل بخط: اسحب بالقلم من الكلمة إلى شكل الحرف فيها ---- */
function connectQ(host, { prompt, pairs, onPick }) {
  return new Promise(res => {
    const g = el('div', 'game'); g.appendChild(el('div', 'q', prompt));
    const wrap = el('div', 'link'), A = el('div', 'lcol'), B = el('div', 'lcol'), cv = el('canvas'); wrap.append(A, cv, B);
    const mk = (side, p, i) => { const b = el('button', 'lnk ' + side, `<span class="ink">${side === 'a' ? p.a : p.b}</span><i class="pin"></i>`); b.dataset.k = i; return b; };
    pairs.forEach((p, i) => A.appendChild(mk('a', p, i))); shuffle(pairs.map((p, i) => [p, i])).forEach(([p, i]) => B.appendChild(mk('b', p, i)));
    g.appendChild(wrap); host.appendChild(g); enter(wrap.querySelectorAll('.lnk'), 60);
    const x = cv.getContext('2d'), links = []; let from = null, cur = null, mist = 0, bad = null, sel = null;
    const pin = b => { const r = b.querySelector('.pin').getBoundingClientRect(), w = wrap.getBoundingClientRect(); return [r.left + r.width / 2 - w.left, r.top + r.height / 2 - w.top]; };
    function draw() {
      const w = wrap.clientWidth, h = wrap.clientHeight, dpr = devicePixelRatio || 1; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h); x.lineCap = 'round';
      const ln = (p, q, c, lw) => { x.strokeStyle = '#000'; x.lineWidth = lw + 5; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); x.strokeStyle = c; x.lineWidth = lw; x.stroke(); };
      links.forEach(([a, b]) => ln(pin(a), pin(b), '#29d162', 7));
      if (bad) ln(pin(bad[0]), pin(bad[1]), '#e0342f', 7);
      if (from && cur) ln(pin(from), cur, '#ffd83d', 7);
    }
    function tryLink(a, b) {
      if (a.classList.contains('b')) [a, b] = [b, a];
      if (a.dataset.k === b.dataset.k) {
        links.push([a, b]); [a, b].forEach(e => e.classList.add('ok')); SFX.good(); burstAt(b, 8, undefined, .3); if (onPick) onPick(pairs[+a.dataset.k]);
        if (links.length === pairs.length) setTimeout(() => res(mist <= 1), 700);
      } else { mist++; SFX.bad(); bad = [a, b]; [a, b].forEach(e => { e.classList.remove('nope'); void e.offsetWidth; e.classList.add('nope'); }); setTimeout(() => { bad = null; draw(); }, 450); }
      draw();
    }
    const free = t => { const b = t && t.closest && t.closest('.lnk'); return b && wrap.contains(b) && !b.classList.contains('ok') ? b : null; };
    wrap.addEventListener('pointerdown', e => { const b = free(e.target); if (!b) return; e.preventDefault(); try { wrap.setPointerCapture(e.pointerId); } catch (er) {} from = b; b.classList.add('sel'); SFX.click(); const w = wrap.getBoundingClientRect(); cur = [e.clientX - w.left, e.clientY - w.top]; draw(); });
    wrap.addEventListener('pointermove', e => { if (!from) return; const w = wrap.getBoundingClientRect(); cur = [e.clientX - w.left, e.clientY - w.top]; draw(); });
    const up = e => {
      if (!from) return; const a = from; from = null; cur = null; a.classList.remove('sel');
      const b = free(document.elementFromPoint(e.clientX, e.clientY));
      if (b && b !== a && b.classList.contains('a') !== a.classList.contains('a')) { if (sel) { sel.classList.remove('sel'); sel = null; } tryLink(a, b); }
      else if (b === a) {                                   // نقرة بلا سحب: اختر ثم انقر الطرف الآخر
        if (sel && sel !== a && sel.classList.contains('a') !== a.classList.contains('a')) { const s = sel; sel.classList.remove('sel'); sel = null; tryLink(s, a); }
        else { if (sel) sel.classList.remove('sel'); sel = a; a.classList.add('sel'); }
      }
      draw();
    };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', () => { if (from) from.classList.remove('sel'); from = cur = null; draw(); });
    centerInk(wrap.querySelectorAll('.lnk.b .ink'), true); requestAnimationFrame(draw);
    if (TEST) wrap._solve = () => pairs.forEach((p, i) => { const a = A.querySelector(`[data-k="${i}"]`), b = B.querySelector(`[data-k="${i}"]`); if (!a.classList.contains('ok')) tryLink(a, b); });
  });
}
Q.connect = (host, L) => {
  const seen = new Set(), pairs = [];
  shuffle(['start', 'middle', 'end', 'alone'].filter(k => L.forms[k].form && L.forms[k].words.length)).forEach(k => { const f = L.forms[k].form; if (seen.has(f)) return; seen.add(f); const w = pick(L.forms[k].words); pairs.push({ a: hlWord(w, L), b: f, w }); });
  if (pairs.length < 2) return Q.posQ(host, L);
  seq([AU.ui('connect')]);
  return connectQ(host, { prompt: 'وَصِّلْ بِالْقَلَمِ كُلَّ كَلِمَةٍ بِشَكْلِ الْحَرْفِ فيها', pairs: pairs.slice(0, 3), onPick: p => sayWord(L, p.w) });
};

/* ============ المحطة ١: شكل الحرف ============ */
function stShape(stage, L) {
  const c = sectionCard(`${L.name}`, 'تَعَرَّفْ عَلَيْهِ');
  const row = el('div', 'row'); const fr = el('div', 'frame', `<span class="glyph">${glyph(L)}</span>`);
  fr.onclick = () => { SFX.click(); play(AU.name(L)); fr.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 350 }); };
  row.appendChild(fr);
  const facts = el('div', 'facts');
  facts.innerHTML = `<p>🔴 ${L.name}: <span class="k">${L.dots}</span>.</p>` +
    (L.nonjoin ? `<p>🔗 لا يَتَّصِلُ بِالْحَرْفِ الَّذي بَعْدَهُ.</p>` : `<p>🔗 يَتَّصِلُ بِما قَبْلَهُ وَبِما بَعْدَهُ.</p>`);
  if (L.sisters.length) {
    const s = el('div', 'sisters', '<span>يُشْبِهُهُ في الشَّكْلِ:</span>');
    s.appendChild(el('span', 'minib me', ink(glyph(L)))); L.sisters.forEach(x => s.appendChild(el('span', 'minib', ink(x === 'هـ' ? 'ه' : x))));
    facts.appendChild(s);
  }
  row.appendChild(facts); row.appendChild(speakBtn(() => play(AU.name(L)))); c.appendChild(row); stage.appendChild(c);
  centerInk([fr.firstChild]); centerInk(c.querySelectorAll('.minib .ink'), true);

  const sc = sectionCard('قِصَّةُ الْحَرْفِ', 'مِنْ كِتابي');
  const r2 = el('div', 'row'); const st = el('div', 'story', hlWord(L.story, L)); st.style.flex = '1';
  r2.appendChild(st); r2.appendChild(speakBtn(() => seq([AU.ui('story'), AU.story(L)]))); sc.appendChild(r2); stage.appendChild(sc);

  const tc = sectionCard('اُكْتُبِ الْحَرْفَ بِالْقَلَمِ', 'اِبْدَأْ مِنَ النُّقْطَةِ الْخَضْراءِ وَاتْبَعِ السَّهْمَ ✏'); stage.appendChild(tc);
  strokeGame(tc, L, { demo: true }).then(async () => {
    if (!document.body.contains(tc)) return;
    if (dotFamily(L).length) {      // ثم ضع النقط
      setCombo(COMBO + 1); addXp(xpFor()); await cheer();
      const dc = sectionCard('ضَعِ النُّقَطَ', 'بِالْقَلَمِ ✏'); stage.appendChild(dc); dc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await miniRounds(dc, L, [Q.dots]);
    }
    stationComplete(0);
  });
  setTimeout(() => seq([AU.name(L), SK[glyph(L)] && AU.ui('write')].filter(Boolean)), 250);
}
function traceGame(host, L) {
  return new Promise(res => {
    const wrap = el('div', 'game'); const box = el('div', 'tracebox'); const cv = el('canvas'); box.appendChild(cv);
    const meter = el('div', 'meter', '<i></i>'); const row = el('div', 'row');
    const clr = el('button', 'btn', `<span style="width:30px;height:30px;display:inline-block">${IC.redo}</span> امْسَحْ`);
    row.appendChild(clr); wrap.append(box, meter, row); host.appendChild(wrap);
    const G = 100; let mask, painted, total = 0, doneFlag = false;
    const ctx = cv.getContext('2d');
    function drawGuide() {
      const r = { width: box.clientWidth, height: box.clientHeight }, dpr = devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, r.width, r.height);
      const FS = .7, FAT = .075;
      const drawLetter = (c2, W, fill, dash) => {
        c2.textAlign = 'center'; c2.textBaseline = 'alphabetic';
        c2.font = `700 ${W * FS}px "Sakkal Saad"`; let m = c2.measureText(glyph(L));
        const h0 = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, w0 = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const k = Math.min(W * .66 / h0, W * .7 / w0); c2.font = `700 ${W * FS * k}px "Sakkal Saad"`; m = c2.measureText(glyph(L));
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const y = W / 2 + h / 2 - m.actualBoundingBoxDescent; const x = W / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
        c2.lineJoin = 'round'; c2.lineCap = 'round';
        c2.fillStyle = fill; c2.strokeStyle = fill; c2.lineWidth = W * FAT; c2.strokeText(glyph(L), x, y); c2.fillText(glyph(L), x, y);
        if (dash) { c2.setLineDash([W * .02, W * .025]); c2.lineWidth = Math.max(2, W * .008); c2.strokeStyle = dash; c2.strokeText(glyph(L), x, y); c2.setLineDash([]); c2.fillStyle = '#d3c291'; c2.fillText(glyph(L), x, y); }
      };
      const W = r.width; drawLetter(ctx, W, '#e2d5ae', '#b08d57');
      const oc = document.createElement('canvas'); oc.width = oc.height = G; const o = oc.getContext('2d'); drawLetter(o, G, '#000');
      const d = o.getImageData(0, 0, G, G).data; mask = new Uint8Array(G * G); total = 0;
      for (let i = 0; i < G * G; i++) if (d[i * 4 + 3] > 100) { mask[i] = 1; total++; }
      painted = new Uint8Array(G * G); upd();
    }
    function upd() {
      let hit = 0, out = 0; for (let i = 0; i < G * G; i++) if (painted[i]) { if (mask[i]) hit++; else out++; }
      const cov = total ? hit / total : 0; const pct = Math.min(1, cov / .6); meter.firstChild.style.width = pct * 100 + '%';
      if (!doneFlag && cov >= .6 && out < hit * 1.6) { doneFlag = true; SFX.good(); setTimeout(res, 300); }
    }
    let drawing = false, last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, W: r.width }; };
    function paint(p) {
      const brush = p.W * .09;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = brush;
      ctx.beginPath(); ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      const steps = last ? Math.max(1, Math.hypot(p.x - last.x, p.y - last.y) / 3) : 1;
      for (let s = 0; s <= steps; s++) {
        const x = last ? last.x + (p.x - last.x) * s / steps : p.x, y = last ? last.y + (p.y - last.y) * s / steps : p.y;
        const gx = x / p.W * G, gy = y / p.W * G, rr = brush / p.W * G * .75;
        for (let j = Math.max(0, gy - rr | 0); j <= Math.min(G - 1, gy + rr | 0); j++) for (let i = Math.max(0, gx - rr | 0); i <= Math.min(G - 1, gx + rr | 0); i++)
          if ((i - gx) ** 2 + (j - gy) ** 2 <= rr * rr) painted[j * G + i] = 1;
      }
      last = p;
    }
    cv.addEventListener('pointerdown', e => { e.preventDefault(); drawing = true; last = null; cv.setPointerCapture(e.pointerId); paint(pt(e)); });
    cv.addEventListener('pointermove', e => { if (drawing) { paint(pt(e)); } });
    const end = () => { if (drawing) { drawing = false; last = null; upd(); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    clr.onclick = () => { SFX.click(); drawGuide(); };
    document.fonts.ready.then(() => requestAnimationFrame(drawGuide));
  });
}

/* ============ المحطة ٢: صوت الحرف ============ */
function stSound(stage, L) {
  const c = sectionCard(`أَصْواتُ ${L.gen}`, 'اضْغَطْ لِتَسْمَعَ');
  const notes = el('div', 'notes'); const names = [['fatha', 'فَتْحَةٌ'], ['damma', 'ضَمَّةٌ'], ['kasra', 'كَسْرَةٌ']];
  L.syl.forEach((s, k) => {
    if (!s) return; const w = L.sylWords[k];
    const n = el('button', 'note ' + names[k][0], `<span class="hn">${names[k][1]}</span><span class="syl">${s}</span>` + (w ? `<span class="w panel" style="padding:2px 14px 8px">${hlWord(w, L)}</span>` : ''));
    n.onclick = async () => { SFX.click(); n.classList.remove('playing'); void n.offsetWidth; n.classList.add('playing'); await seq([AU.ui(names[k][0]), AU.syl(L, k), w && AU.word(L, w)].filter(Boolean)); };
    notes.appendChild(n);
  });
  c.appendChild(notes); stage.appendChild(c); enter(notes.children, 90);
  const g = sectionCard('اسْمَعْ وَاخْتَرْ', 'تَحَدٍّ صَغيرٌ 🎵'); stage.appendChild(g);
  miniRounds(g, L, [Q.syl, Q.syl, Q.syl, Q.syl]).then(() => stationComplete(1));
}

/* ============ المحطة ٣: مواضع الحرف ============ */
function stPos(stage, L) {
  const c = sectionCard(`مَواضِعُ ${L.gen}`, L.nonjoin ? 'لا يَتَّصِلُ بِما بَعْدَهُ' : 'أَرْبَعَةُ أَشْكالٍ');
  const grid = el('div', 'pos');
  ['start', 'middle', 'end', 'alone'].forEach(k => {
    const f = L.forms[k]; if (!f.form && !f.words.length) return;
    const p = el('div', 'poscard panel'); const lbl = el('button', 'lbl', POSTITLE[k]); lbl.onclick = () => { SFX.click(); play(AU.ui(POSAU[k])); };
    p.appendChild(lbl); p.appendChild(el('div', 'form', f.form || glyph(L)));
    const ws = el('div', 'ws'); f.words.forEach(w => { const b = el('button', 'wbtn', hlWord(w, L)); b.onclick = () => { SFX.click(); sayWord(L, w); }; ws.appendChild(b); });
    p.appendChild(ws); grid.appendChild(p);
  });
  c.appendChild(grid); stage.appendChild(c); enter(grid.children, 80);
  const g = sectionCard('أَيْنَ الْحَرْفُ؟', 'تَحَدٍّ صَغيرٌ 🧭'); stage.appendChild(g);
  miniRounds(g, L, [Q.formGap, Q.connect, Q.posQ, Q.formGap]).then(() => stationComplete(2));
}

/* ============ المحطة ٤: كلمات بالحرف ============ */
function stWords(stage, L) {
  const c = sectionCard(`كَلِماتٌ فيها ${L.name}`, 'اضْغَطْ عَلى الْكَلِمَةِ');
  const grid = el('div', 'words');
  L.words.forEach(w => { const b = el('button', 'wcard', hlWord(w, L)); b.onclick = async () => { SFX.click(); b.classList.add('playing'); await sayWord(L, w); b.classList.remove('playing'); }; grid.appendChild(b); });
  c.appendChild(grid); stage.appendChild(c); enter(grid.children, 30);
  const g = sectionCard('اكْسِرِ الْمُكَعَّباتِ', 'تَحَدٍّ صَغيرٌ ⛏'); stage.appendChild(g);
  mineGame(g, L).then(() => stationComplete(3));
}
function mineGame(host, L) {
  return new Promise(res => {
    const wrap = el('div', 'game');
    wrap.appendChild(el('div', 'q', `اكْسِرْ كُلَّ مُكَعَّبٍ فيهِ <span class="hl" style="font-size:1.4em">${glyph(L)}</span>`));
    const goods = shuffle(L.words.filter(w => !w.includes(' ') && strip(w).length <= 6)).slice(0, 4); const bads = otherWords(L, 9 - goods.length);
    const cnt = el('div', 'progress'); goods.forEach(() => cnt.appendChild(el('i'))); wrap.appendChild(cnt);
    const grid = el('div', 'mine'); let found = 0;
    shuffle([...goods.map(w => ({ w, ok: 1 })), ...bads.map(w => ({ w, ok: 0 }))]).forEach(o => {
      const b = el('button', 'ore', `<span>${o.w}</span><i class="crack"></i>`); let hits = 0;
      b.onclick = () => {
        if (b.dataset.done) return;
        if (!o.ok) { SFX.bad(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return; }
        hits++; SFX.hit(); b.classList.add('hit'); b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
        burstAt(b, 7, ['#7f7f7f', '#999', '#6a6a6a', '#555'], .28);
        b.style.filter = `brightness(${1 - hits * .12})`;
        if (hits >= 2) {
          b.dataset.done = 1; SFX.brk(); b.style.filter = ''; b.classList.add('found'); b.innerHTML = `<span>${hlWord(o.w, L)}</span>`; burstAt(b, 16, ['#4ae3e0', '#c9fffd', '#fff', '#ffd83d'], .5);
          cnt.children[found].classList.add('ok'); found++; sayWord(L, o.w);
          if (found === goods.length) setTimeout(res, 700);
        }
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid); host.appendChild(wrap); enter(grid.children, 50); play(AU.ui('find'));
  });
}

/* ============ جولات صغيرة ============ */
/* عدّاد الحماس: إجابات متتالية تضاعف النقاط، والاحتفال الكبير عند ٣ و٥ و٨ ثم كل ٥ */
let COMBO = 0;
function setCombo(n) {
  COMBO = n; const c = $('#l-combo'); c.style.display = n >= 2 ? '' : 'none';
  if (n >= 2) { c.innerHTML = `${IC.fire}<span>×${AR(n)}</span>`; c.classList.toggle('hot', n >= 5); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}
const xpFor = () => 5 * Math.min(3, 1 + Math.floor(COMBO / 3));
const bigCombo = n => n === 3 || n === 5 || n === 8 || (n > 8 && n % 5 === 0);
const CHEERS = ['أَحْسَنْتَ!', 'صَحيحٌ!', 'مُمْتازٌ!', 'رائِعٌ!', 'يا بَطَلُ!'];
function cheer() {                                  // تشجيع سريع في الزاوية بدل احتفال ملء الشاشة
  SFX.good(); const c = $('#cheer'); c.querySelector('b').textContent = pick(CHEERS); c.classList.remove('on'); void c.offsetWidth; c.classList.add('on');
  return Math.random() < .35 ? Promise.all([play(AU.ui(pick(['great1', 'great2', 'great3']))), sleep(800)]) : sleep(800);
}
async function miniRounds(card, L, fns) {
  const prog = el('div', 'progress'); fns.forEach(() => prog.appendChild(el('i'))); card.appendChild(prog);
  const host = el('div'); host.style.width = '100%'; card.appendChild(host);
  let i = 0;
  while (i < fns.length) {
    prog.children[i].className = 'cur'; host.innerHTML = '';
    const ok = await fns[i](host, L);
    if (ok) { prog.children[i].className = 'ok'; setCombo(COMBO + 1); addXp(xpFor()); if (bigCombo(COMBO)) await celebrate(); else await cheer(); i++; }
    else { prog.children[i].className = 'no'; setCombo(0); await celebrate('try'); }
  }
  host.innerHTML = '';
}

/* ============ المحطة ٥: التحدي ============ */
function stBoss(stage, L) {
  const c = sectionCard(`تَحَدّي ${L.gen} ⚔`, '٣ قُلوبٍ'); stage.appendChild(c);
  const M = mobFor(L);
  const intro = el('div', 'row', `<span class="mobprev">${M.svg}</span><div style="font-size:30px;line-height:1.6;flex:1;min-width:260px"><b>${M.name}</b> يَحْرُسُ الْحَرْفَ التّالِيَ!<br>كُلُّ إِجابَةٍ صَحيحَةٍ <b style="color:#2f7d32">ضَرْبَةُ سَيْفٍ</b>، وَكُلُّ خَطَأٍ يُنْقِصُ قَلْباً مِنْ <b style="color:#e0342f">٣ قُلوبٍ</b>.<br>أَجِبْ بِسُرْعَةٍ لِتَضْرِبَ <b style="color:#b8860b">ضَرْبَةً خارِقَةً ⚡</b></div>`);
  const img = el('img', 'pix'); img.src = '../assets/elia/think.webp'; img.style.height = '200px'; intro.appendChild(img);
  const go = el('button', 'btn big gold', '⚔ ابْدَأِ الْمَعْرَكَةَ'); const r = el('div', 'row'); r.appendChild(go);
  c.append(intro, r);
  go.onclick = () => { SFX.click(); c.innerHTML = ''; c.classList.add('fight'); runBoss(c, L); };
}
/* وحوش المعركة من عالم ماينكرافت — بكسل مرسوم بالكود.
   الحروف العادية: كريبر ثم عنكبوت ثم زومبي بالتناوب. أقوى الوحوش: الويذر في آخر الوحدة الثانية، وتنّين الإندر في آخر حرف. */
const MOBS = {
  creeper: { name: 'الْكْريبَرُ', atk: 'boom', svg: pix(`
GgggGggg
ggGggggG
gkkggkkg
gkkggkkg
gggkkggg
ggkkkkgg
ggkkkkgg
ggkggkgg
..gGgg..
..ggGg..
..gggg..
..Gggg..
dggddggd
dgGddGgd`, { g: '#5cb85a', G: '#93dd82', d: '#2f7d32', k: '#101510' }) },
  spider: { name: 'الْعَنْكَبوتُ', atk: 'jump', svg: pix(`
d............d
.d..........d.
..d.dddddd.d..
dd.dbbbbbbd.dd
..ddbrbbrbdd..
dd.dbbrrbbd.dd
..d.dbbbbd.d..
.d..d....d..d.`, { b: '#4a3f3f', d: '#1c1616', r: '#ff2a2a' }) },
  zombie: { name: 'الزّومْبي', atk: 'lunge', svg: pix(`
zzzzzzzz
zZZZZZZz
ZZZZZZZZ
ZkkZZkkZ
ZZZddZZZ
ZZddddZZ
ZZdZZdZZ
ZZZZZZZZ
cccccccc
cccccccc
ZZcCCcZZ
ZZccccZZ
..pppp..
..pPPp..
..pppp..
..ssss..`, { z: '#3f6e2a', Z: '#6aa84f', d: '#2f5522', k: '#0e150c', c: '#2fa9a9', C: '#5fd0d0', p: '#4a3fb0', P: '#6a5fd0', s: '#555' }) },
  wither: { name: 'الْويذَرُ', atk: 'shot', boss: true, bg: 'nether', shot: '#2b2b2b', svg: pix(`
....kkkkkk....
....kwkkwk....
....kkkkkk....
kkkk.kwwk.kkkk
kwwk.kkkk.kwwk
kkkkkkkkkkkkkk
kkkk.gkkg.kkkk
....kkkkkk....
....gkkkkg....
....kkkkkk....
.....gkkg.....
......kk......`, { k: '#2b2b2b', g: '#4a4a4a', w: '#f2f2f2' }) },
  dragon: { name: 'تِنّينُ الْإِنْدَرِ', atk: 'shot', boss: true, bg: 'end', shot: '#d05cff', svg: pix(`
......kk..kk......
.....kkkkkkkk.....
.....kpkkkkpk.....
k....kkkkkkkk....k
kk...kkggggkk...kk
kgk...kkkkkk...kgk
kggk.kkkkkkkk.kggk
kgggkkkkkkkkkkgggk
kggkgkkkkkkkkgkggk
kgk.kg.kkkk.gk.kgk
k...k...kk...k...k
........kk........`, { k: '#17171f', g: '#7a52b8', p: '#f06cff' }) },
};
function mobFor(L) {
  if (L.id === LET.length) return MOBS.dragon;
  if (L.unit === 2 && !LET.some(M => M.unit === 2 && M.id > L.id)) return MOBS.wither;
  return MOBS[['creeper', 'spider', 'zombie'][(L.id - 1) % 3]];
}
const swordIcon = () => pix(`
......kk
.....kck
....kck.
.k.kck..
..kck...
..kbk...
.kbk.k..
kk......`, Object.assign({ k: '#000', c: '#4ae3e0', b: '#8b5a2b' }, (window.EliaShop && EliaShop.sword && EliaShop.sword()) || {}));
function endBattle() { $('#level').classList.remove('battle'); MUSIC && MUSIC.stop(); }

/* المعركة: كل إجابة صحيحة ضربة سيف، وكل خطأ ضربة من الوحش، والضربة القاضية بكتابة الحرف */
async function runBoss(card, L) {
  const prev = LET.filter(M => M.id < L.id);
  const pool = [Q.syl, Q.letterFind, Q.posQ, Q.formGap, Q.whichWord, Q.listenWord, Q.build, Q.dots, Q.connect];
  const M = mobFor(L), HP = M.boss ? 8 : 6;         // أقوى الوحوش تحتاج ٨ ضربات
  const plan = shuffle(pool).concat(shuffle(pool)).slice(0, HP + 2).map(f => ({ f, L }));
  if (prev.length) { const rv = shuffle(prev).slice(0, 2); plan.splice(2, 1, { f: Q.letterFind, L: rv[0] }); if (rv[1]) plan.splice(5, 1, { f: pick([Q.syl, Q.whichWord]), L: rv[1] }); }
  const CRIT = 9000; let hearts = 3, hp = HP, combo = 0; renderHearts(hearts);
  $('#level').classList.add('battle'); $('#stage').scrollTop = 0;
  const arena = el('div', 'arena u' + L.unit + (M.bg ? ' ' + M.bg : '') + (M.boss ? ' bossy' : ''), `<div class="a-ground"></div>
    <div class="a-info"><b>${M.name}</b><div class="a-hp">${'<i></i>'.repeat(HP)}</div></div>
    <div class="a-crit"><span>⚡</span><div><i></i></div></div><div class="a-combo"></div>
    <div class="a-mob">${M.svg}</div>
    <span class="a-pet">${SHOP ? SHOP.pet() : ''}</span>
    <div class="a-hero"><img class="pix" src="../assets/elia/hello.webp" alt=""><span class="a-sword">${swordIcon()}</span></div>`);
  const host = el('div'); host.style.width = '100%'; card.append(arena, host);
  const mob = arena.querySelector('.a-mob'), hero = arena.querySelector('.a-hero'), sword = arena.querySelector('.a-sword'), hpEls = arena.querySelectorAll('.a-hp i'), crit = arena.querySelector('.a-crit i'), comboEl = arena.querySelector('.a-combo');
  const alive = () => document.body.contains(arena);
  const dist = () => { const a = hero.getBoundingClientRect(), b = mob.getBoundingClientRect(); return Math.max(60, a.left - b.right + b.width * .3); };
  const float = (txt, at, cls = '') => { const f = el('div', 'a-float ' + cls, txt), r = at.getBoundingClientRect(), ar = arena.getBoundingClientRect(); f.style.left = (r.left + r.width / 2 - ar.left) + 'px'; f.style.top = (r.top - ar.top + 6) + 'px'; arena.appendChild(f); setTimeout(() => f.remove(), 1000); };
  const again = (e, c) => { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); };
  const SW = 'rotate(-20deg) scaleX(-1)';
  async function heroHit(big, final) {
    const d = dist(); hero.classList.toggle('crit', big);
    hero.animate([{ transform: 'none' }, { transform: `translateX(${-d}px) rotate(-6deg)`, offset: .4 }, { transform: `translateX(${-d}px) rotate(5deg)`, offset: .62 }, { transform: 'none' }], { duration: 540, easing: 'ease-in-out' });
    sword.animate([{ transform: 'rotate(35deg) scaleX(-1)' }, { transform: 'rotate(35deg) scaleX(-1)', offset: .36 }, { transform: 'rotate(-125deg) scaleX(-1)', offset: .6 }, { transform: SW }], { duration: 540 });
    await sleep(230); SFX.slash(); if (big) SFX.xp(); again(mob, 'hit'); again(arena.querySelector('.a-pet'), 'hop');
    burstAt(mob, big ? 24 : 12, big ? ['#ffe14d', '#fff', '#ff7a1a'] : ['#fff', '#e0342f', '#ffd83d'], big ? .6 : .4);
    float(final ? 'الضَّرْبَةُ الْقاضِيَةُ!' : big ? 'ضَرْبَةٌ خارِقَةٌ!' : pick(['طاخ!', 'بوم!', 'هَيّا!', 'خُذْ!']), mob, big ? 'crit' : '');
    arena.animate([{ transform: 'translate(-6px,3px)' }, { transform: 'translate(6px,-3px)' }, { transform: 'translate(-3px,-2px)' }, { transform: 'none' }], { duration: 240 });
    if (!final) { hp--; if (hpEls[hp]) hpEls[hp].classList.add('off'); }
    await sleep(400);
  }
  async function mobHit() {                          // لكل وحش هجومه
    const d = dist();
    if (M.atk === 'boom') {                          // الكريبر: ينتفخ ويومض ثم ينفجر
      mob.animate([{ filter: 'none', transform: 'scale(1)' }, { filter: 'brightness(3)', transform: 'scale(1.15)' }, { filter: 'none', transform: 'scale(1.1)' }, { filter: 'brightness(3)', transform: 'scale(1.28)' }, { filter: 'none', transform: 'scale(1.2)' }, { filter: 'brightness(4)', transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 800 });
      noise(.7, .12); await sleep(720); SFX.brk(); noise(.35, .5); burstAt(hero, 26, ['#fff', '#ffd83d', '#ff7a1a', '#888'], .7); float('بووم!', hero, 'bad');
    } else if (M.atk === 'shot') {                   // الويذر والتنّين: قذيفة تطير نحو البطل
      const a = mob.getBoundingClientRect(), h = hero.getBoundingClientRect(), ar = arena.getBoundingClientRect(), sh = el('i', 'a-shot'); sh.style.background = M.shot; sh.style.boxShadow = `0 0 14px 5px ${M.shot}`;
      sh.style.left = (a.right - ar.left - 20) + 'px'; sh.style.top = (a.top - ar.top + a.height * .3) + 'px'; arena.appendChild(sh);
      mob.animate([{ transform: 'none' }, { transform: 'scale(1.15) translateX(-10px)', offset: .3 }, { transform: 'none' }], { duration: 400 }); SFX.slash();
      sh.animate([{ transform: 'translate(0,0) scale(.6)' }, { transform: `translate(${h.left - a.right + h.width * .4}px,${h.top - a.top + h.height * .1}px) scale(1.5) rotate(360deg)` }], { duration: 480, easing: 'ease-in', fill: 'forwards' });
      await sleep(480); sh.remove();
      SFX.bad(); noise(.25, .4); burstAt(hero, 14, [M.shot, '#fff', '#888'], .45); float('آخ!', hero, 'bad');
    } else {                                         // الزومبي يهجم، والعنكبوت يقفز
      const up = M.atk === 'jump' ? -arena.clientHeight * .3 : 0;
      mob.animate([{ transform: 'none' }, { transform: `translate(${d * .5}px,${up}px) scale(1.1)`, offset: .3 }, { transform: `translateX(${d}px) scale(1.22) rotate(9deg)`, offset: .5 }, { transform: 'none' }], { duration: 600, easing: 'ease-in' });
      await sleep(280); SFX.bad(); noise(.2, .3); float('آخ!', hero, 'bad');
    }
    again(hero, 'hurt'); again(arena, 'flash'); await sleep(360);
  }
  MUSIC && MUSIC.start('battle');
  await play(AU.ui('battle')); if (!alive()) return;
  for (let i = 0; i < plan.length && hp > 0 && hearts > 0; i++) {
    host.innerHTML = '';
    if (plan[i].L !== L) host.appendChild(el('div', 'q', `<span style="font-size:24px;background:#555;padding:0 12px 4px;border:3px solid #000">🔁 مُراجَعَةٌ: ${plan[i].L.name}</span>`));
    crit.style.transition = 'none'; crit.style.width = '100%'; void crit.offsetWidth; crit.style.transition = `width ${CRIT}ms linear`; crit.style.width = '0%';
    const t0 = performance.now(), ok = await plan[i].f(host, plan[i].L);
    if (!alive()) return;
    crit.style.width = getComputedStyle(crit).width; crit.style.transition = 'none';
    if (ok) {
      combo++; const big = performance.now() - t0 < CRIT;
      comboEl.innerHTML = combo >= 2 ? `${IC.fire}<span>×${AR(combo)}</span>` : ''; if (combo >= 2) again(comboEl, 'pop');
      await heroHit(big); addXp(big ? 10 : 5);
      if (hp > 0 && (combo === 3 || combo === 5)) await play(AU.elia(combo === 3 ? 'easy' : 'genius'));
    } else {
      combo = 0; comboEl.innerHTML = ''; await mobHit(); hearts--; renderHearts(hearts);
      const hs = $('#l-hearts').children[hearts]; if (hs) hs.classList.add('pop');
      MUSIC && MUSIC.tense(hearts === 1); arena.classList.toggle('danger', hearts === 1);
      if (hearts > 0) await play(AU.elia('tryagain'));
    }
    if (!alive()) return;
  }
  if (hearts <= 0) { endBattle(); await celebrate('try'); return bossLose(card, L); }
  /* الضربة القاضية: اكتب الحرف */
  mob.classList.add('stun'); arena.querySelector('.a-crit').style.display = 'none'; host.innerHTML = '';
  host.appendChild(el('div', 'q', `<span class="fin">⚔ الضَّرْبَةُ الْقاضِيَةُ!</span><br>اُكْتُبْ ${L.name} لِتَهْزِمَ الْوَحْشَ`));
  play(AU.ui('finish'));
  await writeLetter(host, L);
  if (!alive()) return;
  mob.classList.remove('stun'); await heroHit(true, true);
  mob.classList.add('dead'); SFX.brk(); burstAt(mob, 40, ['#4ae3e0', '#ffd83d', '#fff', '#29d162'], .9); await sleep(850);
  endBattle(); bossWin(L, hearts);
}
const writeLetter = (host, L) => strokeGame(host, L);   // الضربة القاضية: كتابة الحرف بترتيب الخط
function bossLose(card, L) {
  card.innerHTML = ''; play(AU.ui('lose'));
  const m = el('div', 'row', `<img class="pix" src="../assets/elia/tryagain.webp" style="height:240px"><div style="font-size:34px;line-height:1.6">انْتَهَتِ الْقُلوبُ!<br>لا بَأْسَ يا بَطَلُ، نُعيدُ الْمُحاوَلَةَ 💪</div>`);
  const b = el('button', 'btn big green', `<span style="width:34px;height:34px;display:inline-block">${IC.redo}</span> أَعِدِ التَّحَدّي`);
  b.onclick = () => { SFX.click(); openStation(4); };
  const r = el('div', 'row'); r.appendChild(b); card.append(m, r);
}
async function bossWin(L, hearts) {
  const stars = Math.max(1, hearts); const was = S.done[L.id] || 0;
  S.done[L.id] = Math.max(was, stars); if (L.id + 1 > S.unlocked && L.id < LET.length) S.unlocked = L.id + 1; save();
  await celebrate('win');
  addXp(50, stars * 3 - (was ? was * 3 : 0) > 0 ? stars * 3 - was * 3 : 0);
  play(AU.ui('levelup'));
  const next = LET[L.id];
  const body = $('#modal-body');
  body.innerHTML = `<h2 class="mc-title">فُزْتَ بِتَحَدّي ${L.gen}!</h2>
    <div class="row" style="gap:6px">${[0, 1, 2].map(k => `<span style="width:64px;height:64px;display:inline-block;${k < stars ? '' : 'filter:grayscale(1) brightness(.5)'}">${IC.star}</span>`).join('')}</div>
    <img class="pix" src="../assets/elia/trophy.webp" alt="">
    <p style="margin:6px 0">${next ? `فُتِحَ ${next.name}: <b style="font-size:1.6em">${glyph(next)}</b>` : 'أَنْهَيْتَ كُلَّ الْحُروفِ! أَنْتَ بَطَلُ الْحُروفِ 🏆'}</p>`;
  const row = el('div', 'row');
  const bm = el('button', 'btn', 'الْخَريطَةُ'); bm.onclick = () => { SFX.click(); $('#modal').classList.remove('on'); renderMap(); show('map'); };
  row.appendChild(bm);
  if (next) { const bn = el('button', 'btn green', `${next.name} ←`); bn.onclick = () => { SFX.click(); $('#modal').classList.remove('on'); openLevel(next.id); }; row.appendChild(bn); }
  body.appendChild(row); $('#modal').classList.add('on'); SFX.lvl(); burst(60);
  renderStations();
}

/* ============ البدء من جديد ============ */
function resetGame() {
  S = { unlocked: 1, done: {}, st: {}, xp: 0, gems: 0, last: today(), streak: 1, rst: Date.now() }; save();   // rst: حتى لا تُعيد السحابة التقدّم القديم
  $('#modal').classList.remove('on'); renderTitle(); renderHud(); show('title');
  toast('↺ بَدَأْنا مِنْ جَديدٍ — مِنْ حَرْفِ الْأَلِفِ!');
}
function askReset() {
  const body = $('#modal-body'); const done = Object.keys(S.done).length;
  body.innerHTML = `<h2 class="mc-title">اِبْدَأْ مِنْ جَديدٍ؟</h2>
    <img class="pix" src="../assets/elia/think.webp" alt="" style="height:min(30vh,260px)">
    <p style="margin:6px 0">سَيُمْسَحُ كُلُّ التَّقَدُّمِ: ${AR(done)} حُروفٍ، ${AR(S.gems)} 💎، وَنِقاطُ الْخِبْرَةِ،<br>وَنَعودُ إِلى حَرْفِ الْأَلِفِ.</p>`;
  const row = el('div', 'row');
  const no = el('button', 'btn green', 'لا، أُكْمِلُ'); no.onclick = () => { SFX.click(); $('#modal').classList.remove('on'); };
  const yes = el('button', 'btn', 'نَعَمْ، مِنَ الْبِدايَةِ'); yes.onclick = () => { SFX.brk(); resetGame(); };
  row.append(no, yes); body.appendChild(row); $('#modal').classList.add('on');
}
$('#b-reset').onclick = () => { SFX.click(); askReset(); };

/* ============ إعدادات الأب (ضغطة طويلة على الشعار) ============ */
(function parentMenu() {
  const cr = document.querySelector('.credit'); let t;
  const open = () => {
    const body = $('#modal-body');
    const CL = { ok: '☁️ مَحْفوظٌ في السَّحابَةِ أَيْضاً ✔', sync: '☁️ جارٍ الْحِفْظُ…', off: '☁️ لا إِنْتَرْنِتَ — يُحْفَظُ في الْجِهازِ وَيُرْفَعُ لاحِقاً', err: '☁️ تَعَذَّرَ الْوُصولُ إِلى السَّحابَةِ — مَحْفوظٌ في الْجِهازِ', idle: '☁️ …' };
    body.innerHTML = `<h2>إِعْداداتُ الْأَبِ</h2><p style="font-size:24px">التَّقَدُّمُ مَحْفوظٌ في هٰذا الْجِهازِ.<br><span id="p-cloud"></span></p>`;
    if (CLOUD) { CLOUD.onState(s => { const e = $('#p-cloud'); if (e) e.textContent = CL[s] || ''; }); CLOUD.sync(); }
    const row = el('div', 'row');
    const a = el('button', 'btn gold', 'افْتَحْ كُلَّ الْحُروفِ'); a.onclick = () => { S.unlocked = LET.length; save(); $('#modal').classList.remove('on'); toast('فُتِحَتْ كُلُّ الْحُروفِ'); renderTitle(); };
    const z = el('button', 'btn', 'تَصْفيرُ التَّقَدُّمِ'); z.onclick = () => { SFX.click(); askReset(); };
    const x = el('button', 'btn green', 'إِغْلاقٌ'); x.onclick = () => $('#modal').classList.remove('on');
    row.append(a, z, x); body.appendChild(row); $('#modal').classList.add('on');
  };
  cr.addEventListener('pointerdown', () => { t = setTimeout(open, 1200); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => cr.addEventListener(e, () => clearTimeout(t)));
})();

/* ============ بدء ============ */
$('#t-hero').onclick = () => { celebrate(pick(['siuuu', 'smart', 'genius', 'hero', 'easy'])); };
let welcomed = false;
$('#title').addEventListener('pointerdown', e => { if (welcomed || e.target.closest('button,#t-hero,.credit,#daily')) return; welcomed = true; play(AU.ui('welcome')); });
renderTitle(); renderHud();
if (TEST && /boss=(\d+)/.test(location.search)) { openLevel(+location.search.match(/boss=(\d+)/)[1]); openStation(4); $('.btn.big.gold').click(); }   // للاختبار: ادخل المعركة مباشرة
/* تقدّم أحدث جاء من السحابة (جهاز آخر، أو بعد مسح سفاري للتخزين) */
CLOUD && CLOUD.on(KEY, st => {
  if (!st) return; S = st; renderHud();
  if ($('#title').classList.contains('on')) renderTitle();
  else if ($('#map').classList.contains('on')) renderMap();
  else if ($('#level').classList.contains('on') && CUR) renderStations();
});
})();
