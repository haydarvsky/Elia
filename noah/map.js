/* تحدّي النجوم (نوح) — خريطة الملاعب (على نمط map.js في abtal/)
   سبعة ملاعب، لكلٍّ منها شكلٌ للطريق وزينته: ثعبانٌ في ملعب الحارة، مسار تدريبٍ في الأكاديمية، دربٌ بين ناطحات المدينة،
   منصّاتٌ مضيئة في ليلة الأبطال، دوّامةٌ حول المدرّجات إلى قلب الملعب، صعودٌ بين شعلات الديربي، وحلقتا النهائي الذهبيتان.
   كل طريقٍ يُعاد أخذه بـN نقطةٍ متساوية الطول، فيتحوّل الطريق إلى شكل الملعب التالي نقطةً بنقطة عند كل رتبةٍ جديدة.
   ?demo=5000 يعرض الخريطة بنقاطٍ تجريبية، و?world=3 يعرض عالماً بعينه — والمعاينة لا تحفظ شيئاً. */
(() => {
'use strict';
const F = window.Fort, { TIERS, AR, $ } = F;
const W = 800, H = 1200, N = 260, MAPK = 'noah-stad-mapk', PX = 96, PY = 124, NS = 'http://www.w3.org/2000/svg';
const X = x => PX + x * (W - 2 * PX), Y = y => PY + y * (H - 2 * PY);
const DEMO = F.num('demo'), WORLD = F.num('world') != null ? Math.max(0, Math.min(6, Math.round(F.num('world')))) : null;
const LIVE = DEMO == null && WORLD == null;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let uid = 0;

/* ---------- أشكال الطرق (إحداثياتٌ مطبَّعة ثم بكسلات) ---------- */
const curve = (n, fn) => Array.from({ length: n + 1 }, (_, i) => { const [x, y] = fn(i / n); return [X(x), Y(y)]; });
function rounded(c, r) {   // خطٌّ منكسر بزوايا مستديرة
  const out = [c[0]];
  for (let i = 1; i < c.length - 1; i++) {
    const [px, py] = c[i], [ax, ay] = c[i - 1], [bx, by] = c[i + 1];
    const la = Math.hypot(ax - px, ay - py), lb = Math.hypot(bx - px, by - py), rr = Math.min(r, la / 2, lb / 2);
    const p1 = [px + (ax - px) / la * rr, py + (ay - py) / la * rr], p2 = [px + (bx - px) / lb * rr, py + (by - py) / lb * rr];
    for (let k = 0; k <= 12; k++) { const t = k / 12, u = 1 - t; out.push([u * u * p1[0] + 2 * u * t * px + t * t * p2[0], u * u * p1[1] + 2 * u * t * py + t * t * p2[1]]); }
  }
  out.push(c[c.length - 1]); return out;
}
const GEN = [
  () => curve(500, u => [.5 + .36 * Math.sin(4 * Math.PI * u), 1 - u]),                                                    // ٠ جزيرة الهبوط: ثعبان
  () => rounded([[.5, 1], [.9, 1], [.9, .8], [.1, .8], [.1, .6], [.9, .6], [.9, .4], [.1, .4], [.1, .2], [.5, .2], [.5, 0]].map(([x, y]) => [X(x), Y(y)]), 70),   // ١ المدينة: شوارع
  () => curve(500, u => [.5 + .3 * Math.sin(2 * Math.PI * 1.5 * u + .5) + .08 * Math.sin(2 * Math.PI * 4.2 * u), 1 - u + .025 * Math.sin(6 * Math.PI * u)]),   // ٢ الغابة
  () => curve(500, u => [.5 + .36 * Math.sin(3 * Math.PI * u), 1 - u]),                                                    // ٣ الجزر
  () => curve(700, u => { const r = .5 * (1 - .88 * u), th = Math.PI / 2 + 2 * Math.PI * 2.35 * u; return [.5 + r * Math.cos(th), .5 + r * Math.sin(th) * (W - 2 * PX) / (H - 2 * PY) * 1.36]; }),   // ٤ المجرة
  () => { const c = [[.5, 1]]; for (let i = 1; i <= 5; i++) c.push([.5 + (i % 2 ? 1 : -1) * .42 * (1 - i * .15), 1 - i * .16]); c.push([.5, .02]); return rounded(c.map(([x, y]) => [X(x), Y(y)]), 64); },   // ٥ البركان
  () => { const b = .13, a = (1 - 2 * b) / (5 * Math.PI); return curve(900, u => { const p = 5 * Math.PI * u; return [.5 + .34 * Math.sin(p), 1 - (a * p + b * (1 - Math.cos(p)))]; }); },   // ٦ الأفعوانية
];
function resample(pts, n = N) {   // N نقطةً متساويةَ المسافات على طول الطريق
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1], out = []; let j = 0;
  for (let k = 0; k < n; k++) {
    const t = tot * k / (n - 1); while (j < L.length - 2 && L[j + 1] < t) j++;
    const s = (t - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * s, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * s]);
  }
  return out;
}
const WORLDS = GEN.map(g => resample(g()));
const at = (P, f) => { const x = clamp(f, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(x)), s = x - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * s, P[i][1] + (P[i + 1][1] - P[i][1]) * s]; };
const dOf = (P, f = 1) => {
  const n = clamp(f, 0, 1) * (P.length - 1), k = Math.floor(n); let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 1; i <= k; i++) d += `L${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)}`;
  if (n > k) { const q = at(P, f); d += `L${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }
  return d;
};
const lerp = (A, B, e) => A.map((a, i) => [a[0] + (B[i][0] - a[0]) * e, a[1] + (B[i][1] - a[1]) * e]);

/* ---------- زينة العوالم ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function spots(P, n, minD, R, box = [40, 760, 60, 1150]) {   // أماكن فارغة بعيدة عن الطريق
  const out = []; let tries = 0;
  while (out.length < n && tries++ < 4000) {
    const x = box[0] + R() * (box[1] - box[0]), y = box[2] + R() * (box[3] - box[2]);
    let ok = true; for (let i = 0; i < P.length; i += 3) if (Math.hypot(P[i][0] - x, P[i][1] - y) < minD) { ok = false; break; }
    if (ok) for (const o of out) if (Math.hypot(o[0] - x, o[1] - y) < minD * .8) { ok = false; break; }
    if (ok) out.push([x, y]);
  }
  return out;
}
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = .5, cy = .5, r = .5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const dl = R => `animation-delay:-${(R() * 4).toFixed(2)}s`;
const stars = (R, n, col = '#fff') => Array.from({ length: n }, () => `<circle class="twk" cx="${(R() * 800).toFixed(0)}" cy="${(R() * 1200).toFixed(0)}" r="${(1 + R() * 2.4).toFixed(1)}" fill="${col}" style="${dl(R)}"/>`).join('');
const cloud = (x, y, s, o = .22) => `<g class="drift" opacity="${o}" style="animation-duration:${(8 + s * 6).toFixed(1)}s"><ellipse cx="${x}" cy="${y}" rx="${70 * s}" ry="${24 * s}" fill="#fff"/><circle cx="${x - 22 * s}" cy="${y - 16 * s}" r="${26 * s}" fill="#fff"/><circle cx="${x + 18 * s}" cy="${y - 22 * s}" r="${32 * s}" fill="#fff"/></g>`;

const ball = (x, y, r, cls = '') => `<g${cls ? ` class="${cls}"` : ''} transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${(r / 24).toFixed(2)})"><circle r="24" fill="#fff" stroke="#0b0730" stroke-width="4"/><path d="M0-11l10.5 7.6-4 12.3h-13l-4-12.3Z" fill="#0b0730"/><path d="M0-11v-13M10.5-3.4l12.4-4M6.5 8.9l7.5 10.5M-6.5 8.9l-7.5 10.5M-10.5-3.4l-12.4-4" stroke="#0b0730" stroke-width="3"/></g>`;
const stripes = (a, b, n = 12, horiz = false) => Array.from({ length: n }, (_, i) => horiz ? `<rect y="${(i * 1200 / n).toFixed(0)}" width="800" height="${(1200 / n + 1).toFixed(0)}" fill="${i % 2 ? a : b}"/>` : `<rect x="${(i * 800 / n).toFixed(0)}" width="${(800 / n + 1).toFixed(0)}" height="1200" fill="${i % 2 ? a : b}"/>`).join('');
const pitchLines = (o = .32) => `<g fill="none" stroke="#fff" stroke-width="6" opacity="${o}"><rect x="40" y="40" width="720" height="1120" rx="6"/><path d="M40 600H760"/><circle cx="400" cy="600" r="110"/><rect x="200" y="40" width="400" height="170"/><rect x="200" y="990" width="400" height="170"/><rect x="300" y="40" width="200" height="66"/><rect x="300" y="1094" width="200" height="66"/></g><circle cx="400" cy="600" r="8" fill="#fff" opacity="${o}"/>`;
const goal = (x, y, s = 1) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s})"><rect x="-38" y="-24" width="76" height="30" fill="#ffffff22" stroke="#fff" stroke-width="5"/><path d="M-30-24v30M-18-24v30M-6-24v30M6-24v30M18-24v30M30-24v30M-38-14h76M-38-4h76" stroke="#fff" stroke-width="1.5" opacity=".6"/></g>`;
const cone = (x, y, s = 1) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s})"><path d="M-6-22h12l9 22h-30Z" fill="#ff7a1a" stroke="#0b0730" stroke-width="3" stroke-linejoin="round"/><path d="M-9-10h18" stroke="#fff" stroke-width="4"/><rect x="-18" y="-2" width="36" height="6" rx="2" fill="#ff7a1a" stroke="#0b0730" stroke-width="3"/></g>`;
const crowd = (R, x0, y0, w, h, cols, step = 16) => { let s = ''; for (let y = y0; y < y0 + h; y += step) for (let x = x0 + (Math.floor(y / step) % 2) * step / 2; x < x0 + w; x += step) s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(4 + R() * 2).toFixed(1)}" fill="${cols[Math.floor(R() * cols.length)]}"/>`; return s; };
const flood = (x, y, s = 1, R) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-4 0V-150" stroke="#0b0730" stroke-width="8"/><rect x="-34" y="-190" width="68" height="44" rx="6" fill="#2a2f3a" stroke="#0b0730" stroke-width="4"/>${[-22, -7, 8, 23].map(dx => [-176, -160].map(dy => `<circle class="twk" style="${dl(R)}" cx="${dx}" cy="${dy}" r="6" fill="#fff8d0"/>`).join('')).join('')}</g>`;

