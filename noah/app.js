/* تحدّي النجوم — شهرٌ من المهمات اليومية لنوح بثيمة نجوم كرة القدم (نسخةٌ من تحدّي الأبطال abtal/)
   الحفظ في وثيقة elia_saves/mohammed بمفتاحٍ مستقل noah-heroes-v1 (القواعد لا تسمح إلا بـelia|mohammed|test)
   البيانات في مفتاح واحد يُزامَن سحابياً عبر EliaSave:
   { start:'YYYY-MM-DD', goal:'12000', gate:'1'|'0', sat, log:{id:{c,p,d,t,s,n,m,r}}, del:{id:1}, rst, rby }
   rst+rby يُختمان بأمر وليّ الأمر «تصفير» فقط، وsat وقت آخر تعديلٍ للإعدادات — فجهازٌ جديدٌ يُفتح لأول مرة لا يمسح السحابة ولا يغيّر إعداداتها.
   السجل كائنٌ بمعرّفات (لا مصفوفة) والحذف شاهدةٌ في del — لأن دمج save.js يأخذ اتحاد المفاتيح فلا يضيع إدخال جهازٍ آخر ولا يعود محذوف. */
(() => {
'use strict';
const KEY = 'noah-heroes-v1', RUN = 'noah-heroes-run', DAYS = 30, DEF_GOAL = 12000, DAILY_BONUS = 50, CYCLE = 20;
const $ = s => document.querySelector(s);
const AR = n => Math.round(n).toLocaleString('ar-EG');
const PL = n => `\u2066${n < 0 ? '−' : '+'}${AR(Math.abs(n))}\u2069`;
const PARENT = [50, 100];   // بونص بابا وماما أو خصمهم: هاتان القيمتان فقط
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dnum = s => { const [y, m, d] = s.split('-').map(Number); return Math.round(new Date(y, m - 1, d).getTime() / 864e5); };
const today = () => ymd(new Date());
const mmss = s => `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}`.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const mins = s => s < 60 ? `${AR(s)} ثانية` : `${AR(Math.floor(s / 60))} د ${s % 60 ? AR(s % 60) + ' ث' : ''}`.trim();
const lget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- المهمات ---------- */
const swimPts = s => s >= 480 && s <= 720 ? 100 : 50;   // بين ٨ و١٢ دقيقة = كاملة، وغير ذلك نصفها
const tidyPts = s => s <= 300 ? 100 : s <= 1200 ? Math.round(100 - (s - 300) / 900 * 70) : 15;
const mornBonus = s => s <= 600 ? 40 : s <= 900 ? 25 : s <= 1200 ? 10 : 0;
const ydayOf = d => { const [y, m, dd] = d.split('-').map(Number); return ymd(new Date(y, m - 1, dd - 1)); };

const M = {
  swim:  { hero: 'رونالدو', ic: '🏊', name: 'مَسْبَحُ رونالدو', task: 'تَحَدّي السِّباحَةِ', c: '#b0122a', c1: '#c6efcf', kind: 'timer', full: 720, zone: [480, 720], noRec: true, fn: swimPts,
           rule: 'اُخْرُجْ مِنَ السِّباحَةِ في نَحْوِ ١٠ دَقائِقَ: بَيْنَ ٨ وَ١٢ دَقيقَةً = ١٠٠ نُقْطَة، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠ نُقْطَة.' },
  tidy:  { hero: 'مبابي', ic: '⚡', name: 'سُرْعَةُ مبابي', task: 'تَحَدّي تَرْتيبِ الْأَلْعابِ وَالْغُرْفَةِ', c: '#1d3f9e', c1: '#cfdcff', kind: 'timer', full: 1200, fn: tidyPts,
           rule: 'رَتِّبْ أَلْعابَكَ وَغُرْفَتَكَ بِسُرْعَةِ مبابي في الْهُجومِ الْمُعاكِسِ: ٥ دَقائِقَ أَوْ أَقَلَّ = ١٠٠ نُقْطَة.' },
  study: { hero: 'لامين يامال', ic: '📚', name: 'واجِباتُ يامال', task: 'تَحَدّي الدِّراسَةِ وَالْواجِباتِ', c: '#d1121f', c1: '#ffe08a', kind: 'study',
           rule: 'كُلُّ إِنْجازٍ دِراسِيٍّ تَكْتُبُهُ = ٢٥ نُقْطَة، وَالدَّرَجَةُ الْكامِلَةُ = ٥٠. بِلا تَوْقيتٍ.' },
  morning: { hero: 'نيمار', ic: '☀️', name: 'صَباحُ نيمار', task: 'تَحَدّي الِاسْتِيقاظِ', c: '#009739', c1: '#fff07a', kind: 'morning',
           rule: 'اِسْتَيْقِظْ ← فَرِّشْ أَسْنانَكَ ← اِلْبَسْ مَلابِسَ الْمَدْرَسَةِ. كُلُّ خُطْوَةٍ ٢٠، وَإِنْ جَهَزْتَ خِلالَ ١٠ دَقائِقَ فَلَكَ ٤٠ إِضافِيَّة.' },
  sleep: { hero: 'ميسي', ic: '🌙', name: 'لَيْلَةُ ميسي', task: 'تَحَدّي الِاسْتِعْدادِ لِلنَّوْمِ', c: '#3f78c4', c1: '#dff0ff', kind: 'sleep',
           rule: 'فَرِّشْ أَسْنانَكَ ← اُدْخُلِ الْحَمّامَ ← إِلى الْفِراشِ. كُلُّ خُطْوَةٍ ٢٠، وَإِنْ كُنْتَ في فِراشِكَ خِلالَ ١٠ دَقائِقَ فَلَكَ ٤٠ إِضافِيَّة. وَإِنْ نَجَحْتَ صَباحاً في تَحَدّي الِاسْتِيقاظِ فَلَكَ ٢٠ مُكافَأَةُ النَّوْمِ وَالِاسْتِيقاظ.' },
  eat:   { hero: 'هالاند', ic: '💪', name: 'قُوَّةُ هالاند', task: 'تَحَدّي الْأَكْلِ', c: '#3b93d0', c1: '#d6ecff', kind: 'eat',
           rule: 'كُلُّ وَجْبَةٍ تُكْمِلُها = ٣٠ نُقْطَة، وَالْخُضارُ وَالْفاكِهَةُ تَزيدُكَ ١٠. هالاند يَأْكُلُ جَيِّداً لِيَصيرَ أَقْوى هَدّافٍ!' },
};
const ORDER = ['swim', 'tidy', 'study', 'morning', 'eat', 'sleep'];
const STEPS = {
  morning: [['⏰', 'اسْتَيْقَظْتُ!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['👕', 'لَبِسْتُ مَلابِسَ الْمَدْرَسَةِ']],
  sleep: [['🌙', 'حانَ وَقْتُ النَّوْمِ!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['🚽', 'دَخَلْتُ الْحَمّامَ'], ['🛏️', 'في فِراشي وَالنّورُ مُطْفَأ']],
};
const TOK = { morning: 'تَحَدّيَ الصَّباحِ', sleep: 'تَحَدّيَ النَّوْمِ' };
const STUDY = [['📝', 'حَلَلْتُ واجِبي'], ['📖', 'قَرَأْتُ دَرْساً'], ['🧠', 'حَفِظْتُ'], ['✍️', 'كَتَبْتُ بِخَطٍّ جَميلٍ'], ['🔁', 'راجَعْتُ لِلِاخْتِبارِ'], ['🏅', 'دَرَجَةٌ كامِلَةٌ', 50]];
const MEALS = [['🍳', 'الْفُطور'], ['🍛', 'الْغَداء'], ['🍲', 'الْعَشاء'], ['🍎', 'وَجْبَةٌ خَفيفَةٌ']];
const STONES = [   // جوائز الموسم: ثلاث ميداليات ثم نجمة الهدّاف والكرة الذهبية والكأس (تفتح الهدية)
  { n: 'الْميدالِيَّةُ الْبْرونْزِيَّةُ', c: '#d08a4a', f: .125, k: 'medal' }, { n: 'الْميدالِيَّةُ الْفِضِّيَّةُ', c: '#cfd6e4', f: .25, k: 'medal' }, { n: 'الْميدالِيَّةُ الذَّهَبِيَّةُ', c: '#ffd31a', f: .42, k: 'medal' },
  { n: 'نَجْمَةُ الْهَدّافِ', c: '#ff9e1b', f: .6, k: 'star' }, { n: 'الْكُرَةُ الذَّهَبِيَّةُ', c: '#ffe36e', f: .8, k: 'ball' }, { n: 'كَأْسُ الْبُطولَةِ', c: '#22d36b', f: 1, k: 'cup' },
];
const SHAPE = {
  medal: c => `<path d="M17 2h11l8 26H25ZM43 2H32l-8 26h11Z" fill="#e8202a" stroke="#05060f" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="46" r="20" fill="${c}" stroke="#05060f" stroke-width="4"/><circle cx="30" cy="46" r="12.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/><path d="M30 38l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" fill="#fff" fill-opacity=".75"/>`,
  star: c => `<path d="M30 6l7.6 15.4 17 2.5-12.3 12 2.9 16.9L30 44.8 14.8 52.8l2.9-16.9-12.3-12 17-2.5Z" fill="${c}" stroke="#05060f" stroke-width="4" stroke-linejoin="round"/><path d="M30 16l3.5 8" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>`,
  ball: c => `<circle cx="30" cy="36" r="27" fill="${c}" stroke="#05060f" stroke-width="4"/><path d="M30 24l10 7.3-3.8 11.7H23.8L20 31.3Z" fill="#05060f"/><path d="M30 24V10M40 31.3l13-4.3M36.2 43l8 11M23.8 43l-8 11M20 31.3l-13-4.3" stroke="#05060f" stroke-width="3"/><circle cx="21" cy="20" r="4" fill="#fff" fill-opacity=".6"/>`,
  cup: c => `<path d="M16 6h28v16c0 11-6 18-14 18S16 33 16 22Z" fill="${c}" stroke="#05060f" stroke-width="4" stroke-linejoin="round"/><path d="M16 11H7c0 10 5 15 11 15M44 11h9c0 10-5 15-11 15" fill="none" stroke="#05060f" stroke-width="4"/><path d="M26 40h8v10h-8Z" fill="${c}" stroke="#05060f" stroke-width="4"/><path d="M17 50h26v12H17Z" fill="${c}" stroke="#05060f" stroke-width="4" stroke-linejoin="round"/><path d="M22 12v10" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`,
};
const gemSVG = c => `<svg viewBox="0 0 60 70">${SHAPE[(STONES.find(s => s.c === c) || STONES[5]).k](c)}</svg>`;

/* ---------- الحالة ---------- */
let S = lget(KEY, null);
function fresh() { return { start: today(), goal: String(DEF_GOAL), gate: '1', log: {}, del: {}, rst: 0, sat: 0 }; }   // حالة جهازٍ جديد: لا تصفير ولا إعدادات
if (!S || !S.start) { S = Object.assign(fresh(), S || {}, { start: (S && S.start) || today() }); save(); }
function save() { lset(KEY, S); window.EliaSave && EliaSave.push(); }
const goal = () => Math.max(1000, +S.goal || DEF_GOAL);
const entries = () => Object.entries(S.log || {}).filter(([id]) => !(S.del || {})[id]).map(([id, e]) => Object.assign({ id }, e)).sort((a, b) => b.t - a.t);
function byDay() {
  const g = {};
  entries().forEach(e => { (g[e.d] = g[e.d] || []).push(e); });
  return g;
}
function dayTotal(list) {
  const pts = list.reduce((a, e) => a + e.p, 0), done = new Set(list.map(e => e.c));
  const full = ORDER.every(c => done.has(c));
  return { pts: pts + (full ? DAILY_BONUS : 0), full, done };
}
function totals() {
  const g = byDay(); let total = 0;
  Object.values(g).forEach(l => { total += dayTotal(l).pts; });
  return { total, g };
}
function best(c) {   // أفضل زمن مسجَّل بالمؤقّت
  const xs = entries().filter(e => e.c === c && e.s && !e.m).map(e => e.s);
  return xs.length ? Math.min(...xs) : 0;
}
function streak(g) { // أيام متتالية فيها نقاط حتى اليوم (أو أمس إن لم يبدأ اليوم بعد)
  let d = dnum(today()); if (!g[today()]) d--;
  let n = 0; const has = new Set(Object.keys(g).map(dnum));
  while (has.has(d)) { n++; d--; }
  return n;
}

/* ---------- الصوت ---------- */
let AC = null;
const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function tone(seq) {
  try {
    const a = ac(), t0 = a.currentTime + .02;
    seq.forEach(([f, st, du, ty = 'square', v = .07]) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = ty; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + st); g.gain.linearRampToValueAtTime(v, t0 + st + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + st + du);
      o.connect(g).connect(a.destination); o.start(t0 + st); o.stop(t0 + st + du + .05);
    });
  } catch (e) {}
}
const sfx = {
  tap: () => tone([[660, 0, .08, 'triangle', .06]]),
  start: () => tone([[2900, 0, .14, 'sine', .06], [2900, .2, .5, 'sine', .06]]),   // صافرة الحكم
  win: () => tone([[523, 0, .15], [659, .12, .15], [784, .24, .15], [1047, .36, .5, 'sawtooth', .06], [784, .36, .5, 'triangle', .05]]),
  stone: () => tone([[392, 0, .3, 'sawtooth', .05], [494, .2, .3, 'sawtooth', .05], [587, .4, .3, 'sawtooth', .05], [784, .6, .9, 'sawtooth', .06], [1175, .6, .9, 'triangle', .05]]),
  bad: () => tone([[200, 0, .2, 'sawtooth', .06], [150, .15, .3, 'sawtooth', .06]]),
  tick: () => tone([[1400, 0, .04, 'square', .03]]),
};
/* هتاف الجمهور: ضجيجٌ مُرشَّح يعلو ثم يخفت (بلا ملفات صوتية) */
function voice(big) {
  try {
    const a = ac(), dur = big ? 3.2 : 2.2, n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = 850; f.Q.value = .55;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(big ? .26 : .18, t + .35); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(t);
  } catch (e) {}
}

/* ---------- الرسم ---------- */
let shown = 0;
function countTo(el, to) {
  const from = shown, t0 = performance.now(), dur = 1200;
  const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = AR(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step); shown = to;
  clearTimeout(countTo.t); countTo.t = setTimeout(() => { el.textContent = AR(to); }, dur + 150);   // إن توقّف rAF في الخلفية
}
function render() {
  const { total, g } = totals(), G = goal(), td = dayTotal(g[today()] || []);
  const dn = dnum(today()) - dnum(S.start) + 1, left = Math.max(0, DAYS - dn + 1);
  $('#c-day').textContent = dn < 1 ? `يَبْدَأُ التَّحَدّي بَعْدَ ${AR(1 - dn)} يَوْم` : dn > DAYS ? '🏁 انْتَهى شَهْرُ التَّحَدّي' : `📅 الْيَوْمُ ${AR(dn)} مِنْ ${AR(DAYS)}`;
  $('#c-left').textContent = dn >= 1 && dn <= DAYS ? `⏳ باقي ${AR(left)} ${left === 1 ? 'يَوْم' : 'يَوْماً'}` : '';
  const st = streak(g); $('#c-streak').textContent = st >= 2 ? `🔥 ${AR(st)} أَيّامٍ مُتَتالِيَة` : '';
  countTo($('#total'), Math.max(0, total));
  $('#goal-line').textContent = total >= G ? '🏆 وَصَلْتَ إِلى الْهَدِيَّةِ الْكُبْرى!' : `مِنْ ${AR(G)} — باقي ${AR(G - total)} نُقْطَة`;
  $('#today').textContent = (td.pts < 0 ? '−' : '') + AR(Math.abs(td.pts));
  $('#today-bonus').textContent = td.full ? `⭐ مُكافَأَةُ الْفَريقِ ${PL(DAILY_BONUS)}` : `أَنْجِزِ الْمُهِمّاتِ السِّتَّ الْيَوْمَ = ${PL(DAILY_BONUS)}`;
  const pct = Math.max(0, Math.min(1, total / G));
  $('#beam-fill').style.width = (pct * 100).toFixed(2) + '%';
  $('#marks').innerHTML = STONES.slice(0, -1).map(s => `<i style="right:${s.f * 100}%"></i>`).join('');
  let nextSet = false;
  $('#stones').innerHTML = STONES.map(s => {
    const need = Math.round(G * s.f / 50) * 50, on = total >= need, nx = !on && !nextSet; if (nx) nextSet = true;
    return `<div class="stone ${on ? 'on' : ''} ${nx ? 'next' : ''}" style="--c:${s.c}">${gemSVG(s.c)}<b>${s.n}</b><span>${on ? '✓ مَعَكَ' : AR(need)}</span></div>`;
  }).join('');
  // المهمات
  $('#missions').innerHTML = ORDER.map((c, i) => {
    const m = M[c], list = (g[today()] || []).filter(e => e.c === c), pts = list.reduce((a, e) => a + e.p, 0), b = best(c);
    return `<button class="m" data-c="${c}" style="--i:${i};--ac:${m.c1};--ac2:${m.c}">
      <div class="m-art"><img src="img/${c}.webp" alt="" loading="lazy"><span class="m-hero">${m.ic} ${m.hero}</span><span class="m-done">${list.length ? `✓ الْيَوْمَ ${PL(pts)}` : ''}</span></div>
      <div class="m-body"><h3>${m.name}</h3><p>${m.task}</p><span class="rec">${b && !m.noRec ? `🏅 رَقْمُكَ الْقِياسِيُّ: ${mins(b)}` : ''}</span><span class="go">${m.ic} ابْدَأِ الْمُهِمَّةَ</span></div></button>`;
  }).join('');
  // الهدية
  const pz = $('#prize'); pz.classList.toggle('locked', total < G);
  $('#prize-lock').innerHTML = total < G ? `<b>🔒</b><span>تُفْتَحُ عِنْدَ ${AR(G)} نُقْطَة</span>` : '';
  $('#prize-msg').textContent = total >= G ? 'جَمَعْتَ الْجَوائِزَ السِّتَّ يا كابْتِن! بلايستيشن ٥ صارَ لَكَ 🎮🎁' : `اجْمَعِ الْجَوائِزَ السِّتَّ وَصِلْ إِلى ${AR(G)} نُقْطَة قَبْلَ نِهايَةِ الشَّهْرِ لِتَفوزَ بِجِهازِ بلايستيشن ٥ الْحَقيقِيِّ!`;
  $('#prize-bar').style.width = (pct * 100).toFixed(2) + '%';
  const daysLeft = Math.max(1, DAYS - Math.max(1, dn) + (g[today()] ? 0 : 1));
  $('#pace').textContent = total >= G ? '' : dn > DAYS ? 'انْتَهى الشَّهْرُ — يُمْكِنُ لِبابا أَنْ يَبْدَأَ شَهْراً جَديداً مِنَ الْإِعْداداتِ.' : `🎯 تَحْتاجُ نَحْوَ ${AR(Math.ceil((G - total) / daysLeft))} نُقْطَة كُلَّ يَوْمٍ لِتَصِلَ.`;
  renderLog(g);
}
function renderLog(g) {
  const days = Object.keys(g).sort().reverse();
  if (!days.length) { $('#log').innerHTML = '<p class="empty">لَمْ تَبْدَأْ بَعْدُ… اخْتَرْ أَوَّلَ مُهِمَّةٍ وَسَجِّلْ أَوَّلَ أَهْدافِكَ! ⚽</p>'; return; }
  $('#log').innerHTML = days.slice(0, 14).map(d => {
    const l = g[d], t = dayTotal(l), dt = new Date(...d.split('-').map((x, i) => i === 1 ? x - 1 : +x));
    const label = d === today() ? 'الْيَوْمَ' : dt.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="day"><h4>${label}<span>${PL(t.pts)}${t.full ? ' ⭐' : ''}</span></h4>${l.map(e => {
      const m = e.c === 'parent' ? { c: e.p < 0 ? '#e8202a' : '#ffc83d', ic: e.p < 0 ? '⚠️' : '🎁', hero: 'بابا وَماما' } : M[e.c];
      return `<div class="ent ${e.p < 0 ? 'neg' : ''}" style="--c:${m.c}"><span class="ic">${m.ic}</span><span class="tx">${desc(e)}<small>${m.hero} · ${new Date(e.t).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</small></span><span class="p">${PL(e.p)}</span><button class="del" data-id="${e.id}" aria-label="حذف">✕</button></div>`;
    }).join('')}${t.full ? `<div class="ent" style="--c:#ffc83d"><span class="ic">⭐</span><span class="tx">مُكافَأَةُ الْفَريقِ: الْمُهِمّاتُ السِّتُّ في يَوْمٍ واحِدٍ</span><span class="p">${PL(DAILY_BONUS)}</span><span style="width:36px"></span></div>` : ''}</div>`;
  }).join('');
}
function desc(e) {
  if (e.c === 'swim') return `سِباحَةٌ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'tidy') return `تَرْتيبُ الْغُرْفَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'morning') return `جاهِزٌ لِلْمَدْرَسَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.x ? ' 🌙☀️ نَوْمٌ وَاسْتِيقاظ' : ''}`;
  if (e.c === 'sleep') return `جاهِزٌ لِلنَّوْمِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}`;
  if (e.c === 'parent') return `${e.p < 0 ? 'خَصْمُ عُقوبَةٍ' : 'بونَصٌ خاصٌّ'}${e.n ? ' — ' + e.n : ''}`;
  return e.n || M[e.c].task;
}

/* ---------- سؤال بابا ---------- */
let gateUntil = +sessionStorage.getItem('noah-gate') || 0;
function gate() {
  return new Promise(res => {
    if (S.gate === '0' || Date.now() < gateUntil) return res(true);
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4); let v = '';
    $('#gq').textContent = `${a} × ${b} = ?`; $('#gin').textContent = '';
    $('#pad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<button class="${k === '✓' ? 'ok' : ''}" data-k="${k}">${k}</button>`).join('');
    const done = ok => { $('#gate').classList.remove('on'); $('#pad').onclick = null; $('#g-cancel').onclick = null; res(ok); };
    $('#pad').onclick = ev => {
      const k = ev.target.dataset.k; if (k == null) return; sfx.tap();
      if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') {
        if (+v === a * b) { gateUntil = Date.now() + 10 * 60e3; try { sessionStorage.setItem('noah-gate', gateUntil); } catch (e) {} return done(true); }
        sfx.bad(); const el = $('#gin'); el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); v = '';
      } else if (v.length < 3) v += k;
      $('#gin').textContent = v;
    };
    $('#g-cancel').onclick = () => done(false);
    $('#gate').classList.add('on');
  });
}

