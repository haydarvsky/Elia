/* Venom × Elia — ABC STRIKE — محرّك لعبة الأكشن */
(() => {
'use strict';
const WORLDS = window.WORLDS, LV = window.LEVELS, STAGES = window.STAGES, COL = window.COLORS, NUM = window.NUMWORDS;
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uniq = a => a.filter((x, i) => a.indexOf(x) === i);
const TEST = location.hash === '#test';
const FAST = TEST && location.search.includes('fast') ? 3 : 1;   // للاختبار الآلي فقط

/* ================= الحفظ ================= */
const KEY = 'elia-venom-v2';
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S = Object.assign({ done: {}, best: {}, gems: 0, cards: {}, world: 1 }, S);
const CLOUD = window.EliaSave;                    // المزامنة السحابية (assets/save.js)
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} CLOUD && CLOUD.push(); };
const sk = (w, s) => w + '-' + s;
const starsOf = (w, s) => S.done[sk(w, s)] || 0;
const unlocked = (w, s) => TEST || (w === 1 && s === 0) || (s > 0 ? starsOf(w, s - 1) > 0 : starsOf(w - 1, STAGES.length - 1) > 0) || starsOf(w, s) > 0;
const totalStars = () => Object.values(S.done).reduce((a, b) => a + b, 0);

/* ================= المحتوى من المنهج ================= */
const pics = []; LV.forEach(L => (L.w || []).forEach(([w, e]) => { if (e && !pics.some(p => p[0] === w)) pics.push([w, e, L.world]); }));
const POOL = WORLDS.map(Wd => {
  const lv = LV.filter(L => L.world === Wd.id);
  const letters = lv.filter(L => L.type === 'letter').map(L => L.L);
  const mine = pics.filter(p => p[2] === Wd.id);
  const older = pics.filter(p => p[2] < Wd.id);
  const nums = uniq(LV.filter(L => L.world <= Wd.id && L.type === 'numbers').flatMap(L => L.n)).sort((a, b) => a - b);
  const colors = uniq([...(Wd.id >= 3 ? LV.find(L => L.type === 'colors').c : []), 'blue', 'black', 'white', ...(Wd.id >= 2 ? ['brown', 'orange'] : []), ...(Wd.id >= 4 ? ['purple', 'red'] : [])]);
  const spell = uniq([...mine.map(p => p[0]), ...lv.flatMap(L => L.words || [])]).filter(w => /^[a-z]{2,5}$/.test(w) && pics.some(p => p[0] === w));
  const starts = uniq(mine.map(p => p[0][0].toUpperCase())).filter(c => mine.filter(p => p[0][0].toUpperCase() === c).length >= 2);
  return { id: Wd.id, letters, pics: mine, all: mine.concat(shuffle(older).slice(0, 10)), nums, colors, spell, starts };
});
const picOf = w => (pics.find(p => p[0] === w) || [w, '❓'])[1];
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const CONFUSE = { B: 'DPR', D: 'BPO', P: 'BRQ', Q: 'OGP', M: 'NW', N: 'MH', W: 'MV', V: 'UWY', U: 'VN', E: 'FB', F: 'ET', C: 'GO', G: 'CQ', O: 'QC', I: 'LJ', L: 'IT', J: 'IG', H: 'NK', K: 'HX', X: 'KY', Y: 'VX', A: 'HR', R: 'PB', S: 'ZC', Z: 'SN', T: 'FL' };

/* ================= الصوت ================= */
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const MUSIC = window.EliaMusic;                   // الموسيقى الخلفية (assets/music.js)
const voice = new Audio(); voice.preload = 'auto'; MUSIC && MUSIC.watch(voice);
let playTok = 0;
function playFile(src) {
  const tok = ++playTok;
  return new Promise(res => {
    let fin = false; const done = ok => { if (fin) return; fin = true; voice.onended = voice.onerror = null; res(!ok ? 'err' : tok === playTok ? 'ok' : 'cut'); };
    voice.onended = () => done(true); voice.onerror = () => done(false);
    voice.src = src + '?v=2'; try { voice.currentTime = 0; } catch (e) {}
    const p = voice.play(); if (p && p.catch) p.catch(() => done(false));
    setTimeout(() => done(true), 6000);
  });
}
const say = async t => (await playFile(`audio/t/${slug(t)}.mp3`)) !== 'cut';
const sayLetter = async L => (await playFile(`audio/t/letter_${L.toLowerCase()}.mp3`)) !== 'cut';
const venom = async k => (await playFile(`audio/v/${k}.mp3`)) !== 'cut';
async function chain(...fns) { for (const f of fns) { if (!(await f())) return false; await sleep(60); } return true; }
const clip = new Audio(); MUSIC && MUSIC.watch(clip);
function playClip(k) { return new Promise(res => { const d = () => { clip.onended = clip.onerror = null; res(); }; clip.onended = d; clip.onerror = d; clip.src = `../huruf/assets/audio/elia/${k}.mp3?v=5`; const p = clip.play(); if (p && p.catch) p.catch(d); setTimeout(d, 5000); }); }
function stopVoice() { playTok++; try { voice.pause(); } catch (e) {} }

let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type = 'square', vol = .06, when = 0, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + when;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d = .15, vol = .25, freq = 1400) {
  const a = ac(); if (!a) return; const b = a.createBuffer(1, a.sampleRate * d, a.sampleRate); const ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length) ** 2;
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol; s.buffer = b; s.connect(f).connect(g).connect(a.destination); s.start();
}
const SFX = {
  click: () => tone(700, .06, 'square', .05),
  pow: () => { noise(.12, .3, 2400); tone(880, .1, 'square', .06); tone(1320, .12, 'square', .05, .06); },
  bad: () => { tone(200, .25, 'sawtooth', .07, 0, 90); },
  hurt: () => { noise(.25, .4, 700); tone(160, .3, 'square', .07, 0, 60); },
  pop: () => tone(500, .09, 'sine', .15, 0, 1200),
  slash: () => noise(.08, .25, 5000),
  bonk: () => { tone(300, .08, 'square', .09, 0, 120); noise(.06, .3, 1800); },
  whoosh: () => noise(.3, .12, 900),
  zap: () => { tone(1500, .35, 'sawtooth', .05, 0, 100); noise(.3, .2, 3000); },
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'square', .06, i * .1)),
};
document.addEventListener('pointerdown', () => ac(), { once: true });

/* ================= الصور ================= */
const IMG = {};
['hero', 'boss', 'm1', 'm2', 'm3', 'm4', 'bg_park', 'bg_street', 'bg_night', 'bg_school'].forEach(k => { const i = new Image(); i.src = `img/c_${k}.webp?v=1`; IMG[k] = i; });
const ready = i => i && i.complete && i.naturalWidth;

