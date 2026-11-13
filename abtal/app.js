/* إيليافسكي — الموسم ٢ من تحدّي الأبطال بثيمة فورتنايت (الموسم ١ كان الأفنجرز، في تاريخ git)
   هذا الملف: المهمات الثماني ومؤقّتاتها والاحتفالات والسجل. الثيمات السبع والجزيئات وحساب النقاط في fort.js.
   البيانات في مفتاح واحد يُزامَن سحابياً عبر EliaSave:
   { start:'YYYY-MM-DD', goal:'12000', gate:'1'|'0', prize, sat, log:{id:{c,p,d,t,s,n,m,r,k}}, del:{id:1}, rst, rby }
   rst+rby يُختمان بأمر وليّ الأمر «تصفير» فقط، وsat وقت آخر تعديلٍ للإعدادات — فجهازٌ جديدٌ يُفتح لأول مرة لا يمسح السحابة ولا يغيّر إعداداتها.
   السجل كائنٌ بمعرّفات (لا مصفوفة) والحذف شاهدةٌ في del — لأن دمج save.js يأخذ اتحاد المفاتيح فلا يضيع إدخال جهازٍ آخر ولا يعود محذوف.
   ?demo=4500 يعرض اللعبة بنقاطٍ تجريبية ولا يحفظ شيئاً، و?theme=3 يعرض ثيمة نُدرةٍ بعينها. */
