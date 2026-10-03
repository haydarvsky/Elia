/* متجر الجواهر — يُشترى بالجواهر المجموعة من كل الألعاب، وما يُجهَّز يظهر داخل اللعب.
   الرصيد = مجموع جواهر الألعاب − ما صُرف. الحالة في localStorage (elia-shop-v1) وتُزامَن مع السحابة عبر save.js.
   EliaShop.balance() · buy(id) · equip(id) · eq(slot) · sword() · pet() · fx() · icon(id) · onChange(fn) */
(() => {
'use strict';
const KEY = 'elia-shop-v1', GEMKEYS = ['elia-letters-v1', 'elia-venom-v2', 'elia-spider-v1', 'elia-tests-v1'];
const lget = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
function pix(map, colors) {
  const rows = map.trim().split('\n').map(s => s.trim()), w = rows[0].length; let out = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) out += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${colors[ch]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}
const SWORD = `
......kk
.....kck
....kck.
.k.kck..
..kck...
..kbk...
.kbk.k..
kk......`;
const sw = (c, b = '#8b5a2b') => ({ k: '#000', c, b });
const PETS = {
  cat: [`
.k......k.
kok....kok
koookkoook
kooooooook
kowkoowkok
kooopooook
koowwwwook
.kooooook.
..kkkkkk..`, { k: '#000', o: '#f39a3c', w: '#fff', p: '#ff8fb0' }],
  dog: [`
..kkkkkk..
kkooooookk
kbkooookbk
kbwkookwbk
kboonnoobk
kkoorrookk
.kooooook.
..kkkkkk..`, { k: '#000', n: '#000', o: '#c98a4b', b: '#7a4a22', w: '#fff', r: '#ff5f6d' }],
  chick: [`
...kkkk...
..kyyyyk..
.kyyyyyyk.
.kykyykyk.
kyyyooyyyk
kyyyyyyyyk
.kyyyyyyk.
..kokkok..`, { k: '#000', y: '#ffd83d', o: '#ff8a1c' }],
  fox: [`
kk......kk
kok....kok
kookkkkook
kooooooook
kowkookwok
kwwoooowwk
.kwwkkwwk.
..kwwwwk..
...kkkk...`, { k: '#000', o: '#ff7a1a', w: '#fff' }],
  dragon: [`
k.k....k.k
kgkkkkkkgk
kggggggggk
kgwkggkwgk
kggggggggk
kggkggkggk
kgrrrrrrgk
kgwrwrwrgk
.kggggggk.
..kkkkkk..`, { k: '#000', g: '#3fbf4a', r: '#c9211b', w: '#fff' }],
};
const FXI = {
  confetti: [`
k..y...b
..r..g..
.g..y..r
b..k..y.
..y..b..
r..g...k`, { k: '#fff', y: '#ffd83d', b: '#4ae3e0', r: '#e0342f', g: '#29d162' }],
  stars: [`
...k...
..kyk..
kkkyykk
kyyyyyk
.kyyyk.
.kykyk.
kk...kk`, { k: '#000', y: '#ffd83d' }],
  hearts: [`
.kk.kk.
krrkrrk
krwrrrk
krrrrrk
.krrrk.
..krk..
...k...`, { k: '#000', r: '#ff5f8f', w: '#fff' }],
  rainbow: [`
..rrrr..
.roooor.
royyyyor
roy..yor
ro....or`, { r: '#e0342f', o: '#ff8a1c', y: '#ffd83d' }],
  fireworks: [`
y..r..y
.y.r.y.
..yry..
rrrwrrr
..yry..
.y.r.y.
y..r..y`, { y: '#ffd83d', r: '#ff5a1a', w: '#fff' }],
};
const ITEMS = [
  { id: 'wood', slot: 'sword', name: 'سَيْفُ الْخَشَبِ', price: 0, col: sw('#b98a52', '#5e3b1c') },
  { id: 'stone', slot: 'sword', name: 'سَيْفُ الْحَجَرِ', price: 15, col: sw('#a3a3a3') },
  { id: 'gold', slot: 'sword', name: 'سَيْفُ الذَّهَبِ', price: 40, col: sw('#ffd83d') },
  { id: 'diamond', slot: 'sword', name: 'سَيْفُ الْأَلْماسِ', price: 80, col: sw('#4ae3e0') },
  { id: 'fire', slot: 'sword', name: 'سَيْفُ النّارِ', price: 150, col: sw('#ff5a1a', '#3b1a0a') },
  { id: 'nopet', slot: 'pet', name: 'بِلا رَفيقٍ', price: 0 },
  { id: 'chick', slot: 'pet', name: 'الْكَتْكوتُ', price: 20 },
  { id: 'cat', slot: 'pet', name: 'الْقِطَّةُ', price: 30 },
  { id: 'dog', slot: 'pet', name: 'الْكَلْبُ', price: 30 },
  { id: 'fox', slot: 'pet', name: 'الثَّعْلَبُ', price: 60 },
  { id: 'dragon', slot: 'pet', name: 'التِّنّينُ', price: 120 },
  { id: 'confetti', slot: 'fx', name: 'قُصاصاتٌ', price: 0, colors: ['#29d162', '#4ae3e0', '#ffd83d', '#fff'], shape: '' },
  { id: 'stars', slot: 'fx', name: 'نُجومٌ', price: 20, colors: ['#ffd83d', '#fff3a8', '#fff', '#ffb020'], shape: 'star' },
  { id: 'hearts', slot: 'fx', name: 'قُلوبٌ', price: 25, colors: ['#ff5f8f', '#ff8fb0', '#e0342f', '#fff'], shape: 'heart' },
  { id: 'rainbow', slot: 'fx', name: 'قَوْسُ قُزَحَ', price: 40, colors: ['#e0342f', '#ff8a1c', '#ffd83d', '#29d162', '#3d8bff', '#c23ad8'], shape: '' },
  { id: 'fireworks', slot: 'fx', name: 'أَلْعابٌ نارِيَّةٌ', price: 60, colors: ['#ff5a1a', '#ffd83d', '#fff', '#ff5f8f', '#4ae3e0'], shape: 'dot', more: 1.6 },
];
const DEF = { sword: 'wood', pet: 'nopet', fx: 'confetti' };
const byId = id => ITEMS.find(i => i.id === id);
const subs = [];
function state() { const s = lget(KEY) || {}; return { spent: s.spent || 0, own: s.own || {}, eq: Object.assign({}, DEF, s.eq || {}) }; }
function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} window.EliaSave && EliaSave.push(); subs.forEach(f => { try { f(); } catch (e) {} }); }
const earned = () => GEMKEYS.reduce((a, k) => a + ((lget(k) || {}).gems || 0), 0);
const owns = (s, it) => !it.price || !!s.own[it.id];