/* ================= أدوات الواجهة ================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
let toastT; function toast(h) { const t = $('#toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
let banT; function banner(h, ms = 1100) { const b = $('#banner'); b.innerHTML = h; b.classList.add('on'); clearTimeout(banT); banT = setTimeout(() => b.classList.remove('on'), ms); }
function confirmBox(html) {
  return new Promise(res => {
    const m = $('#modal'), c = $('#modal-card'); c.innerHTML = `<p>${html}</p>`;
    const r = el('div', 'row'); const y = el('button', 'cbtn', '<span>نَعَمْ</span>'), n = el('button', 'cbtn go', '<span>لا، أُكْمِلُ</span>');
    y.onclick = () => { m.classList.remove('on'); res(true); }; n.onclick = () => { m.classList.remove('on'); res(false); };
    r.append(y, n); c.appendChild(r); m.classList.add('on');
  });
}
const CELEB = { siuuu: 'سِيييييي!', smart: 'أَنا ذَكِيٌّ!', genius: 'أَنا عَبْقَرِيٌّ!', hero: 'أَنا بَطَلٌ!', easy: 'سَهْلَةٌ!', won: 'فُزْنا!' };
function celebrate(kind) {
  const box = $('#celebrate'); $('#c-img').src = 'img/c_hero.webp?v=1'; $('#c-say').textContent = CELEB[kind];
  box.classList.add('on'); SFX.win();
  return new Promise(res => { let d = false; const close = () => { if (d) return; d = true; box.classList.remove('on'); res(); }; box.onclick = close; playClip(kind).then(() => setTimeout(close, 500)); });
}

/* ================= المهام ================= */
const PREFIX = { run: 'grab', boss: 'grab', pop: 'pop', catch: 'catch', whack: 'whack' };
const VERB = { run: 'GRAB', boss: 'GRAB', pop: 'POP', catch: 'CATCH', whack: 'WHACK', slash: 'SPELL' };
function otherLetters(T, pool, n) {
  const c = (CONFUSE[T] || '').split('');
  return shuffle(uniq([...c, ...pool.letters, ...shuffle(ABC).slice(0, 6)]).filter(x => x !== T)).slice(0, n);
}
function makeTask(type, game, pool, diff, prev) {
  const pre = PREFIX[game], verb = VERB[game];
  const mixCase = pool.id >= 2;
  const t = { type };
  if (type === 'L') {
    const opts = pool.letters.filter(x => !prev || x !== prev.T); const T = pick(opts.length ? opts : pool.letters); t.T = T;
    t.hud = `<span class="lbl">${verb}</span><span>${T}${mixCase ? ' ' + T.toLowerCase() : ''}</span><span class="spk">🔊</span>`;
    t.speak = () => chain(() => venom(pre), () => sayLetter(T));
    t.gen = good => { const v = good ? T : pick(otherLetters(T, pool, 5)); const low = mixCase && Math.random() < .5; return { k: 'letter', v: low ? v.toLowerCase() : v, ok: good, say: () => sayLetter(v) }; };
  } else if (type === 'P') {
    const T = pick(pool.all.filter(p => !prev || p[0] !== prev.T)); t.T = T[0];
    t.hud = `<span class="lbl">${verb}</span><span>${T[0]}</span><span class="spk">🔊</span>`;
    t.speak = () => chain(() => venom(pre), () => say(T[0]));
    t.gen = good => { const p = good ? T : pick(pool.all.filter(x => x[0] !== T[0])); return { k: 'pic', v: p[0], e: p[1], ok: good, say: () => say(p[0]) }; };
  } else if (type === 'S') {
    const opts = pool.starts.filter(x => !prev || x !== prev.T); const T = pick(opts.length ? opts : pool.starts); t.T = T;
    const good = pool.pics.filter(p => p[0][0].toUpperCase() === T), bad = pool.all.filter(p => p[0][0].toUpperCase() !== T);
    t.hud = `<span class="lbl">${verb}</span><span>${T}…</span><span class="e">❓</span><span class="spk">🔊</span>`;
    t.speak = () => chain(() => venom(pre + 'Start'), () => sayLetter(T));
    t.gen = g => { const p = g ? pick(good) : pick(bad); return { k: 'pic', v: p[0], e: p[1], ok: g, say: () => say(p[0]) }; };
  } else if (type === 'R') {
    const T = pick(pool.all.filter(p => !prev || p[0] !== prev.T)); t.T = T[0];
    t.hud = `<span class="lbl">${verb}</span><span class="e">${T[1]}</span><span>= ?</span>`;
    t.speak = () => venom('findWord');
    t.gen = g => { const p = g ? T : pick(pool.all.filter(x => x[0] !== T[0])); return { k: 'word', v: p[0], ok: g, say: () => say(p[0]) }; };
  } else if (type === 'N') {
    const T = pick(pool.nums); t.T = T;
    t.hud = `<span class="lbl">${verb}</span><span>${T} ${NUM[T]}</span><span class="spk">🔊</span>`;
    t.speak = () => chain(() => venom(pre), () => say(NUM[T]));
    t.gen = g => { const n = g ? T : pick(uniq(pool.nums.concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => Math.abs(x - T) <= 2))).filter(x => x !== T)); return { k: diff > .3 && Math.random() < .5 ? 'dots' : 'num', v: n, ok: g, say: () => say(NUM[n]) }; };
  } else if (type === 'C') {
    const T = pick(pool.colors); t.T = T;
    t.hud = `<span class="lbl">${verb}</span><span class="blob" style="background:${COL[T]}"></span><span>${T}</span><span class="spk">🔊</span>`;
    t.speak = () => chain(() => venom(pre), () => say(T));
    t.gen = g => { const c = g ? T : pick(Object.keys(COL).filter(x => x !== T)); return { k: 'color', v: c, ok: g, say: () => say(c) }; };
  }
  return t;
}

/* ================= رسم العناصر (شارات كوميكس) ================= */
const RING = ['#ffd23f', '#00c2ff', '#ff7a3d', '#2ee66b', '#ff5fa2', '#b18cff'];
const badgeCache = new Map();
function badge(item, r) {
  const key = item.k + ':' + item.v + ':' + Math.round(r) + ':' + (item.ring || '');
  if (badgeCache.has(key)) return badgeCache.get(key);
  const dpr = Math.min(2, devicePixelRatio || 1), s = Math.ceil((r * 2 + 16) * dpr);
  const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.scale(dpr, dpr);
  const m = r + 8, lw = Math.max(3, r * .1);
  x.fillStyle = '#141414'; x.beginPath(); x.arc(m + 4, m + 4, r, 0, 7); x.fill();
  x.fillStyle = item.k === 'color' ? COL[item.v] : '#fff'; x.beginPath(); x.arc(m, m, r, 0, 7); x.fill();
  x.lineWidth = lw * 1.6; x.strokeStyle = item.ring || '#ffd23f'; x.beginPath(); x.arc(m, m, r - lw * 1.2, 0, 7); x.stroke();
  x.lineWidth = lw; x.strokeStyle = '#141414'; x.beginPath(); x.arc(m, m, r, 0, 7); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#141414'; x.direction = 'ltr';
  if (item.k === 'letter') { x.font = `700 ${r * 1.15}px Andika`; x.fillText(item.v, m, m + r * .06); }
  else if (item.k === 'num') { x.font = `700 ${r * 1.1}px Andika`; x.fillText(item.v, m, m + r * .06); }
  else if (item.k === 'pic') { x.font = `${r * 1.05}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.fillText(item.e, m, m + r * .08); }
  else if (item.k === 'word') { let f = r * .62; x.font = `700 ${f}px Andika`; const w = x.measureText(item.v).width; if (w > r * 1.6) { f *= r * 1.6 / w; x.font = `700 ${f}px Andika`; } x.fillText(item.v, m, m + r * .04); }
  else if (item.k === 'dots') { const n = item.v, cols = n <= 3 ? n : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols), d = r * 1.3 / Math.max(cols, rows); x.strokeStyle = '#141414'; for (let i = 0; i < n; i++) { const cx = m + ((i % cols) - (cols - 1) / 2) * d, cy = m + ((i / cols | 0) - (rows - 1) / 2) * d; x.fillStyle = '#ff3b3b'; x.beginPath(); x.arc(cx, cy, d * .36, 0, 7); x.fill(); x.lineWidth = 2; x.stroke(); } }
  badgeCache.set(key, c); return c;
}
function drawBadge(g, item, x, y, r, rot = 0) {
  const c = badge(item, r), sc = c.width / (r * 2 + 16);
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.drawImage(c, -(r + 8), -(r + 8), c.width / sc, c.height / sc); g.restore();
}

/* ================= المحرّك ================= */
const cv = $('#cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, U = 1, TOP = 0;   // TOP = أسفل الشريط العلوي: ما يُرسم على الكانفس يبدأ من تحته
const hudEl = $('#game .hud');
function resize() { const dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; U = Math.min(W, H) / 100; TOP = Math.min(H * .4, hudEl.getBoundingClientRect().bottom + 6); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); badgeCache.clear(); if (GAME && GAME.resize) GAME.resize(); }
addEventListener('resize', () => { if ($('#game').classList.contains('on')) resize(); });
let GAME = null, raf = 0, lastT = 0;
function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - lastT) / 1000 || 0) * FAST; lastT = t;
  if (!GAME) return;
  if (!GAME.paused) GAME.update(dt);
  ctx.save(); ctx.direction = 'ltr'; if (GAME.shake > 0) ctx.translate(rand(-1, 1) * GAME.shake * U, rand(-1, 1) * GAME.shake * U);
  GAME.draw(ctx); drawFx(ctx, GAME, GAME.paused ? 0 : dt); ctx.restore();
  if (GAME.hurtT > 0) { const k = Math.min(1, GAME.hurtT); const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .7); v.addColorStop(0, 'rgba(255,40,40,0)'); v.addColorStop(1, `rgba(255,40,40,${.5 * k})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
}
/* تأثيرات: كلمات POW وجزيئات */
function fxWord(G, text, x, y, color = '#ffd23f', size = 9) { G.fx.push({ t: 'w', text, x, y, color, size, life: .9, rot: rand(-.3, .3) }); }
function fxBurst(G, x, y, n = 16, cols = ['#ffd23f', '#ff3b3b', '#00c2ff', '#fff', '#2ee66b']) { for (let i = 0; i < n; i++) { const a = rand(0, 6.3), v = rand(20, 60) * U; G.fx.push({ t: 'p', star: i % 3 === 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: pick(cols), life: rand(.45, .9), s: rand(1, 2.4) * U, rot: rand(0, 6), vr: rand(-8, 8) }); } }
function starPath(g, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, q = i % 2 ? r * .45 : r; i ? g.lineTo(Math.cos(a) * q, Math.sin(a) * q) : g.moveTo(Math.cos(a) * q, Math.sin(a) * q); } g.closePath(); }
function fxRing(G, x, y, c = '#fff') { G.fx.push({ t: 'r', x, y, c, life: .4, r0: 4 * U }); }
function drawFx(g, G, dt) {
  G.shake = Math.max(0, G.shake - dt * 8); G.pop = Math.max(0, (G.pop || 0) - dt * 4);
  G.fx = G.fx.filter(f => (f.life -= dt) > 0);
  for (const f of G.fx) {
    if (f.t === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 90 * U * dt; f.rot += f.vr * dt; const k = Math.min(1, f.life * 4);
      g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.scale(k, k); g.fillStyle = f.c; g.strokeStyle = '#141414'; g.lineWidth = 2; if (f.star) starPath(g, f.s * 1.1); else { g.beginPath(); g.rect(-f.s / 2, -f.s / 2, f.s, f.s); } g.fill(); g.stroke(); g.restore(); }
    else if (f.t === 'r') { const k = 1 - f.life / .4; g.strokeStyle = f.c; g.lineWidth = 6 * (1 - k) + 1; g.beginPath(); g.arc(f.x, f.y, f.r0 + k * 14 * U, 0, 7); g.stroke(); }
    else if (f.t === 'w') {
      const k = 1 - f.life / .9, sc = k < .15 ? k / .15 * 1.3 : 1.3 - (k - .15) * .4;
      g.save(); g.translate(f.x, f.y - k * 8 * U); g.rotate(f.rot); g.scale(sc, sc); g.globalAlpha = Math.min(1, f.life * 3);
      g.font = `${f.size * U}px Bangers`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      g.lineWidth = f.size * U * .22; g.strokeStyle = '#141414'; g.strokeText(f.text, 0, 0); g.fillStyle = f.color; g.fillText(f.text, 0, 0); g.restore();
    }
  }
}
function drawBg(g, img, scroll, dim = 0) {
  if (!ready(img)) { g.fillStyle = '#87d7ff'; g.fillRect(0, 0, W, H); return; }
  if (scroll == null) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); g.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); }
  else {
    const bh = H, bw = bh * img.naturalWidth / img.naturalHeight, off = scroll % (bw * 2); let x = -off;
    while (x < W) { g.drawImage(img, x, 0, bw, bh); g.save(); g.translate(x + bw * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, bw, bh); g.restore(); x += bw * 2; }
  }
  if (dim) { g.fillStyle = `rgba(20,20,40,${dim})`; g.fillRect(0, 0, W, H); }
}
function drawSprite(g, img, x, y, h, opt = {}) {
  if (!ready(img)) { g.fillStyle = '#222'; g.beginPath(); g.arc(x, y - h / 2, h / 3, 0, 7); g.fill(); return; }
  const w = h * img.naturalWidth / img.naturalHeight;
  g.save(); g.translate(x, y); if (opt.rot) g.rotate(opt.rot); g.scale((opt.flip ? -1 : 1) * (opt.sx || 1), opt.sy || 1);
  if (opt.alpha != null) g.globalAlpha = opt.alpha;
  g.drawImage(img, -w / 2, -h, w, h);
  g.restore();
  if (opt.flash) { g.save(); g.globalAlpha = opt.flash * .6; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y - h / 2, w * .45, h * .45, 0, 0, 7); g.fill(); g.restore(); }
}

