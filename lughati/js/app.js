'use strict';
/* لغتي مع أستاذ أحمد — المحرّك. البيانات في data.js (LETTERS, WORDS, TXT) مولَّدة من _build/lughati/build_data.py */
const V = 2;   // يُرفع عند تغيير ملفات الصوت لكسر الكاش
const TEST = location.hash.includes('test') || location.search.includes('test');

// ------------------------------------------------------------ أدوات
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
function h(tag, a, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(a || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = a => [...new Set(a)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const LK = L => 'L' + pad2(L.id);
const COLORS = ['#E8366A', '#F2682A', '#FFB020', '#3FB45F', '#1FA8C9', '#56C3F0', '#7B5BD6', '#D94BB6'];
const SHADE = c => `color-mix(in srgb, ${c} 70%, #000)`;
const colorOf = L => COLORS[(L.id - 1) % COLORS.length];

// ------------------------------------------------------------ العربية
const MARK = /[ً-ْٰ]/;
const NJ = 'اأإآدذرزوؤةءى';
const nrm = c => ('أإآ'.includes(c) ? 'أ' : c);
function units(d) { const u = []; for (const c of d) { if (c === 'ـ') continue; if (MARK.test(c) && u.length) u[u.length - 1].t += c; else u.push({ c, t: c }); } return u; }
const plainOf = d => units(d).map(x => x.c).join('');
const findIdx = (d, b) => units(d).findIndex(x => nrm(x.c) === b);
function posAt(d, i) { const n = units(d).length; return i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'; }
function shapeAt(d, i) {
  const u = units(d).map(x => x.c);
  const prev = i > 0 && !NJ.includes(u[i - 1]);
  const left = !NJ.includes(u[i]) && i < u.length - 1;
  return prev ? (left ? 'med' : 'fin') : (left ? 'ini' : 'iso');
}
const glyph = (c, s) => (s === 'iso' ? c : s === 'ini' ? c + 'ـ' : s === 'med' ? 'ـ' + c + 'ـ' : 'ـ' + c);
const POSN = { start: 'أوّل الكلمة', middle: 'وسط الكلمة', end: 'آخر الكلمة' };
const POSS = { start: 'أوّل', middle: 'وسط', end: 'آخر' };
const SHP = { iso: 'alone', ini: 'start', med: 'middle', fin: 'end' };
// الحرف المعروض في مكانه بلونٍ مختلف، مع ZWJ ليبقى الاتصال
function split(d, b) {
  const u = units(d), i = u.findIndex(x => nrm(x.c) === b);
  if (i < 0) return null;
  const zl = i > 0 && !NJ.includes(u[i - 1].c) ? '‍' : '';
  const zr = i < u.length - 1 && !NJ.includes(u[i].c) ? '‍' : '';
  return { pre: u.slice(0, i).map(x => x.t).join(''), mid: u[i].t, post: u.slice(i + 1).map(x => x.t).join(''), zl, zr, i };
}
function hl(d, b) { const s = split(d, b); return s ? `${esc(s.pre)}${s.zl}<span class="hl">${s.zl}${esc(s.mid)}${s.zr}</span>${s.zr}${esc(s.post)}` : esc(d); }

// ------------------------------------------------------------ الكلمات
const W = id => WORDS[id];
const hasImg = id => !!WORDS[id].img;
const imgOf = id => `img/w/${WORDS[id].img}.webp`;
const containsB = (id, b) => units(WORDS[id].d).some(x => nrm(x.c) === b);
const ALLPICS = Object.keys(WORDS).filter(hasImg);
const ALLTXT = Object.keys(WORDS);
function otherPics(L, n, avoid = []) { return shuffle(ALLPICS.filter(id => !containsB(id, L.b) && !avoid.includes(id))).slice(0, n); }
function singles(L, withImg) { return withImg ? [...L.pics.start, ...L.pics.middle, ...L.pics.end] : [...L.txt.start, ...L.txt.middle, ...L.txt.end]; }
function allSingles(L) { return [...singles(L, true), ...singles(L, false)]; }
function wordsByShape(L, ids) { const m = { iso: [], ini: [], med: [], fin: [] }; for (const id of ids) { const i = findIdx(W(id).d, L.b); if (i >= 0) m[shapeAt(W(id).d, i)].push(id); } return m; }
const SIM = { 'أ': 'لك', 'ب': 'تثني', 'ت': 'بثن', 'ث': 'تبن', 'ج': 'حخ', 'ح': 'جخ', 'خ': 'حج', 'د': 'ذر', 'ذ': 'دز', 'ر': 'زو', 'ز': 'رذ', 'س': 'شص', 'ش': 'سص', 'ص': 'ضس', 'ض': 'صط', 'ط': 'ظض', 'ظ': 'طض', 'ع': 'غه', 'غ': 'عف', 'ف': 'قغ', 'ق': 'فك', 'ك': 'لق', 'ل': 'كن', 'م': 'نه', 'ن': 'بت', 'ه': 'مع', 'و': 'رز', 'ي': 'بن' };
const Lof = b => LETTERS.find(x => x.b === b);
const isNJ = L => NJ.includes(L.b);

// ------------------------------------------------------------ الصوت
const AU = (() => {
  const el = new Audio(); el.preload = 'auto';
  let tok = 0, muted = false;
  try { muted = localStorage.getItem('lughati-mute') === '1'; } catch (e) {}
  const url = k => `audio/${k}.mp3?v=${V}`;
  function one(k, my) {
    return new Promise(res => {
      let t = setTimeout(res, 12000);
      const fin = () => { clearTimeout(t); res(); };
      el.onended = fin; el.onerror = fin;
      el.src = url(k); const p = el.play(); if (p) p.catch(fin);
    });
  }
  async function play(keys) {
    const my = ++tok; keys = [].concat(keys).filter(k => k != null);
    for (const k of keys) {
      if (my !== tok) return false;
      if (typeof k === 'number') { await sleep(k); continue; }
      if (muted) continue;
      await one(k, my);
    }
    return my === tok;
  }
  return { play, stop() { tok++; el.pause(); }, get muted() { return muted; }, set muted(v) { muted = v; try { localStorage.setItem('lughati-mute', v ? '1' : '0'); } catch (e) {} if (v) el.pause(); } };
})();

const SFX = (() => {
  let ac;
  const C = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
  function tone(f, d, type = 'sine', v = 0.18, slide = 0, at = 0) {
    try {
      const a = C(), t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.05);
    } catch (e) {}
  }
  function noise(d, f1, f2, v = 0.2, q = 1) {
    try {
      const a = C(), t = a.currentTime, n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(bp).connect(g).connect(a.destination); s.start(t);
    } catch (e) {}
  }
  return {
    unlock: () => C(),
    pop: () => tone(520, 0.09, 'sine', 0.22, 380),
    ding: () => { tone(880, 0.14, 'triangle', 0.16); tone(1318, 0.22, 'triangle', 0.14, 0, 0.09); },
    buzz: () => tone(150, 0.25, 'sawtooth', 0.08, -50),
    whoosh: () => noise(0.5, 600, 3200, 0.18, 0.8),
    crowd: () => { noise(1.6, 900, 1300, 0.22, 0.4); tone(523, 0.2, 'square', 0.04, 0, 0.1); tone(659, 0.2, 'square', 0.04, 0, 0.25); tone(784, 0.35, 'square', 0.04, 0, 0.4); },
    crack: () => { noise(0.18, 2400, 900, 0.3, 1.5); tone(90, 0.12, 'square', 0.08, -30); },
    splash: () => noise(0.45, 1800, 500, 0.22, 0.7),
    toot: () => { tone(392, 0.3, 'square', 0.06); tone(494, 0.4, 'square', 0.06, 0, 0.18); },
    kick: () => { tone(120, 0.1, 'sine', 0.3, -60); noise(0.1, 1500, 600, 0.15); },
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, 0, i * 0.11)),
  };
})();

// ------------------------------------------------------------ التقدّم
const ST = (() => {
  const K = 'lughati-v1'; let d = {};
  try { d = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} };
  return {
    get: (lk, g) => (d[lk] && d[lk][g]) || 0,
    set(lk, g, s) { d[lk] = d[lk] || {}; if (s > (d[lk][g] || 0)) { d[lk][g] = s; save(); } },
    letter(lk) { const o = d[lk] || {}; const v = Object.values(o); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / Math.max(v.length, 1)) : 0; },
    count(lk) { return Object.keys(d[lk] || {}).length; },
  };
})();

// ------------------------------------------------------------ الأستاذ
const POSES = ['hello', 'thumbs', 'clap', 'point', 'think', 'pencil', 'book', 'cheer', 'ear', 'hint', 'ball', 'trophy', 'magnify', 'paint', 'wow', 'star'];
const GOODP = ['thumbs', 'clap', 'cheer', 'wow', 'star', 'thumbs', 'clap'];
const TEACH = (() => {
  const box = $('#teacher'), img = $('#t-img'), bub = $('#t-bubble'); let bt;
  POSES.forEach(p => { const i = new Image(); i.src = `img/t/${p}.webp`; });
  return {
    show(on) { box.hidden = !on; },
    pose(p, mirror = p === 'point') {
      const src = `img/t/${p}.webp`;
      if (!img.src.endsWith(src)) img.src = src;
      img.classList.toggle('mirror', mirror);
      img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop');
    },
    say(text, ms = 0) {
      clearTimeout(bt); bub.textContent = text || ''; bub.classList.toggle('on', !!text);
      if (ms) bt = setTimeout(() => bub.classList.remove('on'), ms);
    },
    onTap(fn) { img.onclick = fn; },
  };
})();