window.EliaShop = {
  ITEMS, SLOTS: [['sword', 'السُّيوفُ'], ['pet', 'الرِّفاقُ'], ['fx', 'الْمُؤَثِّراتُ']],
  balance() { return Math.max(0, earned() - state().spent); },
  owned(id) { return owns(state(), byId(id)); },
  equipped(id) { const it = byId(id); return state().eq[it.slot] === id; },
  buy(id) {                                          // 'ok' | 'poor' | 'owned'
    const s = state(), it = byId(id); if (!it) return 'poor'; if (owns(s, it)) return 'owned';
    if (Math.max(0, earned() - s.spent) < it.price) return 'poor';
    s.spent += it.price; s.own[id] = 1; s.eq[it.slot] = id; write(s); return 'ok';
  },
  equip(id) { const s = state(), it = byId(id); if (!it || !owns(s, it)) return false; s.eq[it.slot] = id; write(s); return true; },
  eq(slot) { const s = state(), it = byId(s.eq[slot]); return it && owns(s, it) ? it : byId(DEF[slot]); },
  sword() { return this.eq('sword').col; },                                   // ألوان السيف لساحة المعركة
  pet() { const p = PETS[this.eq('pet').id]; return p ? pix(p[0], p[1]) : ''; },  // SVG الرفيق أو ''
  fx() { return this.eq('fx'); },                                             // { colors, shape, more }
  icon(id) { const it = byId(id); if (it.slot === 'sword') return pix(SWORD, it.col); if (it.slot === 'pet') return PETS[id] ? pix(PETS[id][0], PETS[id][1]) : ''; return pix(FXI[id][0], FXI[id][1]); },
  onChange(fn) { subs.push(fn); },
};
window.EliaSave && EliaSave.on(KEY, () => subs.forEach(f => { try { f(); } catch (e) {} }));
})();
