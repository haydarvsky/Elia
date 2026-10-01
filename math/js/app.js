/* Spider × Elia — أبطال الأرقام — محرّك ألعاب الرياضيات */
(() => {
'use strict';
const WORLDS = window.WORLDS, MIS = window.MISSIONS, KINDS = window.KINDS, KIND_AR = window.KIND_AR, EMO = window.COUNT_EMO;
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => a + (Math.random() * (b - a + 1) | 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
const AD = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const TEST = location.hash === '#test';
const FAST = TEST && location.search.includes('fast') ? 3 : 1;
const INK = '#141414', RED = '#e8313a', BLUE = '#1f6fe5';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const AR_FONT = '"Sakkal Saad",system-ui,sans-serif';

/* ================= الحفظ ================= */
const KEY = 'elia-spider-v1';
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S = Object.assign({ done: {}, best: {}, gems: 0, cards: {}, world: 1 }, S);
const CLOUD = window.EliaSave;                    // المزامنة السحابية (assets/save.js)
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} CLOUD && CLOUD.push(); };
const NM = MIS[1].length;
const sk = (w, s) => w + '-' + s;
const starsOf = (w, s) => S.done[sk(w, s)] || 0;
const BOSS = MIS[1].findIndex(m => m.boss);   // العالم التالي يُفتح بهزيمة الزعيم (مهمة القلم بعده إضافية)
const unlocked = (w, s) => TEST || (w === 1 && s === 0) || (s > 0 ? starsOf(w, s - 1) > 0 : starsOf(w - 1, BOSS) > 0) || starsOf(w, s) > 0;
const totalStars = () => Object.values(S.done).reduce((a, b) => a + b, 0);

/* ================= الصوت ================= */
const MUSIC = window.EliaMusic;                   // الموسيقى الخلفية (assets/music.js)
const voice = new Audio(); voice.preload = 'auto'; MUSIC && MUSIC.watch(voice);
let playTok = 0;
function talking(on) { document.querySelectorAll('.spidey').forEach(e => e.classList.toggle('talk', on)); }
function playFile(src) {
  const tok = ++playTok;
  return new Promise(res => {
    let fin = false; const done = ok => { if (fin) return; fin = true; voice.onended = voice.onerror = null; if (tok === playTok) talking(false); res(!ok ? 'err' : tok === playTok ? 'ok' : 'cut'); };
    voice.onended = () => done(true); voice.onerror = () => done(false);
    voice.src = src + '?v=1'; try { voice.currentTime = 0; } catch (e) {}
    talking(true);
    const p = voice.play(); if (p && p.catch) p.catch(() => done(false));
    setTimeout(() => done(true), 9000);
  });
}
const say = async k => (await playFile(`audio/${k}.mp3`)) !== 'cut';
const num = n => say('n' + n);
async function chain(...fns) { for (const f of fns) { if (!(await f())) return false; await sleep(40); } return true; }
const S_ = k => () => say(k), N_ = n => () => num(n);
const clip = new Audio(); MUSIC && MUSIC.watch(clip);
function playClip(k) { return new Promise(res => { const d = () => { clip.onended = clip.onerror = null; res(); }; clip.onended = d; clip.onerror = d; clip.src = `../huruf/assets/audio/elia/${k}.mp3?v=5`; const p = clip.play(); if (p && p.catch) p.catch(d); setTimeout(d, 5000); }); }
function stopVoice() { playTok++; talking(false); try { voice.pause(); } catch (e) {} }

let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type = 'square', vol = .06, when = 0, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d = .15, vol = .25, freq = 1400) {
  const a = ac(); if (!a) return; const b = a.createBuffer(1, a.sampleRate * d, a.sampleRate); const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
}
const SFX = {
  click: () => tone(700, .06, 'square', .05),
  web: () => { noise(.14, .3, 5200); tone(2200, .14, 'triangle', .05, 0, 500); },
  pow: () => { noise(.12, .3, 2400); tone(880, .1, 'square', .06); tone(1320, .12, 'square', .05, .06); },
  bad: () => tone(200, .25, 'sawtooth', .07, 0, 90),
  hurt: () => { noise(.25, .4, 700); tone(160, .3, 'square', .07, 0, 60); },
  zap: () => { tone(1500, .35, 'sawtooth', .05, 0, 100); noise(.3, .2, 3000); },
  hop: () => tone(420, .12, 'sine', .12, 0, 900),
  bell: () => { [0, .35].forEach(w => { tone(660, 1.1, 'sine', .12, w); tone(1320, .8, 'sine', .04, w); }); },
  tick: () => tone(1800, .03, 'square', .03),
  choo: () => { noise(.35, .25, 1200); tone(520, .4, 'square', .05, 0); tone(660, .4, 'square', .04, .05); },
  pop: () => tone(500, .09, 'sine', .15, 0, 1200),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'square', .06, i * .1)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ================= الصور ================= */
const IMG = {};
['hero', 'boss', 'd1', 'd2', 'd3', 'd4', 'bg_day', 'bg_clock', 'bg_night', 'bg_bridge'].forEach(k => { const i = new Image(); i.src = `img/${k}.webp?v=1`; IMG[k] = i; });
const ready = i => i && i.complete && i.naturalWidth;
const DRONES = ['d1', 'd2', 'd3', 'd4'];

/* قناع سبايدر مان (مرسوم) */
const MASK = `<svg class="mask" viewBox="0 0 100 112"><defs><clipPath id="mh"><path d="M50 5C22 5 8 28 8 54c0 29 19 52 42 53 23-1 42-24 42-53C92 28 78 5 50 5Z"/></clipPath></defs>
<path d="M50 5C22 5 8 28 8 54c0 29 19 52 42 53 23-1 42-24 42-53C92 28 78 5 50 5Z" fill="#e8313a"/>
<g clip-path="url(#mh)" fill="none" stroke="#5a0b10" stroke-width="1.6">${[16, 30, 44, 58].map(r => `<ellipse cx="50" cy="60" rx="${r}" ry="${r * 1.05}"/>`).join('')}${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.283; return `<line x1="50" y1="60" x2="${50 + Math.cos(a) * 80}" y2="${60 + Math.sin(a) * 80}"/>`; }).join('')}</g>
<path d="M50 5C22 5 8 28 8 54c0 29 19 52 42 53 23-1 42-24 42-53C92 28 78 5 50 5Z" fill="none" stroke="#141414" stroke-width="5"/>
<g class="eyes" stroke="#141414" stroke-width="5" stroke-linejoin="round" fill="#fff"><path d="M16 46C22 30 40 32 45 52 39 63 23 62 16 46Z"/><path d="M84 46C78 30 60 32 55 52 61 63 77 62 84 46Z"/></g></svg>`;