// بديلٌ إن غابت صورة شخصية: رمزٌ تعبيري مرسوم في SVG
const EMO = { fish1: '🐠', fish2: '🐟', fish3: '🐡', puffer: '🐡', octopus: '🐙', turtle: '🐢', crab: '🦀', shark: '🦈', car_red: '🏎️', car_blue: '🚙', car_yellow: '🚕', car_green: '🚜', train: '🚂', ball: '⚽', goal: '🥅', trophy: '🏆', lion: '🦁', elephant: '🐘', monkey: '🐒', giraffe: '🦒', panda: '🐼', balloon: '🎈', net: '🪣', apple: '🍎', steve: '⛏️', creeper: '🟩', pig: '🐷', grass: '🟫' };
document.addEventListener('error', e => {
  const im = e.target; if (im.tagName !== 'IMG' || im.dataset.fb) return;
  const m = (im.getAttribute('src') || '').match(/img\/(c|f)\/([\w]+)\.webp/); if (!m) return;
  const em = EMO[m[2]] || (m[1] === 'f' ? '⚽' : m[2].startsWith('spidey') ? '🕷️' : '⭐');
  im.dataset.fb = 1; im.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="58" font-size="80" text-anchor="middle" dominant-baseline="middle">${em}</text></svg>`);
}, true);

// ------------------------------------------------------------ مؤثرات
function burst(el, n = 18) {
  const r = el.getBoundingClientRect(), fx = $('#fx');
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, dist = 70 + Math.random() * 90;
    const s = h('i', { class: 'spark', style: { left: cx + 'px', top: cy + 'px', background: rnd(COLORS), borderRadius: Math.random() < 0.5 ? '50%' : '3px' } });
    s.style.setProperty('--x', Math.cos(a) * dist + 'px'); s.style.setProperty('--y', Math.sin(a) * dist + 'px');
    fx.append(s); setTimeout(() => s.remove(), 1000);
  }
}
function shakeEl(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function enter(els, step = 70) { els.forEach((e, i) => { e.style.animationDelay = i * step + 'ms'; e.classList.add('enter'); }); }

// سحبٌ أو نقرتان: عنصرٌ يُختار ثم هدف
function dnd(items, targets, onDrop) {
  let sel = null;
  const clearSel = () => { if (sel) sel.classList.remove('sel'); sel = null; };
  const hit = (x, y) => targets().find(t => { const r = t.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
  targets().forEach(t => t.addEventListener('click', () => { if (sel) { const s = sel; clearSel(); onDrop(s, t); } }));
  items.forEach(it => {
    let sx, sy, moved = false, id = null;
    it.addEventListener('pointerdown', e => {
      if (it.classList.contains('used')) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
      it.setPointerCapture(id); SFX.unlock();
    });
    it.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 10) { moved = true; it.classList.add('dragging'); clearSel(); }
      if (moved) { it.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`; targets().forEach(t => t.classList.toggle('over', t === hit(e.clientX, e.clientY))); }
    });
    const up = e => {
      if (e.pointerId !== id) return; id = null;
      targets().forEach(t => t.classList.remove('over'));
      if (moved) {
        it.classList.remove('dragging'); it.style.transform = '';
        const t = hit(e.clientX, e.clientY); if (t) onDrop(it, t);
      } else {
        if (sel === it) clearSel(); else { clearSel(); sel = it; it.classList.add('sel'); SFX.pop(); }
      }
    };
    it.addEventListener('pointerup', up); it.addEventListener('pointercancel', up);
  });
  return { drop: onDrop };
}

// ------------------------------------------------------------ لوح الكتابة
const FONT = px => `800 ${px}px Sakkal`;
function inkBox(text, px, W, H) {
  const c = document.createElement('canvas').getContext('2d'); c.font = FONT(px);
  const m = c.measureText(text);
  const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent, l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
  return { x: W / 2 + (l - r) / 2, y: (H - (asc + desc)) / 2 + asc };
}
function grid(W, H, draw, G = 72) {
  const sc = G / Math.max(W, H), gw = Math.max(8, Math.round(W * sc)), gh = Math.max(8, Math.round(H * sc));
  const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
  const c = cv.getContext('2d'); c.scale(sc, sc); draw(c);
  const a = c.getImageData(0, 0, gw, gh).data, m = new Uint8Array(gw * gh);
  for (let i = 0; i < m.length; i++) m[i] = a[i * 4 + 3] > 60 ? 1 : 0;
  return { m, gw, gh, sc };
}
function dilate(g, k) {
  const { m, gw, gh } = g, o = new Uint8Array(m.length);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    if (!m[y * gw + x]) continue;
    for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < gw && Y < gh) o[Y * gw + X] = 1; }
  }
  return { ...g, m: o };
}
function comps(g) {
  const { m, gw, gh } = g, lab = new Int32Array(m.length), out = []; let n = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || lab[i]) continue; n++; const st = [i], cells = []; lab[i] = n;
    while (st.length) { const j = st.pop(); cells.push(j); const x = j % gw, y = (j / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; const k = Y * gw + X; if (m[k] && !lab[k]) { lab[k] = n; st.push(k); } } }
    out.push(cells);
  }
  return out;
}
function scoreInk(strokes, text, px, W, H, brush, normalize, lenient) {
  const pos = inkBox(text, px, W, H);
  const N = 96;
  const G = grid(W, H, c => { c.font = FONT(px); c.textAlign = 'center'; c.fillText(text, W / 2, pos.y); }, N);
  // نقاط الحبر، مع تطبيعٍ إلى صندوق الحرف عند الكتابة الحرّة
  let S = strokes;
  const len = S.reduce((a, s) => a + s.reduce((b, p, i) => b + (i ? Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0), 0);
  if (len < 25 && S.flat().length < 12) return { pass: false, why: 'empty' };
  if (normalize) {
    let gx0 = 1e9, gy0 = 1e9, gx1 = -1e9, gy1 = -1e9;
    for (let i = 0; i < G.m.length; i++) if (G.m[i]) { const x = i % G.gw, y = (i / G.gw) | 0; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); }
    [gx0, gx1, gy0, gy1] = [gx0 / G.sc, (gx1 + 1) / G.sc, gy0 / G.sc, (gy1 + 1) / G.sc];
    let ix0 = 1e9, iy0 = 1e9, ix1 = -1e9, iy1 = -1e9;
    S.flat().forEach(([x, y]) => { ix0 = Math.min(ix0, x); ix1 = Math.max(ix1, x); iy0 = Math.min(iy0, y); iy1 = Math.max(iy1, y); });
    const iw = Math.max(ix1 - ix0, 20), ih = Math.max(iy1 - iy0, 20), gw = gx1 - gx0, gh = gy1 - gy0;
    let sx = gw / iw, sy = gh / ih; const r = sy / sx; if (r > 1.8) sy = sx * 1.8; if (r < 0.55) sy = sx * 0.55;
    const cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2, gcx = (gx0 + gx1) / 2, gcy = (gy0 + gy1) / 2;
    S = S.map(s => s.map(([x, y]) => [gcx + (x - cx) * sx, gcy + (y - cy) * sy]));
  }
  const I = grid(W, H, c => { c.lineCap = c.lineJoin = 'round'; c.lineWidth = brush * 0.8; c.strokeStyle = '#000'; S.forEach(s => { c.beginPath(); s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (s.length === 1) c.lineTo(s[0][0] + 0.1, s[0][1]); c.stroke(); }); }, N);
  // معايير مضبوطة بتجارب: تقبل ٩٦٪ من الحروف الصحيحة المرتجفة وترفض ٨٠٪ من المتشابهة (ب/ت، ر/ز، ع/غ)
  const Id = dilate(I, 2), Gd = dilate(G, 1);
  const parts = comps(G).filter(p => p.length >= 3), big = Math.max(...parts.map(p => p.length));
  const L = lenient * 0.08;
  let ok = true, covs = [];
  for (const p of parts) {
    const cov = p.filter(i => Id.m[i]).length / p.length; covs.push(cov);
    const need = p.length > big * 0.35 ? 0.6 - L : 0.35 - L / 2;
    if (cov < need) ok = false;
  }
  let inside = 0, tot = 0; for (let i = 0; i < I.m.length; i++) if (I.m[i]) { tot++; if (Gd.m[i]) inside++; }
  const prec = tot ? inside / tot : 0;
  if (prec < 0.8 - L) ok = false;
  return { pass: ok, covs, prec };
}
function Pad(c, text, { guide = 'trace', normalize = false, w, h: hh, box = false } = {}) {
  const maxW = Math.min(c.stage.clientWidth - 20, 680);
  const Wd = w || maxW, Ht = hh || Math.round(Math.min(Wd * 0.62, window.innerHeight * 0.42));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = h('canvas', { width: Wd * dpr, height: Ht * dpr, style: { width: Wd + 'px', height: Ht + 'px' } });
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const px = Math.round(Ht * (text.length > 3 ? 0.52 : 0.66)), brush = Math.max(12, Math.round(Ht * 0.06));
  let fitPx = px; { const t = document.createElement('canvas').getContext('2d'); t.font = FONT(px); const mw = t.measureText(text).width; if (mw > Wd * 0.86) fitPx = Math.floor(px * Wd * 0.86 / mw); }
  let strokes = [], cur = null, mode = guide, tries = 0;
  const color = '#2C55D6';
  function paint() {
    g.clearRect(0, 0, Wd, Ht);
    g.strokeStyle = '#d6e4fb'; g.lineWidth = 2; g.setLineDash([]);
    const pos = inkBox(text, fitPx, Wd, Ht);
    [0.3, 0.7].forEach(f => { g.beginPath(); g.moveTo(16, Ht * f); g.lineTo(Wd - 16, Ht * f); g.stroke(); });
    if (box) { g.strokeStyle = '#F2682A'; g.setLineDash([10, 9]); g.lineWidth = 4; g.strokeRect(Wd * 0.18, Ht * 0.08, Wd * 0.64, Ht * 0.84); g.setLineDash([]); }
    if (mode !== 'none') {
      g.font = FONT(fitPx); g.textAlign = 'center';
      g.fillStyle = mode === 'trace' ? '#EEF3FE' : 'rgba(44,85,214,.12)';
      g.fillText(text, Wd / 2, pos.y);
      if (mode === 'trace') { g.setLineDash([2, 10]); g.lineCap = 'round'; g.lineWidth = 4; g.strokeStyle = '#8EA6E8'; g.strokeText(text, Wd / 2, pos.y); g.setLineDash([]); }
    }
    g.lineCap = g.lineJoin = 'round'; g.lineWidth = brush; g.strokeStyle = color;
    for (const s of strokes) { g.beginPath(); s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (s.length === 1) g.lineTo(s[0][0] + 0.1, s[0][1]); g.stroke(); }
  }
  const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * Wd / r.width, (e.clientY - r.top) * Ht / r.height]; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [P(e)]; strokes.push(cur); paint(); });
  cv.addEventListener('pointermove', e => { if (!cur) return; const p = P(e), l = cur[cur.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.5) { cur.push(p); paint(); } });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const wrap = h('div', { class: 'pad' }, cv);
  let resolve; const done = new Promise(r => (resolve = r));
  const clearB = h('button', { class: 'btn sec', onclick: () => { strokes = []; paint(); SFX.pop(); } }, 'امسح');
  const okB = h('button', { class: 'btn', onclick: async () => {
    const pos = inkBox(text, fitPx, Wd, Ht);
    const r = scoreInk(strokes, text, fitPx, Wd, Ht, brush, normalize && mode === 'none', tries);
    if (r.pass || tries >= 3) { okB.disabled = true; resolve({ tries }); return; }
    tries++;
    if (r.why === 'empty') { shakeEl(wrap); c.say(['g/guide'], 'اكتب الحرف بالقلم أولاً', 'pencil'); return; }
    await c.bad(wrap, true);
    if (tries >= 1 && mode === 'none') mode = 'faint';
    if (tries >= 2) mode = 'trace';
    strokes = []; paint();
    if (tries >= 2) c.say(['g/guide'], TXT['g/guide'], 'pencil');
  } }, 'تمّ ✓');
  const el = h('div', { class: 'wordcard' }, wrap, h('div', { class: 'padtools' }, clearB, okB));
  if (TEST) el._solve = () => { strokes = []; const t = document.createElement('canvas').getContext('2d'); t.font = FONT(fitPx); const pos = inkBox(text, fitPx, Wd, Ht); const G2 = grid(Wd, Ht, c2 => { c2.font = FONT(fitPx); c2.textAlign = 'center'; c2.fillText(text, Wd / 2, pos.y); }); for (let i = 0; i < G2.m.length; i++) if (G2.m[i]) strokes.push([[(i % G2.gw + 0.5) / G2.sc, (((i / G2.gw) | 0) + 0.5) / G2.sc]]); paint(); okB.click(); };
  document.fonts.load(FONT(40)).then(paint);
  paint();
  return { el, done, solve: () => el._solve && el._solve() };
}

