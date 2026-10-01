/* موسيقى خلفية مولّدة بالكود (WebAudio) — بلا ملفات صوت.
   EliaMusic.start('battle' | 'action')  ·  stop()  ·  tense(true)  ·  toggle()  ·  watch(audioEl)
   watch: تخفض الموسيقى تلقائياً حين يتكلّم صوت المعلّمة/البطل حتى يبقى النطق واضحاً. */
(() => {
'use strict';
const KEY = 'elia-music-off';
let off = false; try { off = localStorage.getItem(KEY) === '1'; } catch (e) {}
let ac = null, master = null, duckG = null, noiseBuf = null, timer = 0, song = null, step = 0, nextT = 0, hot = false;
const talking = new Set(), subs = [];
const hz = n => 440 * Math.pow(2, (n - 69) / 12);

function ctx() {
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = .9; duckG = ac.createGain(); duckG.connect(master); master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * .2, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  if (ac && ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(n, t, d, type, vol) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = hz(n);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(duckG); o.start(t); o.stop(t + d + .03);
}
function kick(t, vol) {
  const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16); o.connect(g).connect(duckG); o.start(t); o.stop(t + .18);
}
function hiss(t, d, vol, freq) {
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(f).connect(g).connect(duckG); s.start(t); s.stop(t + d + .02);
}

/* كل أغنية: ٤ مقاطع (bars) × ١٦ خطوة. chords = جذر كل مقطع مع نغمات الأربيجيو، mel = لحن اختياري فوقها */
const SONGS = {
  battle: { bpm: 138, bassType: 'sawtooth', leadType: 'square',
    chords: [[45, [69, 72, 76, 72]], [45, [69, 72, 76, 81]], [41, [65, 69, 72, 69]], [43, [67, 71, 74, 79]]],
    mel: [81, 0, 0, 79, 0, 76, 0, 0, 76, 0, 79, 0, 81, 0, 84, 0, 83, 0, 0, 81, 0, 79, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
  action: { bpm: 124, bassType: 'triangle', leadType: 'square',
    chords: [[48, [72, 76, 79, 76]], [43, [71, 74, 79, 74]], [45, [69, 72, 76, 72]], [41, [69, 72, 77, 72]]],
    mel: [84, 0, 0, 0, 79, 0, 81, 0, 0, 0, 79, 0, 0, 0, 0, 0, 77, 0, 0, 0, 76, 0, 74, 0, 0, 0, 72, 0, 0, 0, 0, 0],
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
};
function schedule(s, i, t, dur) {
  const bar = (i >> 4) & 3, k = i & 15, [root, arp] = s.chords[bar];
  if (k % 2 === 0) tone(root + (k % 8 === 6 ? 12 : 0), t, dur * 1.8, s.bassType, .05);
  tone(arp[k % 4] - (k % 8 >= 4 ? 0 : 12), t, dur * .9, s.leadType, .016);
  const m = s.mel[((i >> 1) % s.mel.length)]; if (m && i % 2 === 0 && ((i >> 6) & 1)) tone(m, t, dur * 2.6, 'triangle', .05);   // اللحن في الدورة الثانية
  if (s.kick[k]) kick(t, .16);
  if (s.snare[k]) hiss(t, .11, .07, 1800);
  if (k % 2 === 0 || hot) hiss(t, .03, .022, 7000);
}
function tick() {
  if (!song || !ctx()) return;
  const dur = 60 / (song.bpm * (hot ? 1.16 : 1)) / 4;
  if (nextT < ac.currentTime) nextT = ac.currentTime + .05;
  while (nextT < ac.currentTime + .18) { schedule(song, step, nextT, dur); step++; nextT += dur; }
}
function run() { clearInterval(timer); timer = 0; if (song && !off && ctx()) { nextT = ac.currentTime + .06; timer = setInterval(tick, 50); } }
function setDuck() { if (ac) duckG.gain.setTargetAtTime(talking.size ? .22 : 1, ac.currentTime, .06); }

window.EliaMusic = {
  start(kind) { const s = SONGS[kind]; if (!s) return; if (song === s && timer) return; song = s; step = 0; hot = false; run(); },
  stop() { song = null; hot = false; clearInterval(timer); timer = 0; },
  tense(on) { hot = !!on; },                                            // القلب الأخير: أسرع وأشدّ
  toggle() { off = !off; try { localStorage.setItem(KEY, off ? '1' : '0'); } catch (e) {} run(); subs.forEach(f => f(!off)); return !off; },
  get on() { return !off; },
  onChange(fn) { subs.push(fn); fn(!off); },
  watch(a) {                                                              // اخفض الموسيقى أثناء الكلام
    if (!a || !a.addEventListener) return;
    a.addEventListener('playing', () => { talking.add(a); setDuck(); });
    ['pause', 'ended', 'error', 'emptied'].forEach(ev => a.addEventListener(ev, () => { talking.delete(a); setDuck(); }));
  },
};
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else if (song && !off) ac.resume(); });
})();
