// FIRST DRAFT CONTENT. Every lesson is marked `draft` and must be checked by a
// qualified scholar against its sources before it is set to `approved`.
import type { KnowledgeLevel, Lesson, Unit } from './types.ts';
import { EXTRA_EXERCISES, MORE_UNITS } from './units-more.ts';
import { STORY_UNITS } from './units-stories.ts';

const FOUNDATION_UNITS: Unit[] = [
  {
    id: 'pillars',
    title: 'The Five Pillars',
    subtitle: 'What Islam is built on',
    color: '#2F7D5B',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'pillars-1',
        title: 'Built on five',
        reviewStatus: 'draft',
        teach:
          'The Prophet ﷺ said that Islam is built on five: the testimony of faith (shahada), prayer (salah), charity (zakat), fasting in Ramadan (sawm) and pilgrimage to the House (hajj).',
        exercises: [
          {
            type: 'choice',
            prompt: 'How many pillars is Islam built on?',
            options: ['Three', 'Five', 'Six', 'Seven'],
            answer: 1,
            explain: 'Islam is built on five pillars.',
            source: { kind: 'hadith', reference: 'Sahih al-Bukhari 8, Sahih Muslim 16' },
          },
          {
            type: 'match',
            prompt: 'Match each pillar to its meaning',
            pairs: [
              ['Shahada', 'Testimony of faith'],
              ['Salah', 'Prayer'],
              ['Zakat', 'Obligatory charity'],
              ['Sawm', 'Fasting'],
              ['Hajj', 'Pilgrimage'],
            ],
            explain: 'These five together are the pillars of Islam.',
          },
          {
            type: 'choice',
            prompt: 'Which of these is NOT one of the five pillars?',
            options: ['Fasting in Ramadan', 'Zakat', 'Reading the whole Quran each month', 'Hajj'],
            answer: 2,
            explain: 'Reading the Quran is highly rewarded, but the five pillars are shahada, salah, zakat, sawm and hajj.',
          },
          {
            type: 'order',
            prompt: 'Put the pillars in the order the hadith mentions them',
            items: ['Shahada', 'Salah', 'Zakat', 'Hajj', 'Sawm'],
            explain:
              'In the narration of Sahih al-Bukhari 8 the order is shahada, salah, zakat, hajj, then fasting in Ramadan. Other narrations mention fasting before hajj.',
            source: { kind: 'hadith', reference: 'Sahih al-Bukhari 8' },
          },
        ],
      },
      {
        id: 'pillars-2',
        title: 'The shahada',
        reviewStatus: 'draft',
        teach:
          'The shahada is: "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasul Allah." I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.',
        exercises: [
          {
            type: 'choice',
            prompt: 'What does "la ilaha illa Allah" mean?',
            options: [
              'Allah is the greatest',
              'There is no god but Allah',
              'All praise is for Allah',
              'In the name of Allah',
            ],
            answer: 1,
            explain: '"La ilaha illa Allah" means there is no god worthy of worship except Allah.',
          },
          {
            type: 'order',
            prompt: 'Build the shahada',
            items: ['Ash-hadu', 'an la ilaha', 'illa Allah,', 'wa ash-hadu anna', 'Muhammadan', 'rasul Allah'],
            explain: 'This is the full testimony of faith.',
          },
          {
            type: 'choice',
            prompt: 'The second part of the shahada is a testimony about whom?',
            options: ['Prophet Ibrahim', 'Prophet Musa', 'Prophet Muhammad ﷺ', 'Angel Jibril'],
            answer: 2,
            explain: 'The second part bears witness that Muhammad ﷺ is the Messenger of Allah.',
          },
          {
            type: 'match',
            prompt: 'Match the Arabic to its meaning',
            pairs: [
              ['Ash-hadu', 'I bear witness'],
              ['La ilaha', 'There is no god'],
              ['Illa Allah', 'Except Allah'],
              ['Rasul', 'Messenger'],
            ],
            explain: 'Knowing the meaning makes the words come alive.',
          },
        ],
      },
      {
        id: 'pillars-3',
        title: 'Salah and zakat',
        reviewStatus: 'draft',
        teach:
          'Muslims pray five times every day. Zakat is a yearly charity: 2.5% of savings that stay above a minimum amount (the nisab) for a full lunar year, given to those who are eligible.',
        exercises: [
          {
            type: 'choice',
            prompt: 'How many obligatory prayers are there each day?',
            options: ['Three', 'Four', 'Five', 'Seven'],
            answer: 2,
            explain: 'There are five daily prayers: Fajr, Dhuhr, Asr, Maghrib and Isha.',
          },
          {
            type: 'order',
            prompt: 'Put the daily prayers in order, starting at dawn',
            items: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
            explain: 'Fajr is at dawn, Dhuhr after midday, Asr in the afternoon, Maghrib at sunset and Isha at night.',
          },
          {
            type: 'choice',
            prompt: 'What share of eligible savings is paid as zakat?',
            options: ['1%', '2.5%', '10%', '20%'],
            answer: 1,
            explain: 'Zakat on savings is 2.5% once they stay above the nisab for a lunar year.',
          },
          {
            type: 'choice',
            prompt: 'In the Quran, which pillar is very often mentioned together with prayer?',
            options: ['Hajj', 'Zakat', 'Fasting', 'Shahada'],
            answer: 1,
            explain: 'Allah often says "establish prayer and give zakat", for example in Al-Baqarah 2:43.',
            source: { kind: 'quran', reference: 'Quran 2:43' },
          },
        ],
      },
      {
        id: 'pillars-4',
        title: 'Fasting and hajj',
        reviewStatus: 'draft',
        teach:
          'In Ramadan, Muslims fast from dawn (Fajr) until sunset (Maghrib), leaving food, drink and marital relations. Hajj is the pilgrimage to Makkah, required once in a lifetime for those who are able.',
        exercises: [
          {
            type: 'choice',
            prompt: 'A fast in Ramadan lasts from…',
            options: ['Sunrise to noon', 'Dawn to sunset', 'Midnight to midnight', 'Sunset to dawn'],
            answer: 1,
            explain: 'The fast begins at dawn (Fajr) and ends at sunset (Maghrib).',
          },
          {
            type: 'choice',
            prompt: 'Why did Allah prescribe fasting, according to Al-Baqarah 2:183?',
            options: ['To lose weight', 'So that you may attain taqwa', 'To save money', 'To travel'],
            answer: 1,
            explain: '"Fasting is prescribed for you… so that you may become mindful of Allah (taqwa)."',
            source: { kind: 'quran', reference: 'Quran 2:183' },
          },
          {
            type: 'choice',
            prompt: 'How often is hajj required?',
            options: ['Every year', 'Every five years', 'Once in a lifetime, for those able', 'Never required'],
            answer: 2,
            explain: 'Hajj is an obligation once in a lifetime for those who are able to make the journey.',
            source: { kind: 'quran', reference: 'Quran 3:97' },
          },
          {
            type: 'match',
            prompt: 'Match each pillar to when it happens',
            pairs: [
              ['Sawm', 'The month of Ramadan'],
              ['Hajj', 'The month of Dhul Hijjah'],
              ['Salah', 'Five times every day'],
              ['Zakat', 'Once a lunar year'],
            ],
            explain: 'Each pillar has its own time.',
          },
        ],
      },
    ],
  },
  {
    id: 'prayer',
    title: 'How to Pray',
    subtitle: 'Wudu and the steps of salah',
    color: '#2E6FA3',
    foundation: true,
    tier: 'beginner',
    lessons: [
      {
        id: 'prayer-1',
        title: 'Wudu',
        reviewStatus: 'draft',
        teach:
          'Wudu is the washing done before prayer. The Quran (5:6) commands washing the face, the arms up to the elbows, wiping the head, and washing the feet up to the ankles. The Sunnah adds rinsing the mouth and nose, and starting with the hands.',
        exercises: [
          {
            type: 'order',
            prompt: 'Put the steps of wudu in order',
            items: [
              'Intention and Bismillah',
              'Wash the hands',
              'Rinse the mouth',
              'Rinse the nose',
              'Wash the face',
              'Wash the arms to the elbows',
              'Wipe the head and ears',
              'Wash the feet to the ankles',
            ],
            explain: 'This is the common order of wudu taught from the Sunnah.',
            source: { kind: 'quran', reference: 'Quran 5:6' },
          },
          {
            type: 'choice',
            prompt: 'Up to where are the arms washed in wudu?',
            options: ['The wrists', 'The elbows', 'The shoulders', 'Only the fingers'],
            answer: 1,
            explain: 'The arms are washed up to and including the elbows.',
            source: { kind: 'quran', reference: 'Quran 5:6' },
          },
          {
            type: 'choice',
            prompt: 'Which part is wiped, not washed?',
            options: ['The face', 'The feet', 'The head', 'The arms'],
            answer: 2,
            explain: 'The head is wiped with wet hands.',
          },
        ],
      },
      {
        id: 'prayer-2',
        title: 'Prayers and rak‘ahs',
        reviewStatus: 'draft',
        teach:
          'Each prayer is made of units called rak‘ahs. Fajr has 2, Dhuhr 4, Asr 4, Maghrib 3 and Isha 4. These are the obligatory (fard) rak‘ahs.',
        exercises: [
          {
            type: 'match',
            prompt: 'Match each prayer to its fard rak‘ahs',
            pairs: [
              ['Fajr', '2'],
              ['Maghrib', '3'],
              ['Dhuhr', '4'],
            ],
            explain: 'Asr and Isha also have 4 fard rak‘ahs.',
          },
          {
            type: 'choice',
            prompt: 'How many fard rak‘ahs does Maghrib have?',
            options: ['2', '3', '4', '5'],
            answer: 1,
            explain: 'Maghrib is the only daily prayer with 3 rak‘ahs.',
          },
          {
            type: 'choice',
            prompt: 'How many fard rak‘ahs are there in a full day?',
            options: ['15', '17', '19', '20'],
            answer: 1,
            explain: '2 + 4 + 4 + 3 + 4 = 17.',
          },
        ],
      },
      {
        id: 'prayer-3',
        title: 'Steps of a rak‘ah',
        reviewStatus: 'draft',
        teach:
          'A rak‘ah moves through standing, bowing (ruku‘), rising, prostrating (sujud), sitting, and prostrating again. The prayer opens with "Allahu Akbar" and ends with the tashahhud and the salam.',
        exercises: [
          {
            type: 'order',
            prompt: 'Put the first rak‘ah in order',
            items: [
              'Takbir: "Allahu Akbar"',
              'Recite Al-Fatihah',
              'Ruku‘ (bow)',
              'Stand up straight',
              'First sujud',
              'Sit briefly',
              'Second sujud',
            ],
            explain: 'This is the shape of every rak‘ah. A short surah is usually recited after Al-Fatihah in the first two rak‘ahs.',
          },
          {
            type: 'choice',
            prompt: 'Which surah is recited in every rak‘ah?',
            options: ['Al-Ikhlas', 'Al-Fatihah', 'An-Nas', 'Al-Kawthar'],
            answer: 1,
            explain: 'Al-Fatihah is recited in every rak‘ah of every prayer.',
          },
          {
            type: 'choice',
            prompt: 'How does the prayer end?',
            options: ['With a sujud', 'With the salam to the right and left', 'With ruku‘', 'By standing up'],
            answer: 1,
            explain: 'After the final tashahhud, the prayer ends with "As-salamu alaykum wa rahmatullah" to the right and left.',
          },
        ],
      },
      {
        id: 'prayer-4',
        title: 'What to say',
        reviewStatus: 'draft',
        teach:
          'In ruku‘ say "Subhana Rabbiya al-‘Azim" (Glory be to my Lord, the Magnificent). In sujud say "Subhana Rabbiya al-A‘la" (Glory be to my Lord, the Most High).',
        exercises: [
          {
            type: 'match',
            prompt: 'Match each position to what is said',
            pairs: [
              ['Opening', 'Allahu Akbar'],
              ['Ruku‘', 'Subhana Rabbiya al-‘Azim'],
              ['Sujud', 'Subhana Rabbiya al-A‘la'],
              ['Ending', 'As-salamu alaykum wa rahmatullah'],
            ],
            explain: 'These are the core words of each position.',
            source: { kind: 'hadith', reference: 'Sahih Muslim 772' },
          },
          {
            type: 'choice',
            prompt: 'What does "Subhana Rabbiya al-A‘la" mean?',
            options: [
              'Allah is the greatest',
              'Glory be to my Lord, the Most High',
              'All praise is for Allah',
              'Allah hears whoever praises Him',
            ],
            answer: 1,
            explain: 'It is said in sujud, when we are lowest to the ground.',
          },
          {
            type: 'choice',
            prompt: 'When rising from ruku‘, what is said?',
            options: ['Sami‘a Allahu liman hamidah', 'Bismillah', 'Astaghfirullah', 'Subhan Allah'],
            answer: 0,
            explain: '"Allah hears whoever praises Him", followed by "Rabbana wa laka al-hamd".',
          },
        ],
      },
    ],
  },
];

export const UNITS: Unit[] = [...FOUNDATION_UNITS, ...STORY_UNITS, ...MORE_UNITS].map((u) => ({
  ...u,
  lessons: u.lessons.map((l) => ({ ...l, exercises: [...l.exercises, ...(EXTRA_EXERCISES[l.id] ?? [])] })),
}));

const RANK: Record<KnowledgeLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
export const levelRank = (l: KnowledgeLevel) => RANK[l];

/** The exercises a learner sees: harder questions only appear at their level or above. */
export function exercisesFor(lesson: Lesson, level: KnowledgeLevel) {
  return lesson.exercises.filter((e) => !e.minLevel || RANK[e.minLevel] <= RANK[level]);
}

export function findLesson(lessonId: string) {
  for (const unit of UNITS) {
    const index = unit.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { unit, lesson: unit.lessons[index], index };
  }
  return null;
}