/* ================= أدوات الواجهة ================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
let toastT; function toast(h) { const t = $('#toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900); }
let banT; function banner(h, ms = 1100) { const b = $('#banner'); b.innerHTML = h; b.classList.add('on'); clearTimeout(banT); banT = setTimeout(() => b.classList.remove('on'), ms); }
function confirmBox(html) {
  return new Promise(res => {
    const m = $('#modal'), c = $('#modal-card'); c.innerHTML = `<p>${html}</p>`;
    const r = el('div', 'row'); const y = el('button', 'cbtn', 'نَعَمْ'), n = el('button', 'cbtn go', 'لا، أُكْمِلُ');
    y.onclick = () => { m.classList.remove('on'); res(true); }; n.onclick = () => { m.classList.remove('on'); res(false); };
    r.append(y, n); c.appendChild(r); m.classList.add('on');
  });
}
const CELEB = { siuuu: 'سِيييييي!', smart: 'أَنا ذَكِيٌّ!', genius: 'أَنا عَبْقَرِيٌّ!', hero: 'أَنا بَطَلٌ!', easy: 'سَهْلَةٌ!' };
function celebrate(kind) {
  const box = $('#celebrate'); $('#c-img').src = 'img/hero.webp?v=1'; $('#c-say').textContent = CELEB[kind];
  box.classList.add('on'); SFX.win();
  return new Promise(res => { let d = false; const close = () => { if (d) return; d = true; box.classList.remove('on'); res(); }; box.onclick = close; playClip(kind).then(() => setTimeout(close, 500)); });
}

/* ================= رسم البطاقات ================= */
const RING = ['#ffd23f', '#26c6da', '#ff8a3d', '#2ee66b', '#ff5fa2', '#8f6bff'];
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* يرسم النصّ ومركزُ حبره الحقيقي عند (cx, cy) — مقاييس الخط العربي لا تتوسّط وحدها */
function cText(x, t, cx, cy, stroke) {
  const al = x.textAlign, bl = x.textBaseline; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const m = x.measureText(t), px = cx + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, py = cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  if (stroke) x.strokeText(t, px, py); x.fillText(t, px, py); x.textAlign = al; x.textBaseline = bl;
}
function tokensRTL(x, toks, cx, cy, size) {   // يرسم رموزاً من اليمين إلى اليسار (٣ + ٢ = …)
  x.font = `800 ${size}px ${AR_FONT}`; x.direction = 'ltr';
  const gap = size * .18, ws = toks.map(t => x.measureText(t).width); let tot = ws.reduce((a, b) => a + b, 0) + gap * (toks.length - 1);
  let px = cx + tot / 2;
  toks.forEach((t, i) => { px -= ws[i] / 2; cText(x, t, px, cy); px -= ws[i] / 2 + gap; });
  return tot;
}
function fitText(x, t, cx, cy, maxW, size, font = AR_FONT) {
  let f = size; x.font = `800 ${f}px ${font}`; const w = x.measureText(t).width; if (w > maxW) { f *= maxW / w; x.font = `800 ${f}px ${font}`; }
  cText(x, t, cx, cy);
}
const backOut = k => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2;
const popSc = (G, c) => c.born == null ? 1 : backOut(clamp((G.t - c.born) * 4, 0, 1));   // ظهور البطاقة بنطّة
function emojiGrid(x, e, n, cx, cy, s) {
  if (!n) return;
  const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : 4, rows = Math.ceil(n / cols), cell = Math.min(2 * s / cols, 2 * s / rows);
  x.font = `${cell * .82}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < n; i++) { const c = i % cols, r = i / cols | 0, inRow = Math.min(cols, n - r * cols);
    x.fillText(Array.isArray(e) ? e[i] : e, cx + (c - (inRow - 1) / 2) * cell, cy + (r - (rows - 1) / 2) * cell + cell * .06); }
}
function drawShape(x, v, c, cx, cy, s) {
  x.fillStyle = c; x.strokeStyle = INK; x.lineWidth = Math.max(3, s * .1); x.beginPath();
  if (v === 'circle') x.arc(cx, cy, s * .8, 0, 7);
  else if (v === 'square') x.rect(cx - s * .72, cy - s * .72, s * 1.44, s * 1.44);
  else { x.moveTo(cx, cy - s * .85); x.lineTo(cx + s * .9, cy + s * .7); x.lineTo(cx - s * .9, cy + s * .7); x.closePath(); }
  x.fill(); x.stroke();
}
function drawBox(x, cx, by, s, open) {
  x.fillStyle = '#d99a52'; x.strokeStyle = INK; x.lineWidth = Math.max(2.5, s * .07);
  x.beginPath(); x.rect(cx - s * .55, by - s * .8, s * 1.1, s * .8); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(cx - s * .55, by - s * .45); x.lineTo(cx + s * .55, by - s * .45); x.strokeStyle = 'rgba(0,0,0,.25)'; x.stroke();
  if (open) { x.fillStyle = '#8a5a2b'; x.strokeStyle = INK; x.beginPath(); x.ellipse(cx, by - s * .8, s * .55, s * .14, 0, 0, 7); x.fill(); x.stroke(); }
}
function drawBall(x, cx, cy, s) {
  x.fillStyle = RED; x.strokeStyle = INK; x.lineWidth = Math.max(2.5, s * .08); x.beginPath(); x.arc(cx, cy, s, 0, 7); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(cx - s * .35, cy - s * .35, s * .28, 0, 7); x.fill();
}
function drawPos(x, v, cx, cy, s) {
  const floor = cy + s * .72; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - s, floor); x.lineTo(cx + s, floor); x.stroke();
  const b = s * .22;
  if (v === 'above') { drawBox(x, cx, floor, s * .8); drawBall(x, cx, floor - s * .64 - b, b); }
  else if (v === 'below') { x.fillStyle = '#b5703a'; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.rect(cx - s * .8, floor - s * .95, s * 1.6, s * .16); x.fill(); x.stroke();
    [-1, 1].forEach(d => { x.beginPath(); x.rect(cx + d * s * .66 - s * .06, floor - s * .8, s * .12, s * .8); x.fill(); x.stroke(); }); drawBall(x, cx, floor - b, b); }
  else if (v === 'in') { drawBox(x, cx, floor, s * .9, true); drawBall(x, cx, floor - s * .72, b); x.fillStyle = '#d99a52'; x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.rect(cx - s * .5, floor - s * .62, s * .99, s * .62); x.fill(); x.stroke(); }
  else if (v === 'out') { drawBox(x, cx - s * .3, floor, s * .8, true); drawBall(x, cx + s * .62, floor - b, b); }
  else if (v === 'right') { drawBox(x, cx - s * .25, floor, s * .8); drawBall(x, cx + s * .65, floor - b, b); }
  else if (v === 'left') { drawBox(x, cx + s * .25, floor, s * .8); drawBall(x, cx - s * .65, floor - b, b); }
  else if (v === 'between') { drawBox(x, cx - s * .58, floor, s * .62); drawBox(x, cx + s * .58, floor, s * .62); drawBall(x, cx, floor - b, b); }
  else { const top = cy - s * .9, sy = v === 'top' ? cy - s * .5 : cy + s * .35; x.strokeStyle = '#888'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, sy); x.stroke();
    x.font = `${s * .55}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🕷️', cx, sy + s * .12); }
}
function drawClock(x, cx, cy, R, h, o = {}) {
  x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = Math.max(3, R * .08);
  x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.stroke();
  x.strokeStyle = '#2e9d4d'; x.lineWidth = R * .07; x.beginPath(); x.arc(cx, cy, R * .9, 0, 7); x.stroke();
  x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 ${R * (o.small ? .26 : .2)}px ${AR_FONT}`;
  for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.283 - 1.5708; cText(x, AD(i), cx + Math.cos(a) * R * .72, cy + Math.sin(a) * R * .72); }
  if (!o.small) for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283; x.lineWidth = i % 5 ? 1 : 3; x.beginPath(); x.moveTo(cx + Math.cos(a) * R * .84, cy + Math.sin(a) * R * .84); x.lineTo(cx + Math.cos(a) * R * .8, cy + Math.sin(a) * R * .8); x.stroke(); }
  const ha = o.angle != null ? o.angle : (h % 12) / 12 * 6.283 - 1.5708;
  x.lineCap = 'round';
  x.strokeStyle = BLUE; x.lineWidth = R * .07; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy - R * .74); x.stroke();
  x.strokeStyle = RED; x.lineWidth = R * .11; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ha) * R * .48, cy + Math.sin(ha) * R * .48); x.stroke();
  x.fillStyle = INK; x.beginPath(); x.arc(cx, cy, R * .07, 0, 7); x.fill(); x.lineCap = 'butt';
}
function cube(x, px, py, s, c) { x.fillStyle = c; x.strokeStyle = INK; x.lineWidth = Math.max(1.5, s * .12); x.beginPath(); x.rect(px, py, s, s); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(px + s * .15, py + s * .15, s * .3, s * .3); }
function drawTens(x, n, cx, cy, s) {
  const t = n / 10 | 0, o = n % 10, c = s * .17, colsW = t * c * 1.4 + (o ? c * 1.6 : 0); let px = cx - colsW / 2;
  for (let k = 0; k < t; k++) { for (let i = 0; i < 10; i++) cube(x, px, cy - c * 5 + i * c, c, BLUE); px += c * 1.4; }
  for (let i = 0; i < o; i++) cube(x, px + c * .2, cy + c * 5 - (i + 1) * c * 1.1, c, RED);
}
function drawFrame(x, n, cx, cy, s) {
  const rows = n > 10 ? 4 : 2, c = s * 1.8 / 5, w = c * 5, h = c * rows, x0 = cx - w / 2, y0 = cy - h / 2;
  x.strokeStyle = BLUE; x.lineWidth = 2.5; for (let r = 0; r < rows; r++) for (let k = 0; k < 5; k++) x.strokeRect(x0 + k * c, y0 + r * c, c, c);
  for (let i = 0; i < n; i++) { const r = i / 5 | 0, k = i % 5; x.fillStyle = RED; x.beginPath(); x.arc(x0 + k * c + c / 2, y0 + r * c + c / 2, c * .34, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.5; x.stroke(); }
}
function drawVert(x, a, op, b, cx, cy, s) {   // الجمع/الطرح بالشكل الرأسي
  x.font = `800 ${s * .62}px ${AR_FONT}`; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillStyle = INK; x.direction = 'ltr';
  const rx = cx + s * .35; x.fillText(AD(a), rx, cy - s * .55); x.fillText(AD(b), rx, cy + s * .05); x.textAlign = 'center'; x.fillText(op, cx - s * .45, cy + s * .05);
  x.lineWidth = 3; x.strokeStyle = INK; x.beginPath(); x.moveTo(cx - s * .7, cy + s * .42); x.lineTo(cx + s * .5, cy + s * .42); x.stroke();
  x.textAlign = 'right'; x.fillStyle = RED; x.fillText('؟', rx, cy + s * .8);
}
function drawContent(x, o, cx, cy, r) {
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = INK; x.direction = 'ltr';
  switch (o.k) {
    case 'num': x.font = `800 ${o.v > 9 ? r * 1.45 : r * 1.9}px ${AR_FONT}`; cText(x, AD(o.v), cx, cy); break;
    case 'txt': fitText(x, o.v, cx, cy, r * 1.7, r * .62); break;
    case 'time': fitText(x, AD(o.v) + ':٠٠', cx, cy, r * 1.8, r * 1.05); break;
    case 'grp': emojiGrid(x, o.e, o.n, cx, cy, r * .8); break;
    case 'emo': x.font = `${r * 1.15}px ${EMOJI_FONT}`; x.fillText(o.e, cx, cy + r * .08); break;
    case 'shape': drawShape(x, o.v, o.c, cx, cy, r * .72); break;
    case 'pos': drawPos(x, o.v, cx, cy, r * .88); break;
    case 'clock': drawClock(x, cx, cy, r * .86, o.v, { small: true }); break;
    case 'sign': x.font = `900 ${r * 1.3}px "Arial Black",Impact,sans-serif`; x.fillStyle = BLUE; cText(x, o.v, cx, cy); break;
    case 'tens': drawTens(x, o.v, cx, cy, r); break;
    case 'frame': drawFrame(x, o.v, cx, cy, r * .88); break;
    case 'expr': x.fillStyle = INK; { const t = [AD(o.a), o.op, AD(o.b)]; x.font = `800 ${r}px ${AR_FONT}`; const w = t.reduce((s, q) => s + x.measureText(q).width, 0) * 1.3; tokensRTL(x, t, cx, cy, r * Math.min(1, r * 1.8 / w)); } break;
    case 'vert': drawVert(x, o.a, o.op, o.b, cx, cy, r); break;
  }
}
const cardCache = new Map();
function card(o, r, ring, shape) {
  const key = JSON.stringify(o) + Math.round(r) + ring + shape;
  if (cardCache.has(key)) return cardCache.get(key);
  const dpr = Math.min(2, devicePixelRatio || 1), s = Math.ceil((r * 2 + 18) * dpr);
  const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.scale(dpr, dpr);
  const m = r + 8, lw = Math.max(3, r * .09);
  const path = (ox, oy) => { if (shape === 'ball') { x.beginPath(); x.arc(m + ox, m + oy, r, 0, 7); } else rr(x, m - r + ox, m - r + oy, r * 2, r * 2, r * .28); };
  x.fillStyle = INK; path(5, 5); x.fill();
  x.fillStyle = o.k === 'color' ? o.c : '#fff'; path(0, 0); x.fill();
  x.lineWidth = lw * 1.5; x.strokeStyle = ring || '#ffd23f'; if (shape === 'ball') { x.beginPath(); x.arc(m, m, r - lw * 1.2, 0, 7); } else rr(x, m - r + lw * 1.2, m - r + lw * 1.2, r * 2 - lw * 2.4, r * 2 - lw * 2.4, r * .22); x.stroke();
  x.lineWidth = lw; x.strokeStyle = INK; path(0, 0); x.stroke();
  drawContent(x, o, m, m, r * .82);
  cardCache.set(key, c); return c;
}
function drawCard(g, o, x, y, r, opt = {}) {
  const c = card(o, r, opt.ring, opt.shape), sc = c.width / (r * 2 + 18);
  g.save(); g.translate(x, y); if (opt.rot) g.rotate(opt.rot); if (opt.sc) g.scale(opt.sc, opt.sc); if (opt.alpha != null) g.globalAlpha = opt.alpha;
  g.drawImage(c, -(r + 8), -(r + 8), c.width / sc, c.height / sc);
  if (opt.dim) { g.fillStyle = 'rgba(40,40,40,.55)'; rr(g, -r, -r, r * 2, r * 2, r * .28); g.fill(); g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(-r * .5, -r * .5); g.lineTo(r * .5, r * .5); g.moveTo(r * .5, -r * .5); g.lineTo(-r * .5, r * .5); g.stroke(); }
  if (opt.web) drawWebOver(g, 0, 0, r * 1.15, opt.web);
  g.restore();
}
function drawWebOver(g, x, y, r, k = 1) {   // شرنقة شبكة فوق الشيء
  g.save(); g.globalAlpha = Math.min(1, k); g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 3;
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
  for (const f of [.35, .62, .9]) { g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i / 10 * 6.283, rr2 = r * f * (i % 2 ? .92 : 1); const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  g.restore();
}
function webLine(g, x1, y1, x2, y2, k = 1) {
  g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = 3.2; g.stroke(); g.restore();
}

/* ================= HTML للسؤال ================= */
const emos = (e, n, big) => n ? `<span class="emos${big ? ' big' : ''}" style="--c:${n <= 5 ? n : Math.ceil(n / 2)}">${Array.from({ length: n }, (_, i) => `<i>${Array.isArray(e) ? e[i] : e}</i>`).join('')}</span>` : '<span class="emos"><i>🪹</i></span>';
const eqH = (a, op, b, res = '؟') => `<span class="eq">${AD(a)} ${op} ${AD(b)} = <b>${typeof res === 'number' ? AD(res) : res}</b></span>`;
const clockSvg = h => { const a = (h % 12) / 12 * 6.283 - 1.5708; return `<svg class="clk" viewBox="-50 -50 100 100"><circle r="46" fill="#fff" stroke="#141414" stroke-width="6"/><circle r="40" fill="none" stroke="#2e9d4d" stroke-width="4"/>${Array.from({ length: 12 }, (_, i) => { const b = (i + 1) / 12 * 6.283 - 1.5708; return `<text x="${Math.cos(b) * 30}" y="${Math.sin(b) * 30 + 5}" text-anchor="middle" font-size="14" font-weight="800">${AD(i + 1)}</text>`; }).join('')}<line y2="-33" stroke="${BLUE}" stroke-width="4" stroke-linecap="round"/><line x2="${Math.cos(a) * 22}" y2="${Math.sin(a) * 22}" stroke="${RED}" stroke-width="7" stroke-linecap="round"/><circle r="4"/></svg>`; };
const ltr = h => `<span dir="ltr" class="ltr">${h}</span>`;

/* ================= مولّد الأسئلة (من المنهج) ================= */
function wrongNums(ans, lo, hi, n = 2) {
  const near = shuffle(uniq([ans - 1, ans + 1, ans - 2, ans + 2, ans + 3, ans - 3].filter(v => v >= lo && v <= hi && v !== ans)));
  const rest = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(v => v !== ans && !near.includes(v)));
  return near.concat(rest).slice(0, n);
}
function mcq(correct, wrongs) { const opts = shuffle([correct, ...wrongs]); return { opts, ans: opts.indexOf(correct) }; }
const numOpts = (ans, lo, hi) => { const m = mcq(ans, wrongNums(ans, lo, hi)); m.opts = m.opts.map(v => ({ k: 'num', v })); return m; };
const POS = { above: 'الْكُرَةُ فَوْقَ الصُّنْدوقِ', below: 'الْكُرَةُ تَحْتَ الطّاوِلَةِ', in: 'الْكُرَةُ داخِلَ الصُّنْدوقِ', out: 'الْكُرَةُ خارِجَ الصُّنْدوقِ',
  right: 'الْكُرَةُ عَلى يَمينِ الصُّنْدوقِ', left: 'الْكُرَةُ عَلى يَسارِ الصُّنْدوقِ', between: 'الْكُرَةُ بَيْنَ الصُّنْدوقَيْنِ', top: 'الْعَنْكَبوتُ في الْأَعْلى', bottom: 'الْعَنْكَبوتُ في الْأَسْفَلِ' };
const POS_SETS = [['above', 'below', 'in'], ['in', 'out', 'above'], ['right', 'left', 'between'], ['top', 'bottom', 'in'], ['left', 'right', 'above']];
const PAT_UNITS = [['🔴', '🔵'], ['🟡', '🟢'], ['⭐', '🌙'], ['🍎', '🍌'], ['🔺', '🟦'], ['🕷️', '🕸️'], ['🐤', '🐸']];
function patternSeq(len, diff) {
  const u = pick(PAT_UNITS), third = pick(['🟣', '🟠', '❤️', '🍇', '⚽']);
  const unit = pick(diff < .3 ? [[0, 1]] : [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]]).map(i => i === 2 ? third : u[i]);
  return { seq: Array.from({ length: len }, (_, i) => unit[i % unit.length]), items: uniq(unit.concat(u, [third])) };
}
function makeQ(type, G) {
  const d = G.diff, q = { type };
  switch (type) {
    case 'count5': case 'count12': {
      const n = type === 'count5' ? ri(1, 5) : ri(6, clamp(9 + G.w, 10, 12)), e = pick(EMO), rep = type === 'count12' && Math.random() < .35;
      Object.assign(q, numOpts(n, type === 'count5' ? 1 : 5, type === 'count5' ? 6 : 12));
      q.hud = `<span class="lbl">كَمْ؟</span>${rep ? `<canvas class="mini" data-o='${JSON.stringify({ k: n > 10 ? 'tens' : 'frame', v: n })}'></canvas>` : emos(e, n, n <= 5)}`;
      q.speak = S_('howMany'); q.val = n; break;
    }
    case 'zero': {
      const e = pick(['🍪', '🐟', '🍎']); Object.assign(q, numOpts(0, 0, 3));
      q.hud = `<span class="lbl">كَمْ؟</span><span class="emos big"><i>🫙</i></span><span class="note">صُنْدوقٌ فارِغٌ… كَمْ ${e} فيهِ؟</span>`; q.speak = S_('howMany'); q.val = 0; break;
    }
    case 'pos': {
      const set = pick(POS_SETS), v = pick(set); const m = mcq(v, set.filter(x => x !== v));
      q.opts = m.opts.map(p => ({ k: 'pos', v: p })); q.ans = m.ans;
      q.hud = `<span class="lbl">اِخْتَرِ الصّورَةَ</span><span class="note big">${POS[v]}</span>`; q.speak = () => chain(S_('which'), S_('p_' + v)); break;
    }
    case 'more': case 'less': {
      const ns = shuffle(uniq([ri(1, 5), ri(1, 5), ri(1, 5), ri(1, 5), ri(1, 5), 1, 5])).slice(0, 3), e = pick(EMO);
      const best = type === 'more' ? Math.max(...ns) : Math.min(...ns);
      q.opts = ns.map(n => ({ k: 'grp', e, n })); q.ans = ns.indexOf(best);
      q.hud = `<span class="lbl">${type === 'more' ? 'الْأَكْثَرُ' : 'الْأَقَلُّ'}</span><span class="note big">أَيُّ مَجْموعَةٍ ${type === 'more' ? 'أَكْثَرُ' : 'أَقَلُّ'}؟</span>`; q.speak = S_(type); q.val = best; break;
    }
    case 'pattern': {
      const { seq, items } = patternSeq(ri(5, 6), d), ans = seq[seq.length - 1];
      const m = mcq(ans, shuffle(items.filter(i => i !== ans)).slice(0, 2)); q.opts = m.opts.map(e => ({ k: 'emo', e })); q.ans = m.ans;
      q.hud = `<span class="lbl">النَّمَطُ</span>${ltr(`<span class="emos row">${seq.slice(0, -1).map(e => `<i>${e}</i>`).join('')}<i class="q">؟</i></span>`)}`; q.speak = S_('pattern'); break;
    }
    case 'cmp5': case 'cmp12': {
      const hi = type === 'cmp5' ? 5 : 12, big = Math.random() < .5, ns = shuffle(uniq(Array.from({ length: 8 }, () => ri(type === 'cmp5' ? 1 : 0, hi)))).slice(0, 3);
      while (ns.length < 3) ns.push(ns.length ? (ns[0] + ns.length) % (hi + 1) : 1);
      const best = big ? Math.max(...ns) : Math.min(...ns); q.opts = ns.map(v => ({ k: 'num', v })); q.ans = ns.indexOf(best);
      q.hud = `<span class="lbl">${big ? 'الْأَكْبَرُ' : 'الْأَصْغَرُ'}</span><span class="note big">أَيُّ عَدَدٍ ${big ? 'أَكْبَرُ' : 'أَصْغَرُ'}؟</span>`; q.speak = S_(big ? 'bigger' : 'smaller'); q.val = best; break;
    }
    case 'sign5': case 'sign12': {
      const hi = type === 'sign5' ? 5 : 12, a = ri(type === 'sign5' ? 1 : 0, hi), b = Math.random() < .25 ? a : ri(1, hi), s = a > b ? '>' : a < b ? '<' : '=';
      const m = mcq(s, ['>', '<', '='].filter(x => x !== s)); q.opts = m.opts.map(v => ({ k: 'sign', v })); q.ans = m.ans;
      q.hud = `<span class="lbl">الْإِشارَةُ</span>${ltr(`<span class="eq">${AD(a)} <b class="blank">◯</b> ${AD(b)}</span>`)}`; q.speak = S_('sign'); break;
    }
    case 'after': case 'before': {
      const n = type === 'after' ? ri(0, 11) : ri(1, 12), ans = type === 'after' ? n + 1 : n - 1;
      Object.assign(q, numOpts(ans, 0, 12));
      q.hud = `<span class="lbl">${type === 'after' ? 'بَعْدَ' : 'قَبْلَ'}</span><span class="note big">ما الْعَدَدُ الَّذي ${type === 'after' ? 'بَعْدَ' : 'قَبْلَ'} <b>${AD(n)}</b>؟</span>`;
      q.speak = () => chain(S_(type), N_(n)); q.val = ans; q.n = n; break;
    }
    case 'readClock': case 'hourAfter': case 'hourBefore': {
      const h = ri(1, 12), ans = type === 'readClock' ? h : type === 'hourAfter' ? h % 12 + 1 : (h + 10) % 12 + 1;
      const w = shuffle(uniq([h, h % 12 + 1, (h + 10) % 12 + 1, (h + 1) % 12 + 1, (h + 5) % 12 + 1]).filter(v => v !== ans)).slice(0, 2);
      const m = mcq(ans, w); q.opts = m.opts.map(v => ({ k: 'time', v })); q.ans = m.ans; q.h = h;
      q.hud = `<span class="lbl">${type === 'readClock' ? 'كَمِ السّاعَةُ؟' : type === 'hourAfter' ? 'بَعْدَ ساعَةٍ' : 'قَبْلَ ساعَةٍ'}</span>${clockSvg(h)}`;
      q.speak = type === 'readClock' ? S_('readClock') : () => chain(S_('h' + h), S_(type)); q.val = ans; break;
    }
    case 'dayAfter': case 'dayBefore': {
      const i = ri(0, 6), ans = type === 'dayAfter' ? (i + 1) % 7 : (i + 6) % 7;
      const m = mcq(ans, shuffle([0, 1, 2, 3, 4, 5, 6].filter(v => v !== ans && v !== i)).slice(0, 2)); q.opts = m.opts.map(v => ({ k: 'txt', v: window.DAYS_PLAIN[v] })); q.ans = m.ans;
      q.hud = `<span class="lbl">أَيّامُ الْأُسْبوعِ</span><span class="note big">ما الْيَوْمُ الَّذي ${type === 'dayAfter' ? 'بَعْدَ' : 'قَبْلَ'} <b>${window.DAYS[i]}</b>؟</span>`;
      q.speak = () => chain(S_(type), S_('d' + i)); break;
    }
    case 'week': case 'months': {
      const ans = type === 'week' ? 7 : 12; const m = mcq(ans, type === 'week' ? [5, 10] : [7, 10]); q.opts = m.opts.map(v => ({ k: 'num', v })); q.ans = m.ans;
      q.hud = `<span class="lbl">${type === 'week' ? '📅' : '🗓️'}</span><span class="note big">${type === 'week' ? 'كَمْ يَوْماً في الْأُسْبوعِ؟' : 'كَمْ عَدَدُ أَشْهُرِ السَّنَةِ؟'}</span>`; q.speak = S_(type); q.val = ans; break;
    }
    case 'addPics': case 'add': case 'vertAdd': {
      const s = ri(2, d < .5 ? 7 : 10), a = ri(0 + (type === 'addPics'), s - (type === 'addPics')), b = s - a, e = pick(EMO);
      Object.assign(q, numOpts(s, 0, 10));
      q.hud = type === 'addPics' ? `<span class="grp2">${emos(e, a)}<b>+</b>${emos(e, b)}</span>${eqH(a, '+', b)}` : type === 'vertAdd' ? `<canvas class="mini" data-o='${JSON.stringify({ k: 'vert', a, op: '+', b })}'></canvas>` : eqH(a, '+', b);
      q.speak = () => chain(N_(a), S_('plus'), N_(b), S_('eqWhat')); q.val = s; q.after = () => chain(S_('eq'), N_(s)); break;
    }
    case 'subPics': case 'sub': case 'vertSub': case 'subZero': {
      let a = ri(2, d < .5 ? 7 : 10), b = ri(1, a - 1); if (type === 'subZero') { a = ri(2, 10); b = Math.random() < .5 ? 0 : a; }
      const r = a - b, e = pick(EMO); Object.assign(q, numOpts(r, 0, 10));
      q.hud = type === 'subPics' ? `<span class="emos sub" style="--c:${Math.min(5, a)}">${Array.from({ length: a }, (_, i) => `<i class="${i >= a - b ? 'x' : ''}">${e}</i>`).join('')}</span>${eqH(a, '−', b)}`
        : type === 'vertSub' ? `<canvas class="mini" data-o='${JSON.stringify({ k: 'vert', a, op: '−', b })}'></canvas>` : eqH(a, '−', b);
      q.speak = () => chain(N_(a), S_('minus'), N_(b), S_('eqWhat')); q.val = r; q.after = () => chain(S_('eq'), N_(r)); break;
    }
    case 'bondQ': {
      const s = ri(4, 10), a = ri(1, s - 1); Object.assign(q, numOpts(s - a, 0, 10));
      q.hud = `<span class="lbl">تَكْوينُ ${AD(s)}</span><span class="eq">${AD(s)} = ${AD(a)} + <b>؟</b></span>`; q.speak = () => chain(S_('balanceMake'), N_(s)); q.val = s - a; break;
    }
    case 'storyAdd': case 'storySub': case 'op': {
      const add = type === 'storyAdd' || (type === 'op' && Math.random() < .5);
      const [k, a, b, e, t] = pick(add ? window.STORIES_ADD : window.STORIES_SUB), r = add ? a + b : a - b;
      if (type === 'op') { const m = mcq(add ? '+' : '−', [add ? '−' : '+']); q.opts = m.opts.map(v => ({ k: 'sign', v })); q.ans = m.ans; q.hud = `<span class="note">${t}…</span>${eqH(a, '<b class="blank">◯</b>', b, r)}`; q.speak = () => chain(S_(k), S_('op')); }
      else { Object.assign(q, numOpts(r, 0, 10)); q.hud = `<span class="note">${t}… ${add ? 'كَمْ صارَ؟' : 'كَمْ بَقِيَ؟'}</span>${eqH(a, add ? '+' : '−', b)}`; q.speak = S_(k); q.val = r; q.after = () => chain(S_('eq'), N_(r)); }
      q.hud = `<span class="story-e">${e}</span>` + q.hud; break;
    }
  }
  return q;
}
function fillMini(root) {   // يرسم الأشكال الصغيرة داخل شريط السؤال (إطار العشرة، الشكل الرأسي…)
  root.querySelectorAll('canvas.mini').forEach(c => {
    const o = JSON.parse(c.dataset.o), dpr = Math.min(2, devicePixelRatio || 1), s = c.clientHeight || 70;
    c.width = c.height = s * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr); drawContent(x, o, s / 2, s / 2, s * .45);
  });
}

/* ================= المحرّك ================= */
const cv = $('#cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, U = 1, TOP = 0;   // TOP = أسفل الشريط العلوي: ما يُرسم على الكانفس يبدأ من تحته
const hudEl = $('#game .hud');
const measureTop = () => { TOP = Math.min(H * .42, hudEl.getBoundingClientRect().bottom + 6); };
function resize() { const dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; U = Math.min(W, H) / 100; measureTop(); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cardCache.clear(); if (GAME && GAME.resize) GAME.resize(); }
addEventListener('resize', () => { if ($('#game').classList.contains('on')) resize(); });
let GAME = null, raf = 0, lastT = 0;
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - lastT) / 1000 || 0) * FAST; lastT = t;
  if (!GAME) return;
  if (!GAME.paused) GAME.update(dt);
  ctx.save(); ctx.direction = 'ltr'; if (GAME.shake > 0) ctx.translate(rand(-1, 1) * GAME.shake * U, rand(-1, 1) * GAME.shake * U);
  GAME.draw(ctx); drawFx(ctx, GAME, GAME.paused ? 0 : dt); ctx.restore();
  if (GAME.hurtT > 0) { const k = Math.min(1, GAME.hurtT); const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(255,40,40,0)'); v.addColorStop(1, `rgba(255,40,40,${.5 * k})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
}
function fxWord(G, text, x, y, color = '#ffd23f', size = 8) { G.fx.push({ t: 'w', text, x, y, color, size, life: .9, rot: rand(-.25, .25) }); }
function fxBurst(G, x, y, n = 16, cols = ['#ffd23f', RED, BLUE, '#fff', '#2ee66b']) { for (let i = 0; i < n; i++) { const a = rand(0, 6.3), v = rand(20, 60) * U; G.fx.push({ t: 'p', star: i % 3 === 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: pick(cols), life: rand(.45, .9), s: rand(1, 2.4) * U, rot: rand(0, 6), vr: rand(-8, 8) }); } }
function starPath(g, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, q = i % 2 ? r * .45 : r; i ? g.lineTo(Math.cos(a) * q, Math.sin(a) * q) : g.moveTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }
function fxRing(G, x, y, c = '#fff') { G.fx.push({ t: 'r', x, y, c, life: .4, r0: 4 * U }); }
function fxWeb(G, x1, y1, x2, y2) { G.fx.push({ t: 'l', x1, y1, x2, y2, life: .45 }); }
function drawFx(g, G, dt) {
  G.shake = Math.max(0, G.shake - dt * 8); G.pop = Math.max(0, (G.pop || 0) - dt * 4);
  G.fx = G.fx.filter(f => (f.life -= dt) > 0);
  for (const f of G.fx) {
    if (f.t === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * U * dt; f.rot += f.vr * dt; const k = Math.min(1, f.life * 4);
      g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.scale(k, k); g.fillStyle = f.c; g.strokeStyle = INK; g.lineWidth = 2; if (f.star) starPath(g, f.s * 1.1); else { g.beginPath(); g.rect(-f.s / 2, -f.s / 2, f.s, f.s); } g.fill(); g.stroke(); g.restore(); }
    else if (f.t === 'r') { const k = 1 - f.life / .4; g.strokeStyle = f.c; g.lineWidth = 6 * (1 - k) + 1; g.beginPath(); g.arc(f.x, f.y, f.r0 + k * 14 * U, 0, 7); g.stroke(); }
    else if (f.t === 'l') { webLine(g, f.x1, f.y1, f.x2, f.y2, Math.min(1, (.45 - f.life) * 9)); }
    else if (f.t === 'w') {
      const k = 1 - f.life / .9, sc = k < .15 ? k / .15 * 1.3 : 1.3 - (k - .15) * .4;
      g.save(); g.translate(f.x, f.y - k * 8 * U); g.rotate(f.rot); g.scale(sc, sc); g.globalAlpha = Math.min(1, f.life * 3);
      g.font = `${f.size * U}px Bangers,${AR_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = f.size * U * .22; g.strokeStyle = INK; g.strokeText(f.text, 0, 0); g.fillStyle = f.color; g.fillText(f.text, 0, 0); g.restore();
    }
  }
}
function drawBg(g, img, scroll, dim = 0) {
  if (!ready(img)) { g.fillStyle = '#6fc3ff'; g.fillRect(0, 0, W, H); }
  else if (scroll == null) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); g.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); }
  else {
    const bh = H, bw = bh * img.naturalWidth / img.naturalHeight, off = scroll % (bw * 2); let x = -off;
    while (x < W) { g.drawImage(img, x, 0, bw, bh); g.save(); g.translate(x + bw * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, bw, bh); g.restore(); x += bw * 2; }
  }
  if (dim) { g.fillStyle = `rgba(15,20,45,${dim})`; g.fillRect(0, 0, W, H); }
}
function drawSprite(g, img, x, y, h, opt = {}) {   // (x,y) = منتصف القاعدة
  if (!ready(img)) { g.fillStyle = RED; g.beginPath(); g.arc(x, y - h / 2, h / 3, 0, 7); g.fill(); return; }
  const w = h * img.naturalWidth / img.naturalHeight;
  g.save(); g.translate(x, y); if (opt.rot) g.rotate(opt.rot); g.scale((opt.flip ? -1 : 1) * (opt.sx || 1), opt.sy || 1);
  if (opt.alpha != null) g.globalAlpha = opt.alpha;
  g.drawImage(img, -w / 2, -h, w, h); g.restore();
  if (opt.flash) { g.save(); g.globalAlpha = opt.flash * .6; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y - h / 2, w * .45, h * .45, 0, 0, 7); g.fill(); g.restore(); }
}
/* إصبع إيليا المشير (نسبةً إلى الصورة) — منه تخرج الشبكة */
const FING = { x: .89, y: .228 };
function fingerOf(x, y, h, flip) { const img = IMG.hero, w = spriteW(img, h); return { x: x + (flip ? -1 : 1) * (FING.x - .5) * w, y: y - h + FING.y * h }; }
function drawHang(g, fx, fy, h, rot, alpha) {   // إيليا معلّق بإصبعه (للتأرجح)
  const img = IMG.hero; if (!ready(img)) return; const w = spriteW(img, h);
  g.save(); g.translate(fx, fy); g.rotate(rot); if (alpha != null) g.globalAlpha = alpha; g.drawImage(img, -FING.x * w, -FING.y * h, w, h); g.restore();
}
const spriteW = (img, h) => ready(img) ? h * img.naturalWidth / img.naturalHeight : h * .6;
function drawBtn(g, b, label, color = '#ffd23f') {
  g.save(); g.fillStyle = INK; rr(g, b.x - b.w / 2 + 5, b.y - b.h / 2 + 5, b.w, b.h, 14); g.fill();
  g.fillStyle = b.down ? '#fff' : color; rr(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 14); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, label, b.x, b.y, b.w * .86, b.h * (label.length === 1 ? 1 : .6), label.length === 1 ? '"Arial Black",sans-serif' : AR_FONT); g.restore();
}
function drawTrain(g, x, y, tw, t) {   // قطار مرسوم بالكود: (x, y) = منتصف القاطرة على سطح السكة
  const lw = Math.max(3, tw * .035), wr = tw * .13, rot = x / wr;
  const wheel = (cx, r) => {
    g.fillStyle = INK; g.beginPath(); g.arc(cx, y - r, r, 0, 7); g.fill();
    g.fillStyle = '#e9e9e9'; g.beginPath(); g.arc(cx, y - r, r * .62, 0, 7); g.fill();
    g.strokeStyle = INK; g.lineWidth = Math.max(2, r * .18); g.beginPath();
    for (let k = 0; k < 2; k++) { const a = rot + k * 1.5708, dx = Math.cos(a) * r * .6, dy = Math.sin(a) * r * .6; g.moveTo(cx - dx, y - r - dy); g.lineTo(cx + dx, y - r + dy); }
    g.stroke(); g.fillStyle = RED; g.beginPath(); g.arc(cx, y - r, r * .22, 0, 7); g.fill();
  };
  g.save(); g.lineJoin = 'round';
  [[BLUE, 1], ['#ffd23f', 2]].forEach(([c, i]) => {                       // العربات
    const cx = x - i * tw * 1.05, bob = Math.sin(t * 9 + i) * tw * .008;
    g.strokeStyle = INK; g.lineWidth = lw * 1.4; g.beginPath(); g.moveTo(cx + tw * .45, y - tw * .2); g.lineTo(cx + tw * .6, y - tw * .2); g.stroke();
    g.lineWidth = lw; g.fillStyle = c; rr(g, cx - tw * .45, y - tw * .66 + bob, tw * .9, tw * .52, tw * .08); g.fill(); g.stroke();
    g.fillStyle = '#dff4ff'; for (const k of [-.32, -.06, .2]) { rr(g, cx + k * tw, y - tw * .57 + bob, tw * .18, tw * .2, tw * .04); g.fill(); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(cx - tw * .45 + lw / 2, y - tw * .28 + bob, tw * .9 - lw, tw * .07);
    wheel(cx - tw * .25, wr * .85); wheel(cx + tw * .25, wr * .85);
  });
  const bob = Math.sin(t * 9) * tw * .01;                                  // القاطرة
  g.strokeStyle = INK; g.lineWidth = lw;
  g.fillStyle = '#8a1c22'; g.beginPath(); g.moveTo(x + tw * .32, y - tw * .2 + bob); g.lineTo(x + tw * .54, y - tw * .02); g.lineTo(x + tw * .3, y - tw * .02); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = INK; rr(g, x + tw * .1, y - tw * .88 + bob, tw * .16, tw * .34, tw * .03); g.fill(); rr(g, x + tw * .06, y - tw * .92 + bob, tw * .24, tw * .08, tw * .03); g.fill();
  g.fillStyle = RED; rr(g, x - tw * .12, y - tw * .58 + bob, tw * .46, tw * .42, tw * .1); g.fill(); g.stroke();
  g.fillStyle = '#c8102e'; rr(g, x - tw * .48, y - tw * .86 + bob, tw * .4, tw * .7, tw * .06); g.fill(); g.stroke();
  g.fillStyle = INK; rr(g, x - tw * .54, y - tw * .93 + bob, tw * .52, tw * .1, tw * .04); g.fill();
  g.fillStyle = '#9ad7ff'; rr(g, x - tw * .41, y - tw * .75 + bob, tw * .25, tw * .24, tw * .04); g.fill(); g.stroke();
  g.fillStyle = '#ffd23f'; g.fillRect(x - tw * .1, y - tw * .34 + bob, tw * .42, tw * .05);
  g.beginPath(); g.arc(x + tw * .3, y - tw * .47 + bob, tw * .07, 0, 7); g.fill(); g.stroke();
  wheel(x - tw * .28, wr); wheel(x + tw * .14, wr);
  const ry = y - wr, ox = Math.cos(rot) * wr * .5, oy = Math.sin(rot) * wr * .5;   // ذراع العجلات
  g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(5, tw * .06); g.beginPath(); g.moveTo(x - tw * .28 + ox, ry + oy); g.lineTo(x + tw * .14 + ox, ry + oy); g.stroke();
  g.strokeStyle = '#d6d6d6'; g.lineWidth = Math.max(2, tw * .03); g.stroke();
  g.restore();
}
const inBtn = (b, x, y) => b && Math.abs(x - b.x) < b.w / 2 && Math.abs(y - b.y) < b.h / 2;

/* ================= الأساس المشترك ================= */
function baseGame(w, s) {
  const st = MIS[w][s];
  const diff = ((w - 1) * NM + s) / (WORLDS.length * NM - 1);
  return { w, s, st, diff, kind: st.g, score: 0, combo: 0, bestCombo: 0, hits: 0, rounds: 0, hearts: 3, fx: [], shake: 0, t: 0, over: false, paused: false, got: new Set(), hurtT: 0, q: null, bg: IMG['bg_' + WORLDS[w - 1].bg] };
}
function hud(G) {
  const sc = $('#score'), st = AD(G.score); if (sc.textContent !== st) { sc.textContent = st; if (G.score) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } }
  const lv = $('#lives');
  if (G.timeLeft != null) { const s = Math.max(0, Math.ceil(G.timeLeft)); lv.innerHTML = `<span class="time${s <= 10 ? ' low' : ''}">⏱ ${AD(s)}</span>`; }
  else lv.innerHTML = [0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join('');
  $('#pbar').style.width = clamp(G.progress ? G.progress() : 0, 0, 1) * 100 + '%';
  const c = $('#combo'); const on = G.combo >= 3; c.classList.toggle('on', on); if (on) c.textContent = 'x' + AD(G.combo) + ' كومبو!';
}
function setTarget(html) {
  const tg = $('#q'); tg.innerHTML = html; fillMini(tg);
  const b = $('#target'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); measureTop();
}
function pickType(G) { const ts = G.st.tasks; let t = pick(ts); if (G.q && ts.length > 1 && t === G.q.type) t = pick(ts); return t; }
function nextQ(G, first) {
  G.q = makeQ(pickType(G), G); setTarget(G.q.hud);
  if (!first) setTimeout(() => { if (GAME === G && !G.over) G.q.speak(); }, 350);
  return G.q;
}
function scoreHit(G, x, y, val) {
  G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.hits++; G.pop = 1;
  const pts = 10 * Math.min(5, 1 + Math.floor(G.combo / 3)); G.score += pts;
  if (val != null && val >= 0 && val <= 12) G.got.add(val);
  SFX.pow(); fxBurst(G, x, y); fxRing(G, x, y); fxWord(G, pick(['واو!', 'بوم!', 'صَحّ!', 'شَبَكَة!', 'بَطَل!']), x, y - 7 * U);
  fxWord(G, '+' + AD(pts), x + 9 * U, y + 6 * U, '#fff', 5);
  if (G.combo % 5 === 0) { const c = $('#combo'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); say('combo'); return true; }
  return false;
}
const praise = () => say('good' + ri(1, 8));
function goodSay(G, q) { if (q && q.after && Math.random() < .7) q.after(); else praise(); }
function miss(G, x, y, hurt = true) {
  G.combo = 0; SFX.bad(); fxWord(G, pick(['أوبس!', 'لا!', 'أوه!']), x, y - 6 * U, '#ff5a5a');
  const b = $('#target'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
  if (hurt) hurtHero(G); else { G.shake = 1.2; say('try' + ri(1, 3)); }
}
function hurtHero(G) {
  if (G.hurtT > 0 || G.over) return;
  G.hurtT = 1.2; G.shake = 2.5; SFX.hurt(); G.combo = 0;
  if (G.timeLeft != null) { G.timeLeft -= 3; fxWord(G, '-٣', W / 2, H * .3, '#ff5a5a', 8); say('ouch'); return; }
  G.hearts--; say(G.hearts > 0 ? 'try' + ri(1, 3) : 'ouch');
  if (G.hearts <= 0) endGame(G, false);
}
function startMsg(G, then) {
  banner(`مُسْتَعِدٌّ؟<small>${G.st.hint}</small>`, 2800);
  say(G.st.boss ? 'boss' : 'ready').then(ok => { if (ok && GAME === G && !G.over) then(); });
}
const heroH = () => Math.min(H * .34, W * .36);

/* ---------- ١) تأرجح الشبكة ---------- */
function gameSwing(w, s) {
  const G = baseGame(w, s);
  G.goal = 7 + w; G.progress = () => G.hits / G.goal; G.scroll = 0; G.state = 'idle'; G.cards = []; G.home = { x: 0, y: 0 };
  G.resize = () => { G.home.x = Math.max(W * .14, heroH() * .3); G.home.y = H * .36; if (!G.hero) G.hero = { x: G.home.x, y: G.home.y }; layout(); };
  const cardR = () => clamp(Math.min(W, H) * .1, 42, 88);
  function layout() {
    if (!G.q) return; const r = cardR(), xs = [.52, .7, .88].map(f => W * f), y0 = Math.max(H * .4, TOP + r * 2.85), y1 = Math.max(y0 + r, H * .74), ys = shuffle([y0, (y0 + y1) / 2, y1]);
    G.cards.forEach((c, i) => { c.tx = xs[i]; c.ty = ys[i]; c.r = r; });
  }
  function ask(first) {
    const q = nextQ(G, first);
    G.cards = q.opts.map((o, i) => ({ o, ok: i === q.ans, x: W + 30 * U + i * 15 * U, y: H * .6, tx: 0, ty: 0, r: 0, ring: RING[i + G.hits % 3], dead: false, img: IMG[DRONES[(i + G.hits) % 4]], ph: rand(0, 6) }));
    layout(); G.state = 'pick'; G.qT = 0;
  }
  G.onDown = (x, y) => {
    if (G.state !== 'pick') return;
    for (const c of G.cards) {
      if (c.dead || Math.abs(x - c.x) > c.r * 1.1 || y < c.y - c.r * 2.2 || y > c.y + c.r * 1.1) continue;
      SFX.web(); fxWeb(G, G.hero.x, G.hero.y, c.x, c.y - c.r);
      if (c.ok) {
        G.state = 'fly'; G.fly = { t: 0, x0: G.hero.x, y0: G.hero.y, c }; c.caught = true;
        const combo = scoreHit(G, c.x, c.y, G.q.val); if (!combo) goodSay(G, G.q);
        G.score += Math.max(0, 10 - Math.floor(G.qT)) ; G.rounds++;
      } else { c.dead = true; miss(G, c.x, c.y, true); }
      return;
    }
  };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); G.qT += dt; hud(G);
    for (const c of G.cards) { c.ph += dt * 2; if (!c.caught) { c.x += (c.tx - c.x) * Math.min(1, dt * 4); c.y += (c.ty + Math.sin(c.ph) * 1.2 * U - c.y) * Math.min(1, dt * 4); } }
    if (G.state === 'fly') {
      const F = G.fly; F.t += dt / .75; const k = Math.min(1, F.t), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      G.hero.x = F.x0 + (F.c.x - F.x0) * e; G.hero.y = F.y0 + (F.c.y - F.c.r * 1.25 - F.y0) * e + Math.sin(k * Math.PI) * H * .14;
      if (k >= 1) { G.state = 'scroll'; G.cards.forEach(c => { if (!c.caught) { c.tx = c.x; c.ty = H + 40 * U; } }); }
    } else if (G.state === 'scroll') {
      const dx = (G.hero.x - G.home.x), step = Math.max(dx * dt * 4, 80 * dt * U);
      const mv = Math.min(dx, step); G.hero.x -= mv; G.scroll += mv; G.cards.forEach(c => { c.x -= mv; c.tx -= mv; });
      G.hero.y += (G.home.y - G.hero.y) * Math.min(1, dt * 3);
      if (dx <= 1) { if (G.hits >= G.goal) endGame(G, true); else ask(false); }
    } else if (G.state === 'pick' || G.state === 'idle') { G.hero.y += (G.home.y + Math.sin(G.t * 1.6) * 2 * U - G.hero.y) * Math.min(1, dt * 3); }
  };
  G.draw = g => {
    drawBg(g, G.bg, G.scroll * .6, .05);
    // خيوط الدرونات والبطاقات
    for (const c of G.cards) {
      if (c.y > H + c.r * 3) continue;
      const dy = c.y - c.r * 1.55; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(c.x, dy + 8); g.lineTo(c.x, c.y - c.r); g.stroke();
      if (!c.caught) drawSprite(g, c.img, c.x, dy + 10, c.r * 1.2, { rot: Math.sin(c.ph) * .08, alpha: c.dead ? .5 : 1 });
      drawCard(g, c.o, c.x, c.y, c.r, { ring: c.ring, rot: Math.sin(c.ph * .7) * .05, dim: c.dead, web: c.caught ? 1 : 0 });
    }
    // البطل والحبل
    const h = heroH() * 1.15, blink = G.hurtT > 0 && Math.floor(G.t * 16) % 2;
    let ax, ay; if (G.state === 'fly') { ax = G.fly.c.x; ay = G.fly.c.y - G.fly.c.r * 1.25; } else { ax = G.hero.x + W * .08; ay = -10; }
    webLine(g, G.hero.x, G.hero.y, ax, ay);
    const sw = G.state === 'fly' ? -1.25 + Math.sin(G.fly.t * Math.PI) * .5 : -1.05 + Math.sin(G.t * 1.6) * .14;
    drawHang(g, G.hero.x, G.hero.y, h, sw, blink ? .35 : 1);
  };
  G.start = () => { G.resize(); ask(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak();
  return G;
}

/* ---------- ٢) صيد الدرونات ---------- */
function huntRule(G) {
  const t = pickType(G), r = { type: t };
  const dotsOr = (v, hi) => { const k = pick(v >= 10 ? ['num', 'tens', 'frame'] : v === 0 ? ['num'] : ['num', 'grp', 'frame']); return k === 'grp' ? { k, e: pick(EMO), n: v } : { k, v }; };
  if (t === 'kind') {
    const keys = G.w >= 1 && Math.random() < .3 ? ['s_circle', 's_square', 's_triangle'] : Object.keys(KINDS); const K = pick(keys); r.K = K;
    r.hud = `<span class="lbl">اِصْطَدْ</span><span class="note big">${KIND_AR[K]}</span>`; r.speak = () => chain(S_('catch'), S_(K));
    r.gen = good => {
      if (K[0] === 's') { const shapes = ['circle', 'square', 'triangle'], sh = good ? K.slice(2) : pick(shapes.filter(x => x !== K.slice(2))); return { o: { k: 'shape', v: sh, c: pick([RED, BLUE, '#ffd23f', '#2ee66b', '#ff8a3d']) }, ok: good }; }
      const pool = good ? KINDS[K] : Object.entries(KINDS).filter(([k2]) => k2[0] === K[0] && k2 !== K).flatMap(([, v]) => v).filter(e => !KINDS[K].includes(e));
      return { o: { k: 'emo', e: pick(pool) }, ok: good };
    };
  } else {
    const N = t === 'num5' ? ri(1, 5) : t === 'rep12' ? ri(6, 12) : ri(3, 10); r.N = N;
    r.hud = `<span class="lbl">${t === 'num5' ? 'اِصْطَدِ الْعَدَدَ' : 'اِصْطَدْ كُلَّ ما يُساوي'}</span><span class="big-n">${AD(N)}</span>`;
    r.speak = () => chain(S_(t === 'num5' ? 'catchNum' : 'catchEq'), N_(N));
    r.gen = good => {
      if (t === 'num5') { const v = good ? N : pick([1, 2, 3, 4, 5].filter(x => x !== N)); return { o: Math.random() < .5 ? { k: 'num', v } : { k: 'grp', e: pick(EMO), n: v }, ok: good, val: v }; }
      if (t === 'rep12') { const v = good ? N : pick(wrongNums(N, 5, 12, 3)); return { o: dotsOr(v), ok: good, val: v }; }
      const v = good ? N : pick(wrongNums(N, 1, 10, 3));
      const sub = t === 'mixEq' && Math.random() < .5;
      if (sub) { const b = ri(0, 10 - v), a = v + b; return { o: { k: 'expr', a, op: '−', b }, ok: good, val: v }; }
      const a = ri(0, v); return { o: { k: 'expr', a, op: '+', b: v - a }, ok: good, val: v };
    };
  }
  return r;
}
const LANES = [{ dir: 1 }, { dir: -1 }, { dir: 1 }];
const laneY = (li, r) => { const a = Math.max(H * .31, TOP + r * 2.15), b = Math.max(a + r * 3, H * .76); return a + (b - a) * li / 2; };
function gameHunt(w, s) {
  const G = baseGame(w, s);
  G.timeLeft = 60; G.goal = 12 + w * 2; G.items = []; G.spawnT = .3; G.progress = () => G.hits / G.goal; G.ruleHits = 0; G.since = 0;
  const newRule = first => { G.rule = huntRule(G); G.q = { type: G.rule.type }; G.ruleHits = 0; setTarget(G.rule.hud); if (!first) { banner('هَدَفٌ جَديدٌ!', 900); setTimeout(() => GAME === G && !G.over && G.rule.speak(), 500); } };
  const shooter = () => fingerOf(W * .08, H + heroH() * .06, heroH() * .8);
  G.onDown = (x, y) => {
    if (G.t < 3) return;
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i]; if (it.dead || Math.hypot(x - it.x, y - it.y) > it.r * 1.35) continue;
      const sp = shooter(); SFX.web(); fxWeb(G, sp.x, sp.y, it.x, it.y);
      if (it.ok) { it.dead = true; it.fall = 0; const c = scoreHit(G, it.x, it.y, it.val); if (!c && Math.random() < .35) praise(); if (++G.ruleHits >= 4 && !G.over) newRule(); }
      else { it.shakeT = .4; miss(G, it.x, it.y, false); G.timeLeft -= 2; fxWord(G, '-٢', it.x, it.y + 9 * U, '#ff5a5a', 5); }
      return;
    }
  };
  G.update = dt => {
    G.t += dt; hud(G); for (const it of G.items) if (it.dead) { it.fall += dt; it.y += it.fall * 90 * U * dt; it.rot = (it.rot || 0) + dt * 5; }
    if (G.t < 3) return;
    G.timeLeft -= dt; G.spawnT -= dt;
    if (G.spawnT <= 0) {
      const want = G.since >= 2 || Math.random() < .42; G.since = want ? 0 : G.since + 1;
      const r = clamp(6.4 * U, 40, 70), free = LANES.map((L, li) => ({ L, li })).filter(({ L, li }) => !G.items.some(o => !o.dead && o.lane === li && (L.dir > 0 ? o.x < r * 3.2 : o.x > W - r * 3.2)));
      if (free.length) {
        const { L, li } = pick(free), it = G.rule.gen(want); it.r = r; it.dir = L.dir; it.lane = li;
        it.x = L.dir > 0 ? -r * 1.5 : W + r * 1.5; it.y0 = laneY(li, r); it.y = it.y0; it.vx = (13 + li * 2.5) * U * (1 + G.diff * .8) * L.dir; it.ph = rand(0, 6); it.img = IMG[pick(DRONES)]; it.ring = pick(RING);
        G.items.push(it);
      }
      G.spawnT = rand(.7, 1.1) - G.diff * .25;
    }
    for (const it of G.items) if (!it.dead) { it.x += it.vx * dt; it.ph += dt * 2.4; it.y = it.y0 + Math.sin(it.ph) * 3 * U; if (it.shakeT) it.shakeT = Math.max(0, it.shakeT - dt); }
    G.items = G.items.filter(it => it.y < H + 30 * U && it.x > -30 * U && it.x < W + 30 * U);
    if (G.hits >= G.goal) endGame(G, true); else if (G.timeLeft <= 0) endGame(G, G.hits >= G.goal * .35);
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .15);
    for (const it of G.items) {
      const sx = it.shakeT ? Math.sin(it.shakeT * 60) * 1.2 * U : 0;
      if (!it.dead) drawSprite(g, it.img, it.x + sx, it.y - it.r * .82, it.r * 1.15, { flip: it.dir > 0, rot: Math.sin(it.ph) * .1 });
      drawCard(g, it.o, it.x + sx, it.y + it.r * .2, it.r, { ring: it.ring, shape: 'ball', rot: it.rot || 0, web: it.dead ? 1 : 0 });
    }
    drawSprite(g, IMG.hero, W * .08, H + heroH() * .06, heroH() * .8, { sx: 1 + (G.pop || 0) * .08, sy: 1 + (G.pop || 0) * .08 });
  };
  G.start = () => { newRule(true); startMsg(G, () => G.rule.speak()); };
  G.speak = () => G.rule && G.rule.speak();
  return G;
}

/* ---------- ٣) شبكة التحويط (بالقلم) ---------- */
function gameLasso(w, s) {
  const G = baseGame(w, s);
  G.goal = 6; G.progress = () => G.rounds / G.goal; G.items = []; G.path = []; G.phase = 'draw'; G.cards = null; G.flash = null;
  const area = () => ({ x0: W * .06, x1: W * .94, y0: Math.max(H * .26, TOP + 12), y1: H * .94 });
  function round(first) {
    const t = pickType(G), q = { type: t }, A = area(); let list = [];
    const E = pick(EMO.filter(e => e !== '🕷️'));
    if (t === 'lassoN5') { q.N = ri(1, 5); list = Array(q.N + ri(2, 4)).fill(E); q.hud = `<span class="lbl">حَوِّطْ</span><span class="big-n">${AD(q.N)}</span>${emos(E, 1, true)}`; q.speak = () => chain(S_('lassoN'), N_(q.N)); q.val = q.N; }
    else if (t === 'lassoKind') { const K = pick(Object.keys(KINDS).filter(k => k[0] === 'c' || k[0] === 'k')); q.K = K; const good = shuffle(KINDS[K]).slice(0, ri(2, 4));
      const bad = shuffle(Object.entries(KINDS).filter(([k2]) => k2[0] === K[0] && k2 !== K).flatMap(([, v]) => v).filter(e => !KINDS[K].includes(e))).slice(0, ri(4, 5));
      list = good.map(e => ({ e, g: 1 })).concat(bad.map(e => ({ e, g: 0 }))); q.hud = `<span class="lbl">حَوِّطْ</span><span class="note big">${KIND_AR[K]}</span>`; q.speak = () => chain(S_('lasso'), S_(K)); }
    else if (t === 'lassoSum') { const sm = ri(2, G.diff < .6 ? 7 : 10), a = ri(1, sm - 1); q.N = sm; list = Array(sm + ri(2, 3)).fill(E); q.hud = `${eqH(a, '+', sm - a)}<span class="note">حَوِّطِ الْجَوابَ!</span>`; q.speak = () => chain(N_(a), S_('plus'), N_(sm - a), S_('lassoSum')); q.val = sm; q.after = () => chain(S_('eq'), N_(sm)); }
    else if (t === 'lassoTake') { const a = ri(3, 10), b = ri(1, a - 1); q.a = a; q.b = b; q.N = b; list = Array(a).fill(E); q.hud = `${eqH(a, '−', b)}<span class="note">حَوِّطِ الَّتي سَتَطيرُ: <b>${AD(b)}</b></span>`; q.speak = () => chain(N_(a), S_('minus'), N_(b), S_('lassoTake'), N_(b)); q.val = a - b; }
    G.q = q; setTarget(q.hud); G.phase = 'draw'; G.path = []; G.cards = null;
    const n = list.length, cols = Math.ceil(Math.sqrt(n * (A.x1 - A.x0) / (A.y1 - A.y0))), rows = Math.ceil(n / cols), cw = (A.x1 - A.x0) / cols, ch = (A.y1 - A.y0) / rows;
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
    G.items = list.map((it, i) => { const c = cells[i]; const o = typeof it === 'string' ? { e: it, g: 1 } : it;
      return { e: o.e, g: o.g, x: A.x0 + (c % cols + .5) * cw + rand(-.2, .2) * cw, y: A.y0 + ((c / cols | 0) + .5) * ch + rand(-.2, .2) * ch, vx: rand(-4, 4) * U, vy: rand(-3, 3) * U, r: clamp(Math.min(cw, ch) * .3, 22, 46), sel: false, fly: 0 }; });
    if (!first) setTimeout(() => GAME === G && !G.over && q.speak(), 400);
  }
  let down = false, penSeen = false;
  G.onDown = (x, y, e) => {
    if (G.t < 3 || G.phase === 'wait') return;
    if (G.phase === 'ask') { for (const c of G.cards) if (Math.hypot(x - c.x, y - c.y) < c.r * 1.15) return answerLeft(c); return; }
    if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
    down = true; G.path = [[x, y]];
  };
  G.onMove = (x, y, e) => { if (!down || (penSeen && e.pointerType === 'touch')) return; const l = G.path[G.path.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 3) G.path.push([x, y]); };
  G.onUp = () => { if (!down) return; down = false; if (G.path.length < 8) { G.path = []; return; } judge(); };
  const inside = (px, py, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
  function judge() {
    const P = G.path, sel = G.items.filter(it => !it.gone && inside(it.x, it.y, P)), q = G.q;
    const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
    let ok;
    if (q.K) {   // الأصناف: تُقبل عدّة حلقات صغيرة، كلّ حلقة يجب أن تحوي الصحيح فقط
      const fresh = sel.filter(i => !i.sel);
      ok = fresh.length > 0 && fresh.every(i => i.g);
      if (ok && G.items.some(i => i.g && !i.sel && !fresh.includes(i))) {
        fresh.forEach(i => { i.sel = true; }); SFX.web(); fxWord(G, 'صَحّ!', cx, cy, '#2ee66b', 7); G.flash = { ok: true, t: .6, n: G.items.filter(i => i.sel).length, x: cx, y: cy, path: P }; G.path = []; return;
      }
    } else ok = sel.length === q.N;
    G.flash = { ok, t: 1, n: sel.length, x: cx, y: cy, path: P };
    if (ok) {
      SFX.web(); sel.forEach(i => { i.sel = true; });
      if (q.type === 'lassoTake') { G.phase = 'wait'; SFX.pow(); setTimeout(() => { if (GAME !== G) return; sel.forEach(i => { i.fly = .01; }); askLeft(); }, 900); }
      else { G.rounds++; const c = scoreHit(G, cx, cy, q.val); if (!c) goodSay(G, q); G.phase = 'wait'; setTimeout(() => { if (GAME !== G || G.over) return; sel.forEach(i => { i.fly = .01; }); setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else round(false); }, 800); }, 700); }
    } else { miss(G, cx, cy, true); setTimeout(() => { if (G.flash && !G.flash.ok) G.path = []; }, 900); }
  }
  function askLeft() {
    const q = G.q, r = clamp(Math.min(W, H) * .09, 40, 76), m = numOpts(q.a - q.b, 0, 10);
    G.cards = m.opts.map((o, i) => ({ o, ok: i === m.ans, x: W * (.3 + i * .2), y: H * .8, r, ring: RING[i], born: G.t + i * .08 }));
    G.phase = 'ask'; G.path = []; setTarget(`${eqH(q.a, '−', q.b)}<span class="note">كَمْ بَقِيَ؟</span>`); say('left');
  }
  function answerLeft(c) {
    const q = G.q;
    if (c.ok) { G.rounds++; c.win = true; setTarget(eqH(q.a, '−', q.b, q.a - q.b)); const k = scoreHit(G, c.x, c.y, q.val); if (!k) chain(S_('eq'), N_(q.a - q.b)); G.phase = 'wait';
      setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else round(false); }, 1400); }
    else { c.dead = true; miss(G, c.x, c.y, true); }
  }
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G); const A = area();
    if (G.flash) { G.flash.t -= dt; if (G.flash.t <= 0) G.flash = null; }
    for (const it of G.items) {
      if (it.fly) { it.fly += dt; it.y -= it.fly * 160 * U * dt; if (it.y < -60) it.gone = true; continue; }
      if (down || it.sel || G.phase !== 'draw') continue;
      it.x += it.vx * dt * (.4 + G.diff); it.y += it.vy * dt * (.4 + G.diff);
      if (it.x < A.x0 + it.r || it.x > A.x1 - it.r) it.vx *= -1; if (it.y < A.y0 + it.r || it.y > A.y1 - it.r) it.vy *= -1;
      it.x = clamp(it.x, A.x0 + it.r, A.x1 - it.r); it.y = clamp(it.y, A.y0 + it.r, A.y1 - it.r);
    }
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .2);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const it of G.items) { if (it.gone) continue;
      g.fillStyle = INK; g.beginPath(); g.arc(it.x + 4, it.y + 4, it.r * 1.05, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(it.x, it.y, it.r * 1.05, 0, 7); g.fill(); g.lineWidth = 3.5; g.strokeStyle = INK; g.stroke();
      g.font = `${it.r * 1.25}px ${EMOJI_FONT}`; g.fillStyle = INK; g.fillText(it.e, it.x, it.y + it.r * .08); if (it.sel) drawWebOver(g, it.x, it.y, it.r * 1.2); }
    const P = G.flash ? G.flash.path : G.path;
    if (P.length > 1) {
      g.lineCap = g.lineJoin = 'round'; const col = G.flash ? (G.flash.ok ? '#2ee66b' : '#ff5a5a') : '#fff';
      for (const [c, lw] of [['rgba(0,0,0,.45)', 11], [col, 5]]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(P[0][0], P[0][1]); P.forEach(p => g.lineTo(p[0], p[1])); if (G.flash) g.closePath(); g.stroke(); }
    }
    if (G.flash) { g.save(); g.font = `800 ${14 * U}px ${AR_FONT}`; g.lineWidth = 8; g.strokeStyle = INK; g.fillStyle = G.flash.ok ? '#ffd23f' : '#fff'; g.strokeText(AD(G.flash.n), G.flash.x, G.flash.y); g.fillText(AD(G.flash.n), G.flash.x, G.flash.y); g.restore(); }
    if (G.cards) for (const c of G.cards) { const k = popSc(G, c); if (k > .02) drawCard(g, c.o, c.x, c.y, c.r, { ring: c.ring, dim: c.dead, sc: k * (c.win ? 1.15 : 1) }); }
  };
  G.start = () => { round(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.phase === 'ask' ? say('left') : G.q && G.q.speak();
  return G;
}

/* ---------- ٤) أنقذ القطار ---------- */
function gameTrain(w, s) {
  const G = baseGame(w, s);
  G.goal = 4 + Math.min(2, w - 1); G.progress = () => G.rounds / G.goal; G.slots = []; G.tiles = []; G.drag = null; G.train = { x: 0, v: 0 }; G.phase = 'run';
  const TW = () => clamp(Math.min(W / 8.5, H * .15), 50, 120), trackY = () => H * .5;
  function build(first) {
    const t = pickType(G), n = t === 'pattern' ? 7 : 6; let vals, mk;
    if (t === 'pattern') { const p = patternSeq(n, G.diff); vals = p.seq; mk = v => ({ k: 'emo', e: v }); G.extra = p.items; }
    else if (t === 'days') { const st = ri(0, 6); vals = Array.from({ length: n }, (_, i) => (st + i) % 7); mk = v => ({ k: 'txt', v: window.DAYS_PLAIN[v] }); G.extra = [0, 1, 2, 3, 4, 5, 6]; }
    else { const hi = t === 'seq5' ? 5 : 12, len = t === 'seq5' ? 5 : n, st = t === 'seq5' ? 1 : ri(0, hi - len + 1); vals = Array.from({ length: len }, (_, i) => st + i); if (Math.random() < .3 + G.diff * .3) vals.reverse(); mk = v => ({ k: 'num', v }); G.extra = Array.from({ length: hi + 1 }, (_, i) => i); }
    const ng = t === 'seq5' ? ri(1, 2) : G.diff < .3 ? 1 : 2;
    const g0 = t === 'pattern' ? 3 : 2, gaps = shuffle(Array.from({ length: vals.length - g0 }, (_, i) => i + g0)).slice(0, ng).sort((a, b) => a - b);
    G.seqType = t; G.q = { type: t };
    G.slots = vals.map((v, i) => ({ v, o: mk(v), gap: gaps.includes(i), filled: !gaps.includes(i) }));
    const need = gaps.map(i => vals[i]); const wrong = shuffle(G.extra.filter(v => !need.includes(v) && !(t === 'pattern' && false))).slice(0, 4 - Math.min(need.length, 4) + (t === 'pattern' ? 0 : 0));
    let pool = uniq(need.concat(wrong)); if (t === 'pattern') pool = uniq(need.concat(shuffle(G.extra))).slice(0, 3);
    G.tiles = shuffle(pool.slice(0, 4)).map(v => ({ v, o: mk(v), x: 0, y: 0, hx: 0, hy: 0, used: false }));
    layout(); G.train.x = -W * .25; G.train.v = W / (13 - G.diff * 4); G.phase = 'run'; G.saved = false;
    setTarget(`<span class="lbl">🚂</span><span class="note big">${t === 'pattern' ? 'أَكْمِلِ النَّمَطَ!' : t === 'days' ? 'رَتِّبْ أَيّامَ الْأُسْبوعِ!' : 'ما الْعَدَدُ النّاقِصُ؟'}</span>`);
    const sp = () => chain(S_('train'), S_(t === 'pattern' ? 'pattern' : t === 'days' ? 'days' : 'missing'));
    G.q.speak = sp; if (!first) setTimeout(() => GAME === G && !G.over && sp(), 400);
  }
  function layout() {
    const tw = TW(), n = G.slots.length, x0 = W / 2 - (n - 1) * tw * 1.08 / 2;
    G.slots.forEach((s, i) => { s.x = x0 + i * tw * 1.08; s.y = trackY(); s.r = tw * .46; });
    const m = G.tiles.length; G.tiles.forEach((t, i) => { t.hx = W / 2 + (i - (m - 1) / 2) * tw * 1.35; t.hy = H * .83; if (!t.used && G.drag !== t) { t.x = t.hx; t.y = t.hy; } t.r = tw * .46; });
  }
  G.resize = layout;
  function place(tile, slot) {
    if (slot && slot.gap && !slot.filled && slot.v === tile.v) {
      slot.filled = true; tile.used = true; tile.x = slot.x; tile.y = slot.y; SFX.web(); fxWeb(G, W * .5, H, slot.x, slot.y);
      const c = scoreHit(G, slot.x, slot.y, typeof tile.v === 'number' && G.seqType !== 'days' && G.seqType !== 'pattern' ? tile.v : null); if (!c && Math.random() < .5) praise();
      return true;
    }
    miss(G, tile.x, tile.y, false); G.train.v *= 1.08; return false;
  }
  let penSeen = false;
  G.onDown = (x, y, e) => {
    if (G.t < 3 || G.phase !== 'run') return; if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
    const t = G.tiles.find(t => !t.used && Math.hypot(x - t.x, y - t.y) < t.r * 1.2); if (!t) return;
    G.drag = t; t.dx = x - t.x; t.dy = y - t.y; t.moved = 0; t.sx = x; t.sy = y; SFX.click();
  };
  G.onMove = (x, y) => { const t = G.drag; if (!t) return; t.x = x - t.dx; t.y = y - t.dy; t.moved = Math.max(t.moved, Math.hypot(x - t.sx, y - t.sy)); };
  G.onUp = () => {
    const t = G.drag; if (!t) return; G.drag = null;
    let slot = null;
    if (t.moved < 12) slot = G.slots.find(s => s.gap && !s.filled);            // ضغطة فقط → أوّل فراغ
    else slot = G.slots.filter(s => s.gap && !s.filled).sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
    if (slot && t.moved >= 12 && Math.hypot(slot.x - t.x, slot.y - t.y) > slot.r * 2.2) slot = null;
    if (!slot || !place(t, slot)) { t.x = t.hx; t.y = t.hy; }
  };
  G.puffs = []; let puffT = 0;
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G);
    for (const p of G.puffs) { p.life -= dt * .8; p.y -= 34 * U * dt * p.life; p.x -= 6 * U * dt; p.r += 9 * U * dt; }
    G.puffs = G.puffs.filter(p => p.life > 0);
    if (G.t < 3.2) return;
    if (G.phase === 'run' && (puffT -= dt) <= 0) { puffT = .22; const tw = TW(); G.puffs.push({ x: G.train.x + tw * .18, y: trackY() - tw * 1.4, r: tw * .07, life: 1 }); }
    const tr = G.train, head = tr.x + TW() * .9;
    if (G.phase === 'run') {
      const gap = G.slots.find(s => s.gap && !s.filled);
      tr.x += tr.v * dt * (G.drag ? .6 : 1);
      if (gap && head >= gap.x - gap.r) {   // القطار وصل فراغاً فارغاً: شبكة الإنقاذ
        tr.x = gap.x - gap.r - TW() * .9; gap.filled = true; gap.saved = 1; SFX.zap(); fxWord(G, 'شَبَكَةُ إِنْقاذٍ!', gap.x, gap.y - 12 * U, '#fff', 6); hurtHero(G);
        const t = G.tiles.find(t => t.v === gap.v && !t.used); if (t) { t.used = true; t.x = gap.x; t.y = gap.y; }
      }
      if (tr.x > W + TW()) { G.rounds++; SFX.choo(); G.phase = 'next'; if (G.rounds >= G.goal) endGame(G, true); else { setTimeout(() => GAME === G && !G.over && build(false), 400); } }
    }
    for (const s of G.slots) if (s.saved) s.saved = Math.max(0, s.saved - dt * .5);
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .25);
    const tw = TW(), y = trackY();
    // الوادي
    g.fillStyle = 'rgba(10,20,40,.35)'; g.fillRect(0, y + tw * .5, W, tw * .4);
    g.fillStyle = '#6b4a2b'; g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.rect(-10, y + tw * .46, G.slots[0].x - tw * .54 + 10, tw * .22); g.fill(); g.stroke();
    g.beginPath(); g.rect(G.slots[G.slots.length - 1].x + tw * .54, y + tw * .46, W, tw * .22); g.fill(); g.stroke();
    for (const s of G.slots) {
      if (!s.gap || s.filled) drawCard(g, s.o, s.x, s.y, s.r, { ring: s.saved ? '#ff5a5a' : '#ffd23f' });
      else { g.save(); g.setLineDash([8, 8]); g.strokeStyle = '#fff'; g.lineWidth = 4; rr(g, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2, s.r * .28); g.stroke(); g.restore();
        g.fillStyle = '#fff'; g.font = `800 ${s.r}px ${AR_FONT}`; cText(g, '؟', s.x, s.y); }
      if (s.saved) drawWebOver(g, s.x, s.y, s.r * 1.3, s.saved);
    }
    // السكة فوق البطاقات
    const ty = y - tw * .5;
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(0, ty); g.lineTo(W, ty); g.stroke();
    g.strokeStyle = '#b9c0c9'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, ty - 1.5); g.lineTo(W, ty - 1.5); g.stroke();
    // الدخان ثم القطار
    for (const p of G.puffs) { g.fillStyle = `rgba(255,255,255,${.75 * p.life})`; g.strokeStyle = `rgba(20,20,20,${.5 * p.life})`; g.lineWidth = 2.5; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); g.stroke(); }
    drawTrain(g, G.train.x, ty, tw, G.t);
    // القطع
    for (const t of G.tiles) { if (t.used) continue; if (t !== G.drag) drawCard(g, t.o, t.x, t.y, t.r, { ring: '#26c6da' }); }
    if (G.drag) drawCard(g, G.drag.o, G.drag.x, G.drag.y, G.drag.r * 1.12, { ring: '#26c6da', rot: -.06 });
  };
  G.start = () => { build(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak && G.q.speak();
  return G;
}

/* ---------- ٥) الميزان ---------- */
function gameBalance(w, s) {
  const G = baseGame(w, s);
  G.goal = 6; G.progress = () => G.rounds / G.goal; G.ang = 0; G.tAng = 0; G.phase = 'play';
  const B = {};
  function round(first) {
    const t = pickType(G), q = { type: t };
    if (t === 'eqGroup') { q.L = ri(1, 5); q.fix = 0; q.emo = pick(EMO); q.hud = `<span class="lbl">يُكافِئُ</span><span class="note big">اِجْعَلِ الْكَفَّتَيْنِ مُتَكافِئَتَيْنِ</span>`; q.speak = S_('balance'); q.val = q.L; }
    else if (t === 'bond') { q.L = ri(3, 10); q.fix = ri(1, q.L - 1); q.hud = `<span class="lbl">تَكْوينُ ${AD(q.L)}</span><span class="eq">${AD(q.L)} = ${AD(q.fix)} + <b>؟</b></span>`; q.speak = () => chain(S_('balanceMake'), N_(q.L)); q.val = q.L - q.fix; q.done = () => `<span class="eq">${AD(q.L)} = ${AD(q.fix)} + <b>${AD(q.L - q.fix)}</b></span>`; }
    else { q.L = ri(3, 10); q.fix = ri(1, q.L - 1); q.hud = `${eqH(q.L, '−', q.fix)}<span class="note">${AD(q.fix)} + ؟ = ${AD(q.L)}</span>`; q.speak = () => chain(N_(q.L), S_('minus'), N_(q.fix), S_('eqWhat')); q.val = q.L - q.fix; q.done = () => eqH(q.L, '−', q.fix, q.L - q.fix); }
    q.add = 0; G.q = q; G.phase = 'play'; G.tAng = 0; setTarget(q.hud);
    if (!first) setTimeout(() => GAME === G && !G.over && q.speak(), 400);
  }
  G.resize = () => { const bw = Math.min(W * .28, 240), bh = clamp(H * .11, 56, 90);
    B.minus = { x: W / 2 - bw * .9, y: H * .88, w: bh * 1.3, h: bh }; B.plus = { x: W / 2 - bw * .9 + bh * 1.5, y: H * .88, w: bh * 1.3, h: bh }; B.weigh = { x: W / 2 + bw * .55, y: H * .88, w: bw, h: bh }; };
  G.resize();
  const beam = () => ({ cx: W / 2, cy: Math.max(H * .36, TOP + 9 * U), L: Math.min(W * .34, H * .62) });
  G.onDown = (x, y) => {
    if (G.t < 3 || G.phase !== 'play') return; const q = G.q;
    if (inBtn(B.plus, x, y)) { if (q.fix + q.add < 12) { q.add++; SFX.pop(); } B.plus.down = .15; }
    else if (inBtn(B.minus, x, y)) { if (q.add > 0) { q.add--; SFX.click(); } B.minus.down = .15; }
    else if (inBtn(B.weigh, x, y)) { B.weigh.down = .15; weigh(); }
    else { const b = beam(); if (x > b.cx) { if (q.fix + q.add < 12) { q.add++; SFX.pop(); } } }
  };
  function weigh() {
    const q = G.q, R = q.fix + q.add, d = R - q.L; G.phase = 'weigh'; G.tAng = clamp(d * .07, -.32, .32); SFX.whoosh && SFX.whoosh();
    setTimeout(() => {
      if (GAME !== G || G.over) return;
      if (d === 0) { G.rounds++; const b = beam(); const c = scoreHit(G, b.cx, b.cy, q.val); if (q.done) setTarget(q.done()); if (!c) goodSay(G, q); fxWord(G, 'مُتَوازِنٌ!', b.cx, b.cy - 16 * U, '#2ee66b', 9);
        setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else round(false); }, 1500); }
      else { const b = beam(); miss(G, b.cx + (d > 0 ? 1 : -1) * b.L * .8, b.cy, true); fxWord(G, d > 0 ? 'كَثيرٌ!' : 'قَليلٌ!', b.cx, b.cy - 16 * U, '#ff5a5a', 8);
        setTimeout(() => { if (GAME === G && !G.over) { G.phase = 'play'; G.tAng = 0; } }, 1300); }
    }, 700);
  }
  const pile = (g, n, cx, by, cs, col, emo) => {   // كومة مكعّبات أو أشياء
    const per = 5; for (let i = 0; i < n; i++) { const r = i / per | 0, k = i % per, inRow = Math.min(per, n - r * per), px = cx + (k - (inRow - 1) / 2) * cs * 1.05 - cs / 2, py = by - (r + 1) * cs * 1.05;
      if (emo) { g.font = `${cs * .95}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emo, px + cs / 2, py + cs / 2); } else cube(g, px, py, cs, typeof col === 'function' ? col(i) : col); }
  };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G); G.ang += (G.tAng - G.ang) * Math.min(1, dt * 5);
    for (const k of ['plus', 'minus', 'weigh']) if (B[k].down) B[k].down = Math.max(0, B[k].down - dt);
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .3); if (!G.q) return;
    const q = G.q, b = beam(), cs = clamp(b.L * .15, 20, 48), a = G.ang;
    // القاعدة
    g.fillStyle = '#8a5a2b'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(b.cx, b.cy); g.lineTo(b.cx - 40, H * .74); g.lineTo(b.cx + 40, H * .74); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.rect(b.cx - 70, H * .74, 140, 16); g.fill(); g.stroke();
    const ex = Math.cos(a) * b.L, ey = Math.sin(a) * b.L;
    g.lineWidth = 12; g.strokeStyle = INK; g.beginPath(); g.moveTo(b.cx - ex, b.cy - ey); g.lineTo(b.cx + ex, b.cy + ey); g.stroke(); g.lineWidth = 7; g.strokeStyle = '#ffd23f'; g.stroke();
    g.fillStyle = RED; g.beginPath(); g.arc(b.cx, b.cy, 12, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    [[-1, q.L, true], [1, q.fix + q.add, false]].forEach(([side, n, left]) => {
      const px = b.cx + side * ex, py = b.cy + side * ey, pw = b.L * .62, dropY = py + b.L * .42;
      g.strokeStyle = '#333'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px, py); g.lineTo(px - pw / 2, dropY); g.moveTo(px, py); g.lineTo(px + pw / 2, dropY); g.stroke();
      g.fillStyle = left ? '#ffb3b8' : '#b3d4ff'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(px, dropY, pw / 2, pw * .1, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke();
      if (left) pile(g, n, px, dropY, cs, '#9a9a9a', q.type === 'eqGroup' ? q.emo : null);
      else pile(g, n, px, dropY, cs, i => i < q.fix ? RED : BLUE);
      g.font = `800 ${cs * 1.3}px ${AR_FONT}`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 6;
      const toks = left ? (q.type === 'eqGroup' ? null : [AD(q.L)]) : (q.fix ? [AD(q.fix), '+', AD(q.add)] : [AD(q.add)]);
      if (toks) { const ly = dropY + cs * 1.5; g.font = `800 ${cs * 1.2}px ${AR_FONT}`; const tw = toks.reduce((a, t) => a + g.measureText(t).width, 0) + cs * .6 * toks.length;
        g.fillStyle = '#fff'; rr(g, px - tw / 2 - 8, ly - cs * .75, tw + 16, cs * 1.4, 12); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; tokensRTL(g, toks, px, ly - cs * .05, cs * 1.2); }
    });
    if (G.phase === 'play') { g.font = `${cs * 1.1}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.fillText('🔒', b.cx, b.cy - 28); }
    drawBtn(g, B.minus, '−'); drawBtn(g, B.plus, '+', '#2ee66b'); drawBtn(g, B.weigh, '⚖️ زِنْ', '#ffd23f');
  };
  G.start = () => { round(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak();
  return G;
}

/* ---------- ٦) برج الساعة ---------- */
function gameClock(w, s) {
  const G = baseGame(w, s);
  G.goal = 7; G.progress = () => G.rounds / G.goal; G.handA = -1.5708; G.drag = false; G.cards = null; G.phase = 'play';
  const C = () => { const R = Math.min((H - TOP) * .4, W * .24); return { cx: W * .3, cy: TOP + (H - TOP) * .52, R }; };
  const B = {};
  G.resize = () => { const c = C(); B.ok = { x: W * .72, y: H * .8, w: clamp(W * .2, 150, 260), h: clamp(H * .12, 56, 90) }; if (G.cards) G.cards.forEach((k, i) => { k.x = W * .72; k.y = TOP + (H - TOP) * (.2 + i * .28); k.r = clamp(H * .075, 36, 64); }); };
  function round(first) {
    const t = pickType(G); G.cards = null;
    if (t === 'setClock') {
      const h = ri(1, 12); G.q = { type: t, h, val: h, hud: `<span class="lbl">اِضْبِطِ السّاعَةَ</span><span class="big-n">${AD(h)}:٠٠</span>`, speak: () => chain(S_('setClock'), S_('h' + h)) };
      let start = ri(1, 12); if (start === h) start = h % 12 + 1; G.handA = start / 12 * 6.283 - 1.5708; G.showH = null;
    } else { G.q = makeQ(t, G); G.q.hud = G.q.hud.replace(/<svg class="clk"[\s\S]*<\/svg>/, '<span class="note big">اُنْظُرْ إِلى السّاعَةِ الْكَبيرَةِ 👈</span>'); G.showH = G.q.h; G.handA = (G.q.h % 12) / 12 * 6.283 - 1.5708; G.cards = G.q.opts.map((o, i) => ({ o, ok: i === G.q.ans, ring: RING[i], born: G.t + i * .08 })); }
    G.phase = 'play'; setTarget(G.q.hud); G.resize();
    if (!first) setTimeout(() => GAME === G && !G.over && G.q.speak(), 400);
  }
  const angOf = (x, y) => { const c = C(); return Math.atan2(y - c.cy, x - c.cx); };
  const hourOf = a => { let h = Math.round(((a + 1.5708) / 6.283) * 12); h = ((h % 12) + 12) % 12; return h || 12; };
  G.onDown = (x, y) => {
    if (G.t < 3 || G.phase !== 'play') return; const c = C();
    if (G.cards) { for (const k of G.cards) if (!k.dead && Math.hypot(x - k.x, y - k.y) < k.r * 1.15) return pickCard(k); return; }
    if (Math.hypot(x - c.cx, y - c.cy) < c.R * 1.1) { G.drag = true; G.handA = angOf(x, y); SFX.tick(); return; }
    if (inBtn(B.ok, x, y)) check();
  };
  G.onMove = (x, y) => { if (!G.drag) return; const na = angOf(x, y); if (hourOf(na) !== hourOf(G.handA)) SFX.tick(); G.handA = na; };
  G.onUp = () => { if (!G.drag) return; G.drag = false; G.handA = hourOf(G.handA) / 12 * 6.283 - 1.5708; };
  function win(x, y) {
    G.rounds++; const c = scoreHit(G, x, y, null); SFX.bell(); if (!c) { if (G.q.type === 'setClock') say('h' + G.q.h); else praise(); } G.phase = 'wait';
    setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else round(false); }, 1500);
  }
  function check() { const c = C(); if (hourOf(G.handA) === G.q.h) win(c.cx, c.cy - c.R * .5); else { miss(G, c.cx, c.cy, true); } }
  function pickCard(k) { if (k.ok) { k.win = true; win(k.x, k.y); } else { k.dead = true; miss(G, k.x, k.y, true); } }
  G.update = dt => { G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G); };
  G.draw = g => {
    drawBg(g, G.bg, null, .3); const c = C();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(c.cx + 8, c.cy + 10, c.R * 1.08, 0, 7); g.fill();
    g.fillStyle = '#7a4a22'; g.beginPath(); g.arc(c.cx, c.cy, c.R * 1.08, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    drawClock(g, c.cx, c.cy, c.R, 12, { angle: G.handA });
    if (!G.cards && G.phase === 'play') {
      const tip = { x: c.cx + Math.cos(G.handA) * c.R * .48, y: c.cy + Math.sin(G.handA) * c.R * .48 };
      g.fillStyle = 'rgba(255,255,255,.85)'; g.strokeStyle = RED; g.lineWidth = 4; g.beginPath(); g.arc(tip.x, tip.y, c.R * .1 + Math.sin(G.t * 5) * 2, 0, 7); g.fill(); g.stroke();
      drawBtn(g, B.ok, '✓ تَمَّ', '#2ee66b');
      g.font = `800 ${c.R * .22}px ${AR_FONT}`; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 6; const tt = AD(hourOf(G.handA)) + ':٠٠';
      g.strokeText(tt, W * .72, H * .5); g.fillText(tt, W * .72, H * .5);
    }
    if (G.cards) for (const k of G.cards) { const p = popSc(G, k); if (p > .02) drawCard(g, k.o, k.x, k.y, k.r, { ring: k.ring, dim: k.dead, sc: p * (k.win ? 1.15 : 1) }); }
  };
  G.start = () => { round(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak();
  return G;
}

/* ---------- ٧) قفز الأسطح (خطّ الأعداد) ---------- */
function gameHop(w, s) {
  const G = baseGame(w, s);
  G.max = w === 2 ? 12 : 10; G.goal = 7; G.progress = () => G.rounds / G.goal; G.pos = 0; G.hop = null; G.phase = 'play'; G.mark = null;
  const roofs = () => { const n = G.max + 1, m = Math.max(W * .055, 46), step = (W - m * 2) / (n - 1); return Array.from({ length: n }, (_, i) => ({ i, x: m + i * step, y: H * (.62 + ((i * 37) % 5) * .035), w: step * .86 })); };
  function round(first) {
    const t = pickType(G), q = { type: t }; let a, b;
    if (t === 'after') { a = ri(0, G.max - 1); b = 1; q.hud = `<span class="note big">ما الْعَدَدُ الَّذي بَعْدَ <b>${AD(a)}</b>؟</span>`; q.speak = () => chain(S_('after'), N_(a)); }
    else if (t === 'before') { a = ri(1, G.max); b = -1; q.hud = `<span class="note big">ما الْعَدَدُ الَّذي قَبْلَ <b>${AD(a)}</b>؟</span>`; q.speak = () => chain(S_('before'), N_(a)); }
    else if (t === 'addLine') { const sm = ri(2, 10); a = ri(0, sm - 1); b = sm - a; q.hud = eqH(a, '+', b); q.speak = () => chain(N_(a), S_('plus'), N_(b), S_('eqWhat')); }
    else { a = ri(2, 10); const k = ri(1, a); b = -k; q.hud = eqH(a, '−', k); q.speak = () => chain(N_(a), S_('minus'), N_(k), S_('eqWhat')); }
    q.a = a; q.b = b; q.res = a + b; q.val = q.res; G.q = q; G.pos = a; G.phase = 'play'; G.mark = null; G.chosen = null;
    setTarget(`<span class="lbl">🏢</span>${q.hud}`);
    if (!first) setTimeout(() => GAME === G && !G.over && q.speak(), 400);
  }
  G.onDown = x => {
    if (G.t < 3 || G.phase !== 'play') return;
    const R = roofs(), r = R.reduce((best, k) => Math.abs(k.x - x) < Math.abs(best.x - x) ? k : best, R[0]);
    G.chosen = r.i; G.phase = 'hop'; SFX.click();
    const q = G.q, dir = Math.sign(q.b) || 1, steps = Math.abs(q.b);
    G.hop = { k: 0, steps, dir, t: 0, from: q.a };
  };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G);
    const hp = G.hop; if (G.phase !== 'hop' || !hp) return;
    hp.t += dt / .5;
    if (hp.t >= 1) {
      hp.t = 0; hp.k++; G.pos = hp.from + hp.dir * hp.k; SFX.hop(); fxRing(G, roofs()[G.pos].x, roofs()[G.pos].y);
      if (hp.steps > 1) num(hp.k);
      if (hp.k >= hp.steps) {
        G.hop = null; G.phase = 'wait'; const R = roofs(), q = G.q;
        if (G.chosen === q.res) { G.rounds++; G.mark = { i: q.res, ok: true }; const c = scoreHit(G, R[q.res].x, R[q.res].y - 20 * U, q.res); setTimeout(() => { if (GAME === G && !c) chain(S_('eq'), N_(q.res)); }, hp.steps > 1 ? 450 : 0); }
        else { G.mark = { i: G.chosen, ok: false, right: q.res }; setTimeout(() => GAME === G && miss(G, R[G.chosen].x, R[G.chosen].y, true), 300); }
        setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else round(false); }, 2000);
      }
    }
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .15); const R = roofs(), fs = clamp(R[1].x - R[0].x, 20, 60);
    for (const r of R) {
      const mk = G.mark && (G.mark.i === r.i || G.mark.right === r.i);
      g.fillStyle = mk ? (G.mark.i === r.i && !G.mark.ok ? '#ff5a5a' : '#2ee66b') : ['#5b6ee1', '#e8313a', '#26a69a', '#ff8a3d'][r.i % 4]; g.strokeStyle = INK; g.lineWidth = 4;
      g.beginPath(); g.rect(r.x - r.w / 2, r.y, r.w, H - r.y + 5); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,240,150,.9)'; for (let yy = r.y + fs * .7; yy < H; yy += fs * .7) for (const f of [-.25, .25]) g.fillRect(r.x + f * r.w - fs * .1, yy, fs * .2, fs * .28);
      g.fillStyle = '#fff'; rr(g, r.x - fs * .42, r.y + fs * .08, fs * .84, fs * .7, 8); g.fill(); g.stroke();
      g.fillStyle = INK; g.font = `800 ${fs * .6}px ${AR_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; cText(g, AD(r.i), r.x, r.y + fs * .43);
      if (G.chosen === r.i && G.phase !== 'play') { g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.strokeRect(r.x - r.w / 2 - 3, r.y - 3, r.w + 6, fs); }
    }
    // البطل يقفز
    const hp = G.hop, h = clamp(H * .24, 90, 220); let x = R[G.pos].x, y = R[G.pos].y;
    if (hp) { const nx = R[hp.from + hp.dir * (hp.k + 1)]; if (nx) { x += (nx.x - x) * hp.t; y += (nx.y - y) * hp.t - Math.sin(hp.t * Math.PI) * H * .12; } }
    drawSprite(g, IMG.hero, x, y + 4, h, { flip: G.q && G.q.b < 0, sy: hp ? 1 + Math.sin(hp.t * Math.PI) * .08 : 1, sx: hp ? 1 - Math.sin(hp.t * Math.PI) * .05 : 1 });
    if (G.q && G.q.b && Math.abs(G.q.b) > 1 && (hp || G.phase === 'wait')) { const done = hp ? hp.k : Math.abs(G.q.b); for (let k = 0; k < done; k++) { const a = R[G.q.a + Math.sign(G.q.b) * k], b = R[G.q.a + Math.sign(G.q.b) * (k + 1)]; g.strokeStyle = '#fff'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(a.x, a.y - 4); g.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - H * .12, b.x, b.y - 4); g.stroke(); g.setLineDash([]); } }
  };
  G.start = () => { round(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak();
  return G;
}

/* ---------- ٨) الزعيم: الروبوت المشاغب ---------- */
function gameBoss(w, s) {
  const G = baseGame(w, s);
  G.boss = { hp: 3, t: 0, flash: 0, power: 0, y: 0 }; G.progress = () => 1 - G.boss.hp / 3; G.cards = []; G.phase = 'wait';
  const qTime = () => 14 - G.diff * 5;
  const cardR = () => clamp(Math.min(W, H) * .09, 40, 80);
  function ask() {
    const q = nextQ(G, false); const r = cardR();
    G.cards = q.opts.map((o, i) => ({ o, ok: i === q.ans, x: W * (.34 + i * .17), y: H * .74, r, ring: RING[i + 2], dead: false, born: G.t + i * .08 }));
    G.qLeft = qTime(); G.phase = 'play';
  }
  G.resize = () => { const r = cardR(); G.cards.forEach((c, i) => { c.x = W * (.34 + i * .17); c.y = H * .74; c.r = r; }); };
  const barY = () => Math.max(H * .2, TOP + 7 * U), bossH = () => Math.min(H * .5, W * .36, (H - barY()) * .66);
  const bossPos = () => ({ x: W * .8, y: Math.max(H * .5, barY() + bossH() * .5 + H * .09) + Math.sin(G.boss.t * 1.2) * H * .05 });
  G.onDown = (x, y) => {
    if (G.phase !== 'play') return;
    for (const c of G.cards) {
      if (c.dead || Math.hypot(x - c.x, y - c.y) > c.r * 1.15) continue;
      if (c.ok) {
        G.phase = 'wait'; const bp = bossPos(), f = fingerOf(W * .12, H * .98, heroH() * 1.15); SFX.web(); fxWeb(G, f.x, f.y, bp.x, bp.y); c.win = true;
        setTimeout(() => { if (GAME !== G) return; G.boss.flash = 1; G.shake = 1.5; const k = scoreHit(G, bp.x, bp.y, G.q.val); if (!k) goodSay(G, G.q); G.boss.power++;
          if (G.boss.power >= 3) setTimeout(() => GAME === G && superAttack(G), 900); else setTimeout(() => GAME === G && !G.over && ask(), 1300); }, 250);
      } else { c.dead = true; zap(G); }
      return;
    }
  };
  function zap(G) { SFX.zap(); fxWord(G, 'زاب!', W * .16, H * .5, '#b388ff', 10); G.combo = 0; hurtHero(G); }
  G.zap = zap;
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); const B = G.boss; B.t += dt; B.flash = Math.max(0, B.flash - dt * 2); hud(G);
    if (G.phase === 'play') { G.qLeft -= dt; if (G.qLeft <= 0) { G.phase = 'wait'; zap(G); setTimeout(() => GAME === G && !G.over && ask(), 1400); } }
  };
  G.draw = g => {
    drawBg(g, G.bg, null, .3); const B = G.boss, bp = bossPos(), bs = bossH();
    drawSprite(g, IMG.boss, bp.x, bp.y + bs / 2, bs, { flash: B.flash, sx: 1 + Math.sin(B.t * 3) * .03 });
    const bx = W * .62, by = barY(), bw = W * .3;
    g.fillStyle = INK; g.fillRect(bx - 4, by - 4, bw + 8, 22); g.fillStyle = '#444'; g.fillRect(bx, by, bw, 14); g.fillStyle = '#b44dff'; g.fillRect(bx, by, bw * B.hp / 3, 14);
    g.font = `800 ${4.2 * U}px ${AR_FONT}`; g.textAlign = 'right'; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 5; g.strokeText('الرّوبوتُ الْمُشاغِبُ', bx + bw, by - 12); g.fillText('الرّوبوتُ الْمُشاغِبُ', bx + bw, by - 12);
    drawSprite(g, IMG.hero, W * .12, H * .98, heroH() * 1.15, { alpha: G.hurtT > 0 && Math.floor(G.t * 16) % 2 ? .35 : 1, sx: 1 + (G.pop || 0) * .08, sy: 1 + (G.pop || 0) * .08 });
    // طاقة الشبكة
    const px = W * .06, py = by; g.textAlign = 'left'; g.font = `800 ${3.6 * U}px ${AR_FONT}`; g.strokeText('طاقَةُ الشَّبَكَةِ', px, py - 8); g.fillStyle = '#ffd23f'; g.fillText('طاقَةُ الشَّبَكَةِ', px, py - 8);
    for (let i = 0; i < 3; i++) { g.fillStyle = INK; g.fillRect(px + i * 9 * U - 3, py - 3, 8 * U + 6, 3 * U + 6); g.fillStyle = i < B.power ? '#fff' : '#555'; g.fillRect(px + i * 9 * U, py, 8 * U, 3 * U); }
    if (G.phase === 'play') { const k = clamp(G.qLeft / qTime(), 0, 1), tw = W * .5; g.fillStyle = INK; g.fillRect(W * .25 - 3, H * .88 - 3, tw + 6, 16); g.fillStyle = k < .3 ? '#ff5a5a' : '#2ee66b'; g.fillRect(W * .25, H * .88, tw * k, 10); }
    for (const c of G.cards) { const k = popSc(G, c); if (k > .02) drawCard(g, c.o, c.x, c.y, c.r, { ring: c.ring, shape: 'ball', dim: c.dead, sc: k * (c.win ? 1.12 : 1) }); }
  };
  G.start = () => { banner(`مَعْرَكَةُ الزَّعيمِ!<small>${G.st.hint}</small>`, 2800); say('boss').then(() => { if (GAME === G && !G.over) ask(); }); };
  G.speak = () => G.q && G.q.speak();
  return G;
}
async function superAttack(G) {
  G.boss.power = 0; G.paused = true; stopVoice(); G.cards = [];
  const n = G.q && G.q.val >= 1 && G.q.val <= 9 ? G.q.val : ri(1, 9);
  const ok = await traceDigit(n, G.diff);
  if (GAME !== G) return;
  G.paused = false;
  if (ok) {
    const bp = { x: W * .8, y: H * .5 }; SFX.zap(); G.boss.hp--; G.boss.flash = 1; G.shake = 4; fxBurst(G, bp.x, bp.y, 40); fxWord(G, 'بووووم!', bp.x - W * .05, bp.y - H * .1, '#ffd23f', 13);
    G.score += 100; say('hit' + ri(1, 4));
    if (G.boss.hp <= 0) return endGame(G, true);
  }
  setTimeout(() => { if (GAME === G && !G.over) { G.phase = 'wait'; const nx = () => { const q = nextQ(G, false); const r = clamp(Math.min(W, H) * .09, 40, 80); G.cards = q.opts.map((o, i) => ({ o, ok: i === q.ans, x: W * (.34 + i * .17), y: H * .74, r, ring: RING[i + 2], born: G.t + i * .08 })); G.qLeft = 14 - G.diff * 5; G.phase = 'play'; }; nx(); } }, 1100);
}