// ------------------------------------------------------------ سياق اللعبة
const ABORT = Symbol('abort');
let RUN = 0;
function makeCtx(L, G, opt) {
  const my = ++RUN, stage = $('#stage');
  let replay = null, mist = 0;
  const alive = () => my === RUN;
  const chk = () => { if (!alive()) throw ABORT; };
  const c = {
    L, stage, opt, get mist() { return mist; }, alive, chk,
    clear() { chk(); stage.innerHTML = ''; stage.scrollTop = 0; },
    dots(n) { const d = $('#g-dots'); d.innerHTML = ''; for (let i = 0; i < n; i++) d.append(h('i')); },
    dot(i) { $$('#g-dots i').forEach((e, j) => { e.classList.toggle('on', j < i); e.classList.toggle('now', j === i); }); },
    tag(text, gl) { const t = $('#g-tag'); t.innerHTML = ''; if (text) t.append(h('span', { class: 'tagband' }, text, gl ? h('span', { class: 'glyph' }, gl) : null)); },
    async prompt(keys, text, pose = 'point', gl) {
      chk(); replay = { keys, text, pose }; c.tag(text, gl); TEACH.pose(pose); TEACH.say('');
      await AU.play(keys); chk();
    },
    async say(keys, text, pose) { chk(); if (pose) TEACH.pose(pose); if (text) TEACH.say(text, 2600); await AU.play(keys); chk(); },
    replay() { if (replay) { TEACH.pose(replay.pose); AU.play(replay.keys); } },
    // pre: مقاطع تُسمع قبل المديح/التصحيح (كلمة الصورة مثلاً) فلا يقطعها
    async good(el, quiet = false, pre = []) {
      chk(); if (el) burst(el); SFX.ding(); pre = [].concat(pre);
      if (quiet) { TEACH.pose(rnd(GOODP)); if (pre.length) { await AU.play(pre); chk(); } return; }
      const k = 'c' + (1 + Math.floor(Math.random() * 12));
      TEACH.pose(rnd(GOODP)); TEACH.say(TXT['g/' + k].replace(/[ً-ْ]/g, ''), 1800);
      await AU.play([...pre, ...(pre.length ? [200] : []), 'g/' + k]); chk();
    },
    async bad(el, speak = true, pre = []) {
      chk(); mist++; shakeEl(el); SFX.buzz(); TEACH.pose(rnd(['hint', 'think'])); pre = [].concat(pre);
      if (!speak) { if (pre.length) { await AU.play(pre); chk(); } return; }
      const k = 'w' + (1 + Math.floor(Math.random() * 5)); TEACH.say(TXT['g/' + k].replace(/[ً-ْ]/g, ''), 2200);
      await AU.play([...pre, ...(pre.length ? [200] : []), 'g/' + k]); chk();
    },
    wait: ms => sleep(ms).then(chk),
  };
  TEACH.onTap(() => c.replay());
  $('#g-replay').onclick = () => c.replay();
  return c;
}
// يحلّ عند اكتمال عددٍ من الإصابات الصحيحة
function counter(n) { let k = 0, res; const p = new Promise(r => (res = r)); return { hit() { k++; if (k >= n) res(); return k; }, done: p, get n() { return k; } }; }

// ------------------------------------------------------------ الألعاب
const GAMES = {};
const pick = (arr, n) => shuffle(arr).slice(0, n);
function picCard(id, { word = true, b = null, cls = '' } = {}) {
  const w = W(id);
  return h('div', { class: 'pic ' + cls, 'data-id': id }, w.img ? h('img', { src: imgOf(id), alt: w.d, draggable: 'false' }) : null, word ? h('div', { class: 'pw', html: b ? hl(w.d, b) : esc(w.d) }) : null);
}

GAMES.learn = {
  t: 'تعرّف على الحرف', w: 'class', ic: 't/book', grp: 'learn',
  async run(L, c) {
    c.clear(); const lk = LK(L);
    const big = h('button', { class: 'bigl', style: { background: colorOf(L), '--sh': SHADE(colorOf(L)) }, onclick: () => AU.play('n/' + lk) }, h('span', {}, L.forms.alone));
    const syls = h('div', { class: 'syls' }, L.syl.map((s, i) => h('button', { class: 'syl', onclick: e => { burst(e.currentTarget, 8); AU.play(`s/${lk}_${i}`); } }, s)));
    const fk = isNJ(L) ? [['alone', 'وحده'], ['end', 'متصل من اليمين']] : [['alone', 'وحده'], ['start', 'أوّل'], ['middle', 'وسط'], ['end', 'آخر']];
    const forms = h('div', { class: 'forms' }, fk.map(([k, lb]) => h('button', { class: 'fcard', onclick: () => AU.play(k === 'alone' ? 'g/alone' : 'g/' + k) }, h('div', { class: 'g' }, L.forms[k]), h('small', {}, lb))));
    const ex = ['start', 'middle', 'end'].map(p => L.pics[p][0] || L.picsAny.find(id => !L.pics.start.includes(id)) ).filter(Boolean);
    const pics = h('div', { class: 'pics3' }, uniq(ex).slice(0, 3).map(id => { const el = picCard(id, { b: L.b }); el.onclick = () => AU.play('w/' + id); el.style.cursor = 'pointer'; return el; }));
    let res; const go = new Promise(r => (res = r));
    const btn = h('button', { class: 'btn', onclick: () => res() }, 'أنا جاهز، هيّا نلعب!');
    const box = h('div', { class: 'learn' }, h('div', { class: 'row' }, big, syls), forms, pics, btn);
    c.stage.append(box); enter([big, ...syls.children, ...forms.children, ...pics.children, btn], 60); c.solve = () => btn.click();
    await c.prompt(['p/learn_' + lk, 300, 'n/' + lk, 300, 's/' + lk], TXT['p/learn_' + lk], 'book');
    await go; c.chk(); return 3;
  },
};

GAMES.write = {
  t: 'اكتب الحرف', w: 'class', ic: 't/pencil', grp: 'pen',
  async run(L, c) {
    const lk = LK(L); let fs = isNJ(L) ? ['alone', 'end'] : ['alone', 'start', 'middle', 'end'];
    if (c.opt.short) fs = fs.slice(0, 2);
    c.dots(fs.length);
    for (let i = 0; i < fs.length; i++) {
      c.dot(i); c.clear();
      const pad = Pad(c, L.forms[fs[i]], { guide: 'trace' });
      c.stage.append(h('div', { class: 'fcard' }, h('small', {}, fs[i] === 'alone' ? 'الحرف وحده' : 'في ' + POSN[fs[i]])), pad.el);
      c.solve = pad.solve;
      await c.prompt(['p/write_' + lk], TXT['p/write_' + lk], 'pencil');
      await pad.done; c.chk();
      await c.good(pad.el, i < fs.length - 1);
    }
  },
};

