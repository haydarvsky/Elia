'use strict';
/* جزر الكنز — العالم الثاني من ألعاب إيليا (الوحدة الرابعة من «لغتي العربية»، الصف الأول، ص ١٩٨–٢٥٥).
   البيانات في data.js (مولّدة من _build/juzur/content.py)، الصور في img/ والأصوات في audio/ بصوت أستاذ حيدر.
   التقدّم: localStorage «elia-juzur-v1» ويُزامَن عبر save.js (قيمٌ لا تنقص: الجواهر والنجوم والأسلحة).
   تسجيلات الصوت وصور الكتابة تبقى في الآيباد وحده (IndexedDB) وتُسمع من «لوحة بابا».
   للاختبار: ?test يكشف window.JZ، و ?test&auto يجيب آلياً عن كل تمرين. */
const V = 1;
const Q = location.search + location.hash;
const LOCALHOST = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const TEST = LOCALHOST && /test/.test(Q), AUTO = TEST && /auto/.test(Q);   // الاختبار الآلي على الجهاز المحلي فقط
// اللاعبان: إيليا (مساعده أبوه أستاذ حيدر وصديقه محمد عطية) ومحمد عطية (مساعده أبوه أستاذ عطية وصديقه إيليا)
for (const [id, p] of Object.entries(DATA.PLAYERS)) p.id = id;
let P = DATA.PLAYERS.elia, KEY = P.key;
const pv = o => (o && P.id !== 'elia' && o[P.id]) ? Object.assign({}, o, o[P.id]) : o;   // نسخة اللاعب من الجملة أو التمرين

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
const mixed = a => { if (a.length < 2) return [...a]; let s; do { s = shuffle(a); } while (s.every((x, i) => x === a[i])); return s; };
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const IMG = p => `img/${p}.webp`;
const STARS = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
const RAR = [{ n: 'شائِعٌ', c: 'var(--r0)' }, { n: 'غَيْرُ شائِعٍ', c: 'var(--r1)' }, { n: 'نادِرٌ', c: 'var(--r2)' }, { n: 'مَلْحَمِيٌّ', c: 'var(--r3)' }, { n: 'أُسْطورِيٌّ', c: 'var(--r4)' }];
const MARKS = /[ً-ٰٟـ]/g;
const bare = s => s.replace(MARKS, '');
function norm(s) {
  return bare(s).replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function lev(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
// هل سمع التعرّفُ الكلامَ المطلوب؟ (مساعدٌ فقط، لا يُرسب أحداً)
function heardOk(target, alts) {
  const T = norm(target).split(' ').filter(Boolean); if (!T.length) return null;
  const near = (w, t) => w === t || w === 'ال' + t || (t.length >= 3 && lev(w, t) <= 1);
  for (const alt of alts) {
    const W = norm(alt).split(' ').filter(Boolean);
    const hit = T.filter(t => W.some(w => near(w, t))).length;
    if (T.length === 1 ? hit === 1 : hit / T.length >= 0.6) return true;
  }
  return false;
}

// ------------------------------------------------------------ الصوت
const AU = (() => {
  const el = new Audio(); el.preload = 'auto';
  let tok = 0;
  const url = k => `audio/${k}.mp3?v=${V}`;
  function one(src, my, onT) {
    return new Promise(res => {
      let raf = 0, done = false;
      const t = setTimeout(fin, 25000);
      function fin() { if (done) return; done = true; clearTimeout(t); cancelAnimationFrame(raf); el.onended = el.onerror = null; if (onT) onT(-1); res(); }
      el.onended = fin; el.onerror = fin;
      el.src = src; const p = el.play(); if (p) p.catch(fin);
      if (onT) { const tick = () => { if (my !== tok) return fin(); onT(el.currentTime, el.duration || 0); raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); }
    });
  }
  async function play(keys, onT) {
    const my = ++tok; keys = [].concat(keys).filter(k => k != null);
    for (const k of keys) {
      if (my !== tok) return false;
      if (typeof k === 'number') { await sleep(k); continue; }
      if (AUTO) { await sleep(30); continue; }
      await one(url(k), my, onT);
    }
    return my === tok;
  }
  async function playBlob(blob) { if (!blob || AUTO) return; const my = ++tok, u = URL.createObjectURL(blob); await one(u, my); URL.revokeObjectURL(u); }
  function unlock() { try { el.load(); } catch (e) {} }
  return { el, play, playBlob, unlock, stop() { tok++; el.pause(); } };
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
  function noise(d, f1, f2, v = 0.2, q = 1, at = 0) {
    try {
      const a = C(), t = a.currentTime + at, n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(bp).connect(g).connect(a.destination); s.start(t);
    } catch (e) {}
  }
  return {
    unlock: () => C(),
    pop: () => tone(520, 0.09, 'sine', 0.2, 380),
    ding: () => { tone(880, 0.14, 'triangle', 0.16); tone(1318, 0.22, 'triangle', 0.14, 0, 0.09); },
    buzz: () => tone(150, 0.25, 'sawtooth', 0.08, -50),
    whoosh: () => noise(0.5, 600, 3200, 0.16, 0.8),
    rumble: () => { noise(0.7, 200, 120, 0.25, 0.7); tone(70, 0.6, 'square', 0.05, -20); },
    open: () => { noise(0.35, 3000, 800, 0.25, 1.2); [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, 0, 0.12 + i * 0.08)); },
    coin: (i = 0) => tone(1400 + (i % 5) * 90, 0.08, 'square', 0.04),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, 0, i * 0.11)),
    rec: () => { tone(660, 0.08, 'sine', 0.12); tone(990, 0.1, 'sine', 0.12, 0, 0.09); },
  };
})();

// ------------------------------------------------------------ الحالة
const ST = (() => {
  const blank = () => ({ v: 1, gems: 0, done: {}, loot: {}, unl: {}, eq: '', chests: 0, seen: {}, bonus: 0 });
  let d = load();
  function load() { try { const x = JSON.parse(localStorage.getItem(KEY)); return x ? Object.assign(blank(), x) : blank(); } catch (e) { return blank(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} if (window.EliaSave) EliaSave.push(); }
  return {
    get d() { return d; }, save, reload() { d = load(); }, use() { d = load(); },
    stars: mid => d.done[mid] || 0,
    totalStars: () => Object.values(d.done).reduce((a, b) => a + b, 0),
    reset() { const r = Date.now(); d = blank(); d.rst = r; save(); },
  };
})();
const ISL = DATA.ISLANDS;
const missionsOf = isl => (isl.locs || []).flatMap(l => l.missions);
const ALLM = ISL.flatMap(missionsOf);
const islDone = isl => { const ms = missionsOf(isl); return ms.length > 0 && ms.every(m => ST.stars(m.id) > 0); };
const islProg = isl => { const ms = missionsOf(isl); return ms.length ? ms.filter(m => ST.stars(m.id) > 0).length / ms.length : 0; };
function islOpen(isl) {
  if (isl.soon) return false;
  if (ST.d.unl[isl.id]) return true;
  const i = ISL.indexOf(isl); if (i === 0) return true;
  const prev = ISL.slice(0, i).reverse().find(x => !x.soon);
  return prev ? islDone(prev) : true;
}
const wallet = () => (P.id === 'elia' && window.EliaShop ? EliaShop.balance() : ST.d.gems);

// ------------------------------------------------------------ التسجيلات (على الجهاز فقط)
const REC = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('noidb'));
    const r = indexedDB.open('elia-juzur', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('items', { keyPath: 'id', autoIncrement: true }); s.createIndex('k', 'k'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  async function run(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => { const t = db.transaction('items', mode), q = fn(t.objectStore('items')); t.oncomplete = () => res(q && 'result' in q ? q.result : undefined); t.onerror = () => rej(t.error); });
  }
  return {
    async add(o) {
      try {
        const buf = o.blob ? await o.blob.arrayBuffer() : null;
        const rec = { pl: P.id, k: P.id + ':' + o.k, mid: o.mid, kind: o.kind, text: o.text, heard: o.heard == null ? null : !!o.heard, rt: o.rt || '', buf, mime: o.blob ? o.blob.type : '', ts: Date.now() };
        await run('readwrite', s => s.add(rec));
        const same = (await run('readonly', s => s.index('k').getAll(P.id + ':' + o.k))) || [];
        same.sort((a, b) => b.ts - a.ts).slice(3).forEach(x => run('readwrite', s => s.delete(x.id)));
      } catch (e) {}
    },
    async all() { try { return (await run('readonly', s => s.getAll())) || []; } catch (e) { return []; } },
    async del(id) { try { await run('readwrite', s => s.delete(id)); } catch (e) {} },
    blob: r => new Blob([r.buf], { type: r.mime || 'audio/mp4' }),
  };
})();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {}