/* ---------- ٩) اكتب الجواب بالقلم (مهمة القلم بعد الزعيم) ---------- */
function gameWrite(w, s) {
  const G = baseGame(w, s), Ink = window.EliaInk, B = {};
  G.goal = 6; G.progress = () => G.rounds / G.goal; G.phase = 'wait'; G.boxes = []; G.fails = 0; G.guide = false; G.okT = 0; G.shk = 0; G.hint = null;
  let cur = null, penSeen = false, auto = 0;
  const hero = () => ({ x: Math.max(W * .1, heroH() * .34), y: H * .99, h: heroH() * 1.1 });
  function layout() {
    const n = G.boxes.length || 1, bs = clamp(Math.min((H - TOP) * .46, W * .5 / n, 300), 110, 300), gap = bs * .08, tot = n * bs + (n - 1) * gap, cx = W * .58, cy = TOP + (H - TOP) * .43;
    G.boxes.forEach((b, i) => { b.x = cx - tot / 2 + i * (bs + gap); b.y = cy - bs / 2; b.s = bs; b.strokes = []; });
    G.pad = { x: cx - tot / 2 - bs * .13, y: cy - bs / 2 - bs * .13, w: tot + bs * .26, h: bs * 1.26, cx, cy };
    const bh = clamp(H * .1, 54, 84), by = Math.min(H - bh * .7, G.pad.y + G.pad.h + bh * .85), bw = Math.min(bs * .95, W * .22);
    B.clr = { x: cx - bw * .6, y: by, w: bw, h: bh }; B.ok = { x: cx + bw * .6, y: by, w: bw, h: bh };
  }
  G.resize = layout;
  function ask(first) {
    const q = nextQ(G, first); G.boxes = String(q.val).split('').map(d => ({ d: +d, strokes: [] }));
    G.fails = 0; G.guide = false; G.okT = 0; layout(); G.phase = 'play';
  }
  const say2 = (t, ms = 1600) => { G.hint = { t, life: ms / 1000 }; };
  function check() {
    clearTimeout(auto); if (G.phase !== 'play') return;
    if (G.boxes.some(b => !b.strokes.length)) return say2(G.boxes.length > 1 ? 'اُكْتُبْ رَقْماً في كُلِّ مُرَبَّعٍ ✏️' : 'اُكْتُبِ الْجَوابَ في الْمُرَبَّعِ ✏️');
    const ok = !Ink || G.fails >= 5 || G.boxes.every(b => Ink.accepts(b.strokes, b.d, { box: b.s, loose: G.fails > 0 }));   // لا يَعلَق الطفل أبداً
    const P = G.pad;
    if (ok) {
      G.phase = 'wait'; G.okT = 1.5; G.hint = null; G.rounds++; const h = hero(), f = fingerOf(h.x, h.y, h.h); SFX.web(); fxWeb(G, f.x, f.y, P.cx, P.cy);
      const c = scoreHit(G, P.cx, P.cy - P.h * .3, G.q.val); if (!c) goodSay(G, G.q);
      setTimeout(() => { if (GAME !== G || G.over) return; if (G.rounds >= G.goal) endGame(G, true); else ask(false); }, 1700);
    } else {
      G.fails++; G.shk = .45; G.boxes.forEach(b => { b.strokes = []; }); miss(G, P.cx, P.cy - P.h * .3, false);
      if (G.fails >= 3 && !G.guide) { G.guide = true; G.hearts = Math.max(1, G.hearts - 1); say2('اُكْتُبْ فَوْقَ الرَّقْمِ الْمُنَقَّطِ ✏️', 2400); }
      else say2('اُكْتُبْ بِخَطٍّ أَوْضَحَ ✏️');
    }
  }
  G.onDown = (x, y, e) => {
    if (G.t < 3 || G.phase !== 'play') return;
    if (inBtn(B.ok, x, y)) { B.ok.down = .15; SFX.click(); return check(); }
    if (inBtn(B.clr, x, y)) { B.clr.down = .15; SFX.click(); clearTimeout(auto); G.boxes.forEach(b => { b.strokes = []; }); return; }
    if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
    const P = G.pad; if (x < P.x - 20 || x > P.x + P.w + 20 || y < P.y - 20 || y > P.y + P.h + 20) return;
    clearTimeout(auto); cur = [[x, y]]; cur.wd = e.pointerType === 'pen' && e.pressure ? .7 + e.pressure : 1;
  };
  G.onMove = (x, y) => { if (!cur) return; const l = cur[cur.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 1.5) cur.push([x, y]); };
  G.onUp = () => {
    if (!cur) return; const st = cur; cur = null; if (G.phase !== 'play') return;
    const cx = st.reduce((a, p) => a + p[0], 0) / st.length, cy = st.reduce((a, p) => a + p[1], 0) / st.length;
    const b = G.boxes.slice().sort((p, q) => Math.hypot(p.x + p.s / 2 - cx, p.y + p.s / 2 - cy) - Math.hypot(q.x + q.s / 2 - cx, q.y + q.s / 2 - cy))[0];
    b.strokes.push(st);
    if (G.boxes.every(k => k.strokes.length)) auto = setTimeout(check, 1300);
  };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); G.okT = Math.max(0, G.okT - dt); G.shk = Math.max(0, G.shk - dt); hud(G);
    if (G.hint && (G.hint.life -= dt) <= 0) G.hint = null;
    for (const k of ['clr', 'ok']) if (B[k] && B[k].down) B[k].down = Math.max(0, B[k].down - dt);
  };
  const inkLine = (g, st, lw) => { g.lineWidth = lw * (st.wd || 1); g.beginPath(); g.moveTo(st[0][0], st[0][1]); if (st.length === 1) g.lineTo(st[0][0] + .1, st[0][1]); for (let i = 1; i < st.length; i++) g.lineTo(st[i][0], st[i][1]); g.stroke(); };
  G.draw = g => {
    drawBg(g, G.bg, null, .3); const h = hero(); drawSprite(g, IMG.hero, h.x, h.y, h.h, { sx: 1 + (G.pop || 0) * .08, sy: 1 + (G.pop || 0) * .08 });
    if (!G.pad) return; const P = G.pad;
    g.save(); if (G.shk > 0) g.translate(Math.sin(G.shk * 60) * 1.4 * U, 0);
    g.fillStyle = INK; rr(g, P.x + 8, P.y + 8, P.w, P.h, 20); g.fill();                         // الورقة
    g.fillStyle = '#fffdf4'; rr(g, P.x, P.y, P.w, P.h, 20); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    for (const b of G.boxes) {
      g.fillStyle = '#fff'; rr(g, b.x, b.y, b.s, b.s, 16); g.fill(); g.setLineDash([12, 9]); g.lineWidth = 3.5; g.strokeStyle = BLUE; g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(31,111,229,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x + b.s * .1, b.y + b.s * .82); g.lineTo(b.x + b.s * .9, b.y + b.s * .82); g.stroke();
      g.font = `800 ${b.s * 1.45}px ${AR_FONT}`;
      if (G.okT > 0) { g.fillStyle = '#1fa84a'; g.lineWidth = 6; g.strokeStyle = INK; cText(g, AD(b.d), b.x + b.s / 2, b.y + b.s / 2, true); continue; }
      if (G.guide) { g.fillStyle = 'rgba(20,20,20,.07)'; g.setLineDash([7, 8]); g.lineWidth = 3; g.strokeStyle = '#9a9a9a'; cText(g, AD(b.d), b.x + b.s / 2, b.y + b.s / 2, true); g.setLineDash([]); }
      g.strokeStyle = '#1b3aa8'; g.lineCap = g.lineJoin = 'round'; for (const st of b.strokes) inkLine(g, st, b.s * .05);
    }
    if (cur) { g.strokeStyle = '#1b3aa8'; g.lineCap = g.lineJoin = 'round'; inkLine(g, cur, (G.boxes[0] ? G.boxes[0].s : 200) * .05); }
    g.restore();
    if (G.phase === 'play' && G.t >= 3) { drawBtn(g, B.clr, '↺ اِمْسَحْ'); drawBtn(g, B.ok, '✓ تَمَّ', '#2ee66b'); }
    if (G.hint) { g.save(); g.globalAlpha = Math.min(1, G.hint.life * 3); g.font = `800 ${Math.max(22, 4.4 * U)}px ${AR_FONT}`; g.lineWidth = 7; g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = '#ffd23f'; cText(g, G.hint.t, P.cx, Math.max(TOP + 3.4 * U, P.y - 3.2 * U), true); g.restore(); }
  };
  G.start = () => { ask(true); startMsg(G, () => G.q.speak()); };
  G.speak = () => G.q && G.q.speak();
  return G;
}

