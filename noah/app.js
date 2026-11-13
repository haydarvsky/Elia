/* تحدّي النجوم — الموسم ٢ لنوح: ستّ مهماتٍ مع نجوم الكرة، سبع رتبٍ تتلوّن بها اللعبة، والجائزة كرة نهائي كأس العالم ٢٠٢٦ الذهبية
   (على نمط إيليافسكي في abtal/ — الموسم ١ كان PS5، في تاريخ git)
   هذا الملف: المهمات ومؤقّتاتها والاحتفالات والسجل. الثيمات والجزيئات وحساب النقاط في stad.js.
   الحفظ في وثيقة elia_saves/mohammed بمفتاحٍ مستقل noah-heroes-v1 (القواعد لا تسمح إلا بـelia|mohammed|test):
   { start:'YYYY-MM-DD', goal:'12000', gate:'1'|'0', sat, log:{id:{c,p,d,t,s,n,m,r,k,x}}, del:{id:1}, rst, rby }
   rst+rby يُختمان بأمر وليّ الأمر «تصفير» فقط، وsat وقت آخر تعديلٍ للإعدادات — فجهازٌ جديدٌ لا يمسح السحابة.
   السجل كائنٌ بمعرّفات والحذف شاهدةٌ في del — لأن دمج save.js يأخذ اتحاد المفاتيح.
   ?demo=4500 يعرض اللعبة بنقاطٍ تجريبية ولا يحفظ شيئاً، و?theme=3 يعرض ثيمة رتبةٍ بعينها. */