// ------------------------------------------------------------ المايك والتعرّف المساعد
const MIC = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let srOff = !SR; try { if (localStorage.getItem('juzur-sr') === 'off') srOff = true; } catch (e) {}
  const mimeOf = () => { for (const t of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) {} } return ''; };
  async function record({ secs = 8, target = '', onLevel, stopper }) {
    if (AUTO) { await sleep(40); return { blob: new Blob([new Uint8Array(2000)], { type: 'audio/mp4' }), heard: target ? true : null, rt: target }; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return { err: 'nomic' };
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { return { err: 'denied' }; }
    const mime = mimeOf(); let rec;
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { stream.getTracks().forEach(t => t.stop()); return { err: 'nomic' }; }
    const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    let ac2 = null, raf = 0;
    try {
      ac2 = new (window.AudioContext || window.webkitAudioContext)(); const an = ac2.createAnalyser(); an.fftSize = 512;
      ac2.createMediaStreamSource(stream).connect(an); const buf = new Uint8Array(an.fftSize);
      const tick = () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); if (onLevel) onLevel(Math.min(1, m / 50)); raf = requestAnimationFrame(tick); }; tick();
    } catch (e) {}
    const alts = []; let sr = null, srErr = null;
    if (!srOff && target) {
      try {
        sr = new SR(); sr.lang = 'ar-SA'; sr.continuous = true; sr.interimResults = true; sr.maxAlternatives = 5;
        sr.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) for (let j = 0; j < e.results[i].length; j++) alts.push(e.results[i][j].transcript); };
        sr.onerror = e => { srErr = e.error || 'err'; };
        sr.start();
      } catch (e) { sr = null; }
    }
    rec.start(250);
    await Promise.race([sleep(secs * 1000), stopper]);
    await new Promise(r => { rec.onstop = r; try { rec.stop(); } catch (e) { r(); } setTimeout(r, 1500); });
    if (sr) { try { sr.stop(); } catch (e) {} await sleep(700); }
    cancelAnimationFrame(raf); if (onLevel) onLevel(0);
    try { ac2 && ac2.close(); } catch (e) {}
    stream.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' });
    // إن أفسد التعرّفُ التسجيلَ على هذا الجهاز نقدّم التسجيل ونوقف التعرّف لبقية الجلسة
    if (sr && blob.size < 1500) srOff = true;
    if (['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(srErr)) srOff = true;
    const heard = sr && (alts.length || srErr === 'no-speech') ? heardOk(target, alts) : null;
    return { blob, heard, rt: alts[alts.length - 1] || '' };
  }
  return {
    record,
    get sr() { return !srOff; }, get srExists() { return !!SR; },
    setSR(on) { srOff = !on || !SR; try { localStorage.setItem('juzur-sr', on ? 'on' : 'off'); } catch (e) {} },
  };
})();

// ------------------------------------------------------------ القائد والشاشات
const CAP = (() => {
  const box = $('#cap'), img = $('#cap-img'), bub = $('#cap-b'); let bt, cur = 'hello';
  const preload = () => ['hello', 'point', 'thumbs', 'clap', 'read', 'scope'].forEach(p => { const i = new Image(); i.src = IMG(P.himg + '/' + p); }); preload();
  return {
    show(on) { box.hidden = !on; },
    pose(p) { if (p === cur) { img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop'); return; } cur = p; img.src = IMG(P.himg + '/' + p); img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop'); },
    say(text, ms) { clearTimeout(bt); bub.textContent = text || ''; bub.classList.toggle('on', !!text); if (ms) bt = setTimeout(() => bub.classList.remove('on'), ms); },
    onTap(fn) { img.onclick = fn; },
    reset() { cur = 'hello'; preload(); img.src = IMG(P.himg + '/hello'); img.alt = P.helper; },
  };
})();
function show(id) { $$('.screen').forEach(s => { s.hidden = s.id !== id; }); document.body.classList.toggle('playing', id === 'play'); }
function toast(t, ms = 2200) { const e = h('div', { class: 'toast' }, t); document.body.append(e); setTimeout(() => e.remove(), ms); }
function burst(el, n = 18) {
  if (!el || !el.getBoundingClientRect) return;
  const r = el.getBoundingClientRect(), fx = $('#fx'), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const COL = ['#ffc83d', '#3aa6ff', '#b65cff', '#3ccf6b', '#ff3d5a', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = 70 + Math.random() * 90;
    const s = h('i', { class: 'spark', style: { left: cx + 'px', top: cy + 'px', background: rnd(COL), borderRadius: Math.random() < 0.5 ? '50%' : '3px' } });
    s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d + 'px');
    fx.append(s); setTimeout(() => s.remove(), 1000);
  }
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function bump(id) { const e = $(id); if (!e) return; e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
function wordSpans(tx, spans) {
  const out = [];
  tx.split(' ').forEach((w, i) => { if (i) out.push(' '); const s = h('span', { class: 'w' }, w); spans.push(s); out.push(s); });
  return out;
}
// تظليل الكلمة المنطوقة: بتوقيت ويسبر إن وُجد، وإلا تقديرٌ بطول الكلمات
function follow(spans, tm) {
  let cum = null;
  return (t, dur) => {
    if (t < 0) { spans.forEach(s => s.classList.remove('on')); return; }
    let k = -1;
    if (tm && tm.length === spans.length) { for (let i = 0; i < tm.length; i++) if (t >= tm[i][0] - 0.06) k = i; if (k >= 0 && t > tm[k][1] + 0.35 && k === tm.length - 1) k = -1; }
    else if (dur > 0) {
      if (!cum) { const L = spans.map(s => bare(s.textContent).length + 1), tot = L.reduce((a, b) => a + b, 0); let c = 0; cum = L.map(l => (c += l) / tot); }
      const f = t / dur; k = cum.findIndex(x => f < x);
    }
    spans.forEach((s, i) => s.classList.toggle('on', i === k));
  };
}
const SVG = {
  face: '<svg viewBox="0 0 100 100" class="svgic"><circle cx="50" cy="50" r="44" fill="#d9c8f2" stroke="#6b3fa0" stroke-width="4"/><circle cx="36" cy="42" r="9" fill="#fff" stroke="#222" stroke-width="3"/><circle cx="64" cy="42" r="9" fill="#fff" stroke="#222" stroke-width="3"/><circle cx="37" cy="43" r="4"/><circle cx="63" cy="43" r="4"/><path d="M30 60 Q50 82 70 60 Z" fill="#a0284a"/></svg>',
  faceoval: '<svg viewBox="0 0 100 100" class="svgic"><ellipse cx="50" cy="50" rx="32" ry="46" fill="#d9c8f2" stroke="#6b3fa0" stroke-width="4"/><circle cx="39" cy="40" r="8" fill="#fff" stroke="#222" stroke-width="3"/><circle cx="61" cy="40" r="8" fill="#fff" stroke="#222" stroke-width="3"/><circle cx="40" cy="41" r="3.5"/><circle cx="60" cy="41" r="3.5"/><path d="M36 62 Q50 80 64 62 Z" fill="#a0284a"/></svg>',
  tri: '<svg viewBox="0 0 100 100" class="svgic"><path d="M50 10 L92 88 L8 88 Z" fill="#c8eaf0" stroke="#2a6a78" stroke-width="5" stroke-linejoin="round"/></svg>',
  circle: '<svg viewBox="0 0 100 100" class="svgic"><circle cx="50" cy="50" r="40" fill="#c8eaf0" stroke="#2a6a78" stroke-width="5"/></svg>',
  rect: '<svg viewBox="0 0 100 100" class="svgic"><rect x="22" y="8" width="56" height="84" rx="3" fill="#c8eaf0" stroke="#2a6a78" stroke-width="5"/></svg>',
  square: '<svg viewBox="0 0 100 100" class="svgic" style="width:70px;height:70px"><rect x="12" y="12" width="76" height="76" fill="#2f7d3a" stroke="#123" stroke-width="5"/></svg>',
};

// ------------------------------------------------------------ لوح القلم (من «لغتي»، مع تطويعٍ للكلمات والجمل)
const FONT = px => `800 ${px}px Sakkal`;
let penSeen = false;
function inkBox(text, px, W, H) {
  const c = document.createElement('canvas').getContext('2d'); c.font = FONT(px);
  const m = c.measureText(text), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  return { y: (H - (asc + desc)) / 2 + asc };
}
function grid(W, H, draw, G = 96) {
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
// التغطية تُقاس على جسم الحروف بلا تشكيل (فالحركات اختيارية)، والدقّة على الرسم كاملاً بتشكيله
function scoreInk(strokes, text, px, W, H, brush, normalize, lenient) {
  const len = strokes.reduce((a, s) => a + s.reduce((b, p, i) => b + (i ? Math.hypot(p[0] - s[i - 1][0], p[1] - s[i - 1][1]) : 0), 0), 0);
  if (len < 25 && strokes.flat().length < 12) return { pass: false, why: 'empty' };
  const y = inkBox(text, px, W, H).y, N = Math.round(Math.min(220, Math.max(96, W / 5)));
  const drawT = t => c => { c.font = FONT(px); c.textAlign = 'center'; c.fillText(t, W / 2, y); };
  const G = grid(W, H, drawT(bare(text)), N), GF = grid(W, H, drawT(text), N);
  let S = strokes;
  if (normalize) {
    let gx0 = 1e9, gy0 = 1e9, gx1 = -1e9, gy1 = -1e9;
    for (let i = 0; i < G.m.length; i++) if (G.m[i]) { const x = i % G.gw, yy = (i / G.gw) | 0; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, yy); gy1 = Math.max(gy1, yy); }
    [gx0, gx1, gy0, gy1] = [gx0 / G.sc, (gx1 + 1) / G.sc, gy0 / G.sc, (gy1 + 1) / G.sc];
    let ix0 = 1e9, iy0 = 1e9, ix1 = -1e9, iy1 = -1e9;
    S.flat().forEach(([x, yy]) => { ix0 = Math.min(ix0, x); ix1 = Math.max(ix1, x); iy0 = Math.min(iy0, yy); iy1 = Math.max(iy1, yy); });
    const iw = Math.max(ix1 - ix0, 20), ih = Math.max(iy1 - iy0, 20), gw = gx1 - gx0, gh = gy1 - gy0;
    let sx = gw / iw, sy = gh / ih; const r = sy / sx; if (r > 1.8) sy = sx * 1.8; if (r < 0.55) sy = sx * 0.55;
    const cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2, gcx = (gx0 + gx1) / 2, gcy = (gy0 + gy1) / 2;
    S = S.map(s => s.map(([x, yy]) => [gcx + (x - cx) * sx, gcy + (yy - cy) * sy]));
  }
  const I = grid(W, H, c => { c.lineCap = c.lineJoin = 'round'; c.lineWidth = brush * 0.8; c.strokeStyle = '#000'; S.forEach(s => { c.beginPath(); s.forEach(([x, yy], i) => (i ? c.lineTo(x, yy) : c.moveTo(x, yy))); if (s.length === 1) c.lineTo(s[0][0] + 0.1, s[0][1]); c.stroke(); }); }, N);
  const k = Math.max(2, Math.round(N / 48)), Id = dilate(I, k), Gd = dilate(GF, Math.max(1, k - 1));
  const parts = comps(G).filter(p => p.length >= 3), big = Math.max(...parts.map(p => p.length));
  const L = lenient * 0.08; let ok = true, covs = [], tot = 0, got = 0;
  for (const p of parts) {
    const cov = p.filter(i => Id.m[i]).length / p.length; covs.push(cov); tot += p.length; got += cov * p.length;
    const need = p.length > big * 0.35 ? 0.58 - L : 0.33 - L / 2;
    if (cov < need) ok = false;
  }
  let inside = 0, n = 0; for (let i = 0; i < I.m.length; i++) if (I.m[i]) { n++; if (Gd.m[i]) inside++; }
  const prec = n ? inside / n : 0;
  if (prec < 0.78 - L) ok = false;
  return { pass: ok, cov: tot ? got / tot : 0, prec };
}
function Pad(text, { guide = 'trace', maxW = 900, model = false } = {}) {
  const stageW = Math.max(300, Math.min($('#stage').clientWidth - 60, maxW));
  const words = text.split(' ').length;
  const Wd = stageW, Ht = Math.round(Math.min(Math.max(Wd * (words > 2 ? 0.28 : 0.36), 160), window.innerHeight * 0.3));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = h('canvas', { width: Wd * dpr, height: Ht * dpr, style: { width: Wd + 'px', height: Ht + 'px' } });
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  let px = Math.round(Ht * 0.56); { const t = document.createElement('canvas').getContext('2d'); t.font = FONT(px); const mw = t.measureText(text).width; if (mw > Wd * 0.88) px = Math.floor(px * Wd * 0.88 / mw); }
  const brush = Math.max(9, Math.round(px * 0.1));
  let strokes = [], cur = null, mode = guide;
  function paint() {
    g.clearRect(0, 0, Wd, Ht); g.fillStyle = '#fff'; g.fillRect(0, 0, Wd, Ht);
    g.strokeStyle = '#dbe4fb'; g.lineWidth = 2;
    const y = inkBox(text, px, Wd, Ht).y;
    [y, y - px * 0.5].forEach(yy => { g.beginPath(); g.moveTo(14, yy); g.lineTo(Wd - 14, yy); g.stroke(); });
    if (mode !== 'none') {
      g.font = FONT(px); g.textAlign = 'center';
      g.fillStyle = mode === 'trace' ? '#eef3fe' : 'rgba(44,85,214,.10)';
      g.fillText(text, Wd / 2, y);
      if (mode === 'trace') { g.setLineDash([2, 9]); g.lineCap = 'round'; g.lineWidth = 3.5; g.strokeStyle = '#8ea6e8'; g.strokeText(text, Wd / 2, y); g.setLineDash([]); }
    }
    g.lineCap = g.lineJoin = 'round'; g.lineWidth = brush; g.strokeStyle = '#2c55d6';
    for (const s of strokes) { g.beginPath(); s.forEach(([x, yy], i) => (i ? g.lineTo(x, yy) : g.moveTo(x, yy))); if (s.length === 1) g.lineTo(s[0][0] + 0.1, s[0][1]); g.stroke(); }
  }
  const P = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * Wd / r.width, (e.clientY - r.top) * Ht / r.height]; };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') penSeen = true;
    else if (penSeen && e.pointerType === 'touch') return;      // راحة الكف على الشاشة لا ترسم
    e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [P(e)]; strokes.push(cur); paint();
  });
  cv.addEventListener('pointermove', e => { if (!cur) return; const p = P(e), l = cur[cur.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.2) { cur.push(p); paint(); } });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const wrap = h('div', { class: 'pad' }, cv);
  document.fonts.load(FONT(40)).then(paint); paint();
  return {
    el: wrap, wrap,
    clear() { strokes = []; paint(); },
    get empty() { return !strokes.length; },
    setMode(m) { mode = m; paint(); },
    score(normalize, lenient) { return scoreInk(strokes, text, px, Wd, Ht, brush, normalize, lenient); },
    png() { return new Promise(r => cv.toBlob(b => r(b), 'image/png')); },
    solve() { strokes = []; const y = inkBox(text, px, Wd, Ht).y; const G2 = grid(Wd, Ht, c2 => { c2.font = FONT(px); c2.textAlign = 'center'; c2.fillText(text, Wd / 2, y); }, 160); for (let i = 0; i < G2.m.length; i++) if (G2.m[i]) strokes.push([[(i % G2.gw + 0.5) / G2.sc, (((i / G2.gw) | 0) + 0.5) / G2.sc]]); paint(); },
  };
}

