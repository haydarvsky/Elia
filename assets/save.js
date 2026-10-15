/* حفظ التقدّم في السحابة — Firestore عبر REST الخام (بلا SDK)
   التخزين المحلي وحده لا يكفي على الآيباد: سفاري يمسحه بعد أيام بلا استخدام، والتطبيق المثبّت على
   الشاشة الرئيسية له تخزين منفصل عن سفاري. هنا يُدمَج المحلي بالسحابي عند الفتح (الأكبر من كل قيمة،
   فالتقدّم لا ينقص)، ويُرفع بعد كل حفظ. بلا إنترنت تعمل الألعاب محلياً كما كانت، وتُزامَن عند عودته. */
(() => {
'use strict';
const me = document.currentScript, ds = (me && me.dataset) || {};
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const CFG = { pid: 'vak-quiz-96d5f', key: 'AIzaSyADogtO8s6kDuTrs1Tup6J4acY47T5DmdM', col: 'elia_saves', doc: LOCAL ? 'test' : (ds.player || 'elia') };
const KEYS = (ds.keys || 'elia-letters-v1,elia-venom-v2,elia-spider-v1,elia-shop-v1,elia-tests-v1,elia-heroes-v1').split(',');
const DOC = `https://firestore.googleapis.com/v1/projects/${CFG.pid}/databases/(default)/documents/${CFG.col}/${CFG.doc}?key=${CFG.key}`;
const META = 'elia-cloud-v1';   // وقت آخر مزامنة ناجحة

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const stable = v => JSON.stringify(v, (k, x) => isObj(x) ? Object.keys(x).sort().reduce((o, q) => (o[q] = x[q], o), {}) : x);
const lget = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const bundle = () => { const o = {}; KEYS.forEach(k => { const v = lget(k); if (v) o[k] = v; }); return o; };

/* ---------- الدمج ---------- */
function union(a, b) {
  if (a == null) return b; if (b == null) return a;
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (Array.isArray(a) && Array.isArray(b)) return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => union(a[i], b[i]));
  if (isObj(a) && isObj(b)) { const o = {}; new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => { o[k] = union(a[k], b[k]); }); return o; }
  return a;
}
const dayOf = s => { const p = String(s || '').split('-').map(Number); return p.length === 3 ? Math.round(new Date(p[0], p[1] - 1, p[2]).getTime() / 864e5) : 0; };
const isHeroes = x => isObj(x) && 'log' in x && 'start' in x;
// تحدّي الأبطال: لا يُعتدّ بالتصفير إلا إن ختمه وليّ الأمر (rby) — جهازٌ جديدٌ أنشأ حالةً فارغة لا يمسح شيئاً
const rstOf = x => isHeroes(x) ? (x.rby ? x.rst || 0 : 0) : (x.rst || 0);
const nLog = x => Object.keys(x.log || {}).length;
function merge(a, b) {            // a محلي، b سحابي
  if (!a) return b; if (!b) return a;
  const ra = rstOf(a), rb = rstOf(b);
  if (ra !== rb) return ra > rb ? a : b;          // بعد «من جديد» يغلب الأحدث تصفيراً كاملاً ولا يعود القديم
  const m = union(a, b);
  if (isHeroes(a) || isHeroes(b)) {               // الإعدادات من آخر من عدّلها؛ وإن لم يعدّلها أحد فمن صاحب السجل الأكبر وأقدم بداية
    const sa = a.sat || 0, sb = b.sat || 0, src = sa !== sb ? (sa > sb ? a : b) : (nLog(a) >= nLog(b) ? a : b);
    ['goal', 'gate'].forEach(k => { if (src[k] != null) m[k] = src[k]; });
    m.start = sa !== sb ? src.start : [a.start, b.start].filter(Boolean).sort()[0];
    m.sat = Math.max(sa, sb);
    // بلا تصفيرٍ معتمد يبقى أكبرُ ختمٍ خام (درع السحابة ٩e12) حتى تأخذ النسخُ القديمة المفتوحة السحابةَ ولا تطمسها
    if (ra || rb) { m.rst = Math.max(ra, rb); m.rby = 1; } else { m.rst = Math.max(a.rst || 0, b.rst || 0); delete m.rby; }
  }
  if ('last' in a || 'last' in b) {               // سلسلة الأيام: من صاحب اليوم الأحدث، وتتّصل إن كانا متتاليين
    const da = dayOf(a.last), db = dayOf(b.last), hi = db > da ? b : a, lo = db > da ? a : b, gap = Math.abs(da - db);
    m.last = hi.last;
    m.streak = gap === 0 ? Math.max(a.streak || 0, b.streak || 0) : (gap === 1 && (hi.streak || 0) <= (lo.streak || 0)) ? (lo.streak || 0) + 1 : (hi.streak || 1);
  }
  if ('world' in a) m.world = a.world;
  return m;
}

