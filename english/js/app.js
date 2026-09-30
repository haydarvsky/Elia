/* إيليا وفينوم — مغامرة الإنجليزي — محرّك اللعبة */
(() => {
'use strict';
const W = window.WORLDS, LV = window.LEVELS, COL = window.COLORS, NUM = window.NUMWORDS, VL = window.VLINES;
LV.forEach((L, i) => { L.i = i; if (L.w) L.pics = L.w.filter(x => x[1]); });
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const uniq = a => a.filter((x, i) => a.indexOf(x) === i);

/* ============ الحفظ ============ */
const KEY = 'elia-english-v1';
const TEST = location.hash === '#test';
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } })() || {};
S = Object.assign({ done: {}, gems: 0, world: 1, stickers: {} }, S);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const starsOf = i => S.done[i] || 0;
const unlocked = i => TEST || i === 0 || starsOf(i - 1) > 0 || starsOf(i) > 0;
const worldOpen = w => unlocked(LV.findIndex(L => L.world === w));

/* الصعوبة: تكبر مع التقدّم في الكتاب (٠ → ١) */
const diffOf = L => L.i / (LV.length - 1);

/* كل الكلمات المصوّرة (للمشتّتات) */
const ALLPICS = [];
LV.forEach(L => (L.pics || []).forEach(p => { if (!ALLPICS.some(q => q[0] === p[0])) ALLPICS.push(p); }));
const picOf = w => (ALLPICS.find(p => p[0] === w) || [w, ''])[1];
const lettersUpTo = i => LV.slice(0, i + 1).filter(L => L.type === 'letter').map(L => L.L);
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/* ============ الملصقات ============ */
function stickersOf(L) {
  if (L.pics && L.pics.length) return L.pics.map(([w, p]) => ({ k: w, pic: p, label: w, speak: w }));
  if (L.type === 'boss') return [{ k: 'boss' + L.world, img: 'goo', label: L.title, cls: 'trophy' }];
  const special = { numbers: '🔢', colors: '🎨', spell: '🔤', prep: '📦' };
  return [{ k: 'lv' + L.i, pic: special[L.type] || '⭐', label: L.title }];
}
const ALLSTICKERS = [];
LV.forEach(L => stickersOf(L).forEach(s => { if (!ALLSTICKERS.some(x => x.s.k === s.k)) ALLSTICKERS.push({ world: L.world, s }); }));
const stickerCount = () => ALLSTICKERS.filter(x => S.stickers[x.s.k]).length;

/* ============ الصوت ============ */
/* تسجيلات حقيقية: audio/t/ للمعلّمة، audio/v/ لفينوم. إن غاب الملف نرجع لنطق المتصفح */
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const voice = new Audio(); voice.preload = 'auto';
let playTok = 0;
function playFile(src) {
  const tok = ++playTok;
  return new Promise(res => {
    let fin = false; const done = ok => { if (fin) return; fin = true; voice.onended = voice.onerror = null; res(!ok ? 'err' : tok === playTok ? 'ok' : 'cut'); };
    voice.onended = () => done(true); voice.onerror = () => done(false);
    voice.src = src + '?v=1'; voice.currentTime = 0;
    const p = voice.play(); if (p && p.catch) p.catch(() => done(false));
  });
}
let VOICE = null;
function pickVoice() {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
  const en = vs.filter(v => /^en[-_]/i.test(v.lang));
  VOICE = ['Samantha', 'Google US English', 'Ava', 'Allison'].map(n => en.find(v => v.name.includes(n))).find(Boolean) || en[0] || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function tts(text, pitch = 1.05) {
  return new Promise(res => {
    if (!window.speechSynthesis) return res();
    try { speechSynthesis.cancel(); } catch (e) {}
    const u = new SpeechSynthesisUtterance(text); if (VOICE) u.voice = VOICE; u.lang = 'en-US'; u.rate = .82; u.pitch = pitch;
    let d = false; const f = () => { if (!d) { d = true; res(); } }; u.onend = f; u.onerror = f; setTimeout(f, 900 + text.length * 170);
    speechSynthesis.speak(u);
  });
}
async function say(text) { const r = await playFile(`audio/t/${slug(text)}.mp3`); if (r === 'err') await tts(text); return r !== 'cut'; }
async function sayLetter(L) { const r = await playFile(`audio/t/letter_${L.toLowerCase()}.mp3`); if (r === 'err') await tts(L); return r !== 'cut'; }
async function venom(key) { const r = await playFile(`audio/v/${key}.mp3`); if (r === 'err') await tts(VL[key] || key, .4); return r !== 'cut'; }
const cap = (el, id) => { try { el.setPointerCapture(id); } catch (e) {} };
async function chain(...fns) { for (const f of fns) { if (!(await f())) return false; await sleep(80); } return true; }

/* مقاطع إيليا الحقيقية من لعبة الحروف */
const clip = new Audio(); clip.preload = 'auto';
function playClip(k) {
  return new Promise(res => {
    const done = () => { clip.onended = clip.onerror = null; res(); };
    clip.onended = done; clip.onerror = done; clip.src = `../huruf/assets/audio/elia/${k}.mp3?v=5`;
    const p = clip.play(); if (p && p.catch) p.catch(done);
  });
}
function stopAll() { playTok++; try { voice.pause(); } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} try { clip.pause(); } catch (e) {} }