(() => {
'use strict';
const F = window.Fort;
const { KEY, TIERS, DAILY_BONUS, DAILY_NEED, DAYS, AR, PL, $, lget, lset, today, dnum, ymd, pad2 } = F;
const ORDER = F.MISSIONS, RUN = 'elia-heroes-run', DROP = 'elia-fort-drop', CYCLE = 20, LVL = 250, HP = 250;
const PARENT = [50, 100];   // بونص بابا وماما أو خصمهم: هاتان القيمتان فقط
const DEMO = F.num('demo'), PREVIEW = F.num('theme') != null ? Math.max(0, Math.min(6, Math.round(F.num('theme')))) : null;
const LIVE = DEMO == null && PREVIEW == null;   // في المعاينة لا يُحفظ شيءٌ ولا تُسجَّل النُّدرة المشاهَدة
const mmss = s => `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}`.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const mins = s => s < 60 ? `${AR(s)} ثانية` : `${AR(Math.floor(s / 60))} د ${s % 60 ? AR(s % 60) + ' ث' : ''}`.trim();
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- المهمات ---------- */
const swimPts = s => s >= 480 && s <= 720 ? 100 : 50;   // بين ٨ و١٢ دقيقة = كاملة، وغير ذلك نصفها
const tidyPts = s => s <= 300 ? 100 : s <= 1200 ? Math.round(100 - (s - 300) / 900 * 70) : 15;
const mornBonus = s => s <= 600 ? 40 : s <= 900 ? 25 : s <= 1200 ? 10 : 0;
const ydayOf = d => { const [y, m, dd] = d.split('-').map(Number); return ymd(new Date(y, m - 1, dd - 1)); };

const M = {
  pray:  { hero: 'مُهِمَّةُ الصَّلاة', ic: '🤲', name: 'نورُ الصَّلاةِ', task: 'الصَّلاةُ في وَقْتِها', c: '#12a07a', c1: '#c9f5e6', kind: 'pray', calm: 1,
           rule: 'كُلُّ صَلاةٍ تُصَلّيها في وَقْتِها = ٢٠ نُقْطَة، وَمَعَ الْجَماعَةِ أَوْ في الْمَسْجِدِ ⁦+١٠⁩. كُلُّ صَلاةٍ تُسَجَّلُ مَرَّةً في الْيَوْمِ.' },
  morning: { hero: 'مُهِمَّةُ الْهُبوط', ic: '🪂', name: 'الْقَفْزُ مِنَ الْباصِ', task: 'تَحَدّي الِاسْتِيقاظِ', c: '#2f6bff', c1: '#cfe0ff', kind: 'morning',
           rule: 'الْباصُ يَطيرُ فَوْقَ الْجَزيرَةِ! اِسْتَيْقِظْ ← فَرِّشْ أَسْنانَكَ ← اِلْبَسْ مَلابِسَ الْمَدْرَسَةِ. كُلُّ خُطْوَةٍ ٢٠، وَإِنْ هَبَطْتَ جاهِزاً خِلالَ ١٠ دَقائِقَ فَلَكَ ٤٠ إِضافِيَّة.' },
  study: { hero: 'مُهِمَّةُ الْكَنْز', ic: '📦', name: 'صُنْدوقُ الْكَنْزِ', task: 'الدِّراسَةُ وَالْواجِباتُ', c: '#e0a100', c1: '#fff0b0', kind: 'study',
           rule: 'كُلُّ إِنْجازٍ دِراسِيٍّ يَفْتَحُ صُنْدوقاً = ٢٥ نُقْطَة، وَالدَّرَجَةُ الْكامِلَةُ صُنْدوقٌ أُسْطورِيٌّ = ٥٠. بِلا تَوْقيتٍ.' },
  art:   { hero: 'مُهِمَّةُ الْفَنّ', ic: '🎨', name: 'اسْتوديو الْأَلْوانِ', task: 'الرَّسْمُ وَالْفَنُّ', c: '#ff4fa3', c1: '#ffd3ea', kind: 'art',
           rule: 'كُلُّ عَمَلٍ فَنِّيٍّ تُنْجِزُهُ = ٢٥ نُقْطَة، وَالتُّحْفَةُ الَّتي يَخْتارُها بابا أَوْ ماما = ٥٠. اُرْسُمْ، لَوِّنْ، وَاصْنَعْ بِيَدَيْكَ!' },
  tidy:  { hero: 'مُهِمَّةُ الْبِناء', ic: '🧱', name: 'بِناءُ الْقَلْعَةِ', task: 'تَرْتيبُ الْأَلْعابِ وَالْغُرْفَةِ', c: '#ff7a1a', c1: '#ffe0bf', kind: 'timer', full: 1200, fn: tidyPts,
           rule: 'اِبْنِ قَلْعَتَكَ: رَتِّبْ أَلْعابَكَ وَغُرْفَتَكَ بِسُرْعَةِ أَمْهَرِ الْبَنّائينَ. ٥ دَقائِقَ أَوْ أَقَلَّ = ١٠٠ نُقْطَة.' },
  eat:   { hero: 'مُهِمَّةُ الدِّرْع', ic: '🛡️', name: 'شَحْنُ الدِّرْعِ', task: 'تَحَدّي الْأَكْلِ', c: '#16b45a', c1: '#c9f7da', kind: 'eat',
           rule: 'الْأَكْلُ يَشْحَنُ صِحَّتَكَ وَدِرْعَكَ: كُلُّ وَجْبَةٍ تُكْمِلُها = ٣٠ نُقْطَة، وَالْخُضارُ وَالْفاكِهَةُ تَزيدُكَ ١٠!' },
  swim:  { hero: 'مُهِمَّةُ الْبُحَيْرَة', ic: '🌊', name: 'غَطْسَةُ الْبُحَيْرَةِ', task: 'تَحَدّي السِّباحَةِ', c: '#1fa3ff', c1: '#bfe8ff', kind: 'timer', full: 720, zone: [480, 720], noRec: true, fn: swimPts,
           rule: 'اِقْفِزْ في الْبُحَيْرَةِ وَاخْرُجْ في نَحْوِ ١٠ دَقائِقَ: بَيْنَ ٨ وَ١٢ دَقيقَةً = ١٠٠ نُقْطَة، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠ نُقْطَة.' },
  sleep: { hero: 'مُهِمَّةُ الْعاصِفَة', ic: '🌀', name: 'الْهُروبُ مِنَ الْعاصِفَةِ', task: 'الِاسْتِعْدادُ لِلنَّوْمِ', c: '#8a3dff', c1: '#e3d4ff', kind: 'sleep',
           rule: 'الْعاصِفَةُ تُغْلِقُ! فَرِّشْ أَسْنانَكَ ← اُدْخُلِ الْحَمّامَ ← اُدْخُلِ الدّائِرَةَ الْآمِنَةَ (فِراشَكَ). كُلُّ خُطْوَةٍ ٢٠، وَخِلالَ ١٠ دَقائِقَ ٤٠ إِضافِيَّة. وَإِنْ نَجَحْتَ صَباحاً في الْقَفْزِ مِنَ الْباصِ فَلَكَ ٢٠ مُكافَأَةُ النَّوْمِ وَالِاسْتِيقاظ.' },
};
const STEPS = {
  morning: [['⏰', 'اسْتَيْقَظْتُ!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['👕', 'لَبِسْتُ مَلابِسَ الْمَدْرَسَةِ']],
  sleep: [['🌙', 'الْعاصِفَةُ قادِمَة!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['🚽', 'دَخَلْتُ الْحَمّامَ'], ['🛏️', 'في الدّائِرَةِ الْآمِنَةِ وَالنّورُ مُطْفَأ']],
};
const TOK = { morning: 'الْقَفْزَ مِنَ الْباصِ', sleep: 'الْهُروبَ مِنَ الْعاصِفَةِ' };
const STUDY = [['📝', 'حَلَلْتُ واجِبي'], ['📖', 'قَرَأْتُ دَرْساً'], ['🧠', 'حَفِظْتُ'], ['✍️', 'كَتَبْتُ بِخَطٍّ جَميلٍ'], ['🔁', 'راجَعْتُ لِلِاخْتِبارِ'], ['🏅', 'دَرَجَةٌ كامِلَةٌ', 50]];
const ART = [['🎨', 'رَسَمْتُ رَسْمَةً جَديدَةً'], ['🖍️', 'لَوَّنْتُ صَفْحَةً'], ['✂️', 'عَمَلٌ يَدَوِيٌّ'], ['🧱', 'صَنَعْتُ مُجَسَّماً'], ['🏆', 'تُحْفَةٌ يَخْتارُها بابا', 50]];
const PRAYERS = [['🌅', 'الْفَجْر'], ['☀️', 'الظُّهْر'], ['🌤️', 'الْعَصْر'], ['🌇', 'الْمَغْرِب'], ['🌙', 'الْعِشاء']];
const MEALS = [['🍳', 'الْفُطور'], ['🍛', 'الْغَداء'], ['🍲', 'الْعَشاء'], ['🍎', 'وَجْبَةٌ خَفيفَةٌ']];

/* ---------- الحالة ---------- */
let S;
if (DEMO != null) {   // معاينة: حالةٌ في الذاكرة فقط، بدأت قبل أربعة أيام وفيها نقاط المعاينة
  S = F.season(null); S.start = ymd(new Date(Date.now() - 4 * 864e5)); S.gate = '0';
  if (DEMO) S.log = { demo0: { c: 'parent', p: Math.round(DEMO), d: ymd(new Date(Date.now() - 864e5)), t: Date.now() - 864e5, n: 'نِقاطُ الْمُعايَنَةِ' } };
} else {
  S = lget(KEY, null); const s2 = F.season(S);
  if (s2 !== S) { S = s2; lset(KEY, S); } else if (!S.start) S.start = F.START;
}
function save() { if (DEMO != null) return; lset(KEY, S); window.EliaSave && EliaSave.push(); }
const goal = () => F.goalOf(S);
const started = () => dnum(today()) >= dnum(S.start);
const entries = () => Object.entries(S.log || {}).filter(([id]) => !(S.del || {})[id]).map(([id, e]) => Object.assign({ id }, e)).sort((a, b) => b.t - a.t);
const totals = () => F.calc(S);
const byDay = () => totals().g;
const dayTotal = F.dayTotal;
function best(c) { const xs = entries().filter(e => e.c === c && e.s && !e.m).map(e => e.s); return xs.length ? Math.min(...xs) : 0; }
function streak(g) {   // أيام متتالية فيها نقاط حتى اليوم (أو أمس إن لم يبدأ اليوم بعد)
  let d = dnum(today()); if (!g[today()]) d--;
  let n = 0; const has = new Set(Object.keys(g).map(dnum));
  while (has.has(d)) { n++; d--; }
  return n;
}
const level = t => Math.floor(Math.max(0, t) / LVL) + 1;
const prizeName = () => (S.prize || '').trim() || 'جائِزَةٌ نَقْدِيَّةٌ مُفاجِئَة';

/* ---------- الصوت ---------- */
let AC = null;
const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function tone(seq) {
  try {
    const a = ac(), t0 = a.currentTime + .02;
    seq.forEach(([f, st, du, ty = 'square', v = .07, f2]) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = ty; o.frequency.setValueAtTime(f, t0 + st);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + st + du);
      g.gain.setValueAtTime(0, t0 + st); g.gain.linearRampToValueAtTime(v, t0 + st + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + st + du);
      o.connect(g).connect(a.destination); o.start(t0 + st); o.stop(t0 + st + du + .05);
    });
  } catch (e) {}
}
function whoosh(dur = .7, from = 300, to = 2400, v = .16) {   // ريحٌ تمرّ: ضجيجٌ عبر مرشّحٍ يتحرّك
  try {
    const a = ac(), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .4); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(t);
  } catch (e) {}
}
const sfx = {
  tap: () => tone([[700, 0, .07, 'triangle', .06]]),
  start: () => { whoosh(.6, 400, 3000); tone([[392, .1, .12], [523, .2, .12], [784, .3, .3, 'sawtooth', .05]]); },
  win: () => tone([[523, 0, .12], [659, .1, .12], [784, .2, .12], [1047, .3, .45, 'sawtooth', .06], [1319, .3, .45, 'triangle', .05]]),
  stone: () => tone([[392, 0, .25, 'sawtooth', .05], [523, .18, .25, 'sawtooth', .05], [659, .36, .25, 'sawtooth', .05], [784, .54, .8, 'sawtooth', .06], [1568, .54, .8, 'triangle', .05], [2093, .9, .5, 'sine', .04]]),
  calm: () => tone([[523, 0, 1.2, 'sine', .06], [659, .25, 1.2, 'sine', .05], [784, .5, 1.6, 'sine', .05], [1047, .8, 1.8, 'sine', .035]]),   // أجراسٌ هادئة للصلاة
  level: () => tone([[880, 0, .09, 'square', .05], [1175, .08, .09, 'square', .05], [1760, .16, .35, 'square', .05, 2640]]),
  chest: () => { whoosh(.9, 2000, 300, .12); tone([[1047, .3, .1, 'triangle', .06], [1319, .38, .1, 'triangle', .06], [1568, .46, .1, 'triangle', .06], [2093, .54, .6, 'triangle', .06], [2637, .62, .6, 'sine', .04]]); },
  bad: () => tone([[200, 0, .2, 'sawtooth', .06], [150, .15, .3, 'sawtooth', .06]]),
  tick: () => tone([[1400, 0, .04, 'square', .03]]),
};
const VOICE = ['siuuu', 'hero', 'genius', 'smart', 'won', 'cheer', 'imgenius'];
let vo = null;
function voice(name) {
  try { if (vo) vo.pause(); vo = new Audio(`../huruf/assets/audio/elia/${name || pick(VOICE)}.mp3`); vo.play().catch(() => {}); } catch (e) {}
}

/* ---------- الثيمة تتبع النُّدرة ---------- */
let tierNow = -1;
function cinematic(k, msg) {
  sfx.stone(); whoosh(1.1, 200, 3200, .18); setTimeout(() => voice('won'), 1400);
  F.tierUp(k, { msg: msg || (k === 6 ? '👑 أَخَذْتَ تاجَ النَّصْرِ — الْجائِزَةُ النَّقْدِيَّةُ صارَتْ لَكَ!' : 'اللُّعْبَةُ كُلُّها تَلَوَّنَتْ بِلَوْنِ نُدْرَتِكَ الْجَديدَةِ ✨') });
  if (LIVE) lset(F.SEEN, k);
}
function syncTier(total) {
  const k = PREVIEW != null ? PREVIEW : F.tierOf(total, goal());
  if (k === tierNow) return;
  const prev = tierNow; tierNow = k;
  if (prev === -1) {   // أول رسمٍ للصفحة
    const seen = LIVE ? lget(F.SEEN, null) : k;
    if (seen == null || seen >= k) { F.applyTheme(k); if (LIVE) lset(F.SEEN, k); return; }
    F.applyTheme(seen); setTimeout(() => cinematic(k), 900);   // وصلها على جهازٍ آخر: يرى المشهد هنا مرةً واحدة
    return;
  }
  if (k > prev) cinematic(k); else { F.applyTheme(k); if (LIVE) lset(F.SEEN, k); }
}

/* ---------- الرسم ---------- */
let first = true;
function render() {
  const { total, g } = totals(), G = goal(), td = dayTotal(g[today()] || []);
  const dn = dnum(today()) - dnum(S.start) + 1, left = Math.max(0, DAYS - dn + 1);
  $('#c-day').textContent = dn < 1 ? (dn === 0 ? '🚌 الْباصُ يَنْطَلِقُ غَداً!' : `🚌 الْباصُ يَنْطَلِقُ بَعْدَ ${AR(1 - dn)} أَيّام`) : dn > DAYS ? '🏁 انْتَهى الْمَوْسِمُ' : `📅 الْيَوْمُ ${AR(dn)} مِنْ ${AR(DAYS)}`;
  $('#c-left').textContent = dn >= 1 && dn <= DAYS ? `🌀 الْعاصِفَةُ بَعْدَ ${AR(left)} ${left === 1 ? 'يَوْم' : 'يَوْماً'}` : '';
  const st = streak(g); $('#c-streak').textContent = st >= 2 ? `🔥 ${AR(st)} أَيّامٍ مُتَتالِيَة` : '';
  F.countTo($('#total'), Math.max(0, total));
  $('#goal-line').textContent = total >= G ? '👑 وَصَلْتَ إِلى الْجائِزَةِ!' : `مِنْ ${AR(G)} — باقي ${AR(G - total)}`;
  const lv = level(total), xp = Math.max(0, total) % LVL;
  $('#lvl').textContent = AR(lv);
  $('#xp-bar').style.width = (xp / LVL * 100).toFixed(1) + '%';
  $('#xp-txt').textContent = `${AR(xp)} / ${AR(LVL)} ← الْمُسْتَوى ${AR(lv + 1)}`;
  $('#xp-ring').style.strokeDashoffset = (226.2 * (1 - xp / LVL)).toFixed(1);
  syncTier(total);
  const k = tierNow, T = TIERS[k];
  $('#rar').innerHTML = `${F.tile(k)}<span><small>${k ? 'نُدْرَتُكَ' : 'أَنْتَ في'}</small><b>${T.n}</b><em>${T.ic} ${T.w}</em></span>`;
  $('#mc-world').textContent = T.w;
  renderTrack(total, G, k);
  // اليوم: الصحة ثم الدرع، والمهمات الثماني
  const tp = Math.max(0, td.pts);
  $('#today').textContent = (td.pts < 0 ? '−' : '') + AR(Math.abs(td.pts));
  $('#hp-bar').style.width = (Math.min(tp, HP) / HP * 100).toFixed(1) + '%'; $('#hp-num').textContent = AR(Math.min(tp, HP));
  $('#sh-bar').style.width = (Math.min(Math.max(tp - HP, 0), HP) / HP * 100).toFixed(1) + '%'; $('#sh-num').textContent = AR(Math.min(Math.max(tp - HP, 0), HP));
  $('#six').innerHTML = ORDER.map(c => `<i class="${td.done.has(c) ? 'on' : ''}" style="--c:${M[c].c}" title="${M[c].name}">${M[c].ic}</i>`).join('');
  $('#today-bonus').textContent = td.full ? `👑 #١ نَصْرُ الْيَوْمِ ${PL(DAILY_BONUS)}` : `🎯 ${AR(td.n)} مِنْ ${AR(DAILY_NEED)} مُهِمّاتٍ مُخْتَلِفَةٍ ← نَصْرُ الْيَوْمِ ${PL(DAILY_BONUS)}`;
  renderQuests(g);
  // الجائزة
  const pct = Math.max(0, Math.min(1, total / G));
  $('#prize').classList.toggle('locked', total < G);
  $('#prize-name').textContent = prizeName();
  $('#prize-lock').innerHTML = total < G ? `<b>🔒</b><span>تُفْتَحُ عِنْدَ ${AR(G)} نُقْطَة</span>` : '';
  $('#prize-msg').textContent = total >= G ? 'أَخَذْتَ تاجَ النَّصْرِ يا بَطَلُ! الْجائِزَةُ النَّقْدِيَّةُ صارَتْ لَكَ 👑💵' : `اجْمَعِ النُّدْراتِ السِّتَّ وَاصِلْ إِلى ${AR(G)} نُقْطَة قَبْلَ أَنْ تُغْلِقَ الْعاصِفَةُ لِتَفوزَ بِالْجائِزَةِ النَّقْدِيَّةِ الْحَقيقِيَّةِ!`;
  $('#prize-bar').style.width = (pct * 100).toFixed(2) + '%';
  const daysLeft = Math.max(1, Math.min(DAYS, DAYS - Math.max(1, dn) + (g[today()] ? 0 : 1)));
  $('#pace').textContent = total >= G ? '' : dn > DAYS ? 'انْتَهى الْمَوْسِمُ — يُمْكِنُ لِبابا أَنْ يَبْدَأَ مَوْسِماً جَديداً مِنَ الْإِعْداداتِ.' : `🎯 تَحْتاجُ نَحْوَ ${AR(Math.ceil((G - total) / daysLeft))} نُقْطَة كُلَّ يَوْمٍ لِتَصِلَ.`;
  renderDrop(g);
  renderLog(g);
  if (first) { first = false; setTimeout(() => { $('#missions').classList.remove('intro'); $('#track').classList.remove('intro'); }, 2600); }
}
function renderTrack(total, G, k) {
  let nextSet = false, nextI = 0;
  $('#track').innerHTML = TIERS.slice(1).map((T, j) => {
    const i = j + 1, nd = F.need(G, i), on = total >= nd, nx = !on && !nextSet; if (nx) { nextSet = true; nextI = i; }
    return `<div class="tc ${on ? 'on' : nx ? 'next' : 'lock'} ${i === k ? 'cur' : ''}" style="--c:${T.t1};--c2:${T.t2};--i:${j}"><span class="mk">${on ? '✓' : nx ? '◀' : '🔒'}</span>${F.tile(i)}<b>${T.n}</b><small>${on ? 'مَفْتوحَة' : AR(nd)}</small><em>${T.ic} ${T.w}</em></div>`;
  }).join('');
  const pc = Math.max(0, Math.min(1, total / G));   // ألوان النُّدرات ممتدّةٌ على طول الشريط كله، والملء يكشف منها ما وصله
  $('#tbar').style.width = (pc * 100).toFixed(2) + '%'; $('#tbar').style.backgroundSize = (100 / Math.max(pc, .01)).toFixed(1) + '% 100%';
  $('#tbar-box').querySelectorAll('b').forEach(x => x.remove());
  TIERS.slice(1, -1).forEach(T => { const b = document.createElement('b'); b.style.right = T.f * 100 + '%'; $('#tbar-box').appendChild(b); });
  $('#tnext').innerHTML = nextI ? `باقي <b>${AR(F.need(G, nextI) - total)}</b> نُقْطَة إِلى «${TIERS[nextI].n}» — وَعِنْدَها تَتَلَوَّنُ اللُّعْبَةُ كُلُّها وَيَتَحَوَّلُ عالَمُكَ إِلى <b>${TIERS[nextI].w}</b> ${TIERS[nextI].ic}` : '👑 فَتَحْتَ النُّدْراتِ السِّتَّ كُلَّها!';
  const tr = $('#track'), c = tr.querySelector('.next') || tr.querySelector('.cur');
  if (c) requestAnimationFrame(() => { const a = tr.getBoundingClientRect(), b = c.getBoundingClientRect(); tr.scrollBy({ left: (b.left + b.width / 2) - (a.left + a.width / 2), behavior: first ? 'auto' : 'smooth' }); });
}
function renderQuests(g) {
  $('#missions').innerHTML = ORDER.map((c, i) => {
    const m = M[c], list = (g[today()] || []).filter(e => e.c === c), pts = list.reduce((a, e) => a + e.p, 0), b = best(c);
    return `<button class="q ${list.length ? 'done' : ''} ${m.calm ? 'calm' : ''}" data-c="${c}" style="--i:${i};--qc:${m.c};--qc1:${m.c1}">
      <img src="img/${c}.webp" alt="" loading="lazy"><span class="q-tag">${m.ic} ${m.hero}</span><span class="q-done">${list.length ? `✓ ${PL(pts)}` : ''}</span>
      <span class="q-info"><b>${m.name}</b><small>${m.task}</small><span class="rec">${b && !m.noRec ? `🏅 رَقْمُكَ: ${mins(b)}` : ''}</span><em class="q-go">${m.calm ? 'سَجِّلْ صَلاتَكَ' : 'ابْدَأْ'} ◀</em></span></button>`;
  }).join('');
}
function renderLog(g) {
  const days = Object.keys(g).sort().reverse();
  if (!days.length) { $('#log').innerHTML = `<p class="empty">${started() ? 'لَمْ تَبْدَأْ بَعْدُ… اخْتَرْ أَوَّلَ مُهِمَّةٍ وَاقْفِزْ مِنَ الْباصِ! 🪂' : 'الْباصُ يَنْطَلِقُ يَوْمَ السَّبْتِ… جَهِّزْ نَفْسَكَ يا بَطَلُ! 🚌'}</p>`; return; }
  $('#log').innerHTML = days.slice(0, 14).map(d => {
    const l = g[d], t = dayTotal(l), dt = new Date(...d.split('-').map((x, i) => i === 1 ? x - 1 : +x));
    const label = d === today() ? 'الْيَوْمَ' : dt.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="day"><h4>${label}<span>${PL(t.pts)}${t.full ? ' 👑' : ''}</span></h4>${l.map(e => {
      const m = e.c === 'parent' ? { c: e.p < 0 ? '#ff3b4e' : '#ffe14d', ic: e.p < 0 ? '⚠️' : '🎁', hero: 'بابا وَماما' } : M[e.c] || { c: '#888', ic: '⭐', hero: '' };
      return `<div class="ent ${e.p < 0 ? 'neg' : ''}" style="--c:${m.c}"><span class="ic">${m.ic}</span><span class="tx">${desc(e)}<small>${m.hero} · ${new Date(e.t).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</small></span><span class="p">${PL(e.p)}</span><button class="del" data-id="${e.id}" aria-label="حذف">✕</button></div>`;
    }).join('')}${t.full ? `<div class="ent" style="--c:#ffe14d"><span class="ic">👑</span><span class="tx">#١ نَصْرُ الْيَوْمِ: ${AR(DAILY_NEED)} مُهِمّاتٍ مُخْتَلِفَةٍ في يَوْمٍ واحِدٍ</span><span class="p">${PL(DAILY_BONUS)}</span><span style="width:34px"></span></div>` : ''}</div>`;
  }).join('');
}
function desc(e) {
  if (e.c === 'swim') return `سِباحَةٌ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'tidy') return `تَرْتيبُ الْغُرْفَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'morning') return `هَبَطَ جاهِزاً لِلْمَدْرَسَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.x ? ' 🌙☀️ نَوْمٌ وَاسْتِيقاظ' : ''}`;
  if (e.c === 'sleep') return `دَخَلَ الدّائِرَةَ الْآمِنَةَ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}`;
  if (e.c === 'parent') return `${e.p < 0 ? 'خَصْمُ عُقوبَةٍ' : 'بونَصٌ خاصٌّ'}${e.n ? ' — ' + e.n : ''}`;
  return e.n || (M[e.c] ? M[e.c].task : '');
}

/* ---------- الإسقاط اليومي: صندوقٌ ينزل بعد أول مهمةٍ في اليوم، فيه تحدٍّ مضحكٌ بلا نقاط ---------- */
const DROPS = [
  ['🕺', 'رَقْصَةُ النَّصْرِ!', 'قُمِ الْآنَ وَارْقُصْ رَقْصَةَ إيليا لِمُدَّةِ ١٠ ثَوانٍ! 😂'],
  ['🤸', 'قَفَزاتُ الْباصِ!', 'اقْفِزْ ١٠ قَفَزاتٍ كَأَنَّكَ تَهْبِطُ مِنَ الْباصِ الطّائِرِ!'],
  ['🤗', 'حُضْنُ الْفَريقِ!', 'اذْهَبْ وَاحْضُنْ ماما وَبابا حُضْناً كَبيراً الْآنَ ❤️'],
  ['💧', 'جُرْعَةُ الدِّرْعِ!', 'اشْرَبْ كَأْسَ ماءٍ كامِلاً لِتَشْحَنَ دِرْعَكَ 🛡️'],
  ['🦸', 'وَضْعِيَّةُ الْبَطَلِ!', 'قِفْ وَضْعِيَّةَ بَطَلٍ قَوِيٍّ وَاطْلُبْ مِنْ بابا صورَةً! 📸'],
  ['😜', 'وَجْهٌ مُضْحِكٌ!', 'اعْمَلْ أَضْحَكَ وَجْهٍ عِنْدَكَ لِماما… مَنْ يَضْحَكُ أَوَّلاً؟'],
  ['🧱', 'بِناءٌ سَريعٌ!', 'اِبْنِ بُرْجاً مِنْ ١٠ قِطَعٍ أَوْ كُتُبٍ في أَقَلَّ مِنْ دَقيقَةٍ!'],
  ['🎤', 'إيموتُ الْغِناءِ!', 'غَنِّ أُغْنِيَتَكَ الْمُفَضَّلَةَ بِصَوْتٍ عالٍ! 🎵'],
  ['🐢', 'مَشْيُ السُّلَحْفاةِ!', 'امْشِ مِنْ أَوَّلِ الْغُرْفَةِ إِلى آخِرِها بِبُطْءِ السُّلَحْفاةِ 🐢'],
  ['🙌', 'تَصْفيقَةُ الْأَبْطالِ!', 'صَفِّقْ لِنَفْسِكَ ١٠ مَرّاتٍ… أَنْتَ تَسْتَحِقُّ! 👏'],
  ['🖍️', 'رَسْمَةٌ سَريعَةٌ!', 'اُرْسُمْ باصاً طائِراً في دَقيقَةٍ واحِدَةٍ وَأَرِها لِبابا! 🚌'],
];
let demoDrop = '';
function renderDrop(g) {
  const done = (g[today()] || []).some(e => e.c !== 'parent'), opened = (DEMO != null ? demoDrop : lget(DROP, '')) === today();
  const box = $('#drop'); box.classList.toggle('ready', done && !opened); box.classList.toggle('locked', !done && !opened); box.classList.toggle('opened', opened);
  if (opened) { $('#drop-h').textContent = 'فَتَحْتَ إِسْقاطَ الْيَوْمِ ✓'; $('#drop-p').textContent = 'صُنْدوقٌ جَديدٌ يَنْزِلُ غَداً بَعْدَ أَوَّلِ مُهِمَّةٍ! 🪂'; }
  else if (done) { $('#drop-h').textContent = 'وَصَلَ إِسْقاطُ الْيَوْمِ!'; $('#drop-p').textContent = 'صُنْدوقٌ نَزَلَ مِنَ السَّماءِ… ماذا في داخِلِهِ؟ 👀'; }
  else { $('#drop-h').textContent = 'صُنْدوقٌ يَنْتَظِرُ في السَّماءِ…'; $('#drop-p').textContent = 'أَنْجِزْ أَوَّلَ مُهِمَّةٍ الْيَوْمَ لِيَنْزِلَ الصُّنْدوقُ وَتَفْتَحَهُ! 🔒'; }
}
function openDrop() {
  if (!$('#drop').classList.contains('ready')) { sfx.tap(); return; }
  if (DEMO != null) demoDrop = today(); else lset(DROP, today());
  sfx.chest();
  const [ic, t, msg] = pick(DROPS);
  celebrate(t, 0, msg, null, 'drop', ic);
  render();
}
$('#crate').addEventListener('click', openDrop);
$('#drop-btn').addEventListener('click', openDrop);

/* ---------- سؤال بابا ---------- */
let gateUntil = +sessionStorage.getItem('heroes-gate') || 0;
function gate() {
  return new Promise(res => {
    if (S.gate === '0' || DEMO != null || Date.now() < gateUntil) return res(true);
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4); let v = '';
    $('#gq').textContent = `${a} × ${b} = ?`; $('#gin').textContent = '';
    $('#pad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<button class="${k === '✓' ? 'ok' : ''}" data-k="${k}">${k}</button>`).join('');
    const done = ok => { $('#gate').classList.remove('on'); $('#pad').onclick = null; $('#g-cancel').onclick = null; res(ok); };
    $('#pad').onclick = ev => {
      const k = ev.target.dataset.k; if (k == null) return; sfx.tap();
      if (k === '⌫') v = v.slice(0, -1); else if (k === '✓') {
        if (+v === a * b) { gateUntil = Date.now() + 10 * 60e3; try { sessionStorage.setItem('heroes-gate', gateUntil); } catch (e) {} return done(true); }
        sfx.bad(); const el = $('#gin'); el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); v = '';
      } else if (v.length < 3) v += k;
      $('#gin').textContent = v;
    };
    $('#g-cancel').onclick = () => done(false);
    $('#gate').classList.add('on');
  });
}