const DECO = [
  (T, P, R) => {   // ٠ ملعب الحارة: عشبٌ مخطّط وخطوط الملعب، مرميان صغيران، كرات، وأشجارٌ على الأطراف
    let s = stripes('#2f8f45', '#287d3c', 10) + pitchLines(.3);
    s += goal(400, 70, 1.4) + `<g transform="rotate(180 400 1130)">${goal(400, 1130, 1.4)}</g>`;
    spots(P, 7, 70, R, [70, 730, 140, 1080]).forEach(([x, y]) => { s += ball(x, y, 11 + R() * 6, 'hop'); });
    [[18, 220], [782, 420], [14, 780], [786, 980], [30, 1170], [770, 40]].forEach(([x, y]) => { const r = 34 + R() * 20; s += `<circle cx="${x}" cy="${y}" r="${r.toFixed(0)}" fill="#1b5e2c" stroke="#0b0730" stroke-width="4"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${(r * .45).toFixed(0)}" fill="#3fae5a"/>`; });
    for (let i = 0; i < 70; i++) { const x = R() * 800, y = R() * 1200; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l3-9 3 9" stroke="#8ee09a" stroke-width="2" fill="none" opacity=".35"/>`; }
    return s;
  },
  (T, P, R) => {   // ١ الأكاديمية: ملعب تدريبٍ بخطوطٍ أفقية، أقماعٌ وسلالم رشاقة ودمى حائط الصدّ
    let s = stripes('#3a9a4c', '#33894a', 14, true);
    s += `<g fill="none" stroke="#fff" stroke-width="5" opacity=".25"><rect x="30" y="30" width="740" height="1140"/><path d="M30 600h740"/></g>`;
    spots(P, 14, 58, R, [50, 750, 80, 1150]).forEach(([x, y], i) => {
      if (i % 4 === 0) { s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${(R() * 40 - 20).toFixed(0)})"><rect x="-14" y="-50" width="28" height="100" fill="none" stroke="#ffe14d" stroke-width="4"/>${[-30, -10, 10, 30].map(d => `<path d="M-14 ${d}h28" stroke="#ffe14d" stroke-width="4"/>`).join('')}</g>`; }
      else if (i % 4 === 1) { s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})">${[-28, 0, 28].map(d => `<g transform="translate(${d} 0)"><rect x="-9" y="-40" width="18" height="40" rx="8" fill="#ffd23f" stroke="#0b0730" stroke-width="3"/><circle cy="-48" r="9" fill="#ffd23f" stroke="#0b0730" stroke-width="3"/></g>`).join('')}</g>`; }
      else s += cone(x, y, .9 + R() * .4) + cone(x + 34, y + 10, .8);
    });
    spots(P, 6, 60, R, [60, 740, 90, 1140]).forEach(([x, y]) => { s += ball(x, y, 10, 'hop'); });
    return s;
  },
  (T, P, R) => {   // ٢ دوري المدينة: ناطحاتٌ بنوافذ مضيئة، وأبراج كشّافات الملاعب
    const g = 'g' + uid++; let s = `<defs>${lin(g, [[0, '#4a5464'], [.6, '#232934'], [1, '#12151b']])}</defs><rect width="800" height="1200" fill="url(#${g})"/>${stars(R, 24, '#dfe6f0')}`;
    s += `<circle cx="120" cy="96" r="38" fill="#f4f6fa" opacity=".85"/>`;
    spots(P, 20, 62, R, [40, 760, 120, 1170]).forEach(([x, y], j) => {
      if (j % 6 === 5) { s += flood(x, y + 30, .7, R); return; }
      const w = 44 + R() * 38, h = 60 + R() * 120, x0 = x - w / 2, y0 = y + 20 - h, c = ['#2b313d', '#353d4b', '#222730'][Math.floor(R() * 3)];
      s += `<rect x="${x0.toFixed(0)}" y="${y0.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${c}" stroke="#0b0730" stroke-width="3"/>`;
      for (let yy = y0 + 10; yy < y0 + h - 16; yy += 20) for (let xx = x0 + 8; xx < x0 + w - 12; xx += 15) s += `<rect x="${xx.toFixed(0)}" y="${yy.toFixed(0)}" width="8" height="10" fill="${R() < .45 ? '#ffe9a8' : '#475063'}"${R() < .15 ? ' class="twk"' : ''}/>`;
    });
    return s;
  },
  (T, P, R, M) => {   // ٣ ليلة الأبطال: سماءٌ زرقاء بنجوم، شعار نجومٍ كبير، أضواءٌ كاشفة، ومنصّةٌ مضيئة تحت كل محطة
    const g = 'g' + uid++, sp = 's' + uid++;
    let s = `<defs>${lin(g, [[0, '#0b4aa8'], [.5, '#06266b'], [1, '#020c2a']])}${rad(sp, [[0, '#aaeeff', .55], [1, '#aaeeff', 0]])}</defs><rect width="800" height="1200" fill="url(#${g})"/>${stars(R, 80)}`;
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, x = 400 + Math.cos(a) * 150, y = 560 + Math.sin(a) * 150; s += `<path class="twk" style="${dl(R)}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(1.6)" d="M0-12l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L0 6.1l-7 3.7 1.3-7.9-5.7-5.6 7.9-1.1Z" fill="#fff" opacity=".22"/>`; }
    s += `<circle cx="400" cy="560" r="96" fill="none" stroke="#fff" stroke-width="4" opacity=".14"/>`;
    [[-60, 1260, -.42], [860, 1260, .42]].forEach(([x, y, a]) => { s += `<path class="flk" d="M${x} ${y}L${x + Math.sin(a) * 1500 - 120} ${y - 1500}L${x + Math.sin(a) * 1500 + 120} ${y - 1500}Z" fill="#cdefff" opacity=".07"/>`; });
    M.forEach(([x, y], i) => { const w = i === M.length - 1 ? 110 : 88; s += `<ellipse cx="${x}" cy="${y + 26}" rx="${w}" ry="${w * .32}" fill="url(#${sp})"/><ellipse cx="${x}" cy="${y + 22}" rx="${w * .7}" ry="${w * .2}" fill="none" stroke="#aaeeff" stroke-width="4" opacity=".6"/>`; });
    return s;
  },
  (T, P, R, M) => {   // ٤ مدرّجات الجماهير: حلقات المدرّجات حول الملعب، والجماهير بألوانٍ وفلاشات كاميرات
    const g = 'g' + uid++; let s = `<defs>${rad(g, [[0, '#46168f'], [1, '#0e0326']], .5, .5, .8)}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    const cols = ['#d580ff', '#ffffff', '#ffe35c', '#ff4fa3', '#4fcbff', '#8a3dff'];
    for (let k = 0; k < 7; k++) {
      const rx = 400 - k * 40, ry = 600 - k * 62;
      s += `<ellipse cx="400" cy="600" rx="${rx}" ry="${ry}" fill="${k % 2 ? '#2a0c5c' : '#33106e'}" stroke="#0b0730" stroke-width="4"/>`;
      const n = Math.round((rx + ry) / 9);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + R() * .05, rr = .88 + R() * .07; s += `<circle cx="${(400 + Math.cos(a) * rx * rr).toFixed(0)}" cy="${(600 + Math.sin(a) * ry * rr).toFixed(0)}" r="4.5" fill="${cols[Math.floor(R() * cols.length)]}" opacity=".85"/>`; }
    }
    s += `<ellipse cx="400" cy="600" rx="112" ry="166" fill="#2f8f45" stroke="#fff" stroke-width="5"/><path d="M288 600h224" stroke="#fff" stroke-width="4" opacity=".6"/><circle cx="400" cy="600" r="34" fill="none" stroke="#fff" stroke-width="4" opacity=".6"/>`;
    for (let i = 0; i < 40; i++) { const a = R() * 6.28, k = R(); s += `<circle class="twk" style="${dl(R)};animation-duration:${(1 + R() * 2).toFixed(1)}s" cx="${(400 + Math.cos(a) * 400 * (.45 + k * .5)).toFixed(0)}" cy="${(600 + Math.sin(a) * 600 * (.45 + k * .5)).toFixed(0)}" r="5" fill="#fff"/>`; }
    return s;
  },
  (T, P, R, M) => {   // ٥ ديربي النار: مدرّجاتٌ حمراء، شعلاتٌ ودخان، ورايات
    const g = 'g' + uid++, fl = 'f' + uid++;
    let s = `<defs>${lin(g, [[0, '#4a1206'], [.5, '#250803'], [1, '#100302']])}${rad(fl, [[0, '#fff0a0'], [.35, '#ffb04a', .9], [1, '#ff4b1c', 0]])}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    for (let b = 0; b < 6; b++) { const y = 60 + b * 200; s += `<rect x="0" y="${y}" width="800" height="120" fill="#2a0904" opacity=".7"/>` + crowd(R, 8, y + 12, 790, 100, ['#ff3b1c', '#0b0730', '#ffb04a', '#7c230a'], 18); }
    spots(P, 9, 70, R, [40, 760, 80, 1160]).forEach(([x, y], i) => {
      if (i % 3 === 0) s += `<g class="drift" style="animation-duration:${(5 + R() * 3).toFixed(1)}s"><path d="M${x} ${y}V${y - 70}" stroke="#0b0730" stroke-width="5"/><path class="wav" d="M${x} ${y - 70}l50 12-50 14Z" fill="${R() < .5 ? '#ff3b1c' : '#ffe35c'}" stroke="#0b0730" stroke-width="3"/></g>`;
      else s += `<circle class="flk" style="${dl(R)}" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(34 + R() * 26).toFixed(0)}" fill="url(#${fl})"/><circle class="drift" cx="${(x + 10).toFixed(0)}" cy="${(y - 50).toFixed(0)}" r="${(22 + R() * 14).toFixed(0)}" fill="#b9a6a0" opacity=".18" style="animation-duration:${(4 + R() * 3).toFixed(1)}s"/>`;
    });
    return s;
  },
  (T, P, R, M) => {   // ٦ نهائي كأس العالم: سماءٌ ذهبية بأشعة، كأسٌ عملاقة تتوهّج، ألعابٌ نارية وقصاصات
    const g = 'g' + uid++; let s = `<defs>${rad(g, [[0, '#ffe680'], [.45, '#c98a10'], [1, '#2a1702']], .5, .1, 1.1)}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + (i - 8.5) * .19; s += `<path class="flk" style="${dl(R)}" d="M400 -40 L${(400 + Math.cos(a - .05) * 1500).toFixed(0)} ${(Math.sin(a - .05) * -1500).toFixed(0)} L${(400 + Math.cos(a + .05) * 1500).toFixed(0)} ${(Math.sin(a + .05) * -1500).toFixed(0)}Z" fill="#fff6c2" opacity=".1"/>`; }
    s += `<g opacity=".16" transform="translate(400 640) scale(9)"><path d="M-12-40h24v12c0 9-5 16-12 16s-12-7-12-16Z M-3-12h6v7h-6Z M-11-5h22v10h-22Z" fill="#fff8c4"/></g>`;
    s += `<path d="M0 1200V1060Q400 960 800 1060V1200Z" fill="#3a2603"/>` + crowd(R, 10, 1080, 780, 110, ['#ffe35c', '#fff', '#d18f0b', '#ff4fa3'], 16);
    spots(P, 5, 90, R, [60, 740, 60, 700]).forEach(([x, y]) => {
      const c = ['#ff4fa3', '#4fcbff', '#8be844', '#fff', '#d580ff'][Math.floor(R() * 5)], d = dl(R);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; s += `<circle class="twk" style="${d}" cx="${(x + Math.cos(a) * 42).toFixed(0)}" cy="${(y + Math.sin(a) * 42).toFixed(0)}" r="5" fill="${c}"/>`; }
      s += `<circle class="twk" style="${d}" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="#fff"/>`;
    });
    for (let i = 0; i < 40; i++) s += `<rect class="hop" style="${dl(R)}" x="${(R() * 800).toFixed(0)}" y="${(R() * 1050).toFixed(0)}" width="10" height="5" fill="${['#ff4fa3', '#4fcbff', '#8be844', '#fff'][i % 4]}" transform="rotate(${(R() * 180).toFixed(0)})" opacity=".8"/>`;
    return s;
  },
];
/* لون الطريق في كل ملعب */
const ROAD = [
  { body: '#c9a46a', line: '#ffffff', dash: '2 22', lw: 6 },
  { body: '#efe7d2', line: '#ff7a1a', dash: '12 20', lw: 8 },
  { body: '#2b2f37', line: '#ffd23f', dash: '22 18', lw: 5 },
  { body: '#0d2a6b', line: '#aaeeff', dash: '2 18', lw: 7 },
  { body: '#c8463a', line: '#ffffff', dash: '40 8', lw: 3 },
  { body: '#3a1f17', line: '#ff7b1c', dash: '18 14', lw: 5 },
  { body: '#5b3a07', line: '#ffe35c', dash: '7 9', lw: 22 },
];

/* ---------- الحالة ---------- */
let S;
if (DEMO != null) {
  S = F.season(null); S.start = F.ymd(new Date(Date.now() - 4 * 864e5));
  if (DEMO) S.log = { demo0: { c: 'parent', p: Math.round(DEMO), d: F.ymd(new Date(Date.now() - 864e5)), t: Date.now() - 864e5 } };
} else {
  const st = F.lget(F.KEY, null); S = st && st.rby && (st.rst || 0) >= F.SEASON ? st : F.season(null);   // الخريطة تقرأ فقط ولا تكتب
}
const stats = () => { const { total } = F.calc(S), G = F.goalOf(S); return { total, G, f: clamp(total / G, 0, 1), k: F.tierOf(total, G), dn: F.dnum(F.today()) - F.dnum(S.start) + 1 }; };

/* ---------- الرسم ---------- */
const svg = $('#map'), el = id => svg.querySelector('#' + id);
let P = WORLDS[0], view = 0, shownF = 0, busy = false;
const fracs = () => [0, ...TIERS.slice(1).map(t => t.f)];   // البداية ثم الرتب الست (آخرها الجائزة)

function setRoadStyle(k) {
  const r = ROAD[k];
  el('r-body').setAttribute('stroke', r.body); el('r-body').setAttribute('stroke-opacity', r.op || 1);
  el('r-line').setAttribute('stroke', r.line); el('r-line').setAttribute('stroke-dasharray', r.dash); el('r-line').setAttribute('stroke-width', r.lw);
}
function setBg(k, fade) {
  const R = rng(1000 + k * 97), marks = fracs().map(f => at(WORLDS[k], f));
  const g = document.createElementNS(NS, 'g'); g.innerHTML = DECO[k](TIERS[k], WORLDS[k], R, marks);
  const holder = el('bg');
  if (fade && g.animate) {
    g.style.opacity = 0; holder.appendChild(g);
    g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1300, easing: 'ease', fill: 'forwards' }).onfinish = () => { [...holder.children].forEach(c => { if (c !== g) c.remove(); }); g.style.opacity = 1; };
  } else { holder.innerHTML = ''; holder.appendChild(g); }
}
function buildMarks() {   // المحطات والأعلام والبداية والجائزة ونوح — تُبنى مرةً ثم تتحرّك مع الطريق
  const { total, G, dn } = stats(); let nextSet = false, h = '';
  [7, 14, 21, 28].forEach((d, i) => {
    const need = Math.round(G * d / F.DAYS / 50) * 50, ok = total >= need, miss = !ok && dn > d;
    h += `<g class="wk" data-f="${d / F.DAYS}"><path d="M0 0V-50" stroke="#0b0730" stroke-width="5"/><path d="M0-50L40-41L0-32Z" fill="${ok ? '#3ddc6a' : miss ? '#ff3b4e' : '#ffffff'}" stroke="#0b0730" stroke-width="3" stroke-linejoin="round"/><text x="15" y="-34" text-anchor="middle" font-size="18" fill="#0b0730">${AR(i + 1)}</text></g>`;
  });
  h += `<g class="mk-start" data-f="0"><circle r="30" fill="#fff" stroke="#0b0730" stroke-width="5"/><text y="12" text-anchor="middle" font-size="32">⚽</text><text class="lbl-s" y="64" text-anchor="middle">صافِرَةُ الْبِدايَة</text></g>`;
  TIERS.slice(1).forEach((T, j) => {
    const i = j + 1, need = F.need(G, i), on = total >= need, nx = !on && !nextSet; if (nx) nextSet = true;
    const end = i === 6, tile = F.tile(i).replace('<svg class="tile"', `<svg class="tile" x="${end ? -40 : -32}" y="${end ? -47 : -38}" width="${end ? 80 : 64}" height="${end ? 94 : 75}"`);
    h += `<g class="st ${on ? 'on' : nx ? 'next' : 'lock'}" data-f="${T.f}" data-i="${i}">
      ${nx || end ? `<circle class="pls" r="50" fill="${T.t1}" opacity=".5"/>` : ''}<circle r="${end ? 56 : 46}" fill="${T.t1}" opacity="${on ? .45 : .2}"/>
      <g class="pop" style="animation-delay:${.25 + j * .12}s;${on || end ? '' : 'opacity:.6;filter:grayscale(.8)'}">${end ? `<image href="img/ball.webp" x="-46" y="-46" width="92" height="92"/>` : tile}</g>
      ${on ? `<g transform="translate(26 -30)"><circle r="15" fill="#21b25b" stroke="#0b0730" stroke-width="3"/><text y="7" text-anchor="middle" font-size="20" fill="#fff">✓</text></g>` : !nx ? `<text x="28" y="-24" font-size="24">🔒</text>` : ''}
      <g class="lb"><rect x="-104" y="-38" width="208" height="76" rx="16" fill="#0b0730" fill-opacity=".8" stroke="${T.t1}" stroke-width="3"/>
        <text class="lbl-n" y="-4" text-anchor="middle" fill="${T.t1}">${end ? '🏆 ' : ''}${T.n}</text>
        <text class="lbl-s" y="28" text-anchor="middle">${on ? (end ? '⚽ الْكُرَةُ الذَّهَبِيَّةُ لَكَ!' : '✓ وَصَلْتَها') : (end ? `⚽ الْكُرَةُ الذَّهَبِيَّةُ: ${AR(need)}` : AR(need) + ' نُقْطَة')}</text></g></g>`;
  });
  el('mk').innerHTML = h;
  el('me').innerHTML = `<circle class="pls" r="46" style="fill:var(--t1)"/><circle r="40" fill="#fff" stroke="#0b0730" stroke-width="5"/><circle r="36" fill="none" style="stroke:var(--t1)" stroke-width="5"/>
    <image href="img/avatar.webp" x="-33" y="-33" width="66" height="66" clip-path="url(#avc)" preserveAspectRatio="xMidYMid slice"/>
    <g transform="translate(0 66)"><rect x="-86" y="-24" width="172" height="44" rx="22" style="fill:var(--t1)" stroke="#0b0730" stroke-width="4"/><text y="8" text-anchor="middle" font-size="24" fill="#0b0730">أَنا هُنا · ${AR(total)}</text></g>`;
}
function place(Pts, f) {   // يرسم الطريق ويضع كل علامةٍ في مكانها على الشكل الحالي
  const d = dOf(Pts); el('r-bed').setAttribute('d', d); el('r-body').setAttribute('d', d); el('r-line').setAttribute('d', d);
  const dd = dOf(Pts, f); el('r-done').setAttribute('d', dd); el('r-done2').setAttribute('d', dd);
  svg.querySelectorAll('[data-f]').forEach(g => { const [x, y] = at(Pts, +g.dataset.f); g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); });
  const [mx, my] = at(Pts, f); el('me').setAttribute('transform', `translate(${mx.toFixed(1)} ${my.toFixed(1)})`);
}
/* بطاقات المحطات: لكلٍّ منها ثمانية أماكن حولها، تأخذ الذي يغطّي أقلّ ما يمكن من الطريق
   ولا يصطدم ببطاقةٍ أخرى ولا بمحطةٍ ولا بنوح — فتبقى الخريطة واضحة في كل شكلٍ من أشكالها */
const CANDS = [[-162, 0], [162, 0], [0, -98], [0, 98], [-150, -82], [150, -82], [-150, 82], [150, 82]];
function layoutLabels(Pts, fMe) {
  const [ax, ay] = at(Pts, fMe), rects = [[ax - 50, ay - 50, ax + 50, ay + 50], [ax - 92, ay + 40, ax + 92, ay + 92]];
  const sts = [...svg.querySelectorAll('.st')];
  sts.forEach(g => { const [x, y] = at(Pts, +g.dataset.f); rects.push([x - 52, y - 52, x + 52, y + 52]); });
  svg.querySelectorAll('.mk-start').forEach(() => { const [x, y] = at(Pts, 0); rects.push([x - 40, y - 36, x + 40, y + 80]); });
  sts.forEach(g => {
    const [x, y] = at(Pts, +g.dataset.f); let best = null, bs = Infinity;
    CANDS.forEach(([dx, dy]) => {
      const cx = clamp(x + dx, 112, W - 112), cy = clamp(y + dy, 46, H - 46), r = [cx - 104, cy - 38, cx + 104, cy + 38];
      let sc = (Math.abs(cx - x - dx) + Math.abs(cy - y - dy)) * .6;
      for (let i = 0; i < Pts.length; i += 2) { const [px, py] = Pts[i]; if (px > r[0] - 22 && px < r[2] + 22 && py > r[1] - 22 && py < r[3] + 22) sc += 3; }
      rects.forEach(q => { const ox = Math.max(0, Math.min(r[2], q[2]) - Math.max(r[0], q[0])), oy = Math.max(0, Math.min(r[3], q[3]) - Math.max(r[1], q[1])); sc += ox * oy * .05; });
      if (sc < bs) { bs = sc; best = [cx - x, cy - y, r]; }
    });
    rects.push(best[2]);
    g.querySelector('.lb').style.transform = `translate(${best[0].toFixed(1)}px,${best[1].toFixed(1)}px)`;
  });
}
function travel(to, dur = 2200) {   // نوح يركض على الطريق من موضعه إلى نقاطه، والطريق يتوهّج خلفه
  return new Promise(res => {
    const from = shownF, t0 = performance.now();
    if (F.REDUCE || Math.abs(to - from) < .001) { shownF = to; place(P, to); return res(); }
    const step = now => { const k = Math.min(1, (now - t0) / dur); shownF = from + (to - from) * ease(k); place(P, shownF); if (k < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
    setTimeout(() => { if (shownF !== to && (performance.now() - t0) > dur + 400) { shownF = to; place(P, to); res(); } }, dur + 500);
  });
}
function morph(toK, label) {   // الطريق يتحوّل نقطةً بنقطة إلى شكل الملعب الجديد، والألوان تكتسح الشاشة
  return new Promise(res => {
    busy = true; const A = P, B = WORLDS[toK], t0 = performance.now(), dur = F.REDUCE ? 1 : 1900; let styled = false;
    banner('🏟️ الْمَلْعَبُ يَتَحَوَّلُ…', TIERS[toK].ic + ' ' + TIERS[toK].w);
    F.wipe(toK, innerWidth / 2, innerHeight * .45);
    setBg(toK, true);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur); P = lerp(A, B, ease(k)); place(P, shownF);
      if (!styled && k > .5) { styled = true; setRoadStyle(toK); }
      if (k < 1) requestAnimationFrame(step); else { P = B; view = toK; place(P, shownF); layoutLabels(P, shownF); busy = false; hud(); gallery(); setTimeout(() => banner(), 1300); res(); }
    };
    requestAnimationFrame(step);
  });
}
let bt = 0;
function banner(small, big) {
  const b = $('#mbanner'); clearTimeout(bt);
  if (!small) { b.classList.remove('on'); return; }
  b.innerHTML = `<small>${small}</small><b>${big}</b>`; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  bt = setTimeout(() => b.classList.remove('on'), 3600);
}
function hud() {
  const { total, G, f, k, dn } = stats(), T = TIERS[view];
  $('#mworld').innerHTML = `${F.tile(view)}<span>${T.ic} ${T.w}</span>`;
  $('#h-pts').textContent = AR(total);
  $('#h-pct').textContent = AR(Math.round(f * 100)) + '٪';
  const nx = TIERS.findIndex((t, i) => i > 0 && total < F.need(G, i));
  $('#h-next').textContent = nx > 0 ? `${TIERS[nx].n}` : '🏆';
  $('#h-next-s').textContent = nx > 0 ? `باقي ${AR(F.need(G, nx) - total)}` : 'وَصَلْتَ!';
  $('#h-day').textContent = dn < 1 ? 'السَّبْت' : dn > F.DAYS ? '🏁' : AR(Math.max(0, F.DAYS - dn + 1));
  $('#h-day-s').textContent = dn < 1 ? 'صافِرَةُ الْبِدايَةِ' : dn > F.DAYS ? 'انْتَهى الْمَوْسِمُ' : 'يَوْماً قَبْلَ النِّهائِيِّ';
  $('#mback').classList.toggle('on', view !== k);
}
function gallery() {   // الملاعب السبعة: المفتوح يُعايَن، والمقفل يُظهر متى يُفتح
  const { total, G, k } = stats();
  $('#worlds').innerHTML = TIERS.map((T, i) => {
    const need = i ? F.need(G, i) : 0, on = total >= need, g = 'w' + uid++;
    return `<button class="wd ${on ? '' : 'lock'} ${i === k ? 'cur' : ''} ${i === view && i !== k ? 'view' : ''}" data-k="${i}" style="--c:${T.t1};--c2:${T.t2}">
      <svg viewBox="0 0 800 1200"><defs>${lin(g, [[0, T.bg2], [1, T.bg1]])}</defs><rect width="800" height="1200" fill="url(#${g})"/><path d="${dOf(WORLDS[i])}" fill="none" stroke="#0b0730" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="${dOf(WORLDS[i])}" fill="none" stroke="${T.t1}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>${T.ic} ${T.w}</b><small>${i === k ? '📍 مَلْعَبُكَ' : on ? 'مَفْتوحٌ — عايِنْهُ' : '🔒 ' + AR(need)}</small></button>`;
  }).join('');
}
$('#worlds').addEventListener('click', e => {
  const b = e.target.closest('.wd'); if (!b || busy) return;
  const i = +b.dataset.k, { total, G } = stats();
  if (i && total < F.need(G, i)) { banner('🔒 هذا الْمَلْعَبُ مُقْفَل', `يُفْتَحُ عِنْدَ ${AR(F.need(G, i))}`); b.animate && b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
  if (i !== view) { morph(i); scrollTo({ top: $('#map').getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); }
});
$('#mback').addEventListener('click', () => { const { k } = stats(); if (!busy && view !== k) morph(k); });

/* ---------- البداية ---------- */
F.boot();
async function start() {
  const st = stats(), k = WORLD != null ? WORLD : st.k, seen = LIVE ? F.lget(MAPK, null) : null;
  const from = seen != null && seen < k ? seen : k;
  view = from; P = WORLDS[from]; F.applyTheme(from); setRoadStyle(from); setBg(from); buildMarks(); place(P, 0); layoutLabels(P, st.f); hud(); gallery();
  await new Promise(r => setTimeout(r, 450));
  await travel(st.f);
  if (from !== k) { await new Promise(r => setTimeout(r, 500)); await morph(k); }   // رتبةٌ جديدة منذ آخر زيارة: الخريطة تتحوّل أمامه
  if (LIVE) F.lset(MAPK, k);
}
start();
if (window.EliaSave && LIVE) EliaSave.on(F.KEY, st => {
  if (!st || !st.start) return; const s2 = F.season(st); if (!(s2 === st)) return;
  S = st; const { f, k } = stats(); buildMarks(); place(P, shownF); layoutLabels(P, f); hud(); gallery();
  travel(f, 1400).then(() => { if (k > view && !busy) { morph(k); F.lset(MAPK, k); } });
});
addEventListener('resize', () => place(P, shownF));
window.__map = { morph, travel, get view() { return view; } };
})();