/* مؤثرات مولّدة */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type = 'sine', vol = .1, when = 0, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
const SFX = {
  click: () => tone(660, .07, 'triangle', .08),
  good: () => { tone(587, .12, 'triangle', .12); tone(740, .12, 'triangle', .12, .1); tone(988, .25, 'triangle', .12, .2); },
  bad: () => tone(220, .28, 'sine', .12, 0, 120),
  pop: () => tone(900, .08, 'sine', .1, 0, 1400),
  ink: () => tone(1300, .04, 'sine', .03),
  zap: () => { tone(1200, .25, 'sawtooth', .05, 0, 120); tone(300, .3, 'square', .04, .05, 60); },
  goo: () => tone(160, .35, 'sine', .15, 0, 60),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .22, 'triangle', .11, i * .1)),
  sticker: () => [880, 1175, 1568].forEach((f, i) => tone(f, .12, 'sine', .1, i * .07)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ============ أدوات الواجهة ============ */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
let toastT;
function toast(h) { const t = $('#toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900); }
function burst(n = 30, x = innerWidth / 2, y = innerHeight * .5) {
  const cols = ['#f6c445', '#7cc45a', '#6fd3ff', '#e2604f', '#fff', '#b980ff'];
  for (let i = 0; i < n; i++) {
    const b = el('i', 'burst'); const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 300;
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.background = pick(cols);
    b.style.setProperty('--dx', Math.cos(a) * d + 'px'); b.style.setProperty('--dy', Math.sin(a) * d - 120 + 'px'); b.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(b); setTimeout(() => b.remove(), 1200);
  }
}
function confirmBox(html, yes = 'نَعَمْ', no = 'لا') {
  return new Promise(res => {
    const m = $('#modal'), c = $('#modal-card'); c.innerHTML = `<p style="margin:0 0 16px">${html}</p>`;
    const r = el('div', 'row'); const y = el('button', 'btn go', yes), n = el('button', 'btn', no);
    y.onclick = () => { m.classList.remove('on'); res(true); }; n.onclick = () => { m.classList.remove('on'); res(false); };
    r.append(y, n); c.appendChild(r); m.classList.add('on');
  });
}
const hl = (w, L) => { if (!L) return w; const i = w.toLowerCase().indexOf(L.toLowerCase()); return i < 0 ? w : w.slice(0, i) + `<span class="hl">${w[i]}</span>` + w.slice(i + 1); };
const stickerHtml = s => s.img ? `<img src="img/${s.img}.webp?v=2" alt="">` : `<span class="pic">${s.pic}</span>`;

/* فينوم الرفيق */
const GOOD = ['good1', 'good2', 'good3', 'good4', 'good5', 'good6', 'good7', 'good8'], TRY = ['try1', 'try2', 'try3'];
let bubT;
function buddy(mood, key, speak = true, text) {
  const b = $('#buddy'), bu = $('#bubble'), img = $('#buddy-img');
  b.classList.remove('happy', 'oops'); void b.offsetWidth; if (mood) b.classList.add(mood);
  img.src = `img/${mood === 'happy' ? pick(['venom_cheer', 'venom_flex']) : mood === 'oops' ? 'venom_think' : 'venom_hi'}.webp?v=2`;
  const t = text || (key && VL[key]);
  if (t) { bu.textContent = t; bu.classList.add('on'); clearTimeout(bubT); bubT = setTimeout(() => bu.classList.remove('on'), 2400); }
  return key && speak ? venom(key) : Promise.resolve(true);
}

/* احتفال بصوت إيليا */
const CELEB = {
  siuuu: { img: 'elia_cheer', say: 'سِيييييي!' }, smart: { img: 'elia_smart', say: 'أَنا ذَكِيٌّ!' },
  genius: { img: 'elia_smart', say: 'أَنا عَبْقَرِيٌّ!' }, hero: { img: 'team_win', say: 'أَنا بَطَلٌ!' },
  easy: { img: 'elia_cheer', say: 'سَهْلَةٌ!' }, won: { img: 'team_win', say: 'فُزْنا!' },
};
let bag = [];
function celebrate(kind) {
  if (!kind) { if (!bag.length) bag = shuffle(Object.keys(CELEB).filter(k => k !== 'won')); kind = bag.pop(); }
  const c = CELEB[kind], box = $('#celebrate');
  $('#c-img').src = `img/${c.img}.webp?v=2`; $('#c-say').textContent = c.say;
  const im = $('#c-img'); im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
  box.classList.add('on'); SFX.good(); setTimeout(() => burst(kind === 'won' ? 70 : 34), 300);
  return new Promise(res => {
    let closed = false; const close = () => { if (closed) return; closed = true; box.classList.remove('on'); box.onclick = null; res(); };
    box.onclick = () => { stopAll(); close(); };
    (async () => { const t0 = Date.now(); await playClip(kind); const left = 1600 - (Date.now() - t0); if (left > 0) await sleep(left); close(); })();
  });
}

/* ============ الرئيسية ============ */
function renderStats() {
  const stars = Object.values(S.done).reduce((a, b) => a + b, 0);
  $('#home-stats').innerHTML = `<span class="chip">💎 ${S.gems}</span><span class="chip">⭐ ${stars}</span><button class="chip album-btn" id="h-album">📒 ${stickerCount()}/${ALLSTICKERS.length}</button>`;
  $('#map-gems').innerHTML = `<button class="chip album-btn" id="m-album">📒 ${stickerCount()}</button><span class="chip">💎 ${S.gems}</span>`;
  $('#h-album').onclick = () => { SFX.click(); openAlbum('home'); };
  $('#m-album').onclick = () => { SFX.click(); openAlbum('map'); };
}
$('#play').onclick = () => { SFX.click(); ac(); venom('hello'); openMap(S.world || 1); };
$('#map-home').onclick = () => { SFX.click(); stopAll(); renderStats(); show('home'); };

/* ============ ألبوم الملصقات ============ */
let albumBack = 'home';
function openAlbum(from) {
  albumBack = from; const box = $('#album-pages'); box.innerHTML = '';
  $('#album-count').textContent = `${AR(stickerCount())} / ${AR(ALLSTICKERS.length)}`;
  W.forEach(w => {
    const page = el('div', 'album-page panel', `<h3><span class="en">${w.title}</span> <small>${w.ar}</small></h3>`);
    const grid = el('div', 'album-grid');
    ALLSTICKERS.filter(x => x.world === w.id).forEach(({ s }) => {
      const got = S.stickers[s.k];
      const b = el('button', 'sticker' + (got ? ' got' : '') + (got === 2 ? ' gold' : '') + (s.cls ? ' ' + s.cls : ''),
        got ? stickerHtml(s) + `<span class="w">${s.label}</span>` : `<span class="pic q">?</span>`);
      b.onclick = () => { if (!got) { SFX.bad(); toast('اِلْعَبِ الْمَرْحَلَةَ لِتَحْصُلَ عَلَيْهِ'); return; } SFX.pop(); b.classList.remove('wig'); void b.offsetWidth; b.classList.add('wig'); if (s.speak) say(s.speak); };
      grid.appendChild(b);
    });
    page.appendChild(grid); box.appendChild(page);
  });
  show('album'); $('#album .album-wrap').scrollTop = 0;
}
$('#album-back').onclick = () => { SFX.click(); stopAll(); if (albumBack === 'map') openMap(curWorld); else { renderStats(); show('home'); } };

/* ============ الخريطة ============ */
let curWorld = 1;
function openMap(w) {
  curWorld = w; S.world = w; save();
  const wd = W[w - 1];
  $('#map-bg').style.backgroundImage = `url(img/bg_${wd.bg}.webp)`;
  const tabs = $('#tabs'); tabs.innerHTML = '';
  W.forEach(x => {
    const open = worldOpen(x.id);
    const t = el('button', 'tab' + (x.id === w ? ' on' : '') + (open ? '' : ' lock'), `<span class="en">${x.id}. ${x.title}</span><small>${x.ar}</small>`);
    t.style.setProperty('--wc', x.color);
    t.onclick = () => { SFX.click(); if (!open) { toast('🔒 أَنْهِ الْعالَمَ الَّذي قَبْلَهُ'); return; } openMap(x.id); };
    tabs.appendChild(t);
  });
  const path = $('#path'); path.innerHTML = '';
  const list = LV.filter(L => L.world === w);
  path.appendChild(el('div', 'world-title', `<span class="en">${wd.title}</span><span>${wd.ar} — Unit ${w}</span>`));
  const X = [50, 76, 58, 26, 42, 72, 50, 24, 34, 66, 50, 30];
  const top0 = 260, gap = 150;
  const pts = list.map((L, k) => ({ x: X[k % X.length], y: top0 + k * gap }));
  const H = top0 + list.length * gap + 60; path.style.height = H + 'px';
  const svgNS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 100 ${H}`); svg.setAttribute('preserveAspectRatio', 'none');
  let d = `M ${pts[0].x} ${pts[0].y}`; for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k]; d += ` C ${a.x} ${a.y + gap / 2}, ${b.x} ${b.y - gap / 2}, ${b.x} ${b.y}`; }
  const p1 = document.createElementNS(svgNS, 'path'); p1.setAttribute('d', d); p1.setAttribute('fill', 'none'); p1.setAttribute('stroke', 'rgba(251,245,230,.85)'); p1.setAttribute('stroke-width', '26'); p1.setAttribute('vector-effect', 'non-scaling-stroke'); p1.setAttribute('stroke-linecap', 'round');
  const p2 = p1.cloneNode(); p2.setAttribute('stroke', wd.color); p2.setAttribute('stroke-width', '6'); p2.setAttribute('stroke-dasharray', '2 16');
  svg.append(p1, p2); path.appendChild(svg);
  const curIdx = LV.findIndex((L, i) => unlocked(i) && !starsOf(i));
  list.forEach((L, k) => {
    const open = unlocked(L.i), st = starsOf(L.i);
    const n = el('button', 'node' + (L.type === 'boss' ? ' boss' : '') + (open ? '' : ' lock') + (L.i === curIdx ? ' cur' : ''));
    n.style.left = pts[k].x + '%'; n.style.top = pts[k].y + 'px'; n.style.setProperty('--wc', wd.color);
    n.innerHTML = nodeFace(L) + (L.type !== 'boss' || st ? `<span class="stars">${[1, 2, 3].map(s => `<i class="${s <= st ? 'on' : ''}">★</i>`).join('')}</span>` : '');
    if (L.i === curIdx) { const y = el('img', 'you' + (pts[k].x > 60 ? ' l' : '')); y.src = 'img/elia_hello.webp'; n.appendChild(y); }
    n.onclick = () => { SFX.click(); if (!open) { toast('🔒 اِلْعَبِ الْمَرْحَلَةَ الَّتي قَبْلَها'); return; } startLevel(L); };
    path.appendChild(n);
  });
  renderStats(); show('map');
  const wrap = $('#path-wrap'); const cur = list.find(L => L.i === curIdx);
  wrap.scrollTop = cur ? Math.max(0, pts[list.indexOf(cur)].y - wrap.clientHeight / 2) : 0;
}
function nodeFace(L) {
  if (L.type === 'letter') return `<span class="en">${L.L}${L.L.toLowerCase()}</span>`;
  if (L.type === 'boss') return `<img src="img/goo.webp?v=2" alt="">`;
  if (L.type === 'numbers') return `<span class="en sm">${L.title}</span>`;
  const special = { colors: '🎨', prep: '📦', spell: '🔤' };
  return `<span class="emo">${special[L.type] || (L.w && L.w[0][1]) || '⭐'}</span>`;
}

/* ============ المستوى ============ */
let RUN = null;
$('#lv-back').onclick = async () => {
  SFX.click();
  if (RUN && RUN.phase === 'play' && !(await confirmBox('تَخْرُجُ مِنَ الْمَرْحَلَةِ؟'))) return;
  endRun(); openMap(curWorld);
};
function endRun() { if (RUN) { RUN.dead = true; clearInterval(RUN.timer); } RUN = null; stopAll(); }
function setProg(k, n) { $('#lv-prog').style.width = (n ? k / n * 100 : 0) + '%'; }
function setHearts(h, max) { $('#lv-hearts').innerHTML = max ? Array.from({ length: max }, (_, i) => `<span class="${i < h ? '' : 'off'}">❤️</span>`).join('') : ''; }
function setCombo(n) { const c = $('#combo'); c.innerHTML = n >= 3 ? `🔥<b>${AR(n)}</b>` : ''; c.classList.toggle('on', n >= 3); if (n >= 3) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } }
function stage() { const s = $('#stage'); s.innerHTML = ''; s.scrollTop = 0; return s; }

function startLevel(L) {
  endRun();
  RUN = { L, phase: 'learn', mistakes: 0, k: 0, qs: [], streak: 0, best: 0 };
  curWorld = S.world = L.world; save();
  $('#lv-bg').style.backgroundImage = `url(img/bg_${W[L.world - 1].bg}.webp)`;
  $('#buddy').style.display = ''; setProg(0, 1); setHearts(0, 0); setCombo(0);
  show('level');
  if (L.type === 'boss') return startBoss(L);
  if (L.type === 'spell' || L.type === 'prep') return startPlay();
  learn(L);
}

/* ---------- مرحلة التعلّم ---------- */
function learn(L) {
  const s = stage(); const c = el('div', 'learn panel');
  const top = el('div', 'learn-top');
  if (L.type === 'letter') top.innerHTML = `<div class="letter-big">${L.L}<small>${L.L.toLowerCase()}</small></div>`;
  else top.innerHTML = `<h2 class="en" style="margin:0;font-family:var(--title);font-size:clamp(40px,6vw,64px);color:var(--sky)">${L.title}</h2>`;
  const sb = el('button', 'say-btn', '🔊'); top.appendChild(sb); c.appendChild(top);
  const hint = el('div', '', 'اِضْغَطْ عَلى كُلِّ بِطاقَةٍ وَاسْمَعْ 👂'); hint.style.fontSize = '24px'; c.appendChild(hint);
  const cards = el('div', 'learn-cards'); const items = learnItems(L); const heard = new Set();
  const intro = () => L.type === 'letter' ? chain(() => venom('thisIs'), () => sayLetter(L.L)) : L.type === 'numbers' ? venom('learn') : say(L.title);
  const playAll = async () => {
    sb.classList.add('playing');
    if (await intro()) for (const it of items) { if (!RUN || RUN.dead) break; it.el.classList.add('playing'); const ok = await say(it.speak); it.el.classList.remove('playing'); if (!ok) break; await sleep(150); }
    sb.classList.remove('playing');
  };
  items.forEach(it => {
    const b = el('button', 'wcard' + (it.pic ? '' : ' noimg'), (it.pic ? `<span class="pic">${it.pic}</span>` : '') + `<span class="w">${it.label}</span>`);
    if (it.bg) { b.style.background = it.bg; if (it.dark) b.style.color = '#fff'; }
    b.onclick = async () => { SFX.pop(); heard.add(it.speak); b.classList.add('heard', 'playing'); await say(it.speak); b.classList.remove('playing'); if (heard.size >= items.length) go.classList.add('pulse'); };
    it.el = b; cards.appendChild(b);
  });
  c.appendChild(cards);
  if (L.say) {
    const sn = el('div', 'sent');
    L.say.forEach(t => { const b = el('button', '', t); b.onclick = () => { SFX.pop(); say(t); }; sn.appendChild(b); });
    c.appendChild(sn);
  }
  sb.onclick = () => { SFX.click(); playAll(); };
  const go = el('button', 'btn big go', "▶ <span>Let's play!</span>"); go.onclick = () => { SFX.click(); stopAll(); startPlay(); };
  c.appendChild(go); s.appendChild(c);
  buddy('', null, false, L.type === 'letter' ? `${L.L} is for ${L.w[0][0]}!` : `Let's learn: ${L.title}`);
  setTimeout(() => { if (RUN && RUN.L === L && RUN.phase === 'learn') playAll(); }, 500);
}
function learnItems(L) {
  if (L.type === 'numbers') {
    const it = L.n.slice().sort((a, b) => a - b).map(n => ({ pic: '', label: `${n} <small style="font-size:.6em">${NUM[n]}</small>`, speak: NUM[n] }));
    (L.extra || []).forEach(([w]) => it.push({ pic: '', label: w, speak: w, bg: COL[w], dark: w === 'black' || w === 'brown' }));
    return it;
  }
  if (L.type === 'colors') return L.c.map(c => ({ pic: '', label: c, speak: c, bg: COL[c], dark: ['black', 'brown', 'blue', 'purple', 'green', 'red'].includes(c) }));
  return L.w.map(([w, p]) => ({ pic: p, label: L.type === 'letter' ? hl(w, L.L) : w, speak: w }));
}

/* ---------- بناء الأسئلة (من السهل إلى الصعب) ---------- */
function buildQuestions(L) {
  const d = diffOf(L);
  const nOpt = d < .25 ? 3 : 4;                 // عدد الخيارات يزيد مع التقدّم
  const nPairs = d < .35 ? 3 : 4;               // أزواج التوصيل تزيد
  const Q = [];
  const notMine = p => !(L.w || []).some(x => x[0] === p[0]);
  const others = (n, f = () => true) => shuffle(ALLPICS.filter(p => notMine(p) && f(p))).slice(0, n);
  const spellable = (L.w || []).map(x => x[0]).filter(w => /^[a-z]+$/.test(w) && w.length <= 5 && picOf(w));
  if (L.type === 'letter') {
    const pics = shuffle(L.pics);
    const starts = pics.filter(p => p[0][0].toUpperCase() === L.L);
    const near = shuffle(uniq(lettersUpTo(L.i).concat(ABC)).filter(x => x !== L.L));
    Q.push({ t: 'hearLetter', ans: L.L, opts: shuffle([L.L, ...near.slice(0, nOpt - 1)]) });
    Q.push({ t: 'listenPick', ans: pics[0], opts: shuffle([pics[0], ...others(nOpt - 1)]) });
    Q.push({ t: 'trace', glyph: L.L, d });
    Q.push({ t: 'trace', glyph: L.L.toLowerCase(), d });
    const prev = shuffle(lettersUpTo(L.i).filter(x => x !== L.L));
    const partners = (prev.length >= nPairs - 1 ? prev : near).slice(0, nPairs - 1);
    Q.push({ t: 'match', pairs: [L.L, ...partners].map(x => ({ k: x, a: `<span class="l">${x}</span>`, b: `<span class="l">${x.toLowerCase()}</span>`, speak: () => sayLetter(x) })) });
    if (starts.length && d >= .15) { const w = pick(starts); Q.push({ t: 'traceWord', word: w[0], pic: w[1], idx: 0, d }); }
    else if (starts.length) Q.push({ t: 'firstLetter', word: pick(starts), ans: L.L.toLowerCase(), opts: shuffle([L.L, ...near.slice(0, nOpt - 1)]).map(x => x.toLowerCase()) });
    const good = L.end ? pics.filter(p => p[0].includes(L.L.toLowerCase())) : starts;
    if (good.length) {
      const g = shuffle(good).slice(0, d < .4 ? 1 : 2);
      const bad = others(5 - g.length, p => L.end ? !p[0].includes(L.L.toLowerCase()) : p[0][0].toUpperCase() !== L.L);
      Q.push({ t: 'circle', mode: L.end ? 'with' : 'start', L: L.L, good: g, items: shuffle([...g, ...bad]) });
    }
    Q.push({ t: 'caseMatch', ans: L.L, opts: shuffle([L.L, ...near.slice(3, 3 + nOpt - 1)]) });
    if (spellable.length) Q.push({ t: 'build', word: pick(spellable), decoys: 1 + Math.round(d * 2) });
    return Q;
  }
  if (L.type === 'vocab') {
    const pics = shuffle(L.pics); const k = i => pics[i % pics.length];
    const optsFor = a => shuffle([a, ...shuffle(pics.filter(p => p !== a)).slice(0, nOpt - 2), ...others(1)]);
    Q.push({ t: 'listenPick', ans: k(0), opts: optsFor(k(0)) });
    Q.push({ t: 'readPick', ans: k(1), opts: optsFor(k(1)) });
    Q.push({ t: 'match', pairs: shuffle(pics).slice(0, Math.min(nPairs, pics.length)).map(p => ({ k: p[0], a: `<span class="pic">${p[1]}</span>`, b: `<span class="w">${p[0]}</span>`, speak: () => say(p[0]) })) });
    Q.push({ t: 'picWord', ans: k(2), opts: optsFor(k(2)) });
    Q.push({ t: 'circle', mode: 'word', good: [k(3)], items: shuffle([k(3), ...shuffle(pics.filter(p => p !== k(3))).slice(0, 2), ...others(2)]) });
    Q.push({ t: 'listenPick', ans: k(4), opts: optsFor(k(4)) });
    if (spellable.length) Q.push({ t: 'build', word: pick(spellable), decoys: 1 + Math.round(d * 2) });
    return Q;
  }
  if (L.type === 'numbers') {
    const pool = uniq(L.n.concat(LV.slice(0, L.i).filter(x => x.type === 'numbers').flatMap(x => x.n)));
    const numOpts = a => shuffle([a, ...shuffle(uniq(pool.concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => Math.abs(x - a) <= 3)))).filter(x => x !== a).slice(0, nOpt - 1)]);
    const things = ['🍎', '🐱', '🚗', '⭐', '🐸', '🎈', '🍊', '🦆', '✏️', '📕'];
    const ns = shuffle(L.n);
    Q.push({ t: 'count', n: ns[0], thing: pick(things), opts: numOpts(ns[0]) });
    Q.push({ t: 'hearNum', n: ns[1], opts: numOpts(ns[1]) });
    Q.push({ t: 'trace', glyph: String(ns[0]), d, num: true });
    Q.push({ t: 'match', pairs: shuffle(pool).slice(0, nPairs).map(n => ({ k: n, a: `<span class="l">${n}</span>`, b: `<span class="w">${NUM[n]}</span>`, speak: () => say(NUM[n]) })) });
    Q.push({ t: 'count', n: ns[2 % ns.length], thing: pick(things), opts: numOpts(ns[2 % ns.length]) });
    const big = Math.max(...L.n); const a = 1 + (Math.random() * (big - 1) | 0);
    Q.push({ t: 'sum', a, b: big - a, thing: pick(things), opts: numOpts(big) });
    Q.push({ t: 'numWord', n: ns[1], opts: numOpts(ns[1]) });
    (L.extra || []).forEach(([c]) => Q.push({ t: 'hearColor', ans: c, opts: shuffle([c, ...shuffle(Object.keys(COL).filter(x => x !== c)).slice(0, nOpt - 1)]) }));
    return Q;
  }
  if (L.type === 'colors') {
    const cs = shuffle(L.c);
    const o = (a, n) => shuffle([a, ...shuffle(L.c.filter(x => x !== a)).slice(0, n - 1)]);
    Q.push({ t: 'hearColor', ans: cs[0], opts: o(cs[0], nOpt) });
    Q.push({ t: 'colorWord', ans: cs[1], opts: o(cs[1], 3) });
    Q.push({ t: 'match', pairs: cs.slice(2, 2 + nPairs).map(c => ({ k: c, a: `<span class="blob sm" style="background:${COL[c]}"></span>`, b: `<span class="w">${c}</span>`, speak: () => say(c) })) });
    Q.push({ t: 'hearColor', ans: cs[3], opts: o(cs[3], 5) });
    const obj = pick(window.OBJCOLOR);
    Q.push({ t: 'objColor', obj, ans: obj[2], opts: o(obj[2], 3) });
    Q.push({ t: 'colorWord', ans: cs[4], opts: o(cs[4], 4) });
    Q.push({ t: 'hearColor', ans: cs[5], opts: o(cs[5], 6) });
    return Q;
  }
  if (L.type === 'spell') {
    const ws = shuffle(L.words);
    Q.push({ t: 'build', word: ws[0], decoys: 1 });
    Q.push({ t: 'hearWord', ans: ws[1], opts: shuffle([ws[1], ...shuffle(L.words.filter(x => x !== ws[1])).slice(0, 2)]) });
    Q.push({ t: 'build', word: ws[2], decoys: 2 });
    Q.push({ t: 'match', pairs: ws.slice(0, nPairs).map(w => ({ k: w, a: `<span class="pic">${picOf(w)}</span>`, b: `<span class="w">${w}</span>`, speak: () => say(w) })) });
    Q.push({ t: 'traceWord', word: ws[3], pic: picOf(ws[3]), idx: -1, d });
    Q.push({ t: 'build', word: ws[4], decoys: 3 });
    Q.push({ t: 'hearWord', ans: ws[5], opts: shuffle([ws[5], ...shuffle(L.words.filter(x => x !== ws[5])).slice(0, 3)]) });
    return Q;
  }
  if (L.type === 'prep') {
    Q.push({ t: 'prepPick', ans: 'in', obj: 'box' });
    Q.push({ t: 'prepHear', ans: 'under' });
    Q.push({ t: 'prepPick', ans: 'under', obj: 'table' });
    Q.push({ t: 'prepHear', ans: 'on' });
    Q.push({ t: 'prepPick', ans: 'on', obj: 'table' });
    Q.push({ t: 'prepHear', ans: 'in' });
    Q.push({ t: 'prepPick', ans: pick(['in', 'on']), obj: 'box' });
    return Q;
  }
  return Q;
}

function startPlay() {
  const L = RUN.L; RUN.phase = 'play'; RUN.qs = buildQuestions(L); RUN.k = 0; RUN.mistakes = 0; RUN.streak = 0;
  nextQ();
}
async function nextQ() {
  const R = RUN; if (!R || R.dead) return;
  setProg(R.k, R.qs.length);
  if (R.k >= R.qs.length) return finish();
  const q = R.qs[R.k];
  renderQ(q, async ok => {
    if (RUN !== R || !ok) return;
    R.k++; if (!q.missed) { R.streak++; R.best = Math.max(R.best, R.streak); } setCombo(R.streak);
    if (R.streak > 0 && R.streak % 5 === 0 && !q.missed) { toast(`🔥 كومبو ${AR(R.streak)}! +${AR(5)} 💎`); S.gems += 5; save(); SFX.sticker(); await buddy('happy', 'combo'); }
    else if (R.streak > 0 && R.streak % 3 === 0 && !q.missed) await celebrate();
    else { SFX.good(); await buddy('happy', pick(GOOD)); }
    nextQ();
  });
}
function wrong(q) {
  RUN.mistakes++; RUN.streak = 0; if (q) q.missed = true; setCombo(0);
  if (RUN.onWrong) return RUN.onWrong();
  SFX.bad(); buddy('oops', pick(TRY));
}

/* ---------- عرض سؤال ---------- */
function renderQ(q, done, host) {
  const s = host || stage(); const c = el('div', 'q panel'); s.appendChild(c);
  const h = el('h2'); c.appendChild(h);
  const pr = el('div', 'prompt'); c.appendChild(pr);
  const opts = el('div', 'opts'); c.appendChild(opts);
  let locked = false;
  const sayBtn = fn => { const b = el('button', 'say-btn', '🔊'); b.onclick = async () => { SFX.click(); b.classList.add('playing'); await fn(); b.classList.remove('playing'); }; pr.appendChild(b); return b; };
  const option = (html, isAns, cls = '', after) => {
    const b = el('button', 'opt ' + cls, html); if (TEST && isAns) b.dataset.ok = 1;
    b.onclick = async () => {
      if (locked) return;
      if (isAns) { locked = true; b.classList.add('good'); opts.querySelectorAll('.opt').forEach(o => o !== b && o.classList.add('dim')); if (after) await after(); await sleep(250); done(true); }
      else { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 500); wrong(q); }
    };
    opts.appendChild(b); return b;
  };
  const cols = n => opts.style.setProperty('--n', n);
  const picOpt = p => `<span class="pic">${p[1]}</span>`;
  const run = fn => setTimeout(fn, 250);
  const title = (ar, en) => { h.innerHTML = `${ar} <span class="en">${en}</span>`; };

  switch (q.t) {
    case 'hearLetter': {
      title('اِسْمَعْ وَاخْتَرِ الْحَرْفَ', 'Find the letter');
      const sp = () => sayLetter(q.ans); sayBtn(sp); cols(q.opts.length);
      q.opts.forEach((x, i) => option(`<span class="l">${i % 2 ? x.toLowerCase() : x}</span>`, x === q.ans, '', () => sayLetter(x)));
      run(() => chain(() => venom('findLetter'), sp)); break;
    }
    case 'listenPick': {
      title('اِسْمَعْ وَاخْتَرِ الصّورَةَ', 'Listen and choose');
      const sp = () => say(q.ans[0]); sayBtn(sp); cols(q.opts.length);
      q.opts.forEach(p => option(picOpt(p), p === q.ans, '', () => say(p[0])));
      run(sp); break;
    }
    case 'readPick': {
      title('اِقْرَأْ وَاخْتَرِ الصّورَةَ', 'Read and choose');
      pr.appendChild(el('div', 'big-word', q.ans[0])); cols(q.opts.length);
      q.opts.forEach(p => option(picOpt(p), p === q.ans, '', () => say(p[0])));
      run(() => venom('read')); break;
    }
    case 'picWord': {
      title('ما اسْمُ الصّورَةِ؟', 'What is it?');
      pr.appendChild(el('div', 'big-pic', q.ans[1])); cols(q.opts.length);
      q.opts.forEach(p => option(`<span class="w">${p[0]}</span>`, p === q.ans, '', () => say(p[0])));
      run(() => venom('whatsThis')); break;
    }
    case 'caseMatch': {
      title('أَيْنَ الْحَرْفُ الْكَبيرُ؟', 'Find the big letter');
      pr.appendChild(el('div', 'big-word', `<span class="hl">${q.ans.toLowerCase()}</span> → ?`)); cols(q.opts.length);
      q.opts.forEach(x => option(`<span class="l">${x}</span>`, x === q.ans, '', () => sayLetter(x)));
      run(() => venom('bigLetter')); break;
    }
    case 'firstLetter': {
      title('ما الْحَرْفُ النّاقِصُ؟', 'Write the missing letter');
      const w = q.word[0]; pr.appendChild(el('div', 'big-pic', q.word[1]));
      const bw = el('div', 'big-word', `<span class="gap">&nbsp;</span>${w.slice(1)}`); pr.appendChild(bw); sayBtn(() => say(w)); cols(q.opts.length);
      q.opts.forEach(x => option(`<span class="l">${x}</span>`, x === q.ans, '', async () => { bw.innerHTML = `<span class="hl">${w[0]}</span>${w.slice(1)}`; await say(w); }));
      run(() => say(w)); break;
    }
    case 'build': return renderBuild(q, c, h, pr, opts, done);
    case 'trace': case 'traceWord': return renderTrace(q, c, h, pr, opts, done);
    case 'match': return renderMatch(q, c, h, pr, opts, done);
    case 'circle': return renderCircle(q, c, h, pr, opts, done);
    case 'hearWord': {
      title('اِسْمَعْ وَاخْتَرِ الْكَلِمَةَ', 'Listen and choose the word');
      const sp = () => say(q.ans); sayBtn(sp); cols(q.opts.length);
      q.opts.forEach(w => option(`<span class="w">${w}</span>`, w === q.ans, '', () => say(w)));
      run(sp); break;
    }
    case 'count': {
      title('عُدَّ وَاخْتَرْ', 'Count');
      const b = el('div', 'count-box'); for (let i = 0; i < q.n; i++) { const x = el('span', '', q.thing); x.style.animationDelay = i * .08 + 's'; b.appendChild(x); } pr.appendChild(b); cols(q.opts.length);
      q.opts.forEach(n => option(`<span class="l">${n}</span>`, n === q.n, '', () => say(NUM[n])));
      run(() => venom('howMany')); break;
    }
    case 'hearNum': {
      title('اِسْمَعْ وَاخْتَرِ الرَّقْمَ', 'Listen');
      const sp = () => say(NUM[q.n]); sayBtn(sp); cols(q.opts.length);
      q.opts.forEach(n => option(`<span class="l">${n}</span>`, n === q.n, '', () => say(NUM[n])));
      run(sp); break;
    }
    case 'numWord': {
      title('اِقْرَأْ وَاخْتَرِ الرَّقْمَ', 'Read');
      pr.appendChild(el('div', 'big-word', NUM[q.n])); cols(q.opts.length);
      q.opts.forEach(n => option(`<span class="l">${n}</span>`, n === q.n, '', () => say(NUM[n])));
      break;
    }
    case 'sum': {
      title('اِجْمَعْ', 'Add');
      const g = n => `<span class="grp">${q.thing.repeat(n)}</span>`;
      pr.appendChild(el('div', 'sum', `${g(q.a)}<span>+</span>${g(q.b)}<span>=</span><span class="gap" style="color:var(--rose)">?</span>`)); cols(q.opts.length);
      q.opts.forEach(n => option(`<span class="l">${n}</span>`, n === q.a + q.b, '', () => say(NUM[q.a + q.b])));
      run(() => venom('add')); break;
    }
    case 'hearColor': {
      title('اِسْمَعْ وَاخْتَرِ اللَّوْنَ', 'Colours');
      const sp = () => say(q.ans); sayBtn(sp); cols(q.opts.length > 4 ? 3 : q.opts.length);
      q.opts.forEach(x => option(`<span class="blob" style="background:${COL[x]}"></span>`, x === q.ans, '', () => say(x)));
      run(sp); break;
    }
    case 'colorWord': {
      title('ما هٰذا اللَّوْنُ؟', 'What colour is it?');
      pr.appendChild(el('span', 'blob', '')).style.cssText = `background:${COL[q.ans]};width:150px;height:150px`; cols(q.opts.length);
      q.opts.forEach(x => option(`<span class="w">${x}</span>`, x === q.ans, '', () => say(x)));
      run(() => venom('whatColour')); break;
    }
    case 'objColor': {
      h.innerHTML = `<span class="en">What colour is the ${q.obj[0]}?</span>`;
      pr.appendChild(el('div', 'big-pic', q.obj[1])); cols(q.opts.length);
      q.opts.forEach(x => option(`<span class="blob" style="background:${COL[x]};width:80px;height:80px"></span><span class="w" style="font-size:28px">${x}</span>`, x === q.ans, '', () => say(`It is ${x}.`)));
      run(() => say(`What colour is the ${q.obj[0]}?`)); break;
    }
    case 'prepPick': {
      h.innerHTML = `<span class="en">Where is the cat?</span>`;
      pr.appendChild(scene(q.ans, q.obj)); cols(3);
      ['in', 'on', 'under'].forEach(p => option(`<span class="w">${p}</span>`, p === q.ans, '', () => say(`The cat is ${q.ans} the ${q.obj}.`)));
      run(() => venom('whereCat')); break;
    }
    case 'prepHear': {
      title('اِسْمَعْ وَاخْتَرِ الصّورَةَ', 'Listen and choose');
      const obj = p => p === 'under' ? 'table' : 'box';
      const t = `The cat is ${q.ans} the ${obj(q.ans)}.`;
      sayBtn(() => say(t)); cols(3);
      shuffle(['in', 'on', 'under']).forEach(p => option(scene(p, obj(p)).outerHTML, p === q.ans));
      run(() => say(t)); break;
    }
  }
}
function scene(p, obj) {
  const d = el('div', 'scene');
  if (obj === 'table') d.innerHTML = `<div class="table"><div class="top"></div><div class="leg" style="left:10px"></div><div class="leg" style="right:10px"></div></div><span class="cat ${p === 'under' ? 'utable' : 'on'}">🐱</span>`;
  else d.innerHTML = `<div class="box ${p === 'in' ? 'open' : ''}"></div><span class="cat ${p}">🐱</span>`;
  return d;
}
function sayBtn0(pr, fn) { const b = el('button', 'say-btn', '🔊'); b.onclick = async () => { SFX.click(); b.classList.add('playing'); await fn(); b.classList.remove('playing'); }; pr.appendChild(b); }