/* ---------- شريط الأحداث ---------- */
function feed(html, c) {
  const f = $('#feed'), d = document.createElement('div'); d.className = 'fd'; d.style.setProperty('--c', c || 'var(--t1)'); d.innerHTML = html;
  f.prepend(d); while (f.children.length > 3) f.lastChild.remove();
  setTimeout(() => d.remove(), 4600);
}

/* ---------- التسجيل والاحتفال ---------- */
async function award(e) {
  if (!started()) {   // قبل السبت: الصفحة تُعرض والمهمات تُجرَّب، ولا تُسجَّل نقاط
    sfx.bad(); closeSheet();
    celebrate('اصْبِرْ يا بَطَل!', 0, `الْباصُ يَنْطَلِقُ يَوْمَ ${new Date(...S.start.split('-').map((x, i) => i === 1 ? x - 1 : +x)).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })} — وَقْتَها تُحْسَبُ النِّقاطُ 🚌`, null, 'bad');
    return false;
  }
  if (!(await gate())) return false;
  const G = goal(), before = totals().total, k0 = F.tierOf(before, G);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  S.log = S.log || {}; S.log[id] = Object.assign({ d: today(), t: Date.now() }, e);
  save(); closeSheet();
  const after = totals().total, k1 = F.tierOf(after, G), list = byDay()[today()] || [];
  const dayFull = dayTotal(list).full && !dayTotal(list.filter(x => x.id !== id)).full;
  const lvUp = level(after) > level(before) ? level(after) : 0, m = M[e.c];
  feed(e.c === 'parent' ? `${e.p < 0 ? '⚠️' : '🎁'} بابا وَماما <b>${PL(e.p)}</b>` : `${m.ic} إيليا ${e.c === 'pray' ? 'صَلّى' : 'أَنْجَزَ'} «${e.c === 'pray' ? PRAYERS[e.k][1] : m.name}» <b>${PL(e.p)}</b>`, e.c === 'parent' ? (e.p < 0 ? '#ff3b4e' : '#ffe14d') : m.c);
  if (lvUp) setTimeout(() => feed(`⬆️ الْمُسْتَوى <b>${AR(lvUp)}</b>!`, '#ff4fa3'), 500);
  if (k1 > k0 && PREVIEW == null) {   // نُدرةٌ جديدة: المشهد الكبير بدل الاحتفال العادي، والصفحة تتلوّن خلفه
    tierNow = k1; cinematic(k1, `${PL(e.p)} · ${e.c === 'parent' ? 'بونَصُ بابا وَماما' : cheer(e)}`); render(); return true;
  }
  const words = ['بوم!', 'واو!', 'خارِق!', 'أُسْطورَة!', 'إِصابَةٌ مُباشِرَة!', 'بِناءٌ سَريع!', 'هَبْطَةٌ مِثالِيَّة!'];
  if (e.c === 'parent') celebrate(e.p < 0 ? 'خَصْم!' : 'بونَص!', e.p, e.n || (e.p < 0 ? 'بابا وَماما خَصَموا نِقاطاً — الْبَطَلُ يَلْتَزِمُ الْمَرَّةَ الْقادِمَةَ 💪' : 'بابا وَماما فَخورانِ بِكَ! 🌟'), null, e.p < 0 ? 'bad' : 'win', null, lvUp);
  else if (dayFull) celebrate('#١ نَصْر!', e.p + DAILY_BONUS, `${AR(DAILY_NEED)} مُهِمّاتٍ مُخْتَلِفَةٍ الْيَوْمَ! ${PL(DAILY_BONUS)} مُكافَأَة 👑`, null, 'gold', null, lvUp);
  else if (e.c === 'pray') celebrate('تَقَبَّلَ الله', e.p, cheer(e), null, 'calm', null, lvUp);
  else celebrate(e.r ? 'رَقْمٌ قِياسِيّ!' : pick(words), e.p, cheer(e), null, 'win', null, lvUp);
  render();
  return true;
}
function cheer(e) {
  const L = {
    pray: 'صَلاتُكَ نورٌ يا إيليا ✨🤲', art: 'فَنّانٌ أُسْطورِيٌّ! لَوْحَتُكَ رائِعَةٌ 🎨', swim: 'غَطْسَةٌ أُسْطورِيَّةٌ في الْبُحَيْرَةِ! 🌊', tidy: 'بَنَيْتَ قَلْعَتَكَ بِسُرْعَةِ الْبَرْقِ! 🧱',
    study: 'فَتَحْتَ صُنْدوقَ كَنْزٍ: عَقْلُكَ يَزْدادُ قُوَّةً! 📦', morning: 'هَبْطَةٌ مِثالِيَّةٌ مِنَ الْباصِ! جاهِزٌ لِلْمَدْرَسَةِ 🪂',
    eat: 'الصِّحَّةُ وَالدِّرْعُ مَشْحونانِ ١٠٠٪! 🛡️', sleep: 'نَجَوْتَ مِنَ الْعاصِفَةِ! نَمْ يا بَطَلُ 🌙' };
  return L[e.c] || (M[e.c] ? M[e.c].name : '');
}
function celebrate(word, pts, msg, gemK, kind, emoji, lvUp) {
  $('#b-word').textContent = word; $('#b-pts').textContent = pts ? `${PL(pts)}` : ''; $('#b-msg').textContent = msg || '';
  $('#b-lvl').textContent = lvUp ? `⬆️ الْمُسْتَوى ${AR(lvUp)}!` : '';
  $('#b-gem').innerHTML = gemK != null ? F.tile(gemK) : emoji ? `<span style="font-size:110px;display:inline-block;animation:glow 1s ease-in-out infinite">${emoji}</span>` : '';
  const box = $('#boom'); box.querySelectorAll('.spark').forEach(x => x.remove());
  const dc = $('#b-dancer'); dc.style.animation = 'none'; void dc.offsetWidth; dc.style.animation = '';
  const T = TIERS[Math.max(0, tierNow)], cols = kind === 'calm' ? ['#fff7dc', '#ffe9a8', '#ffd36b', '#ffffff'] : [T.t1, T.glow, '#ffe14d', '#ff4fa3', '#4fcbff', '#7dffb2', '#fff'];
  if (kind !== 'bad') for (let i = 0; i < (kind === 'calm' ? 28 : 56); i++) {
    const s = document.createElement('i'); s.className = 'spark' + (i % 3 && kind !== 'calm' ? '' : ' b'); const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 560;
    s.style.cssText = `left:50%;top:50%;--c:${cols[i % cols.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;animation-delay:${Math.random() * .25}s${kind === 'calm' ? ';animation-duration:2.6s' : ''}`;
    box.appendChild(s);
  }
  box.classList.toggle('neg', kind === 'bad');
  box.classList.toggle('gold', kind === 'gold' || kind === 'drop');
  box.classList.toggle('calm', kind === 'calm');
  box.classList.add('on');
  if (kind === 'gold') sfx.stone(); else if (kind === 'bad') sfx.bad(); else if (kind === 'win') sfx.win(); else if (kind === 'calm') sfx.calm();
  if (lvUp) setTimeout(sfx.level, 700);
  if (kind === 'win' || kind === 'gold') setTimeout(() => voice(kind === 'gold' ? 'won' : null), 450);
  clearTimeout(celebrate.t); celebrate.t = setTimeout(() => box.classList.remove('on'), kind === 'gold' || kind === 'drop' || kind === 'calm' ? 4600 : kind === 'bad' ? 3400 : 3000);
}
$('#boom').addEventListener('click', () => $('#boom').classList.remove('on'));

