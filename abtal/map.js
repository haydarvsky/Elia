/* إيليافسكي — خريطة العوالم
   سبعة عوالم، لكلٍّ منها شكلٌ للطريق وزينته: ثعبانٌ في جزيرة الهبوط، شوارع المدينة، دربٌ متعرّج في الغابة،
   جسورٌ بين الجزر، دوّامة المجرّة، صعودٌ متعرّج إلى قمة البركان، وأفعوانية الذهب بحلقتيها.
   كل طريقٍ يُعاد أخذه بـN نقطةٍ متساوية الطول، فيتحوّل الطريق إلى شكل العالم التالي نقطةً بنقطة عند كل نُدرةٍ جديدة.
   ?demo=5000 يعرض الخريطة بنقاطٍ تجريبية، و?world=3 يعرض عالماً بعينه — والمعاينة لا تحفظ شيئاً. */
(() => {
'use strict';
const F = window.Fort, { TIERS, AR, $ } = F;
const W = 800, H = 1200, N = 260, MAPK = 'elia-fort-mapk', PX = 96, PY = 124, NS = 'http://www.w3.org/2000/svg';
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

const DECO = [
  (T, P, R, M) => {   // ٠ جزيرة الهبوط: ليلٌ فوق البحر، جزرٌ صغيرة، غيوم، والباص الطائر
    const g = 'g' + uid++; let s = `<defs>${lin(g, [[0, '#33468a'], [.5, '#1a2656'], [1, '#0a1030']])}</defs><rect width="800" height="1200" fill="url(#${g})"/>${stars(R, 46)}`;
    s += `<circle cx="650" cy="120" r="44" fill="#fff6d0" opacity=".9"/><circle cx="650" cy="120" r="90" fill="#fff6d0" opacity=".08"/>`;
    spots(P, 9, 80, R).forEach(([x, y]) => { const w = 34 + R() * 30; s += `<g class="hop" style="${dl(R)};animation-duration:${(3 + R() * 2).toFixed(1)}s"><ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * .42}" fill="#e9cf8f" stroke="#0b0730" stroke-width="3"/><ellipse cx="${x}" cy="${y - 5}" rx="${w * .66}" ry="${w * .26}" fill="#3fae5a"/></g>`; });
    for (let i = 0; i < 5; i++) s += cloud(60 + R() * 600, 80 + R() * 1000, .6 + R() * .7);
    s += `<g class="drift" style="animation-duration:11s"><g transform="translate(120 150) scale(.8)"><path d="M0-70c-24 0-40 16-40 36 0 16 12 28 26 35l-5 16h38l-5-16c14-7 26-19 26-35 0-20-16-36-40-36Z" fill="#7fd6ff" stroke="#0b0730" stroke-width="4"/><path d="M-14 1-22 16M14 1l8 15" stroke="#0b0730" stroke-width="3"/><rect x="-44" y="14" width="88" height="30" rx="8" fill="#2f6bff" stroke="#0b0730" stroke-width="4"/><path d="M-34 21h14v10h-14zM-12 21h14v10h-14zM10 21h14v10h-14z" fill="#bfeaff"/></g></g>`;
    return s;
  },
  (T, P, R) => {   // ١ المدينة: ناطحاتٌ بنوافذ مضيئة بين الشوارع
    const g = 'g' + uid++; let s = `<defs>${lin(g, [[0, '#4a5464'], [.6, '#232934'], [1, '#12151b']])}</defs><rect width="800" height="1200" fill="url(#${g})"/>${stars(R, 24, '#dfe6f0')}`;
    s += `<circle cx="120" cy="96" r="38" fill="#f4f6fa" opacity=".85"/>`;
    spots(P, 22, 62, R, [40, 760, 120, 1170]).forEach(([x, y]) => {
      const w = 44 + R() * 38, h = 60 + R() * 120, x0 = x - w / 2, y0 = y + 20 - h, c = ['#2b313d', '#353d4b', '#222730'][Math.floor(R() * 3)];
      s += `<rect x="${x0.toFixed(0)}" y="${y0.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${c}" stroke="#0b0730" stroke-width="3"/>`;
      for (let yy = y0 + 10; yy < y0 + h - 16; yy += 20) for (let xx = x0 + 8; xx < x0 + w - 12; xx += 15) s += `<rect x="${xx.toFixed(0)}" y="${yy.toFixed(0)}" width="8" height="10" fill="${R() < .45 ? '#ffe9a8' : '#475063'}"${R() < .15 ? ' class="twk"' : ''}/>`;
      if (R() < .4) s += `<path d="M${x} ${y0}v-22" stroke="#0b0730" stroke-width="3"/><circle cx="${x}" cy="${y0 - 24}" r="4" fill="#ff4b4b" class="twk"/>`;
    });
    return s;
  },
  (T, P, R) => {   // ٢ الغابة: أشجارٌ وشجيراتٌ ويراعات
    const g = 'g' + uid++; let s = `<defs>${rad(g, [[0, '#2a8a3d'], [.6, '#14552a'], [1, '#062012']], .5, .45, .75)}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    for (let i = 0; i < 90; i++) { const x = R() * 800, y = R() * 1200; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l4-12 4 12" stroke="#5fcf6a" stroke-width="2.5" fill="none" opacity=".35"/>`; }
    spots(P, 24, 66, R).forEach(([x, y]) => {
      const k = .8 + R() * .5, c = ['#145a26', '#1f7a33', '#2fa84a'];
      s += `<g class="hop" style="${dl(R)};animation-duration:${(4 + R() * 3).toFixed(1)}s"><rect x="${x - 6 * k}" y="${y - 6}" width="${12 * k}" height="${24 * k}" fill="#6b4320" stroke="#0b0730" stroke-width="3"/>`;
      [[0, 46, 64], [-30, 38, 52], [-56, 30, 40]].forEach(([dy, hw, hh], j) => { s += `<path d="M${x} ${y - 6 + (dy - hh) * k}L${x - hw * k} ${y - 6 + dy * k}H${x + hw * k}Z" fill="${c[j]}" stroke="#0b0730" stroke-width="3" stroke-linejoin="round"/>`; });
      s += `</g>`;
    });
    for (let i = 0; i < 26; i++) s += `<circle class="twk" cx="${(R() * 800).toFixed(0)}" cy="${(R() * 1200).toFixed(0)}" r="3" fill="#f6ff8a" style="${dl(R)}"/>`;
    return s;
  },
  (T, P, R, M) => {   // ٣ الجزر: بحرٌ وأمواج، وجزيرةٌ تحت كل محطة يصلها جسر
    const g = 'g' + uid++; let s = `<defs>${lin(g, [[0, '#1477d6'], [.5, '#0b4aa8'], [1, '#04205e']])}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    for (let i = 0; i < 44; i++) { const x = R() * 800, y = R() * 1200; s += `<path class="wav" style="${dl(R)}" d="M${x.toFixed(0)} ${y.toFixed(0)}q12-10 24 0t24 0" stroke="#bfefff" stroke-width="3" fill="none" opacity=".35"/>`; }
    M.forEach(([x, y], i) => {
      const w = i === M.length - 1 ? 110 : 92;
      s += `<ellipse cx="${x}" cy="${y + 14}" rx="${w + 10}" ry="${w * .55}" fill="#6fd3ff" opacity=".35"/><ellipse cx="${x}" cy="${y + 8}" rx="${w}" ry="${w * .5}" fill="#f2d49b" stroke="#0b0730" stroke-width="4"/><ellipse cx="${x}" cy="${y + 2}" rx="${w * .72}" ry="${w * .32}" fill="#3fae5a"/>`;
      const px = x + (x > 400 ? -w * .62 : w * .62), py = y - 4;
      s += `<path d="M${px} ${py}q6-40 -6-74" stroke="#7a4a22" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#2fa84a" stroke="#0b0730" stroke-width="2.5"><path d="M${px - 6} ${py - 74}q-30-6-44 14q24-6 44-14Z"/><path d="M${px - 6} ${py - 74}q30-10 44 8q-24-2-44-8Z"/><path d="M${px - 6} ${py - 74}q-6-30 14-40q-4 22-14 40Z"/></g>`;
    });
    spots(P, 5, 110, R).forEach(([x, y]) => { s += `<g class="drift" style="animation-duration:${(6 + R() * 4).toFixed(1)}s"><path d="M${x - 30} ${y}h60l-10 16h-40Z" fill="#ff7a1a" stroke="#0b0730" stroke-width="3"/><path d="M${x} ${y - 4}v-44l26 40Z" fill="#fff" stroke="#0b0730" stroke-width="3"/></g>`; });
    return s;
  },
  (T, P, R, M) => {   // ٤ المجرة: سدمٌ ونجومٌ وكواكب، والجائزة شمسٌ في القلب
    const g = 'g' + uid++, n1 = 'n' + uid++, n2 = 'n' + uid++, n3 = 'n' + uid++, sun = 's' + uid++;
    let s = `<defs>${rad(g, [[0, '#5a1fa8'], [.55, '#220a52'], [1, '#07021a']], .5, .45, .8)}${rad(n1, [[0, '#ff4fa3', .45], [1, '#ff4fa3', 0]])}${rad(n2, [[0, '#4fcbff', .35], [1, '#4fcbff', 0]])}${rad(n3, [[0, '#d580ff', .45], [1, '#d580ff', 0]])}${rad(sun, [[0, '#ffffff'], [.25, '#fff2b0'], [.55, '#f1caff', .6], [1, '#d580ff', 0]])}</defs>`;
    s += `<rect width="800" height="1200" fill="url(#${g})"/><circle cx="170" cy="260" r="260" fill="url(#${n1})"/><circle cx="660" cy="880" r="280" fill="url(#${n2})"/><circle cx="560" cy="300" r="220" fill="url(#${n3})"/>${stars(R, 96)}`;
    const [ex, ey] = M[M.length - 1]; s += `<circle class="flk" cx="${ex}" cy="${ey}" r="170" fill="url(#${sun})"/>`;
    spots(P, 4, 120, R).forEach(([x, y], i) => {
      const r = 26 + R() * 22, c = [['#ffb04a', '#d6461a'], ['#4fcbff', '#1558d6'], ['#8be844', '#1d8a2d'], ['#ff8ac8', '#b8238a']][i % 4], pg = 'p' + uid++;
      s += `<defs>${rad(pg, [[0, c[0]], [1, c[1]]], .35, .35, .8)}</defs><g class="hop" style="animation-duration:${(5 + R() * 3).toFixed(1)}s"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${pg})" stroke="#0b0730" stroke-width="3"/>${i % 2 ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.8}" ry="${r * .45}" fill="none" stroke="#f1caff" stroke-width="4" transform="rotate(-18 ${x} ${y})"/>` : ''}</g>`;
    });
    return s;
  },
  (T, P, R, M) => {   // ٥ البركان: جبلٌ ضخم، حممٌ تتوهّج، والجائزة على القمة
    const g = 'g' + uid++, mt = 'm' + uid++, lv = 'l' + uid++;
    let s = `<defs>${lin(g, [[0, '#4a1206'], [.5, '#250803'], [1, '#100302']])}${lin(mt, [[0, '#6a3322'], [1, '#2a120b']])}${rad(lv, [[0, '#fff0a0'], [.4, '#ffb04a'], [1, '#ff4b1c', 0]])}</defs>`;
    s += `<rect width="800" height="1200" fill="url(#${g})"/><circle class="flk" cx="400" cy="150" r="230" fill="url(#${lv})" opacity=".55"/>`;
    s += `<path d="M10 1195 L330 168 Q400 140 470 168 L790 1195Z" fill="url(#${mt})" stroke="#0b0730" stroke-width="6" stroke-linejoin="round"/>`;
    s += `<path class="flk" d="M372 170 C350 330 300 420 250 600 M428 170 C470 360 520 470 560 700 M400 175 C405 300 380 380 395 480" stroke="#ff7b1c" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`;
    s += `<ellipse class="flk" cx="400" cy="160" rx="74" ry="24" fill="#ffb04a" stroke="#0b0730" stroke-width="4"/>`;
    spots(P, 14, 56, R, [40, 760, 300, 1170]).forEach(([x, y]) => { const r = 10 + R() * 16; s += `<path d="M${x - r} ${y}l${r * .5}-${r}h${r}l${r * .5} ${r}Z" fill="#4a2418" stroke="#0b0730" stroke-width="3"/>`; });
    for (let i = 0; i < 7; i++) s += `<circle class="drift" cx="${360 + R() * 80}" cy="${60 + R() * 70}" r="${16 + R() * 18}" fill="#b9a6a0" opacity=".22" style="animation-duration:${(5 + R() * 4).toFixed(1)}s"/>`;
    return s;
  },
  (T, P, R, M) => {   // ٦ أفعوانية الذهب: سماءٌ ذهبية، أعمدة الأفعوانية، وألعابٌ نارية
    const g = 'g' + uid++; let s = `<defs>${rad(g, [[0, '#ffe680'], [.45, '#c98a10'], [1, '#2a1702']], .5, .1, 1.1)}</defs><rect width="800" height="1200" fill="url(#${g})"/>`;
    for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + (i - 8.5) * .19; s += `<path class="flk" style="${dl(R)}" d="M400 -40 L${(400 + Math.cos(a - .05) * 1500).toFixed(0)} ${(Math.sin(a - .05) * -1500).toFixed(0)} L${(400 + Math.cos(a + .05) * 1500).toFixed(0)} ${(Math.sin(a + .05) * -1500).toFixed(0)}Z" fill="#fff6c2" opacity=".1"/>`; }
    for (let i = 4; i < P.length - 4; i += 7) s += `<path d="M${P[i][0].toFixed(0)} ${(P[i][1] + 18).toFixed(0)}V1200" stroke="#6a4308" stroke-width="6" opacity=".55"/>`;
    spots(P, 5, 90, R, [60, 740, 60, 700]).forEach(([x, y]) => {
      const c = ['#ff4fa3', '#4fcbff', '#8be844', '#fff', '#d580ff'][Math.floor(R() * 5)], d = dl(R);
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; s += `<circle class="twk" style="${d}" cx="${(x + Math.cos(a) * 42).toFixed(0)}" cy="${(y + Math.sin(a) * 42).toFixed(0)}" r="5" fill="${c}"/>`; }
      s += `<circle class="twk" style="${d}" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="#fff"/>`;
    });
    for (let i = 0; i < 40; i++) s += `<rect class="hop" style="${dl(R)}" x="${(R() * 800).toFixed(0)}" y="${(R() * 1200).toFixed(0)}" width="10" height="5" fill="${['#ff4fa3', '#4fcbff', '#8be844', '#fff'][i % 4]}" transform="rotate(${(R() * 180).toFixed(0)})" opacity=".8"/>`;
    return s;
  },
];
/* لون الطريق في كل عالم */
const ROAD = [
  { body: '#e8cf98', line: '#ffffff', dash: '2 22', lw: 6 },
  { body: '#2b2f37', line: '#ffd23f', dash: '22 18', lw: 5 },
  { body: '#9a6a3a', line: '#d9ad74', dash: '6 16', lw: 5 },
  { body: '#c08a4a', line: '#6b4320', dash: '5 11', lw: 26 },
  { body: '#ffffff', line: '#ffffff', dash: '2 16', lw: 6, op: .22 },
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
const fracs = () => [0, ...TIERS.slice(1).map(t => t.f)];   // البداية ثم النُّدرات الست (آخرها الجائزة)

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
function buildMarks() {   // المحطات والأعلام والبداية والجائزة وإيليا — تُبنى مرةً ثم تتحرّك مع الطريق
  const { total, G, dn } = stats(); let nextSet = false, h = '';
  [7, 14, 21, 28].forEach((d, i) => {
    const need = Math.round(G * d / F.DAYS / 50) * 50, ok = total >= need, miss = !ok && dn > d;
    h += `<g class="wk" data-f="${d / F.DAYS}"><path d="M0 0V-50" stroke="#0b0730" stroke-width="5"/><path d="M0-50L40-41L0-32Z" fill="${ok ? '#3ddc6a' : miss ? '#ff3b4e' : '#ffffff'}" stroke="#0b0730" stroke-width="3" stroke-linejoin="round"/><text x="15" y="-34" text-anchor="middle" font-size="18" fill="#0b0730">${AR(i + 1)}</text></g>`;
  });
  h += `<g class="mk-start" data-f="0"><circle r="30" fill="#fff" stroke="#0b0730" stroke-width="5"/><text y="12" text-anchor="middle" font-size="32">🚌</text><text class="lbl-s" y="64" text-anchor="middle">الْبِدايَة</text></g>`;
  TIERS.slice(1).forEach((T, j) => {
    const i = j + 1, need = F.need(G, i), on = total >= need, nx = !on && !nextSet; if (nx) nextSet = true;
    const end = i === 6, tile = F.tile(i).replace('<svg class="tile"', `<svg class="tile" x="${end ? -40 : -32}" y="${end ? -47 : -38}" width="${end ? 80 : 64}" height="${end ? 94 : 75}"`);
    h += `<g class="st ${on ? 'on' : nx ? 'next' : 'lock'}" data-f="${T.f}" data-i="${i}">
      ${nx || end ? `<circle class="pls" r="50" fill="${T.t1}" opacity=".5"/>` : ''}<circle r="${end ? 56 : 46}" fill="${T.t1}" opacity="${on ? .45 : .2}"/>
      <g class="pop" style="animation-delay:${.25 + j * .12}s;${on ? '' : 'opacity:.6;filter:grayscale(.8)'}">${tile}</g>
      ${on ? `<g transform="translate(26 -30)"><circle r="15" fill="#21b25b" stroke="#0b0730" stroke-width="3"/><text y="7" text-anchor="middle" font-size="20" fill="#fff">✓</text></g>` : !nx ? `<text x="28" y="-24" font-size="24">🔒</text>` : ''}
      <g class="lb"><rect x="-104" y="-38" width="208" height="76" rx="16" fill="#0b0730" fill-opacity=".8" stroke="${T.t1}" stroke-width="3"/>
        <text class="lbl-n" y="-4" text-anchor="middle" fill="${T.t1}">${end ? '👑 ' : ''}${T.n}</text>
        <text class="lbl-s" y="28" text-anchor="middle">${on ? (end ? '💵 الْجائِزَةُ لَكَ!' : '✓ مَعَكَ') : (end ? `💵 الْجائِزَةُ: ${AR(need)}` : AR(need) + ' نُقْطَة')}</text></g></g>`;
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
   ولا يصطدم ببطاقةٍ أخرى ولا بمحطةٍ ولا بإيليا — فتبقى الخريطة واضحة في كل شكلٍ من أشكالها */
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
function travel(to, dur = 2200) {   // إيليا يمشي على الطريق من موضعه إلى نقاطه، والطريق يتوهّج خلفه
  return new Promise(res => {
    const from = shownF, t0 = performance.now();
    if (F.REDUCE || Math.abs(to - from) < .001) { shownF = to; place(P, to); return res(); }
    const step = now => { const k = Math.min(1, (now - t0) / dur); shownF = from + (to - from) * ease(k); place(P, shownF); if (k < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
    setTimeout(() => { if (shownF !== to && (performance.now() - t0) > dur + 400) { shownF = to; place(P, to); res(); } }, dur + 500);
  });
}
function morph(toK, label) {   // الطريق يتحوّل نقطةً بنقطة إلى شكل العالم الجديد، والألوان تكتسح الشاشة
  return new Promise(res => {
    busy = true; const A = P, B = WORLDS[toK], t0 = performance.now(), dur = F.REDUCE ? 1 : 1900; let styled = false;
    banner('🗺️ الْخَريطَةُ تَتَحَوَّلُ…', TIERS[toK].ic + ' ' + TIERS[toK].w);
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
  $('#h-next').textContent = nx > 0 ? `${TIERS[nx].n}` : '👑';
  $('#h-next-s').textContent = nx > 0 ? `باقي ${AR(F.need(G, nx) - total)}` : 'وَصَلْتَ!';
  $('#h-day').textContent = dn < 1 ? 'السَّبْت' : dn > F.DAYS ? '🏁' : AR(Math.max(0, F.DAYS - dn + 1));
  $('#h-day-s').textContent = dn < 1 ? 'يَبْدَأُ الْمَوْسِمُ' : dn > F.DAYS ? 'انْتَهى الْمَوْسِمُ' : 'يَوْماً قَبْلَ الْعاصِفَةِ';
  $('#mback').classList.toggle('on', view !== k);
}
function gallery() {   // العوالم السبعة: المفتوح يُعايَن، والمقفل يُظهر متى يُفتح
  const { total, G, k } = stats();
  $('#worlds').innerHTML = TIERS.map((T, i) => {
    const need = i ? F.need(G, i) : 0, on = total >= need, g = 'w' + uid++;
    return `<button class="wd ${on ? '' : 'lock'} ${i === k ? 'cur' : ''} ${i === view && i !== k ? 'view' : ''}" data-k="${i}" style="--c:${T.t1};--c2:${T.t2}">
      <svg viewBox="0 0 800 1200"><defs>${lin(g, [[0, T.bg2], [1, T.bg1]])}</defs><rect width="800" height="1200" fill="url(#${g})"/><path d="${dOf(WORLDS[i])}" fill="none" stroke="#0b0730" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="${dOf(WORLDS[i])}" fill="none" stroke="${T.t1}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <b>${T.ic} ${T.w}</b><small>${i === k ? '📍 عالَمُكَ' : on ? 'مَفْتوحٌ — عايِنْهُ' : '🔒 ' + AR(need)}</small></button>`;
  }).join('');
}
$('#worlds').addEventListener('click', e => {
  const b = e.target.closest('.wd'); if (!b || busy) return;
  const i = +b.dataset.k, { total, G } = stats();
  if (i && total < F.need(G, i)) { banner('🔒 هذا الْعالَمُ مُقْفَل', `يُفْتَحُ عِنْدَ ${AR(F.need(G, i))}`); b.animate && b.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
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
  if (from !== k) { await new Promise(r => setTimeout(r, 500)); await morph(k); }   // نُدرةٌ جديدة منذ آخر زيارة: الخريطة تتحوّل أمامه
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