// ------------------------------------------------------------ سياق التحدّي
const ABORT = Symbol('abort');
let RUN = 0, abortNow = null;
function ctx(m, isl) {
  const my = ++RUN, stage = $('#stage'); let mist = 0, replay = null;
  let rejecter; const aborted = new Promise((_, rej) => { rejecter = rej; }); aborted.catch(() => {});
  abortNow = () => { RUN++; AU.stop(); rejecter(ABORT); };
  const chk = () => { if (my !== RUN) throw ABORT; };
  const c = {
    m, isl, stage, chk, get mist() { return mist; }, heard: 0,
    w: p => Promise.race([p, aborted]),
    clear() { chk(); stage.innerHTML = ''; stage.scrollTop = 0; },
    card(...kids) { const e = h('div', { class: 'card' }, ...kids); stage.append(e); return e; },
    async prompt(a, text, pose = 'point') { chk(); replay = { a, text, pose }; CAP.pose(pose); CAP.say(text); await c.w(AU.play(a)); chk(); },
    async say(a, text, pose) { chk(); if (pose) CAP.pose(pose); if (text) CAP.say(text, 3200); await c.w(AU.play(a)); chk(); },
    again() { if (replay) { CAP.pose(replay.pose); CAP.say(replay.text); AU.play(replay.a); } },
    async good(el, quiet) {
      chk(); SFX.ding(); burst(el); CAP.pose(rnd(['thumbs', 'clap']));
      if (!quiet && Math.random() < 0.5) { const g = pv(rnd(DATA.GOOD)); CAP.say(g.tx, 2000); await c.w(AU.play(g.a)); } else await c.w(sleep(AUTO ? 10 : 450));
      chk();
    },
    async bad(el) { chk(); mist++; SFX.buzz(); shake(el); CAP.pose('point'); const b = rnd(DATA.BAD); CAP.say(b.tx, 2000); await c.w(AU.play(b.a)); chk(); },
    tap(el) { if (AUTO) return sleep(5); return c.w(new Promise(r => { el.addEventListener('click', function f() { el.removeEventListener('click', f); SFX.pop(); r(); }); })); },
    choose(els) { if (AUTO) return Promise.resolve(els[els.length - 1]); return c.w(new Promise(r => els.forEach(e => e.addEventListener('click', () => { SFX.pop(); r(e); }, { once: true })))); },
    pickOne(els, auto) { if (AUTO) return Promise.resolve(auto); return c.w(new Promise(r => els.forEach((e, i) => { e.onclick = () => { if (!e.classList.contains('no') && !e.classList.contains('ok')) r(i); }; }))); },
    async next(card, label = 'التّالي ◀') { const b = h('button', { class: 'btn green next' }, h('span', null, label)); card.append(b); b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); await c.tap(b); },
  };
  return c;
}
const btn = (label, cls = '') => h('button', { class: 'btn ' + cls }, h('span', null, label));
function optEl(o, extra = '') {
  const e = h('button', { class: 'opt ' + extra + (o.tx && !o.img && !o.svg ? (bare(o.tx).length > 8 ? ' txt' : '') : '') });
  if (o.svg) e.insertAdjacentHTML('beforeend', SVG[o.svg]);
  if (o.img) e.append(h('img', { src: IMG(o.img), alt: '' }));
  if (o.tx) e.append(h('span', null, o.tx));
  if (o.a) { const s = h('span', { class: 'say', role: 'button', 'aria-label': 'اسمع' }, '🔊'); s.addEventListener('click', ev => { ev.stopPropagation(); AU.play(o.a); }); e.append(s); }
  return e;
}

// ------------------------------------------------------------ التسجيل بواجهةٍ للطفل
async function recordUI(c, mic, timer, opts) {
  let stopR; const stopper = new Promise(r => { stopR = r; });
  mic.classList.add('rec'); mic.textContent = '⏹'; SFX.rec();
  const onclick = () => stopR(); mic.addEventListener('click', onclick);
  const t0 = Date.now(), iv = setInterval(() => { const s = Math.max(0, Math.ceil(opts.secs - (Date.now() - t0) / 1000)); timer.textContent = `🔴 أُسَجِّلُ… ${AR(s)}`; }, 250);
  const r = await c.w(MIC.record({ ...opts, stopper, onLevel: v => mic.style.setProperty('--lv', v.toFixed(2)) }));
  clearInterval(iv); mic.removeEventListener('click', onclick); mic.classList.remove('rec'); mic.textContent = '🎙️'; timer.textContent = '';
  return r;
}
async function readStep(c, card, { text, model, tm, secs = 8, kind = 'read', idx = 0, spans }) {
  const st = h('p', { class: 'heard' }), timer = h('p', { class: 'timer' });
  const mic = h('button', { class: 'mic', 'aria-label': 'سجّل' }, '🎙️');
  const modelB = model ? h('button', { class: 'pill' }, '🔊 اسْمَعْ') : null;
  const mineB = h('button', { class: 'pill', hidden: true }, '▶ صَوْتي');
  const bar = h('div', { class: 'recbar' }, modelB, mic, mineB);
  card.append(bar, timer, st);
  if (modelB) modelB.onclick = () => AU.play(model, spans ? follow(spans, tm) : null);
  let blob = null;
  for (;;) {
    await c.tap(mic);
    const r = await recordUI(c, mic, timer, { secs, target: kind === 'read' ? text : '' });
    if (r.err) {
      st.textContent = r.err === 'denied' ? 'اسْمَحْ لِلْميكروفونِ مِنْ إِعْداداتِ سَفاري، ثُمَّ أَعِدِ الْمُحاوَلَةَ.' : 'الْميكروفونُ غَيْرُ مُتاحٍ في هذا الْمُتَصَفِّحِ.';
      st.className = 'heard mid2';
      const skip = btn('تَخَطَّ ◀', 'sec'), retry = btn('↺ أُحاوِلُ', 'green');
      const row = h('div', { class: 'padtools' }, retry, skip); card.append(row);
      const ch = await c.choose([retry, skip]); row.remove();
      if (ch === skip) return null; continue;
    }
    blob = r.blob; mineB.hidden = false; mineB.onclick = () => AU.playBlob(blob);
    REC.add({ k: `${c.m.id}:${idx}:${kind}`, mid: c.m.id, kind, text, blob, heard: r.heard, rt: r.rt });
    await c.w(AU.playBlob(blob)); c.chk();
    if (kind === 'read') {
      if (r.heard === true) { c.heard++; st.className = 'heard'; st.textContent = '✔ سَمِعْتُكَ بِوُضوحٍ'; burst(mic); await c.say(DATA.G.rec_heard.a, DATA.G.rec_heard.tx, 'thumbs'); }
      else { st.className = 'heard mid2'; st.textContent = '✔ حُفِظَ صَوْتُكَ'; await c.say(DATA.G.rec_saved.a, DATA.G.rec_saved.tx, 'point'); }
    } else { st.className = 'heard'; st.textContent = '✔ حُفِظَتْ إِجابَتُكَ'; await c.say(DATA.G.talk_saved.a, DATA.G.talk_saved.tx, 'thumbs'); }
    const again = btn('↺ أُعيدُ', 'sec'), nx = btn('التّالي ◀', 'green');
    const row = h('div', { class: 'padtools' }, again, nx); card.append(row); nx.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const ch = await c.choose([again, nx]); row.remove();
    if (ch === nx) return blob;
    st.textContent = '';
  }
}

