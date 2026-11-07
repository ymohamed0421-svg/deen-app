// Hadith and duas for the daily card and the Duas screen.
// FIRST DRAFT: references and wording must be checked by a qualified scholar before release.

export type Hadith = { text: string; reference: string };
export type Dua = { title: string; arabic: string; transliteration: string; english: string; reference: string; category: string };

export const HADITHS: Hadith[] = [
  { text: 'Actions are only by intentions, and every person will have only what they intended.', reference: 'Sahih al-Bukhari 1, Sahih Muslim 1907' },
  { text: 'None of you truly believes until he loves for his brother what he loves for himself.', reference: 'Sahih al-Bukhari 13, Sahih Muslim 45' },
  { text: 'The most beloved deeds to Allah are those done consistently, even if they are small.', reference: 'Sahih al-Bukhari 6464, Sahih Muslim 783' },
  { text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.', reference: 'Sahih al-Bukhari 6018, Sahih Muslim 47' },
  { text: 'The best of you are those who learn the Quran and teach it.', reference: 'Sahih al-Bukhari 5027' },
  { text: 'Make things easy and do not make them difficult. Give glad tidings and do not drive people away.', reference: 'Sahih al-Bukhari 69, Sahih Muslim 1734' },
  { text: 'A good word is charity.', reference: 'Sahih al-Bukhari 2989, Sahih Muslim 1009' },
  { text: 'Your smiling in the face of your brother is charity.', reference: 'Jami‘ at-Tirmidhi 1956' },
  { text: 'The strong person is not the one who overcomes others in wrestling, but the one who controls himself when angry.', reference: 'Sahih al-Bukhari 6114, Sahih Muslim 2609' },
  { text: 'Whoever takes a path in search of knowledge, Allah makes easy for him a path to Paradise.', reference: 'Sahih Muslim 2699' },
  { text: 'Part of the excellence of a person’s Islam is leaving what does not concern him.', reference: 'Jami‘ at-Tirmidhi 2317' },
  { text: 'A man said, "Advise me." The Prophet ﷺ said, "Do not become angry," and repeated it several times.', reference: 'Sahih al-Bukhari 6116' },
  { text: 'Purity is half of faith.', reference: 'Sahih Muslim 223' },
  { text: 'Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.', reference: 'Sahih Muslim 2564' },
  { text: 'Whoever relieves a believer of a hardship of this world, Allah will relieve him of a hardship on the Day of Resurrection.', reference: 'Sahih Muslim 2699' },
  { text: 'Two words are light on the tongue, heavy on the scale, and beloved to the Most Merciful: SubhanAllahi wa bihamdihi, SubhanAllahil-‘Azim.', reference: 'Sahih al-Bukhari 6406, Sahih Muslim 2694' },
  { text: 'The religion is sincerity (naseehah).', reference: 'Sahih Muslim 55' },
  { text: 'Fear Allah wherever you are, follow a bad deed with a good one and it will wipe it out, and treat people with good character.', reference: 'Jami‘ at-Tirmidhi 1987' },
  { text: 'Whoever is not merciful to people, Allah will not be merciful to him.', reference: 'Sahih al-Bukhari 7376, Sahih Muslim 2319' },
  { text: 'Allah is beautiful and loves beauty.', reference: 'Sahih Muslim 91' },
];

export const DUAS: Dua[] = [
  { category: 'Daily', title: 'Before eating', arabic: 'بِسْمِ اللَّهِ', transliteration: 'Bismillah', english: 'In the name of Allah.', reference: 'Sunan Abi Dawud 3767' },
  {
    category: 'Daily',
    title: 'After eating',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: 'Alhamdu lillahil-ladhi at‘amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah',
    english: 'All praise is for Allah who fed me this and provided it for me without any might or power from me.',
    reference: 'Sunan Abi Dawud 4023, Jami‘ at-Tirmidhi 3458',
  },
  {
    category: 'Sleep',
    title: 'Before sleeping',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    english: 'In Your name, O Allah, I die and I live.',
    reference: 'Sahih al-Bukhari 6324',
  },
  {
    category: 'Sleep',
    title: 'On waking up',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdu lillahil-ladhi ahyana ba‘da ma amatana wa ilayhin-nushur',
    english: 'All praise is for Allah who gave us life after causing us to die, and to Him is the return.',
    reference: 'Sahih al-Bukhari 6324',
  },
  {
    category: 'Daily',
    title: 'Entering the bathroom',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    transliteration: 'Allahumma inni a‘udhu bika minal-khubuthi wal-khaba’ith',
    english: 'O Allah, I seek refuge in You from the male and female devils.',
    reference: 'Sahih al-Bukhari 142, Sahih Muslim 375',
  },
  { category: 'Daily', title: 'Leaving the bathroom', arabic: 'غُفْرَانَكَ', transliteration: 'Ghufranak', english: 'I ask for Your forgiveness.', reference: 'Sunan Abi Dawud 30, Jami‘ at-Tirmidhi 7' },
  {
    category: 'Daily',
    title: 'Leaving home',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillah, tawakkaltu ‘alallah, wa la hawla wa la quwwata illa billah',
    english: 'In the name of Allah, I place my trust in Allah, and there is no might and no power except with Allah.',
    reference: 'Sunan Abi Dawud 5095, Jami‘ at-Tirmidhi 3426',
  },
  {
    category: 'Prayer',
    title: 'Entering the masjid',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahummaf-tah li abwaba rahmatik',
    english: 'O Allah, open for me the gates of Your mercy.',
    reference: 'Sahih Muslim 713',
  },
  {
    category: 'Prayer',
    title: 'Leaving the masjid',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: 'Allahumma inni as’aluka min fadlik',
    english: 'O Allah, I ask You from Your bounty.',
    reference: 'Sahih Muslim 713',
  },
  {
    category: 'Prayer',
    title: 'After wudu',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: 'Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan ‘abduhu wa rasuluh',
    english: 'I bear witness that there is no god but Allah alone, without partner, and I bear witness that Muhammad is His servant and Messenger.',
    reference: 'Sahih Muslim 234',
  },
  {
    category: 'From the Quran',
    title: 'Good in this world and the next',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ‘adhaban-nar',
    english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    reference: 'Quran 2:201',
  },
  { category: 'From the Quran', title: 'For knowledge', arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni ‘ilma', english: 'My Lord, increase me in knowledge.', reference: 'Quran 20:114' },
  {
    category: 'From the Quran',
    title: 'For parents',
    arabic: 'رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    transliteration: 'Rabbir-hamhuma kama rabbayani saghira',
    english: 'My Lord, have mercy on them as they raised me when I was small.',
    reference: 'Quran 17:24',
  },
  {
    category: 'From the Quran',
    title: 'In distress (dua of Yunus)',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
    english: 'There is no god but You, glory be to You. Indeed, I have been of the wrongdoers.',
    reference: 'Quran 21:87',
  },
  {
    category: 'Travel',
    title: 'Riding or setting off on a journey',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: 'Subhanal-ladhi sakh-khara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun',
    english: 'Glory be to the One who has subjected this to us, and we could not have done it ourselves. And to our Lord we will surely return.',
    reference: 'Quran 43:13-14, Sahih Muslim 1342',
  },
];

/** Same item for everyone on a given day, changing at midnight. Hadith and dua alternate. */
export function dailyItem(dateKey: string): { kind: 'hadith'; item: Hadith } | { kind: 'dua'; item: Dua } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  const n = Math.floor(days / 2);
  return days % 2 === 0
    ? { kind: 'hadith', item: HADITHS[n % HADITHS.length] }
    : { kind: 'dua', item: DUAS[n % DUAS.length] };
}