/* ================= لعبة: الأساس المشترك ================= */
function baseGame(w, s) {
  const st = STAGES[s], pool = POOL[w - 1];
  const diff = ((w - 1) * STAGES.length + s) / (WORLDS.length * STAGES.length - 1);
  return { w, s, st, pool, diff, kind: st.g, score: 0, combo: 0, bestCombo: 0, hits: 0, hearts: 3, fx: [], shake: 0, t: 0, over: false, paused: false, got: new Set(), hurtT: 0, task: null, taskHits: 0, sinceGood: 0 };
}
function hud(G) {
  const sc = $('#score'); if (sc.textContent !== String(G.score)) { sc.textContent = G.score; if (G.score) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); } }
  const lv = $('#lives');
  if (G.timeLeft != null) { const s = Math.max(0, Math.ceil(G.timeLeft)); lv.innerHTML = `<span class="time${s <= 10 ? ' low' : ''}">⏱ ${s}</span>`; }
  else lv.innerHTML = [0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">❤️</span>`).join('');
  $('#pbar').style.width = clamp(G.progress ? G.progress() : 0, 0, 1) * 100 + '%';
  const c = $('#combo'); const on = G.combo >= 3; c.classList.toggle('on', on); if (on) c.textContent = 'x' + G.combo + ' COMBO!';
}
function newTask(G, first) {
  const types = G.st.tasks.filter(t => (t !== 'S' || G.pool.starts.length) && (t !== 'N' || G.pool.nums.length));
  const type = G.task && types.length > 1 ? pick(types.filter(t => t !== G.task.type)) : types[0];
  G.task = makeTask(type, G.kind, G.pool, G.diff, G.task); G.taskHits = 0;
  const tg = $('#target'); tg.innerHTML = G.task.hud; tg.classList.remove('flash'); void tg.offsetWidth; tg.classList.add('flash');
  if (!first) { banner('NEW TARGET!', 900); setTimeout(() => { if (GAME === G && !G.over) G.task.speak(); }, 600); }
}
function goodHit(G, item, x, y) {
  G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.hits++; G.taskHits++; G.pop = 1;
  const pts = 10 * Math.min(5, 1 + Math.floor(G.combo / 3)); G.score += pts;
  if (item.k === 'pic' || item.k === 'word') G.got.add(item.v);
  SFX.pow(); fxBurst(G, x, y); fxRing(G, x, y); fxWord(G, pick(['POW!', 'BAM!', 'ZAP!', 'WOW!', 'YES!', 'BOOM!']), x, y - 6 * U);
  fxWord(G, '+' + pts, x + 8 * U, y + 6 * U, '#fff', 5);
  if (G.combo % 5 === 0) { const c = $('#combo'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); venom('combo'); }
  else if (item.say) item.say();
  if (G.taskHits >= (G.perTask || 4) && !G.over) newTask(G);
}
function badHit(G, x, y, hurt = true) {
  G.combo = 0; SFX.bad(); fxWord(G, pick(['OOPS!', 'NOPE!', 'UH-OH!']), x, y - 6 * U, '#ff3b3b');
  const tg = $('#target'); tg.classList.remove('flash'); void tg.offsetWidth; tg.classList.add('flash');
  if (hurt) hurtHero(G); else { G.shake = 1.2; venom(pick(['try1', 'try2', 'try3'])); }
}
function hurtHero(G) {
  if (G.hurtT > 0 || G.over) return;
  G.hurtT = 1.3; G.shake = 2.5; SFX.hurt(); G.combo = 0;
  if (G.timeLeft != null) { G.timeLeft -= 3; fxWord(G, '-3s', W / 2, H * .3, '#ff3b3b', 8); venom('ouch'); return; }
  G.hearts--; venom('ouch');
  if (G.hearts <= 0) endGame(G, false);
}
function spawnItem(G) { const want = G.sinceGood >= 2 || Math.random() < .42; G.sinceGood = want ? 0 : G.sinceGood + 1; return G.task.gen(want); }
function startMsg(G, hint, first) { newTask(G, true); banner(`READY?<small>${hint}</small>`, 2600); venom(first || 'ready').then(() => { if (GAME === G && !G.over) G.task.speak(); }); }