function balancedPics(L, n) {
  const out = [], P = ['start', 'middle', 'end'];
  const pools = Object.fromEntries(P.map(p => [p, shuffle(L.pics[p].length ? L.pics[p] : L.txt[p])]));
  let order = []; while (order.length < n) order.push(...shuffle(P));
  for (const p of order) { if (out.length >= n) break; const id = pools[p].find(x => !out.some(o => o.id === x)); if (id) out.push({ id, pos: p }); }
  return out;
}

GAMES.pos = {
  t: 'قطار المواضع', w: 'road', ic: 'c/train', grp: 'play',
  async run(L, c) {
    const lk = LK(L), R = c.opt.short ? 3 : 5, qs = balancedPics(L, R);
    c.dots(qs.length);
    for (let i = 0; i < qs.length; i++) {
      c.dot(i); c.clear();
      const { id, pos } = qs[i], listen = i % 2 === 1 && hasImg(id);
      const card = picCard(id, { cls: 'qcard' }); const pw = $('.pw', card);
      if (listen && pw) pw.style.visibility = 'hidden';
      const wag = {};
      const mk = (p, col) => (wag[p] = h('button', { class: 'wagon', style: { '--c': col } }, POSS[p]));
      const train = h('div', { class: 'train' }, h('img', { class: 'engine', src: 'img/c/train.webp', alt: '' }), mk('start', '#E8366A'), mk('middle', '#3FB45F'), mk('end', '#1FA8C9'));
      c.stage.append(card, train); enter([card, train]);
      let res; const done = new Promise(r => (res = r)); let busy = false;
      Object.entries(wag).forEach(([p, el]) => el.addEventListener('click', async () => {
        if (busy) return; busy = true;
        if (p === pos) {
          el.append(h('span', { class: 'wg' }, L.forms[pos])); if (pw) { pw.style.visibility = ''; pw.innerHTML = hl(W(id).d, L.b); }
          SFX.toot(); train.classList.add('go'); await c.good(el); res();
        } else { await c.bad(el); busy = false; }
      }));
      c.solve = () => wag[pos].click();
      c.prompt(['w/' + id, 250, 'p/pos_' + lk], TXT['p/pos_' + lk], listen ? 'ear' : 'think');
      await done; await c.wait(500);
    }
  },
};

const PLAYERS = ['messi', 'ronaldo', 'mbappe', 'haaland', 'yamal', 'neymar'];
function celebrate(src) {
  const p = h('img', { class: 'player sticker', src, alt: '' }); document.body.append(p);
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('on')));
  setTimeout(() => { p.classList.remove('on'); setTimeout(() => p.remove(), 600); }, 1900);
}

GAMES.sort = {
  t: 'ملعب المواضع', w: 'pitch', ic: 'c/goal', grp: 'play',
  async run(L, c) {
    const lk = LK(L); c.clear(); c.dots(0);
    const its = balancedPics(L, c.opt.short ? 3 : 6).filter(x => hasImg(x.id));
    const goals = ['start', 'middle', 'end'].map(p => h('div', { class: 'goal', 'data-p': p }, h('span', { class: 'gl' }, POSS[p]), h('span', { class: 'gg' }, L.forms[p]), h('div', { class: 'in' })));
    const balls = its.map(x => h('div', { class: 'ballpic', 'data-p': x.pos, 'data-id': x.id }, h('img', { src: imgOf(x.id), alt: W(x.id).d })));
    c.stage.append(h('div', { class: 'goals' }, goals), h('div', { class: 'balls' }, balls)); enter([...goals, ...balls]);
    const cnt = counter(balls.length);
    balls.forEach(b => b.addEventListener('click', () => AU.play('w/' + b.dataset.id)));
    const dd = dnd(balls, () => goals, async (b, g) => {
      if (b.dataset.p === g.dataset.p) {
        b.classList.add('used'); b.style.visibility = 'hidden'; $('.in', g).append(h('img', { src: imgOf(b.dataset.id), alt: '' }));
        g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake'); SFX.kick();
        const k = cnt.hit(); await c.good(g, k < balls.length, 'w/' + b.dataset.id);
      } else { AU.play('w/' + b.dataset.id); await c.bad(b, false); TEACH.say(POSN[b.dataset.p] ? 'أين تسمع الحرف؟' : '', 1800); }
    });
    c.solve = () => { const b = balls.find(x => x.style.visibility !== 'hidden'); if (b) dd.drop(b, goals.find(g => g.dataset.p === b.dataset.p)); };
    c.prompt(['p/sort_' + lk], TXT['p/sort_' + lk], 'ball');
    await cnt.done; SFX.crowd(); celebrate(`img/f/${rnd(PLAYERS)}.webp`); await c.say(['g/goal'], 'هدف!', 'cheer');
  },
};

GAMES.forms = {
  t: 'شجرة الحروف', w: 'garden', ic: 'c/apple', grp: 'play',
  async run(L, c) {
    const lk = LK(L), R = c.opt.short ? 2 : 4;
    const bys = wordsByShape(L, [...singles(L, true), ...singles(L, false).slice(0, 40)]);
    const shapes = Object.keys(bys).filter(s => bys[s].length);
    const qs = []; let k = 0;
    while (qs.length < R && k < 40) { const s = shapes[k % shapes.length]; const pool = bys[s].filter(x => !qs.includes(x)); const pref = pool.filter(hasImg); const id = rnd(pref.length ? pref : pool); if (id) qs.push(id); k++; }
    const sim = (SIM[L.b] || '').split('').filter(ch => Lof(ch));
    c.dots(qs.length);
    for (let i = 0; i < qs.length; i++) {
      c.dot(i); c.clear();
      const id = qs[i], d = W(id).d, sp = split(d, L.b), need = glyph(L.b === 'أ' ? units(d)[sp.i].c : L.b, shapeAt(d, sp.i));
      const opts = uniq([need, ...shapes.map(s => glyph(L.b === 'أ' ? 'أ' : L.b, s))]);
      if (sim.length) opts.push(glyph(rnd(sim), shapeAt(d, sp.i)));
      const spots = [[18, 14], [52, 6], [74, 26], [12, 44], [44, 36], [72, 52]];
      const apples = shuffle(uniq(opts)).slice(0, 6).map((g, j) => h('div', { class: 'apple', 'data-g': g, style: { left: spots[j][0] + '%', top: spots[j][1] + '%' } }, h('span', {}, g)));
      const tree = h('div', { class: 'tree' }, h('div', { class: 'crown' }), h('div', { class: 'trunk' }), apples);
      const blank = h('span', { class: 'blank' });
      const wd = h('div', { class: 'word' }, sp.pre + sp.zl, blank, sp.zr + sp.post);
      const card = h('div', { class: 'wordcard' }, hasImg(id) ? picCard(id, { word: false, cls: 'qcard' }) : null, wd);
      card.addEventListener('click', e => { if (e.target.closest('.pic')) AU.play('w/' + id); });
      c.stage.append(h('div', { class: 'treewrap' }, tree, card)); enter([tree, card, ...apples], 60);
      let res; const done = new Promise(r => (res = r));
      const dd = dnd(apples, () => [blank], async a => {
        if (a.dataset.g === need) { a.classList.add('used'); a.style.visibility = 'hidden'; wd.innerHTML = hl(d, L.b); await c.good(wd, false, 'w/' + id); res(); }
        else await c.bad(a);
      });
      c.solve = () => dd.drop(apples.find(x => x.dataset.g === need), blank);
      c.prompt(['p/forms_' + lk, 250, 'w/' + id], TXT['p/forms_' + lk], 'point');
      await done; await c.wait(600);
    }
  },
};

const FISH = ['fish1', 'fish2', 'fish3', 'puffer', 'octopus', 'turtle', 'crab', 'shark'];
GAMES.fish = {
  t: 'صيد الأسماك', w: 'sea', ic: 'c/fish1', grp: 'play',
  async run(L, c) {
    const lk = LK(L), pool = [...singles(L, false), ...singles(L, true)];
    const bys = wordsByShape(L, pool);
    let shapes = shuffle(Object.keys(bys).filter(s => bys[s].length >= 2)); if (!shapes.length) shapes = Object.keys(bys).filter(s => bys[s].length);
    const R = c.opt.short ? 1 : Math.min(2, shapes.length);
    c.dots(R);
    for (let r = 0; r < R; r++) {
      c.dot(r); c.clear();
      const s = shapes[r], gl = glyph(L.b, s);
      const good = pick(bys[s], 3);
      const other = pick(Object.keys(bys).filter(x => x !== s && glyph(L.b, x) !== gl).flatMap(x => bys[x]), 2);
      const none = pick(ALLTXT.filter(id => !containsB(id, L.b) && plainOf(W(id).d).length <= 5), 7 - good.length - other.length);
      const items = shuffle([...good.map(id => [id, 1]), ...other.map(id => [id, 0]), ...none.map(id => [id, 0])]);
      const sea = h('div', { class: 'sea' });
      const bucket = h('div', { class: 'bucket' }, h('img', { src: 'img/c/net.webp', alt: '' }), h('b', { dir: 'ltr' }, '0 / ' + good.length));
      const cols = 4, fishes = items.map(([id, ok], j) => {
        const f = h('button', { class: 'fish' + (j % 2 ? ' flip' : ''), 'data-ok': ok, style: { left: (4 + (j % cols) * 23 + (Math.floor(j / cols) % 2) * 9) + '%', top: (6 + Math.floor(j / cols) * 44 + (j % 2) * 8) + '%', '--d': (4 + Math.random() * 3) + 's', '--dx': (Math.random() * 50 - 25) + 'px', '--dy': (Math.random() * 30 - 15) + 'px' } },
          h('img', { src: `img/c/${FISH[j % FISH.length]}.webp`, alt: '' }), h('b', {}, W(id).d));
        f.dataset.id = id; return f;
      });
      sea.append(...fishes, bucket); c.stage.append(sea); enter(fishes, 80);
      const cnt = counter(good.length);
      fishes.forEach(f => f.addEventListener('click', async () => {
        if (f.classList.contains('caught')) return;
        AU.play('w/' + f.dataset.id);
        if (f.dataset.ok === '1') {
          const br = bucket.getBoundingClientRect(), fr = f.getBoundingClientRect();
          f.style.setProperty('--tx', (br.left - fr.left) + 'px'); f.style.setProperty('--ty', (br.top - fr.top) + 'px');
          f.classList.add('caught'); SFX.splash(); const k = cnt.hit(); $('b', bucket).textContent = k + ' / ' + good.length;
          await c.good(f, true);
        } else await c.bad(f, false);
      }));
      c.solve = () => { const f = fishes.find(x => x.dataset.ok === '1' && !x.classList.contains('caught')); if (f) f.click(); };
      c.prompt(['p/fish_' + lk], TXT['p/fish_' + lk], 'magnify', gl);
      await cnt.done; await c.say(['g/fishdone'], 'صدت كل الأسماك!', 'cheer');
    }
  },
};

