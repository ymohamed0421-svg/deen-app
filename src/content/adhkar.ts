// Morning and evening adhkar and tasbih presets.
// DRAFT: awaiting review by a qualified scholar, like all religious content in the app.
// Sources are from the well-known collections (as gathered in Hisn al-Muslim). Quran passages
// are read from the bundled Quran text so the Arabic is exact.

export type AdhkarSet = 'morning' | 'evening';

export type Dhikr = {
  id: string;
  title: string;
  times: number;
  /** Arabic text, or a Quran reference to read it from: [surah, firstAyah, lastAyah]. */
  arabic: string | [number, number, number][];
  transliteration: string;
  english: string;
  virtue?: string;
  reference: string;
  only?: AdhkarSet; // left out when the dhikr is the same morning and evening
};

const QULS: [number, number, number][] = [
  [112, 1, 4],
  [113, 1, 5],
  [114, 1, 6],
];

export const ADHKAR: Dhikr[] = [
  {
    id: 'kursi',
    title: 'Ayat al-Kursi',
    times: 1,
    arabic: [[2, 255, 255]],
    transliteration: 'Allahu la ilaha illa huwal-Hayyul-Qayyum…',
    english: 'Allah: there is no god but Him, the Ever-Living, the Sustainer of all that exists…',
    virtue: 'Whoever recites it is protected until evening, and whoever recites it in the evening is protected until morning.',
    reference: 'Quran 2:255. An-Nasa’i, as-Sunan al-Kubra; al-Hakim, al-Mustadrak',
  },
  {
    id: 'quls',
    title: 'The three Quls',
    times: 3,
    arabic: QULS,
    transliteration: 'Surat al-Ikhlas, al-Falaq and an-Nas',
    english: 'Say: He is Allah, the One… Say: I seek refuge with the Lord of daybreak… Say: I seek refuge with the Lord of mankind…',
    virtue: 'Recited three times morning and evening, they will suffice you against everything.',
    reference: 'Sunan Abi Dawud 5082, Jami‘ at-Tirmidhi 3575',
  },
  {
    id: 'asbahna',
    title: 'We have reached the morning',
    times: 1,
    only: 'morning',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    transliteration:
      'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ‘ala kulli shay’in qadir. Rabbi as’aluka khayra ma fi hadhal-yawmi wa khayra ma ba‘dah, wa a‘udhu bika min sharri ma fi hadhal-yawmi wa sharri ma ba‘dah. Rabbi a‘udhu bika minal-kasali wa su’il-kibar. Rabbi a‘udhu bika min ‘adhabin fin-nari wa ‘adhabin fil-qabr.',
    english:
      'We have reached the morning and the whole kingdom belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner. His is the kingdom and His is the praise, and He has power over all things. My Lord, I ask You for the good of this day and the good of what comes after it, and I seek refuge in You from the evil of this day and the evil of what comes after it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
    reference: 'Sahih Muslim 2723',
  },
  {
    id: 'amsayna',
    title: 'We have reached the evening',
    times: 1,
    only: 'evening',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    transliteration:
      'Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ‘ala kulli shay’in qadir. Rabbi as’aluka khayra ma fi hadhihil-laylati wa khayra ma ba‘daha, wa a‘udhu bika min sharri ma fi hadhihil-laylati wa sharri ma ba‘daha. Rabbi a‘udhu bika minal-kasali wa su’il-kibar. Rabbi a‘udhu bika min ‘adhabin fin-nari wa ‘adhabin fil-qabr.',
    english:
      'We have reached the evening and the whole kingdom belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner. His is the kingdom and His is the praise, and He has power over all things. My Lord, I ask You for the good of this night and the good of what comes after it, and I seek refuge in You from the evil of this night and the evil of what comes after it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
    reference: 'Sahih Muslim 2723',
  },
  {
    id: 'bika-morning',
    title: 'By You we live',
    times: 1,
    only: 'morning',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur.',
    english: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.',
    reference: 'Jami‘ at-Tirmidhi 3391, Sunan Abi Dawud 5068',
  },
  {
    id: 'bika-evening',
    title: 'By You we live',
    times: 1,
    only: 'evening',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
    transliteration: 'Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir.',
    english: 'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.',
    reference: 'Jami‘ at-Tirmidhi 3391, Sunan Abi Dawud 5068',
  },
  {
    id: 'sayyid',
    title: 'The best way to ask forgiveness',
    times: 1,
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration:
      'Allahumma anta Rabbi la ilaha illa ant, khalaqtani wa ana ‘abduk, wa ana ‘ala ‘ahdika wa wa‘dika mastata‘t, a‘udhu bika min sharri ma sana‘t, abu’u laka bi ni‘matika ‘alayya, wa abu’u bi dhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa ant.',
    english:
      'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.',
    virtue: 'Whoever says it with conviction during the day and dies before evening is among the people of Paradise, and likewise at night.',
    reference: 'Sahih al-Bukhari 6306',
  },
  {
    id: 'bismillah',
    title: 'Protection from all harm',
    times: 3,
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-ladhi la yadurru ma‘asmihi shay’un fil-ardi wa la fis-sama’, wa huwas-Sami‘ul-‘Alim.',
    english: 'In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.',
    virtue: 'Whoever says it three times will not be struck by sudden harm.',
    reference: 'Sunan Abi Dawud 5088, Jami‘ at-Tirmidhi 3388',
  },
  {
    id: 'raditu',
    title: 'Pleased with Allah as Lord',
    times: 3,
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    transliteration: 'Raditu billahi Rabba, wa bil-Islami dina, wa bi-Muhammadin sallallahu ‘alayhi wa sallama nabiyya.',
    english: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.',
    reference: 'Sunan Abi Dawud 5072, Jami‘ at-Tirmidhi 3389',
  },
  {
    id: 'kalimat',
    title: 'Refuge in Allah’s perfect words',
    times: 3,
    only: 'evening',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'A‘udhu bi kalimatillahit-tammati min sharri ma khalaq.',
    english: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Sahih Muslim 2709, Jami‘ at-Tirmidhi 3604',
  },
  {
    id: 'subhanallah',
    title: 'Glory be to Allah',
    times: 100,
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'SubhanAllahi wa bihamdih.',
    english: 'Glory be to Allah and all praise is His.',
    virtue: 'No one brings anything better on the Day of Resurrection, except someone who said the same or more.',
    reference: 'Sahih Muslim 2692',
  },
];