/* ---------- 1) الركض + الزعيم ---------- */
function gameRun(w, s, boss) {
  const G = baseGame(w, s); const bg = IMG['bg_' + WORLDS[w - 1].bg];
  G.goal = 14 + w * 2; G.perTask = 4;
  G.hero = { x: 0, y: 0, ty: 0 }; G.items = []; G.enemies = []; G.shots = []; G.scroll = 0; G.spawnT = .2; G.enemyT = 5;
  G.speed = () => W * (.24 + .2 * G.diff);
  if (boss) { G.boss = { hp: 3, y: H * .6, t: 0, flash: 0, shootT: 4, power: 0 }; G.progress = () => 1 - G.boss.hp / 3; }
  else G.progress = () => G.hits / G.goal;
  const heroH = () => Math.min(H * .36, W * .42);
  G.resize = () => { G.hero.x = Math.max(W * .17, heroH() * .45); if (!G.hero.y) G.hero.y = G.hero.ty = H * .7; };
  G.resize();
  G.onDown = G.onMove = (x, y) => { G.hero.ty = clamp(y + heroH() * .35, Math.max(H * .4, TOP + heroH() * .55), H * .99); };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt);
    const sp = G.speed(); G.scroll += sp * dt * .45;
    const h = G.hero; h.y += (h.ty - h.y) * Math.min(1, dt * 10);
    const hx = h.x + heroH() * .05, hy = h.y - heroH() * .5, hr = heroH() * .24;
    if (boss) { const B = G.boss; B.t += dt; B.flash = Math.max(0, B.flash - dt * 2); B.y = H * .62 + Math.sin(B.t * 1.1) * H * .14; }
    hud(G);
    if (G.t < 3.2) return;
    G.spawnT -= dt;
    if (G.spawnT <= 0) { const it = spawnItem(G); it.x = W + 12 * U; it.r = 7.5 * U; it.y = rand(Math.max(H * .3, TOP + it.r * 1.25), H * .86); it.wob = rand(0, 6); it.ring = pick(RING); G.items.push(it); G.spawnT = rand(1.05, 1.5) - G.diff * .45; }
    G.enemyT -= dt;
    if (!boss && G.diff > .05 && G.enemyT <= 0) { G.enemies.push({ x: W + 10 * U, y: rand(H * .38, H * .92), img: IMG[pick(['m1', 'm2', 'm3', 'm4'])], t: rand(0, 6), sp: rand(1.1, 1.4) }); G.enemyT = rand(4.5, 7) - G.diff * 2; }
    for (const it of G.items) {
      it.x -= sp * dt; it.wob += dt * 3; const iy = it.y + Math.sin(it.wob) * 1.5 * U;
      if (!it.dead && Math.hypot(it.x - hx, iy - hy) < hr + it.r * .7) {
        it.dead = true;
        if (it.ok) { goodHit(G, it, it.x, iy); if (boss && ++G.boss.power >= 4) superAttack(G); }
        else badHit(G, it.x, iy);
      }
    }
    G.items = G.items.filter(it => !it.dead && it.x > -20 * U);
    for (const e of G.enemies) {
      e.x -= sp * e.sp * dt; e.t += dt * 4; const ey = e.y + Math.sin(e.t) * 3 * U - 6 * U;
      if (!e.dead && Math.hypot(e.x - hx, ey - hy) < hr + 5 * U) { e.dead = true; fxBurst(G, e.x, ey, 14, ['#9b59ff', '#2ee66b', '#141414']); fxWord(G, 'SPLAT!', e.x, ey - 8 * U, '#9b59ff'); hurtHero(G); }
    }
    G.enemies = G.enemies.filter(e => !e.dead && e.x > -20 * U);
    if (boss) {
      const B = G.boss; B.shootT -= dt;
      if (B.shootT <= 0) { const sy = B.y - H * .2; G.shots.push({ x: W * .76, y: sy, vx: -sp * 1.5, vy: (hy - sy) * .45 }); B.shootT = rand(2.4, 3.6) - G.w * .25; SFX.whoosh(); }
      for (const b of G.shots) { b.x += b.vx * dt; b.y += b.vy * dt; if (!b.dead && Math.hypot(b.x - hx, b.y - hy) < hr + 3.5 * U) { b.dead = true; fxBurst(G, b.x, b.y, 12, ['#2ee66b', '#141414']); fxWord(G, 'SPLAT!', b.x, b.y, '#2ee66b'); hurtHero(G); } }
      G.shots = G.shots.filter(b => !b.dead && b.x > -10 * U);
    } else if (G.hits >= G.goal) endGame(G, true);
  };
  G.draw = g => {
    drawBg(g, bg, G.scroll, 0);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = (i * 137 + 40) % H, x = W - ((G.t * 900 + i * 331) % (W * 1.4)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18 * U, y); g.stroke(); }
    for (const it of G.items) drawBadge(g, it, it.x, it.y + Math.sin(it.wob) * 1.5 * U, it.r, Math.sin(it.wob * .7) * .12);
    for (const e of G.enemies) drawSprite(g, e.img, e.x, e.y + Math.sin(e.t) * 3 * U, 13 * U, { sy: 1 + Math.sin(e.t * 2) * .05 });
    if (G.boss) {
      const B = G.boss; const bs = Math.min(H * .55, W * .5); drawSprite(g, IMG.boss, W - bs * .45, B.y + bs * .44, bs, { flash: B.flash, flip: true, sx: 1 + Math.sin(B.t * 3) * .03 });
      const bx = W * .66, by = Math.max(H * .22, TOP + 6 * U), bw = W * .28;
      g.fillStyle = '#141414'; g.fillRect(bx - 4, by - 4, bw + 8, 22); g.fillStyle = '#444'; g.fillRect(bx, by, bw, 14); g.fillStyle = '#b44dff'; g.fillRect(bx, by, bw * B.hp / 3, 14);
      g.font = `${4 * U}px Bangers`; g.fillStyle = '#fff'; g.strokeStyle = '#141414'; g.lineWidth = 4; g.textAlign = 'left'; g.strokeText('GOO KING', bx, by - 8); g.fillText('GOO KING', bx, by - 8);
      for (const b of G.shots) { g.fillStyle = '#2ee66b'; g.strokeStyle = '#141414'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, 3.5 * U, 0, 7); g.fill(); g.stroke(); }
      const px = W * .5 - 20 * U, py = H * .94;
      g.fillStyle = '#141414'; g.fillRect(px - 4, py - 4, 40 * U + 4, 3 * U + 8);
      for (let i = 0; i < 4; i++) { g.fillStyle = i < B.power ? '#00c2ff' : '#555'; g.fillRect(px + i * 10 * U, py, 10 * U - 4, 3 * U); }
      g.font = `${3.6 * U}px Bangers`; g.textAlign = 'center'; g.strokeText('SUPER POWER', W * .5, py - 1.4 * U); g.fillStyle = '#ffd23f'; g.fillText('SUPER POWER', W * .5, py - 1.4 * U);
    }
    const h = G.hero, bob = Math.sin(G.t * 12) * .6 * U, blink = G.hurtT > 0 && Math.floor(G.t * 16) % 2;
    drawSprite(g, IMG.hero, h.x, h.y + bob, heroH(), { rot: Math.sin(G.t * 12) * .03, alpha: blink ? .35 : 1, sx: 1 + (G.pop || 0) * .1, sy: 1 + (G.pop || 0) * .1 });
  };
  G.start = () => startMsg(G, 'حَرِّكْ فينوم بِإِصْبَعِكَ أَوْ بِالْقَلَمِ ↕️', boss ? 'boss' : 'ready');
  return G;
}
async function superAttack(G) {
  G.boss.power = 0; G.paused = true; stopVoice();
  const okT = await traceLetter(pick(G.pool.letters), G.diff);
  if (GAME !== G) return;
  G.paused = false; G.items = []; G.shots = [];
  if (okT) {
    SFX.zap(); G.boss.hp--; G.boss.flash = 1; G.shake = 4; fxBurst(G, W * .84, G.boss.y, 40); fxWord(G, 'KA-BOOM!', W * .78, G.boss.y - H * .1, '#ffd23f', 14);
    G.score += 100; venom(pick(['hit1', 'hit2', 'hit3', 'hit4']));
    if (G.boss.hp <= 0) endGame(G, true);
  }
}

