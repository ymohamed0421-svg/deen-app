// FIRST DRAFT CONTENT. A course for reading the Quran from zero: the letters, how they join,
// the vowel marks, then real words from the Quran. Every lesson is marked `draft` and should be
// checked by a qualified Quran teacher before it is set to `approved`.
import type { ChoiceExercise, Course, Exercise, Lesson, MatchExercise, TeachCard, Unit } from './types.ts';

type Letter = { glyph: string; name: string; sound: string; hint: string };

export const LETTERS: Letter[] = [
  { glyph: 'ا', name: 'Alif', sound: 'aa (long a)', hint: 'Carries a long “aa” sound, or holds a hamza' },
  { glyph: 'ب', name: 'Ba', sound: 'b', hint: '“b” as in bat. One dot below' },
  { glyph: 'ت', name: 'Ta', sound: 't', hint: '“t” as in tea. Two dots above' },
  { glyph: 'ث', name: 'Tha', sound: 'th (think)', hint: '“th” as in think. Three dots above' },
  { glyph: 'ج', name: 'Jim', sound: 'j', hint: '“j” as in jam. One dot inside' },
  { glyph: 'ح', name: 'Ḥa (throat h)', sound: 'ḥ (throat)', hint: 'A breathy “h” from the middle of the throat. No dots' },
  { glyph: 'خ', name: 'Kha', sound: 'kh', hint: '“kh” like clearing your throat, as in Scottish loch. One dot above' },
  { glyph: 'د', name: 'Dal', sound: 'd', hint: '“d” as in door' },
  { glyph: 'ذ', name: 'Dhal', sound: 'dh (this)', hint: '“th” as in this. One dot above' },
  { glyph: 'ر', name: 'Ra', sound: 'r', hint: 'A lightly rolled “r”' },
  { glyph: 'ز', name: 'Zay', sound: 'z', hint: '“z” as in zoo. One dot above' },
  { glyph: 'س', name: 'Sin', sound: 's', hint: '“s” as in sun. Three little teeth' },
  { glyph: 'ش', name: 'Shin', sound: 'sh', hint: '“sh” as in shoe. Teeth with three dots' },
  { glyph: 'ص', name: 'Ṣad (heavy s)', sound: 'ṣ (heavy s)', hint: 'A heavy “s” said with a full, rounded mouth' },
  { glyph: 'ض', name: 'Ḍad (heavy d)', sound: 'ḍ (heavy d)', hint: 'A heavy “d” from the side of the tongue. One dot above' },
  { glyph: 'ط', name: 'Ṭa (heavy t)', sound: 'ṭ (heavy t)', hint: 'A heavy “t” with a full mouth' },
  { glyph: 'ظ', name: 'Ẓa (heavy dh)', sound: 'ẓ (heavy dh)', hint: 'A heavy “th” as in this. One dot above' },
  { glyph: 'ع', name: 'ʿAyn', sound: 'ʿ (deep throat)', hint: 'A tight sound from deep in the throat. There is no English match, so listen to a reciter' },
  { glyph: 'غ', name: 'Ghayn', sound: 'gh', hint: '“gh”, like gargling or a French “r”. One dot above' },
  { glyph: 'ف', name: 'Fa', sound: 'f', hint: '“f” as in fish. One dot above' },
  { glyph: 'ق', name: 'Qaf', sound: 'q (deep k)', hint: 'A deep “k” from the very back of the throat. Two dots above' },
  { glyph: 'ك', name: 'Kaf', sound: 'k', hint: '“k” as in kite' },
  { glyph: 'ل', name: 'Lam', sound: 'l', hint: '“l” as in lamp' },
  { glyph: 'م', name: 'Mim', sound: 'm', hint: '“m” as in moon' },
  { glyph: 'ن', name: 'Nun', sound: 'n', hint: '“n” as in noon. One dot above' },
  { glyph: 'ه', name: 'Ha (soft h)', sound: 'h', hint: 'A soft “h” as in hat' },
  { glyph: 'و', name: 'Waw', sound: 'w', hint: '“w” as in water, or a long “uu”' },
  { glyph: 'ي', name: 'Ya', sound: 'y', hint: '“y” as in yes, or a long “ii”. Two dots below' },
];