/* ================= الكتابة بالقلم (الضربة الخارقة) ================= */
function traceDigit(n, diff) {
  return new Promise(res => {
    const ov = $('#trace-ov'), box = $('#trace-box'), [bgc, ink] = box.querySelectorAll('canvas');
    ov.classList.add('on'); $('#trace-n').textContent = AD(n); chain(S_('super'), N_(n));
    const tol = 44 - 14 * diff, need = .6 + .12 * diff, pen = 16, glyph = AD(n), FONT = `800 ${'{F}'}px ${AR_FONT}`;
    let Wd, Ht, samples = [], covered = new Uint8Array(0), mask = null, nPts = 0, outside = 0, penSeen = false, done = false, drawing = false, last;
    requestAnimationFrame(() => (document.fonts ? document.fonts.load(`800 100px "Sakkal Saad"`) : Promise.resolve()).then(setup));
    function setup() {
      const dpr = Math.min(2, devicePixelRatio || 1); Wd = box.clientWidth; Ht = box.clientHeight;
      [bgc, ink].forEach(c => { c.width = Wd * dpr; c.height = Ht * dpr; c.style.width = Wd + 'px'; c.style.height = Ht + 'px'; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
      const g = bgc.getContext('2d'); g.clearRect(0, 0, Wd, Ht); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.font = FONT.replace('{F}', 100); const m0 = g.measureText(glyph), gh = (m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent) || 60, gw = m0.width || 50;
      const F = 100 * Math.min(Ht * .78 / gh, Wd * .8 / gw); g.font = FONT.replace('{F}', F); const m = g.measureText(glyph);
      const y = Ht / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      g.fillStyle = '#ffe3e5'; g.fillText(glyph, Wd / 2, y); g.setLineDash([7, 7]); g.lineWidth = 4; g.strokeStyle = INK; g.strokeText(glyph, Wd / 2, y); g.setLineDash([]);
      const mc = document.createElement('canvas'); mc.width = Wd; mc.height = Ht; const mx = mc.getContext('2d'); mx.textAlign = 'center'; mx.textBaseline = 'alphabetic'; mx.font = g.font; mx.fillText(glyph, Wd / 2, y);
      const inner = mx.getImageData(0, 0, Wd, Ht).data; samples = [];
      for (let yy = 0; yy < Ht; yy += 5) for (let xx = 0; xx < Wd; xx += 5) if (inner[(yy * Wd + xx) * 4 + 3] > 128) samples.push([xx, yy]);
      covered = new Uint8Array(samples.length); mx.lineWidth = tol; mx.lineJoin = 'round'; mx.strokeText(glyph, Wd / 2, y); mask = mx.getImageData(0, 0, Wd, Ht).data;
      ink.getContext('2d').clearRect(0, 0, Wd, Ht); nPts = outside = 0;
    }
    const P = e => { const r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const R2 = (pen / 2 + 9) ** 2;
    const mark = ([x, y]) => { nPts++; if (!(x >= 0 && y >= 0 && x < Wd && y < Ht && mask && mask[((y | 0) * Wd + (x | 0)) * 4 + 3] > 0)) outside++; for (let i = 0; i < samples.length; i++) if (!covered[i]) { const dx = samples[i][0] - x, dy = samples[i][1] - y; if (dx * dx + dy * dy < R2) covered[i] = 1; } };
    const score = () => { const cov = covered.reduce((a, b) => a + b, 0) / (samples.length || 1); const out = outside / (nPts || 1); return { cov, out, pass: cov >= need && out <= .3 }; };
    const finish = r => { if (done) return; done = true; ov.classList.remove('on'); ink.onpointerdown = ink.onpointermove = ink.onpointerup = ink.onpointercancel = null; res(r); };
    ink.onpointerdown = e => { if (done) return; if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return; e.preventDefault(); try { ink.setPointerCapture(e.pointerId); } catch (er) {} drawing = true; last = P(e); mark(last); };
    ink.onpointermove = e => { if (!drawing) return; e.preventDefault(); const x = ink.getContext('2d'); x.strokeStyle = RED; x.lineWidth = pen; x.lineCap = x.lineJoin = 'round'; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; (evs.length ? evs : [e]).forEach(ev => { const p = P(ev); x.beginPath(); x.moveTo(last[0], last[1]); x.lineTo(p[0], p[1]); x.stroke(); last = p; mark(p); }); };
    ink.onpointerup = ink.onpointercancel = () => { if (!drawing) return; drawing = false; if (score().pass) { SFX.pow(); setTimeout(() => finish(true), 250); } };
    $('#trace-clear').onclick = () => { SFX.click(); setup(); };
    $('#trace-ok').onclick = () => { const s = score(); if (s.pass) return finish(true); SFX.bad(); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); toast(nPts && s.out > .3 ? 'اُكْتُبْ فَوْقَ الرَّقْمِ تَماماً ✏️' : 'أَكْمِلْ كِتابَةَ الرَّقْمِ كُلِّهِ ✏️'); setup(); };
    if (TEST) box._win = () => finish(true);
  });
}

/* ================= تشغيل مهمة ================= */
const MAKERS = { swing: gameSwing, hunt: gameHunt, lasso: gameLasso, train: gameTrain, balance: gameBalance, clock: gameClock, hop: gameHop, boss: gameBoss, write: gameWrite };
function startStage(w, s) {
  stopVoice(); S.world = w; save(); if (GAME) GAME.over = true; GAME = null;
  show('game'); $('#combo').className = 'combo'; $('#banner').className = 'banner'; $('#trace-ov').classList.remove('on');
  const begin = () => {
    resize(); GAME = MAKERS[MIS[w][s].g](w, s); hud(GAME); GAME.start(); MUSIC && MUSIC.start(MIS[w][s].boss ? 'battle' : 'action');
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
  };
  TEST ? begin() : requestAnimationFrame(begin);
}
const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => { if (!GAME || GAME.paused || GAME.over) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} GAME.onDown && GAME.onDown(...pos(e), e); });
cv.addEventListener('pointermove', e => { if (!GAME || GAME.paused || GAME.over) return; if (e.pointerType === 'mouse' && !e.buttons) return; GAME.onMove && GAME.onMove(...pos(e), e); });
cv.addEventListener('pointerup', e => { GAME && GAME.onUp && GAME.onUp(...pos(e), e); });
cv.addEventListener('pointercancel', e => { GAME && GAME.onUp && GAME.onUp(...pos(e), e); });
$('#target').onclick = () => { if (!GAME) return; SFX.click(); GAME.speak && GAME.speak(); };
$('#g-exit').onclick = async () => { const G = GAME; if (!G) return; SFX.click(); G.paused = true; if (await confirmBox('تَخْرُجُ مِنَ الْمُهِمَّةِ؟')) { G.over = true; if (GAME === G) GAME = null; stopVoice(); MUSIC && MUSIC.stop(); openWorlds(S.world); } else G.paused = false; };