/* ---------- 2) الفقاعات ---------- */
function gamePop(w, s) {
  const G = baseGame(w, s); const bg = IMG['bg_' + WORLDS[w - 1].bg];
  G.timeLeft = 60; G.goal = 12 + w * 2; G.items = []; G.spawnT = .3; G.progress = () => G.hits / G.goal; G.perTask = 4;
  G.onDown = (x, y) => {
    if (G.t < 3) return;
    for (let i = G.items.length - 1; i >= 0; i--) { const b = G.items[i]; if (b.dead || Math.hypot(x - b.x, y - b.y) > b.r * 1.3) continue;
      if (b.ok) { b.dead = true; SFX.pop(); goodHit(G, b, b.x, b.y); fxBurst(G, b.x, b.y, 20, ['#bfefff', '#fff', '#00c2ff']); }
      else { b.shake = .4; badHit(G, b.x, b.y, false); G.timeLeft -= 2; fxWord(G, '-2s', b.x, b.y + 8 * U, '#ff3b3b', 5); }
      return; }
  };
  G.update = dt => {
    G.t += dt; hud(G); if (G.t < 3) return;
    G.timeLeft -= dt; G.spawnT -= dt;
    if (G.spawnT <= 0) { const it = spawnItem(G); it.r = rand(7, 8.5) * U; it.x = rand(it.r + 5 * U, W - it.r - 5 * U); it.y = H + it.r * 1.4; it.vy = -rand(10, 15) * U * (1 + G.diff * .9); it.ph = rand(0, 6); it.ring = pick(RING); G.items.push(it); G.spawnT = rand(.55, .85) - G.diff * .25; }
    for (const b of G.items) { b.y += b.vy * dt; b.ph += dt * 2; b.x += Math.sin(b.ph) * 12 * dt; if (b.shake) b.shake = Math.max(0, b.shake - dt); }
    G.items = G.items.filter(b => !b.dead && b.y > -b.r * 3);
    if (G.timeLeft <= 0) endGame(G, G.hits >= G.goal * .35);
  };
  G.draw = g => {
    drawBg(g, bg, null, .35);
    for (const b of G.items) {
      const sx = b.shake ? Math.sin(b.shake * 60) * 1.2 * U : 0;
      g.fillStyle = 'rgba(190,240,255,.35)'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(b.x + sx, b.y, b.r * 1.28, 0, 7); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(b.x + sx - b.r * .6, b.y - b.r * .75, b.r * .22, b.r * .12, -.6, 0, 7); g.fill();
      drawBadge(g, b, b.x + sx, b.y, b.r * .9);
    }
  };
  G.start = () => startMsg(G, 'فَقِّعِ الْفُقاعَةَ الصَّحيحَةَ 🫧');
  return G;
}

/* ---------- 3) الالتقاط ---------- */
function gameCatch(w, s) {
  const G = baseGame(w, s); const bg = IMG['bg_' + WORLDS[w - 1].bg];
  G.goal = 14 + w * 2; G.items = []; G.spawnT = .5; G.px = 0; G.tx = 0; G.progress = () => G.hits / G.goal; G.perTask = 4;
  G.resize = () => { if (!G.px) G.px = G.tx = W / 2; };
  G.resize();
  G.onDown = G.onMove = x => { G.tx = clamp(x, 12 * U, W - 12 * U); };
  const basketY = () => H * .78;
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); G.px += (G.tx - G.px) * Math.min(1, dt * 14); hud(G);
    if (G.t < 3) return;
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      if (G.diff > .1 && Math.random() < .14) G.items.push({ bomb: true, img: IMG[pick(['m1', 'm2', 'm3'])], x: rand(12 * U, W - 12 * U), y: -10 * U, vy: rand(22, 30) * U * (1 + G.diff * .6), rot: 0 });
      else { const it = spawnItem(G); it.r = 7 * U; it.x = rand(12 * U, W - 12 * U); it.y = -it.r; it.vy = rand(20, 28) * U * (1 + G.diff * .7); it.rot = rand(-1, 1); it.ring = pick(RING); G.items.push(it); }
      G.spawnT = rand(.9, 1.3) - G.diff * .35;
    }
    const by = basketY(), bw = 14 * U;
    for (const it of G.items) {
      it.y += it.vy * dt; it.rot += dt;
      if (!it.dead && it.y > by - 7 * U && it.y < by + 5 * U && Math.abs(it.x - G.px) < bw) {
        it.dead = true;
        if (it.bomb) { fxBurst(G, it.x, it.y, 14, ['#9b59ff', '#141414']); fxWord(G, 'SPLAT!', it.x, it.y - 6 * U, '#9b59ff'); hurtHero(G); }
        else if (it.ok) goodHit(G, it, it.x, it.y); else badHit(G, it.x, it.y);
      }
    }
    G.items = G.items.filter(it => !it.dead && it.y < H + 20 * U);
    if (G.hits >= G.goal) endGame(G, true);
  };
  G.draw = g => {
    drawBg(g, bg, null, .15);
    for (const it of G.items) { if (it.bomb) drawSprite(g, it.img, it.x, it.y + 6 * U, 12 * U, { rot: Math.sin(G.t * 5) * .2 }); else drawBadge(g, it, it.x, it.y, it.r, Math.sin(it.rot) * .3); }
    const by = basketY(), blink = G.hurtT > 0 && Math.floor(G.t * 16) % 2;
    drawSprite(g, IMG.hero, G.px - 3 * U, H * 1.02, H * .36, { alpha: blink ? .35 : 1, rot: clamp((G.tx - G.px) * .0008, -.2, .2) });
    g.save(); g.translate(G.px, by); g.scale(1 + (G.pop || 0) * .12, 1 - (G.pop || 0) * .1); g.fillStyle = '#c9772b'; g.strokeStyle = '#141414'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-14 * U, -3 * U); g.lineTo(14 * U, -3 * U); g.lineTo(10 * U, 9 * U); g.lineTo(-10 * U, 9 * U); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#8a4b14'; g.lineWidth = 3; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5 * U, -3 * U); g.lineTo(i * 3.8 * U, 9 * U); g.stroke(); }
    g.fillStyle = '#e8a04e'; g.strokeStyle = '#141414'; g.lineWidth = 5; g.beginPath(); g.rect(-15 * U, -5 * U, 30 * U, 4 * U); g.fill(); g.stroke(); g.restore();
  };
  G.start = () => startMsg(G, 'حَرِّكِ السَّلَّةَ وَالْتَقِطِ الصَّحيحَ 🧺');
  return G;
}