// Letters that look alike are learned together, so the dots do the work.
const GROUPS: { title: string; glyphs: string; teach: string }[] = [
  { title: 'Alif, Ba, Ta, Tha', glyphs: 'ابتث', teach: 'Arabic is read from right to left. Ba, Ta and Tha share one shape, a little boat. Only the dots change: one below, two above, three above.' },
  { title: 'Jim, Ḥa, Kha', glyphs: 'جحخ', teach: 'These three share a hook shape. Jim has a dot inside, Ḥa has none, and Kha has a dot on top.' },
  { title: 'Dal, Dhal, Ra, Zay', glyphs: 'دذرز', teach: 'Dal and Dhal are short corners; Ra and Zay dip below the line. The dot turns Dal into Dhal and Ra into Zay.' },
  { title: 'Sin, Shin, Ṣad, Ḍad', glyphs: 'سشصض', teach: 'Sin has three little teeth; three dots make it Shin. Ṣad and Ḍad have a loop and are heavy letters, said with a full mouth.' },
  { title: 'Ṭa, Ẓa, ʿAyn, Ghayn', glyphs: 'طظعغ', teach: 'Ṭa and Ẓa are heavy letters with a tall stick. ʿAyn and Ghayn come from the throat. A dot turns ʿAyn into Ghayn.' },
  { title: 'Fa, Qaf, Kaf, Lam', glyphs: 'فقكل', teach: 'Fa has one dot and Qaf has two, and Qaf dips lower. Kaf has a little mark inside. Lam is tall like a hook.' },
  { title: 'Mim, Nun, Ha, Waw, Ya', glyphs: 'منهوي', teach: 'The last five. Mim is a small circle with a tail, Nun a bowl with a dot, Ha a soft loop. Waw and Ya can also stretch a vowel long.' },
];

const byGlyph = (g: string) => LETTERS.find((l) => l.glyph === g)!;

/** Picks n letters to go with `answer`: first from this lesson, then from letters already learned. */
function distractors(answer: Letter, group: Letter[], learned: Letter[], n: number, offset: number) {
  const pool = [...group, ...learned, ...LETTERS].filter((l, i, a) => l !== answer && a.indexOf(l) === i);
  const picked: Letter[] = [];
  for (let i = 0; picked.length < n && i < pool.length; i++) picked.push(pool[(i + offset) % pool.length]);
  return picked;
}

function withAnswerAt(answer: string, others: string[], at: number) {
  const options = [...others];
  const index = at % (options.length + 1);
  options.splice(index, 0, answer);
  return { options, answer: index };
}

function letterLesson(index: number): Lesson {
  const g = GROUPS[index];
  const group = [...g.glyphs].map(byGlyph);
  const learned = GROUPS.slice(0, index).flatMap((x) => [...x.glyphs].map(byGlyph));
  const exercises: Exercise[] = [];

  group.forEach((letter, i) => {
    const others = distractors(letter, group, learned, 3, i + index);
    const name = withAnswerAt(letter.name, others.map((o) => o.name), i + 1);
    exercises.push({
      type: 'choice',
      prompt: 'Which letter is this?',
      picture: letter.glyph,
      options: name.options,
      answer: name.answer,
      explain: `This is ${letter.name}. ${letter.hint}.`,
    } satisfies ChoiceExercise);
  });

  // Find the letter by its name, which trains telling the dots apart.
  group.slice(0, 2).forEach((letter, i) => {
    const others = distractors(letter, group, learned, 3, i + 2);
    const glyph = withAnswerAt(letter.glyph, others.map((o) => o.glyph), i + 2);
    exercises.push({ type: 'choice', prompt: `Tap ${letter.name}`, options: glyph.options, answer: glyph.answer, explain: `${letter.glyph} is ${letter.name}. ${letter.hint}.` });
  });

  exercises.push({
    type: 'match',
    prompt: 'Match each letter to its sound',
    pairs: group.slice(0, 4).map((l) => [l.glyph, l.sound] as [string, string]),
    explain: group.map((l) => `${l.glyph} ${l.name}: ${l.sound}`).join(' · '),
  } satisfies MatchExercise);

  // Mix in letters from earlier lessons so they stay fresh.
  if (learned.length) {
    const old = learned[(index * 3) % learned.length];
    const others = distractors(old, learned, group, 3, index);
    const s = withAnswerAt(old.sound, others.map((o) => o.sound), index);
    exercises.push({ type: 'choice', prompt: 'Review: what sound does this letter make?', picture: old.glyph, options: s.options, answer: s.answer, explain: `${old.glyph} is ${old.name}. ${old.hint}.` });
  }

  return {
    id: `arabic-${index + 1}`,
    title: g.title,
    reviewStatus: 'draft',
    teach: g.teach,
    cards: group.map((l): TeachCard => ({ big: l.glyph, title: l.name, text: l.hint })),
    exercises,
  };
}

