/* تحدّي النجوم (نوح) — المحرّك المشترك بين اللعبة (index) والخريطة (khareeta)، على نمط fort.js في abtal/
   سبع ثيمات: «البداية» ثم الرُّتَب الست من لاعبٍ ناشئٍ إلى بطل العالم. كلما ارتقى نوح رتبةً تتلوّن الصفحة كلها بلونها،
   ويتغيّر نوع الجزيئات في الخلفية، ويتحوّل ملعب الخريطة إلى شكلٍ جديد. والرتبة الأخيرة تفتح الكرة الذهبية.
   هنا أيضاً حساب النقاط نفسه للصفحتين، حتى لا تختلف الخريطة عن اللعبة أبداً. */
(() => {
'use strict';
const KEY = 'noah-heroes-v1', SEEN = 'noah-stad-seen', DEF_GOAL = 12000, DAILY_BONUS = 50, DAILY_NEED = 6, DAYS = 30;
const SEASON = Date.UTC(2026, 10, 13), START = '2026-11-14';   // الموسم ٢: يُصفَّر السجل (كان فيه يومٌ واحد)، وتبدأ الأيام الثلاثون يوم السبت
const MISSIONS = ['morning', 'study', 'tidy', 'eat', 'swim', 'sleep'];

/* t1 لونٌ ساطع للأزرار والحدود، t2 عميقٌ للظلال، bg1/bg2 الخلفية، glow للضوء والجزيئات */
const TIERS = [
  { n: 'الْبِدايَة', w: 'مَلْعَبُ الْحارَةِ', f: 0, t1: '#5fe08a', t2: '#17803d', bg1: '#03140a', bg2: '#0e4a26', glow: '#c8ffd8', p: 'wind', ic: '⚽' },
  { n: 'لاعِبٌ ناشِئ', w: 'أَكاديمِيَّةُ النّاشِئينَ', f: .125, t1: '#f2ad6a', t2: '#a0521c', bg1: '#170a03', bg2: '#5a2d0e', glow: '#ffe0bd', p: 'balls', ic: '🎽' },
  { n: 'لاعِبٌ أَساسِيّ', w: 'دَوْرِيُّ الْمَدينَةِ', f: .25, t1: '#e3e8f0', t2: '#7b889a', bg1: '#0f1217', bg2: '#3b4452', glow: '#ffffff', p: 'sparks', ic: '🏙️' },
  { n: 'نَجْمُ الْفَريقِ', w: 'لَيْلَةُ الْأَبْطالِ', f: .42, t1: '#4fcbff', t2: '#1558d6', bg1: '#021238', bg2: '#0b4aa8', glow: '#aaeeff', p: 'stars', ic: '✨' },
  { n: 'هَدّافُ الدَّوْرِيِّ', w: 'مُدَرَّجاتُ الْجَماهيرِ', f: .6, t1: '#d580ff', t2: '#6c22cf', bg1: '#0e0326', bg2: '#46168f', glow: '#f1caff', p: 'confetti', ic: '📣' },
  { n: 'أُسْطورَة', w: 'دِيرْبي النّارِ', f: .8, t1: '#ffb04a', t2: '#d6461a', bg1: '#200602', bg2: '#7c230a', glow: '#ffd9a6', p: 'embers', ic: '🔥' },
  { n: 'بَطَلُ الْعالَمِ', w: 'نِهائِيُّ كَأْسِ الْعالَمِ', f: 1, t1: '#ffe35c', t2: '#d18f0b', bg1: '#221402', bg2: '#7a540a', glow: '#fff8cc', p: 'coins', ic: '🏆' },
];
const PRIZE = 'كُرَةُ نِهائِيِّ كَأْسِ الْعالَمِ ٢٠٢٦ الذَّهَبِيَّةُ';

/* ---------- أدوات ---------- */
const $ = s => document.querySelector(s);
const AR = n => Math.round(n).toLocaleString('ar-EG');
const PL = n => `⁦${n < 0 ? '−' : '+'}${AR(Math.abs(n))}⁩`;
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => ymd(new Date());
const dnum = s => { const [y, m, d] = s.split('-').map(Number); return Math.round(new Date(y, m - 1, d).getTime() / 864e5); };
const lget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const Q = new URLSearchParams(location.search);
const num = k => { const v = Q.get(k); return v != null && v !== '' && isFinite(+v) ? +v : null; };
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- الحالة والنقاط ---------- */
function fresh() { return { start: today(), goal: String(DEF_GOAL), gate: '1', log: {}, del: {}, rst: 0, sat: 0 }; }
function season(st) {   // كل حالةٍ أقدم من ختم الموسم ٢ تُستبدل ببدايةٍ نظيفةٍ واحدة على كل الأجهزة
  if (st && st.rby && (st.rst || 0) >= SEASON) return st;
  return Object.assign(fresh(), { start: START, gate: (st && st.gate) || '1', rst: SEASON, rby: 1, sat: 0 });
}
function dayTotal(list) {   // نصر اليوم: ستُّ مهماتٍ مختلفة من الثماني
  const pts = list.reduce((a, e) => a + e.p, 0), done = new Set(list.map(e => e.c));
  const n = MISSIONS.filter(c => done.has(c)).length, full = n >= DAILY_NEED;
  return { pts: pts + (full ? DAILY_BONUS : 0), full, done, n };
}
function calc(S) {
  const del = S.del || {}, g = {};
  Object.entries(S.log || {}).forEach(([id, e]) => { if (!del[id]) (g[e.d] = g[e.d] || []).push(Object.assign({ id }, e)); });
  Object.values(g).forEach(l => l.sort((a, b) => b.t - a.t));
  let total = 0; Object.values(g).forEach(l => { total += dayTotal(l).pts; });
  return { total, g };
}
const goalOf = S => Math.max(1000, +S.goal || DEF_GOAL);
const need = (G, k) => Math.round(G * TIERS[k].f / 50) * 50;
function tierOf(total, G) { let k = 0; for (let i = 1; i < TIERS.length; i++) if (total >= need(G, i)) k = i; return k; }

/* ---------- شارات الرُّتَب: بلاطةٌ بلون الرتبة وفي داخلها رمزها (كرة، قمع تدريب، قميص، نجمة، مكبّر صوت، كرةٌ مشتعلة، كأس) ---------- */
const BALL = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#0b0730" stroke-width="3.5"/><path d="M${cx} ${cy - r * .45}l${r * .43} ${r * .31}-${r * .16} ${r * .5}h-${r * .54}l-${r * .16}-${r * .5}Z" fill="#0b0730"/><path d="M${cx} ${cy - r * .45}V${cy - r}M${cx + r * .43} ${cy - r * .14}l${r * .5}-${r * .17}M${cx + r * .27} ${cy + r * .36}l${r * .3} ${r * .45}M${cx - r * .27} ${cy + r * .36}l-${r * .3} ${r * .45}M${cx - r * .43} ${cy - r * .14}l-${r * .5}-${r * .17}" stroke="#0b0730" stroke-width="2.6"/>`;
const ICON = [
  BALL(30, 31, 20),
  '<path d="M24 12h12l9 35H15Z" fill="#fff" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><path d="M21.6 25h16.8M18.6 37h22.8" stroke="#ff7a1a" stroke-width="5"/><rect x="9" y="46" width="42" height="8" rx="3" fill="#fff" stroke="#0b0730" stroke-width="3.5"/>',
  '<path d="M22 9 8 17l5 11 6-3v29h22V25l6 3 5-11-14-8c-1 4-4 6-8 6s-7-2-8-6Z" fill="#fff" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><text x="30" y="46" text-anchor="middle" font-size="19" font-family="Arial Black,Arial,sans-serif" font-weight="900" fill="#0b0730">7</text>',
  '<path d="M30 7l6.6 13.4 14.8 2.2-10.7 10.4 2.5 14.7L30 40.8 16.8 47.7l2.5-14.7L8.6 22.6l14.8-2.2Z" fill="#fff" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><circle cx="12" cy="50" r="2.5" fill="#fff"/><circle cx="49" cy="52" r="2" fill="#fff"/>',
  '<path d="M10 25h9l21-12v35L19 36h-9Z" fill="#fff" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 36l3 12h7l-3-12" fill="#fff" stroke="#0b0730" stroke-width="3" stroke-linejoin="round"/><path d="M45 22c3 4 3 10 0 14M50 17c6 7 6 17 0 24" fill="none" stroke="#0b0730" stroke-width="6" stroke-linecap="round"/><path d="M45 22c3 4 3 10 0 14M50 17c6 7 6 17 0 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  '<path d="M30 5c4 9 15 13 15 28a15 15 0 0 1-30 0c0-7 4-11 7-15 1 5 3 7 6 8-2-8-1-14 2-21Z" fill="#ffd54a" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/>' + BALL(30, 36, 11),
  '<path d="M18 9h24v12c0 9-5 16-12 16s-12-7-12-16Z" fill="#fff8c4" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><path d="M18 13h-7c0 8 4 12 9 12M42 13h7c0 8-4 12-9 12" fill="none" stroke="#0b0730" stroke-width="3.5"/><path d="M27 37h6v7h-6Z" fill="#fff8c4" stroke="#0b0730" stroke-width="3.5"/><path d="M19 44h22v10H19Z" fill="#fff8c4" stroke="#0b0730" stroke-width="3.5" stroke-linejoin="round"/><path d="M23 13v8" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>',
];
function tile(k) {
  const T = TIERS[k], id = 'tg' + k + Math.random().toString(36).slice(2, 6);
  return `<svg class="tile" viewBox="0 0 60 70"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.t1}"/><stop offset="1" stop-color="${T.t2}"/></linearGradient></defs>
    <rect x="4" y="4" width="52" height="62" rx="11" fill="url(#${id})" stroke="#0b0730" stroke-width="4"/>
    <path d="M4 52 56 34v21a11 11 0 0 1-11 11H15A11 11 0 0 1 4 55Z" fill="#0b0730" fill-opacity=".2"/><path d="M11 12h15" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(0 4)">${ICON[k]}</g></svg>`;
}

/* ---------- تطبيق الثيمة: متغيّرات CSS مسجّلة بـ@property فتتدرّج الألوان بنعومة ---------- */
let current = -1;
function applyTheme(k) {
  const T = TIERS[k], r = document.documentElement.style;
  ['t1', 't2', 'bg1', 'bg2', 'glow'].forEach(v => r.setProperty('--' + v, T[v]));
  document.documentElement.dataset.tier = k;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = T.bg1;
  if (fxc) fxc.set(k);
  current = k;
}
/* موجةٌ دائرية بألوان الثيمة الجديدة تكتسح الشاشة من نقطة اللمس */
function wipe(k, x = innerWidth / 2, y = innerHeight / 2) {
  const T = TIERS[k], el = document.createElement('div'), R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  el.className = 'wipe'; el.style.background = `radial-gradient(circle at ${x}px ${y}px, ${T.glow} 0, ${T.t1} 18%, ${T.t2} 45%, ${T.bg1} 90%)`;
  document.body.appendChild(el);
  if (REDUCE || !el.animate) { applyTheme(k); el.remove(); return; }
  const a = el.animate([
    { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 },
    { clipPath: `circle(${R}px at ${x}px ${y}px)`, opacity: 1, offset: .5 },
    { clipPath: `circle(${R}px at ${x}px ${y}px)`, opacity: 0 },
  ], { duration: 1300, easing: 'cubic-bezier(.65,0,.35,1)' });
  setTimeout(() => applyTheme(k), 620);
  a.onfinish = () => el.remove();
}

/* ---------- مشهد «نُدرةٌ جديدة»: بطاقةٌ تدور ثلاثياً، موجة صدمة، وأشعة، ثم تتغيّر الصفحة خلفه ---------- */
function tierUp(k, opt = {}) {
  const T = TIERS[k];
  let el = document.getElementById('tierup');
  if (!el) { el = document.createElement('div'); el.id = 'tierup'; el.className = 'tierup'; el.setAttribute('role', 'dialog'); document.body.appendChild(el); }
  el.style.cssText = `--n1:${T.t1};--n2:${T.t2};--nb1:${T.bg1};--nb2:${T.bg2};--ng:${T.glow}`;
  const cols = [T.t1, T.t2, T.glow, '#fff', '#ff4fa3', '#ffe35c'];
  const bits = Array.from({ length: 48 }, (_, i) => { const a = Math.random() * Math.PI * 2, r = 180 + Math.random() * 520;
    return `<i class="tu-bit${i % 3 ? '' : ' o'}" style="--c:${cols[i % cols.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;--d:${(.85 + Math.random() * .35).toFixed(2)}s"></i>`; }).join('');
  el.innerHTML = `<div class="tu-bg"></div><div class="tu-rays"></div><i class="tu-ring"></i><i class="tu-ring r2"></i>${bits}
    <div class="tu-in"><span class="tu-kick">${opt.kick || 'رُتْبَةٌ جَديدَة!'}</span>
      <div class="tu-card">${tile(k)}</div>
      <b class="tu-name">${T.n}</b>
      <p class="tu-world">${T.ic} مَلْعَبٌ جَديدٌ: <b>${T.w}</b></p>
      ${opt.msg ? `<p class="tu-msg">${opt.msg}</p>` : ''}
      <button class="tu-go">${opt.btn || 'يَلّا يا كابْتِن! ▶'}</button></div>`;
  el.classList.remove('on', 'out'); void el.offsetWidth; el.classList.add('on');
  const t = setTimeout(() => applyTheme(k), 1150);   // الصفحة تتلوّن خلف المشهد، فتظهر جديدةً عند إغلاقه
  let closed = false;
  const close = () => { if (closed) return; closed = true; clearTimeout(t); applyTheme(k); el.classList.add('out'); setTimeout(() => { el.classList.remove('on', 'out'); opt.onClose && opt.onClose(); }, 650); };
  el.querySelector('.tu-go').onclick = close;
  el.onclick = e => { if (e.target === el || e.target.classList.contains('tu-bg')) close(); };
  return close;
}

/* ---------- الجزيئات: نوعٌ لكل ثيمة (ريح، بريق، أوراق، فقاعات، نجوم، جمر، عملات) ---------- */
let fxc = null;
function fx(cv) {
  if (!cv || !cv.getContext) return null;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, P = [], kind = 'wind', T = TIERS[0], raf = 0, last = 0, clock = 0;
  const R = Math.random;
  function size() { const d = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  const count = () => Math.round(Math.min(64, Math.max(24, W * H / 15000)) * (kind === 'wind' ? .8 : 1));
  function spawn(p, init) {
    p.ph = R() * 6.28; p.a = .25 + R() * .6; p.s = 1 + R() * 1;
    switch (kind) {
      case 'wind': p.x = init ? R() * W : W + R() * 200; p.y = R() * H; p.vx = -(3 + R() * 6); p.vy = .4 + R() * .6; p.len = 40 + R() * 120; p.a = .08 + R() * .22; break;
      case 'sparks': p.x = R() * W; p.y = init ? R() * H : H + 10; p.vx = (R() - .5) * .3; p.vy = -(.15 + R() * .5); p.r = 2 + R() * 5; break;
      case 'leaves': p.x = R() * W; p.y = init ? R() * H : -20; p.vx = .3 + R() * .6; p.vy = .5 + R() * 1.1; p.r = 5 + R() * 7; p.rot = R() * 6.28; p.vr = (R() - .5) * .06; p.c = R() < .5 ? T.t1 : T.glow; break;
      case 'bubbles': p.x = R() * W; p.y = init ? R() * H : H + 20; p.vx = 0; p.vy = -(.4 + R() * 1.2); p.r = 3 + R() * 11; break;
      case 'stars': p.x = R() * W; p.y = R() * H; p.vx = (R() - .5) * .08; p.vy = (R() - .5) * .08; p.r = 1 + R() * 3.2; p.shoot = 0; break;
      case 'embers': p.x = R() * W; p.y = init ? R() * H : H + 10; p.vx = (R() - .5) * .6; p.vy = -(.6 + R() * 1.6); p.r = 1.2 + R() * 3; p.life = 1; p.c = R() < .6 ? T.t1 : '#ffe08a'; break;
      case 'balls': p.x = R() * W; p.y = init ? R() * H : -30; p.vx = (R() - .5) * .5; p.vy = .5 + R() * 1; p.r = 6 + R() * 9; p.rot = R() * 6.28; p.vr = (R() - .5) * .08; p.a = .35 + R() * .4; break;
      case 'confetti': p.x = R() * W; p.y = init ? R() * H : -20; p.vx = (R() - .5) * .6; p.vy = .8 + R() * 1.4; p.r = 4 + R() * 5; p.rot = R() * 6.28; p.vr = .05 + R() * .1; p.c = [T.t1, T.glow, '#ffe35c', '#4fcbff', '#ff4fa3', '#fff'][Math.floor(R() * 6)]; break;
      case 'coins': p.x = R() * W; p.y = init ? R() * H : -20; p.vx = (R() - .5) * .4; p.vy = .7 + R() * 1.3; p.r = 5 + R() * 6; p.rot = R() * 6.28; p.vr = .04 + R() * .08; p.conf = R() < .45; p.c = ['#ffe35c', '#ff4fa3', '#4fcbff', '#8be844', '#fff'][Math.floor(R() * 5)]; break;
    }
    return p;
  }
  function set(k) { T = TIERS[k]; kind = T.p; P = Array.from({ length: count() }, () => spawn({}, true)); if (REDUCE) draw(); }
  function step(dt) {
    clock += dt * .016;
    for (const p of P) {
      p.ph += .03 * dt;
      if (kind === 'stars') {
        if (p.shoot) { p.x += p.vx * dt; p.y += p.vy * dt; p.shoot -= dt; if (p.shoot <= 0 || p.x < -50) spawn(p, true); continue; }
        if (R() < .0004 * dt) { p.shoot = 60; p.vx = -(9 + R() * 6); p.vy = 3 + R() * 3; p.x = W * (.3 + R() * .8); p.y = R() * H * .5; }
      }
      p.x += (p.vx + (kind === 'confetti' ? Math.sin(p.ph) * .7 : kind === 'leaves' ? Math.sin(p.ph) * .9 : kind === 'bubbles' ? Math.sin(p.ph) * .5 : 0)) * dt;
      p.y += p.vy * dt;
      if (p.rot != null) p.rot += p.vr * dt;
      if (kind === 'embers') { p.life -= .0035 * dt; if (p.life <= 0) spawn(p); }
      if (p.x < -160 || p.x > W + 220 || p.y < -40 || p.y > H + 40) spawn(p);
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      ctx.save();
      switch (kind) {
        case 'wind': ctx.globalAlpha = p.a; ctx.strokeStyle = T.glow; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len, p.y - p.len * .12); ctx.stroke(); break;
        case 'sparks': { const tw = .35 + .65 * Math.abs(Math.sin(p.ph * 1.6)); ctx.globalAlpha = p.a * tw; ctx.fillStyle = '#fff'; ctx.translate(p.x, p.y); ctx.rotate(.785); const r = p.r * (.6 + tw * .6);
          ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.lineTo(r * .4, -r * .4); ctx.lineTo(r * 2, 0); ctx.lineTo(r * .4, r * .4); ctx.lineTo(0, r * 2); ctx.lineTo(-r * .4, r * .4); ctx.lineTo(-r * 2, 0); ctx.lineTo(-r * .4, -r * .4); ctx.closePath(); ctx.fill(); break; }
        case 'leaves': ctx.globalAlpha = .75; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .42, 0, 0, 6.28); ctx.fill();
          ctx.strokeStyle = 'rgba(0,40,10,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.stroke(); break;
        case 'bubbles': ctx.globalAlpha = .55; ctx.strokeStyle = T.glow; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(p.x - p.r * .35, p.y - p.r * .35, p.r * .25, 0, 6.28); ctx.fill(); break;
        case 'stars': if (p.shoot) { const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 10, p.y - p.vy * 10); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10); ctx.stroke(); break; }
          ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(p.ph)); ctx.fillStyle = p.r > 3 ? T.glow : '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .7, 0, 6.28); ctx.fill();
          if (p.r > 3) { ctx.fillRect(p.x - p.r * 2, p.y - .6, p.r * 4, 1.2); ctx.fillRect(p.x - .6, p.y - p.r * 2, 1.2, p.r * 4); } break;
        case 'embers': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.max(0, p.life) * (.6 + .4 * Math.sin(p.ph * 3)); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
          g.addColorStop(0, p.c); g.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 6.28); ctx.fill(); break;
        case 'balls': {   // كراتٌ صغيرة تتدحرج نازلةً
          ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); const r = p.r;
          ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(11,7,48,.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(11,7,48,.9)'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = -1.571 + k * 1.2566; ctx.lineTo(Math.cos(a) * r * .42, Math.sin(a) * r * .42); } ctx.closePath(); ctx.fill();
          for (let k = 0; k < 5; k++) { const a = -1.571 + k * 1.2566; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .42, Math.sin(a) * r * .42); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
          break; }
        case 'confetti': ctx.globalAlpha = .85; ctx.translate(p.x, p.y); ctx.rotate(p.rot * .4); ctx.scale(Math.cos(p.rot * 2), 1); ctx.fillStyle = p.c; ctx.fillRect(-p.r * .5, -p.r * .3, p.r, p.r * .6); break;
        case 'coins': ctx.translate(p.x, p.y); ctx.rotate(p.rot * .3);
          if (p.conf) { ctx.globalAlpha = .85; ctx.scale(Math.cos(p.rot * 2), 1); ctx.fillStyle = p.c; ctx.fillRect(-p.r * .5, -p.r * .25, p.r, p.r * .5); break; }
          ctx.scale(Math.max(.12, Math.abs(Math.cos(p.rot))), 1); ctx.globalAlpha = .9; ctx.fillStyle = '#d99a0b'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.28); ctx.fill();
          ctx.fillStyle = '#ffe35c'; ctx.beginPath(); ctx.arc(0, 0, p.r * .78, 0, 6.28); ctx.fill(); ctx.fillStyle = '#fff6b0'; ctx.fillRect(-p.r * .15, -p.r * .45, p.r * .3, p.r * .9); break;
      }
      ctx.restore();
    }
  }
  function frame(t) { raf = requestAnimationFrame(frame); const dt = last ? Math.min(3, (t - last) / 16.67) : 1; last = t; step(dt); draw(); }
  size(); set(0);
  addEventListener('resize', () => { size(); P = Array.from({ length: count() }, () => spawn({}, true)); if (REDUCE) draw(); });
  if (!REDUCE) {
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); last = 0; if (!document.hidden) raf = requestAnimationFrame(frame); });
  }
  return { set };
}

/* ---------- ظهور الأقسام عند التمرير ---------- */
function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || REDUCE) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
}

/* ---------- عدّادٌ يتدحرج ---------- */
const shownMap = new WeakMap();
function countTo(el, to, dur = 1200) {
  const from = shownMap.has(el) ? shownMap.get(el) : 0; shownMap.set(el, to);
  if (REDUCE || from === to) { el.textContent = AR(to); return; }
  const t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = AR(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  setTimeout(() => { if (shownMap.get(el) === to) el.textContent = AR(to); }, dur + 200);   // إن توقّف rAF في الخلفية
}

function boot() { fxc = fx(document.getElementById('fx')); reveal(); }

window.Fort = { KEY, SEEN, DEF_GOAL, DAILY_BONUS, DAILY_NEED, DAYS, SEASON, START, MISSIONS, TIERS, PRIZE, BALL, Q, num, REDUCE,
  $, AR, PL, pad2, ymd, today, dnum, lget, lset, fresh, season, dayTotal, calc, goalOf, need, tierOf, tile,
  applyTheme, wipe, tierUp, countTo, boot, get current() { return current; } };
})();
