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
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
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
})();

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
const voice = new Audio(); voice.preload = 'auto';
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
  elia: k => `assets/audio/elia/${k}.mp3`,
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
  hit: () => noise(.06, .2),
  xp: () => tone(1100, .09, 'sine', .08, 0, 1700),
  lvl: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'triangle', .1, i * .09)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ============ لوحة المعلومات ============ */
const lvlOf = xp => Math.floor(xp / 100) + 1;
function renderHud() {
  const setXp = id => { const b = $(id); if (!b) return; b.querySelector('i').style.width = (S.xp % 100) + '%'; b.querySelector('b').textContent = AR(lvlOf(S.xp)); };
  setXp('#t-xp'); setXp('#m-xp');
  const gems = `${IC.gem}<span>${AR(S.gems)}</span>`;
  ['#t-gems', '#m-gems', '#l-gems'].forEach(i => $(i).innerHTML = gems);
  $('#t-days').innerHTML = `${IC.fire}<span>الْيَوْمُ ${AR(S.streak)}</span>`;
}
function addXp(n, gems = 0) {
  const before = lvlOf(S.xp); S.xp += n; S.gems += gems; save(); renderHud(); SFX.xp();
  toast(`+${AR(n)} نِقاطُ خِبْرَةٍ` + (gems ? ` · <span class="ad">+${AR(gems)} 💎</span>` : ''));
  if (lvlOf(S.xp) > before) setTimeout(() => { SFX.lvl(); toast(`<span class="ad">⬆ الْمُسْتَوى ${AR(lvlOf(S.xp))}!</span>`); }, 900);
}
let toastT;
function toast(h) { const t = $('#toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }

/* ============ الاحتفال ============ */
const CELEB = {
  siuuu: { img: 'siuuu', say: 'سِيييييييي!', au: 'siuuu', anim: 'siuuu' },
  smart: { img: 'smart', say: 'أَنا ذَكِيٌّ!', au: 'smart', anim: 'smart' },
  easy: { img: 'smart', say: 'سَهْلَةٌ!', au: 'easy', anim: 'smart' },
  hero: { img: 'siuuu', say: 'أَنا بَطَلٌ!', au: 'hero', anim: 'siuuu' },
  try: { img: 'tryagain', say: 'حاوِلْ مَرَّةً ثانِيَةً!', ui: 'try', anim: 'pop' },
  win: { img: 'trophy', say: 'فُزْتُ!', au: 'won', anim: 'pop' },
};
let celebBag = [];
function nextCelebration() {
  if (!celebBag.length) celebBag = shuffle(['siuuu', 'siuuu', 'smart', 'smart', 'hero', 'easy']);
  return celebBag.pop();
}
function burst(n = 26, colors = ['#29d162', '#4ae3e0', '#ffd83d', '#fff']) {
  const cx = innerWidth / 2, cy = innerHeight * .55;
  for (let i = 0; i < n; i++) {
    const b = el('i', 'burst'); const a = Math.random() * Math.PI * 2, d = 160 + Math.random() * 320;
    b.style.left = cx + 'px'; b.style.top = cy + 'px'; b.style.background = pick(colors);
    b.style.setProperty('--dx', Math.cos(a) * d + 'px'); b.style.setProperty('--dy', Math.sin(a) * d - 120 + 'px'); b.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(b); setTimeout(() => b.remove(), 1200);
  }
}
function celebrate(kind) {
  kind = kind || nextCelebration();
  const c = CELEB[kind]; const box = $('#celebrate'), img = $('#c-img'), say = $('#c-say');
  img.src = `../assets/elia/${c.img}.webp`; img.className = 'who pix'; void img.offsetWidth; img.classList.add(c.anim);
  say.textContent = c.say; say.style.animation = 'none'; void say.offsetWidth; say.style.animation = '';
  box.classList.add('on');
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
      const b = el('button', 'lvl ' + st, `<span class="n">${AR(L.id)}</span>${st === 'locked' ? '' : glyph(L)}`);
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
  requestAnimationFrame(() => { const y = sc.querySelector('.you'); if (y) y.parentElement.scrollIntoView({ block: 'center' }); });
}
$('#t-hub').innerHTML = IC.home;
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
  renderHearts(3, true); show('level'); openStation(first);
}
$('#l-back').innerHTML = IC.back; $('#l-back').onclick = () => { SFX.click(); stopVoice(); renderMap(); show('map'); };
function renderStations() {
  const box = $('#l-stations'); box.innerHTML = '';
  STATIONS.forEach((s, i) => {
    const lock = i === 4 && !bossOpen(CUR.id);
    const b = el('button', 'st panel' + (i === CURST ? ' cur' : '') + (lock ? ' lock' : '') + ((i < 4 && stDone(CUR.id, i)) || (i === 4 && S.done[CUR.id]) ? ' ok' : ''),
      `<span class="ic slot">${IC[s.ic]}</span><span>${s.t}</span>`);
    b.style.position = 'relative';
    b.onclick = () => { if (lock) { SFX.bad(); toast('أَكْمِلِ الْمَحَطّاتِ الْأَرْبَعَ لِيُفْتَحَ التَّحَدّي ⚔'); return; } SFX.click(); stopVoice(); openStation(i); };
    box.appendChild(b);
  });
}
function renderHearts(n, hide) {
  const h = $('#l-hearts'); h.innerHTML = ''; h.style.display = hide ? 'none' : '';
  for (let i = 0; i < 3; i++) h.innerHTML += `<span class="${i < n ? '' : 'lost'}">${IC.heart}</span>`;
}
function openStation(i) {
  CURST = i; renderStations(); renderHearts(3, i !== 4);
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
      const b = el('button', 'opt' + (txt ? ' txt' : ''), o.html); if (TEST && o.v === correct) b.dataset.c = 1;
      b.onclick = () => {
        if (locked) return; locked = true; const ok = o.v === correct;
        b.classList.add(ok ? 'good' : 'bad');
        if (!ok) box.querySelectorAll('.opt').forEach((x, i) => { if (opts[i].v === correct) setTimeout(() => x.classList.add('good'), 350); });
        setTimeout(() => res(ok), ok ? 350 : 900);
      };
      box.appendChild(b);
    });
    g.appendChild(box); host.appendChild(g); if (onShow) onShow();
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
        const b = el('button', 'opt', t.c); if (TEST) b.dataset.i = t.i;
        b.onclick = () => {
          if (t.c === letters[pos]) {
            SFX.hit(); slots.children[pos].textContent = t.c; b.classList.add('used'); pos++;
            if (pos === letters.length) {
              slots.innerHTML = `<div class="gapword">${hlWord(w, L)}</div>`; SFX.good();
              sayWord(L, w).then(() => res(mist <= 1));
            }
          } else { mist++; SFX.bad(); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 450); }
        };
        tiles.appendChild(b);
      });
      g.appendChild(tiles); host.appendChild(g); seq([AU.ui('build'), AU.word(L, w)].filter(Boolean));
    });
  },
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
    s.appendChild(el('span', 'minib me', glyph(L))); L.sisters.forEach(x => s.appendChild(el('span', 'minib', x === 'هـ' ? 'ه' : x)));
    facts.appendChild(s);
  }
  row.appendChild(facts); row.appendChild(speakBtn(() => play(AU.name(L)))); c.appendChild(row); stage.appendChild(c);

  const sc = sectionCard('قِصَّةُ الْحَرْفِ', 'مِنْ كِتابي');
  const r2 = el('div', 'row'); const st = el('div', 'story', hlWord(L.story, L)); st.style.flex = '1';
  r2.appendChild(st); r2.appendChild(speakBtn(() => seq([AU.ui('story'), AU.story(L)]))); sc.appendChild(r2); stage.appendChild(sc);

  const tc = sectionCard('اُكْتُبِ الْحَرْفَ بِإِصْبَعِكَ', 'تَحَدٍّ صَغيرٌ ✏'); stage.appendChild(tc);
  traceGame(tc, L).then(() => stationComplete(0));
  setTimeout(() => play(AU.name(L)), 250);
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
      const r = box.getBoundingClientRect(), dpr = devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr;
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
  c.appendChild(notes); stage.appendChild(c);
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
  c.appendChild(grid); stage.appendChild(c);
  const g = sectionCard('أَيْنَ الْحَرْفُ؟', 'تَحَدٍّ صَغيرٌ 🧭'); stage.appendChild(g);
  miniRounds(g, L, [Q.formGap, Q.posQ, Q.formGap, Q.posQ]).then(() => stationComplete(2));
}

