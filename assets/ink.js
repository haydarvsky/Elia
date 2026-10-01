/* EliaInk — تمييز الأرقام العربية المكتوبة باليد (٠–٩) — ملف مستقلّ بلا مكتبات
   الطريقة: سحابة نقاط ($P): إعادة تقطيع إلى N نقطة، إزاحة إلى المركز، تكبير موحّد — بلا تدوير (٧ غير ٨)،
   فلا يهمّ ترتيب الخطوط ولا اتجاهها. فوقها قواعد هندسية: النقطة = صفر · الحلقة والذيل (٥ / ٩) · عدد الأسنان (٢ / ٣).
   الإحداثيات: x يميناً و y نزولاً (بكسل الشاشة). الخطوط = [[ [x,y], … ], …]
   EliaInk.recognize(strokes, {box}) → [{d, dist, score}, …] الأقرب أوّلاً     (box = ضلع مربّع الكتابة بالبكسل)
   EliaInk.accepts(strokes, digit, {box, loose}) → هل الخطّ يشبه الرقم المطلوب؟ (متسامح: الأقرب أو قريب منه) */
(function (root) {
'use strict';
var N = 32, STEP = 5, ABS = .13, RATIO = 1.15, SLACK = .008;

/* ---------- قوالب الأرقام (مربّع ١٠٠×١٠٠) ----------
   M/L نقاط · Q منحنى تربيعي (نقطة تحكّم ثم نهاية) · E قطع ناقص كامل (cx cy rx ry) */
var SHAPES = {
  1: ['M50 0 L50 100', 'M60 0 L42 100', 'M42 0 L58 100', 'M44 0 Q54 40 56 100'],
  2: ['M96 4 Q64 48 30 2 L36 100', 'M96 4 Q64 48 30 2 Q20 50 30 100', 'M92 4 L45 12 Q20 18 24 45 L34 100', 'M96 8 Q60 40 34 6 Q40 60 60 100', 'M90 0 Q70 34 40 14 Q24 30 34 100'],
  3: ['M98 4 Q84 46 64 6 Q50 46 28 2 L34 100', 'M98 2 L93 24 Q80 34 68 24 L64 4 L60 24 Q46 34 34 24 L28 0 L34 100', 'M98 6 Q84 44 66 8 Q50 44 30 4 Q22 50 30 100', 'M96 6 Q84 40 68 10 Q54 40 36 8 Q42 60 58 100', 'M96 4 Q82 32 64 6 Q48 32 30 2 L34 100', 'M90 2 Q78 26 62 4 Q48 26 32 2 Q28 50 40 100'],
  4: ['M80 0 L22 24 L62 46 L18 78 L88 98', 'M78 2 Q6 18 56 46 Q2 70 30 92 Q56 104 92 88', 'M70 0 Q20 16 30 30 L56 44 Q10 66 20 84 Q50 100 90 92', 'M84 4 L30 26 L66 50 L26 76 Q40 96 86 96'],
  5: ['E50 50 50 50', 'E50 50 50 37', 'E50 50 38 50', 'M50 2 Q112 62 80 92 Q50 106 20 92 Q-12 62 50 2', 'M12 84 Q-8 22 50 12 Q108 22 88 84 Q50 92 12 84'],
  6: ['M5 6 L92 6 L84 100', 'M4 2 L10 16 L68 14 Q82 56 98 100', 'M5 8 L95 4 L58 100', 'M5 14 Q60 -4 92 8 Q88 60 80 100', 'M8 6 L70 6 L96 100'],
  7: ['M4 0 L50 100 L96 0', 'M20 0 L50 100 L80 0', 'M2 0 Q32 40 48 100 Q68 40 98 0', 'M4 0 L40 100 L96 4'],
  8: ['M4 100 L50 0 L96 100', 'M20 100 L50 0 L80 100', 'M2 100 Q32 60 50 0 Q68 60 98 100', 'M4 100 L60 0 L96 96'],
  9: ['E42 26 30 26 M72 26 L86 100', 'E42 24 30 24 M72 24 L74 100', 'E40 28 32 28 M72 28 Q78 70 60 100', 'E44 34 34 34 M78 34 L84 100', 'E38 20 26 20 M64 20 Q70 60 92 100']
};
function path(d) {
  var S = [], cur = null, t = d.match(/[MLQE]|-?[\d.]+/g), i = 0, c = '', x = 0, y = 0, k, u;
  var nx = function () { return +t[i++]; };
  while (i < t.length) {
    if (/[MLQE]/.test(t[i])) c = t[i++];
    if (c === 'M') { cur = [[x = nx(), y = nx()]]; S.push(cur); c = 'L'; }
    else if (c === 'L') cur.push([x = nx(), y = nx()]);
    else if (c === 'Q') { var qx = nx(), qy = nx(), ex = nx(), ey = nx(); for (k = 1; k <= 8; k++) { u = k / 8; cur.push([(1 - u) * (1 - u) * x + 2 * u * (1 - u) * qx + u * u * ex, (1 - u) * (1 - u) * y + 2 * u * (1 - u) * qy + u * u * ey]); } x = ex; y = ey; }
    else { var cx = nx(), cy = nx(), rx = nx(), ry = nx(); cur = []; S.push(cur); for (k = 0; k <= 24; k++) cur.push([cx + Math.cos(k / 24 * 6.2832) * rx, cy + Math.sin(k / 24 * 6.2832) * ry]); }
  }
  return S;
}

/* ---------- تجهيز النقاط ---------- */
function bbox(S) {
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  S.forEach(function (s) { s.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); });
  return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0, diag: Math.hypot(x1 - x0, y1 - y0) };
}
function plen(s) { var L = 0; for (var i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return L; }
function clean(strokes) {   // يحذف الفارغ، ثم اللمسات الصغيرة العارضة بجانب خطّ كبير (الأرقام بلا نقاط)
  var S = (strokes || []).filter(function (s) { return s && s.length; }); if (S.length < 2) return S;
  var big = bbox(S).diag, keep = S.filter(function (s) { return bbox([s]).diag >= big * .1; });
  return keep.length ? keep : S;
}
function resample(S, n) {   // n نقطة على مسافات متساوية على طول الخطوط كلّها
  var segs = [], total = 0;
  S.forEach(function (s) { for (var i = 1; i < s.length; i++) { var d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); if (d > 0) { segs.push([s[i - 1], s[i], d]); total += d; } } });
  if (!total) return null;
  var out = [], k = 0, acc = 0, I = total / (n - 1);
  for (var j = 0; j < n; j++) {
    var t = Math.min(j * I, total); while (k < segs.length - 1 && acc + segs[k][2] < t) acc += segs[k++][2];
    var g = segs[k], u = Math.max(0, Math.min(1, (t - acc) / g[2])); out.push([g[0][0] + (g[1][0] - g[0][0]) * u, g[0][1] + (g[1][1] - g[0][1]) * u]);
  }
  return out;
}
function cloud(S) {   // تكبير موحّد (يحفظ النِّسَب) ثم إزاحة إلى مركز الثقل
  var P = resample(S, N); if (!P) return null;
  var b = bbox([P]), sc = Math.max(b.w, b.h) || 1, cx = 0, cy = 0;
  P.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= N; cy /= N;
  return P.map(function (p) { return [(p[0] - cx) / sc, (p[1] - cy) / sc]; });
}
function cdist(A, B, start) {
  var used = new Uint8Array(N), sum = 0, i = start, j, k, d, m;
  do {
    m = 1e9; k = -1;
    for (j = 0; j < N; j++) if (!used[j]) { d = (A[i][0] - B[j][0]) * (A[i][0] - B[j][0]) + (A[i][1] - B[j][1]) * (A[i][1] - B[j][1]); if (d < m) { m = d; k = j; } }
    used[k] = 1; sum += (1 - ((i - start + N) % N) / N) * Math.sqrt(m); i = (i + 1) % N;
  } while (i !== start);
  return sum;
}
function greedy(A, B) { var m = 1e9; for (var i = 0; i < N; i += STEP) m = Math.min(m, cdist(A, B, i), cdist(B, A, i)); return m / ((N + 1) / 2); }   // متوسّط بُعد النقطة (بوحدة حجم الرقم)

