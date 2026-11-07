// FIRST DRAFT CONTENT: Seerah and the Companions.
// Dates and details follow the well-known accounts and must be checked by a qualified scholar.
import type { Unit } from './types.ts';

export const STORY_UNITS: Unit[] = [
  {
    id: 'seerah',
    title: 'The Seerah',
    subtitle: 'The life of the Prophet ﷺ',
    color: '#1F7A8C',
    foundation: false,
    tier: 'beginner',
    lessons: [
      {
        id: 'seerah-1',
        title: 'Early life in Makkah',
        reviewStatus: 'draft',
        teach:
          'Muhammad ﷺ was born in Makkah in the Year of the Elephant, around 570 CE. He grew up an orphan and became known as al-Amin, the trustworthy.',
        story:
          'His father Abdullah died before he was born, and his mother Aminah died when he was six. He was cared for by his grandfather Abd al-Muttalib, and after his death by his uncle Abu Talib.\n\nAs a young man he worked as a shepherd and then as a trader. He was so honest that the people of Makkah called him al-Amin, the trustworthy, and left their valuables with him.\n\nKhadijah bint Khuwaylid, a respected businesswoman, hired him to trade for her. Impressed by his honesty and character, she proposed marriage, and they married when he was 25.',
        exercises: [
          {
            type: 'choice',
            prompt: 'What nickname did the people of Makkah give the Prophet ﷺ?',
            options: ['As-Siddiq', 'Al-Amin', 'Al-Faruq', 'Saifullah'],
            answer: 1,
            explain: 'Al-Amin means the trustworthy. Even his enemies trusted him with their belongings.',
          },
          {
            type: 'truefalse',
            statement: 'The Prophet ﷺ was raised by his father Abdullah.',
            answer: false,
            explain: 'His father died before he was born. He was raised by his grandfather Abd al-Muttalib and then his uncle Abu Talib.',
          },
          {
            type: 'fill',
            sentence: 'The Prophet ﷺ was born in the Year of the ___.',
            options: ['Elephant', 'Camel', 'Flood', 'Hijrah'],
            answer: 0,
            explain: 'It is named after the army with elephants that marched on Makkah that year (Surah Al-Fil).',
            source: { kind: 'quran', reference: 'Quran 105' },
          },
          {
            type: 'order',
            prompt: 'Put these events in order',
            items: ['Born in Makkah', 'His mother Aminah passes away', 'Raised by Abu Talib', 'Marries Khadijah'],
            explain: 'This is the order of his early life.',
          },
        ],
      },
      {
        id: 'seerah-2',
        title: 'The first revelation',
        reviewStatus: 'draft',
        teach:
          'At the age of 40, while in the cave of Hira, the angel Jibril came to the Prophet ﷺ and said "Iqra" (Read). The first verses revealed were the opening of Surah Al-Alaq.',
        story:
          'The Prophet ﷺ used to go to the cave of Hira on a mountain outside Makkah to reflect and worship alone. One night the angel Jibril appeared and said "Read!" He replied, "I am not a reader." Then Jibril recited: "Read in the name of your Lord who created…"\n\nShaken, he returned home to Khadijah saying "Cover me, cover me." She comforted him, reminding him that Allah would never disgrace him because he kept family ties, helped the weak and was generous to guests.\n\nKhadijah took him to her cousin Waraqah ibn Nawfal, who knew the earlier scriptures. Waraqah told him this was the same angel who had come to Musa.',
        exercises: [
          {
            type: 'choice',
            prompt: 'In which cave did the first revelation come?',
            options: ['Thawr', 'Hira', 'Uhud', 'Kahf'],
            answer: 1,
            explain: 'The first revelation came in the cave of Hira.',
            source: { kind: 'hadith', reference: 'Sahih al-Bukhari 3' },
          },
          {
            type: 'fill',
            sentence: 'The first word Jibril said was "___", which means "Read".',
            options: ['Iqra', 'Qul', 'Bismillah', 'Salam'],
            answer: 0,
            explain: 'Surah Al-Alaq begins: "Read in the name of your Lord who created."',
            source: { kind: 'quran', reference: 'Quran 96:1' },
          },
          {
            type: 'truefalse',
            statement: 'Khadijah was the first person to believe in the Prophet ﷺ.',
            answer: true,
            explain: 'Khadijah was the first to believe in him and supported him with her wealth and comfort.',
          },
          {
            type: 'choice',
            prompt: 'How old was the Prophet ﷺ when revelation began?',
            options: ['25', '33', '40', '53'],
            answer: 2,
            explain: 'He was 40 years old.',
          },
        ],
      },
      {
        id: 'seerah-3',
        title: 'The Hijrah',
        reviewStatus: 'draft',
        teach:
          'After 13 years of calling people to Islam in Makkah through hardship and persecution, the Prophet ﷺ migrated to Madinah with Abu Bakr in 622 CE. This journey is the Hijrah.',
        story:
          'For years the early Muslims in Makkah were mocked, boycotted and tortured. Some migrated to Abyssinia, where the Christian king an-Najashi gave them protection.\n\nWhen the leaders of Quraysh plotted to kill the Prophet ﷺ, Allah gave him permission to migrate. Ali slept in his bed that night, and he left with Abu Bakr. They hid for three nights in the cave of Thawr while searchers came right to its entrance.\n\nAbu Bakr was worried, and the Prophet ﷺ said, "Do not grieve, Allah is with us." They reached Madinah, where the Ansar welcomed them with joy. The Islamic calendar begins from this year.',
        exercises: [
          {
            type: 'choice',
            prompt: 'Who travelled with the Prophet ﷺ on the Hijrah?',
            options: ['Umar', 'Abu Bakr', 'Uthman', 'Bilal'],
            answer: 1,
            explain: 'Abu Bakr as-Siddiq was his companion on the journey.',
            source: { kind: 'quran', reference: 'Quran 9:40' },
          },
          {
            type: 'truefalse',
            statement: 'They hid in the cave of Hira during the Hijrah.',
            answer: false,
            explain: 'They hid in the cave of Thawr. Hira is where the first revelation came.',
          },
          {
            type: 'match',
            prompt: 'Match each name to its role',
            pairs: [
              ['Ansar', 'The people of Madinah who helped'],
              ['Muhajirun', 'The Muslims who migrated'],
              ['An-Najashi', 'King who protected Muslims in Abyssinia'],
            ],
            explain: 'The Prophet ﷺ joined the Muhajirun and Ansar as brothers in Madinah.',
          },
          {
            type: 'fill',
            sentence: 'The Islamic calendar starts from the year of the ___.',
            options: ['Hijrah', 'Birth of the Prophet', 'First revelation', 'Conquest of Makkah'],
            answer: 0,
            explain: 'The Hijri calendar counts from the Hijrah, a decision made during the caliphate of Umar.',
          },
        ],
      },
      {
        id: 'seerah-4',
        title: 'Madinah and the final years',
        reviewStatus: 'draft',
        teach:
          'In Madinah the Prophet ﷺ built his masjid and a community. Makkah was opened in 8 AH with forgiveness, he performed the Farewell Hajj in 10 AH, and he passed away in 11 AH at the age of 63.',
        story:
          'One of the first things he did in Madinah was build the masjid, working with his own hands. He made each Muhajir a brother to one of the Ansar, and they shared their homes and wealth.\n\nThe Muslims faced battles, including Badr in 2 AH, where a small army was victorious, and Uhud the following year. In 8 AH the Prophet ﷺ entered Makkah with ten thousand companions. Instead of taking revenge on those who had persecuted him, he forgave them.\n\nIn 10 AH he performed the Farewell Hajj and gave his famous sermon at Arafah. A few months later, in 11 AH, he passed away in Madinah at the age of 63.',
        exercises: [
          {
            type: 'order',
            prompt: 'Put these events in order',
            items: ['Building the masjid in Madinah', 'Battle of Badr', 'Opening of Makkah', 'Farewell Hajj'],
            explain: 'Masjid (1 AH), Badr (2 AH), Makkah (8 AH), Farewell Hajj (10 AH).',
          },
          {
            type: 'truefalse',
            statement: 'When the Prophet ﷺ entered Makkah, he forgave the people who had persecuted him.',
            answer: true,
            explain: 'He forgave them, showing mercy at the moment of victory.',
          },
          {
            type: 'choice',
            prompt: 'How old was the Prophet ﷺ when he passed away?',
            options: ['40', '53', '63', '70'],
            answer: 2,
            explain: 'He passed away at 63, in 11 AH.',
          },
        ],
      },
    ],
  },
  {
    id: 'sahaba',
    title: 'The Companions',
    subtitle: 'Stories of the Sahaba',
    color: '#5B7F2E',
    foundation: false,
    tier: 'beginner',
    lessons: [
      {
        id: 'sahaba-1',
        title: 'Abu Bakr as-Siddiq',
        reviewStatus: 'draft',
        teach:
          'Abu Bakr was the Prophet’s closest friend, the first free adult man to accept Islam, his companion on the Hijrah, and the first caliph after him.',
        story:
          'Abu Bakr was a respected merchant in Makkah and a friend of the Prophet ﷺ before Islam. When he heard the message, he accepted it without hesitation.\n\nWhen the Prophet ﷺ told of his night journey to Jerusalem and ascension (al-Isra’ wal-Mi‘raj), many mocked him. Abu Bakr said, "If he said it, then it is true." From then on he was called as-Siddiq, the one who affirms the truth.\n\nHe spent his wealth freeing Muslims who were enslaved and tortured, including Bilal. After the Prophet ﷺ passed away, he became the first caliph.',
        exercises: [
          {
            type: 'choice',
            prompt: 'What does "as-Siddiq" mean?',
            options: ['The brave', 'The one who affirms the truth', 'The generous', 'The scholar'],
            answer: 1,
            explain: 'He earned the title by believing the Prophet ﷺ immediately about the Isra’ and Mi‘raj.',
          },
          {
            type: 'truefalse',
            statement: 'Abu Bakr freed Bilal from slavery.',
            answer: true,
            explain: 'Abu Bakr bought Bilal’s freedom from Umayyah ibn Khalaf.',
          },
          {
            type: 'fill',
            sentence: 'Abu Bakr was the ___ caliph of the Muslims.',
            options: ['first', 'second', 'third', 'fourth'],
            answer: 0,
            explain: 'The four rightly guided caliphs are Abu Bakr, Umar, Uthman and Ali.',
          },
        ],
      },
      {
        id: 'sahaba-2',
        title: 'Umar ibn al-Khattab',
        reviewStatus: 'draft',
        teach:
          'Umar was once a fierce enemy of Islam. He accepted Islam after hearing the Quran, became known as al-Faruq, and as the second caliph was famous for his justice.',
        story:
          'Umar set out one day intending to harm the Prophet ﷺ. On the way he learned that his own sister and her husband had become Muslim. He went to their house and heard them reciting the Quran.\n\nWhen he read the verses of Surah Ta-Ha himself, his heart softened. He went to the Prophet ﷺ and declared his Islam. After that the Muslims could pray openly at the Ka‘bah.\n\nAs caliph he walked the streets at night to check on his people, and is remembered as one of the most just rulers in history.',
        exercises: [
          {
            type: 'choice',
            prompt: 'Which surah was Umar reading when his heart softened?',
            options: ['Al-Fatihah', 'Ta-Ha', 'Yasin', 'Al-Mulk'],
            answer: 1,
            explain: 'It was Surah Ta-Ha, at his sister’s house.',
          },
          {
            type: 'match',
            prompt: 'Match the Companion to his title',
            pairs: [
              ['Abu Bakr', 'As-Siddiq'],
              ['Umar', 'Al-Faruq'],
              ['Uthman', 'Dhun-Nurayn'],
            ],
            explain: 'Al-Faruq means the one who distinguishes truth from falsehood.',
          },
          {
            type: 'truefalse',
            statement: 'Umar was the second caliph.',
            answer: true,
            explain: 'He became caliph after Abu Bakr.',
          },
        ],
      },
      {
        id: 'sahaba-3',
        title: 'Uthman and Ali',
        reviewStatus: 'draft',
        teach:
          'Uthman ibn Affan, the third caliph, was known for his modesty and generosity and gathered the Quran into one standard copy. Ali ibn Abi Talib, the Prophet’s cousin, was the fourth caliph.',
        story:
          'Uthman was a wealthy merchant who spent freely for Allah. When the Muslims of Madinah needed water, he bought the Well of Rumah and gave it to everyone. He was called Dhun-Nurayn, "possessor of the two lights", because he married two daughters of the Prophet ﷺ. As caliph, he had copies of one standard mushaf sent to the Muslim lands.\n\nAli grew up in the Prophet’s house and accepted Islam as a boy. On the night of the Hijrah he bravely slept in the Prophet’s bed. He married Fatimah, the Prophet’s daughter, and was known for his knowledge and courage.',
        exercises: [
          {
            type: 'fill',
            sentence: 'Uthman was called Dhun-Nurayn because he married two of the Prophet’s ___.',
            options: ['daughters', 'cousins', 'sisters', 'aunts'],
            answer: 0,
            explain: 'He married Ruqayyah and, after her death, Umm Kulthum.',
          },
          {
            type: 'choice',
            prompt: 'Who slept in the Prophet’s bed on the night of the Hijrah?',
            options: ['Abu Bakr', 'Umar', 'Ali', 'Bilal'],
            answer: 2,
            explain: 'Ali stayed behind and slept in his bed so the Prophet ﷺ could leave safely.',
          },
          {
            type: 'order',
            prompt: 'Put the four rightly guided caliphs in order',
            items: ['Abu Bakr', 'Umar', 'Uthman', 'Ali'],
            explain: 'These four led the Muslims after the Prophet ﷺ.',
          },
        ],
      },
      {
        id: 'sahaba-4',
        title: 'Bilal ibn Rabah',
        reviewStatus: 'draft',
        teach:
          'Bilal was an enslaved man in Makkah who held on to Islam under torture, repeating "Ahad, Ahad" (One, One). He was freed and became the first mu’adhdhin of Islam.',
        story:
          'Bilal’s master, Umayyah ibn Khalaf, tortured him for accepting Islam. He laid him on the burning sand with a heavy rock on his chest and demanded that he give up his faith. Bilal only answered, "Ahad, Ahad": Allah is One.\n\nAbu Bakr bought his freedom. In Madinah, when the adhan was established, the Prophet ﷺ chose Bilal to call it because of his beautiful, strong voice.\n\nHis story shows that in Islam a person is honoured for their faith and character, not their race or status.',
        exercises: [
          {
            type: 'fill',
            sentence: 'Under torture, Bilal kept saying "___", meaning Allah is One.',
            options: ['Ahad, Ahad', 'Akbar, Akbar', 'Salam, Salam', 'Haqq, Haqq'],
            answer: 0,
            explain: 'Ahad means One. He refused to give up tawhid.',
          },
          {
            type: 'choice',
            prompt: 'What special role did Bilal have in Madinah?',
            options: ['Treasurer', 'First mu’adhdhin', 'Army general', 'Judge'],
            answer: 1,
            explain: 'He was the first to call the adhan.',
          },
          {
            type: 'truefalse',
            statement: 'In Islam, a person is honoured by their lineage more than their taqwa.',
            answer: false,
            explain: '"The most noble of you in the sight of Allah is the most righteous of you."',
            source: { kind: 'quran', reference: 'Quran 49:13' },
          },
        ],
      },
    ],
  },
];