// ------------------------------------------------------------ التمارين
const R = {
  async say(c, it) {
    c.clear();
    const card = c.card(it.img ? h('img', { class: 'pic', src: IMG(it.img) }) : null, h('p', { class: 'q', style: { fontSize: 'clamp(28px,3.4vw,40px)' } }, it.tx));
    await c.prompt(it.a, it.tx, it.pose || 'point');
    await c.next(card);
  },
  async read(c, it, idx) {
    c.clear();
    const spans = [], multi = it.tx.split(' ').length > 1;
    const card = c.card(it.img ? h('img', { class: 'pic', src: IMG(it.img) }) : null, h('p', { class: multi ? 'mid' : 'big' }, ...wordSpans(it.tx, spans)));
    if (it.q) await c.prompt(it.qa, it.q, 'point'); else CAP.say('');
    if (it.a) { CAP.pose('read'); await c.w(AU.play(it.a, follow(spans, it.tm))); c.chk(); }
    await readStep(c, card, { text: it.tx, model: it.a, tm: it.tm, secs: it.secs || (multi ? 8 : 5), idx, spans });
  },
  async talk(c, it, idx) {
    c.clear();
    const pics = it.imgs ? h('div', { class: 'row' }, it.imgs.map(p => h('img', { class: 'pic wide', src: IMG(p), style: { maxWidth: '30%' } }))) : it.img ? h('img', { class: it.img.startsWith('sc/') || it.img.startsWith('st/') ? 'pic wide' : 'pic', src: IMG(it.img) }) : null;
    const card = c.card(pics, h('p', { class: 'q', style: { fontSize: 'clamp(28px,3.6vw,42px)' } }, it.q));
    await c.prompt(it.qa, it.q, 'point');
    await readStep(c, card, { text: it.q, model: it.qa, secs: it.secs || 30, kind: 'talk', idx });
    if (it.exa) { CAP.say(it.ex); await c.w(AU.play(it.exa)); }
  },
  async pick(c, it) {
    c.clear();
    const card = c.card();
    if (it.ref) card.append(it.ref.startsWith('svg:') ? h('div', { class: 'ref', html: `<span>شَكْلُ الْمُرَبَّعِ:</span>${SVG[it.ref.slice(4)]}` }) : h('div', { class: 'ref' }, h('span', { class: 'syl' }, it.ref)));
    if (it.stimg) card.append(h('img', { class: 'pic', src: IMG(it.stimg) }));
    if (it.stim) card.append(h('p', { class: it.big ? 'big' : 'mid', style: it.stimg && it.after ? { textDecoration: 'line-through red 4px' } : null }, it.stim));
    const els = it.opts.map(o => optEl(o, (it.big ? 'syl ' : '') + (it.color ? 'gray' : '')));
    card.append(h('div', { class: 'row' }, els));
    let answered = false;
    const pr = c.prompt(it.qa, it.q, 'point').catch(() => {});
    const ok = [].concat(it.ok), okSet = new Set(ok);
    if (!it.multi && it.opts.some(o => o.a)) pr.then(async () => { for (let i = 0; i < els.length && !answered; i++) { els[i].classList.add('hl'); await AU.play(it.opts[i].a); els[i].classList.remove('hl'); } }).catch(() => {});
    if (!it.multi) {
      for (;;) {
        const i = await c.pickOne(els, ok[0]); answered = true; els.forEach(e => e.classList.remove('hl'));
        if (okSet.has(i)) { els[i].classList.add('ok'); await c.good(els[i], !!it.after); if (it.after) await c.w(AU.play(it.after)); break; }
        els[i].classList.add('no'); await c.bad(els[i]);
      }
    } else {
      const found = new Set();
      while (found.size < okSet.size) {
        const i = await c.pickOne(els, ok.find(x => !found.has(x)));
        if (it.opts[i].a) AU.play(it.opts[i].a);
        if (okSet.has(i)) { found.add(i); els[i].classList.add('ok'); SFX.ding(); burst(els[i]); await c.w(sleep(AUTO ? 5 : 700)); }
        else { els[i].classList.add('no'); await c.w(sleep(AUTO ? 5 : 700)); await c.bad(els[i]); }
      }
      await c.good(card);
    }
    await c.w(sleep(AUTO ? 5 : 450));
  },
  async tf(c, it) {
    c.clear();
    const spans = [];
    const yes = h('button', { class: 'opt' }, '✓ صَحيحٌ'), no = h('button', { class: 'opt' }, '✗ خَطَأٌ');
    const card = c.card(it.img ? h('img', { class: 'pic', src: IMG(it.img) }) : null, h('p', { class: 'mid' }, ...wordSpans(it.tx, spans)), h('div', { class: 'tfrow' }, yes, no));
    CAP.pose('point'); CAP.say('صَحيحٌ أَمْ خَطَأٌ؟');
    AU.play(it.a, follow(spans, it.tm));
    const els = [yes, no], right = it.ok ? 0 : 1;
    for (;;) {
      const i = await c.pickOne(els, right);
      if (i === right) { els[i].classList.add('ok'); await c.good(els[i]); break; }
      els[i].classList.add('no'); await c.bad(els[i]);
    }
  },
  async match(c, it) {
    c.clear();
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'lines');
    const colA = h('div', { class: 'col' }), colB = h('div', { class: 'col' }), wrap = h('div', { class: 'match' }, colA, colB);
    const A = it.L.map((o, i) => { const e = optEl(o); e.dataset.i = i; colA.append(e); return e; });
    const B = [], order = mixed(it.R.map((_, i) => i));
    order.forEach(i => { const e = optEl(it.R[i]); e.dataset.i = i; colB.append(e); B[i] = e; });
    wrap.append(svg); c.card(wrap);
    c.prompt(it.qa, it.q, 'point').catch(() => {});
    const COL = ['#3aa6ff', '#ff9d00', '#b65cff', '#3ccf6b'];
    const link = (a, b, col) => {
      const W = wrap.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', ra.left - W.left); l.setAttribute('y1', ra.top + ra.height / 2 - W.top);
      l.setAttribute('x2', rb.right - W.left); l.setAttribute('y2', rb.top + rb.height / 2 - W.top);
      l.setAttribute('stroke', col); l.setAttribute('stroke-width', 8); l.setAttribute('stroke-linecap', 'round'); svg.append(l);
    };
    let left = A.length, sel = null, n = 0;
    if (AUTO) { A.forEach((a, i) => { a.classList.add('ok'); B[i].classList.add('ok'); link(a, B[i], COL[i % 4]); }); await c.good(wrap, true); return; }
    await c.w(new Promise(res => {
      A.forEach(a => { a.onclick = () => { if (a.classList.contains('ok')) return; A.forEach(x => x.classList.remove('sel')); sel = a; a.classList.add('sel'); SFX.pop(); }; });
      B.forEach(b => { b.onclick = async () => {
        if (b.classList.contains('ok')) return;
        if (!sel) { shake(b); CAP.say('اخْتَرْ مِنَ الْمَجْموعَةِ الْأولى أَوَّلًا.', 2200); return; }
        const s = sel; sel = null; s.classList.remove('sel');
        if (s.dataset.i === b.dataset.i) { s.classList.add('ok'); b.classList.add('ok'); link(s, b, COL[n++ % 4]); SFX.ding(); burst(b); if (--left === 0) res(); }
        else await c.bad(b);
      }; });
    }));
    await c.good(wrap);
  },
  async order(c, it) {
    c.clear();
    const letters = it.join !== ' ', card = c.card();
    if (it.img) card.append(h('img', { class: 'pic', src: IMG(it.img) }));
    if (it.join === ' + ' && it.out) card.append(h('p', { class: 'big' }, it.out));
    const S = it.cards.map(() => h('div', { class: 'slot' })), slots = h('div', { class: 'slots' }, S);
    const tiles = mixed([...it.cards, ...(it.pool || [])]).map(tx => h('button', { class: 'tile' + (letters ? ' ltr' : '') }, tx));
    const pool = h('div', { class: 'row' }, tiles);
    const hearB = it.hear ? h('button', { class: 'pill' }, '🔊 اسْمَعِ الْكَلِمَةَ') : null;
    card.append(slots, pool, hearB ? h('div', { class: 'recbar' }, hearB) : null);
    c.prompt(it.qa, it.q, 'point').then(() => it.hear && AU.play(it.hear)).catch(() => {});
    if (it.hear) hearB.onclick = () => AU.play(it.hear);
    const placed = Array(S.length).fill(null);
    if (AUTO) it.cards.forEach((tx, i) => { placed[i] = tiles.find(t => t.textContent === tx && !placed.includes(t)); });
    else await c.w(new Promise(res => {
      const check = async () => {
        if (placed.every((t, i) => t.textContent === it.cards[i])) return res();
        await c.bad(slots);
        placed.forEach((t, i) => { if (t && t.textContent !== it.cards[i]) { S[i].innerHTML = ''; S[i].classList.remove('fill'); t.classList.remove('gone'); placed[i] = null; } });
      };
      tiles.forEach(t => { t.onclick = () => {
        if (t.classList.contains('gone')) return; const i = placed.indexOf(null); if (i < 0) return;
        placed[i] = t; t.classList.add('gone'); SFX.pop();
        const cl = h('button', { class: t.className.replace(' gone', '') }, t.textContent);
        cl.onclick = () => { if (placed[i] !== t) return; placed[i] = null; cl.remove(); S[i].classList.remove('fill'); t.classList.remove('gone'); SFX.pop(); };
        S[i].append(cl); S[i].classList.add('fill');
        if (placed.every(Boolean)) check();
      }; });
    }));
    const out = it.join === ' + ' ? it.cards.join(' + ') : (it.out || it.cards.join(letters ? '' : ' '));
    const res = h('p', { class: 'outw' }, out); slots.replaceWith(res); pool.remove(); if (hearB) hearB.parentNode.remove();
    await c.good(res, true);
    if (it.after) await c.w(AU.play(it.after)); else if (it.hear) await c.w(AU.play(it.hear));
    await c.w(sleep(AUTO ? 5 : 500));
  },
  async fill(c, it, idx) {
    c.clear();
    const blank = h('span', { class: 'blank' }, '؟');
    const card = c.card(it.img ? h('img', { class: 'pic', src: IMG(it.img) }) : null, h('div', { class: 'sent' }, h('span', null, it.pre), blank, h('span', null, it.post)));
    const els = it.opts.map(o => optEl(o));
    card.append(h('div', { class: 'row' }, els));
    c.prompt(it.qa, it.q, 'point').catch(() => {});
    for (;;) {
      const i = await c.pickOne(els, it.ok === 'any' ? 0 : it.ok);
      if (it.ok === 'any' || i === it.ok) {
        blank.textContent = it.opts[i].tx; blank.classList.add('done'); els[i].classList.add('ok');
        await c.good(blank, true);
        const af = Array.isArray(it.after) ? it.after[i] : it.after; if (af) await c.w(AU.play(af));
        if (it.ok === 'any') { els.forEach(e => e.remove()); await readStep(c, card, { text: `${it.pre} ${it.opts[i].tx}${it.post}`, model: af, secs: 8, idx }); }
        break;
      }
      els[i].classList.add('no'); await c.bad(els[i]);
    }
    await c.w(sleep(AUTO ? 5 : 400));
  },
  async miss(c, it) {
    c.clear();
    const gap = h('span', { class: 'gap' }), word = h('div', { class: 'sent' }, it.pre ? h('span', null, it.pre) : null, gap, it.post ? h('span', null, it.post) : null);
    const els = it.opts.map(o => h('button', { class: 'opt syl' }, o));
    const card = c.card(h('img', { class: 'pic', src: IMG(it.img) }), word, h('div', { class: 'row' }, els));
    c.prompt(DATA.G.miss_q.a, DATA.G.miss_q.tx, 'point').catch(() => {});
    for (;;) {
      const i = await c.pickOne(els, it.ok);
      if (i === it.ok) { els[i].classList.add('ok'); word.replaceWith(h('p', { class: 'big outw' }, it.full)); await c.good(card, true); await c.w(AU.play(it.wa)); break; }
      els[i].classList.add('no'); await c.bad(els[i]);
    }
    await c.w(sleep(AUTO ? 5 : 400));
  },
  async trace(c, it, idx) {
    c.clear();
    const card = c.card(h('p', { class: 'model' }, it.tx));
    const pad = Pad(it.tx, { guide: 'trace' }), clr = btn('امْسَحْ', 'sec'), ok = btn('تَمَّ ✓', 'green');
    card.append(pad.el, h('div', { class: 'padtools' }, clr, ok));
    clr.onclick = () => { pad.clear(); SFX.pop(); };
    c.prompt(it.qa, it.q, 'point').catch(() => {});
    await penCheck(c, pad, ok, { tries: 3 });
    if (it.mode === 'pair') {
      await c.say(DATA.G.copy_now.a, DATA.G.copy_now.tx, 'point');
      const pad2 = Pad(it.tx, { guide: 'none' }), clr2 = btn('امْسَحْ', 'sec'), ok2 = btn('تَمَّ ✓', 'green');
      card.append(pad2.el, h('div', { class: 'padtools' }, clr2, ok2)); pad2.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      clr2.onclick = () => { pad2.clear(); SFX.pop(); };
      await penCheck(c, pad2, ok2, { tries: 2, free: true });
      REC.add({ k: `${c.m.id}:${idx}:pen`, mid: c.m.id, kind: 'pen', text: it.tx, blob: await pad2.png() });
    }
    await c.say(DATA.G.pen_good.a, DATA.G.pen_good.tx, 'clap');
  },
  async dict(c, it, idx) {
    c.clear();
    const S = it.letters.map(() => h('div', { class: 'slot' })), slots = h('div', { class: 'slots' }, S);
    const tiles = mixed([...it.letters, ...it.pool]).map(t => h('button', { class: 'tile ltr' }, t));
    const pool = h('div', { class: 'row' }, tiles), hearB = h('button', { class: 'pill' }, '🔊 اسْمَعْ');
    const card = c.card(h('div', { class: 'recbar' }, hearB), slots, pool);
    hearB.onclick = () => AU.play(it.a);
    c.prompt(DATA.G.dict_tiles.a, DATA.G.dict_tiles.tx, 'point').then(() => AU.play(it.a)).catch(() => {});
    await R.order._tiles(c, S, slots, tiles, it.letters);
    pool.remove();
    const res = h('p', { class: 'big outw' }, it.w); slots.replaceWith(res);
    await c.good(res, true); await c.w(AU.play(it.a));
    await c.say(DATA.G.dict_pen.a, DATA.G.dict_pen.tx, 'point');
    res.style.visibility = 'hidden';
    const pad = Pad(it.w, { guide: 'none', maxW: 640 }), clr = btn('امْسَحْ', 'sec'), peek = btn('👀 أَنْظُرُ', 'sec'), ok = btn('تَمَّ ✓', 'green');
    card.append(pad.el, h('div', { class: 'padtools' }, clr, peek, ok)); pad.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    clr.onclick = () => { pad.clear(); SFX.pop(); };
    peek.onclick = () => { res.style.visibility = 'visible'; setTimeout(() => { res.style.visibility = 'hidden'; }, 1800); };
    await penCheck(c, pad, ok, { tries: 2, free: true });
    res.style.visibility = 'visible';
    REC.add({ k: `${c.m.id}:${idx}:pen`, mid: c.m.id, kind: 'pen', text: it.w, blob: await pad.png() });
    await c.good(card, true);
  },
  async dpen(c, it, idx) {
    c.clear();
    const hearB = h('button', { class: 'pill' }, '🔊 اسْمَعِ الْجُمْلَةَ');
    const pad = Pad(it.tx, { guide: 'none' }), clr = btn('امْسَحْ', 'sec'), ok = btn('تَمَّ ✓', 'green');
    const card = c.card(h('div', { class: 'recbar' }, hearB), pad.el, h('div', { class: 'padtools' }, clr, ok));
    hearB.onclick = () => AU.play(it.a); clr.onclick = () => { pad.clear(); SFX.pop(); };
    c.prompt(DATA.G.dpen_q.a, DATA.G.dpen_q.tx, 'point').then(() => AU.play(it.a)).catch(() => {});
    await penCheck(c, pad, ok, { tries: 1, free: true, any: true });
    REC.add({ k: `${c.m.id}:${idx}:pen`, mid: c.m.id, kind: 'pen', text: it.tx, blob: await pad.png() });
    ok.parentNode.remove();
    card.insertBefore(h('p', { class: 'mid', style: { color: '#138a3a' } }, it.tx), pad.el);
    const yes = btn('✓ كَتَبْتُها صَحيحَةً', 'green'), no = btn('✗ سَأُصَوِّبُها', 'sec');
    card.append(h('div', { class: 'padtools' }, yes, no));
    await c.prompt(DATA.G.self_check.a, DATA.G.self_check.tx, 'point');
    const ch = await c.choose([no, yes]); yes.parentNode.remove();
    if (ch === no) {
      await c.say(DATA.G.rewrite.a, DATA.G.rewrite.tx, 'point');
      const p2 = Pad(it.tx, { guide: 'trace' }), clr2 = btn('امْسَحْ', 'sec'), ok2 = btn('تَمَّ ✓', 'green');
      card.append(p2.el, h('div', { class: 'padtools' }, clr2, ok2)); p2.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      clr2.onclick = () => { p2.clear(); SFX.pop(); };
      await penCheck(c, p2, ok2, { tries: 3 });
    }
    await c.good(card);
  },
  async story(c, it) {
    c.clear(); CAP.show(false);
    const img = h('img', { src: IMG(it.paras[0].img), alt: '' }), para = h('div', { class: 'para' });
    const box = h('div', { class: 'story' }, h('h2', null, it.title), img, para);
    c.stage.append(box);
    await c.w(AU.play(it.ta));
    for (const p of it.paras) {
      if (!img.src.endsWith(IMG(p.img))) { img.style.opacity = 0; await c.w(sleep(AUTO ? 1 : 200)); img.src = IMG(p.img); img.style.opacity = 1; }
      const spans = []; para.replaceChildren(...wordSpans(p.tx, spans));
      await c.w(AU.play(p.a, follow(spans, p.tm))); c.chk(); await c.w(sleep(AUTO ? 1 : 450));
    }
    CAP.show(true);
    const again = btn('↺ أَعِدِ الْقِصَّةَ', 'sec'), nx = btn('التّالي ◀', 'green');
    const row = h('div', { class: 'padtools' }, again, nx); c.stage.append(row); row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const ch = await c.choose([again, nx]);
    if (ch === again) return R.story(c, it);
  },
  async song(c, it) {
    c.clear();
    const lines = it.lines.map(l => { const sp = []; const e = h('div', { class: 'line' }, ...wordSpans(l.tx, sp)); e._sp = sp; return e; });
    const card = c.card(h('h2', { style: { color: 'var(--ink)', fontSize: '44px' } }, it.title), h('div', { class: 'song' }, lines));
    CAP.pose('clap'); CAP.say('اسْمَعِ الْأُنْشودَةَ، وَتابِعِ الْكَلِماتِ.');
    for (let i = 0; i < lines.length; i++) { lines[i].classList.add('on'); await c.w(AU.play(it.lines[i].a, follow(lines[i]._sp, it.lines[i].tm))); lines[i].classList.remove('on'); c.chk(); }
    await c.next(card);
  },
  async pics(c, it, idx) {
    c.clear();
    // ١) ترتيب الصور
    const P = it.panels.map((p, i) => h('div', { class: 'panel' }, h('span', { class: 'n' }, AR(i + 1))));
    const thumbs = mixed(it.panels).map(p => { const t = h('button', { class: 'thumb' }, h('img', { src: IMG(p), alt: '' })); t._p = p; return t; });
    const card = c.card(h('div', { class: 'panels' }, P), h('div', { class: 'pool' }, thumbs));
    c.prompt(it.qa, it.q, 'point').then(() => c.say(DATA.G.pics_order.a, DATA.G.pics_order.tx, 'point')).catch(() => {});
    const placed = Array(P.length).fill(null);
    if (!AUTO) await c.w(new Promise(res => {
      const check = async () => {
        if (placed.every((t, i) => t._p === it.panels[i])) return res();
        await c.bad(card);
        placed.forEach((t, i) => { if (t && t._p !== it.panels[i]) { P[i].querySelector('img') && P[i].querySelector('img').remove(); t.style.visibility = ''; placed[i] = null; } });
      };
      thumbs.forEach(t => { t.onclick = () => {
        if (t.style.visibility === 'hidden') return; const i = placed.indexOf(null); if (i < 0) return;
        placed[i] = t; t.style.visibility = 'hidden'; SFX.pop(); P[i].append(h('img', { src: IMG(t._p), alt: '' }));
        if (placed.every(Boolean)) check();
      }; });
      P.forEach((pn, i) => { pn.onclick = () => { if (!placed[i]) return; placed[i].style.visibility = ''; placed[i] = null; pn.querySelector('img').remove(); SFX.pop(); }; });
    }));
    await c.good(card);
    // ٢) جملةٌ لكل صورة
    for (let i = 0; i < it.panels.length; i++) {
      c.clear();
      const s = it.sents[i], S = s.cards.map(() => h('div', { class: 'slot' })), slots = h('div', { class: 'slots' }, S);
      const tiles = mixed(s.cards).map(tx => h('button', { class: 'tile' }, tx));
      const cd = c.card(h('img', { class: 'pic wide', src: IMG(it.panels[i]), style: { maxWidth: '360px' } }), slots, h('div', { class: 'row' }, tiles));
      await c.say(DATA.G.pics_sent.a, DATA.G.pics_sent.tx, 'point');
      await R.order._tiles(c, S, slots, tiles, s.cards);
      tiles[0].parentNode.remove(); const out = h('p', { class: 'mid outw' }, s.cards.join(' ') + '.'); slots.replaceWith(out);
      await c.good(out, true); await c.w(AU.play(s.a));
    }
    // ٣) يحكي القصة كاملة
    c.clear();
    const all = c.card(h('div', { class: 'panels' }, it.panels.map((p, i) => h('div', { class: 'panel', style: { borderStyle: 'solid' } }, h('img', { src: IMG(p), alt: '' }), h('span', { class: 'n' }, AR(i + 1))))),
      h('div', null, it.sents.map(s => h('p', { class: 'q', style: { margin: '2px' } }, s.cards.join(' ') + '.'))));
    await c.prompt(it.tella, it.tell, 'read');
    await readStep(c, all, { text: it.tell, secs: 60, kind: 'talk', idx });
  },
};
// ترتيب بطاقاتٍ في خانات (مشتركٌ بين الترتيب والإملاء وقصة الصور)
R.order._tiles = (c, S, slots, tiles, target) => {
  const placed = Array(S.length).fill(null);
  if (AUTO) return Promise.resolve();
  return c.w(new Promise(res => {
    const check = async () => {
      if (placed.every((t, i) => t.textContent === target[i])) return res();
      await c.bad(slots);
      placed.forEach((t, i) => { if (t && t.textContent !== target[i]) { S[i].innerHTML = ''; S[i].classList.remove('fill'); t.classList.remove('gone'); placed[i] = null; } });
    };
    tiles.forEach(t => { t.onclick = () => {
      if (t.classList.contains('gone')) return; const i = placed.indexOf(null); if (i < 0) return;
      placed[i] = t; t.classList.add('gone'); SFX.pop();
      const cl = h('button', { class: t.className.replace(' gone', '') }, t.textContent);
      cl.onclick = () => { if (placed[i] !== t) return; placed[i] = null; cl.remove(); S[i].classList.remove('fill'); t.classList.remove('gone'); SFX.pop(); };
      S[i].append(cl); S[i].classList.add('fill');
      if (placed.every(Boolean)) check();
    }; });
  }));
};
async function penCheck(c, pad, ok, { tries = 3, free = false, any = false }) {
  if (AUTO) { pad.solve(); return; }
  let n = 0;
  for (;;) {
    await c.tap(ok);
    if (pad.empty) { shake(pad.el); await c.say(DATA.G.pen_empty.a, DATA.G.pen_empty.tx, 'point'); continue; }
    if (any) return;
    const r = pad.score(free, free ? 2 + n : n);
    if (r.pass || n >= tries - 1) { burst(pad.el); SFX.ding(); return; }
    n++;
    if (!free) { await c.bad(pad.el); await c.say(DATA.G.pen_again.a, DATA.G.pen_again.tx, 'point'); pad.clear(); }
    else { shake(pad.el); pad.setMode('faint'); await c.say(DATA.G.pen_again.a, DATA.G.pen_again.tx, 'point'); pad.clear(); }
  }
}