/* ---------- 4) قطع الحروف (تهجئة بالقلم) ---------- */
function gameSlash(w, s) {
  const G = baseGame(w, s); const bg = IMG['bg_' + WORLDS[w - 1].bg];
  G.timeLeft = 80; G.goal = 5 + w; G.words = 0; G.tiles = []; G.halves = []; G.trail = []; G.spawnT = .5; G.progress = () => G.words / G.goal;
  const words = shuffle(G.pool.spell.length ? G.pool.spell : ['cat', 'hat', 'bat']);
  let wi = 0;
  const nextWord = () => { G.word = words[wi++ % words.length]; G.pos = 0; renderSpell(G); };
  const cut = t => {
    if (t.dead) return; t.dead = true; SFX.slash();
    if (t.bomb) { fxBurst(G, t.x, t.y, 16, ['#9b59ff', '#141414']); fxWord(G, 'SPLAT!', t.x, t.y, '#9b59ff'); hurtHero(G); return; }
    if (G.pos < G.word.length && t.v === G.word[G.pos]) {
      G.pos++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.score += 10 * Math.min(5, 1 + Math.floor(G.combo / 3));
      fxBurst(G, t.x, t.y, 14); fxWord(G, 'SLASH!', t.x, t.y - 5 * U);
      G.halves.push({ x: t.x, y: t.y, vx: -20 * U, vy: -10 * U, v: t.v, r: t.r, life: .6, side: -1, ring: t.ring }, { x: t.x, y: t.y, vx: 20 * U, vy: -10 * U, v: t.v, r: t.r, life: .6, side: 1, ring: t.ring });
      sayLetter(t.v); renderSpell(G);
      if (G.pos >= G.word.length) {
        G.words++; G.hits++; G.score += 50; G.got.add(G.word); SFX.win(); fxWord(G, 'SUPER!', W / 2, H * .45, '#ffd23f', 14);
        const done = G.words >= G.goal;
        setTimeout(() => { if (GAME !== G || G.over) return; say(G.word); if (done) setTimeout(() => endGame(G, true), 900); else setTimeout(() => { if (GAME === G && !G.over) { nextWord(); banner('NEW WORD!', 800); setTimeout(() => GAME === G && chain(() => venom('spell'), () => say(G.word)), 500); } }, 1000); }, 350);
      }
    } else { G.combo = 0; SFX.bad(); fxWord(G, 'NOPE!', t.x, t.y - 5 * U, '#ff3b3b'); G.timeLeft -= 2; G.shake = 1; }
  };
  let down = false, penSeen = false;
  const hitTest = (x1, y1, x2, y2) => {
    if (G.t < 3) return;
    for (const t of G.tiles) { if (t.dead) continue; const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy; const k = clamp(L2 ? ((t.x - x1) * dx + (t.y - y1) * dy) / L2 : 0, 0, 1); if (Math.hypot(x1 + dx * k - t.x, y1 + dy * k - t.y) < t.r * 1.05) cut(t); }
  };
  G.onDown = (x, y, e) => { if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return; down = true; G.trail = [[x, y, G.t]]; hitTest(x, y, x, y); };
  G.onMove = (x, y, e) => { if (!down || (penSeen && e.pointerType === 'touch')) return; const l = G.trail[G.trail.length - 1] || [x, y]; G.trail.push([x, y, G.t]); hitTest(l[0], l[1], x, y); };
  G.onUp = () => { down = false; };
  G.update = dt => {
    G.t += dt; G.hurtT = Math.max(0, G.hurtT - dt); hud(G); if (G.t < 3) return;
    G.timeLeft -= dt; G.spawnT -= dt;
    if (G.spawnT <= 0 && G.word) {
      const n = Math.random() < .35 + G.diff * .3 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const need = G.word[G.pos] || G.word[0], r = Math.random(); let v = need, bomb = false;
        if (r < .5) v = need; else if (r < .72) v = pick(G.word.split('')); else if (r < .9 || G.diff < .1) v = pick('abcdefghijklmnoprstuvwxyz'.split('').filter(c => !G.word.includes(c))); else bomb = true;
        const x = rand(W * .15, W * .85), tall = H / W > .8 ? 1.25 : 1;
        G.tiles.push({ k: 'letter', v, bomb, img: IMG.m1, x, y: H + 8 * U, vx: (W / 2 - x) * rand(.15, .35), vy: -rand(80, 94) * U * tall, r: 7.5 * U, rot: rand(-1, 1), ring: pick(RING) });
      }
      G.spawnT = rand(1.1, 1.6) - G.diff * .4;
    }
    for (const t of G.tiles) { t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 55 * U * dt; t.rot += dt * 2; }
    G.tiles = G.tiles.filter(t => !t.dead && t.y < H + 20 * U);
    for (const hv of G.halves) { hv.x += hv.vx * dt; hv.y += hv.vy * dt; hv.vy += 80 * U * dt; hv.life -= dt; }
    G.halves = G.halves.filter(hv => hv.life > 0);
    G.trail = G.trail.filter(p => G.t - p[2] < .18);
    if (G.timeLeft <= 0 && !G.over) endGame(G, G.words >= Math.ceil(G.goal * .35));
  };
  G.draw = g => {
    drawBg(g, bg, null, .3);
    for (const hv of G.halves) { g.save(); g.beginPath(); g.rect(hv.side < 0 ? hv.x - hv.r * 2 : hv.x, hv.y - hv.r * 2, hv.r * 2, hv.r * 4); g.clip(); drawBadge(g, { k: 'letter', v: hv.v, ring: hv.ring }, hv.x, hv.y, hv.r, hv.side * (.6 - hv.life)); g.restore(); }
    for (const t of G.tiles) { if (t.bomb) drawSprite(g, t.img, t.x, t.y + 7 * U, 14 * U, { rot: t.rot }); else drawBadge(g, t, t.x, t.y, t.r, Math.sin(t.rot) * .4); }
    if (G.trail.length > 1) { g.lineCap = g.lineJoin = 'round'; for (const [c, lw] of [['#141414', 14], ['#fff', 8], ['#00c2ff', 3]]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(G.trail[0][0], G.trail[0][1]); G.trail.forEach(p => g.lineTo(p[0], p[1])); g.stroke(); } }
  };
  G.start = () => { nextWord(); banner('READY?<small>اِقْطَعِ الْحُروفَ بِالتَّرْتيبِ بِالْقَلَمِ ✂️</small>', 2600); venom('ready').then(() => { if (GAME === G && !G.over) chain(() => venom('spell'), () => say(G.word)); }); };
  G.speakTarget = () => say(G.word);
  return G;
}
function renderSpell(G) {
  const w = G.word, p = G.pos;
  $('#target').innerHTML = `<span class="lbl">SPELL</span><span class="e">${picOf(w)}</span><span style="letter-spacing:6px">${w.split('').map((c, i) => i < p ? `<b style="color:#1fa84a">${c}</b>` : '_').join('')}</span><span class="spk">🔊</span>`;
}

/* ---------- 5) اضرب الوحش ---------- */
function gameWhack(w, s) {
  const G = baseGame(w, s); const bg = IMG['bg_' + WORLDS[w - 1].bg];
  G.timeLeft = 60; G.goal = 16 + w * 2; G.progress = () => G.hits / G.goal; G.perTask = 4;
  G.holes = []; G.spawnT = .4; G.hammer = null;
  G.resize = () => {
    const cols = W > H ? 3 : 2, rows = W > H ? 2 : 3; if (G.holes.length !== cols * rows) G.holes = [];
    const cw = W / cols, rh = H * .62 / rows;
    for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) { const hl = G.holes[i] || { up: 0, item: null }; hl.x = cw * (c + .5); hl.y = H * .38 + rh * (r + .75); hl.rw = Math.min(cw * .5, rh * .75) * .62; G.holes[i] = hl; }
  };
  G.resize();
  G.onDown = (x, y) => {
    if (G.t < 3) return;
    G.hammer = { x, y, t: .25 };
    for (const hl of G.holes) { if (!hl.item || hl.up < .5 || hl.hit) continue; const top = hl.y + hl.rw * 1.6 * (1 - hl.up);
      if (Math.abs(x - hl.x) < hl.rw * 1.1 && y > top - hl.rw * 2.3 && y < hl.y + hl.rw * .3) {
        hl.hit = true; hl.stay = 0; SFX.bonk();
        if (hl.item.ok) goodHit(G, hl.item, hl.x, top - hl.rw * 1.5);
        else { badHit(G, hl.x, top - hl.rw, false); G.timeLeft -= 2; fxWord(G, '-2s', hl.x, top, '#ff3b3b', 5); }
        return; } }
  };
  G.update = dt => {
    G.t += dt; if (G.hammer && (G.hammer.t -= dt) <= 0) G.hammer = null; hud(G);
    if (G.t < 3) return;
    G.timeLeft -= dt; G.spawnT -= dt;
    if (G.spawnT <= 0) {
      const free = G.holes.filter(hl => !hl.item); if (free.length) { const hl = pick(free); hl.item = spawnItem(G); hl.item.ring = pick(RING); hl.img = IMG[pick(['m1', 'm2', 'm3', 'm4'])]; hl.stay = 2.1 - G.diff * 1.1; hl.up = 0; hl.hit = false; }
      G.spawnT = rand(.45, .8) - G.diff * .2;
    }
    for (const hl of G.holes) { if (!hl.item) continue; if (hl.stay > 0) { hl.stay -= dt; hl.up = Math.min(1, hl.up + dt * 6); } else if ((hl.up -= dt * 6) <= 0) { hl.item = null; hl.up = 0; } }
    if (G.timeLeft <= 0) endGame(G, G.hits >= G.goal * .35);
  };
  G.draw = g => {
    drawBg(g, bg, null, .2);
    for (const hl of G.holes) {
      g.fillStyle = '#141414'; g.beginPath(); g.ellipse(hl.x, hl.y, hl.rw * 1.1, hl.rw * .38, 0, 0, 7); g.fill();
      if (hl.item && hl.up > 0) {
        g.save(); g.beginPath(); g.rect(hl.x - hl.rw * 2, 0, hl.rw * 4, hl.y); g.clip();
        const top = hl.y + hl.rw * 1.6 * (1 - hl.up);
        drawSprite(g, hl.img, hl.x, top + hl.rw * .25, hl.rw * 1.7, { sy: hl.hit ? .7 : 1, flash: hl.hit ? .5 : 0 });
        drawBadge(g, hl.item, hl.x, top - hl.rw * 1.55, hl.rw * .62);
        g.restore();
      }
      g.strokeStyle = '#141414'; g.lineWidth = 5; g.fillStyle = '#6b4a2b'; g.beginPath(); g.ellipse(hl.x, hl.y + hl.rw * .12, hl.rw * 1.18, hl.rw * .3, 0, 0, Math.PI); g.fill(); g.stroke();
    }
    if (G.hammer) { g.save(); g.translate(G.hammer.x, G.hammer.y); g.rotate(-.8 + (1 - G.hammer.t / .25) * 1.2); g.font = `${12 * U}px "Apple Color Emoji",sans-serif`; g.textAlign = 'center'; g.fillText('🔨', 0, 0); g.restore(); }
  };
  G.start = () => startMsg(G, 'اِضْرِبِ الْوَحْشَ الَّذي يَحْمِلُ الْجَوابَ 🔨');
  return G;
}