const choice = (prompt: string, options: string[], answer: number, explain: string, picture?: string): ChoiceExercise => ({ type: 'choice', prompt, options, answer, explain, picture });

const MARK_LESSONS: Lesson[] = [
  {
    id: 'arabic-8',
    title: 'Letters hold hands',
    reviewStatus: 'draft',
    teach:
      'In a word, most letters join to the next one and change shape a little: they lose their tail. Six letters never join to the letter after them: ا د ذ ر ز و. After one of these, the next letter starts fresh.',
    cards: [
      { big: 'بـ', title: 'At the start', text: 'Ba joins forward' },
      { big: 'ـبـ', title: 'In the middle', text: 'Joined on both sides' },
      { big: 'ـب', title: 'At the end', text: 'Keeps its tail' },
      { big: 'ا د ر و', title: 'Never join forward', text: 'With ذ and ز, six in all' },
    ],
    exercises: [
      choice('Which of these letters never joins to the letter after it?', ['ب', 'د', 'م', 'ك'], 1, 'Dal never joins forward. The six that never do are ا د ذ ر ز و.'),
      choice('Which one is Ba at the start of a word?', ['ـب', 'بـ', 'ـبـ'], 1, 'At the start, Ba loses its tail and reaches forward to join the next letter: بـ'),
      choice('Which one is Ba at the end of a word?', ['ـبـ', 'بـ', 'ـب'], 2, 'At the end, Ba keeps its tail: ـب'),
      { type: 'truefalse', statement: 'Arabic is read from right to left.', answer: true, explain: 'Yes. Start on the right and move left, for the Quran and all Arabic writing.' },
      choice('Which letter is this, joined at the start of a word?', ['Mim', 'Nun', 'Ya', 'Ba'], 2, 'Ya at the start of a word keeps its two dots below: يـ', 'يـ'),
    ],
  },
  {
    id: 'arabic-9',
    title: 'The short vowels',
    reviewStatus: 'draft',
    teach:
      'Little marks above or below a letter tell you the vowel. Fatha is a small line above and says “a”. Kasra is a small line below and says “i”. Damma is a small curl above and says “u”.',
    cards: [
      { big: 'بَ', title: 'Fatha', text: '“ba”' },
      { big: 'بِ', title: 'Kasra', text: '“bi”' },
      { big: 'بُ', title: 'Damma', text: '“bu”' },
    ],
    exercises: [
      choice('How do you read this?', ['ba', 'bi', 'bu'], 1, 'The line below is a kasra, so it says “bi”.', 'بِ'),
      choice('How do you read this?', ['ka', 'ki', 'ku'], 2, 'The curl above is a damma, so it says “ku”.', 'كُ'),
      choice('Which mark says “a”?', ['A small line below (kasra)', 'A small line above (fatha)', 'A small curl above (damma)'], 1, 'Fatha is the small line above, and says “a”.'),
      { type: 'match', prompt: 'Match each one to how it is read', pairs: [['لَ', 'la'], ['مِ', 'mi'], ['نُ', 'nu'], ['سَ', 'sa']], explain: 'Fatha says a, kasra says i, damma says u.' },
      choice('How do you read this word?', ['kataba', 'kutiba', 'kitab'], 0, 'Every letter has a fatha: ka-ta-ba. It means “he wrote”.', 'كَتَبَ'),
    ],
  },
  {
    id: 'arabic-10',
    title: 'Sukun and shadda',
    reviewStatus: 'draft',
    teach:
      'A small circle (sukun) means the letter has no vowel: you stop on it, like the “l” in قُلْ “qul”. A small “w” shape (shadda) means the letter is said twice, like رَبّ “rabb”.',
    cards: [
      { big: 'قُلْ', title: 'Sukun', text: '“qul”: stop on the lam' },
      { big: 'رَبِّ', title: 'Shadda', text: '“rabbi”: the ba is doubled' },
      { big: 'مِنْ', title: 'Sukun', text: '“min”' },
    ],
    exercises: [
      choice('How do you read this?', ['mina', 'min', 'mun'], 1, 'Kasra on mim, sukun on nun: “min”. It means “from”.', 'مِنْ'),
      choice('What does a shadda do?', ['Makes the letter silent', 'Says the letter twice', 'Makes a long vowel'], 1, 'Shadda doubles the letter, so you hold it a little longer.'),
      choice('How do you read this?', ['thuma', 'thumma', 'thamma'], 1, 'Damma on tha, shadda and fatha on mim: “thumma”. It means “then”.', 'ثُمَّ'),
      { type: 'match', prompt: 'Match each word to how it is read', pairs: [['قُلْ', 'qul'], ['لَمْ', 'lam'], ['إِنَّ', 'inna'], ['رَبِّ', 'rabbi']], explain: 'Sukun stops the letter; shadda doubles it.' },
    ],
  },
  {
    id: 'arabic-11',
    title: 'Tanween',
    reviewStatus: 'draft',
    teach:
      'When a vowel mark is written twice, it adds an “n” sound at the end of a word. This is tanween: بً “ban”, بٍ “bin”, بٌ “bun”.',
    cards: [
      { big: 'بً', title: 'Two fathas', text: '“ban”' },
      { big: 'بٍ', title: 'Two kasras', text: '“bin”' },
      { big: 'بٌ', title: 'Two dammas', text: '“bun”' },
    ],
    exercises: [
      choice('How do you read this?', ['ba', 'ban', 'bun'], 2, 'Two dammas say “un”, so it reads “bun”.', 'بٌ'),
      choice('How do you read the end of this word?', ['ahada', 'ahadun', 'ahadin'], 1, 'Two dammas on the last letter: a-ha-dun. From Surah Al-Ikhlas: “One”.', 'أَحَدٌ'),
      { type: 'match', prompt: 'Match each one to how it is read', pairs: [['كً', 'kan'], ['مٍ', 'min'], ['نٌ', 'nun']], explain: 'Double fatha = an, double kasra = in, double damma = un.' },
      { type: 'truefalse', statement: 'Tanween adds an “n” sound to the end of a word.', answer: true, explain: 'Yes. A doubled vowel mark adds “n”.' },
    ],
  },
  {
    id: 'arabic-12',
    title: 'Long vowels',
    reviewStatus: 'draft',
    teach:
      'Alif, Waw and Ya stretch a vowel to twice its length. Fatha then Alif makes a long “aa”, damma then Waw a long “uu”, kasra then Ya a long “ii”.',
    cards: [
      { big: 'بَا', title: 'Long aa', text: '“baa”' },
      { big: 'بُو', title: 'Long uu', text: '“buu”' },
      { big: 'بِي', title: 'Long ii', text: '“bii”' },
    ],
    exercises: [
      choice('How do you read this?', ['nur', 'nuur', 'nar'], 1, 'Damma then Waw makes a long “uu”: nuur. It means “light”.', 'نُور'),
      choice('How do you read this?', ['qaala', 'qala', 'qiila'], 0, 'Fatha then Alif makes a long “aa”: qaa-la. It means “he said”.', 'قَالَ'),
      choice('Which letter stretches a kasra into a long “ii”?', ['Alif', 'Waw', 'Ya'], 2, 'Kasra followed by Ya gives a long “ii”, as in دِين “diin”.'),
      { type: 'match', prompt: 'Match each word to how it is read', pairs: [['دِين', 'diin'], ['نُور', 'nuur'], ['بَاب', 'baab']], explain: 'Alif, Waw and Ya make the vowel long.' },
    ],
  },
];