GAMES.color = {
  t: 'لوّن الكرات', w: 'art', ic: 'c/balloon', grp: 'art',
  async run(L, c) {
    const lk = LK(L); c.clear(); c.dots(0);
    const st = uniq([...L.pics.start, ...L.txt.start]).filter(id => plainOf(W(id).d).length <= 6);
    const good = pick(st, Math.min(4, st.length));
    const mid = pick(uniq([...L.txt.middle, ...L.txt.end, ...L.pics.middle, ...L.pics.end]).filter(id => plainOf(W(id).d).length <= 6), 2);
    const none = pick(ALLTXT.filter(id => !containsB(id, L.b) && plainOf(W(id).d).length <= 5), 8 - good.length - mid.length);
    const items = shuffle([...good.map(i => [i, 1]), ...mid.map(i => [i, 0]), ...none.map(i => [i, 0])]);
    let col = COLORS[0];
    const crayons = h('div', { class: 'crayons' }, COLORS.slice(0, 6).map((cc, i) => h('button', { class: 'crayon' + (i ? '' : ' sel'), style: { '--c': cc }, 'aria-label': 'لون', onclick: e => { col = cc; $$('.crayon').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); SFX.pop(); } })));
    const balls = items.map(([id, ok]) => h('button', { class: 'cball', 'data-ok': ok, 'data-id': id }, h('span', {}, W(id).d)));
    c.stage.append(h('div', { class: 'colorfield' }, balls), crayons); enter(balls, 60);
    const cnt = counter(good.length);
    balls.forEach(b => b.addEventListener('click', async () => {
      if (b.classList.contains('done')) return; AU.play('w/' + b.dataset.id);
      if (b.dataset.ok === '1') { b.style.setProperty('--fill', col); b.classList.add('done'); const k = cnt.hit(); await c.good(b, k < good.length); }
      else await c.bad(b, false);
    }));
    c.solve = () => { const b = balls.find(x => x.dataset.ok === '1' && !x.classList.contains('done')); if (b) b.click(); };
    c.prompt(['p/color_' + lk], TXT['p/color_' + lk], 'paint');
    await cnt.done; await c.wait(400);
  },
};

GAMES.paint = {
  t: 'لوّن الحرف', w: 'art', ic: 't/paint', grp: 'art',
  async run(L, c) {
    const lk = LK(L); c.clear(); c.dots(0);
    const Wd = Math.min(c.stage.clientWidth - 20, 620), Ht = Math.round(Math.min(Wd * 0.8, window.innerHeight * 0.5));
    const dpr = Math.min(window.devicePixelRatio || 1, 2), text = L.forms.alone;
    const cv = h('canvas', { width: Wd * dpr, height: Ht * dpr, style: { width: Wd + 'px', height: Ht + 'px' } });
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const paintC = document.createElement('canvas'); paintC.width = Wd * dpr; paintC.height = Ht * dpr; const pg = paintC.getContext('2d'); pg.scale(dpr, dpr);
    const px = Math.round(Ht * 0.86); let pos = inkBox(text, px, Wd, Ht);
    let col = COLORS[0], hue = 0, rainbow = false; const brush = Math.round(Ht * 0.07);
    function draw() {
      g.clearRect(0, 0, Wd, Ht);
      g.save(); g.font = FONT(px); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(text, Wd / 2, pos.y);
      g.globalCompositeOperation = 'source-atop'; g.drawImage(paintC, 0, 0, Wd, Ht); g.restore();
      g.font = FONT(px); g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#1D2A5B'; g.lineJoin = 'round'; g.strokeText(text, Wd / 2, pos.y);
    }
    let last = null;
    const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * Wd / r.width, (e.clientY - r.top) * Ht / r.height]; };
    const dab = p => { pg.lineCap = 'round'; pg.lineWidth = brush; pg.strokeStyle = rainbow ? `hsl(${(hue += 4) % 360} 85% 58%)` : col; pg.beginPath(); pg.moveTo(...(last || p)); pg.lineTo(...p); pg.stroke(); last = p; draw(); };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); last = null; dab(P(e)); });
    cv.addEventListener('pointermove', e => { if (last) dab(P(e)); });
    const up = () => { last = null; check(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const meter = h('div', { class: 'meter' }, h('i'));
    const paints = h('div', { class: 'paints' }, [...COLORS.map((cc, i) => h('button', { class: 'paint' + (i ? '' : ' sel'), style: { '--c': cc }, 'aria-label': 'لون', onclick: e => { col = cc; rainbow = false; $$('.paint').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); SFX.pop(); } })), h('button', { class: 'paint rainbow', 'aria-label': 'قوس قزح', onclick: e => { rainbow = true; $$('.paint').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); SFX.pop(); } })]);
    let res; const done = new Promise(r => (res = r)); let fin = false;
    const finB = h('button', { class: 'btn', hidden: true, onclick: () => { if (!fin) { fin = true; res(); } } }, 'انتهيت!');
    function check() {
      const Gm = grid(Wd, Ht, c2 => { c2.font = FONT(px); c2.textAlign = 'center'; c2.fillText(text, Wd / 2, pos.y); });
      const Pm = grid(Wd, Ht, c2 => c2.drawImage(paintC, 0, 0, Wd, Ht));
      let a = 0, b = 0; for (let i = 0; i < Gm.m.length; i++) if (Gm.m[i]) { a++; if (Pm.m[i]) b++; }
      const f = a ? b / a : 0; $('i', meter).style.width = Math.min(100, (f / 0.75) * 100) + '%';
      if (f > 0.4) finB.hidden = false;
      if (f >= 0.75 && !fin) { fin = true; res(); }
    }
    c.stage.append(h('div', { class: 'pad' }, cv), meter, paints, finB); enter([cv.parentNode, paints]);
    document.fonts.load(FONT(40)).then(() => { pos = inkBox(text, px, Wd, Ht); draw(); }); draw();
    c.solve = () => { pg.fillStyle = col; pg.fillRect(0, 0, Wd, Ht); draw(); check(); };
    c.prompt(['p/paint_' + lk], TXT['p/paint_' + lk], 'paint');
    await done; c.chk(); burst(cv.parentNode, 30); SFX.win(); await c.say(['g/paintdone'], 'لوحة جميلة! أنت فنّان', 'wow');
    return 3;
  },
};