/* ---------- التسجيل والاحتفال ---------- */
async function award(e) {
  if (!(await gate())) return false;
  const before = totals().total, G = goal();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  S.log = S.log || {}; S.log[id] = Object.assign({ d: today(), t: Date.now() }, e);
  save(); closeSheet();
  const after = totals().total, dayFull = dayTotal(byDay()[today()] || []).full && !dayTotal((byDay()[today()] || []).filter(x => x.id !== id)).full;
  const won = STONES.filter(s => { const need = Math.round(G * s.f / 50) * 50; return before < need && after >= need; }).pop();
  const words = ['جووول!', 'هَدَف!', 'واو!', 'نَجْم!', 'أُسْطورَة!'];
  if (e.c === 'parent') celebrate(e.p < 0 ? 'خَصْم!' : 'بونَص!', e.p, e.n || (e.p < 0 ? 'بابا وَماما خَصَموا نِقاطاً — الْبَطَلُ يَلْتَزِمُ الْمَرَّةَ الْقادِمَةَ 💪' : 'بابا وَماما فَخورانِ بِكَ! 🌟'), null, e.p < 0 ? 'bad' : 'win');
  else if (won) celebrate(won.f === 1 ? 'الْهَدِيَّة!' : 'جائِزَةٌ جَديدَة!', e.p, won.f === 1 ? '🏆 رَفَعْتَ الْكَأْسَ! بلايستيشن ٥ لَكَ! 🎮' : `حَصَلْتَ عَلى ${won.n}! 🏅`, won.c, 'stone');
  else if (dayFull) celebrate('بُطولَة!', e.p + DAILY_BONUS, `أَنْجَزْتَ الْمُهِمّاتِ السِّتَّ الْيَوْمَ! ${PL(DAILY_BONUS)} مُكافَأَة ⭐`, null, 'win');
  else celebrate(e.r ? 'رَقْمٌ قِياسِيّ!' : words[Math.floor(Math.random() * words.length)], e.p, cheer(e), null, 'win');
  render();
  return true;
}
function cheer(e) {
  const m = M[e.c]; const L = {
    swim: 'رونالدو: سيوووو! أَنْتَ بَطَلُ الْمَسْبَحِ! 🏊', tidy: 'مبابي: أَسْرَعُ مِنْ هُجومٍ مُعاكِسٍ! ⚡', study: 'يامال: حَتّى النُّجومُ يَحُلّونَ واجِباتِهِم! 📚',
    morning: 'نيمار: صَباحُ السّامْبا يا كابْتِن! ☀️', eat: 'هالاند: قَوِيٌّ مِثْلي! 💪', sleep: 'ميسي: نَمْ يا نَجْمُ، غَداً مُباراةٌ جَديدَة! 🌙' };
  return L[e.c] || m.name;
}
function celebrate(word, pts, msg, gem, kind) {
  $('#b-word').textContent = word; $('#b-pts').textContent = pts ? `${PL(pts)}` : ''; $('#b-msg').textContent = msg || '';
  $('#b-gem').innerHTML = gem ? gemSVG(gem) : '';
  const box = $('#boom'); box.querySelectorAll('.spark').forEach(x => x.remove());
  const cols = ['#ffc83d', '#e8202a', '#2f8cff', '#22d36b', '#a43cff', '#fff'];
  for (let i = 0; i < 46; i++) {
    const s = document.createElement('i'); s.className = 'spark'; const a = Math.random() * Math.PI * 2, r = 220 + Math.random() * 520;
    s.style.cssText = `left:50%;top:50%;--c:${cols[i % cols.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;animation-delay:${Math.random() * .25}s`;
    box.appendChild(s);
  }
  if (kind === 'bad') box.querySelectorAll('.spark').forEach(x => x.remove());
  box.classList.toggle('neg', kind === 'bad');
  box.classList.add('on'); (kind === 'stone' ? sfx.stone : kind === 'bad' ? sfx.bad : sfx.win)();
  if (kind !== 'bad') setTimeout(() => voice(kind === 'stone'), 300);
  clearTimeout(celebrate.t); celebrate.t = setTimeout(() => box.classList.remove('on'), kind === 'stone' ? 4200 : 2900);
}
$('#boom').addEventListener('click', () => $('#boom').classList.remove('on'));