const WORD_LESSONS: Lesson[] = [
  {
    id: 'arabic-13',
    title: 'Words of Al-Fatiha',
    reviewStatus: 'draft',
    teach:
      'Now put it together. These words open the Quran. Read them slowly, letter by letter, then listen to them in the Quran tab to hear them recited.',
    cards: [
      { big: 'بِسْمِ', title: 'bismi', text: 'In the name of' },
      { big: 'اللَّهِ', title: 'Allahi', text: 'Allah' },
      { big: 'الْحَمْدُ', title: 'al-hamdu', text: 'All praise' },
      { big: 'رَبِّ', title: 'rabbi', text: 'Lord of' },
    ],
    exercises: [
      choice('How do you read this?', ['bismi', 'basama', 'bisam'], 0, 'Kasra on ba, sukun on sin, kasra on mim: bis-mi.', 'بِسْمِ'),
      choice('How do you read this?', ['al-hamdu', 'al-hamad', 'al-hamida'], 0, 'Al, then ha with fatha, mim with sukun, dal with damma: al-ham-du.', 'الْحَمْدُ'),
      { type: 'match', prompt: 'Match each word to its meaning', pairs: [['بِسْمِ', 'In the name of'], ['الْحَمْدُ', 'All praise'], ['رَبِّ', 'Lord of'], ['الرَّحِيمِ', 'The Most Merciful']], explain: 'From Surah Al-Fatiha, 1:1 to 1:3.', source: { kind: 'quran', reference: 'Quran 1:1–3' } },
      choice('How do you read this?', ['ar-rahimi', 'ar-rahmi', 'ar-ruhumi'], 0, 'The ra has a shadda, so the lam is not said: ar-ra-hii-mi.', 'الرَّحِيمِ'),
    ],
  },
  {
    id: 'arabic-14',
    title: 'Words of Al-Ikhlas',
    reviewStatus: 'draft',
    teach: 'Surah Al-Ikhlas is short and loved. You already know every letter and mark in it. Read each word, then try the whole surah in the Quran tab.',
    cards: [
      { big: 'قُلْ', title: 'qul', text: 'Say' },
      { big: 'هُوَ', title: 'huwa', text: 'He is' },
      { big: 'أَحَدٌ', title: 'ahad', text: 'One' },
      { big: 'الصَّمَدُ', title: 'as-samad', text: 'The Eternal Refuge' },
    ],
    exercises: [
      choice('How do you read this?', ['huwa', 'hawa', 'hiya'], 0, 'Damma on ha, fatha on waw: hu-wa. It means “He”.', 'هُوَ'),
      choice('How do you read this?', ['yalid', 'yuladu', 'walad'], 0, 'Fatha on ya, kasra on lam, sukun on dal: ya-lid. “He did not beget.”', 'يَلِدْ'),
      { type: 'match', prompt: 'Match each word to its meaning', pairs: [['قُلْ', 'Say'], ['أَحَدٌ', 'One'], ['الصَّمَدُ', 'The Eternal Refuge']], explain: 'From Surah Al-Ikhlas.', source: { kind: 'quran', reference: 'Quran 112:1–2' } },
      { type: 'order', prompt: 'Tap the words of the first ayah in order', items: ['قُلْ', 'هُوَ', 'اللَّهُ', 'أَحَدٌ'], explain: 'قُلْ هُوَ اللَّهُ أَحَدٌ: “Say: He is Allah, One.”', source: { kind: 'quran', reference: 'Quran 112:1' } },
    ],
  },
];

const UNITS: Unit[] = [
  { id: 'arabic-letters', title: 'The letters', subtitle: 'All 28 letters, a few at a time', color: '#2E6FA3', foundation: true, tier: 'beginner', lessons: GROUPS.map((_, i) => letterLesson(i)) },
  { id: 'arabic-marks', title: 'Joining and vowels', subtitle: 'The marks that make letters speak', color: '#7A5BA6', foundation: true, tier: 'beginner', lessons: MARK_LESSONS },
  { id: 'arabic-words', title: 'Reading the Quran', subtitle: 'Your first words from the Quran', color: '#2F7D5B', foundation: true, tier: 'beginner', lessons: WORD_LESSONS },
];

export const ARABIC_COURSE: Course = {
  id: 'arabic',
  title: 'Read Arabic',
  subtitle: 'Learn the letters and read the Quran from zero',
  icon: 'ا ب',
  units: UNITS,
};