/* إيليا يقفز قفزةً دوّارة عند لمسه، وتتطاير شرارات بلون نُدرته */
$('#char').addEventListener('click', () => {
  const c = $('#char'), st = c.parentElement; c.classList.remove('emote'); void c.offsetWidth; c.classList.add('emote');
  whoosh(.5, 500, 3000, .12); tone([[523, .05, .08, 'square', .04], [784, .13, .08, 'square', .04], [1047, .21, .16, 'square', .04]]);
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('i'), a = Math.PI + Math.random() * Math.PI, r = 70 + Math.random() * 110;
    p.className = 'puff'; p.style.setProperty('--x', Math.cos(a) * r + 'px'); p.style.setProperty('--y', Math.sin(a) * r * .6 + 'px');
    st.appendChild(p); setTimeout(() => p.remove(), 900);
  }
});
/* ميلٌ ثلاثيّ الأبعاد لبطاقات المهمات مع الفأرة */
$('#missions').addEventListener('pointermove', e => {
  const q = e.target.closest('.q'); if (!q || e.pointerType === 'touch') return;
  const r = q.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  q.style.setProperty('--ry', (x * 16).toFixed(1) + 'deg'); q.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
});
$('#missions').addEventListener('pointerout', e => { const q = e.target.closest('.q'); if (q && !q.contains(e.relatedTarget)) { q.style.removeProperty('--rx'); q.style.removeProperty('--ry'); } });