/* ---------- شاشة المهمة ---------- */
let tick = 0;
function openSheet(c) {
  const m = M[c], card = $('#sheet .sheet-card');
  card.style.setProperty('--ac', m.c1); card.style.setProperty('--ac2', m.c);
  $('#sh-img').src = `img/${c}.webp`; $('#sh-hero').textContent = `${m.ic} ${m.hero}`;
  $('#sh-title').textContent = m.name; $('#sh-rule').textContent = m.rule;
  ({ timer: uiTimer, morning: uiSteps, sleep: uiSteps, study: uiStudy, eat: uiEat })[m.kind](c);
  $('#sheet').classList.add('on'); sfx.tap();
}
function closeSheet() { $('#sheet').classList.remove('on'); clearInterval(tick); }
$('#sh-x').onclick = () => { closeSheet(); };

/* المؤقّت (سباحة / ترتيب): الوقت يُحفَظ محلياً فلو نام الآيباد أو أُغلقت الصفحة يكمل العدّ */
function uiTimer(c) {
  const m = M[c], run = lget(RUN, null), R = 120, C = 2 * Math.PI * R;
  const live = run && run.c === c ? run : null;
  $('#sh-ui').innerHTML = `
    <div class="clock" id="clk"><svg viewBox="0 0 280 280"><circle class="trk" cx="140" cy="140" r="${R}"/><circle class="arc" id="arc" cx="140" cy="140" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
      <div class="face"><span class="t" id="tt">٠:٠٠</span><span class="lp" id="lp">${c === 'swim' ? 'الْهَدَفُ: بَيْنَ ٨ وَ١٢ دَقيقَة' : 'كُلَّما أَسْرَعْتَ زادَتِ النِّقاط'}</span></div></div>
    <div class="btns" id="tb"></div>
    <button class="link" id="mlink">نَسيتَ الْمُؤَقِّتَ؟ أَدْخِلِ الدَّقائِقَ بِيَدِكَ</button>
    <div class="manual" id="man"><div class="step"><button id="mm">−</button><b id="mv"></b><button id="mp">+</button></div><p class="preview" id="mpv"></p><div class="btns"><button class="btn green" id="msave">سَجِّلِ النِّقاطَ</button></div></div>`;
  let mv = 10;
  const mUpd = () => { $('#mv').textContent = `${AR(mv)} دَقيقَة`; $('#mpv').innerHTML = `النِّقاطُ: <b>${PL(m.fn(mv * 60))}</b>`; };
  $('#mlink').onclick = () => { $('#man').classList.toggle('on'); mUpd(); };
  $('#mm').onclick = () => { mv = Math.max(1, mv - 1); mUpd(); sfx.tap(); };
  $('#mp').onclick = () => { mv = Math.min(60, mv + 1); mUpd(); sfx.tap(); };
  $('#msave').onclick = () => award({ c, s: mv * 60, p: m.fn(mv * 60), m: 1 });
  const paint = s => {
    $('#tt').textContent = mmss(s);
    const k = Math.min(1, s / m.full); $('#arc').style.strokeDashoffset = C * (1 - k);
    $('#arc').style.stroke = m.zone ? (s < m.zone[0] ? m.c : s <= m.zone[1] ? '#21b25b' : '#e8202a')   // أخضر داخل النافذة
      : s > m.full ? '#e8202a' : k > .7 ? '#ff9e1b' : m.c;
    $('#lp').innerHTML = `لَوِ انْتَهَيْتَ الْآنَ: <b>${PL(m.fn(s))}</b>`;
  };
  const idle = () => {
    clearInterval(tick); $('#clk').classList.remove('run'); paint(0);
    $('#lp').textContent = c === 'swim' ? 'الْهَدَفُ: بَيْنَ ٨ وَ١٢ دَقيقَة' : 'كُلَّما أَسْرَعْتَ زادَتِ النِّقاط';
    $('#tb').innerHTML = `<button class="btn green" id="go">▶ ابْدَأِ الْآنَ!</button>`;
    $('#go').onclick = () => { lset(RUN, { c, t0: Date.now() }); sfx.start(); running(Date.now()); };
  };
  const running = t0 => {
    $('#clk').classList.add('run'); $('#mlink').style.display = 'none'; $('#man').classList.remove('on');
    $('#tb').innerHTML = `<button class="btn gold" id="stop">🏁 انْتَهَيْتُ!</button><button class="btn dark" id="cancel">إِلْغاء</button>`;
    let lastMin = -1;
    const f = () => { const s = Math.floor((Date.now() - t0) / 1000); paint(s); const mi = Math.floor(s / 60); if (mi !== lastMin && s > 5) { if (lastMin >= 0) sfx.tick(); lastMin = mi; } };
    f(); clearInterval(tick); tick = setInterval(f, 250);
    $('#stop').onclick = () => { const s = Math.max(1, Math.floor((Date.now() - t0) / 1000)); clearInterval(tick); localStorage.removeItem(RUN); result(s); };
    $('#cancel').onclick = () => { localStorage.removeItem(RUN); $('#mlink').style.display = ''; idle(); };
  };
  const result = s => {
    const b = best(c), rec = !m.noRec && b && s < b, p = m.fn(s) + (rec ? 20 : 0);
    $('#clk').classList.remove('run'); paint(s);
    $('#lp').innerHTML = m.zone ? (s < m.zone[0] ? 'أَسْرَعُ مِنَ اللّازِمِ — الْهَدَفُ ٨–١٢ دَقيقَة 🙂' : s <= m.zone[1] ? 'في الْوَقْتِ الْمِثالِيِّ! 👏' : 'تَأَخَّرْتَ قَليلاً — الْهَدَفُ ٨–١٢ دَقيقَة 💪')
      : s <= 1200 ? 'أَحْسَنْتَ! 👏' : 'الْمَرَّةَ الْقادِمَةَ أَسْرَعُ! 💪';
    $('#tb').innerHTML = `<div class="result" style="width:100%"><div class="big">${PL(p)}</div>${rec ? `<span class="recflag">🏅 رَقْمٌ قِياسِيٌّ جَديد! ⁦+٢٠⁩</span>` : ''}<p>${mins(s)}</p></div>
      <button class="btn green" id="ok">⭐ سَجِّلِ النِّقاطَ</button><button class="btn dark" id="again">إِعادَة</button>`;
    $('#ok').onclick = () => award({ c, s, p, r: rec ? 1 : 0 });
    $('#again').onclick = () => { $('#mlink').style.display = ''; idle(); };
  };
  live ? running(live.t0) : idle();
}

