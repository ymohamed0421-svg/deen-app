// FIRST DRAFT CONTENT for Kids mode: short lessons with big pictures and gentle wording.
// Every lesson is marked `draft` and must be checked by a qualified scholar before it is `approved`.
import type { Course, Unit } from './types.ts';

const UNITS: Unit[] = [
  {
    id: 'kids-allah',
    title: 'Allah made everything',
    subtitle: 'Who made the sun, the sea and you?',
    color: '#2F7D5B',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'kids-allah-1',
        title: 'Our Creator',
        picture: '🌍',
        reviewStatus: 'draft',
        teach: 'Allah made everything: the sun, the moon, the trees, the animals and you! Allah is One, and there is nothing like Him.',
        cards: [
          { big: '☀️', title: 'The sun' },
          { big: '🌳', title: 'The trees' },
          { big: '🐪', title: 'The animals' },
          { big: '🧒', title: 'And you!' },
        ],
        exercises: [
          { type: 'choice', prompt: 'Who made the sun?', picture: '☀️', options: ['Allah', 'People', 'Nobody'], answer: 0, explain: 'Allah made the sun and everything else.', source: { kind: 'quran', reference: 'Quran 39:62' } },
          { type: 'truefalse', statement: 'Allah is One.', picture: '☝️', answer: true, explain: 'Yes! “Say: He is Allah, One.”', source: { kind: 'quran', reference: 'Quran 112:1' } },
          { type: 'choice', prompt: 'What do we say when we see something beautiful?', picture: '🌈', options: ['SubhanAllah', 'Goodbye', 'Oops'], answer: 0, explain: 'SubhanAllah means “Glory be to Allah”. We say it when we see how amazing Allah’s creation is.' },
        ],
      },
      {
        id: 'kids-allah-2',
        title: 'Allah is Ar-Rahman',
        picture: '💚',
        reviewStatus: 'draft',
        teach: 'Allah has beautiful names. Ar-Rahman means the Most Merciful. Allah gives us food, water, our family and so much more.',
        cards: [
          { big: '🍎', title: 'Food' },
          { big: '💧', title: 'Water' },
          { big: '👨‍👩‍👧', title: 'Family' },
        ],
        exercises: [
          { type: 'choice', prompt: 'What does Ar-Rahman mean?', picture: '💚', options: ['The Most Merciful', 'The Strongest Lion', 'The Big Sky'], answer: 0, explain: 'Ar-Rahman is one of Allah’s beautiful names. It means the Most Merciful.' },
          { type: 'choice', prompt: 'Who gives us water to drink?', picture: '💧', options: ['Allah', 'The cat', 'The moon'], answer: 0, explain: 'Allah sends the rain and gives us water.' },
          { type: 'truefalse', statement: 'We say “Alhamdulillah” to thank Allah.', picture: '🤲', answer: true, explain: 'Yes! Alhamdulillah means “All praise is for Allah”.' },
        ],
      },
    ],
  },
  {
    id: 'kids-words',
    title: 'Little words, big reward',
    subtitle: 'Special words Muslims say every day',
    color: '#E2A93B',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'kids-words-1',
        title: 'Bismillah',
        picture: '🍽️',
        reviewStatus: 'draft',
        teach: 'Before we eat, we say “Bismillah”, which means “In the name of Allah”. When we finish, we say “Alhamdulillah”.',
        cards: [
          { big: '🍽️', title: 'Before eating', text: 'Bismillah' },
          { big: '😋', title: 'After eating', text: 'Alhamdulillah' },
        ],
        exercises: [
          { type: 'choice', prompt: 'What do we say before we eat?', picture: '🍽️', options: ['Bismillah', 'Goodnight', 'Hooray'], answer: 0, explain: 'The Prophet ﷺ taught us to say Bismillah before eating.', source: { kind: 'hadith', reference: 'Sahih al-Bukhari 5376' } },
          { type: 'choice', prompt: 'What do we say when we finish eating?', picture: '😋', options: ['Alhamdulillah', 'Bismillah', 'Ameen'], answer: 0, explain: 'We thank Allah for the food by saying Alhamdulillah.' },
          { type: 'match', prompt: 'Match the words', pairs: [['Bismillah', 'In the name of Allah'], ['Alhamdulillah', 'All praise is for Allah']], explain: 'Great job! Two words that bring big reward.' },
        ],
      },
      {
        id: 'kids-words-2',
        title: 'Assalamu alaikum',
        picture: '👋',
        reviewStatus: 'draft',
        teach: 'When Muslims meet, we say “Assalamu alaikum”, which means “Peace be upon you”. We answer “Wa alaikum assalam”.',
        cards: [
          { big: '👋', title: 'Assalamu alaikum', text: 'Peace be upon you' },
          { big: '😊', title: 'Wa alaikum assalam', text: 'And upon you be peace' },
        ],
        exercises: [
          { type: 'choice', prompt: 'Your friend says “Assalamu alaikum”. What do you say back?', picture: '👋', options: ['Wa alaikum assalam', 'Bismillah', 'Bye'], answer: 0, explain: 'We answer with “Wa alaikum assalam”, peace be upon you too.' },
          { type: 'truefalse', statement: '“Assalamu alaikum” means “Peace be upon you”.', picture: '🕊️', answer: true, explain: 'Yes! Spreading salam spreads peace.' },
          { type: 'choice', prompt: 'What do we say when someone gives us a gift?', picture: '🎁', options: ['JazakAllahu khayran', 'Oops', 'SubhanAllah'], answer: 0, explain: 'JazakAllahu khayran means “May Allah reward you with good”. It is a lovely way to say thank you.' },
        ],
      },
    ],
  },
  {
    id: 'kids-pillars',
    title: 'My five pillars',
    subtitle: 'Five things that hold up Islam',
    color: '#2E6FA3',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'kids-pillars-1',
        title: 'Five pillars',
        picture: '🏛️',
        reviewStatus: 'draft',
        teach: 'A house stands on pillars. Islam stands on five: saying the Shahada, praying, giving to people in need, fasting in Ramadan and going to Hajj.',
        cards: [
          { big: '☝️', title: 'Shahada', text: 'Believing in Allah and His Messenger' },
          { big: '🕌', title: 'Salah', text: 'Praying five times a day' },
          { big: '🤝', title: 'Zakat', text: 'Giving to people in need' },
          { big: '🌙', title: 'Sawm', text: 'Fasting in Ramadan' },
          { big: '🕋', title: 'Hajj', text: 'Visiting the Kaaba' },
        ],
        exercises: [
          { type: 'choice', prompt: 'How many pillars does Islam have?', picture: '🏛️', options: ['5', '2', '10'], answer: 0, explain: 'Islam is built on five pillars.', source: { kind: 'hadith', reference: 'Sahih al-Bukhari 8' } },
          { type: 'choice', prompt: 'Which pillar is this?', picture: '🌙', options: ['Fasting in Ramadan', 'Hajj', 'Zakat'], answer: 0, explain: 'In Ramadan, grown-ups fast from dawn until sunset.' },
          { type: 'choice', prompt: 'How many times a day do Muslims pray?', picture: '🕌', options: ['5', '1', '3'], answer: 0, explain: 'Fajr, Dhuhr, Asr, Maghrib and Isha. Five prayers every day!' },
        ],
      },
      {
        id: 'kids-pillars-2',
        title: 'Getting ready to pray',
        picture: '💧',
        reviewStatus: 'draft',
        teach: 'Before we pray, we make wudu: we wash with water to be clean. Start with Bismillah, wash your hands, mouth, nose, face, arms, wipe your head and ears, then wash your feet.',
        cards: [
          { big: '🙌', title: 'Hands' },
          { big: '👄', title: 'Mouth and nose' },
          { big: '🙂', title: 'Face' },
          { big: '💪', title: 'Arms' },
          { big: '🦶', title: 'Feet' },
        ],
        exercises: [
          { type: 'choice', prompt: 'What do we do before we pray?', picture: '💧', options: ['Make wudu', 'Eat a snack', 'Go to sleep'], answer: 0, explain: 'Wudu makes us clean and ready to stand before Allah.' },
          { type: 'order', prompt: 'Put the wudu steps in order', items: ['🙌 Hands', '🙂 Face', '💪 Arms', '🦶 Feet'], explain: 'Hands, then mouth and nose, face, arms, head and ears, and feet last.', source: { kind: 'quran', reference: 'Quran 5:6' } },
          { type: 'truefalse', statement: 'We wash our feet last in wudu.', picture: '🦶', answer: true, explain: 'Yes! Feet come at the end.' },
        ],
      },
    ],
  },
  {
    id: 'kids-manners',
    title: 'Kind like the Prophet ﷺ',
    subtitle: 'Good manners make Allah happy',
    color: '#C8553D',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'kids-manners-1',
        title: 'A smile is charity',
        picture: '😊',
        reviewStatus: 'draft',
        teach: 'The Prophet ﷺ said that smiling at your brother or sister is a charity. Being kind, sharing and helping your parents all bring reward.',
        cards: [
          { big: '😊', title: 'Smile' },
          { big: '🧸', title: 'Share' },
          { big: '🧹', title: 'Help at home' },
        ],
        exercises: [
          { type: 'truefalse', statement: 'Smiling at someone is a kind of charity.', picture: '😊', answer: true, explain: 'Yes! The Prophet ﷺ said your smile for your brother is charity.', source: { kind: 'hadith', reference: 'Jami at-Tirmidhi 1956' } },
          { type: 'choice', prompt: 'Your friend has no toy to play with. What do you do?', picture: '🧸', options: ['Share with them', 'Hide my toys', 'Laugh at them'], answer: 0, explain: 'Sharing is kind, and Allah loves people who are kind.' },
          { type: 'choice', prompt: 'Mum is carrying lots of bags. What do you do?', picture: '🛍️', options: ['Help her carry them', 'Keep playing', 'Run away'], answer: 0, explain: 'Being good to our parents is one of the best deeds.' },
        ],
      },
    ],
  },
  {
    id: 'kids-prophets',
    title: 'Prophets we love',
    subtitle: 'Short stories from the Quran',
    color: '#7A5BA6',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'kids-prophets-1',
        title: 'Nuh and the ark',
        picture: '🚢',
        reviewStatus: 'draft',
        teach: 'Prophet Nuh (peace be upon him) told his people to worship Allah. Allah told him to build a big ark. When the great flood came, the believers and the animals were safe inside.',
        cards: [
          { big: '🔨', title: 'Nuh built the ark' },
          { big: '🐘', title: 'Animals came in pairs' },
          { big: '🌊', title: 'The flood came' },
        ],
        exercises: [
          { type: 'choice', prompt: 'What did Prophet Nuh build?', picture: '🚢', options: ['An ark', 'A tower', 'A castle'], answer: 0, explain: 'Allah told Nuh to build an ark to keep the believers safe.', source: { kind: 'quran', reference: 'Quran 11:37' } },
          { type: 'truefalse', statement: 'The animals came onto the ark in pairs.', picture: '🦒', answer: true, explain: 'Yes! Allah told Nuh to carry a pair of every kind.', source: { kind: 'quran', reference: 'Quran 11:40' } },
        ],
      },
      {
        id: 'kids-prophets-2',
        title: 'Yunus and the whale',
        picture: '🐋',
        reviewStatus: 'draft',
        teach: 'Prophet Yunus (peace be upon him) was swallowed by a big fish. In the dark he prayed: “There is no god but You, glory be to You.” Allah heard him and saved him.',
        cards: [
          { big: '🐋', title: 'A big fish' },
          { big: '🌑', title: 'In the dark' },
          { big: '🤲', title: 'He made dua' },
        ],
        exercises: [
          { type: 'choice', prompt: 'Who swallowed Prophet Yunus?', picture: '🐋', options: ['A big fish', 'A lion', 'A bird'], answer: 0, explain: 'A big fish swallowed Yunus, and he prayed to Allah from inside it.', source: { kind: 'quran', reference: 'Quran 37:142' } },
          { type: 'truefalse', statement: 'Allah heard Yunus when he prayed in the dark.', picture: '🤲', answer: true, explain: 'Yes! Allah always hears our dua, wherever we are.', source: { kind: 'quran', reference: 'Quran 21:87–88' } },
        ],
      },
    ],
  },
];

export const KIDS_COURSE: Course = {
  id: 'kids',
  title: 'Kids path',
  subtitle: 'Short, gentle lessons with big pictures',
  icon: '🧒',
  units: UNITS,
};