GAMES.match = {
  t: 'وصّل مع سبايدرمان', w: 'city', ic: 'c/spidey1', grp: 'play',
  async run(L, c) {
    const lk = LK(L), R = c.opt.short ? 1 : 2; c.dots(R);
    const spidey = h('img', { class: 'spidey sticker', src: 'img/c/spidey1.webp', alt: '' }); document.body.append(spidey);
    try {
      for (let r = 0; r < R; r++) {
        c.dot(r); c.clear();
        const bys = wordsByShape(L, singles(L, true));
        let pairs, mode = 'shape';
        const shp = Object.keys(bys).filter(s => bys[s].length);
        if (r === 0 && shp.length >= 3) pairs = pick(shp, 3).map(s => ({ id: rnd(bys[s]), key: s, label: glyph(L.b, s) }));
        else { mode = 'pos'; pairs = balancedPics(L, 3).filter(x => hasImg(x.id)); const seen = new Set(); pairs = pairs.filter(x => !seen.has(x.pos) && seen.add(x.pos)).map(x => ({ id: x.id, key: x.pos, label: POSN[x.pos] })); }
        if (pairs.length < 2) { pairs = balancedPics(L, 3).map(x => ({ id: x.id, key: x.pos, label: POSN[x.pos] })); mode = 'pos'; }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const A = pairs.map(p => h('div', { class: 'node', 'data-k': p.key, 'data-id': p.id }, picCard(p.id, { word: true }), h('i', { class: 'pt' })));
        const B = shuffle(pairs).map(p => h('div', { class: 'node', 'data-k': p.key }, h('div', { class: 'tgt' + (mode === 'pos' ? ' txt' : '') }, p.label), h('i', { class: 'pt' })));
        const web = h('div', { class: 'web' }, h('div', { class: 'col a' }, A), h('div', { class: 'col b' }, B)); web.prepend(svg);
        c.stage.append(web); enter([...A, ...B], 70);
        const cnt = counter(pairs.length); let from = null, line = null;
        const pt = el => { const r1 = $('.pt', el).getBoundingClientRect(), r0 = web.getBoundingClientRect(); return [r1.left + r1.width / 2 - r0.left, r1.top + r1.height / 2 - r0.top]; };
        const mkLine = (a, cls = '') => { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); const [x, y] = pt(a); l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', x); l.setAttribute('y2', y); l.setAttribute('stroke', '#fff'); l.setAttribute('stroke-width', '6'); l.setAttribute('stroke-linecap', 'round'); l.setAttribute('stroke-dasharray', cls ? '0' : '2 10'); l.style.filter = 'drop-shadow(0 0 2px #1D2A5B)'; svg.append(l); return l; };
        const tryConnect = async (a, b) => {
          if (a.dataset.k === b.dataset.k) {
            const l = mkLine(a, 'ok'); const [x, y] = pt(b); l.setAttribute('x2', x); l.setAttribute('y2', y);
            a.classList.add('ok', 'used'); b.classList.add('ok', 'used'); SFX.whoosh();
            const k = cnt.hit(); await c.good(b, k < pairs.length, 'w/' + a.dataset.id);
          } else await c.bad(b);
        };
        A.forEach(a => {
          a.addEventListener('pointerdown', e => { if (a.classList.contains('used')) return; a.setPointerCapture(e.pointerId); from = a; line = mkLine(a); SFX.unlock(); });
          a.addEventListener('pointermove', e => { if (from !== a || !line) return; const r0 = web.getBoundingClientRect(); line.setAttribute('x2', e.clientX - r0.left); line.setAttribute('y2', e.clientY - r0.top); });
          a.addEventListener('pointerup', e => {
            if (from !== a) return; const b = B.find(n => { const rr = n.getBoundingClientRect(); return e.clientX >= rr.left && e.clientX <= rr.right && e.clientY >= rr.top && e.clientY <= rr.bottom; });
            line && line.remove(); line = null;
            if (b && !b.classList.contains('used')) { from = null; tryConnect(a, b); }
            else { $$('.node', web).forEach(n => n.classList.remove('sel')); a.classList.add('sel'); AU.play('w/' + a.dataset.id); }
          });
        });
        B.forEach(b => b.addEventListener('click', () => { if (b.classList.contains('used')) return; const a = A.find(n => n.classList.contains('sel')); if (a) { a.classList.remove('sel'); from = null; tryConnect(a, b); } }));
        c.solve = () => { const a = A.find(n => !n.classList.contains('used')); if (a) tryConnect(a, B.find(b => b.dataset.k === a.dataset.k)); };
        c.prompt(['p/match_' + lk], TXT['p/match_' + lk], 'point');
        await cnt.done; await c.wait(400);
      }
      await c.say(['g/spidey'], 'شكراً لك! ساعدت سبايدرمان', 'thumbs');
    } finally { spidey.remove(); }
  },
};

GAMES.blocks = {
  t: 'مكعبات الحروف', w: 'block', ic: 'c/steve', grp: 'play',
  async run(L, c) {
    const lk = LK(L); c.clear(); c.dots(0);
    const mine = uniq(Object.values(L.forms)).map(g => [g, 1]);
    const sims = (SIM[L.b] || 'بت').split('').map(Lof).filter(Boolean);
    const others = shuffle(sims.flatMap(S => uniq(Object.values(S.forms)))).slice(0, 12);
    const goodN = Math.min(5, Math.max(4, mine.length + 1));
    const goods = []; while (goods.length < goodN) goods.push(mine[goods.length % mine.length]);
    const bad = []; for (let i = 0; bad.length < 12 - goodN; i++) bad.push([others[i % Math.max(others.length, 1)] || 'م', 0]);
    const tex = ['grass', 'stone', 'dirt', 'sand'];
    const blocks = shuffle([...goods, ...bad]).map(([g, ok], i) => h('button', { class: 'block ' + rnd(tex), 'data-ok': ok }, h('span', {}, g)));
    const gems = h('div', { class: 'gems' }, '💎 ', h('b', {}, '0'));
    const steve = h('img', { class: 'steve sticker', src: 'img/c/steve.webp', alt: '' }); document.body.append(steve);
    c.stage.append(gems, h('div', { class: 'blocks' }, blocks)); enter(blocks, 40);
    const cnt = counter(goodN);
    try {
      blocks.forEach(b => b.addEventListener('click', async () => {
        if (b.classList.contains('broke')) return;
        if (b.dataset.ok === '1') {
          if (!b.classList.contains('crack')) { b.classList.add('crack'); SFX.crack(); return; }
          b.classList.add('broke'); SFX.crack(); burst(b, 12); $('b', gems).textContent = cnt.hit(); await c.good(b, true);
        } else await c.bad(b, false);
      }));
      c.solve = () => { const b = blocks.find(x => x.dataset.ok === '1' && !x.classList.contains('broke')); if (b) { b.click(); b.click(); } };
      c.prompt(['p/blocks_' + lk], TXT['p/blocks_' + lk], 'pencil');
      await cnt.done; await c.say(['g/blocksdone'], 'كسرت كل المكعبات!', 'cheer');
    } finally { steve.remove(); }
  },
};

GAMES.kick = {
  t: 'سدّد الكرة', w: 'pitch', ic: 'f/ronaldo', grp: 'play',
  async run(L, c) {
    const lk = LK(L), R = c.opt.short ? 2 : 4; c.dots(R);
    const sims = (SIM[L.b] || '').split('').map(Lof).filter(Boolean);
    for (let r = 0; r < R; r++) {
      c.dot(r); c.clear();
      let opts, ans;
      if (r < 2 || !sims.length) { ans = Math.floor(Math.random() * 3); opts = L.syl.map((s, i) => ({ s, k: `s/${lk}_${i}`, ok: i === ans })); }
      else { const v = Math.floor(Math.random() * 3); const o2 = pick(sims, 2); opts = shuffle([{ s: L.syl[v], k: `s/${lk}_${v}`, ok: true }, ...o2.map(S => ({ s: S.syl[v], k: `s/${LK(S)}_${v}`, ok: false }))]); }
      const target = opts.find(o => o.ok);
      const goals = opts.map(o => h('button', { class: 'goal' }, h('span', { class: 'gg', style: { fontSize: 'clamp(54px,7vw,80px)' } }, o.s.replace('ـ', ''))));
      const ball = h('img', { class: 'kball', src: 'img/c/ball.webp', alt: '' });
      c.stage.append(h('div', { class: 'kick' }, h('div', { class: 'goals' }, goals), ball)); enter(goals);
      let res; const done = new Promise(rr => (res = rr)); let busy = false;
      goals.forEach((g, i) => g.addEventListener('click', async () => {
        if (busy) return; busy = true;
        const gr = g.getBoundingClientRect(), br = ball.getBoundingClientRect();
        const ok = opts[i].ok, dx = gr.left + gr.width / 2 - (br.left + br.width / 2) + (ok ? 0 : (i ? 1 : -1) * gr.width * 0.75), dy = gr.top + gr.height * (ok ? 0.55 : -0.1) - br.top;
        SFX.kick(); ball.style.transform = `translate(${dx}px, ${dy}px) scale(.6) rotate(720deg)`;
        await c.wait(700);
        if (ok) { g.classList.add('shake'); SFX.crowd(); celebrate(`img/f/${PLAYERS[(r + RUN) % PLAYERS.length]}.webp`); await c.say(['g/goal'], 'هدف!', 'ball'); res(); }
        else { await c.bad(g); ball.style.transition = 'none'; ball.style.transform = ''; void ball.offsetWidth; ball.style.transition = ''; await AU.play([target.k]); busy = false; }
      }));
      c.solve = () => goals[opts.indexOf(target)].click();
      await c.prompt(r === 0 ? ['g/kick', 300, target.k] : [target.k], TXT['g/kick'], 'ear');
      TEACH.onTap(() => AU.play([target.k])); $('#g-replay').onclick = () => AU.play([target.k]);
      await done; await c.wait(500);
    }
  },
};

GAMES.race = {
  t: 'سباق السيارات', w: 'road', ic: 'c/car_red', grp: 'play',
  async run(L, c) {
    const lk = LK(L), R = c.opt.short ? 2 : 3; c.dots(R);
    const goodPool = shuffle(L.picsAny); const cars = ['car_red', 'car_blue', 'car_yellow', 'car_green'];
    for (let r = 0; r < R; r++) {
      c.dot(r); c.clear();
      const g = goodPool[r % goodPool.length], o = otherPics(L, 2, [g]);
      const items = shuffle([[g, 1], ...o.map(x => [x, 0])]);
      const lanes = items.map(([id, ok], i) => { const car = h('button', { class: 'car', 'data-ok': ok, 'data-id': id }, picCard(id, { word: false }), h('img', { class: 'c', src: `img/c/${cars[(i + r) % 4]}.webp`, alt: '' })); return h('div', { class: 'lane' }, car); });
      c.stage.append(h('div', { class: 'track' }, lanes)); enter(lanes, 90);
      let res; const done = new Promise(rr => (res = rr)); let busy = false;
      $$('.car', c.stage).forEach(car => car.addEventListener('click', async () => {
        if (busy) return; busy = true;
        if (car.dataset.ok === '1') { SFX.whoosh(); car.classList.add('win'); await c.good(car, false, 'w/' + car.dataset.id); res(); }
        else { car.classList.remove('stall'); void car.offsetWidth; car.classList.add('stall'); await c.bad(car, true, 'w/' + car.dataset.id); busy = false; }
      }));
      c.solve = () => $$('.car', c.stage).find(x => x.dataset.ok === '1').click();
      c.prompt(['p/race_' + lk], TXT['p/race_' + lk], 'point');
      await done; await c.wait(300);
    }
    SFX.win(); await c.say(['g/racewin'], 'فزت بالسباق!', 'trophy');
  },
};

