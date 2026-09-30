/* منهج Skyline English — الصف الأول (1A) — وزارة التربية، الكويت 2025
   كل مستوى = درس من الكتاب. الأنواع:
   letter: حرف + كلماته   vocab: مفردات بصور   numbers: أعداد   colors: ألوان   spell: تهجئة   prep: in/on/under   boss: معركة نهاية العالم */
window.WORLDS = [
  { id: 1, title: 'All About Me', ar: 'كُلُّ شَيْءٍ عَنّي', bg: 'meadow', color: '#6fb24a' },
  { id: 2, title: 'My Family', ar: 'عائِلَتي', bg: 'cottage', color: '#e8904a' },
  { id: 3, title: 'My House', ar: 'بَيْتي', bg: 'house', color: '#4aa3c9' },
  { id: 4, title: 'My School', ar: 'مَدْرَسَتي', bg: 'school', color: '#9a6ad0' },
];

/* w = [الكلمة, الصورة]. الكلمات بلا صورة واضحة تُكتب بصورة فارغة '' فتظهر في التعلّم فقط */
window.LEVELS = [
  /* ---------- Unit 1: All About Myself (ص 10–25) ---------- */
  { world: 1, type: 'vocab', title: 'Hello!', page: 10, w: [['hello', '👋'], ['balloon', '🎈'], ['blue', '🔵'], ['black', '⚫']],
    say: ['Hello! My name is Elia.', 'What is your name?'] },
  { world: 1, type: 'letter', L: 'A', page: 11, w: [['ant', '🐜'], ['apple', '🍎'], ['arm', '💪'], ['angry', '😠']] },
  { world: 1, type: 'letter', L: 'C', page: 12, w: [['car', '🚗'], ['cap', '🧢'], ['cat', '🐱'], ['cow', '🐄']] },
  { world: 1, type: 'numbers', title: '1, 2, 3', page: 13, n: [1, 2, 3], extra: [['white', '⚪']] },
  { world: 1, type: 'letter', L: 'E', page: 14, w: [['egg', '🥚'], ['elephant', '🐘'], ['ear', '👂'], ['elbow', '']] },
  { world: 1, type: 'vocab', title: 'My Body', page: 15, w: [['head', '🙂'], ['mouth', '👄'], ['eye', '👁️'], ['nose', '👃'], ['hand', '✋']],
    say: ["What's that?", "It's a nose."] },
  { world: 1, type: 'letter', L: 'H', page: 16, w: [['hat', '🎩'], ['horse', '🐴'], ['hand', '✋'], ['hit', ''], ['have', '']] },
  { world: 1, type: 'letter', L: 'L', page: 17, w: [['lamb', '🐑'], ['lion', '🦁'], ['lemon', '🍋'], ['leg', '🦵']] },
  { world: 1, type: 'letter', L: 'T', page: 18, w: [['toy', '🧸'], ['tiger', '🐯'], ['toe', '🦶'], ['table', '']] },
  { world: 1, type: 'spell', title: 'Read & Build', page: 20, words: ['cat', 'hat', 'ant', 'car', 'cap', 'ear'] },
  { world: 1, type: 'boss', title: 'Goo Monster', page: 21 },

  /* ---------- Unit 2: Meet My Family (ص 28–43) ---------- */
  { world: 2, type: 'vocab', title: 'My Family', page: 28, w: [['father', '👨'], ['mother', '👩'], ['brother', '👦'], ['sister', '👧']],
    say: ['Who is this?', 'This is my father.'] },
  { world: 2, type: 'letter', L: 'F', page: 29, w: [['fan', '🪭'], ['fox', '🦊'], ['frog', '🐸'], ['foot', '🦶']] },
  { world: 2, type: 'letter', L: 'M', page: 30, w: [['mug', '☕'], ['man', '👨'], ['men', '👬'], ['mat', '']] },
  { world: 2, type: 'numbers', title: '4, 5, 6', page: 31, n: [4, 5, 6], extra: [['brown', '🟤'], ['orange', '🟠']] },
  { world: 2, type: 'letter', L: 'B', page: 32, w: [['box', '📦'], ['bat', '🦇'], ['bed', '🛏️'], ['bag', '👜']] },
  { world: 2, type: 'vocab', title: 'Every Day', page: 33, w: [['Quran', '📖'], ['mosque', '🕌'], ['read', '📚'], ['go', '🚶']],
    say: ['I go to the mosque every day.', 'We read Quran every day.'] },
  { world: 2, type: 'letter', L: 'O', page: 34, w: [['orange', '🍊'], ['octopus', '🐙'], ['ox', '🐂'], ['on', ''], ['open', ''], ['oven', '']] },
  { world: 2, type: 'letter', L: 'X', page: 35, w: [['x-ray', '🩻'], ['fox', '🦊'], ['box', '📦'], ['six', '6️⃣'], ['fix', '🔧'], ['mix', '🥣']], end: true },
  { world: 2, type: 'spell', title: 'The -at Family', page: 36, words: ['cat', 'hat', 'bat', 'mat', 'fan', 'box'] },
  { world: 2, type: 'letter', L: 'U', page: 37, w: [['umbrella', '☂️'], ['up', '⬆️'], ['upset', '😟'], ['under', '']] },
  { world: 2, type: 'boss', title: 'Goo Monster', page: 39 },

  /* ---------- Unit 3: My House (ص 46–61) ---------- */
  { world: 3, type: 'vocab', title: 'My House', page: 46, w: [['house', '🏠'], ['chair', '🪑'], ['table', '🍽️'], ['computer', '💻'], ['desk', '🗄️']],
    say: ["What's this?", 'This is a table.'] },
  { world: 3, type: 'letter', L: 'D', page: 47, w: [['duck', '🦆'], ['door', '🚪'], ['doll', '🪆'], ['draw', '✏️']] },
  { world: 3, type: 'letter', L: 'K', page: 48, w: [['key', '🔑'], ['king', '🤴'], ['kite', '🪁'], ['kick', '⚽']] },
  { world: 3, type: 'letter', L: 'W', page: 49, w: [['window', '🪟'], ['wall', '🧱'], ['wet', '💦'], ['walk', '🚶']] },
  { world: 3, type: 'colors', title: 'Colours', page: 50, c: ['pink', 'green', 'blue', 'red', 'yellow', 'brown', 'black', 'white', 'orange'],
    say: ['What colour is the table?', 'It is brown.'] },
  { world: 3, type: 'numbers', title: '7, 8', page: 51, n: [7, 8, 5, 6] },
  { world: 3, type: 'letter', L: 'I', page: 52, w: [['ice', '🧊'], ['ink', '🖋️'], ['in', '']] },
  { world: 3, type: 'prep', title: 'In, On, Under', page: 52 },
  { world: 3, type: 'letter', L: 'G', page: 53, w: [['girl', '👧'], ['goat', '🐐'], ['gloves', '🧤'], ['gift', '🎁'], ['go', '']] },
  { world: 3, type: 'letter', L: 'Y', page: 54, w: [['yoyo', '🪀'], ['yarn', '🧶'], ['yellow', '🟡'], ['yes', '✅']] },
  { world: 3, type: 'letter', L: 'Q', page: 55, w: [['queen', '👸'], ['quiet', '🤫'], ['question', '❓'], ['quilt', '']] },
  { world: 3, type: 'boss', title: 'Goo Monster', page: 57 },

  /* ---------- Unit 4: My School (ص 64–79) ---------- */
  { world: 4, type: 'vocab', title: 'My School', page: 64, w: [['school', '🏫'], ['art', '🎨'], ['paint', '🖌️'], ['purple', '🟣']],
    say: ['What are you doing?', 'I am painting.'] },
  { world: 4, type: 'letter', L: 'S', page: 65, w: [['sun', '☀️'], ['star', '⭐'], ['swim', '🏊'], ['sad', '😢'], ['sit', '']] },
  { world: 4, type: 'letter', L: 'R', page: 66, w: [['robot', '🤖'], ['ruler', '📏'], ['rose', '🌹'], ['run', '🏃'], ['red', '🔴']] },
  { world: 4, type: 'letter', L: 'J', page: 67, w: [['jar', '🫙'], ['jelly', '🍮'], ['jump', '🦘'], ['jam', '🍓']] },
  { world: 4, type: 'vocab', title: 'School Things', page: 68, w: [['pencil', '✏️'], ['book', '📕'], ['pen', '🖊️'], ['eraser', '🧽'], ['board', '🧑‍🏫']],
    say: ['Can I have a pencil, please?', 'Here you are.', 'Thank you.'] },
  { world: 4, type: 'letter', L: 'P', page: 69, w: [['plane', '✈️'], ['pan', '🍳'], ['pen', '🖊️'], ['push', ''], ['pull', '']] },
  { world: 4, type: 'letter', L: 'N', page: 70, w: [['nest', '🪺'], ['nuts', '🥜'], ['net', '🥅'], ['nap', '😴']] },
  { world: 4, type: 'numbers', title: '9, 10', page: 71, n: [9, 10, 7, 8] },
  { world: 4, type: 'letter', L: 'V', page: 72, w: [['van', '🚐'], ['vase', '🏺'], ['vest', '🦺'], ['vet', '🩺'], ['visit', '']] },
  { world: 4, type: 'letter', L: 'Z', page: 73, w: [['zebra', '🦓'], ['zoo', '🦁'], ['zero', '0️⃣'], ['zip', '🤐']] },
  { world: 4, type: 'boss', title: 'Goo King', page: 75, final: true },
];