/* خطوات بمؤقّت — الصباح: استيقظت ← فرّشت ← لبست · النوم: حان الوقت ← فرّشت ← الحمام ← الفراش
   الخطوة الأولى تبدأ العدّ، وكل خطوةٍ بعدها ٢٠ (الصباح يحسب الأولى أيضاً) فالأساس ٦٠ في الاثنين */
function uiSteps(c) {
  const m = M[c], done = (byDay()[today()] || []).some(e => e.c === c);
  let run = lget(RUN, null); if (run && run.c !== c) run = null;
  const steps = STEPS[c], N = steps.length;
  const draw = () => {
    const marks = (run && run.marks) || [], n = marks.length;
    const el = n ? Math.floor((Date.now() - run.t0) / 1000) : 0;
    $('#sh-ui').innerHTML = `${done ? `<p class="warn">✓ سَجَّلْتَ ${TOK[c]} الْيَوْمَ. يُحْسَبُ مَرَّةً واحِدَةً كُلَّ يَوْمٍ.</p>` : ''}
      <div class="mini">⏱ <b id="mt">${mmss(el)}</b></div>
      <div class="steps">${steps.map(([ic, t], i) => `<button class="stp ${i < n ? 'done' : ''} ${i === n ? 'next' : ''}" data-i="${i}" ${i !== n || done ? 'disabled' : ''}><span class="n">${i < n ? '✓' : ic}</span>${t}<span class="tm">${i < n && i ? mmss((marks[i] - run.t0) / 1000) : ''}</span></button>`).join('')}</div>
      <div class="btns">${n ? '<button class="btn dark" id="mreset">إِعادَةُ الْبِدايَةِ</button>' : ''}</div>`;
    $('#sh-ui').querySelectorAll('.stp').forEach(b => b.onclick = () => {
      const i = +b.dataset.i; if (i !== ((run && run.marks) || []).length) return;
      if (i === 0) { run = { c, t0: Date.now(), marks: [Date.now()] }; sfx.start(); } else { run.marks.push(Date.now()); sfx.tap(); }
      lset(RUN, run);
      if (run.marks.length === N) return finish(); draw();
    });
    const r = $('#mreset'); if (r) r.onclick = () => { run = null; localStorage.removeItem(RUN); draw(); };
    clearInterval(tick); if (n && n < N) tick = setInterval(() => { const t = $('#mt'); if (t) t.textContent = mmss((Date.now() - run.t0) / 1000); }, 500);
  };
  const finish = () => {
    clearInterval(tick); localStorage.removeItem(RUN);
    const s = Math.max(1, Math.floor((run.marks[N - 1] - run.t0) / 1000)), b = best(c), rec = b && s < b;
    // دورة النوم والاستيقاظ: صباحٌ بعد ليلةٍ سُجِّل فيها استعداد النوم
    const cyc = c === 'morning' && (byDay()[ydayOf(today())] || []).some(e => e.c === 'sleep');
    const p = 60 + mornBonus(s) + (rec ? 20 : 0) + (cyc ? CYCLE : 0);
    $('#sh-ui').innerHTML = `<div class="result"><div class="big">${PL(p)}</div>${rec ? `<span class="recflag">🏅 رَقْمٌ قِياسِيٌّ جَديد! ⁦+٢٠⁩</span>` : ''}${cyc ? `<span class="recflag">🌙☀️ نِمْتَ وَاسْتَيْقَظْتَ كَالْأَبْطالِ ${PL(CYCLE)}</span>` : ''}
      <p>${c === 'sleep' ? 'جَهَزْتَ لِلنَّوْمِ' : 'جَهَزْتَ'} في ${mins(s)} — الْخُطُواتُ ٦٠ + السُّرْعَةُ ${AR(mornBonus(s))}</p></div>
      <div class="btns"><button class="btn green" id="ok">⭐ سَجِّلِ النِّقاطَ</button><button class="btn dark" id="again">إِعادَة</button></div>`;
    $('#ok').onclick = () => award(Object.assign({ c, s, p, r: rec ? 1 : 0 }, cyc ? { x: 1 } : {}));
    $('#again').onclick = () => { run = null; draw(); };
  };
  draw();
}