/* ---------- شاشة المهمة ---------- */
let tick = 0;
function openSheet(c) {
  const m = M[c], card = $('#sheet .sheet-card');
  card.style.setProperty('--ac', m.c1); card.style.setProperty('--ac2', m.c);
  $('#sh-img').src = `img/${c}.webp`; $('#sh-hero').textContent = `${m.ic} ${m.hero}`;
  $('#sh-title').textContent = m.name; $('#sh-rule').textContent = m.rule;
  ({ timer: uiTimer, morning: uiSteps, sleep: uiSteps, study: uiStudy, art: uiArt, eat: uiEat, pray: uiPray })[m.kind](c);
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
    $('#arc').style.stroke = m.zone ? (s < m.zone[0] ? m.c : s <= m.zone[1] ? '#21b25b' : '#ff3b4e') : s > m.full ? '#ff3b4e' : k > .7 ? '#ffa320' : m.c;
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

/* خطوات بمؤقّت — الصباح: استيقظت ← فرّشت ← لبست · النوم: حان الوقت ← فرّشت ← الحمام ← الفراش */
function uiSteps(c) {
  const done = (byDay()[today()] || []).some(e => e.c === c);
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
    const cyc = c === 'morning' && (byDay()[ydayOf(today())] || []).some(e => e.c === 'sleep');   // صباحٌ بعد ليلةٍ سُجِّل فيها النوم
    const p = 60 + mornBonus(s) + (rec ? 20 : 0) + (cyc ? CYCLE : 0);
    $('#sh-ui').innerHTML = `<div class="result"><div class="big">${PL(p)}</div>${rec ? `<span class="recflag">🏅 رَقْمٌ قِياسِيٌّ جَديد! ⁦+٢٠⁩</span>` : ''}${cyc ? `<span class="recflag">🌙☀️ نِمْتَ وَاسْتَيْقَظْتَ كَالْأَبْطالِ ${PL(CYCLE)}</span>` : ''}
      <p>${c === 'sleep' ? 'دَخَلْتَ الدّائِرَةَ الْآمِنَةَ' : 'هَبَطْتَ جاهِزاً'} في ${mins(s)} — الْخُطُواتُ ٦٠ + السُّرْعَةُ ${AR(mornBonus(s))}</p></div>
      <div class="btns"><button class="btn green" id="ok">⭐ سَجِّلِ النِّقاطَ</button><button class="btn dark" id="again">إِعادَة</button></div>`;
    $('#ok').onclick = () => award(Object.assign({ c, s, p, r: rec ? 1 : 0 }, cyc ? { x: 1 } : {}));
    $('#again').onclick = () => { run = null; draw(); };
  };
  draw();
}