async function endGame(G, win) {
  if (G.over) return; G.over = true; stopVoice(); MUSIC && MUSIC.stop(); $('#combo').classList.remove('on');
  let stars = 0;
  if (win) { if (G.timeLeft != null) { const r = G.hits / G.goal; stars = r >= 1 ? 3 : r >= .65 ? 2 : 1; } else stars = Math.max(1, G.hearts); }
  const timeUp = G.timeLeft != null && G.timeLeft <= 0;
  banner(win ? (timeUp ? 'اِنْتَهى الْوَقْتُ!' : 'نَجَحَتِ الْمُهِمَّةُ!') : 'أوه!', 1600);
  say(win ? (timeUp ? 'timeUp' : G.st.final ? 'final' : 'mission') : 'lost');
  await sleep(win && G.st.final ? 4200 : 2000);
  if (GAME !== G) return;
  GAME = null;
  const k = sk(G.w, G.s), prevStars = starsOf(G.w, G.s), prevBest = S.best[k] || 0;
  const record = win && G.score > prevBest && prevBest > 0;
  if (win) { S.done[k] = Math.max(prevStars, stars); S.best[k] = Math.max(prevBest, G.score); }
  S.gems += Math.round(G.score / 10);
  const newCards = [];
  if (win) [...G.got].forEach(n => { const had = S.cards[n] || 0, lv = stars === 3 ? 2 : 1; if (lv > had) { S.cards[n] = lv; newCards.push({ n, gold: lv === 2 }); } });
  save();
  if (win && stars === 3) await celebrate(pick(['siuuu', 'hero', 'genius', 'smart']));
  showResult(G, win, stars, record, newCards);
}