/* الدراسة: يختار نوع الإنجاز ويكتبه */
function uiStudy(c) {
  let pick = 0;
  $('#sh-ui').innerHTML = `<div class="opts">${STUDY.map(([ic, t, p], i) => `<button class="opt ${i ? '' : 'on'}" data-i="${i}"><i>${ic}</i>${t}<small>${PL(p || 25)}</small></button>`).join('')}</div>
    <label class="lbl" for="sn">✍️ اكْتُبْ إِنْجازَكَ:</label><input class="note" id="sn" maxlength="80" placeholder="مَثَلاً: حَلَلْتُ واجِبَ الرِّياضِيّاتِ صَفْحَة ٢٠">
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">⭐ سَجِّلِ الْإِنْجازَ</button></div>`;
  const upd = () => { $('#pv').innerHTML = `النِّقاطُ: <b>${PL(STUDY[pick][2] || 25)}</b>`; };
  $('#sh-ui').querySelectorAll('.opt').forEach(b => b.onclick = () => { pick = +b.dataset.i; $('#sh-ui').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === b)); sfx.tap(); upd(); });
  $('#ok').onclick = () => {
    const [, t, p] = STUDY[pick], note = $('#sn').value.trim();
    award({ c, p: p || 25, n: (t + (note ? ' — ' + note : '')) });
  };
  upd();
}