/* الألوان للعبة الألوان */
window.COLORS = { red: '#e0463a', blue: '#3b7fd9', yellow: '#f4c928', green: '#4caf50', pink: '#f28bb5', black: '#2a2a2a', white: '#ffffff', brown: '#8b5a2b', orange: '#f28b24', purple: '#8e5ccf' };
window.NUMWORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/* جمل فينوم (صوت مسجّل في audio/v/) — المفتاح = اسم الملف */
window.VLINES = {
  hello: "Hello Elia! Let's learn English!",
  findLetter: 'Find the letter!', bigLetter: 'Find the big letter!', thisIs: 'This is the letter',
  listen: 'Listen and choose!', read: 'Read and choose!', whatsThis: "What's this?", howMany: 'How many?',
  whatColour: 'What colour is it?', add: "Let's add!", build: 'Build the word!', whereCat: 'Where is the cat?',
  trace: 'Trace the letter!', traceWord: 'Trace the missing letter!', traceNum: 'Trace the number!', traceWhole: 'Trace the word!',
  match: 'Draw a line to match them!', circleStart: 'Circle the pictures that start with', circleWith: 'Circle the pictures with the letter',
  circleWord: 'Find it and circle it!', learn: "Let's learn!",
  good1: 'Great job!', good2: 'Awesome!', good3: 'You got it!', good4: 'Super!', good5: 'Well done, Elia!', good6: 'Yes! We are a team!', good7: 'Fantastic!', good8: 'Amazing!',
  try1: 'Try again!', try2: 'Oops! Try again.', try3: 'Almost! Try again.',
  monster: 'Oh no! A goo monster! Help me, Elia!', hit1: 'Take that!', hit2: 'Bam!', hit3: 'Yes! Again!', hit4: 'Boom!',
  perfect: 'Perfect! Three stars!', didIt: 'We did it!', stickers: 'New stickers for your album!', combo: 'Combo! You are on fire!',
};
/* نطق أسماء الحروف (للتسجيل فقط) */
window.LETTERSAY = { A: 'Ay', B: 'Bee', C: 'See', D: 'Dee', E: 'Ee', F: 'Eff', G: 'Jee', H: 'Aitch', I: 'Eye', J: 'Jay', K: 'Kay', L: 'Ell', M: 'Em', N: 'En', O: 'Oh', P: 'Pee', Q: 'Cue', R: 'Ar', S: 'Ess', T: 'Tee', U: 'You', V: 'Vee', W: 'Double you', X: 'Ex', Y: 'Why', Z: 'Zee' };
/* جمل المعلّمة الثابتة غير الكلمات */
window.TLINES = ['The cat is in the box.', 'The cat is on the box.', 'The cat is on the table.', 'The cat is under the table.',
  'What colour is the apple?', 'What colour is the sun?', 'What colour is the frog?', 'What colour is the orange?',
  'It is red.', 'It is yellow.', 'It is green.', 'It is orange.'];
window.OBJCOLOR = [['apple', '🍎', 'red'], ['sun', '☀️', 'yellow'], ['frog', '🐸', 'green'], ['orange', '🍊', 'orange']];