export function adhkarFor(set: AdhkarSet) {
  return ADHKAR.filter((d) => !d.only || d.only === set);
}

export type TasbihPreset = { id: string; arabic: string; label: string; target: number };

/** After each prayer: 33, 33 and 34 (Sahih Muslim 597), then a free counter and other common dhikr. */
export const TASBIH_PRESETS: TasbihPreset[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', label: 'SubhanAllah', target: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', label: 'Alhamdulillah', target: 33 },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', label: 'Allahu Akbar', target: 34 },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', label: 'Astaghfirullah', target: 100 },
  { id: 'tahlil', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', label: 'La ilaha illallah', target: 100 },
  { id: 'salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', label: 'Salawat on the Prophet ﷺ', target: 10 },
  { id: 'free', arabic: '', label: 'Free count', target: 0 },
];

/** The first three presets form the tasbih after salah. */
export const AFTER_SALAH = ['subhanallah', 'alhamdulillah', 'allahuakbar'];

export const RAMADAN_DUAS = {
  iftar: {
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: 'Dhahabadh-dhama’u wabtallatil-‘uruqu wa thabatal-ajru in sha’ Allah.',
    english: 'The thirst has gone, the veins are moist, and the reward is certain, if Allah wills.',
    reference: 'Sunan Abi Dawud 2357',
  },
  qadr: {
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: 'Allahumma innaka ‘Afuwwun tuhibbul-‘afwa fa‘fu ‘anni.',
    english: 'O Allah, You are Pardoning and love to pardon, so pardon me.',
    reference: 'Jami‘ at-Tirmidhi 3513, Sunan Ibn Majah 3850',
  },
};