var TPL = null;
function templates() {
  if (!TPL) { TPL = {}; Object.keys(SHAPES).forEach(function (d) { TPL[d] = SHAPES[d].map(function (s) { return cloud(path(s)); }); }); }
  return TPL;
}

/* ---------- القواعد الهندسية: شبكة صغيرة نرسم عليها الحبر ---------- */
var GR = 40, GP = 2, GS = GR + GP * 2;
function features(S) {
  var b = bbox(S), sc = (GR - 1) / (Math.max(b.w, b.h) || 1), ox = GP + (GR - 1 - b.w * sc) / 2, oy = GP + (GR - 1 - b.h * sc) / 2;
  var g = new Uint8Array(GS * GS), x, y, i;
  var put = function (px, py) { g[Math.round(oy + (py - b.y0) * sc) * GS + Math.round(ox + (px - b.x0) * sc)] = 1; };
  S.forEach(function (s) {
    put(s[0][0], s[0][1]);
    for (var k = 1; k < s.length; k++) { var n = Math.ceil(Math.hypot(s[k][0] - s[k - 1][0], s[k][1] - s[k - 1][1]) * sc * 2) || 1; for (var q = 1; q <= n; q++) put(s[k - 1][0] + (s[k][0] - s[k - 1][0]) * q / n, s[k - 1][1] + (s[k][1] - s[k - 1][1]) * q / n); }
  });
  // الحدّ العلوي للحبر في كلّ عمود ← عدد «الوديان» (٢ فيها كأس واحد، ٣ فيها كأسان)
  var top = [], y0 = GS, y1 = 0;
  for (x = 0; x < GS; x++) for (y = 0; y < GS; y++) if (g[y * GS + x]) { top.push(y); if (y < y0) y0 = y; break; }
  for (i = 0; i < g.length; i++) if (g[i]) y1 = Math.max(y1, i / GS | 0);
  var rows = y1 - y0 + 1, head = top.filter(function (v) { return v - y0 < rows * .5; }), i0 = 0, j;
  for (i = 0; i < head.length; i = j) { for (j = i + 1; j <= i + 3 && !(head[j] < head[i]); j++); if (j > i + 3 || j >= head.length) break; i0 = j; }   // نتخطّى جسم الساق المائل حتى رأسه
  head = head.slice(i0); var deep = head.length ? Math.max.apply(null, head) - Math.min.apply(null, head) : 0;
  var prom = Math.max(1.5, deep * .3), val = 0, st = 0, mn = head[0], mx = 0;
  for (i = 1; i < head.length; i++) {
    if (!st) { if (head[i] < mn) mn = head[i]; else if (head[i] > mn + prom) { st = 1; mx = head[i]; } }
    else { if (head[i] > mx) mx = head[i]; else if (head[i] < mx - prom) { val++; st = 0; mn = head[i]; } }
  }
  // الحلقة المغلقة: نسمّك الحبر ثم نملأ الخارج؛ ما بقي فارغاً فهو داخل حلقة
  var t = new Uint8Array(GS * GS), dx, dy;
  for (y = 1; y < GS - 1; y++) for (x = 1; x < GS - 1; x++) if (g[y * GS + x]) for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) t[(y + dy) * GS + x + dx] = 1;
  var st2 = [0], hole = 0, hb = 0, ht = GS, c; t[0] = 2;
  while (st2.length) {
    c = st2.pop(); x = c % GS; y = c / GS | 0;
    if (x > 0 && !t[c - 1]) { t[c - 1] = 2; st2.push(c - 1); } if (x < GS - 1 && !t[c + 1]) { t[c + 1] = 2; st2.push(c + 1); }
    if (y > 0 && !t[c - GS]) { t[c - GS] = 2; st2.push(c - GS); } if (y < GS - 1 && !t[c + GS]) { t[c + GS] = 2; st2.push(c + GS); }
  }
  for (i = 0; i < t.length; i++) if (!t[i]) { hole++; y = i / GS | 0; if (y > hb) hb = y; if (y < ht) ht = y; }
  return { valleys: val, hole: hole, tail: hole ? (y1 - hb) / rows : 0, holeTop: hole ? (ht - y0) / rows : 0, aspect: Math.min(b.w, b.h) / (Math.max(b.w, b.h) || 1), b: b };
}