/* ================= النتيجة ================= */
const CARD_EMO = ['🫙', '🕷️', '🕸️', '🎈', '🍎', '⭐', '🚗', '🐤', '🍓', '🦋', '⚽', '🐟', '🧁'];
function numCard(n, lv, extra = '') {
  return lv ? `<div class="ncard got ${lv === 2 ? 'gold' : ''}" style="${extra}"><span class="d">${AD(n)}</span><span class="w">${window.NUM_AR[n]}</span><span class="dots">${n ? CARD_EMO[n].repeat(Math.min(n, 12)) : ''}</span></div>`
    : `<div class="ncard"><span class="q">؟</span></div>`;
}
function showResult(G, win, stars, record, newCards) {
  const c = $('#res-card'); show('result');
  const nextS = G.s + 1 < NM ? [G.w, G.s + 1] : G.w < WORLDS.length ? [G.w + 1, 0] : null;
  c.innerHTML = `<h2 class="${win ? '' : 'fail'}">${win ? (stars === 3 ? 'رَهيبٌ!' : 'أَحْسَنْتَ!') : 'حاوِلْ مَرَّةً ثانِيَةً!'}</h2>
    <div class="big-stars">${[1, 2, 3].map((k, i) => `<i class="${k <= stars ? 'on' : ''}" style="animation-delay:${.2 + i * .25}s">★</i>`).join('')}</div>
    <div class="pts">${AD(G.score)}<small>${record ? '🏆 رَقْمٌ قِياسِيٌّ جَديدٌ!' : 'أَفْضَلُ نَتيجَةٍ: ' + AD(Math.max(G.score, S.best[sk(G.w, G.s)] || 0))}${G.bestCombo >= 5 ? ' · 🔥 x' + AD(G.bestCombo) : ''}</small></div>
    ${newCards.length ? `<p>🃏 بِطاقاتُ أَرْقامٍ جَديدَةٌ!</p><div class="new-cards">${newCards.map((n, i) => numCard(n.n, n.gold ? 2 : 1, `animation-delay:${.4 + i * .12}s`).replace('class="ncard', 'class="ncard fly')).join('')}</div>` : `<img class="hero" src="img/hero.webp?v=1" alt="">`}
    ${!win ? '<p>لا بَأْسَ يا بَطَلُ! سبايدر مان يَقولُ: حاوِلْ مَرَّةً ثانِيَةً 💪</p>' : stars < 3 ? '<p><small>اِجْمَعْ ٣ نُجومٍ لِتَصيرَ بِطاقاتُكَ ذَهَبِيَّةً ✨</small></p>' : ''}${win && G.st.final ? '<p>🏆 أَنْهَيْتَ كِتابَ الرِّياضِيّاتِ كُلَّهُ يا بَطَلَ الْأَرْقامِ!</p>' : ''}`;
  const row = el('div', 'row');
  const again = el('button', 'cbtn', '↻ مَرَّةً ثانِيَةً'); again.onclick = () => { SFX.click(); startStage(G.w, G.s); };
  const map = el('button', 'cbtn', '🗺️ الْمُهِمّاتُ'); map.onclick = () => { SFX.click(); openWorlds(nextS && win ? nextS[0] : G.w); };
  row.append(again, map);
  if (win && nextS) { const nx = el('button', 'cbtn go pulse', 'التّالِيَةُ ◀'); nx.onclick = () => { SFX.click(); startStage(nextS[0], nextS[1]); }; row.appendChild(nx); }
  c.appendChild(row);
  if (newCards.length) setTimeout(() => say('card'), 700); else if (record) say('record'); else if (!win) playClip('tryagain');
}

