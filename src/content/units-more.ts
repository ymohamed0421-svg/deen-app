// FIRST DRAFT CONTENT for intermediate and advanced learners.
// Every lesson must be checked by a qualified scholar before it is set to `approved`.
import type { Exercise, Unit } from './types.ts';

/** Harder questions added to the foundation lessons for intermediate and advanced learners. */
export const EXTRA_EXERCISES: Record<string, Exercise[]> = {
  'pillars-1': [
    {
      type: 'choice',
      minLevel: 'intermediate',
      prompt: 'Which Companion narrated the hadith "Islam is built on five"?',
      options: ['Abu Hurayrah', 'Abdullah ibn Umar', 'Anas ibn Malik', 'Aisha'],
      answer: 1,
      explain: 'It is narrated by Abdullah ibn Umar (may Allah be pleased with them both).',
      source: { kind: 'hadith', reference: 'Sahih al-Bukhari 8, Sahih Muslim 16' },
    },
  ],
  'pillars-3': [
    {
      type: 'choice',
      minLevel: 'advanced',
      prompt: 'Over what period must savings stay above the nisab before zakat is due?',
      options: ['One month', 'One lunar year (hawl)', 'Ramadan only', 'Five years'],
      answer: 1,
      explain: 'Zakat on wealth is due once it has stayed at or above the nisab for a full lunar year, called the hawl.',
    },
  ],
  'prayer-2': [
    {
      type: 'choice',
      minLevel: 'intermediate',
      prompt: 'Which two prayers may a traveller combine at the time of either one, in most schools?',
      options: ['Fajr and Dhuhr', 'Dhuhr and Asr', 'Maghrib and Fajr', 'Asr and Maghrib'],
      answer: 1,
      explain:
        'Dhuhr with Asr, and Maghrib with Isha, may be combined when travelling in the Shafi‘i, Maliki and Hanbali schools. The Hanafi school allows real combining only at Arafah and Muzdalifah during Hajj.',
    },
  ],
};