(() => {
'use strict';
const F = window.Fort;
const { KEY, TIERS, DAILY_BONUS, DAILY_NEED, DAYS, AR, PL, $, lget, lset, today, dnum, ymd, pad2 } = F;
const ORDER = F.MISSIONS, RUN = 'noah-heroes-run', PACK = 'noah-stad-pack', CYCLE = 20, LVL = 250, HP = 250;
const PARENT = [50, 100];   // بونص بابا وماما أو خصمهم: هاتان القيمتان فقط
const DEMO = F.num('demo'), PREVIEW = F.num('theme') != null ? Math.max(0, Math.min(6, Math.round(F.num('theme')))) : null;
const LIVE = DEMO == null && PREVIEW == null;
const mmss = s => `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}`.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const mins = s => s < 60 ? `${AR(s)} ثانية` : `${AR(Math.floor(s / 60))} د ${s % 60 ? AR(s % 60) + ' ث' : ''}`.trim();
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- المهمات: كل مهمةٍ مع نجم ---------- */
const swimPts = s => s >= 480 && s <= 720 ? 100 : 50;   // بين ٨ و١٢ دقيقة = كاملة، وغير ذلك نصفها
const tidyPts = s => s <= 300 ? 100 : s <= 1200 ? Math.round(100 - (s - 300) / 900 * 70) : 15;
const mornBonus = s => s <= 600 ? 40 : s <= 900 ? 25 : s <= 1200 ? 10 : 0;
const ydayOf = d => { const [y, m, dd] = d.split('-').map(Number); return ymd(new Date(y, m - 1, dd - 1)); };

const M = {
  morning: { hero: 'نيمار', ic: '☀️', name: 'صَباحُ نيمار', task: 'تَحَدّي الِاسْتِيقاظِ', c: '#009739', c1: '#fff07a', kind: 'morning',
             rule: 'صافِرَةُ الصَّباحِ! اِسْتَيْقِظْ ← فَرِّشْ أَسْنانَكَ ← اِلْبَسْ مَلابِسَ الْمَدْرَسَةِ. كُلُّ خُطْوَةٍ ٢٠، وَإِنْ جَهَزْتَ خِلالَ ١٠ دَقائِقَ فَلَكَ ٤٠ إِضافِيَّة.' },
  study: { hero: 'لامين يامال', ic: '📚', name: 'واجِباتُ يامال', task: 'الدِّراسَةُ وَالْواجِباتُ', c: '#d1121f', c1: '#ffe08a', kind: 'study',
           rule: 'حَتّى النُّجومُ يَدْرُسونَ! كُلُّ إِنْجازٍ دِراسِيٍّ = ٢٥ نُقْطَة، وَالدَّرَجَةُ الْكامِلَةُ هاتْريك = ٥٠. بِلا تَوْقيتٍ.' },
  tidy:  { hero: 'مبابي', ic: '⚡', name: 'سُرْعَةُ مبابي', task: 'تَرْتيبُ الْأَلْعابِ وَالْغُرْفَةِ', c: '#1d3f9e', c1: '#cfdcff', kind: 'timer', full: 1200, fn: tidyPts,
           rule: 'رَتِّبْ أَلْعابَكَ وَغُرْفَتَكَ بِسُرْعَةِ مبابي في الْهُجومِ الْمُعاكِسِ: ٥ دَقائِقَ أَوْ أَقَلَّ = ١٠٠ نُقْطَة.' },
  eat:   { hero: 'هالاند', ic: '💪', name: 'قُوَّةُ هالاند', task: 'تَحَدّي الْأَكْلِ', c: '#3b93d0', c1: '#d6ecff', kind: 'eat',
           rule: 'الْأَكْلُ يَشْحَنُ لِياقَتَكَ: كُلُّ وَجْبَةٍ تُكْمِلُها = ٣٠ نُقْطَة، وَالْخُضارُ وَالْفاكِهَةُ تَزيدُكَ ١٠. هالاند يَأْكُلُ جَيِّداً لِيَصيرَ أَقْوى هَدّافٍ!' },
  swim:  { hero: 'رونالدو', ic: '🏊', name: 'مَسْبَحُ رونالدو', task: 'تَحَدّي السِّباحَةِ', c: '#b0122a', c1: '#c6efcf', kind: 'timer', full: 720, zone: [480, 720], noRec: true, fn: swimPts,
           rule: 'اُخْرُجْ مِنَ السِّباحَةِ في نَحْوِ ١٠ دَقائِقَ: بَيْنَ ٨ وَ١٢ دَقيقَةً = ١٠٠ نُقْطَة، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠ نُقْطَة.' },
  sleep: { hero: 'ميسي', ic: '🌙', name: 'لَيْلَةُ ميسي', task: 'الِاسْتِعْدادُ لِلنَّوْمِ', c: '#3f78c4', c1: '#dff0ff', kind: 'sleep',
           rule: 'صافِرَةُ نِهايَةِ الْمُباراةِ! فَرِّشْ أَسْنانَكَ ← اُدْخُلِ الْحَمّامَ ← إِلى الْفِراشِ. كُلُّ خُطْوَةٍ ٢٠، وَخِلالَ ١٠ دَقائِقَ ٤٠ إِضافِيَّة. وَإِنْ نَجَحْتَ صَباحاً في صَباحِ نيمار فَلَكَ ٢٠ مُكافَأَةُ النَّوْمِ وَالِاسْتِيقاظ.' },
};
const STEPS = {
  morning: [['⏰', 'اسْتَيْقَظْتُ!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['👕', 'لَبِسْتُ مَلابِسَ الْمَدْرَسَةِ']],
  sleep: [['🌙', 'صافِرَةُ النِّهايَةِ!'], ['🪥', 'فَرَّشْتُ أَسْناني'], ['🚽', 'دَخَلْتُ الْحَمّامَ'], ['🛏️', 'في فِراشي وَالنّورُ مُطْفَأ']],
};
const TOK = { morning: 'صَباحَ نيمار', sleep: 'لَيْلَةَ ميسي' };
const STUDY = [['📝', 'حَلَلْتُ واجِبي'], ['📖', 'قَرَأْتُ دَرْساً'], ['🧠', 'حَفِظْتُ'], ['✍️', 'كَتَبْتُ بِخَطٍّ جَميلٍ'], ['🔁', 'راجَعْتُ لِلِاخْتِبارِ'], ['🏅', 'دَرَجَةٌ كامِلَةٌ', 50]];
const MEALS = [['🍳', 'الْفُطور'], ['🍛', 'الْغَداء'], ['🍲', 'الْعَشاء'], ['🍎', 'وَجْبَةٌ خَفيفَةٌ']];

/* ---------- الحالة ---------- */
let S;
if (DEMO != null) {   // معاينة: حالةٌ في الذاكرة فقط
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
function streak(g) {
  let d = dnum(today()); if (!g[today()]) d--;
  let n = 0; const has = new Set(Object.keys(g).map(dnum));
  while (has.has(d)) { n++; d--; }
  return n;
}
const level = t => Math.floor(Math.max(0, t) / LVL) + 1;
const startTxt = () => new Date(...S.start.split('-').map((x, i) => i === 1 ? x - 1 : +x)).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

/* ---------- الصوت: صافرة، ركلة، هتاف الجمهور (بلا ملفات) ---------- */
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
function noise(dur, from, to, v, type = 'bandpass', q = 1.2) {
  try {
    const a = ac(), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    s.buffer = b; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.35, dur * .3)); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(t);
  } catch (e) {}
}
const crowd = big => { noise(big ? 3.4 : 2.3, 700, 1100, big ? .28 : .19, 'bandpass', .55); };   // هتاف الجمهور
const sfx = {
  tap: () => tone([[700, 0, .07, 'triangle', .06]]),
  whistle: () => tone([[2900, 0, .14, 'sine', .07, 3100], [2900, .2, .55, 'sine', .07, 3050]]),
  kick: () => { tone([[140, 0, .14, 'sine', .22, 50]]); noise(.12, 1800, 600, .12, 'lowpass', .7); },
  win: () => tone([[523, 0, .12], [659, .1, .12], [784, .2, .12], [1047, .3, .45, 'sawtooth', .06], [1319, .3, .45, 'triangle', .05]]),
  rank: () => tone([[392, 0, .25, 'sawtooth', .05], [523, .18, .25, 'sawtooth', .05], [659, .36, .25, 'sawtooth', .05], [784, .54, .8, 'sawtooth', .06], [1568, .54, .8, 'triangle', .05], [2093, .9, .5, 'sine', .04]]),
  level: () => tone([[880, 0, .09, 'square', .05], [1175, .08, .09, 'square', .05], [1760, .16, .35, 'square', .05, 2640]]),
  pack: () => { noise(.7, 3000, 500, .12); tone([[1047, .3, .1, 'triangle', .06], [1319, .38, .1, 'triangle', .06], [1568, .46, .1, 'triangle', .06], [2093, .54, .6, 'triangle', .06], [2637, .62, .6, 'sine', .04]]); },
  bad: () => tone([[200, 0, .2, 'sawtooth', .06], [150, .15, .3, 'sawtooth', .06]]),
  tick: () => tone([[1400, 0, .04, 'square', .03]]),
};

/* ---------- الثيمة تتبع الرتبة ---------- */
let tierNow = -1;
function cinematic(k, msg) {
  sfx.rank(); noise(1.1, 200, 3200, .18); setTimeout(() => crowd(true), 900);
  F.tierUp(k, { msg: msg || (k === 6 ? '🏆 صِرْتَ بَطَلَ الْعالَمِ — الْكُرَةُ الذَّهَبِيَّةُ صارَتْ لَكَ!' : 'الْمَلْعَبُ كُلُّهُ تَلَوَّنَ بِلَوْنِ رُتْبَتِكَ الْجَديدَةِ ✨') });
  if (LIVE) lset(F.SEEN, k);
}
function syncTier(total) {
  const k = PREVIEW != null ? PREVIEW : F.tierOf(total, goal());
  if (k === tierNow) return;
  const prev = tierNow; tierNow = k;
  if (prev === -1) {
    const seen = LIVE ? lget(F.SEEN, null) : k;
    if (seen == null || seen >= k) { F.applyTheme(k); if (LIVE) lset(F.SEEN, k); return; }
    F.applyTheme(seen); setTimeout(() => cinematic(k), 900);   // ارتقى على جهازٍ آخر: يرى المشهد هنا مرةً واحدة
    return;
  }
  if (k > prev) cinematic(k); else { F.applyTheme(k); if (LIVE) lset(F.SEEN, k); }
}

/* ---------- الرسم ---------- */
let first = true;
function render() {
  const { total, g } = totals(), G = goal(), td = dayTotal(g[today()] || []);
  const dn = dnum(today()) - dnum(S.start) + 1, left = Math.max(0, DAYS - dn + 1);
  $('#c-day').textContent = dn < 1 ? (dn === 0 ? '⚽ صافِرَةُ الْبِدايَةِ غَداً!' : `⚽ صافِرَةُ الْبِدايَةِ بَعْدَ ${AR(1 - dn)} أَيّام`) : dn > DAYS ? '🏁 انْتَهى الْمَوْسِمُ' : `📅 الْيَوْمُ ${AR(dn)} مِنْ ${AR(DAYS)}`;
  $('#c-left').textContent = dn >= 1 && dn <= DAYS ? `🏆 النِّهائِيُّ بَعْدَ ${AR(left)} ${left === 1 ? 'يَوْم' : 'يَوْماً'}` : '';
  const st = streak(g); $('#c-streak').textContent = st >= 2 ? `🔥 ${AR(st)} أَيّامٍ مُتَتالِيَة` : '';
  F.countTo($('#total'), Math.max(0, total));
  $('#goal-line').textContent = total >= G ? '🏆 فُزْتَ بِالْكُرَةِ الذَّهَبِيَّةِ!' : `مِنْ ${AR(G)} — باقي ${AR(G - total)}`;
  const lv = level(total), xp = Math.max(0, total) % LVL;
  $('#lvl').textContent = AR(lv);
  $('#xp-bar').style.width = (xp / LVL * 100).toFixed(1) + '%';
  $('#xp-txt').textContent = `${AR(xp)} / ${AR(LVL)} ← الْمُسْتَوى ${AR(lv + 1)}`;
  $('#xp-ring').style.strokeDashoffset = (226.2 * (1 - xp / LVL)).toFixed(1);
  syncTier(total);
  const k = tierNow, T = TIERS[k];
  $('#rar').innerHTML = `${F.tile(k)}<span><small>${k ? 'رُتْبَتُكَ' : 'أَنْتَ في'}</small><b>${T.n}</b><em>${T.ic} ${T.w}</em></span>`;
  $('#mc-world').textContent = T.w;
  renderTrack(total, G, k);
  // اليوم: اللياقة ثم الطاقة، والمهمات الست
  const tp = Math.max(0, td.pts);
  $('#today').textContent = (td.pts < 0 ? '−' : '') + AR(Math.abs(td.pts));
  $('#hp-bar').style.width = (Math.min(tp, HP) / HP * 100).toFixed(1) + '%'; $('#hp-num').textContent = AR(Math.min(tp, HP));
  $('#sh-bar').style.width = (Math.min(Math.max(tp - HP, 0), HP) / HP * 100).toFixed(1) + '%'; $('#sh-num').textContent = AR(Math.min(Math.max(tp - HP, 0), HP));
  $('#six').innerHTML = ORDER.map(c => `<i class="${td.done.has(c) ? 'on' : ''}" style="--c:${M[c].c}" title="${M[c].name}">${M[c].ic}</i>`).join('');
  $('#today-bonus').textContent = td.full ? `🏆 هاتْريكُ الْيَوْمِ: الْمُهِمّاتُ السِّتُّ ${PL(DAILY_BONUS)}` : `🎯 ${AR(td.n)} مِنْ ${AR(DAILY_NEED)} مُهِمّاتٍ ← الْمُهِمّاتُ السِّتُّ الْيَوْمَ ${PL(DAILY_BONUS)}`;
  renderQuests(g);
  // الجائزة
  const pct = Math.max(0, Math.min(1, total / G));
  $('#prize').classList.toggle('locked', total < G);
  $('#prize-lock').innerHTML = total < G ? `<b>🔒</b><span>تُفْتَحُ عِنْدَ ${AR(G)} نُقْطَة</span>` : '';
  $('#prize-msg').textContent = total >= G ? 'صِرْتَ بَطَلَ الْعالَمِ يا كابْتِن! الْكُرَةُ الذَّهَبِيَّةُ صارَتْ لَكَ 🏆⚽' : `اِرْتَقِ الرُّتَبَ السِّتَّ وَصِلْ إِلى ${AR(G)} نُقْطَة قَبْلَ صافِرَةِ النِّهايَةِ لِتَفوزَ بِالْكُرَةِ الذَّهَبِيَّةِ الْحَقيقِيَّةِ!`;
  $('#prize-bar').style.width = (pct * 100).toFixed(2) + '%';
  const daysLeft = Math.max(1, Math.min(DAYS, DAYS - Math.max(1, dn) + (g[today()] ? 0 : 1)));
  $('#pace').textContent = total >= G ? '' : dn > DAYS ? 'انْتَهى الْمَوْسِمُ — يُمْكِنُ لِبابا أَنْ يَبْدَأَ مَوْسِماً جَديداً مِنَ الْإِعْداداتِ.' : `🎯 تَحْتاجُ نَحْوَ ${AR(Math.ceil((G - total) / daysLeft))} نُقْطَة كُلَّ يَوْمٍ لِتَصِلَ.`;
  renderPack(g);
  renderLog(g);
  if (first) { first = false; setTimeout(() => { $('#missions').classList.remove('intro'); $('#track').classList.remove('intro'); }, 2600); }
}
function renderTrack(total, G, k) {
  let nextSet = false, nextI = 0;
  $('#track').innerHTML = TIERS.slice(1).map((T, j) => {
    const i = j + 1, nd = F.need(G, i), on = total >= nd, nx = !on && !nextSet; if (nx) { nextSet = true; nextI = i; }
    return `<div class="tc ${on ? 'on' : nx ? 'next' : 'lock'} ${i === k ? 'cur' : ''}" style="--c:${T.t1};--c2:${T.t2};--i:${j}"><span class="mk">${on ? '✓' : nx ? '◀' : '🔒'}</span>${F.tile(i)}<b>${T.n}</b><small>${on ? 'مَفْتوحَة' : AR(nd)}</small><em>${T.ic} ${T.w}</em></div>`;
  }).join('');
  const pc = Math.max(0, Math.min(1, total / G));
  $('#tbar').style.width = (pc * 100).toFixed(2) + '%'; $('#tbar').style.backgroundSize = (100 / Math.max(pc, .01)).toFixed(1) + '% 100%';
  $('#tbar-box').querySelectorAll('b').forEach(x => x.remove());
  TIERS.slice(1, -1).forEach(T => { const b = document.createElement('b'); b.style.right = T.f * 100 + '%'; $('#tbar-box').appendChild(b); });
  $('#tnext').innerHTML = nextI ? `باقي <b>${AR(F.need(G, nextI) - total)}</b> نُقْطَة إِلى رُتْبَةِ «${TIERS[nextI].n}» — وَعِنْدَها تَتَلَوَّنُ اللُّعْبَةُ كُلُّها وَتَنْتَقِلُ إِلى <b>${TIERS[nextI].w}</b> ${TIERS[nextI].ic}` : '🏆 وَصَلْتَ إِلى الرُّتَبِ السِّتِّ كُلِّها!';
  const tr = $('#track'), c = tr.querySelector('.next') || tr.querySelector('.cur');
  if (c) requestAnimationFrame(() => { const a = tr.getBoundingClientRect(), b = c.getBoundingClientRect(); tr.scrollBy({ left: (b.left + b.width / 2) - (a.left + a.width / 2), behavior: first ? 'auto' : 'smooth' }); });
}
function renderQuests(g) {
  $('#missions').innerHTML = ORDER.map((c, i) => {
    const m = M[c], list = (g[today()] || []).filter(e => e.c === c), pts = list.reduce((a, e) => a + e.p, 0), b = best(c);
    return `<button class="q ${list.length ? 'done' : ''}" data-c="${c}" style="--i:${i};--qc:${m.c};--qc1:${m.c1}">
      <img src="img/${c}.webp" alt="" loading="lazy"><span class="q-tag">${m.ic} ${m.hero}</span><span class="q-done">${list.length ? `✓ ${PL(pts)}` : ''}</span>
      <span class="q-info"><b>${m.name}</b><small>${m.task}</small><span class="rec">${b && !m.noRec ? `🏅 رَقْمُكَ: ${mins(b)}` : ''}</span><em class="q-go">ابْدَأْ ◀</em></span></button>`;
  }).join('');
}
function renderLog(g) {
  const days = Object.keys(g).sort().reverse();
  if (!days.length) { $('#log').innerHTML = `<p class="empty">${started() ? 'لَمْ تَبْدَأْ بَعْدُ… اخْتَرْ أَوَّلَ مُهِمَّةٍ وَسَجِّلْ أَوَّلَ أَهْدافِكَ! ⚽' : `صافِرَةُ الْبِدايَةِ يَوْمَ ${startTxt()}… جَهِّزْ نَفْسَكَ يا كابْتِن! ⚽`}</p>`; return; }
  $('#log').innerHTML = days.slice(0, 14).map(d => {
    const l = g[d], t = dayTotal(l), dt = new Date(...d.split('-').map((x, i) => i === 1 ? x - 1 : +x));
    const label = d === today() ? 'الْيَوْمَ' : dt.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="day"><h4>${label}<span>${PL(t.pts)}${t.full ? ' 🏆' : ''}</span></h4>${l.map(e => {
      const m = e.c === 'parent' ? { c: e.p < 0 ? '#ff3b4e' : '#ffe14d', ic: e.p < 0 ? '⚠️' : '🎁', hero: 'بابا وَماما' } : M[e.c] || { c: '#888', ic: '⭐', hero: '' };
      return `<div class="ent ${e.p < 0 ? 'neg' : ''}" style="--c:${m.c}"><span class="ic">${m.ic}</span><span class="tx">${desc(e)}<small>${m.hero} · ${new Date(e.t).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</small></span><span class="p">${PL(e.p)}</span><button class="del" data-id="${e.id}" aria-label="حذف">✕</button></div>`;
    }).join('')}${t.full ? `<div class="ent" style="--c:#ffe14d"><span class="ic">🏆</span><span class="tx">هاتْريكُ الْيَوْمِ: الْمُهِمّاتُ السِّتُّ في يَوْمٍ واحِدٍ</span><span class="p">${PL(DAILY_BONUS)}</span><span style="width:34px"></span></div>` : ''}</div>`;
  }).join('');
}
function desc(e) {
  if (e.c === 'swim') return `سِباحَةٌ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'tidy') return `تَرْتيبُ الْغُرْفَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.m ? ' (يَدَوِيّ)' : ''}`;
  if (e.c === 'morning') return `جاهِزٌ لِلْمَدْرَسَةِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}${e.x ? ' 🌙☀️ نَوْمٌ وَاسْتِيقاظ' : ''}`;
  if (e.c === 'sleep') return `جاهِزٌ لِلنَّوْمِ في ${mins(e.s)}${e.r ? ' 🏅 رَقْمٌ قِياسِيّ' : ''}`;
  if (e.c === 'parent') return `${e.p < 0 ? 'خَصْمُ عُقوبَةٍ' : 'بونَصٌ خاصٌّ'}${e.n ? ' — ' + e.n : ''}`;
  return e.n || (M[e.c] ? M[e.c].task : '');
}

/* ---------- حزمة اللاعبين اليومية: تُفتح بعد أول مهمةٍ في اليوم، فيها تحدٍّ مضحكٌ بلا نقاط ---------- */
const PACKS = [
  ['⚽', 'تَنْطيطُ الْكُرَةِ!', 'نَطِّطِ الْكُرَةَ بِقَدَمِكَ ٥ مَرّاتٍ دونَ أَنْ تَسْقُطَ!'],
  ['🕺', 'احْتِفالِيَّةُ رونالدو!', 'اقْفِزْ وَاسْتَدِرْ وَاصْرُخْ «سيووو» بِأَعْلى صَوْتِكَ! 😂'],
  ['🤸', 'إِحْماءُ اللّاعِبينَ!', 'اعْمَلْ ١٠ قَفَزاتٍ مِثْلَ لاعِبٍ يُسَخِّنُ قَبْلَ الْمُباراةِ!'],
  ['🤗', 'عِناقُ الْفَوْزِ!', 'اذْهَبْ وَاحْضُنْ ماما وَبابا حُضْنَ الْفَريقِ بَعْدَ الْهَدَفِ ❤️'],
  ['💧', 'اسْتِراحَةُ الْماءِ!', 'اشْرَبْ كَأْسَ ماءٍ كامِلاً مِثْلَ اللّاعِبينَ بَيْنَ الشَّوْطَيْنِ'],
  ['🧤', 'حارِسُ الْمَرْمى!', 'اطْلُبْ مِنْ بابا أَنْ يَرْمِيَ لَكَ الْكُرَةَ وَامْسِكْها ٣ مَرّاتٍ مُتَتالِيَةٍ!'],
  ['🟨', 'الْحَكَمُ الْغاضِبُ!', 'اعْمَلْ وَجْهَ حَكَمٍ غاضِبٍ وَأَخْرِجْ بِطاقَةً صَفْراءَ لِماما 😂'],
  ['🏃', 'رَكْضَةُ مبابي!', 'اُرْكُضْ في مَكانِكَ أَسْرَعَ ما تَسْتَطيعُ لِمُدَّةِ ١٠ ثَوانٍ!'],
  ['📣', 'هُتافُ الْمُدَرَّجاتِ!', 'اهْتِفْ بِاسْمِ فَريقِكَ الْمُفَضَّلِ ٣ مَرّاتٍ بِصَوْتٍ عالٍ!'],
  ['👏', 'تَصْفيقُ الْجَماهيرِ!', 'صَفِّقْ لِنَفْسِكَ ١٠ مَرّاتٍ… أَنْتَ نَجْمُ الْيَوْمِ!'],
  ['🦶', 'تَوازُنُ يامال!', 'قِفْ عَلى قَدَمٍ واحِدَةٍ ١٥ ثانِيَةً دونَ أَنْ تَقَعَ!'],
  ['📸', 'صورَةُ الْفَريقِ!', 'قِفْ وَضْعِيَّةَ صورَةِ الْفَريقِ قَبْلَ الْمُباراةِ وَاطْلُبْ مِنْ بابا صورَةً!'],
  ['🙆', 'احْتِفالِيَّةُ ميسي!', 'ارْفَعْ إِصْبَعَيْكَ إِلى السَّماءِ وَاشْكُرْ رَبَّكَ عَلى يَوْمٍ جَميلٍ ☝️☝️'],
  ['💪', 'عَضَلاتُ هالاند!', 'اسْتَعْرِضْ عَضَلاتِكَ وَاعْمَلْ ٥ تَمارينِ ضَغْطٍ!'],
];
let demoPack = '';
function renderPack(g) {
  const done = (g[today()] || []).some(e => e.c !== 'parent'), opened = (DEMO != null ? demoPack : lget(PACK, '')) === today();
  const box = $('#drop'); box.classList.toggle('ready', done && !opened); box.classList.toggle('locked', !done && !opened); box.classList.toggle('opened', opened);
  if (opened) { $('#drop-h').textContent = 'فَتَحْتَ حِزْمَةَ الْيَوْمِ ✓'; $('#drop-p').textContent = 'حِزْمَةٌ جَديدَةٌ تَصِلُ غَداً بَعْدَ أَوَّلِ مُهِمَّةٍ! ⚽'; }
  else if (done) { $('#drop-h').textContent = 'وَصَلَتْ حِزْمَةُ الْيَوْمِ!'; $('#drop-p').textContent = 'حِزْمَةُ نُجومٍ لامِعَةٌ… أَيُّ تَحَدٍّ في داخِلِها؟ 👀'; }
  else { $('#drop-h').textContent = 'حِزْمَةُ النُّجومِ مُقْفَلَةٌ…'; $('#drop-p').textContent = 'أَنْجِزْ أَوَّلَ مُهِمَّةٍ الْيَوْمَ لِتَفْتَحَ الْحِزْمَةَ! 🔒'; }
}
function openPack() {
  if (!$('#drop').classList.contains('ready')) { sfx.tap(); return; }
  if (DEMO != null) demoPack = today(); else lset(PACK, today());
  sfx.pack();
  const [ic, t, msg] = pick(PACKS);
  celebrate(t, 0, msg, null, 'drop', ic);
  render();
}
$('#crate').addEventListener('click', openPack);
$('#drop-btn').addEventListener('click', openPack);

/* ---------- سؤال بابا ---------- */
let gateUntil = +sessionStorage.getItem('noah-gate') || 0;
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
        if (+v === a * b) { gateUntil = Date.now() + 10 * 60e3; try { sessionStorage.setItem('noah-gate', gateUntil); } catch (e) {} return done(true); }
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
  if (!started()) {   // قبل يوم البداية: الصفحة تُعرض والمهمات تُجرَّب، ولا تُسجَّل نقاط
    sfx.bad(); closeSheet();
    celebrate('اصْبِرْ يا كابْتِن!', 0, `صافِرَةُ الْبِدايَةِ يَوْمَ ${startTxt()} — وَقْتَها تُحْسَبُ النِّقاطُ ⚽`, null, 'bad');
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
  feed(e.c === 'parent' ? `${e.p < 0 ? '⚠️' : '🎁'} بابا وَماما <b>${PL(e.p)}</b>` : `${m.ic} نوح أَنْجَزَ «${m.name}» <b>${PL(e.p)}</b>`, e.c === 'parent' ? (e.p < 0 ? '#ff3b4e' : '#ffe14d') : m.c);
  if (lvUp) setTimeout(() => feed(`⬆️ الْمُسْتَوى <b>${AR(lvUp)}</b>!`, '#4fcbff'), 500);
  if (k1 > k0 && PREVIEW == null) {   // رتبةٌ جديدة: المشهد الكبير بدل الاحتفال العادي
    tierNow = k1; cinematic(k1, `${PL(e.p)} · ${e.c === 'parent' ? 'بونَصُ بابا وَماما' : cheer(e)}`); render(); return true;
  }
  const words = ['جووول!', 'هَدَف!', 'واو!', 'نَجْم!', 'أُسْطورَة!', 'تَسْديدَةٌ صاروخِيَّة!', 'في الْمَرْمى!'];
  if (e.c === 'parent') celebrate(e.p < 0 ? 'خَصْم!' : 'بونَص!', e.p, e.n || (e.p < 0 ? 'بابا وَماما خَصَموا نِقاطاً — الْكابْتِنُ يَلْتَزِمُ الْمَرَّةَ الْقادِمَةَ 💪' : 'بابا وَماما فَخورانِ بِكَ! 🌟'), null, e.p < 0 ? 'bad' : 'win', null, lvUp);
  else if (dayFull) celebrate('هاتْريك!', e.p + DAILY_BONUS, `الْمُهِمّاتُ السِّتُّ الْيَوْمَ! ${PL(DAILY_BONUS)} مُكافَأَة 🏆`, null, 'gold', null, lvUp);
  else celebrate(e.r ? 'رَقْمٌ قِياسِيّ!' : pick(words), e.p, cheer(e), null, 'win', null, lvUp);
  render();
  return true;
}
function cheer(e) {
  const L = {
    swim: 'رونالدو: سيوووو! أَنْتَ بَطَلُ الْمَسْبَحِ! 🏊', tidy: 'مبابي: أَسْرَعُ مِنْ هُجومٍ مُعاكِسٍ! ⚡', study: 'يامال: حَتّى النُّجومُ يَحُلّونَ واجِباتِهِم! 📚',
    morning: 'نيمار: صَباحُ السّامْبا يا كابْتِن! ☀️', eat: 'هالاند: قَوِيٌّ مِثْلي! 💪', sleep: 'ميسي: نَمْ يا نَجْمُ، غَداً مُباراةٌ جَديدَة! 🌙' };
  return L[e.c] || (M[e.c] ? M[e.c].name : '');
}
function celebrate(word, pts, msg, gemK, kind, emoji, lvUp) {
  $('#b-word').textContent = word; $('#b-pts').textContent = pts ? `${PL(pts)}` : ''; $('#b-msg').textContent = msg || '';
  $('#b-lvl').textContent = lvUp ? `⬆️ الْمُسْتَوى ${AR(lvUp)}!` : '';
  $('#b-gem').innerHTML = gemK != null ? F.tile(gemK) : emoji ? `<span style="font-size:110px;display:inline-block;animation:glow 1s ease-in-out infinite">${emoji}</span>` : '';
  const box = $('#boom'); box.querySelectorAll('.spark').forEach(x => x.remove());
  const dc = $('#b-dancer'); dc.style.animation = 'none'; void dc.offsetWidth; dc.style.animation = '';
  const T = TIERS[Math.max(0, tierNow)], cols = [T.t1, T.glow, '#ffe14d', '#ff4fa3', '#4fcbff', '#7dffb2', '#fff'];
  if (kind !== 'bad') for (let i = 0; i < 56; i++) {
    const s = document.createElement('i'); s.className = 'spark' + (i % 3 ? '' : ' b'); const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 560;
    s.style.cssText = `left:50%;top:50%;--c:${cols[i % cols.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;animation-delay:${Math.random() * .25}s`;
    box.appendChild(s);
  }
  box.classList.toggle('neg', kind === 'bad');
  box.classList.toggle('gold', kind === 'gold' || kind === 'drop');
  box.classList.add('on');
  if (kind === 'gold') sfx.rank(); else if (kind === 'bad') sfx.bad(); else if (kind === 'win') { sfx.kick(); setTimeout(sfx.win, 120); }
  if (lvUp) setTimeout(sfx.level, 700);
  if (kind === 'win' || kind === 'gold') setTimeout(() => crowd(kind === 'gold'), 350);
  clearTimeout(celebrate.t); celebrate.t = setTimeout(() => box.classList.remove('on'), kind === 'gold' || kind === 'drop' ? 4600 : kind === 'bad' ? 3400 : 3000);
}
$('#boom').addEventListener('click', () => $('#boom').classList.remove('on'));

/* نوح يقفز قفزةً دوّارة عند لمسه، وتتطاير شرارات بلون رتبته وكرةٌ صغيرة */
$('#char').addEventListener('click', () => {
  const c = $('#char'), st = c.parentElement; c.classList.remove('emote'); void c.offsetWidth; c.classList.add('emote');
  sfx.kick(); setTimeout(() => crowd(false), 200);
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('i'), a = Math.PI + Math.random() * Math.PI, r = 70 + Math.random() * 110;
    p.className = 'puff'; p.style.setProperty('--x', Math.cos(a) * r + 'px'); p.style.setProperty('--y', Math.sin(a) * r * .6 + 'px');
    st.appendChild(p); setTimeout(() => p.remove(), 900);
  }
  const b = document.createElement('span'); b.className = 'kickball'; b.textContent = '⚽'; st.appendChild(b); setTimeout(() => b.remove(), 1300);
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
      <div class="face"><span class="t" id="tt">٠:٠٠</span><span class="lp" id="lp"></span></div></div>
    <div class="btns" id="tb"></div>
    <button class="link" id="mlink">نَسيتَ الْمُؤَقِّتَ؟ أَدْخِلِ الدَّقائِقَ بِيَدِكَ</button>
    <div class="manual" id="man"><div class="step"><button id="mm">−</button><b id="mv"></b><button id="mp">+</button></div><p class="preview" id="mpv"></p><div class="btns"><button class="btn green" id="msave">سَجِّلِ النِّقاطَ</button></div></div>`;
  let mv = 10;
  const mUpd = () => { $('#mv').textContent = `${AR(mv)} دَقيقَة`; $('#mpv').innerHTML = `النِّقاطُ: <b>${PL(m.fn(mv * 60))}</b>`; };
  $('#mlink').onclick = () => { $('#man').classList.toggle('on'); mUpd(); };
  $('#mm').onclick = () => { mv = Math.max(1, mv - 1); mUpd(); sfx.tap(); };
  $('#mp').onclick = () => { mv = Math.min(60, mv + 1); mUpd(); sfx.tap(); };
  $('#msave').onclick = () => award({ c, s: mv * 60, p: m.fn(mv * 60), m: 1 });
  const hint = c === 'swim' ? 'الْهَدَفُ: بَيْنَ ٨ وَ١٢ دَقيقَة' : 'كُلَّما أَسْرَعْتَ زادَتِ النِّقاط';
  const paint = s => {
    $('#tt').textContent = mmss(s);
    const k = Math.min(1, s / m.full); $('#arc').style.strokeDashoffset = C * (1 - k);
    $('#arc').style.stroke = m.zone ? (s < m.zone[0] ? m.c : s <= m.zone[1] ? '#21b25b' : '#ff3b4e') : s > m.full ? '#ff3b4e' : k > .7 ? '#ffa320' : m.c;
    $('#lp').innerHTML = `لَوِ انْتَهَيْتَ الْآنَ: <b>${PL(m.fn(s))}</b>`;
  };
  const idle = () => {
    clearInterval(tick); $('#clk').classList.remove('run'); paint(0); $('#lp').textContent = hint;
    $('#tb').innerHTML = `<button class="btn green" id="go">▶ صافِرَةُ الْبِدايَةِ!</button>`;
    $('#go').onclick = () => { lset(RUN, { c, t0: Date.now() }); sfx.whistle(); running(Date.now()); };
  };
  const running = t0 => {
    $('#clk').classList.add('run'); $('#mlink').style.display = 'none'; $('#man').classList.remove('on');
    $('#tb').innerHTML = `<button class="btn gold" id="stop">🏁 انْتَهَيْتُ!</button><button class="btn dark" id="cancel">إِلْغاء</button>`;
    let lastMin = -1;
    const f = () => { const s = Math.floor((Date.now() - t0) / 1000); paint(s); const mi = Math.floor(s / 60); if (mi !== lastMin && s > 5) { if (lastMin >= 0) sfx.tick(); lastMin = mi; } };
    f(); clearInterval(tick); tick = setInterval(f, 250);
    $('#stop').onclick = () => { const s = Math.max(1, Math.floor((Date.now() - t0) / 1000)); clearInterval(tick); localStorage.removeItem(RUN); sfx.whistle(); result(s); };
    $('#cancel').onclick = () => { localStorage.removeItem(RUN); $('#mlink').style.display = ''; idle(); };
  };
  const result = s => {
    const b = best(c), rec = !m.noRec && b && s < b, p = m.fn(s) + (rec ? 20 : 0);
    $('#clk').classList.remove('run'); paint(s);
    $('#lp').innerHTML = m.zone ? (s < m.zone[0] ? 'أَسْرَعُ مِنَ اللّازِمِ — الْهَدَفُ ٨–١٢ دَقيقَة 🙂' : s <= m.zone[1] ? 'في الْوَقْتِ الْمِثالِيِّ! 👏' : 'تَأَخَّرْتَ قَليلاً — الْهَدَفُ ٨–١٢ دَقيقَة 💪')
      : s <= 1200 ? 'أَحْسَنْتَ! 👏' : 'الْمَرَّةَ الْقادِمَةَ أَسْرَعُ! 💪';
    $('#tb').innerHTML = `<div class="result" style="width:100%"><div class="big">${PL(p)}</div>${rec ? `<span class="recflag">🏅 رَقْمٌ قِياسِيٌّ جَديد! ⁦+٢٠⁩</span>` : ''}<p>${mins(s)}</p></div>
      <button class="btn green" id="ok">⚽ سَجِّلِ الْهَدَفَ</button><button class="btn dark" id="again">إِعادَة</button>`;
    $('#ok').onclick = () => award({ c, s, p, r: rec ? 1 : 0 });
    $('#again').onclick = () => { $('#mlink').style.display = ''; idle(); };
  };
  live ? running(live.t0) : idle();
}

/* خطوات بمؤقّت — الصباح: استيقظت ← فرّشت ← لبست · النوم: الصافرة ← فرّشت ← الحمام ← الفراش */
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
      if (i === 0) { run = { c, t0: Date.now(), marks: [Date.now()] }; sfx.whistle(); } else { run.marks.push(Date.now()); sfx.tap(); }
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
    $('#sh-ui').innerHTML = `<div class="result"><div class="big">${PL(p)}</div>${rec ? `<span class="recflag">🏅 رَقْمٌ قِياسِيٌّ جَديد! ⁦+٢٠⁩</span>` : ''}${cyc ? `<span class="recflag">🌙☀️ نِمْتَ وَاسْتَيْقَظْتَ كَالنُّجومِ ${PL(CYCLE)}</span>` : ''}
      <p>${c === 'sleep' ? 'جَهَزْتَ لِلنَّوْمِ' : 'جَهَزْتَ لِلْمَدْرَسَةِ'} في ${mins(s)} — الْخُطُواتُ ٦٠ + السُّرْعَةُ ${AR(mornBonus(s))}</p></div>
      <div class="btns"><button class="btn green" id="ok">⚽ سَجِّلِ الْهَدَفَ</button><button class="btn dark" id="again">إِعادَة</button></div>`;
    $('#ok').onclick = () => award(Object.assign({ c, s, p, r: rec ? 1 : 0 }, cyc ? { x: 1 } : {}));
    $('#again').onclick = () => { run = null; draw(); };
  };
  draw();
}

/* الدراسة: يختار نوع الإنجاز ويكتبه */
function uiStudy(c) {
  let pk = 0;
  $('#sh-ui').innerHTML = `<div class="opts">${STUDY.map(([ic, t, p], i) => `<button class="opt ${i ? '' : 'on'}" data-i="${i}"><i>${ic}</i>${t}<small>${PL(p || 25)}</small></button>`).join('')}</div>
    <label class="lbl" for="sn">✍️ اكْتُبْ إِنْجازَكَ:</label><input class="note" id="sn" maxlength="80" placeholder="مَثَلاً: حَلَلْتُ واجِبَ الرِّياضِيّاتِ صَفْحَة ٢٠">
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">📚 سَجِّلِ الْإِنْجازَ</button></div>`;
  const upd = () => { $('#pv').innerHTML = `النِّقاطُ: <b>${PL(STUDY[pk][2] || 25)}</b>`; };
  $('#sh-ui').querySelectorAll('.opt').forEach(b => b.onclick = () => { pk = +b.dataset.i; $('#sh-ui').querySelectorAll('.opt').forEach(x => x.classList.toggle('on', x === b)); sfx.tap(); upd(); });
  $('#ok').onclick = () => { const [, t, p] = STUDY[pk], note = $('#sn').value.trim(); award({ c, p: p || 25, n: (t + (note ? ' — ' + note : '')) }); };
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
    <p class="preview" id="pv"></p><div class="btns"><button class="btn green" id="ok">💪 اشْحَنِ اللِّياقَةَ وَسَجِّلْ</button></div>`;
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
  <li>☀️ صَباحُ نيمار: ٣ خُطُواتٍ × ٢٠ + سُرْعَة (١٠ د = ٤٠، ١٥ د = ٢٥، ٢٠ د = ١٠) — مَرَّةً في الْيَوْم.</li>
  <li>📚 واجِباتُ يامال: ٢٥ لِكُلِّ إِنْجاز، وَ٥٠ لِلدَّرَجَةِ الْكامِلَة.</li>
  <li>⚡ سُرْعَةُ مبابي (التَّرْتيب): ٥ د أَوْ أَقَلّ = ١٠٠، وَتَنْزِلُ حَتّى ٣٠ عِنْدَ ٢٠ د، وَبَعْدَها ١٥.</li>
  <li>💪 قُوَّةُ هالاند (الْأَكْل): ٣٠ لِلصَّحْنِ كامِلاً، ١٥ لِأَغْلَبِه، ⁦+١٠⁩ لِلْخُضار — كُلُّ وَجْبَةٍ مَرَّة.</li>
  <li>🏊 مَسْبَحُ رونالدو: بَيْنَ ٨ وَ١٢ دَقيقَة = ١٠٠، وَأَقَلُّ أَوْ أَكْثَرُ = ٥٠.</li>
  <li>🌙 لَيْلَةُ ميسي (النَّوْم): فِرْشاة + حَمّام + فِراش × ٢٠ + سُرْعَة — مَرَّةً في الْيَوْم.</li>
  <li>🌙☀️ صَباحٌ بَعْدَ لَيْلَةٍ سُجِّلَ فيها النَّوْم: ${PL(CYCLE)} عَلى صَباحِ نيمار.</li>
  <li>🏅 كَسْرُ الرَّقْمِ الْقِياسِيِّ بِالْمُؤَقِّت (التَّرْتيبُ وَالصَّباحُ وَالنَّوْم): ⁦+٢٠⁩.</li>
  <li>🏆 هاتْريكُ الْيَوْم: الْمُهِمّاتُ السِّتُّ في يَوْمٍ واحِد = ${PL(DAILY_BONUS)}.</li>
  <li>⚖️ بونَصُ بابا وَماما أَوْ خَصْمُهُما: ٥٠ أَوْ ١٠٠ فَقَط.</li>
  <li>⬆️ كُلُّ ${AR(LVL)} نُقْطَة مُسْتَوىً جَديد، وَاللِّياقَةُ ثُمَّ الطّاقَةُ تَمْتَلِئانِ بِنِقاطِ الْيَوْمِ.</li>
  <li>🎨 عِنْدَ كُلِّ رُتْبَةٍ تَتَلَوَّنُ اللُّعْبَةُ كُلُّها بِلَوْنِها وَيَتَحَوَّلُ مَلْعَبُ الْخَريطَةِ إِلى شَكْلٍ جَديد، وَالرُّتْبَةُ السّادِسَةُ تَفْتَحُ الْكُرَةَ الذَّهَبِيَّة.</li>
  <li>🎴 حِزْمَةُ الْيَوْم: تُفْتَحُ بَعْدَ أَوَّلِ مُهِمَّةٍ، فيها تَحَدٍّ مُضْحِكٌ بِلا نِقاط.</li>
  <li>🎯 يَوْمٌ جَيِّدٌ ≈ ٤٥٠–٥٠٠ نُقْطَة، فَالْهَدَفُ ${AR(goal())} يَحْتاجُ نَحْوَ ${AR(Math.ceil(goal() / DAYS))} يَوْمِيّاً.</li></ul>`;
}
$('#settings-btn').onclick = async () => {
  if (!(await gate())) return;
  $('#st-start').value = S.start; $('#st-goal').value = goal(); $('#st-gate').checked = S.gate !== '0'; $('#how').innerHTML = howHTML();
  $('#th-row').innerHTML = TIERS.map((T, i) => `<button data-k="${i}" title="${T.n} — ${T.w}">${F.tile(i)}</button>`).join('');
  $('#settings').classList.add('on');
};
$('#th-row').addEventListener('click', e => {   // معاينة ثيمةٍ ومشهدها دون أي تغيير في الحالة
  const b = e.target.closest('[data-k]'); if (!b) return;
  const k = +b.dataset.k; $('#settings').classList.remove('on'); sfx.rank();
  F.tierUp(k, { kick: '👀 مُعايَنَة', msg: 'هكَذا تَبْدو اللُّعْبَةُ عِنْدَما يَصِلُ نوح إِلى هذِهِ الرُّتْبَة', btn: 'رُجوع', onClose: () => F.applyTheme(tierNow) });
});
$('#st-x').onclick = () => $('#settings').classList.remove('on');
$('#st-save').onclick = () => {
  const st = $('#st-start').value, g = Math.round(+$('#st-goal').value / 50) * 50;
  if (/^\d{4}-\d\d-\d\d$/.test(st)) S.start = st;
  if (g >= 1000) S.goal = String(g);
  S.gate = $('#st-gate').checked ? '1' : '0'; S.sat = Date.now();
  save(); $('#settings').classList.remove('on'); render();
};
$('#st-reset').onclick = () => {
  if (!confirm('سَيُمْسَحُ سِجِلُّ هذا الْمَوْسِمِ كُلُّهُ وَيَبْدَأُ مَوْسِمٌ جَديدٌ مِنَ الْيَوْمِ. مُتَأَكِّد؟')) return;
  const g = S.goal, gt = S.gate; S = Object.assign(F.fresh(), { goal: g, gate: gt, rst: Date.now(), rby: 1, sat: Date.now() }); save();   // التصفير الوحيد المعتمد
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
setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60e3);

window.__heroes = { get S() { return S; }, award, render, totals, celebrate, cinematic };
})();