/* ================= الشاشات ================= */
const ICONS = { swing: '🕸️', hunt: '🎯', lasso: '✏️', train: '🚂', balance: '⚖️', clock: '🕒', hop: '🏢', boss: '🤖', write: '📝' };
function stats() { return `<span class="chip">⭐ ${AD(totalStars())}/${AD(WORLDS.length * NM * 3)}</span><span class="chip">🃏 ${AD(Object.keys(S.cards).length)}/١٣</span><span class="chip">💎 ${AD(S.gems)}</span>`; }
function openHome() { stopVoice(); $('#home-stats').innerHTML = stats(); show('home'); }
$('#play').onclick = () => { SFX.click(); ac(); say('hello'); openWorlds(S.world || 1); };
$('#h-cards').onclick = () => { SFX.click(); openCards('home'); };
$('#w-home').onclick = () => { SFX.click(); openHome(); };
if (MUSIC) { $('#w-music').onclick = () => { SFX.click(); MUSIC.toggle(); }; MUSIC.onChange(on => $('#w-music').classList.toggle('off', !on)); } else $('#w-music').remove();
document.querySelectorAll('.spidey-slot').forEach(e => { e.innerHTML = MASK; e.classList.add('spidey'); });

let curW = 1;
function openWorlds(w) {
  curW = w = w || 1; S.world = w; save(); show('worlds');
  $('#w-stats').innerHTML = `<span class="chip">⭐ ${AD(totalStars())}</span><button class="chip" id="w-cards">🃏 ${AD(Object.keys(S.cards).length)}</button>`;
  $('#w-cards').onclick = () => { SFX.click(); openCards('worlds'); };
  const tabs = $('#world-tabs'); tabs.innerHTML = '';
  WORLDS.forEach(Wd => {
    const open = unlocked(Wd.id, 0);
    const t = el('button', 'wtab' + (Wd.id === w ? ' on' : '') + (open ? '' : ' lock'), `<b>${AD(Wd.id)}. ${Wd.title}</b><small>${Wd.unit}</small>`);
    t.style.setProperty('--wc', Wd.color);
    t.onclick = () => { SFX.click(); if (!open) return toast('🔒 اِهْزِمِ الرّوبوتَ في الْعالَمِ الَّذي قَبْلَهُ'); openWorlds(Wd.id); };
    tabs.appendChild(t);
  });
  $('#w-sub').textContent = WORLDS[w - 1].sub;
  const box = $('#missions'); box.innerHTML = '';
  const Wd = WORLDS[w - 1]; let nextMarked = false;
  MIS[w].forEach((st, s) => {
    const open = unlocked(w, s), stars = starsOf(w, s), best = S.best[sk(w, s)];
    const isNext = open && !stars && !nextMarked; if (isNext) nextMarked = true;
    const m = el('button', 'mission' + (st.boss ? ' boss' : '') + (st.pen ? ' pen' : '') + (open ? '' : ' lock') + (isNext ? ' next' : ''));
    m.style.backgroundImage = `url(img/bg_${Wd.bg}.webp?v=1)`;
    m.innerHTML = `<span class="num">${AD(s + 1)}</span><span class="ico">${st.boss ? '<img src="img/boss.webp?v=1">' : st.g === 'swing' ? '<img src="img/hero.webp?v=1">' : ICONS[st.g]}</span>${best ? `<span class="best">🏆 ${AD(best)}</span>` : ''}
      <div class="cap"><b>${st.name}</b><span class="pg">📖 ص ${st.p}</span><span class="stars">${[1, 2, 3].map(k => `<i class="${k <= stars ? 'on' : ''}">★</i>`).join('')}</span></div>`;
    m.style.setProperty('--i', s);
    m.onclick = () => { SFX.click(); if (!open) return toast('🔒 أَنْهِ الْمُهِمَّةَ الَّتي قَبْلَها'); startStage(w, s); };
    box.appendChild(m);
  });
}
let cardsBack = 'home';
function openCards(from) {
  cardsBack = from; show('cards'); const grid = $('#cards-wrap'); grid.innerHTML = '';
  $('#c-count').textContent = `${AD(Object.keys(S.cards).length)} / ١٣`;
  const g = el('div', 'cgrid');
  for (let n = 0; n <= 12; n++) {
    const lv = S.cards[n] || 0, d = el('div'); d.innerHTML = numCard(n, lv); const cd = d.firstChild;
    cd.onclick = () => { if (!lv) { SFX.bad(); return toast('اِجْمَعْها بِالْإِجابَةِ الصَّحيحَةِ في الْمُهِمّاتِ 🃏'); } SFX.pop(); cd.classList.remove('wig'); void cd.offsetWidth; cd.classList.add('wig'); num(n); };
    g.appendChild(cd);
  }
  grid.appendChild(g);
}
$('#c-back').onclick = () => { SFX.click(); cardsBack === 'home' ? openHome() : openWorlds(curW); };