// ------------------------------------------------------------ تشغيل التحدّي والصندوق
async function runMission(isl, loc, m) {
  if (window.EliaMusic) EliaMusic.stop();
  CUR = { scr: 'play', isl };
  show('play'); CAP.show(true); CAP.say('');
  $('#p-title').textContent = m.n;
  const dots = $('#p-dots'); dots.innerHTML = ''; m.items.forEach(() => dots.append(h('i')));
  const c = ctx(m, isl);
  CAP.onTap(() => c.again());
  $('#p-replay').onclick = () => c.again();
  try {
    for (let i = 0; i < m.items.length; i++) {
      $$('#p-dots i').forEach((e, j) => { e.classList.toggle('on', j < i); e.classList.toggle('now', j === i); });
      const it = pv(m.items[i]); await R[it.t](c, it, i);
    }
    $$('#p-dots i').forEach(e => { e.classList.add('on'); e.classList.remove('now'); });
    await finish(isl, loc, m, c);
  } catch (e) { if (e !== ABORT) { console.error(e); toast('حَدَثَ خَطَأٌ، نَعودُ إِلى الْجَزيرَةِ'); openIsland(isl); } }
}
async function finish(isl, loc, m, c) {
  const oral = m.items.every(it => ['say', 'read', 'talk', 'story', 'song', 'trace'].includes(it.t));
  const stars = oral ? 3 : c.mist === 0 ? 3 : c.mist <= 2 ? 2 : 1;
  const prev = ST.stars(m.id), first = !prev;
  let r = stars;
  if (first && stars === 3 && Math.random() < 0.25) r = 4;
  if (!first && stars <= prev) r = 0;
  const gems = [2, 5, 8, 12, 20][r];
  const wasDone = islDone(isl);
  const d = ST.d; if (stars > prev) d.done[m.id] = stars; d.gems = (d.gems || 0) + gems; d.chests = (d.chests || 0) + 1;
  const nowDone = islDone(isl);
  let loot = null; const un = DATA.LOOT.filter(l => !d.loot[l.id]);
  if (un.length) {
    if (!wasDone && nowDone) loot = rnd(un);
    else if (r === 4 && Math.random() < 0.5) loot = rnd(un) || null;   // الأسلحة نادرة: مضمونةٌ عند إنهاء الجزيرة، ونصفُ الصناديق الأسطورية
  }
  if (loot) { d.loot[loot.id] = 1; if (!d.eq) d.eq = loot.id; }
  ST.save();
  await chest({ r, gems, stars, loot, c });
  if (!wasDone && nowDone) {
    const nx = ISL.find(x => !x.soon && ISL.indexOf(x) > ISL.indexOf(isl));
    CAP.pose('clap'); CAP.say(DATA.G.island_done.tx); SFX.win(); await AU.play(DATA.G.island_done.a);
    return openMap(nx && islOpen(nx) ? nx : null);
  }
  openLoc(isl, loc, true);
}
function chest({ r, gems, stars, loot, c }) {
  return new Promise(async res => {
    const ov = $('#chest'); ov.hidden = false; ov.style.setProperty('--rc', RAR[r].c); ov.classList.remove('open');
    const box = h('div', { class: 'box wob' }, h('img', { src: IMG('chest/c' + r), alt: '' }));
    const tip = h('p', { class: 'tip' }, 'اضْغَطْ عَلى الصُّنْدوقِ لِتَفْتَحَهُ');
    ov.replaceChildren(h('div', { class: 'rays' }), h('p', { class: 'stars3' }, STARS(stars)), h('p', { class: 'rar' }, 'صُنْدوقٌ ' + RAR[r].n), box, tip);
    CAP.pose('clap'); CAP.say(DATA.G.chest.tx); SFX.rumble(); AU.play(DATA.G.chest.a);
    await new Promise(r2 => { if (AUTO) return r2(); box.onclick = r2; });
    SFX.open(); ov.classList.add('open'); box.classList.remove('wob'); box.querySelector('img').src = IMG('chest/open'); burst(box, 30);
    const gain = h('p', { class: 'gain' }, '💎 +٠'); tip.replaceWith(gain);
    for (let i = 1; i <= gems; i++) { gain.textContent = '💎 +' + AR(i); SFX.coin(i); await sleep(AUTO ? 1 : 60); }
    if (r === 4) { AU.play(DATA.G.legend.a); }
    if (loot) {
      await sleep(AUTO ? 1 : 500);
      ov.append(h('div', { class: 'loot', style: { '--rc': RAR[loot.r].c } }, h('img', { src: IMG('loot/' + loot.id), alt: '' }), h('div', null, h('b', null, 'سِلاحٌ جَديدٌ!'), h('br'), loot.n, h('br'), h('small', { style: { color: RAR[loot.r].c } }, RAR[loot.r].n))));
      SFX.win(); await AU.play(DATA.G.newloot.a);
    }
    ov.append(h('div', { class: 'crew' }, h('img', { src: IMG(P.kid + '/cheer'), alt: '' }), h('img', { src: IMG(P.buddy + '/cheer'), alt: '' })));
    const ok = btn('رائِعٌ ◀', 'green'); ov.append(ok);
    await new Promise(r2 => { if (AUTO) return r2(); ok.onclick = r2; });
    ov.hidden = true; ov.replaceChildren(); res();
  });
}