function shortWords(L, n, maxLen = 4) {
  const ok = id => { const p = plainOf(W(id).d); return p.length >= 3 && p.length <= maxLen && !p.startsWith('ال'); };
  let a = shuffle(L.picsAny.filter(ok)); if (a.length < n) a = a.concat(shuffle(L.picsAny.filter(id => plainOf(W(id).d).length <= 5 && !a.includes(id))));
  return a.slice(0, n);
}
async function buildWord(c, L, id, { mode }) {
  // mode: order (حروف منفصلة) | split (أشكال الحروف في نجوم) | pencils (أقلام مرقّمة)
  const d = W(id).d, u = units(d), n = u.length;
  const sh = u.map((x, i) => shapeAt(d, i)), gl = u.map((x, i) => (mode === 'order' ? x.c : glyph(x.c, sh[i])));
  const starSVG = '<svg viewBox="0 0 100 100"><path d="M50 4l13 30 32 3-24 21 7 32-28-17-28 17 7-32L5 37l32-3z" fill="#fff" stroke="#1D2A5B" stroke-width="4" stroke-linejoin="round"/></svg>';
  const slots = gl.map(() => h('div', { class: 'slot' + (mode === 'split' ? ' star' : ''), html: mode === 'split' ? starSVG : '' }));
  let tiles;
  const ordr = shuffle(gl.map((g, i) => i)); if (ordr.every((v, i) => v === i) && n > 1) ordr.reverse();
  if (mode === 'pencils') tiles = ordr.map(i => h('button', { class: 'pencil', 'data-i': i, style: { '--c': COLORS[i % COLORS.length] } }, h('span', { class: 'n' }, String(i + 1)), h('div', { class: 'body' }, h('div', { class: 'ring' }, h('span', {}, gl[i])))));
  else tiles = ordr.map(i => h('button', { class: 'tile', 'data-g': gl[i], style: { '--c': COLORS[(i * 3 + 1) % COLORS.length] } }, h('span', {}, gl[i])));
  const top = mode === 'split' ? h('div', { class: 'word' }, d) : null;
  const card = hasImg(id) ? picCard(id, { word: false, cls: 'qcard' }) : null; if (card) { card.style.width = 'clamp(170px,22vw,240px)'; card.onclick = () => AU.play('w/' + id); }
  c.stage.append(h('div', { class: 'row' }, card, top), h('div', { class: 'slots' }, slots), h('div', { class: mode === 'pencils' ? 'pencils' : 'tiles' }, tiles));
  enter([...slots, ...tiles], 50);
  let k = 0, res; const done = new Promise(r => (res = r));
  tiles.forEach(t => t.addEventListener('click', async () => {
    if (t.classList.contains('used')) return;
    const right = mode === 'pencils' ? +t.dataset.i === k : t.dataset.g === gl[k];
    if (right) {
      t.classList.add('used'); const s = slots[k]; s.classList.add('full'); s.append(h('span', {}, gl[k])); SFX.pop(); burst(s, 8); k++;
      if (k === n) { await c.wait(250); const wd = h('div', { class: 'word enter' }, d); c.stage.querySelector('.slots').replaceWith(wd); await c.good(wd, false, 'w/' + id); res(); }
    } else await c.bad(t, false);
  }));
  c.solve = () => { const t = tiles.find(x => !x.classList.contains('used') && (mode === 'pencils' ? +x.dataset.i === k : x.dataset.g === gl[k])); if (t) t.click(); };
  return done;
}
for (const [k, t, w, ic, key, R] of [['order', 'رتّب الحروف', 'jungle', 'c/monkey', 'g/order', 3], ['split', 'حلّل الكلمة', 'jungle', 'c/giraffe', 'g/split', 2], ['pencils', 'الأقلام الملوّنة', 'art', 'c/panda', 'g/pencils', 2]]) {
  GAMES[k] = {
    t, w, ic, grp: k === 'pencils' ? 'art' : 'play',
    async run(L, c) {
      const ids = shortWords(L, c.opt.short ? 1 : R, k === 'split' ? 4 : 4); c.dots(ids.length);
      for (let i = 0; i < ids.length; i++) {
        c.dot(i); c.clear();
        const p = buildWord(c, L, ids[i], { mode: k });
        c.prompt([key, 250, 'w/' + ids[i]], TXT[key], k === 'split' ? 'star' : k === 'pencils' ? 'pencil' : 'think');
        await p; await c.wait(500);
      }
    },
  };
}

GAMES.miss = {
  t: 'الحرف الناقص', w: 'class', ic: 't/think', grp: 'pen',
  async run(L, c) {
    const qs = balancedPics(L, c.opt.short ? 1 : 3); c.dots(qs.length);
    for (let i = 0; i < qs.length; i++) {
      c.dot(i); c.clear();
      const { id } = qs[i], d = W(id).d, sp = split(d, L.b), need = glyph(units(d)[sp.i].c, shapeAt(d, sp.i));
      const wd = h('div', { class: 'word' }, sp.pre + sp.zl, h('span', { class: 'blank' }), sp.zr + sp.post);
      const card = hasImg(id) ? picCard(id, { word: false }) : null; if (card) { card.style.width = 'clamp(130px,16vw,180px)'; card.onclick = () => AU.play('w/' + id); }
      const pad = Pad(c, need, { guide: 'none', normalize: true, h: Math.round(Math.min(window.innerHeight * 0.34, 300)), w: Math.min(c.stage.clientWidth - 20, 520) });
      c.stage.append(h('div', { class: 'row' }, card, wd), pad.el); c.solve = pad.solve;
      await c.prompt(['g/miss', 250, 'w/' + id], TXT['g/miss'], 'pencil');
      await pad.done; c.chk(); wd.innerHTML = hl(d, L.b); await c.good(wd, i < qs.length - 1, 'w/' + id);
    }
  },
};

GAMES.dict = {
  t: 'اسمع واكتب', w: 'class', ic: 't/ear', grp: 'pen',
  async run(L, c) {
    const lk = LK(L); let ps = isNJ(L) ? ['alone', 'end'] : shuffle(['start', 'middle', 'end']).slice(0, 2); ps = ['alone', ...ps.filter(p => p !== 'alone')];
    if (c.opt.short) ps = ps.slice(0, 1); c.dots(ps.length);
    for (let i = 0; i < ps.length; i++) {
      c.dot(i); c.clear(); const p = ps[i];
      const pad = Pad(c, L.forms[p], { guide: 'none', normalize: true });
      const ear = h('button', { class: 'btn blue', onclick: () => c.replay() }, '🔊 اسمع مرة أخرى');
      c.stage.append(ear, pad.el); c.solve = pad.solve;
      const text = `${TXT['g/dict']} ${L.name} ${p === 'alone' ? 'وَحْدَهُ' : TXT['g/' + p]}`;
      await c.prompt(['g/dict', 250, 'n/' + lk, 200, 'g/' + p], text, 'ear');
      await pad.done; c.chk(); await c.good(pad.el, i < ps.length - 1);
    }
  },
};

GAMES.wordw = {
  t: 'اكتب الكلمة', w: 'class', ic: 't/star', grp: 'pen',
  async run(L, c) {
    const ids = shortWords(L, c.opt.short ? 1 : 2, 4); c.dots(ids.length);
    for (let i = 0; i < ids.length; i++) {
      c.dot(i); c.clear(); const id = ids[i];
      const card = picCard(id, { word: false }); card.style.width = 'clamp(110px,13vw,150px)'; card.onclick = () => AU.play('w/' + id);
      const pad = Pad(c, plainOf(W(id).d), { guide: 'trace' });
      c.stage.append(card, pad.el); c.solve = pad.solve;
      await c.prompt(['g/wordw', 250, 'w/' + id], TXT['g/wordw'], 'pencil');
      await pad.done; c.chk(); await c.say(['w/' + id, 200, 'g/wgood'], 'خطّ جميل!', 'star');
    }
  },
};

const GROUPS = [
  ['ابدأ هنا', ['learn']],
  ['العب وتعلّم', ['pos', 'sort', 'forms', 'fish', 'match', 'kick', 'race', 'blocks', 'order', 'split']],
  ['اكتب بالقلم', ['write', 'miss', 'dict', 'wordw']],
  ['لوّن وارسم', ['paint', 'color', 'pencils']],
];
const ORDER = GROUPS.flatMap(g => g[1]);
const TOUR = ['pos', 'forms', 'fish', 'kick', 'match', 'miss', 'blocks'];
const WTHEME = { class: '#FFE7A8', road: '#BDE7FF', pitch: '#BDEFC4', garden: '#D7F5C2', sea: '#A9E2FF', art: '#FFD3E2', city: '#FFD2B0', block: '#CBEFA6', jungle: '#C9F0C0' };
const WORLDS = [
  { k: 'pitch', t: 'ملعب الحروف', img: 'f/messi', games: ['kick', 'sort'] },
  { k: 'sea', t: 'عالم البحار', img: 'c/fish1', games: ['fish', 'fish'] },
  { k: 'road', t: 'سباق السيارات', img: 'c/car_red', games: ['race', 'pos'] },
  { k: 'city', t: 'مدينة سبايدرمان', img: 'c/spidey4', games: ['match', 'match'] },
  { k: 'block', t: 'عالم المكعبات', img: 'c/steve', games: ['blocks', 'blocks'] },
  { k: 'jungle', t: 'حديقة الحيوانات', img: 'c/lion', games: ['order', 'split'] },
  { k: 'class', t: 'ركن الكتابة', img: 't/pencil', games: ['dict', 'miss', 'write'] },
  { k: 'art', t: 'مرسم الألوان', img: 't/paint', games: ['paint', 'color', 'pencils'] },
];
const okFor = (g, L) => ({
  fish: L.txtAny.length + L.picsAny.length >= 4, match: L.picsAny.length >= 2, order: shortWords(L, 1).length > 0, split: shortWords(L, 1).length > 0,
  pencils: shortWords(L, 1).length > 0, race: L.picsAny.length > 0, sort: singles(L, true).length >= 2, pos: allSingles(L).length >= 2, miss: allSingles(L).length > 0, wordw: shortWords(L, 1).length > 0,
  forms: allSingles(L).length > 0, color: L.pics.start.length + L.txt.start.length > 0,
}[g] ?? true);