/* ---------- رتّب الحروف ---------- */
function renderBuild(q, c, h, pr, opts, done) {
  const w = q.word; const pic = picOf(w);
  h.innerHTML = 'رَتِّبِ الْحُروفَ <span class="en">Build the word</span>';
  if (pic) pr.appendChild(el('div', 'big-pic', pic)); sayBtn0(pr, () => say(w));
  const slots = el('div', 'slots'); const tiles = el('div', 'tiles'); if (TEST) tiles.dataset.word = w;
  const letters = w.split(''); let pos = 0;
  letters.forEach(() => slots.appendChild(el('div', 'slot', '')));
  const extra = shuffle('abcdefghijklmnoprstuvwxyz'.split('').filter(x => !letters.includes(x))).slice(0, q.decoys || 1);
  shuffle(letters.concat(extra)).forEach(ch => {
    const t = el('button', 'tile', ch);
    t.onclick = async () => {
      if (pos >= letters.length) return;
      if (ch === letters[pos]) { SFX.pop(); const sl = slots.children[pos]; sl.textContent = ch; sl.classList.add('full'); t.classList.add('used'); pos++;
        if (pos === letters.length) { await sleep(200); await say(w); done(true); } }
      else { t.classList.add('bad'); setTimeout(() => t.classList.remove('bad'), 450); wrong(q); }
    };
    tiles.appendChild(t);
  });
  opts.remove(); c.append(slots, tiles);
  setTimeout(() => chain(() => venom('build'), () => say(w)), 250);
}