// ------------------------------------------------------------ الخريطة والجزر
let CUR = { scr: 'splash', isl: null };
function hud() {
  const g = AR(wallet()), s = AR(ST.totalStars());
  ['#h-gems', '#i-gems'].forEach(id => { const e = $(id); if (e) e.textContent = g; });
  $('#h-stars').textContent = s;
  const eq = DATA.LOOT.find(l => l.id === ST.d.eq);
  $('#eqw').style.backgroundImage = eq ? `url(${IMG('loot/' + eq.id)})` : '';
}
function openMap(focus) {
  CUR = { scr: 'map', isl: null }; show('map'); CAP.show(true); hud();
  if (window.EliaMusic) EliaMusic.start('action');
  const pins = $('#pins'); pins.innerHTML = '';
  ISL.forEach((isl, i) => {
    const open = islOpen(isl), done = islDone(isl), p = Math.round(islProg(isl) * 100);
    const st = isl.soon ? 'soon lockd' : !open ? 'lockd' : done ? 'done' : 'open';
    const el = h('button', { class: 'pin ' + st, style: { left: isl.x + '%', top: isl.y + '%', '--i': i, '--p': p } },
      h('span', { class: 'ring' }, h('img', { src: IMG('ic/' + isl.ic), alt: '' })), h('span', { class: 'plate' }, isl.n));
    el.onclick = () => {
      SFX.pop();
      if (isl.soon) { CAP.pose('scope'); CAP.say(DATA.G.soon.tx, 3500); return AU.play(DATA.G.soon.a); }
      if (!open) { CAP.pose('point'); CAP.say(DATA.G.locked.tx, 3500); shake(el); return AU.play(DATA.G.locked.a); }
      openIsland(isl);
    };
    pins.append(el);
  });
  const first = !ST.d.seen.map;
  const line = first ? DATA.G.maptip : DATA.G.welcome_back;
  CAP.pose(first ? 'hello' : 'scope'); CAP.say(line.tx, 4000); AU.play(line.a);
  if (first) { ST.d.seen.map = 1; ST.save(); }
  CAP.onTap(() => { CAP.say(DATA.G.maptip.tx, 3000); AU.play(DATA.G.maptip.a); });
  if (focus) { const el = [...pins.children][ISL.indexOf(focus)]; if (el) { burst(el, 26); } }
}
function openIsland(isl) {
  CUR = { scr: 'island', isl }; show('island'); CAP.show(true); hud();
  if (window.EliaMusic) EliaMusic.start('action');
  $('#i-name').textContent = isl.n; $('#i-sub').textContent = `${isl.sub} · ${isl.book || ''}`;
  $('#i-bg').src = IMG(isl.bg);
  const spots = $('#spots'); spots.innerHTML = '';
  isl.locs.forEach((loc, i) => {
    const got = loc.missions.reduce((a, m) => a + ST.stars(m.id), 0), max = loc.missions.length * 3, full = loc.missions.every(m => ST.stars(m.id) > 0);
    const el = h('button', { class: 'spot' + (full ? ' full' : ''), style: { left: loc.x + '%', top: loc.y + '%', '--i': i } },
      h('span', { class: 'ico' }, h('img', { src: IMG('ic/' + loc.ic), alt: '' })), h('span', { class: 'plate' }, loc.n), h('span', { class: 'stars' }, `⭐ ${AR(got)}/${AR(max)}`));
    el.onclick = () => { SFX.pop(); openLoc(isl, loc); };
    spots.append(el);
  });
  const seen = ST.d.seen['i_' + isl.id];
  if (isl.ia && !seen) { CAP.pose('point'); CAP.say(isl.intro, 4500); AU.play(isl.ia); ST.d.seen['i_' + isl.id] = 1; ST.save(); }
  else { CAP.pose('hello'); CAP.say('اخْتَرْ مَوْقِعًا مِنَ الْجَزيرَةِ.', 2500); }
  CAP.onTap(() => { if (isl.ia) { CAP.say(isl.intro, 4000); AU.play(isl.ia); } });
}
function openLoc(isl, loc, back) {
  if (!back || CUR.scr !== 'island') openIsland(isl);
  const ov = $('#sheet'); ov.hidden = false;
  const close = h('button', { class: 'xbtn', 'aria-label': 'إغلاق' }, '✕');
  const list = h('div', { class: 'mlist' }, loc.missions.map((m, i) => {
    const s = ST.stars(m.id), prevDone = i === 0 || ST.stars(loc.missions[i - 1].id) > 0 || s > 0;
    const b = h('button', { class: 'mitem' }, h('img', { src: IMG(s ? 'chest/open' : 'chest/c' + Math.min(3, i + 1)), alt: '' }), h('span', null, m.n), h('span', { class: 'st' }, s ? STARS(s) : '▶ اِبْدَأْ'));
    b.onclick = () => { SFX.pop(); ov.hidden = true; runMission(isl, loc, m); };
    if (!prevDone) b.style.opacity = .92;
    return b;
  }));
  ov.replaceChildren(h('div', { class: 'panelbox' }, close, h('h2', null, h('img', { src: IMG('ic/' + loc.ic), alt: '', style: { width: '56px', verticalAlign: 'middle', marginInlineEnd: '8px' } }), loc.n), list));
  close.onclick = () => { ov.hidden = true; SFX.pop(); };
  ov.onclick = e => { if (e.target === ov) close.onclick(); };
  if (!back) { CAP.pose('point'); CAP.say(loc.intro, 4000); AU.play(loc.ia); }
}