/* ---------- التمييز ---------- */
function recognize(strokes, opt) {
  var S = clean(strokes); if (!S.length) return [];
  var box = opt && opt.box, b = bbox(S), len = 0, i; S.forEach(function (s) { len += plen(s); });
  var rel = box ? b.diag / box : b.diag / 100;   // حجم الحبر نسبةً إلى مربّع الكتابة
  var compact = !len || Math.min(b.w, b.h) / Math.max(b.w, b.h) > .42 || len / b.diag > 3;
  if (rel < .13 || (compact && rel < .24)) return [{ d: 0, dist: 0, score: 1 }];   // نقطة صغيرة = صفر
  var F = features(S), res = [], T = templates(), P = cloud(S);
  if (rel < .42 && compact) res.push({ d: 0, dist: ABS * (rel - .24) / .18, zero: true });   // نقطة سمينة أو دائرة صغيرة: صفر محتمل   // نقطة سمينة أو دائرة صغيرة
  for (var d = 1; d <= 9; d++) { var m = 1e9; for (i = 0; i < T[d].length; i++) m = Math.min(m, greedy(P, T[d][i])); res.push({ d: d, dist: m }); }
  var mul = function (ds, k) { res.forEach(function (r) { if (!r.zero && ds.indexOf(r.d) >= 0) r.dist *= k; }); };
  if (F.hole >= 16) {
    mul([1, 2, 3, 4, 6, 7, 8], 1.3);                                                     // هذه الأرقام بلا حلقات
    if (F.tail < .24) { mul([5], .8); mul([9], 1.35); }                                  // حلقة بلا ذيل = ٥
    else if (F.tail > .32 && F.holeTop < .3) { mul([9], .8); mul([5], 1.4); }            // حلقة في الأعلى وتحتها ذيل = ٩
  } else { mul([5], 1.12); mul([9], 1.12); }
  if (len / b.diag > 5) mul([1, 2, 3, 4, 5, 6, 7, 8, 9], 1.5);                           // حبر كثير جدّاً = خربشة
  if (F.valleys >= 2) mul([2], 1.5); else mul([3], 1.5);                                 // عدد الأسنان يفصل ٢ عن ٣
  res.sort(function (a, c) { return a.dist - c.dist; });
  res.forEach(function (r) { r.score = Math.max(0, 1 - r.dist / (ABS * 1.5)); });
  return res;
}
function accepts(strokes, digit, opt) {
  var r = opt && opt.res || recognize(strokes, opt), me = null, k = opt && opt.loose ? 1.25 : 1; digit = +digit;   // res = نتيجة recognize جاهزة
  r.forEach(function (c) { if (c.d === digit) me = c; });
  if (!me) return false;
  if (!digit) return true;                                      // الصفر: يكفي أن يكون الحبر صغيراً مكتنزاً
  if (me.dist > ABS * k) return false;                          // لا يشبه الرقم إطلاقاً (خربشة)
  var best = r[0].zero && r.length > 1 ? r[1] : r[0];
  return best.d === digit || me.dist <= best.dist * RATIO * k + SLACK;
}

root.EliaInk = { recognize: recognize, accepts: accepts, features: function (s) { return features(clean(s)); }, N: N };
})(typeof window !== 'undefined' ? window : globalThis);