/* ---------- الكتابة بالقلم: تتبّع الحرف ---------- */
/* نرسم الحرف منقّطاً، ويكتب إيليا فوقه بقلم الآيباد. نقيس ما غطّاه من الحرف وما خرج عنه */
function renderTrace(q, c, h, pr, opts, done) {
  const isWord = q.t === 'traceWord';
  const word = isWord ? q.word : q.glyph;
  const whole = isWord && q.idx < 0;
  const [pre, tgt, post] = whole ? ['', word, ''] : isWord ? [word.slice(0, q.idx), word[q.idx], word.slice(q.idx + 1)] : ['', word, ''];
  if (whole) h.innerHTML = 'اُكْتُبِ الْكَلِمَةَ بِالْقَلَمِ ✏️ <span class="en">Trace the word</span>';
  else if (isWord) h.innerHTML = 'اُكْتُبِ الْحَرْفَ النّاقِصَ بِالْقَلَمِ ✏️ <span class="en">Trace the missing letter</span>';
  else h.innerHTML = `اُكْتُبْ بِالْقَلَمِ فَوْقَ النِّقاطِ ✏️ <span class="en">Trace the ${q.num ? 'number' : 'letter'}</span>`;
  if (q.pic) pr.appendChild(el('div', 'big-pic sm', q.pic));
  const speak = () => isWord ? say(word) : q.num ? say(NUM[+word]) : sayLetter(word.toUpperCase());
  sayBtn0(pr, speak);
  const box = el('div', 'trace-box' + (whole ? ' wide' : '')); const bg = el('canvas'), ink = el('canvas'); box.append(bg, ink);
  const tools = el('div', 'trace-tools'); const clr = el('button', 'btn', '↺ <span>امْسَحْ</span>'), ok = el('button', 'btn go', '✓ <span>تَمَّ</span>');
  tools.append(clr, ok); opts.remove(); c.append(box, tools);
  const tol = 40 - 16 * (q.d || 0);                 // سماحية الخروج تضيق مع الصعوبة
  const need = .6 + .18 * (q.d || 0);               // نسبة التغطية المطلوبة تكبر
  const pen = 16;
  let Wd = 0, Ht = 0, samples = [], covered = new Uint8Array(0), maskData = null, nPts = 0, outside = 0, penSeen = false, finished = false;
  const color = W[RUN.L.world - 1].color;
  requestAnimationFrame(() => (document.fonts ? document.fonts.load('700 100px Andika') : Promise.resolve()).then(setup));
  function setup() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    Wd = box.clientWidth; Ht = box.clientHeight; if (!Wd) return;
    [bg, ink].forEach(cv => { cv.width = Wd * dpr; cv.height = Ht * dpr; cv.style.width = Wd + 'px'; cv.style.height = Ht + 'px'; cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
    const g = bg.getContext('2d'); g.direction = 'ltr'; g.textAlign = 'left';
    let F = Ht * .8; g.font = `700 ${F}px Andika`;
    const full = pre + tgt + post; let m = g.measureText(full);
    if (m.width > Wd * .88) { F *= Wd * .88 / m.width; g.font = `700 ${F}px Andika`; m = g.measureText(full); }
    const asc = F * .72, x0 = (Wd - m.width) / 2, y = Ht * .5 + asc * .5 + F * .02;
    const xT = x0 + g.measureText(pre).width;
    g.strokeStyle = 'rgba(226,96,79,.4)'; g.lineWidth = 2; [y - asc, y].forEach(yy => { g.beginPath(); g.moveTo(8, yy); g.lineTo(Wd - 8, yy); g.stroke(); });
    g.strokeStyle = 'rgba(47,111,143,.3)'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(8, y - asc * .66); g.lineTo(Wd - 8, y - asc * .66); g.stroke(); g.setLineDash([]);
    g.textBaseline = 'alphabetic'; g.fillStyle = '#3b2f22';
    if (pre) g.fillText(pre, x0, y); if (post) g.fillText(post, xT + g.measureText(tgt).width, y);
    g.fillStyle = '#ece2cb'; g.fillText(tgt, xT, y);
    g.setLineDash([6, 7]); g.lineWidth = 3; g.strokeStyle = '#9c8762'; g.strokeText(tgt, xT, y); g.setLineDash([]);
    const mc = document.createElement('canvas'); mc.width = Wd; mc.height = Ht; const mx = mc.getContext('2d'); mx.direction = 'ltr'; mx.textAlign = 'left';
    mx.font = g.font; mx.textBaseline = 'alphabetic'; mx.fillStyle = '#000'; mx.fillText(tgt, xT, y);
    const inner = mx.getImageData(0, 0, Wd, Ht).data;
    const step = Math.max(4, Math.round(F / 45));
    for (let yy = 0; yy < Ht; yy += step) for (let xx = 0; xx < Wd; xx += step) if (inner[(yy * Wd + xx) * 4 + 3] > 128) samples.push([xx, yy]);
    covered = new Uint8Array(samples.length);
    mx.lineWidth = tol; mx.lineJoin = 'round'; mx.strokeStyle = '#000'; mx.strokeText(tgt, xT, y);
    maskData = mx.getImageData(0, 0, Wd, Ht).data;
  }
  const ctx = () => ink.getContext('2d');
  const P = e => { const r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let drawing = false, last = null;
  const R2 = (pen / 2 + 8) ** 2;
  const mark = ([x, y]) => {
    nPts++;
    const inMask = x >= 0 && y >= 0 && x < Wd && y < Ht && maskData && maskData[((y | 0) * Wd + (x | 0)) * 4 + 3] > 0;
    if (!inMask) outside++;
    for (let i = 0; i < samples.length; i++) if (!covered[i]) { const dx = samples[i][0] - x, dy = samples[i][1] - y; if (dx * dx + dy * dy < R2) covered[i] = 1; }
  };
  ink.addEventListener('pointerdown', e => {
    if (finished || !samples.length) return;
    if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;   // تجاهل راحة اليد مع القلم
    e.preventDefault(); cap(ink, e.pointerId); drawing = true; last = P(e); mark(last);
    const x = ctx(); x.strokeStyle = color; x.lineWidth = pen; x.lineCap = x.lineJoin = 'round'; x.beginPath(); x.moveTo(...last); x.lineTo(last[0] + .1, last[1]); x.stroke();
  });
  ink.addEventListener('pointermove', e => {
    if (!drawing) return; e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const x = ctx(); x.strokeStyle = color; x.lineWidth = pen * (e.pointerType === 'pen' && e.pressure ? .8 + e.pressure * .5 : 1); x.lineCap = x.lineJoin = 'round';
    (evs.length ? evs : [e]).forEach(ev => { const p = P(ev); x.beginPath(); x.moveTo(...last); x.lineTo(...p); x.stroke(); last = p; mark(p); });
    if (Math.random() < .12) SFX.ink();
  });
  const up = () => { if (!drawing) return; drawing = false; if (score().pass) win(); };
  ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up);
  function score() { const cov = covered.reduce((a, b) => a + b, 0) / (samples.length || 1); const out = outside / (nPts || 1); return { cov, out, pass: cov >= need && out <= .3 }; }
  function reset() { ctx().clearRect(0, 0, Wd, Ht); covered.fill(0); nPts = 0; outside = 0; }
  async function win() {
    if (finished) return; finished = true; SFX.good(); box.classList.add('done');
    const r = box.getBoundingClientRect(); burst(22, r.left + r.width / 2, r.top + r.height / 2);
    await speak(); done(true);
  }
  clr.onclick = () => { SFX.click(); if (!finished) reset(); };
  ok.onclick = () => {
    if (finished) return; const s = score();
    if (s.pass) return win();
    SFX.bad(); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    toast(nPts && s.out > .3 ? 'خَرَجْتَ عَنِ الْحَرْفِ، اُكْتُبْ فَوْقَ النِّقاطِ 🙂' : 'أَكْمِلِ الْكِتابَةَ فَوْقَ النِّقاطِ كُلِّها ✏️');
    wrong(q); setTimeout(reset, 400);
  };
  if (TEST) { box.dataset.test = 1; box._win = win; }
  setTimeout(() => chain(() => venom(whole ? 'traceWhole' : isWord ? 'traceWord' : q.num ? 'traceNum' : 'trace'), speak), 250);
}

/* ---------- التوصيل بخط ---------- */
function renderMatch(q, c, h, pr, opts, done) {
  h.innerHTML = 'صِلْ بِخَطٍّ بِالْقَلَمِ ✏️ <span class="en">Match</span>';
  opts.remove();
  const m = el('div', 'match'); const A = el('div', 'mcol'), B = el('div', 'mcol r');
  const svgNS = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'mlines');
  m.append(svg, A, B); c.appendChild(m);
  const mk = (p, side) => { const it = el('div', 'mi ' + side, (side === 'a' ? p.a : p.b) + '<i class="dot"></i>'); it.dataset.k = p.k; return it; };
  shuffle(q.pairs).forEach(p => A.appendChild(mk(p, 'a'))); shuffle(q.pairs).forEach(p => B.appendChild(mk(p, 'b')));
  let remaining = q.pairs.length, from = null, line = null, pid = null, moved = false;
  m.style.setProperty('--wc', W[RUN.L.world - 1].color);
  const center = it => { const r = it.querySelector('.dot').getBoundingClientRect(), mr = m.getBoundingClientRect(); return [r.left + r.width / 2 - mr.left, r.top + r.height / 2 - mr.top]; };
  const mkLine = (a, b, cls) => { const l = document.createElementNS(svgNS, 'line'); l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]); l.setAttribute('class', cls); svg.appendChild(l); return l; };
  const connect = async (a, b) => {
    if (a.classList.contains('b')) [a, b] = [b, a];
    if (a.dataset.k === b.dataset.k) {
      mkLine(center(a), center(b), 'fixed'); a.classList.add('done'); b.classList.add('done'); SFX.pop();
      const p = q.pairs.find(x => String(x.k) === a.dataset.k); if (p && p.speak) p.speak();
      if (--remaining === 0) { await sleep(700); done(true); }
    } else {
      const l = mkLine(center(a), center(b), 'wrong'); setTimeout(() => l.remove(), 500);
      [a, b].forEach(x => { x.classList.remove('bad'); void x.offsetWidth; x.classList.add('bad'); }); wrong(q);
    }
  };
  let tapFirst = null;
  m.addEventListener('pointerdown', e => {
    const it = e.target.closest('.mi'); if (!it || it.classList.contains('done')) return;
    e.preventDefault(); from = it; pid = e.pointerId; moved = false; cap(m, pid); from.classList.add('sel');
    const a = center(it); line = mkLine(a, a, 'temp');
  });
  m.addEventListener('pointermove', e => {
    if (!line || e.pointerId !== pid) return; e.preventDefault(); moved = true;
    const mr = m.getBoundingClientRect(); line.setAttribute('x2', e.clientX - mr.left); line.setAttribute('y2', e.clientY - mr.top);
  });
  const up = e => {
    if (!line || e.pointerId !== pid) return;
    line.remove(); line = null; const f = from; from = null;
    const t = document.elementFromPoint(e.clientX, e.clientY); const to = t && t.closest('.mi');
    if (to && to !== f && !to.classList.contains('done') && to.classList.contains('a') !== f.classList.contains('a')) { f.classList.remove('sel'); if (tapFirst) tapFirst.classList.remove('sel'); tapFirst = null; return connect(f, to); }
    // ضغطة بلا سحب: اختر الأول ثم الثاني
    if (to === f) {
      if (tapFirst && tapFirst !== f && tapFirst.classList.contains('a') !== f.classList.contains('a')) { const a = tapFirst; tapFirst = null; a.classList.remove('sel'); f.classList.remove('sel'); return connect(a, f); }
      if (tapFirst) tapFirst.classList.remove('sel'); tapFirst = f; SFX.click(); return;
    }
    f.classList.remove('sel');
  };
  m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
  if (TEST) { m.dataset.test = 1; m._solve = () => [...A.children].forEach(a => connect(a, [...B.children].find(b => b.dataset.k === a.dataset.k))); }
  setTimeout(() => venom('match'), 250);
}