// ------------------------------------------------------------ الخزانة
function openLocker() {
  const ov = $('#sheet'); ov.hidden = false;
  const close = h('button', { class: 'xbtn' }, '✕');
  const draw = () => {
    const grid = h('div', { class: 'lgrid' }, DATA.LOOT.map(l => {
      const own = !!ST.d.loot[l.id], eq = ST.d.eq === l.id;
      const e = h('button', { class: 'litem' + (own ? '' : ' not') + (eq ? ' eq' : ''), style: { '--rcol': RAR[l.r].c } }, h('img', { src: IMG('loot/' + l.id), alt: '' }), h('b', null, own ? l.n : '؟؟؟'), h('small', { style: { color: RAR[l.r].c } }, RAR[l.r].n), eq ? h('small', null, '✔ مُجَهَّزٌ') : null);
      e.onclick = () => { if (!own) { shake(e); toast('افْتَحِ الصَّناديقَ لِتَحْصُلَ عَلَيْهِ'); return; } ST.d.eq = l.id; ST.save(); SFX.ding(); burst(e); hud(); draw(); };
      return e;
    }));
    const have = DATA.LOOT.filter(l => ST.d.loot[l.id]).length;
    ov.replaceChildren(h('div', { class: 'panelbox' }, close, h('h2', null, '🧰 خِزانَةُ ' + P.full), h('p', { class: 'q' }, `جَمَعْتَ ${AR(have)} مِنْ ${AR(DATA.LOOT.length)} أَسْلِحَةٍ · صَناديقُ مَفْتوحَةٌ: ${AR(ST.d.chests || 0)}`), grid));
    close.onclick = () => { ov.hidden = true; SFX.pop(); };
  };
  draw(); CAP.pose('point'); CAP.say(DATA.G.locker.tx, 3500); AU.play(DATA.G.locker.a);
}