/* ================= الكتابة بالقلم (الضربة الخارقة) ================= */
function traceLetter(L, diff) {
  return new Promise(res => {
    const ov = $('#trace-ov'), box = $('#trace-box'), [bgc, ink] = box.querySelectorAll('canvas');
    ov.classList.add('on'); chain(() => venom('finish'), () => sayLetter(L));
    const tol = 40 - 14 * diff, need = .6 + .15 * diff, pen = 16;
    let Wd, Ht, samples = [], covered = new Uint8Array(0), mask = null, nPts = 0, outside = 0, penSeen = false, done = false, drawing = false, last;
    const glyph = diff < .2 || Math.random() < .5 ? L : L.toLowerCase();
    requestAnimationFrame(() => (document.fonts ? document.fonts.load('700 100px Andika') : Promise.resolve()).then(setup));
    function setup() {
      const dpr = Math.min(2, devicePixelRatio || 1); Wd = box.clientWidth; Ht = box.clientHeight;
      [bgc, ink].forEach(c => { c.width = Wd * dpr; c.height = Ht * dpr; c.style.width = Wd + 'px'; c.style.height = Ht + 'px'; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); });
      const g = bgc.getContext('2d'); g.direction = 'ltr'; g.textAlign = 'left'; g.clearRect(0, 0, Wd, Ht);
      const F = Ht * .82; g.font = `700 ${F}px Andika`; const m = g.measureText(glyph); const x0 = (Wd - m.width) / 2, y = Ht * .5 + F * .34;
      g.fillStyle = '#ffe9a8'; g.fillText(glyph, x0, y); g.setLineDash([7, 7]); g.lineWidth = 4; g.strokeStyle = '#141414'; g.strokeText(glyph, x0, y); g.setLineDash([]);
      const mc = document.createElement('canvas'); mc.width = Wd; mc.height = Ht; const mx = mc.getContext('2d'); mx.direction = 'ltr'; mx.textAlign = 'left'; mx.font = g.font; mx.fillText(glyph, x0, y);
      const inner = mx.getImageData(0, 0, Wd, Ht).data; samples = [];
      for (let yy = 0; yy < Ht; yy += 5) for (let xx = 0; xx < Wd; xx += 5) if (inner[(yy * Wd + xx) * 4 + 3] > 128) samples.push([xx, yy]);
      covered = new Uint8Array(samples.length); mx.lineWidth = tol; mx.lineJoin = 'round'; mx.strokeText(glyph, x0, y); mask = mx.getImageData(0, 0, Wd, Ht).data;
      ink.getContext('2d').clearRect(0, 0, Wd, Ht); nPts = outside = 0;
    }
    const P = e => { const r = ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const R2 = (pen / 2 + 8) ** 2;
    const mark = ([x, y]) => { nPts++; if (!(x >= 0 && y >= 0 && x < Wd && y < Ht && mask && mask[((y | 0) * Wd + (x | 0)) * 4 + 3] > 0)) outside++; for (let i = 0; i < samples.length; i++) if (!covered[i]) { const dx = samples[i][0] - x, dy = samples[i][1] - y; if (dx * dx + dy * dy < R2) covered[i] = 1; } };
    const score = () => { const cov = covered.reduce((a, b) => a + b, 0) / (samples.length || 1); const out = outside / (nPts || 1); return { cov, out, pass: cov >= need && out <= .3 }; };
    const finish = r => { if (done) return; done = true; ov.classList.remove('on'); ink.onpointerdown = ink.onpointermove = ink.onpointerup = ink.onpointercancel = null; res(r); };
    ink.onpointerdown = e => { if (done) return; if (e.pointerType === 'pen') penSeen = true; else if (penSeen && e.pointerType === 'touch') return; e.preventDefault(); try { ink.setPointerCapture(e.pointerId); } catch (er) {} drawing = true; last = P(e); mark(last); };
    ink.onpointermove = e => { if (!drawing) return; e.preventDefault(); const x = ink.getContext('2d'); x.strokeStyle = '#00a8ff'; x.lineWidth = pen; x.lineCap = x.lineJoin = 'round'; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; (evs.length ? evs : [e]).forEach(ev => { const p = P(ev); x.beginPath(); x.moveTo(last[0], last[1]); x.lineTo(p[0], p[1]); x.stroke(); last = p; mark(p); }); };
    ink.onpointerup = ink.onpointercancel = () => { if (!drawing) return; drawing = false; if (score().pass) { SFX.pow(); setTimeout(() => finish(true), 250); } };
    $('#trace-clear').onclick = () => { SFX.click(); setup(); };
    $('#trace-ok').onclick = () => { const s = score(); if (s.pass) return finish(true); SFX.bad(); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); toast(nPts && s.out > .3 ? 'اُكْتُبْ فَوْقَ الْحَرْفِ تَماماً ✏️' : 'أَكْمِلْ كِتابَةَ الْحَرْفِ كُلِّهِ ✏️'); setup(); };
    if (TEST) box._win = () => finish(true);
  });
}

/* ================= تشغيل مرحلة ================= */
const MAKERS = { run: (w, s) => gameRun(w, s, false), boss: (w, s) => gameRun(w, s, true), pop: gamePop, catch: gameCatch, slash: gameSlash, whack: gameWhack };
function startStage(w, s) {
  stopVoice(); S.world = w; save(); if (GAME) GAME.over = true; GAME = null;
  show('game'); $('#combo').className = 'combo'; $('#banner').className = 'banner'; $('#trace-ov').classList.remove('on');
  requestAnimationFrame(() => {
    resize(); GAME = MAKERS[STAGES[s].g](w, s); hud(GAME); GAME.start(); MUSIC && MUSIC.start(STAGES[s].g === 'boss' ? 'battle' : 'action');
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); }
  });
}
const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
cv.addEventListener('pointerdown', e => { if (!GAME || GAME.paused || GAME.over) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} GAME.onDown && GAME.onDown(...pos(e), e); });
cv.addEventListener('pointermove', e => { if (!GAME || GAME.paused || GAME.over) return; if (e.pointerType === 'mouse' && !e.buttons && GAME.kind !== 'run' && GAME.kind !== 'boss' && GAME.kind !== 'catch') return; GAME.onMove && GAME.onMove(...pos(e), e); });
cv.addEventListener('pointerup', e => { GAME && GAME.onUp && GAME.onUp(...pos(e), e); });
$('#target').onclick = () => { if (!GAME) return; SFX.click(); if (GAME.kind === 'slash') say(GAME.word); else if (GAME.task) GAME.task.speak(); };
$('#g-exit').onclick = async () => { const G = GAME; if (!G) return; SFX.click(); G.paused = true; if (await confirmBox('تَخْرُجُ مِنَ الْمُهِمَّةِ؟')) { G.over = true; if (GAME === G) GAME = null; stopVoice(); MUSIC && MUSIC.stop(); openWorlds(S.world); } else G.paused = false; };

async function endGame(G, win) {
  if (G.over) return; G.over = true; stopVoice(); MUSIC && MUSIC.stop(); $('#combo').classList.remove('on');
  let stars = 0;
  if (win) {
    if (G.timeLeft != null) { const r = (G.kind === 'slash' ? G.words : G.hits) / G.goal; stars = r >= 1 ? 3 : r >= .65 ? 2 : 1; }
    else stars = Math.max(1, G.hearts);
  }
  const timeUp = G.timeLeft != null && G.timeLeft <= 0;
  banner(win ? (timeUp ? "TIME'S UP!" : 'MISSION COMPLETE!') : 'KO!', 1600);
  venom(win ? (timeUp ? 'timeUp' : 'mission') : 'lost');
  await sleep(1900);
  if (GAME !== G) return;
  GAME = null;
  const k = sk(G.w, G.s), prevStars = starsOf(G.w, G.s), prevBest = S.best[k] || 0;
  const record = win && G.score > prevBest && prevBest > 0;
  if (win) { S.done[k] = Math.max(prevStars, stars); S.best[k] = Math.max(prevBest, G.score); }
  S.gems += Math.round(G.score / 10);
  const newCards = [];
  if (win) [...G.got].forEach(w => { const had = S.cards[w] || 0, lv = stars === 3 ? 2 : 1; if (pics.some(p => p[0] === w) && lv > had) { S.cards[w] = lv; newCards.push({ w, gold: lv === 2 }); } });
  save();
  if (win && stars === 3) await celebrate(pick(['siuuu', 'hero', 'genius', 'smart']));
  showResult(G, win, stars, record, newCards);
}