/* الأكل: الوجبة + الكمية + الخضار */
function uiEat(c) {
  const h = new Date().getHours(); let meal = h < 11 ? 0 : h < 17 ? 1 : 2, amt = 0, veg = false;
  const eaten = new Set((byDay()[today()] || []).filter(e => e.c === c).map(e => e.k));
  $('#sh-ui').innerHTML = `<div class="opts" id="meals">${MEALS.map(([ic, t], i) => `<button class="opt" data-i="${i}"><i>${ic}</i>${t}${eaten.has(i) && i < 3 ? '<small>✓ سُجِّلَتْ</small>' : ''}</button>`).join('')}</div>
    <label class="lbl">كَمْ أَكَلْتَ؟</label>
    <div class="opts" id="amts"><button class="opt" data-a="0"><i>💪</i>الصَّحْنُ كُلُّهُ<small>⁦+٣٠⁩</small></button><button class="opt" data-a="1"><i>👍</i>أَغْلَبُهُ<small>⁦+١٥⁩</small></button></div>
    <button class="tog" id="veg"><span class="bx"></span>🥦 أَكَلْتُ خُضاراً أَوْ فاكِهَةً (⁦+١٠⁩)</button>
    <p class="warn" id="dup" hidden>سُجِّلَتْ هذِهِ الْوَجْبَةُ الْيَوْمَ مِنْ قَبْلُ.</p>
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">⭐ سَجِّلِ الْوَجْبَةَ</button></div>`;
  const upd = () => {
    $('#meals').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', +x.dataset.i === meal));
    $('#amts').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', +x.dataset.a === amt));
    $('#veg').classList.toggle('on', veg); $('#veg .bx').textContent = veg ? '✓' : '';
    const dup = meal < 3 && eaten.has(meal); $('#dup').hidden = !dup; $('#ok').disabled = dup;
    $('#pv').innerHTML = `النِّقاطُ: <b>${PL((amt ? 15 : 30) + (veg ? 10 : 0))}</b>`;
  };
  $('#meals').onclick = e => { const b = e.target.closest('.opt'); if (b) { meal = +b.dataset.i; sfx.tap(); upd(); } };
  $('#amts').onclick = e => { const b = e.target.closest('.opt'); if (b) { amt = +b.dataset.a; sfx.tap(); upd(); } };
  $('#veg').onclick = () => { veg = !veg; sfx.tap(); upd(); };
  $('#ok').onclick = () => award({ c, k: meal, p: (amt ? 15 : 30) + (veg ? 10 : 0), n: `${MEALS[meal][1]}: ${amt ? 'أَكَلَ أَغْلَبَهُ' : 'أَكْمَلَ الصَّحْنَ'}${veg ? ' + خُضار 🥦' : ''}` });
  upd();
}