// ------------------------------------------------------------ لوحة بابا (على الجهاز)
function parentGate() {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 5); let typed = '';
  const ov = $('#sheet'); ov.hidden = false;
  const ans = h('div', { class: 'ans' }, '');
  const keys = h('div', { class: 'keypad' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => h('button', { onclick: () => {
    if (k === '⌫') typed = typed.slice(0, -1); else if (k === '✓') { if (+typed === a * b) return parentPanel(); shake(ans); typed = ''; } else if (typed.length < 3) typed += k;
    ans.textContent = AR(typed);
  } }, typeof k === 'number' ? AR(k) : k)));
  const close = h('button', { class: 'xbtn' }, '✕'); close.onclick = () => { ov.hidden = true; };
  ov.replaceChildren(h('div', { class: 'panelbox', style: { maxWidth: '420px' } }, close, h('h2', null, '🔒 لَوْحَةُ بابا'), h('p', { class: 'q' }, `كَمْ يُساوي ${AR(a)} × ${AR(b)}؟`), ans, keys));
}
async function parentPanel(tab = 'rec') {
  const ov = $('#sheet'); ov.hidden = false;
  const close = h('button', { class: 'xbtn' }, '✕'); close.onclick = () => { ov.hidden = true; hud(); if (CUR.scr === 'map') openMap(); };
  const T = [['rec', '🎙️ التَّسْجيلاتُ'], ['pen', '✏️ الْكِتابَةُ'], ['isl', '🏝️ الْجُزُرُ'], ['set', '⚙️ إِعْداداتٌ']];
  const tabs = h('div', { class: 'tabs' }, T.map(([k, n]) => h('button', { class: 'tab' + (k === tab ? ' on' : ''), onclick: () => parentPanel(k) }, n)));
  const body = h('div');
  ov.replaceChildren(h('div', { class: 'panelbox' }, close, h('h2', null, '👨‍👦 لَوْحَةُ بابا'), tabs, body));
  const mname = id => (ALLM.find(m => m.id === id) || {}).n || id;
  const when = ts => new Date(ts).toLocaleString('ar-KW', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  if (tab === 'rec' || tab === 'pen') {
    const all = (await REC.all()).filter(r => (r.pl || 'elia') === P.id).filter(r => tab === 'pen' ? r.kind === 'pen' : r.kind !== 'pen').sort((a, b) => b.ts - a.ts);
    if (!all.length) body.append(h('p', { class: 'q' }, 'لا شَيْءَ بَعْدُ، تَظْهَرُ هُنا قِراءاتُ إيليا وَكِتابَتُهُ بَعْدَ اللَّعِبِ.'));
    if (tab === 'rec') all.forEach(r => {
      const tag = r.kind === 'talk' ? '🗣️ إِجابَةٌ' : r.heard === true ? '✅ فَهِمَها سَفاري' : r.heard === false ? '👂 لِلِاسْتِماعِ' : '🎙️ قِراءَةٌ';
      body.append(h('div', { class: 'rec' }, h('div', { class: 't' }, r.text, h('small', null, `${mname(r.mid)} · ${tag} · ${when(r.ts)}${r.rt ? ' · سَمِعَ: ' + r.rt : ''}`)),
        h('button', { onclick: () => AU.playBlob(REC.blob(r)) }, '▶'), h('button', { onclick: async () => { await REC.del(r.id); parentPanel('rec'); } }, '🗑')));
    });
    else body.append(h('div', { class: 'inkgrid' }, all.map(r => { const u = URL.createObjectURL(REC.blob(r)); return h('figure', null, h('img', { src: u, alt: '' }), h('figcaption', null, `${r.text} · ${when(r.ts)}`)); })));
    const give = btn('🎁 مُكافَأَةٌ لِإيليا: ١٠ جَواهِرَ', 'green');
    give.onclick = () => { ST.d.gems += 10; ST.d.bonus = (ST.d.bonus || 0) + 10; ST.save(); hud(); SFX.win(); toast('أُضيفَتْ ١٠ جَواهِرَ 💎'); };
    body.append(h('div', { class: 'padtools', style: { marginTop: '14px' } }, give));
  }
  if (tab === 'isl') ISL.forEach(isl => {
    if (isl.soon) return body.append(h('div', { class: 'prow' }, h('span', null, isl.n), h('span', null, 'قَيْدَ الْبِناءِ')));
    const open = islOpen(isl), ms = missionsOf(isl), got = ms.filter(m => ST.stars(m.id)).length;
    const b = h('button', { class: 'pill', style: { background: open ? '#22a84f' : '#3a47a8' } }, open ? '✔ مَفْتوحَةٌ' : '🔓 افْتَحْها الْآنَ');
    b.onclick = () => { ST.d.unl[isl.id] = 1; ST.save(); parentPanel('isl'); };
    body.append(h('div', { class: 'prow' }, h('span', null, `${isl.n} — ${AR(got)}/${AR(ms.length)} تَحَدِّياتٍ`), b));
  });
  if (tab === 'set') {
    const sr = h('button', { class: 'pill' }, MIC.sr ? '✔ مُفَعَّلٌ' : '✗ مُتَوَقِّفٌ');
    sr.onclick = () => { MIC.setSR(!MIC.sr); parentPanel('set'); };
    const rst = h('button', { class: 'pill', style: { background: '#e0223f' } }, 'تَصْفيرُ التَّقَدُّمِ');
    rst.onclick = () => { if (confirm('تَصْفيرُ كُلِّ تَقَدُّمِ إيليا في جُزُرِ الْكَنْزِ؟')) { ST.reset(); parentPanel('set'); toast('صُفِّرَ التَّقَدُّمُ'); } };
    body.append(
      h('div', { class: 'prow' }, h('span', null, MIC.srExists ? 'التَّعَرُّفُ الْآلِيُّ عَلى الْقِراءَةِ (مُساعِدٌ)' : 'التَّعَرُّفُ الْآلِيُّ غَيْرُ مُتاحٍ في هذا الْمُتَصَفِّحِ'), MIC.srExists ? sr : null),
      h('div', { class: 'prow' }, h('span', null, `الْجَواهِرُ الْمَكْسوبَةُ هُنا: ${AR(ST.d.gems)} · الْمُكافَآتُ: ${AR(ST.d.bonus || 0)}`)),
      h('div', { class: 'prow' }, h('span', null, 'التَّسْجيلاتُ وَصُوَرُ الْكِتابَةِ مَحْفوظَةٌ في هذا الْآيْبادِ وَحْدَهُ.')),
      h('div', { class: 'prow' }, h('span', null, 'تَصْفيرُ تَقَدُّمِ هذا الْعالَمِ'), rst));
  }
}

// ------------------------------------------------------------ الإقلاع
function setSquad() {
  const sq = $('#squad').querySelectorAll('img');
  sq[0].src = IMG(P.kid + '/cheer'); sq[1].src = IMG(P.buddy === 'mo' ? 'mo/wave' : 'elia/pencil');
}
// سحابة اللاعب: save.js يُحمَّل بعد الاختيار ليعرف وثيقته (إيليا: elia، محمد: atiyah)
function loadSave() {
  return new Promise(res => {
    const sc = document.createElement('script'); sc.src = '../assets/save.js?v=10';
    if (P.doc !== 'elia') sc.dataset.player = P.doc;
    sc.dataset.keys = P.id === 'elia' ? 'elia-juzur-v1,elia-shop-v1,elia-letters-v1,elia-venom-v2,elia-spider-v1,elia-tests-v1' : P.key;
    sc.onload = sc.onerror = () => res(); document.body.append(sc);
  });
}
async function choose(pid) {
  P = DATA.PLAYERS[pid]; KEY = P.key; try { localStorage.setItem('juzur-player', pid); } catch (e) {}
  SFX.unlock(); AU.unlock(); SFX.whoosh();
  if (window.EliaMusic && EliaMusic.watch) EliaMusic.watch(AU.el);
  ST.use(); CAP.reset(); setSquad(); openMap();
  await loadSave();
  if (window.EliaSave) EliaSave.on(KEY, () => { ST.reload(); if (CUR.scr === 'map') openMap(); else if (CUR.scr === 'island' && CUR.isl) openIsland(CUR.isl); else hud(); });
}
function boot() {
  let last = 'elia'; try { last = localStorage.getItem('juzur-player') || 'elia'; } catch (e) {}
  $('#who').replaceChildren(...Object.values(DATA.PLAYERS).map(p => h('button', { class: 'whocard' + (p.id === last ? ' last' : ''), onclick: () => choose(p.id) },
    h('img', { class: 'kid', src: IMG(p.kid + (p.kid === 'mo' ? '/wave' : '/cheer')), alt: '' }), h('b', null, p.full),
    h('small', null, h('img', { src: IMG(p.himg + '/hello'), alt: '' }), 'مَعَ ' + p.helper))));
  $('#h-who').onclick = () => { SFX.pop(); location.href = location.pathname + (TEST ? '?test' : ''); };
  $('#h-locker').onclick = () => { SFX.pop(); openLocker(); };
  $('#h-sound').onclick = () => { if (window.EliaMusic) { EliaMusic.toggle(); $('#h-sound').textContent = EliaMusic.on ? '🎵' : '🔇'; } };
  $('#h-sound').textContent = window.EliaMusic && !EliaMusic.on ? '🔇' : '🎵';
  let hold = 0;
  const lock = $('#h-parent');
  lock.onpointerdown = () => { hold = setTimeout(() => { SFX.ding(); parentGate(); }, 1200); };
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => lock.addEventListener(ev, () => clearTimeout(hold)));
  lock.onclick = () => toast('اضْغَطْ مُطَوَّلًا لِفَتْحِ لَوْحَةِ بابا');
  $('#i-back').onclick = () => { SFX.pop(); openMap(); };
  $('#p-exit').onclick = () => {
    if (!AUTO && !confirm('هَلْ تُريدُ الْخُروجَ مِنَ التَّحَدّي؟')) return;
    if (abortNow) abortNow(); CAP.say(''); $('#stage').innerHTML = '';
    if (CUR.isl) openIsland(CUR.isl); else openMap();
  };
  if (window.EliaShop && EliaShop.onChange) EliaShop.onChange(hud);
  addEventListener('pageshow', e => { if (e.persisted) { ST.reload(); hud(); } });
  if (TEST) window.JZ = { get P() { return P; }, choose, ST, DATA, R, REC, MIC, ISL, ALLM, runMission, openMap, openIsland, openLoc, find: id => { for (const isl of ISL) for (const loc of isl.locs || []) for (const m of loc.missions) if (m.id === id) return { isl, loc, m }; } };
  if (AUTO) choose(new URLSearchParams(location.search).get('p') || 'elia');
}
boot();