/* الدراسة والفن: يختار نوع الإنجاز ويكتبه */
function uiPick(c, LIST, okTxt, ph) {
  let pk = 0;
  $('#sh-ui').innerHTML = `<div class="opts">${LIST.map(([ic, t, p], i) => `<button class="opt ${i ? '' : 'on'}" data-i="${i}"><i>${ic}</i>${t}<small>${PL(p || 25)}</small></button>`).join('')}</div>
    <label class="lbl" for="sn">✍️ اكْتُبْ إِنْجازَكَ:</label><input class="note" id="sn" maxlength="80" placeholder="${ph}">
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">${okTxt}</button></div>`;
  const upd = () => { $('#pv').innerHTML = `النِّقاطُ: <b>${PL(LIST[pk][2] || 25)}</b>`; };
  $('#sh-ui').querySelectorAll('.opt').forEach(b => b.onclick = () => { pk = +b.dataset.i; $('#sh-ui').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === b)); sfx.tap(); upd(); });
  $('#ok').onclick = () => { const [, t, p] = LIST[pk], note = $('#sn').value.trim(); award({ c, p: p || 25, n: (t + (note ? ' — ' + note : '')) }); };
  upd();
}
const uiStudy = c => uiPick(c, STUDY, '📦 افْتَحِ الصُّنْدوقَ وَسَجِّلْ', 'مَثَلاً: حَلَلْتُ واجِبَ الرِّياضِيّاتِ صَفْحَة ٢٠');
const uiArt = c => uiPick(c, ART, '🎨 سَجِّلْ عَمَلَكَ الْفَنِّيَّ', 'مَثَلاً: رَسَمْتُ باصاً طائِراً بِالْأَلْوانِ الْمائِيَّةِ');