/* ================= النتيجة ================= */
function cardHtml(w, lv, extra = '') {
  const p = pics.find(x => x[0] === w); const wc = WORLDS[(p ? p[2] : 1) - 1].color;
  return lv ? `<div class="hcard got ${lv === 2 ? 'gold' : ''}" style="--wc:${wc};${extra}"><span class="L">${w[0].toUpperCase()}</span><span class="e">${p ? p[1] : '⭐'}</span><span class="w">${w}</span></div>`
    : `<div class="hcard"><span class="q">?</span></div>`;
}
function showResult(G, win, stars, record, newCards) {
  const c = $('#res-card'); show('result');
  const nextS = G.s + 1 < STAGES.length ? [G.w, G.s + 1] : G.w < WORLDS.length ? [G.w + 1, 0] : null;
  c.innerHTML = `<h2 class="${win ? '' : 'fail'}">${win ? (stars === 3 ? 'AWESOME!' : 'GOOD JOB!') : 'TRY AGAIN!'}</h2>
    <div class="big-stars">${[1, 2, 3].map((k, i) => `<i class="${k <= stars ? 'on' : ''}" style="animation-delay:${.2 + i * .25}s">★</i>`).join('')}</div>
    <div class="pts">${G.score}<small>${record ? '🏆 NEW HIGH SCORE!' : 'BEST: ' + Math.max(G.score, S.best[sk(G.w, G.s)] || 0)}${G.bestCombo >= 5 ? ' · 🔥 x' + G.bestCombo : ''}</small></div>
    ${newCards.length ? `<p>🃏 بِطاقاتُ أَبْطالٍ جَديدَةٌ!</p><div class="new-cards">${newCards.map((n, i) => cardHtml(n.w, n.gold ? 2 : 1, `animation-delay:${.4 + i * .12}s`).replace('class="hcard', 'class="hcard fly')).join('')}</div>` : `<img class="hero" src="img/c_hero.webp?v=1" alt="">`}
    ${!win ? '<p>لا بَأْسَ يا بَطَلُ! حاوِلْ مَرَّةً ثانِيَةً 💪</p>' : stars < 3 ? '<p><small>اِجْمَعْ ٣ نُجومٍ لِتَصيرَ بِطاقاتُكَ ذَهَبِيَّةً ✨</small></p>' : ''}${win && G.st.g === 'boss' && G.w === WORLDS.length ? '<p>🏆 أَنْهَيْتَ كِتابَ الْإِنْجِليزِيِّ كُلَّهُ يا بَطَلُ!</p>' : ''}`;
  const row = el('div', 'row');
  const again = el('button', 'cbtn', '↻ AGAIN'); again.onclick = () => { SFX.click(); startStage(G.w, G.s); };
  const map = el('button', 'cbtn', '🗺️ MISSIONS'); map.onclick = () => { SFX.click(); openWorlds(nextS && win ? nextS[0] : G.w); };
  row.append(again, map);
  if (win && nextS) { const nx = el('button', 'cbtn go pulse', 'NEXT ▶'); nx.onclick = () => { SFX.click(); startStage(nextS[0], nextS[1]); }; row.appendChild(nx); }
  c.appendChild(row);
  if (newCards.length) setTimeout(() => venom('card'), 700); else if (record) venom('record'); else if (!win) playClip('tryagain');
}

/* ================= الشاشات ================= */
function stats() {
  return `<span class="chip">⭐ ${totalStars()}/${WORLDS.length * STAGES.length * 3}</span><span class="chip">🃏 ${Object.keys(S.cards).length}/${pics.length}</span><span class="chip">💎 ${S.gems}</span>`;
}
function openHome() { stopVoice(); $('#home-stats').innerHTML = stats(); show('home'); }
$('#play').onclick = () => { SFX.click(); ac(); venom('hello'); openWorlds(S.world || 1); };
$('#h-cards').onclick = () => { SFX.click(); openCards('home'); };
$('#w-home').onclick = () => { SFX.click(); openHome(); };
if (MUSIC) { $('#w-music').onclick = () => { SFX.click(); MUSIC.toggle(); }; MUSIC.onChange(on => $('#w-music').classList.toggle('off', !on)); } else $('#w-music').remove();

let curW = 1;
function openWorlds(w) {
  curW = w = w || 1; S.world = w; save(); show('worlds');
  $('#w-stats').innerHTML = `<span class="chip">⭐ ${totalStars()}</span><button class="chip" id="w-cards">🃏 ${Object.keys(S.cards).length}</button>`;
  $('#w-cards').onclick = () => { SFX.click(); openCards('worlds'); };
  const tabs = $('#world-tabs'); tabs.innerHTML = '';
  WORLDS.forEach(Wd => {
    const open = unlocked(Wd.id, 0);
    const t = el('button', 'wtab' + (Wd.id === w ? ' on' : '') + (open ? '' : ' lock'), `${Wd.id}. ${Wd.title.toUpperCase()}<small>${Wd.ar}</small>`);
    t.style.setProperty('--wc', Wd.color);
    t.onclick = () => { SFX.click(); if (!open) return toast('🔒 اِهْزِمْ زَعيمَ الْعالَمِ الَّذي قَبْلَهُ'); openWorlds(Wd.id); };
    tabs.appendChild(t);
  });
  const box = $('#missions'); box.innerHTML = '';
  const Wd = WORLDS[w - 1]; let nextMarked = false;
  STAGES.forEach((st, s) => {
    const open = unlocked(w, s), stars = starsOf(w, s), best = S.best[sk(w, s)];
    const isNext = open && !stars && !nextMarked; if (isNext) nextMarked = true;
    const m = el('button', 'mission' + (st.g === 'boss' ? ' boss' : '') + (open ? '' : ' lock') + (isNext ? ' next' : ''));
    m.style.backgroundImage = `url(img/c_bg_${Wd.bg}.webp?v=1)`;
    m.innerHTML = `<span class="num">#${s + 1}</span><span class="ico">${{ run: '<img src="img/c_hero.webp?v=1">', whack: '<img src="img/c_m2.webp?v=1">', boss: '<img src="img/c_boss.webp?v=1" style="transform:scaleX(-1)">' }[st.g] || st.icon}</span>${best ? `<span class="best">🏆 ${best}</span>` : ''}
      <div class="cap"><b>${st.name.toUpperCase()}</b><span>${st.ar}</span><span class="stars">${[1, 2, 3].map(k => `<i class="${k <= stars ? 'on' : ''}">★</i>`).join('')}</span></div>`;
    m.style.setProperty('--i', s);
    m.onclick = () => { SFX.click(); if (!open) return toast('🔒 أَنْهِ الْمُهِمَّةَ الَّتي قَبْلَها'); startStage(w, s); };
    box.appendChild(m);
  });
}
let cardsBack = 'home';
function openCards(from) {
  cardsBack = from; show('cards'); const wrap = $('#cards-wrap'); wrap.innerHTML = '';
  $('#c-count').textContent = `${Object.keys(S.cards).length} / ${pics.length}`;
  WORLDS.forEach(Wd => {
    const pg = el('div', 'cpage', `<h3 style="--wc:${Wd.color}">${Wd.title.toUpperCase()} <small>${Wd.ar}</small></h3>`);
    const grid = el('div', 'cgrid');
    pics.filter(p => p[2] === Wd.id).forEach(p => {
      const lv = S.cards[p[0]] || 0; const d = el('div'); d.innerHTML = cardHtml(p[0], lv); const cd = d.firstChild;
      cd.onclick = () => { if (!lv) { SFX.bad(); return toast('اِجْمَعْها في الْمُهِمّاتِ 🃏'); } SFX.pop(); cd.classList.remove('wig'); void cd.offsetWidth; cd.classList.add('wig'); say(p[0]); };
      grid.appendChild(cd);
    });
    pg.appendChild(grid); wrap.appendChild(pg);
  });
}
$('#c-back').onclick = () => { SFX.click(); cardsBack === 'home' ? openHome() : openWorlds(curW); };

openHome();
/* تقدّم أحدث جاء من السحابة */
CLOUD && CLOUD.on(KEY, st => {
  if (!st) return; S = Object.assign({ done: {}, best: {}, gems: 0, cards: {}, world: 1 }, st);
  if ($('#home').classList.contains('on')) $('#home-stats').innerHTML = stats();
  else if ($('#worlds').classList.contains('on')) openWorlds(curW);
});
if (TEST) window.__game = { get G() { return GAME; }, startStage, S, save, openWorlds };
})();