// ------------------------------------------------------------ الشاشات
function setBg(k) { $('#bg').style.backgroundImage = `url(img/bg/${k}.webp)`; }
function show(id) { ['home', 'letter', 'game'].forEach(s => ($('#' + s).hidden = s !== id)); }

function home() {
  RUN++; AU.stop(); show('home'); setBg('home'); TEACH.show(false); $('#endcard').hidden = true;
  const el = $('#home'); el.innerHTML = '';
  const tch = h('img', { class: 'tch sticker', src: 'img/t/hello.webp', alt: 'أستاذ أحمد', onclick: () => AU.play('g/welcome') });
  el.append(h('div', { class: 'sadu' }),
    h('header', { class: 'hero' }, tch, h('div', { class: 'ttl' },
      h('h1', {}, 'لغتي', h('span', { class: 'two' }, 'مع أستاذ أحمد')),
      h('div', { class: 'school' }, h('span', { class: 'tagband' }, 'مدرسة عبدالله بن سلام الابتدائية')),
      h('button', { class: 'say', onclick: () => AU.play('g/welcome') }, '🔊 اختر حرفاً وهيّا نلعب'))),
    h('section', { class: 'sec' },
      h('div', { class: 'sech' }, h('h2', {}, 'الحروف'), h('p', {}, 'كلّ الحروف مفتوحة، ابدأ بأيّ حرف')),
      h('div', { class: 'letters' }, LETTERS.map(L => {
        const col = colorOf(L), s = ST.letter(LK(L));
        return h('button', { class: 'lt', style: { background: col, '--sh': SHADE(col) }, 'aria-label': L.name, onclick: () => { SFX.unlock(); location.hash = '#/' + LK(L); } },
          h('span', {}, L.ch), ST.count(LK(L)) ? h('span', { class: 'st' }, [1, 2, 3].map(i => (i <= s ? h('b', {}, '★') : '★'))) : null);
      }))),
    h('section', { class: 'sec' },
      h('div', { class: 'sech' }, h('h2', {}, 'عوالم اللعب'), h('p', {}, 'ألعاب منوّعة على حروفٍ مختلفة')),
      h('div', { class: 'worlds' }, WORLDS.map(w => h('button', { class: 'wd', style: { '--c': WTHEME[w.k] }, onclick: () => (location.hash = '#/w/' + w.k) }, h('img', { src: `img/${w.img}.webp`, alt: '' }), h('b', {}, w.t))))),
    h('footer', { class: 'dedic' }, h('div', { class: 'card' }, 'إهداء من ابنك إيليا حيدر إلى معلمي ', h('i', {}, '♥')), h('div', { class: 'sadu' })));
  enter($$('.lt', el), 25);
}

function letterPage(L) {
  RUN++; AU.stop(); show('letter'); setBg('home'); TEACH.show(false); $('#endcard').hidden = true;
  const lk = LK(L), col = colorOf(L), el = $('#letter'); el.innerHTML = ''; el.scrollTop = 0;
  el.append(h('div', { class: 'ltop' },
    h('button', { class: 'ibtn back', 'aria-label': 'الرئيسية', onclick: () => (location.hash = '#/'), html: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>' }),
    h('div', { class: 'gtitle' }, h('span', {}, L.name.replace(/[ً-ْ]/g, '')))),
    h('div', { class: 'lhero' },
      h('button', { class: 'bigl', style: { background: col, '--sh': SHADE(col) }, onclick: () => AU.play('n/' + lk) }, h('span', {}, L.forms.alone)),
      h('div', {}, h('p', { class: 'lname' }, L.name),
        h('div', { class: 'syls' }, L.syl.map((s, i) => h('button', { class: 'syl', onclick: () => AU.play(`s/${lk}_${i}`) }, s))),
        h('button', { class: 'tourbtn', onclick: () => (location.hash = `#/${lk}/tour`) }, '🏆 جولة الأبطال'))));
  for (const [gt, gs] of GROUPS) {
    el.append(h('section', { class: 'sec' }, h('div', { class: 'sech' }, h('h2', {}, gt)),
      h('div', { class: 'acts' }, gs.filter(g => okFor(g, L)).map(g => {
        const G = GAMES[g], s = ST.get(lk, g);
        return h('button', { class: 'act', onclick: () => (location.hash = `#/${lk}/${g}`) },
          h('div', { class: 'th', style: { '--c': WTHEME[G.w] } }, h('img', { src: `img/${G.ic}.webp`, alt: '' })),
          h('b', {}, G.t), h('div', { class: 'st' }, [1, 2, 3].map(i => (i <= s ? h('i', {}, '★') : '★'))));
      }))));
  }
  el.append(h('div', { style: { height: '40px' } }));
  enter($$('.act', el), 30);
  AU.play('n/' + lk);
}

async function play(L, g, opt = {}) {
  const G = GAMES[g]; show('game'); setBg(G.w); TEACH.show(true); $('#endcard').hidden = true;
  $('#g-title').textContent = G.t + (L ? ' · ' + L.ch : ''); $('#g-tag').innerHTML = ''; $('#g-dots').innerHTML = '';
  const c = makeCtx(L, G, opt); window.__c = c;
  const r = await G.run(L, c); c.chk();
  return r || (c.mist <= 1 ? 3 : c.mist <= 3 ? 2 : 1);
}

async function runGame(L, g) {
  const lk = LK(L); $('#g-back').onclick = () => (location.hash = '#/' + lk);
  try {
    if (g === 'tour') {
      let tot = 0, n = 0;
      for (const t of TOUR.filter(x => okFor(x, L))) { const s = await play(L, t, { short: true }); ST.set(lk, t, s); tot += s; n++; }
      await endCard(Math.round(tot / Math.max(n, 1)), 'g/tourdone', { again: `#/${lk}/tour`, back: '#/' + lk });
    } else {
      const s = await play(L, g); ST.set(lk, g, s);
      const nx = ORDER[(ORDER.indexOf(g) + 1) % ORDER.length];
      await endCard(s, rnd(['g/done1', 'g/done2', 'g/done3']), { again: `#/${lk}/${g}`, next: `#/${lk}/${nx}`, back: '#/' + lk });
    }
  } catch (e) { if (e !== ABORT) console.error(e); }
}

async function runWorld(k) {
  const w = WORLDS.find(x => x.k === k); if (!w) return home();
  $('#g-back').onclick = () => (location.hash = '#/');
  try {
    let tot = 0;
    for (const g of w.games) {
      const L = rnd(LETTERS.filter(x => okFor(g, x)));
      const s = await play(L, g, { short: true }); ST.set(LK(L), g, s); tot += s;
    }
    await endCard(Math.round(tot / w.games.length), 'g/done2', { again: '#/w/' + k + '?' + Date.now(), back: '#/' });
  } catch (e) { if (e !== ABORT) console.error(e); }
}

async function endCard(stars, au, links) {
  const my = RUN, ec = $('#endcard'); ec.innerHTML = ''; ec.hidden = false; TEACH.show(false);
  SFX.win();
  const go = href => () => { ec.hidden = true; if (location.hash === href) route(); else location.hash = href; };
  ec.append(h('div', { class: 'ocard enter' },
    h('img', { class: 'tch sticker', src: `img/t/${stars === 3 ? 'trophy' : 'clap'}.webp`, alt: '' }),
    h('h2', {}, stars === 3 ? 'بطل الحروف!' : 'أحسنت!'),
    h('div', { class: 'stars' }, [1, 2, 3].map(i => (i <= stars ? h('i', { style: { animationDelay: i * 160 + 'ms' } }, '★') : '★'))),
    h('div', { class: 'row' },
      links.next ? h('button', { class: 'btn', onclick: go(links.next) }, 'اللعبة التالية') : null,
      h('button', { class: 'btn blue', onclick: go(links.again) }, 'مرّة أخرى'),
      h('button', { class: 'btn sec', onclick: go(links.back) }, 'رجوع'))));
  burst($('.ocard', ec), 30);
  await AU.play([au]);
}

function route() {
  const p = location.hash.replace(/^#\/?/, '').replace(/\?.*$/, '').split('/').filter(Boolean).filter(x => x !== 'test');
  $('#endcard').hidden = true; $$('.player,.spidey,.steve').forEach(x => x.remove());
  if (!p.length) return home();
  if (p[0] === 'w') { RUN++; return runWorld(p[1]); }
  const L = LETTERS.find(x => LK(x) === p[0]); if (!L) return home();
  if (p[1] && (GAMES[p[1]] || p[1] === 'tour')) { RUN++; return runGame(L, p[1]); }
  letterPage(L);
}

function splash() {
  const s = $('#splash'); s.innerHTML = '';
  s.append(h('div', { class: 'ocard enter' },
    h('img', { class: 'tch sticker', src: 'img/t/hello.webp', alt: 'أستاذ أحمد' }),
    h('h2', {}, 'لغتي مع أستاذ أحمد'),
    h('p', {}, 'مدرسة عبدالله بن سلام الابتدائية'),
    h('button', { class: 'btn play', onclick: () => { SFX.unlock(); s.hidden = true; AU.play('g/welcome'); } }, 'هيّا نلعب')));
}

window.addEventListener('hashchange', route);
document.addEventListener('contextmenu', e => e.preventDefault());
if (TEST) { $('#splash').hidden = true; window.__solve = () => window.__c && window.__c.solve && window.__c.solve(); }
else splash();
route();