/* الصلاة: الصلوات الخمس، كلٌّ منها مرةً في اليوم، والجماعة تزيد ١٠ */
function uiPray(c) {
  const h = new Date().getHours(), done = new Set((byDay()[today()] || []).filter(e => e.c === c).map(e => e.k));
  let pr = h < 10 ? 0 : h < 14 ? 1 : h < 17 ? 2 : h < 19 ? 3 : 4, jam = false;
  if (done.has(pr)) { const f = [0, 1, 2, 3, 4].find(i => !done.has(i)); if (f != null) pr = f; }
  $('#sh-ui').innerHTML = `<div class="opts" id="prs">${PRAYERS.map(([ic, t], i) => `<button class="opt" data-i="${i}"><i>${ic}</i>${t}<small>${done.has(i) ? '✓ صَلَّيْتَها' : '⁦+٢٠⁩'}</small></button>`).join('')}</div>
    <button class="tog" id="jam"><span class="bx"></span>🕌 صَلَّيْتُ جَماعَةً أَوْ في الْمَسْجِدِ (⁦+١٠⁩)</button>
    <p class="warn" id="dup" hidden>سَجَّلْتَ هذِهِ الصَّلاةَ الْيَوْمَ — تَقَبَّلَ اللهُ مِنْكَ 🤲</p>
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">🤲 سَجِّلِ الصَّلاةَ</button></div>`;
  const upd = () => {
    $('#prs').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', +x.dataset.i === pr));
    $('#jam').classList.toggle('on', jam); $('#jam .bx').textContent = jam ? '✓' : '';
    const dup = done.has(pr); $('#dup').hidden = !dup; $('#ok').disabled = dup;
    $('#pv').innerHTML = `النِّقاطُ: <b>${PL(20 + (jam ? 10 : 0))}</b>`;
  };
  $('#prs').onclick = e => { const b = e.target.closest('.opt'); if (b) { pr = +b.dataset.i; sfx.tap(); upd(); } };
  $('#jam').onclick = () => { jam = !jam; sfx.tap(); upd(); };
  $('#ok').onclick = () => award({ c, k: pr, p: 20 + (jam ? 10 : 0), n: `صَلاةُ ${PRAYERS[pr][1]}${jam ? ' جَماعَةً 🕌' : ''}` });
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
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">🛡️ اشْحَنِ الدِّرْعَ وَسَجِّلْ</button></div>`;
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
$('#missions').addEventListener('click', e => { const b = e.target.closest('.q'); if (b) openSheet(b.dataset.c); });
$('#log').addEventListener('click', async e => {
  const b = e.target.closest('.del'); if (!b) return;
  if (!confirm('حَذْفُ هذا الْإِنْجازِ وَنِقاطِهِ؟')) return;
  if (!(await gate())) return;
  S.del = S.del || {}; S.del[b.dataset.id] = 1; save(); render();
});
$('#parents').addEventListener('click', e => {   // بونص بابا وماما وخصمهم: ٥٠ أو ١٠٠ فقط، بعد سؤال الضرب
  const b = e.target.closest('[data-p]'); if (!b) return;
  const p = +b.dataset.p; if (!PARENT.includes(Math.abs(p))) return;
  sfx.tap(); const why = $('#pr-why').value.trim();
  award({ c: 'parent', p, n: why }).then(ok => { if (ok) $('#pr-why').value = ''; });
});
function howHTML() {
  return `<ul>
  <li>🤲 نورُ الصَّلاة: كُلُّ صَلاةٍ = ٢٠، وَجَماعَةً أَوْ في الْمَسْجِد ⁦+١٠⁩ — كُلُّ صَلاةٍ مَرَّةً في الْيَوْم.</li>
  <li>🪂 الْقَفْزُ مِنَ الْباص (الصَّباح): ٣ خُطُواتٍ × ٢٠ + سُرْعَة (١٠ د = ٤٠، ١٥ د = ٢٥، ٢٠ د = ١٠) — مَرَّةً في الْيَوْم.</li>
  <li>📦 صُنْدوقُ الْكَنْز (الدِّراسَة): ٢٥ لِكُلِّ إِنْجاز، وَ٥٠ لِلدَّرَجَةِ الْكامِلَة.</li>
  <li>🎨 اسْتوديو الْأَلْوان (الرَّسْمُ وَالْفَنّ): ٢٥ لِكُلِّ عَمَلٍ فَنِّيّ، وَ٥٠ لِلتُّحْفَةِ الَّتي يَخْتارُها بابا أَوْ ماما.</li>
  <li>🧱 بِناءُ الْقَلْعَة (التَّرْتيب): ٥ د أَوْ أَقَلّ = ١٠٠، وَتَنْزِلُ حَتّى ٣٠ عِنْدَ ٢٠ د، وَبَعْدَها ١٥.</li>
  <li>🛡️ شَحْنُ الدِّرْع (الْأَكْل): ٣٠ لِلصَّحْنِ كامِلاً، ١٥ لِأَغْلَبِه، ⁦+١٠⁩ لِلْخُضار — كُلُّ وَجْبَةٍ مَرَّة.</li>
  <li>🌊 غَطْسَةُ الْبُحَيْرَة (السِّباحَة): بَيْنَ ٨ وَ١٢ دَقيقَة = ١٠٠، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠.</li>
  <li>🌀 الْهُروبُ مِنَ الْعاصِفَة (النَّوْم): فِرْشاة + حَمّام + فِراش × ٢٠ + سُرْعَة — مَرَّةً في الْيَوْم.</li>
  <li>🌙☀️ صَباحٌ بَعْدَ لَيْلَةٍ سُجِّلَ فيها النَّوْم: ${PL(CYCLE)} عَلى الْقَفْزِ مِنَ الْباص.</li>
  <li>🏅 كَسْرُ الرَّقْمِ الْقِياسِيِّ بِالْمُؤَقِّت (التَّرْتيبُ وَالصَّباحُ وَالنَّوْم): ⁦+٢٠⁩.</li>
  <li>👑 نَصْرُ الْيَوْم: ${AR(DAILY_NEED)} مُهِمّاتٍ مُخْتَلِفَةٍ مِنَ الثَّماني في يَوْمٍ واحِد = ${PL(DAILY_BONUS)}.</li>
  <li>⚖️ بونَصُ بابا وَماما أَوْ خَصْمُهُما: ٥٠ أَوْ ١٠٠ فَقَط.</li>
  <li>⬆️ كُلُّ ${AR(LVL)} نُقْطَة مُسْتَوىً جَديد، وَالصِّحَّةُ ثُمَّ الدِّرْعُ يَمْتَلِئانِ بِنِقاطِ الْيَوْمِ.</li>
  <li>🎨 عِنْدَ كُلِّ نُدْرَةٍ تَتَلَوَّنُ اللُّعْبَةُ كُلُّها بِلَوْنِها وَيَتَحَوَّلُ عالَمُ الْخَريطَةِ إِلى شَكْلٍ جَديد.</li>
  <li>🎁 إِسْقاطُ الْيَوْم: يَنْزِلُ بَعْدَ أَوَّلِ مُهِمَّةٍ، فيهِ تَحَدٍّ مُضْحِكٌ بِلا نِقاط.</li>
  <li>🎯 مَعَ الْمُهِمّاتِ الثَّماني يَوْمٌ جَيِّدٌ ≈ ٥٥٠–٦٥٠ نُقْطَة، فَالْهَدَفُ ${AR(goal())} يَحْتاجُ نَحْوَ ${AR(Math.ceil(goal() / DAYS))} يَوْمِيّاً.</li></ul>`;
}
$('#settings-btn').onclick = async () => {
  if (!(await gate())) return;
  $('#st-start').value = S.start; $('#st-goal').value = goal(); $('#st-prize').value = S.prize || ''; $('#st-gate').checked = S.gate !== '0'; $('#how').innerHTML = howHTML();
  $('#th-row').innerHTML = TIERS.map((T, i) => `<button data-k="${i}" title="${T.n} — ${T.w}">${F.tile(i)}</button>`).join('');
  $('#settings').classList.add('on');
};
$('#th-row').addEventListener('click', e => {   // معاينة ثيمةٍ ومشهدها دون أي تغيير في الحالة
  const b = e.target.closest('[data-k]'); if (!b) return;
  const k = +b.dataset.k; $('#settings').classList.remove('on'); sfx.stone();
  F.tierUp(k, { kick: '👀 مُعايَنَة', msg: 'هكَذا تَبْدو اللُّعْبَةُ عِنْدَما يَصِلُ إيليا إِلى هذِهِ النُّدْرَة', btn: 'رُجوع', onClose: () => F.applyTheme(tierNow) });
});
$('#st-x').onclick = () => $('#settings').classList.remove('on');
$('#st-save').onclick = () => {
  const st = $('#st-start').value, g = Math.round(+$('#st-goal').value / 50) * 50;
  if (/^\d{4}-\d\d-\d\d$/.test(st)) S.start = st;
  if (g >= 1000) S.goal = String(g);
  S.prize = $('#st-prize').value.trim().slice(0, 40);
  S.gate = $('#st-gate').checked ? '1' : '0'; S.sat = Date.now();
  save(); $('#settings').classList.remove('on'); render();
};
$('#st-reset').onclick = () => {
  if (!confirm('سَيُمْسَحُ سِجِلُّ هذا الْمَوْسِمِ كُلُّهُ وَيَبْدَأُ مَوْسِمٌ جَديدٌ مِنَ الْيَوْمِ. مُتَأَكِّد؟')) return;
  const g = S.goal, gt = S.gate, pr = S.prize; S = Object.assign(F.fresh(), { goal: g, gate: gt, prize: pr, rst: Date.now(), rby: 1, sat: Date.now() }); save();   // التصفير الوحيد المعتمد
  localStorage.removeItem(RUN);
  $('#settings').classList.remove('on'); render();
};
// المزامنة
if (window.EliaSave && DEMO == null) {
  EliaSave.on(KEY, st => { if (st && st.start) { const s2 = F.season(st); S = s2; if (s2 !== st) save(); render(); } });
  EliaSave.onState(s => { $('#sync').textContent = { sync: '☁️ يُزامِنُ…', ok: '☁️ مَحْفوظٌ في السَّحابَة', err: '⚠️ لَمْ تَتِمَّ الْمُزامَنَة', off: '📴 بِلا إِنْتَرْنِت — مَحْفوظٌ عَلى الْجِهاز', idle: '' }[s] || ''; });
}
if (!LIVE) $('#demo').hidden = false;
F.boot();
$('#missions').classList.add('intro'); $('#track').classList.add('intro');
const pending = lget(RUN, null);
render();
if (pending && M[pending.c]) setTimeout(() => openSheet(pending.c), 400);   // استئناف مؤقّتٍ كان يعمل
let lastDay = today();
setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60e3);   // يومٌ جديد والصفحة مفتوحة

window.__heroes = { get S() { return S; }, award, render, totals, celebrate, cinematic };
})();