openHome();
/* تقدّم أحدث جاء من السحابة */
CLOUD && CLOUD.on(KEY, st => {
  if (!st) return; S = Object.assign({ done: {}, best: {}, gems: 0, cards: {}, world: 1 }, st);
  if ($('#home').classList.contains('on')) $('#home-stats').innerHTML = stats();
  else if ($('#worlds').classList.contains('on')) openWorlds(curW);
});
if (TEST && /open=(\w+)/.test(location.search)) { const k = location.search.match(/open=(\w+)/)[1]; if (k === 'stage') startStage(+(location.search.match(/w=(\d)/) || [0, 1])[1], +(location.search.match(/s=(\d)/) || [0, 0])[1]); if (k === 'worlds') openWorlds(+(location.search.match(/w=(\d)/) || [0, 1])[1]); if (k === 'cards') { S.cards = { 0: 1, 3: 2, 5: 1, 7: 1 }; openCards('home'); } if (k === 'result') showResult({ w: 1, s: 0, score: 230, bestCombo: 6, st: MIS[1][0] }, true, 3, true, [{ n: 3, gold: true }, { n: 5, gold: false }]); }
if (TEST) window.__game = { get G() { return GAME; }, startStage, S, save, openWorlds, makeQ, traceDigit, W: () => [W, H],
  tick(sec) { for (let i = 0; i < sec * 20 && GAME; i++) { if (!GAME.paused) GAME.update(.05); drawFx(ctx, GAME, .05); } if (GAME) { ctx.save(); GAME.draw(ctx); drawFx(ctx, GAME, 0); ctx.restore(); } return GAME && GAME.t; },
  tap(x, y) { const r = cv.getBoundingClientRect(), o = { clientX: r.left + x, clientY: r.top + y, pointerType: 'pen', buttons: 1, bubbles: true, pointerId: 1 }; cv.dispatchEvent(new PointerEvent('pointerdown', o)); cv.dispatchEvent(new PointerEvent('pointerup', o)); },
  drag(pts) { const r = cv.getBoundingClientRect(), ev = (t, [x, y]) => cv.dispatchEvent(new PointerEvent(t, { clientX: r.left + x, clientY: r.top + y, pointerType: 'pen', buttons: 1, bubbles: true, pointerId: 1 }));
    ev('pointerdown', pts[0]); pts.slice(1).forEach(p => ev('pointermove', p)); ev('pointerup', pts[pts.length - 1]); } };
})();