/* ============ المحطة ٤: كلمات بالحرف ============ */
function stWords(stage, L) {
  const c = sectionCard(`كَلِماتٌ فيها ${L.name}`, 'اضْغَطْ عَلى الْكَلِمَةِ');
  const grid = el('div', 'words');
  L.words.forEach(w => { const b = el('button', 'wcard', hlWord(w, L)); b.onclick = async () => { SFX.click(); b.classList.add('playing'); await sayWord(L, w); b.classList.remove('playing'); }; grid.appendChild(b); });
  c.appendChild(grid); stage.appendChild(c);
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
      const b = el('button', 'ore', `<span>${o.w}</span>`); let hits = 0;
      b.onclick = () => {
        if (b.dataset.done) return;
        if (!o.ok) { SFX.bad(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); return; }
        hits++; SFX.hit(); b.classList.add('hit');
        b.style.filter = `brightness(${1 - hits * .15})`;
        if (hits >= 2) {
          b.dataset.done = 1; SFX.brk(); b.style.filter = ''; b.classList.add('found'); b.innerHTML = `<span>${hlWord(o.w, L)}</span>`;
          cnt.children[found].classList.add('ok'); found++; sayWord(L, o.w);
          if (found === goods.length) setTimeout(res, 700);
        }
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid); host.appendChild(wrap); play(AU.ui('find'));
  });
}