/* ---------- ارسم دائرة حول الصورة الصحيحة ---------- */
function renderCircle(q, c, h, pr, opts, done) {
  opts.remove();
  let intro;
  if (q.mode === 'word') { h.innerHTML = 'اِسْمَعْ وَارْسُمْ دائِرَةً حَوْلَ الصّورَةِ ⭕ <span class="en">Circle it</span>'; intro = () => chain(() => venom('circleWord'), () => say(q.good[0][0])); }
  else { h.innerHTML = `اِرْسُمْ دائِرَةً حَوْلَ كُلِّ صورَةٍ ${q.mode === 'with' ? 'فيها' : 'تَبْدَأُ بِـ'} <b class="en" style="display:inline;color:var(--rose)">${q.L}</b> ⭕` + (q.good.length > 1 ? ` <small>(${AR(q.good.length)})</small>` : ''); intro = () => chain(() => venom(q.mode === 'with' ? 'circleWith' : 'circleStart'), () => sayLetter(q.L)); }
  sayBtn0(pr, intro);
  const area = el('div', 'lasso'); const cv = el('canvas'); c.appendChild(area);
  const need = q.good.length; let got = 0, finished = false;
  q.items.forEach(p => {
    const it = el('div', 'li', `<span class="pic">${p[1]}</span>`); it.dataset.w = p[0];
    it.style.setProperty('--rot', (Math.random() * 16 - 8) + 'deg'); area.appendChild(it);
  });
  area.appendChild(cv);
  let Wd = 0, Ht = 0, pts = [], drawing = false, penSeen = false, pid;
  requestAnimationFrame(() => { const dpr = Math.min(2, devicePixelRatio || 1); Wd = area.clientWidth; Ht = area.clientHeight; cv.width = Wd * dpr; cv.height = Ht * dpr; cv.style.width = Wd + 'px'; cv.style.height = Ht + 'px'; cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
  const P = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const g = () => cv.getContext('2d');
  cv.addEventListener('pointerdown', e => {
    if (finished) return; if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return;
    e.preventDefault(); cap(cv, e.pointerId); pid = e.pointerId; drawing = true; pts = [P(e)];
  });
  cv.addEventListener('pointermove', e => {
    if (!drawing || e.pointerId !== pid) return; e.preventDefault();
    const p = P(e), l = pts[pts.length - 1]; pts.push(p);
    const x = g(); x.strokeStyle = '#e2604f'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(...l); x.lineTo(...p); x.stroke();
  });
  const inside = (pt, poly) => { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) r = !r; } return r; };
  const judge = poly => {
    const cr = cv.getBoundingClientRect();
    const hits = [...area.querySelectorAll('.li:not(.circled)')].filter(it => { const r = it.getBoundingClientRect(); return inside([r.left + r.width / 2 - cr.left, r.top + r.height / 2 - cr.top], poly); });
    if (!hits.length) return;
    const bad = hits.filter(it => !q.good.some(p => p[0] === it.dataset.w));
    if (bad.length) { bad.forEach(it => { it.classList.remove('bad'); void it.offsetWidth; it.classList.add('bad'); }); wrong(q); return; }
    hits.forEach(it => { it.classList.add('circled'); got++; say(it.dataset.w); });
    SFX.pop();
    if (got >= need) { finished = true; setTimeout(() => done(true), 800); }
  };
  const up = () => {
    if (!drawing) return; drawing = false; g().clearRect(0, 0, Wd, Ht);
    if (pts.length < 8) return;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const gapEnd = Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
    if (bw < 50 || bh < 50 || gapEnd > Math.max(bw, bh) * .6) { toast('اِرْسُمْ دائِرَةً مُغْلَقَةً حَوْلَ الصّورَةِ ⭕'); return; }
    judge(pts);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  if (TEST) { area.dataset.test = 1; area._solve = () => { const cr = cv.getBoundingClientRect(); area.querySelectorAll('.li').forEach(it => { if (!q.good.some(p => p[0] === it.dataset.w)) return; const r = it.getBoundingClientRect(); const cx = r.left + r.width / 2 - cr.left, cy = r.top + r.height / 2 - cr.top, R = r.width * .6; judge(Array.from({ length: 24 }, (_, i) => [cx + R * Math.cos(i / 24 * 6.283), cy + R * Math.sin(i / 24 * 6.283)])); }); }; }
  setTimeout(intro, 250);
}

/* ---------- النهاية ---------- */
async function finish() {
  const R = RUN; const L = R.L; R.phase = 'done';
  const st = L.type === 'boss' ? (R.hearts >= 3 ? 3 : R.hearts === 2 ? 2 : 1) : (R.mistakes <= 1 ? 3 : R.mistakes <= 3 ? 2 : 1);
  const prev = starsOf(L.i); const gain = Math.max(0, st - prev) * 5 + (L.type === 'boss' ? 20 : 5);
  S.done[L.i] = Math.max(prev, st); S.gems += gain;
  // الملصقات: جديدة، أو تصير ذهبية مع ٣ نجوم
  const news = [];
  stickersOf(L).forEach(s => { const had = S.stickers[s.k] || 0; const lvl = st === 3 ? 2 : 1; if (lvl > had) { S.stickers[s.k] = lvl; news.push({ s, gold: lvl === 2, up: had > 0 }); } });
  save();
  setProg(1, 1); SFX.win();
  await celebrate(L.type === 'boss' ? 'won' : st === 3 ? 'hero' : undefined);
  if (RUN !== R) return;
  const s = stage(); const c = el('div', 'result panel');
  const nextL = LV[L.i + 1];
  const newWorld = nextL && nextL.world !== L.world;
  c.innerHTML = `<h2 class="en">${L.type === 'boss' ? 'You won!' : 'Well done!'}</h2>
    <div class="big-stars">${[1, 2, 3].map((k, i) => `<i class="${k <= st ? 'on' : ''}" style="animation-delay:${i * .25}s">★</i>`).join('')}</div>
    ${news.length ? `<div class="new-st"><b>📒 ${news.some(n => !n.up) ? 'مُلْصَقاتٌ جَديدَةٌ لِأَلْبومِكَ!' : 'صارَتْ مُلْصَقاتُكَ ذَهَبِيَّةً!'}</b><div class="row">${news.map((n, i) => `<div class="sticker got ${n.gold ? 'gold' : ''} ${n.s.cls || ''} fly" style="animation-delay:${.5 + i * .18}s">${stickerHtml(n.s)}<span class="w">${n.s.label}</span></div>`).join('')}</div></div>` : `<img src="img/${L.type === 'boss' ? 'team_win' : 'elia_cheer'}.webp?v=2" alt="">`}
    <p>+${AR(gain)} 💎${R.best >= 5 ? ` · 🔥 ${AR(R.best)}` : ''}${st < 3 && L.type !== 'boss' ? '<br><small>اِلْعَبْها مَرَّةً ثانِيَةً بِخَطَأٍ واحِدٍ أَوْ أَقَلَّ لِتَصيرَ مُلْصَقاتُكَ ذَهَبِيَّةً ✨</small>' : ''}${newWorld ? `<br>🎉 فُتِحَ عالَمٌ جَديدٌ: <span class="en">${W[nextL.world - 1].title}</span>` : ''}${L.final ? '<br>🏆 أَنْهَيْتَ كِتابَ الْإِنْجِليزِيِّ كُلَّهُ!' : ''}</p>`;
  const row = el('div', 'row');
  const again = el('button', 'btn', '↻ <span>مَرَّةً أُخْرى</span>'); again.onclick = () => { SFX.click(); startLevel(L); };
  const map = el('button', 'btn', '🗺️ <span>الْخَريطَةُ</span>'); map.onclick = () => { SFX.click(); endRun(); openMap(nextL && newWorld ? nextL.world : L.world); };
  row.append(again, map);
  if (nextL) { const nx = el('button', 'btn go pulse', '▶ <span>التّالي</span>'); nx.onclick = () => { SFX.click(); startLevel(nextL); }; row.appendChild(nx); }
  c.appendChild(row); s.appendChild(c);
  if (news.length) { setTimeout(SFX.sticker, 600); await buddy('happy', 'stickers'); }
  else buddy('happy', st === 3 ? 'perfect' : 'didIt');
}

/* ============ معركة الوحش ============ */
const BOSS_TYPES = ['hearLetter', 'listenPick', 'readPick', 'picWord', 'caseMatch', 'firstLetter', 'hearWord', 'count', 'hearNum', 'numWord', 'sum', 'hearColor', 'colorWord', 'objColor', 'prepPick', 'prepHear'];
function startBoss(L) {
  const R = RUN; R.phase = 'play'; R.hearts = 3; R.hp = L.final ? 10 : 8; R.max = R.hp;
  R.T = 16000 - (L.world - 1) * 2000;               // الوقت يقصر في كل عالم
  const pool = LV.filter(x => x.world === L.world && x.type !== 'boss');
  const qs = [];
  for (let k = 0; k < 40; k++) { const src = pool[k % pool.length]; const b = buildQuestions(src).filter(q => BOSS_TYPES.includes(q.t)); if (b.length) qs.push(pick(b)); }
  R.qs = shuffle(qs); R.k = 0;
  $('#buddy').style.display = 'none'; setHearts(3, 3);
  const s = stage();
  const intro = el('div', 'result panel', `<h2 class="en" style="color:#6b3fb0">${L.title}!</h2>
    <img src="img/goo.webp?v=2" alt="" style="height:min(30vh,240px)">
    <p>وَحْشُ اللُّزوجَةِ سَرَقَ الْحُروفَ! 😱<br>أَجِبْ بِسُرْعَةٍ لِيَضْرِبَهُ فينوم ⚡<br><small>⏱️ ${AR(R.T / 1000)} ثانِيَةً لِكُلِّ سُؤالٍ</small></p>`);
  const go = el('button', 'btn big go pulse', "⚡ <span>Fight!</span>"); go.onclick = () => { SFX.click(); bossRound(); };
  intro.appendChild(go); s.appendChild(intro);
  SFX.goo(); venom('monster');
}
function bossRound() {
  const R = RUN; if (!R || R.dead) return;
  const s = stage();
  setProg(R.max - R.hp, R.max); setHearts(R.hearts, 3);
  const arena = el('div', 'arena');
  arena.innerHTML = `<div class="team"><img class="e" src="img/elia_brave.webp?v=2" alt=""><img class="v" src="img/venom_fight.webp?v=2" alt=""></div>
    <div class="monster"><div class="hp"><i style="width:${R.hp / R.max * 100}%"></i></div><img src="img/goo.webp?v=2" alt=""></div>`;
  s.appendChild(arena);
  const tm = el('div', 'timer', '<i></i>'); s.appendChild(tm);
  const q = R.qs[R.k++ % R.qs.length];
  const t0 = Date.now(); let over = false;
  clearInterval(R.timer);
  R.timer = setInterval(() => { const f = 1 - (Date.now() - t0) / R.T; tm.firstChild.style.transform = `scaleX(${Math.max(0, f)})`; if (f <= 0 && !over) { over = true; clearInterval(R.timer); hurt(); } }, 100);
  const hurt = async () => {
    R.hearts--; setHearts(R.hearts, 3); SFX.goo(); arena.querySelector('.team').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-16px)' }, { transform: 'translateX(0)' }], { duration: 400 });
    if (R.hearts <= 0) { clearInterval(R.timer); await sleep(500); return bossLose(); }
    toast('💔 الْوَحْشُ هَجَمَ!'); await sleep(1100); if (RUN === R) bossRound();
  };
  R.onWrong = () => { if (over) return; over = true; clearInterval(R.timer); hurt(); };
  renderQ(q, async ok => {
    if (!ok || RUN !== R || over) return; over = true; clearInterval(R.timer);
    await zap(arena); R.hp--; arena.querySelector('.hp i').style.width = (R.hp / R.max * 100) + '%';
    if (R.hp <= 0) { R.onWrong = null; await sleep(400); return finish(); }
    await sleep(500); if (RUN === R) bossRound();
  }, s);
}
async function zap(arena) {
  const from = arena.querySelector('.team .v').getBoundingClientRect(), to = arena.querySelector('.monster img').getBoundingClientRect();
  const z = el('i', 'zap'); document.body.appendChild(z); SFX.zap();
  const a = z.animate([{ left: from.right - 40 + 'px', top: from.top + from.height * .35 + 'px', transform: 'scale(.5)' }, { left: to.left + to.width / 2 + 'px', top: to.top + to.height / 2 + 'px', transform: 'scale(2.4)' }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
  await a.finished.catch(() => {}); z.remove();
  const m = arena.querySelector('.monster'); m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit'); SFX.goo(); burst(16, to.left + to.width / 2, to.top + to.height / 2);
  venom(pick(['hit1', 'hit2', 'hit3', 'hit4']));
}
async function bossLose() {
  const R = RUN; R.phase = 'done'; clearInterval(R.timer); stopAll();
  const s = stage(); const c = el('div', 'result panel', `<h2 class="en" style="color:var(--rose)">Oh no!</h2>
    <img src="img/elia_brave.webp?v=2" alt=""><p>انْتَهَتِ الْقُلوبُ… لا بَأْسَ يا بَطَلُ، نُحاوِلُ مَرَّةً ثانِيَةً 💪</p>`);
  const row = el('div', 'row'); const a = el('button', 'btn go pulse', '↻ <span>مَرَّةً أُخْرى</span>'); a.onclick = () => { SFX.click(); startLevel(R.L); };
  const m = el('button', 'btn', '🗺️ <span>الْخَريطَةُ</span>'); m.onclick = () => { SFX.click(); endRun(); openMap(curWorld); };
  row.append(a, m); c.appendChild(row); s.appendChild(c); playClip('tryagain');
}

/* ============ بدء ============ */
renderStats();
if (location.hash === '#map') openMap(S.world || 1);
})();