/* ---------- الأحداث ---------- */
$('#missions').addEventListener('click', e => { const b = e.target.closest('.m'); if (b) openSheet(b.dataset.c); });
$('#log').addEventListener('click', async e => {
  const b = e.target.closest('.del'); if (!b) return;
  if (!confirm('حَذْفُ هذا الْإِنْجازِ وَنِقاطِهِ؟')) return;
  if (!(await gate())) return;
  S.del = S.del || {}; S.del[b.dataset.id] = 1; save(); render();
});
// بونص بابا وماما وخصمهم: ٥٠ أو ١٠٠ فقط، بعد سؤال الضرب
$('#parents').addEventListener('click', e => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  const p = +b.dataset.p; if (!PARENT.includes(Math.abs(p))) return;
  sfx.tap(); const why = $('#pr-why').value.trim();
  award({ c: 'parent', p, n: why }).then(ok => { if (ok) $('#pr-why').value = ''; });
});
// الإعدادات
function howHTML() {
  return `<ul>
  <li>⚡ السِّباحَة: بَيْنَ ٨ وَ١٢ دَقيقَة = ١٠٠، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠.</li>
  <li>🦾 التَّرْتيب: ٥ د أَوْ أَقَلّ = ١٠٠، وَتَنْزِلُ حَتّى ٣٠ عِنْدَ ٢٠ د، وَبَعْدَها ١٥.</li>
  <li>🛡️ الصَّباح: ٣ خُطُواتٍ × ٢٠ + سُرْعَة (١٠ د = ٤٠، ١٥ د = ٢٥، ٢٠ د = ١٠) — مَرَّةً في الْيَوْم.</li>
  <li>📖 الدِّراسَة: ٢٥ لِكُلِّ إِنْجاز، وَ٥٠ لِلدَّرَجَةِ الْكامِلَة.</li>
  <li>💪 الْأَكْل: ٣٠ لِلصَّحْنِ كامِلاً، ١٥ لِأَغْلَبِه، ⁦+١٠⁩ لِلْخُضار — كُلُّ وَجْبَةٍ مَرَّة.</li>
  <li>🌙 النَّوْم: فِرْشاة + حَمّام + فِراش × ٢٠ + سُرْعَة (مِثْلُ الصَّباح) — مَرَّةً في الْيَوْم.</li>
  <li>🌙☀️ صَباحٌ بَعْدَ لَيْلَةٍ سُجِّلَ فيها النَّوْم: ${PL(CYCLE)} عَلى تَحَدّي الِاسْتِيقاظ.</li>
  <li>🏅 كَسْرُ الرَّقْمِ الْقِياسِيِّ بِالْمُؤَقِّت (التَّرْتيبُ وَالصَّباحُ وَالنَّوْم): ⁦+٢٠⁩.</li>
  <li>⭐ الْمُهِمّاتُ السِّتُّ في يَوْمٍ واحِد: ${PL(DAILY_BONUS)}.</li>
  <li>⚖️ بونَصُ بابا وَماما أَوْ خَصْمُهُما: ٥٠ أَوْ ١٠٠ فَقَط.</li>
  <li>🎯 يَوْمٌ جَيِّدٌ ≈ ٤٥٠–٥٠٠ نُقْطَة، فَالْهَدَفُ ${AR(goal())} يَحْتاجُ الْتِزاماً شِبْهَ يَوْمِيٍّ طَوالَ الشَّهْر.</li></ul>`;
}
$('#settings-btn').onclick = async () => {
  if (!(await gate())) return;
  $('#st-start').value = S.start; $('#st-goal').value = goal(); $('#st-gate').checked = S.gate !== '0'; $('#how').innerHTML = howHTML();
  $('#settings').classList.add('on');
};
$('#st-x').onclick = () => $('#settings').classList.remove('on');
$('#st-save').onclick = () => {
  const st = $('#st-start').value, g = Math.round(+$('#st-goal').value / 50) * 50;
  if (/^\d{4}-\d\d-\d\d$/.test(st)) S.start = st;
  if (g >= 1000) S.goal = String(g);
  S.gate = $('#st-gate').checked ? '1' : '0'; S.sat = Date.now();
  save(); $('#settings').classList.remove('on'); shown = 0; render();
};
$('#st-reset').onclick = () => {
  if (!confirm('سَيُمْسَحُ سِجِلُّ هذا الشَّهْرِ كُلُّهُ وَيَبْدَأُ تَحَدٍّ جَديدٌ مِنَ الْيَوْمِ. مُتَأَكِّد؟')) return;
  const g = S.goal, gt = S.gate; S = Object.assign(fresh(), { goal: g, gate: gt, rst: Date.now(), rby: 1, sat: Date.now() }); save();   // التصفير الوحيد المعتمد localStorage.removeItem(RUN);
  $('#settings').classList.remove('on'); shown = 0; render();
};
// المزامنة
if (window.EliaSave) {
  EliaSave.on(KEY, st => { if (st && st.start) { S = st; render(); } });
  EliaSave.onState(s => { $('#sync').textContent = { sync: '☁️ يُزامِنُ…', ok: '☁️ مَحْفوظٌ في السَّحابَة', err: '⚠️ لَمْ تَتِمَّ الْمُزامَنَة', off: '📴 بِلا إِنْتَرْنِت — مَحْفوظٌ عَلى الْجِهاز', idle: '' }[s] || ''; });
}
// استئناف مؤقّتٍ كان يعمل
const pending = lget(RUN, null);
render();
if (pending && M[pending.c]) setTimeout(() => openSheet(pending.c), 400);
// يوم جديد أثناء فتح الصفحة
let lastDay = today();
setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60e3);

window.__heroes = { get S() { return S; }, award, render, totals };
})();