/* ============ جولات صغيرة ============ */
async function miniRounds(card, L, fns) {
  const prog = el('div', 'progress'); fns.forEach(() => prog.appendChild(el('i'))); card.appendChild(prog);
  const host = el('div'); host.style.width = '100%'; card.appendChild(host);
  let i = 0;
  while (i < fns.length) {
    prog.children[i].className = 'cur'; host.innerHTML = '';
    const ok = await fns[i](host, L);
    if (ok) { prog.children[i].className = 'ok'; addXp(5); await celebrate(); i++; }
    else { prog.children[i].className = 'no'; await celebrate('try'); }
  }
  host.innerHTML = '';
}

/* ============ المحطة ٥: التحدي ============ */
function stBoss(stage, L) {
  const c = sectionCard(`تَحَدّي ${L.gen} ⚔`, '٣ قُلوبٍ'); stage.appendChild(c);
  const intro = el('div', 'row', `<div style="font-size:30px;line-height:1.6;flex:1;min-width:260px">لَدَيْكَ <b style="color:#e0342f">٣ قُلوبٍ</b>. أَجِبْ عَنْ ٨ أَسْئِلَةٍ، وَكُلُّ خَطَأٍ يُنْقِصُ قَلْباً. اِجْمَعِ النُّجومَ الثَّلاثَ!</div>`);
  const img = el('img', 'pix'); img.src = '../assets/elia/think.webp'; img.style.height = '220px'; intro.appendChild(img);
  const go = el('button', 'btn big gold', '⚔ ابْدَأِ التَّحَدّي'); const r = el('div', 'row'); r.appendChild(go);
  c.append(intro, r);
  go.onclick = () => { SFX.click(); c.innerHTML = ''; c.appendChild(el('h2', '', `تَحَدّي ${L.gen} ⚔`)); runBoss(c, L); };
}
async function runBoss(card, L) {
  const prev = LET.filter(M => M.id < L.id);
  const pool = [Q.syl, Q.letterFind, Q.posQ, Q.formGap, Q.whichWord, Q.listenWord, Q.build, Q.syl];
  const plan = shuffle(pool).map(f => ({ f, L }));
  if (prev.length) { const rv = shuffle(prev).slice(0, 2); plan.splice(2, 1, { f: Q.letterFind, L: rv[0] }); if (rv[1]) plan.splice(5, 1, { f: pick([Q.syl, Q.whichWord]), L: rv[1] }); }
  let hearts = 3; renderHearts(hearts);
  const prog = el('div', 'progress'); plan.forEach(() => prog.appendChild(el('i'))); card.appendChild(prog);
  const host = el('div'); host.style.width = '100%'; card.appendChild(host);
  for (let i = 0; i < plan.length; i++) {
    prog.children[i].className = 'cur'; host.innerHTML = '';
    if (plan[i].L !== L) host.appendChild(el('div', 'q', `<span style="font-size:24px;background:#555;padding:0 12px 4px;border:3px solid #000">🔁 مُراجَعَةٌ: ${plan[i].L.name}</span>`));
    const ok = await plan[i].f(host, plan[i].L);
    if (ok) { prog.children[i].className = 'ok'; addXp(5); await celebrate(); }
    else {
      prog.children[i].className = 'no'; hearts--; renderHearts(hearts);
      const hs = $('#l-hearts').children[hearts]; if (hs) hs.classList.add('pop');
      if (hearts <= 0) { await celebrate('try'); return bossLose(card, L); }
      await celebrate('try');
    }
  }
  bossWin(L, hearts);
}
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
  S = { unlocked: 1, done: {}, st: {}, xp: 0, gems: 0, last: today(), streak: 1 }; save();
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
    body.innerHTML = `<h2>إِعْداداتُ الْأَبِ</h2><p style="font-size:24px">التَّقَدُّمُ مَحْفوظٌ في هٰذا الْجِهازِ.</p>`;
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
$('#t-hero').onclick = () => { celebrate(pick(['siuuu', 'smart'])); };
let welcomed = false;
$('#title').addEventListener('pointerdown', e => { if (welcomed || e.target.closest('button,#t-hero,.credit,#daily')) return; welcomed = true; play(AU.ui('welcome')); });
renderTitle(); renderHud();
})();