export const MORE_UNITS: Unit[] = [
  {
    id: 'iman',
    title: 'The Articles of Faith',
    subtitle: 'Iman and the hadith of Jibril',
    color: '#7A4FA3',
    foundation: false,
    tier: 'intermediate',
    lessons: [
      {
        id: 'iman-1',
        title: 'Six articles',
        reviewStatus: 'draft',
        teach:
          'When Jibril asked the Prophet ﷺ about iman, he answered: to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in the divine decree (qadar), its good and its bad.',
        exercises: [
          {
            type: 'choice',
            prompt: 'How many articles of faith are mentioned in the hadith of Jibril?',
            options: ['Four', 'Five', 'Six', 'Seven'],
            answer: 2,
            explain: 'There are six: Allah, the angels, the books, the messengers, the Last Day, and qadar.',
            source: { kind: 'hadith', reference: 'Sahih Muslim 8' },
          },
          {
            type: 'choice',
            prompt: 'Which of these is an article of faith rather than a pillar of Islam?',
            options: ['Fasting', 'Belief in the angels', 'Zakat', 'Hajj'],
            answer: 1,
            explain: 'The pillars of Islam are actions. The articles of faith are what a Muslim believes.',
          },
          {
            type: 'match',
            prompt: 'Match the term to its meaning',
            pairs: [
              ['Islam', 'Submission through outward acts'],
              ['Iman', 'Faith in the heart'],
              ['Ihsan', 'Worshipping Allah as if you see Him'],
            ],
            explain: 'The hadith of Jibril teaches all three levels of the religion.',
            source: { kind: 'hadith', reference: 'Sahih Muslim 8' },
          },
        ],
      },
      {
        id: 'iman-2',
        title: 'Books and messengers',
        reviewStatus: 'draft',
        teach:
          'Allah sent revealed books with His messengers: the Tawrah to Musa, the Zabur to Dawud, the Injil to Isa, and the Quran to Muhammad ﷺ, the final messenger.',
        exercises: [
          {
            type: 'match',
            prompt: 'Match each book to its messenger',
            pairs: [
              ['Tawrah', 'Musa'],
              ['Zabur', 'Dawud'],
              ['Injil', 'Isa'],
              ['Quran', 'Muhammad ﷺ'],
            ],
            explain: 'Belief in all of Allah’s revealed books is part of iman.',
          },
          {
            type: 'choice',
            prompt: 'Which angel brought revelation to the prophets?',
            options: ['Mika’il', 'Jibril', 'Malik', 'Ridwan'],
            answer: 1,
            explain: 'Jibril brought the revelation, and is described in the Quran as the trustworthy spirit (26:193).',
            source: { kind: 'quran', reference: 'Quran 26:193' },
          },
          {
            type: 'choice',
            minLevel: 'advanced',
            prompt: 'What does "khatam an-nabiyyin" in Al-Ahzab 33:40 mean?',
            options: ['The first of the prophets', 'The seal of the prophets', 'The friend of the prophets', 'The son of the prophets'],
            answer: 1,
            explain: 'Muhammad ﷺ is the seal of the prophets: no prophet comes after him.',
            source: { kind: 'quran', reference: 'Quran 33:40' },
          },
        ],
      },
    ],
  },
  {
    id: 'madhabs',
    title: 'Prayer in the Four Madhabs',
    subtitle: 'Where the schools agree and differ',
    color: '#A35A2E',
    foundation: false,
    tier: 'advanced',
    lessons: [
      {
        id: 'madhabs-1',
        title: 'The four schools',
        reviewStatus: 'draft',
        teach:
          'The four Sunni schools of fiqh are named after Imam Abu Hanifah, Imam Malik, Imam ash-Shafi‘i and Imam Ahmad ibn Hanbal. They agree on the foundations and differ in some details, each with evidence. Follow a qualified teacher in your school.',
        exercises: [
          {
            type: 'match',
            prompt: 'Match each school to its founding imam',
            pairs: [
              ['Hanafi', 'Abu Hanifah'],
              ['Maliki', 'Malik ibn Anas'],
              ['Shafi‘i', 'Muhammad ibn Idris ash-Shafi‘i'],
              ['Hanbali', 'Ahmad ibn Hanbal'],
            ],
            explain: 'All four are respected schools of Sunni fiqh.',
          },
          {
            type: 'choice',
            prompt: 'Which school treats witr as wajib (necessary) rather than sunnah?',
            options: ['Hanafi', 'Maliki', 'Shafi‘i', 'Hanbali'],
            answer: 0,
            explain: 'The Hanafi school holds witr to be wajib. The other three hold it to be a highly stressed sunnah.',
          },
        ],
      },
      {
        id: 'madhabs-2',
        title: 'Asr time and raising the hands',
        reviewStatus: 'draft',
        teach:
          'For Asr, the Hanafi school begins the time when an object’s shadow is twice its length, while the other three schools begin it when the shadow equals its length. On raising the hands at ruku‘, the Shafi‘i and Hanbali schools do it, while the Hanafi school, and the Maliki school in its well-known view, raise them only at the opening takbir.',
        exercises: [
          {
            type: 'choice',
            prompt: 'In the Hanafi school, Asr begins when a shadow is…',
            options: ['Equal to the object', 'Twice the object', 'Half the object', 'Gone'],
            answer: 1,
            explain: 'This is why prayer apps offer a separate Hanafi Asr setting.',
          },
          {
            type: 'match',
            prompt: 'Raising the hands when going into ruku‘',
            pairs: [
              ['Shafi‘i', 'Raises the hands'],
              ['Hanbali', 'Also raises the hands'],
              ['Hanafi', 'Only at the opening takbir'],
            ],
            explain: 'Both practices have evidence in the Sunnah. Each school weighed the narrations differently.',
          },
        ],
      },
    ],
  },
];