/* ---------- السحابة ---------- */
async function pull() {
  const r = await fetch(DOC, { cache: 'no-store' });
  if (r.status === 404) return {};
  if (!r.ok) throw new Error('http ' + r.status);
  const d = await r.json();
  try { return JSON.parse(d.fields.j.stringValue) || {}; } catch (e) { return {}; }
}
/* نسخةٌ احتياطية داخل الوثيقة نفسها (القواعد لا تسمح بغيرها): _bk = { 'YYYY-MM-DD': حالة تحدّي الأبطال قبل أول كتابةٍ في ذلك اليوم } — آخر ١٤ يوماً */
const BK = 'elia-heroes-v1', BKN = 14;
function backup(out, remote) {
  const h = remote[BK]; if (!h || !Object.keys(h.log || {}).length) return;
  const d = new Date(), tag = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const bk = Object.assign({}, remote._bk || {}); if (bk[tag]) return;
  bk[tag] = h; Object.keys(bk).sort().slice(0, -BKN).forEach(k => delete bk[k]); out._bk = bk;
}
async function put(obj, keepalive) {
  const r = await fetch(DOC, { method: 'PATCH', keepalive: !!keepalive, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { j: { stringValue: JSON.stringify(obj) }, ts: { integerValue: String(Date.now()) } } }) });
  if (!r.ok) throw new Error('http ' + r.status);
}

/* ---------- المزامنة ---------- */
let lastRemote = {}, state = 'idle', busy = null, again = false, timer = 0, synced = false, lastSync = 0;
const subs = [], stSubs = [];
const setState = s => { state = s; stSubs.forEach(f => { try { f(s); } catch (e) {} }); };
function sync() {
  clearTimeout(timer); timer = 0;
  if (busy) { again = true; return busy; }
  setState('sync');
  busy = (async () => {
    try {
      const remote = await pull(), local = bundle(), out = Object.assign({}, remote), changed = []; let dirty = false;
      KEYS.forEach(k => {
        const m = merge(local[k], remote[k]); if (!m) return; out[k] = m; const ms = stable(m);
        if (ms !== stable(local[k] || null)) { lset(k, m); changed.push(k); }
        if (ms !== stable(remote[k] || null)) dirty = true;
      });
      // الصفحة تأخذ المدمَج فوراً — حتى لو تعثّرت الكتابة إلى السحابة لا تبقى على حالةٍ قديمة تعيد حفظها
      changed.forEach(k => subs.forEach(s => { if (s.k === k) try { s.fn(lget(k)); } catch (e) {} }));
      lastRemote = out;
      if (dirty) { backup(out, remote); await put(out); }
      synced = true; lastSync = Date.now(); lset(META, { ts: lastSync });
      setState('ok');
    } catch (e) { setState(navigator.onLine === false ? 'off' : 'err'); }
    busy = null;
    if (again) { again = false; push(); }
  })();
  return busy;
}
function push() { if (!timer) timer = setTimeout(sync, 2500); }
function flush() {               // عند إغلاق الصفحة: ارفع فوراً ما لم يُرفع (بعد مزامنة ناجحة فقط حتى لا يُطمَس السحابي)
  if (!timer || !synced) return; clearTimeout(timer); timer = 0;
  try { put(Object.assign({}, lastRemote, bundle()), true).catch(() => {}); } catch (e) {}   // مع ما في السحابة من غير المفاتيح (_bk)
}
addEventListener('pagehide', flush);
const BORN = Date.now();   // صفحةٌ بقيت مفتوحة ساعاتٍ في الخلفية تعيد تحميل نفسها لتأخذ أحدث كود قبل أي مزامنة
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return flush();
  if (Date.now() - BORN > 3 * 3600e3 && !timer) return location.reload();
  if (Date.now() - lastSync > 30000) sync();
});
addEventListener('online', sync);
try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {}

window.EliaSave = {
  push, sync,
  on(k, fn) { subs.push({ k, fn }); },                      // يُنادى حين يجلب الدمج تقدّماً أحدث من السحابة
  onState(fn) { stSubs.push(fn); fn(state); },              // idle | sync | ok | err | off
  get state() { return state; },
  get last() { return lastSync || (lget(META) || {}).ts || 0; },
};
sync();
})();
