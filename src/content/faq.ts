// The Ask library: common questions with short answers from the Quran and authentic hadith.
// FIRST DRAFT: every answer must be checked by a qualified scholar before release.
// Where a reference number is not given, the narration is named so it can be looked up on sunnah.com.

export type FaqTopic = 'Purity' | 'Prayer' | 'Fasting' | 'Zakat & charity' | 'Hajj' | 'Belief' | 'Quran' | 'Daily life' | 'Heart';

export type Faq = {
  id: string;
  topic: FaqTopic;
  question: string;
  /** Other ways people ask it. Used for matching. */
  also?: string[];
  answer: string;
  refs: string[];
};

export const FAQ_TOPICS: FaqTopic[] = ['Belief', 'Purity', 'Prayer', 'Fasting', 'Zakat & charity', 'Hajj', 'Quran', 'Daily life', 'Heart'];

export const FAQ: Faq[] = [
  // Belief
  {
    id: 'shahada',
    topic: 'Belief',
    question: 'What does the shahada mean?',
    also: ['testimony of faith', 'la ilaha illallah meaning', 'first pillar'],
    answer:
      'The shahada is "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasulullah": I bear witness that there is no god worthy of worship except Allah, and that Muhammad is the Messenger of Allah.\n\nThe first half means worshipping Allah alone, with no partner. The second means following the Prophet ﷺ as the one who brought Allah’s message. It is the first pillar of Islam.',
    refs: ['Quran 47:19', 'Sahih al-Bukhari 8', 'Sahih Muslim 16'],
  },
  {
    id: 'convert',
    topic: 'Belief',
    question: 'How do I become Muslim?',
    also: ['convert to islam', 'revert', 'accept islam', 'take shahada'],
    answer:
      'A person becomes Muslim by believing in the shahada and saying it sincerely: "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan rasulullah." No ceremony or witness is required, though many people say it at a masjid so the community can welcome and help them.\n\nIslam wipes away the sins that came before it. After that, start with learning to pray, and take it step by step.',
    refs: ['Quran 3:19', 'Sahih Muslim 121'],
  },
  {
    id: 'iman-pillars',
    topic: 'Belief',
    question: 'What are the six pillars of iman?',
    also: ['articles of faith', 'pillars of faith', 'what muslims believe'],
    answer:
      'When Jibril asked the Prophet ﷺ about iman, he said it is to believe in:\n- Allah\n- His angels\n- His books\n- His messengers\n- the Last Day\n- and qadr, the divine decree, its good and its bad.',
    refs: ['Sahih Muslim 8', 'Quran 2:285'],
  },
  {
    id: 'pillars-islam',
    topic: 'Belief',
    question: 'What are the five pillars of Islam?',
    also: ['5 pillars', 'arkan'],
    answer:
      'Islam is built on five:\n- the shahada\n- the five daily prayers\n- zakat\n- fasting Ramadan\n- Hajj to the House for those who are able.',
    refs: ['Sahih al-Bukhari 8', 'Sahih Muslim 16'],
  },
  {
    id: 'tawhid',
    topic: 'Belief',
    question: 'Who is Allah?',
    also: ['tawhid', 'oneness of god', 'is allah the same god'],
    answer:
      'Allah is the one God, the Creator of everything, who has no partner, no child and nothing like Him. Surah al-Ikhlas sums this up: "Say, He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, and there is none comparable to Him." Ayat al-Kursi (2:255) also describes His power and knowledge.',
    refs: ['Quran 112:1-4', 'Quran 2:255', 'Quran 42:11'],
  },
  {
    id: 'prophet',
    topic: 'Belief',
    question: 'Who was Prophet Muhammad ﷺ?',
    also: ['last prophet', 'seal of the prophets', 'messenger'],
    answer:
      'Muhammad ﷺ, son of Abdullah, was born in Makkah around 570 CE. At 40 he received the first revelation in the cave of Hira, and he taught Islam for 23 years in Makkah and Madinah. He is the final prophet, sent as a mercy to all the worlds.',
    refs: ['Quran 33:40', 'Quran 21:107', 'Quran 96:1-5'],
  },
  {
    id: 'qadr',
    topic: 'Belief',
    question: 'If Allah already knows everything, do my choices matter?',
    also: ['qadr', 'destiny', 'free will', 'predestination'],
    answer:
      'Yes. Muslims believe Allah knows and has written everything, and also that people truly choose and are responsible for their choices. When the Companions asked whether they should rely on what was written and stop doing deeds, the Prophet ﷺ said: "Do deeds, for everyone will be helped towards what he was created for."',
    refs: ['Sahih al-Bukhari 4949', 'Sahih Muslim 2647', 'Quran 91:7-10'],
  },
  {
    id: 'madhabs',
    topic: 'Belief',
    question: 'What are the four madhabs?',
    also: ['schools of thought', 'hanafi maliki shafii hanbali', 'which madhab'],
    answer:
      'The four Sunni schools of fiqh are named after great scholars:\n- Hanafi (Abu Hanifa, d. 150 AH)\n- Maliki (Malik ibn Anas, d. 179 AH)\n- Shafi‘i (al-Shafi‘i, d. 204 AH)\n- Hanbali (Ahmad ibn Hanbal, d. 241 AH)\n\nThey agree on the basics of belief and worship and differ on details, because they weighed the evidence differently. Each is respected, and Muslims commonly follow the school taught where they live.',
    refs: [],
  },

  // Purity
  {
    id: 'wudu-how',
    topic: 'Purity',
    question: 'How do I make wudu?',
    also: ['ablution', 'wudhu', 'wudu steps'],
    answer:
      'Make the intention and say Bismillah. Then:\n- wash your hands three times\n- rinse your mouth and nose three times\n- wash your face three times\n- wash your arms up to and including the elbows, right then left, three times\n- wipe over your head once, and your ears\n- wash your feet up to and including the ankles, right then left, three times.\n\nThe Quran names washing the face, arms, wiping the head and washing the feet. The rest is from the Prophet’s ﷺ practice.',
    refs: ['Quran 5:6', 'Sahih al-Bukhari 159', 'Sahih Muslim 226'],
  },
  {
    id: 'wudu-breakers',
    topic: 'Purity',
    question: 'What breaks wudu?',
    also: ['invalidate wudu', 'nullify ablution', 'does bleeding break wudu', 'does touching break wudu'],
    answer:
      'All four schools agree that wudu is broken by anything that leaves the front or back passage (urine, stool, wind), by deep sleep, and by losing consciousness.\n\nThey differ on some things:\n- Touching your private part with the bare hand: breaks it for the Shafi‘i and Hanbali schools and, with conditions, the Maliki; not for the Hanafi.\n- Skin contact with the opposite sex: breaks it for the Shafi‘i; for the Maliki and Hanbali only with desire; not for the Hanafi.\n- Flowing blood or a mouthful of vomit: breaks it for the Hanafi, not the others.\n- Eating camel meat: breaks it for the Hanbali.',
    refs: ['Quran 5:6', 'Sahih al-Bukhari 135', 'Sahih Muslim 360'],
  },
  {
    id: 'ghusl',
    topic: 'Purity',
    question: 'When do I need ghusl and how do I do it?',
    also: ['full bath', 'janabah', 'ritual bath'],
    answer:
      'Ghusl is required after sexual intercourse or a discharge with desire, after a woman’s period or post-natal bleeding ends, and when someone becomes Muslim (by most scholars).\n\nThe basic ghusl is to intend it and wash the whole body, including rinsing the mouth and nose for the Hanafi and Hanbali schools. The sunnah way: wash the hands, wash the private parts, make wudu, pour water over the head three times, then wash the rest of the body, starting with the right side.',
    refs: ['Quran 5:6', 'Sahih al-Bukhari 248', 'Sahih Muslim 316'],
  },
  {
    id: 'tayammum',
    topic: 'Purity',
    question: 'What if I can’t find water for wudu?',
    also: ['tayammum', 'dry ablution', 'no water', 'sick cannot use water'],
    answer:
      'If there is no water, or using it would harm you because of illness, you do tayammum: intend it, strike clean earth (soil or dust) with your hands, then wipe your face and your hands. It replaces wudu and ghusl until water is available again.',
    refs: ['Quran 4:43', 'Quran 5:6', 'Sahih al-Bukhari 338'],
  },

  // Prayer
  {
    id: 'rakahs',
    topic: 'Prayer',
    question: 'How many rak‘ahs is each prayer?',
    also: ['rakat', 'raka', 'how many units', 'five daily prayers'],
    answer:
      'The five obligatory prayers are:\n- Fajr: 2\n- Dhuhr: 4\n- Asr: 4\n- Maghrib: 3\n- Isha: 4\n\nThey were made obligatory on the night of the Mi‘raj.',
    refs: ['Sahih al-Bukhari 349', 'Quran 4:103'],
  },
  {
    id: 'missed-prayer',
    topic: 'Prayer',
    question: 'What do I do if I missed a prayer?',
    also: ['qada', 'make up prayer', 'overslept fajr', 'forgot to pray'],
    answer:
      'Pray it as soon as you remember. The Prophet ﷺ said: "Whoever forgets a prayer, let him pray it when he remembers it; there is no expiation for it except that."\n\nAll four schools say missed obligatory prayers must be made up, even when missed on purpose, along with sincere repentance for missing them deliberately.',
    refs: ['Sahih al-Bukhari 597', 'Sahih Muslim 684'],
  },
  {
    id: 'travel-prayer',
    topic: 'Prayer',
    question: 'Can I shorten or combine prayers when travelling?',
    also: ['qasr', 'combine prayers', 'travelling prayer', 'musafir'],
    answer:
      'When travelling, the four-rak‘ah prayers (Dhuhr, Asr, Isha) are shortened to two. The Hanafi school says shortening is required; the others say it is a strong sunnah. Most schools use a distance of roughly 80 to 90 km.\n\nCombining Dhuhr with Asr and Maghrib with Isha while travelling is allowed by the Maliki, Shafi‘i and Hanbali schools. The Hanafi school only allows true combining at Arafah and Muzdalifah during Hajj.',
    refs: ['Quran 4:101', 'Sahih Muslim 686', 'Sahih Muslim 704'],
  },
  {
    id: 'raise-hands',
    topic: 'Prayer',
    question: 'When do I raise my hands in prayer?',
    also: ['raf al yadayn', 'rafa yadain', 'raising hands madhab'],
    answer:
      'Everyone raises the hands with the opening takbir.\n\n- Shafi‘i and Hanbali: also when going into ruku and when rising from it (and the Shafi‘i school also when standing up after the first tashahhud).\n- Hanafi and Maliki: only at the opening takbir.\n\nBoth sides have evidence, and either way the prayer is valid.',
    refs: ['Sahih al-Bukhari 735', 'Sunan Abi Dawud 748'],
  },
  {
    id: 'hands-position',
    topic: 'Prayer',
    question: 'Where do I place my hands in prayer?',
    also: ['folding hands', 'hands on chest', 'hands below navel', 'sadl'],
    answer:
      'Most scholars place the right hand over the left while standing:\n- Hanafi: below the navel for men\n- Shafi‘i: below the chest, above the navel\n- Hanbali: below the navel in the best-known view\n- Maliki: the well-known view is to let the arms hang at the sides in obligatory prayers.\n\nThe prayer is valid in all of these.',
    refs: ['Sahih al-Bukhari 740', 'Sahih Muslim 401'],
  },
  {
    id: 'ameen',
    topic: 'Prayer',
    question: 'Do I say Ameen out loud?',
    also: ['amin aloud', 'saying ameen after fatiha'],
    answer:
      'After Al-Fatiha everyone says Ameen. In prayers recited aloud:\n- Shafi‘i and Hanbali: the imam and followers say it aloud.\n- Hanafi: it is said quietly.\n- Maliki: the follower says it quietly, and the well-known view is that the imam does not say it aloud.\n\nThe Prophet ﷺ said that whoever’s Ameen matches the Ameen of the angels is forgiven his past sins.',
    refs: ['Sahih al-Bukhari 780', 'Sahih Muslim 410'],
  },
  {
    id: 'sahw',
    topic: 'Prayer',
    question: 'What if I forget how many rak‘ahs I prayed?',
    also: ['sujud sahw', 'prostration of forgetfulness', 'doubt in prayer', 'mistake in prayer'],
    answer:
      'Build on what you are sure of, which is the smaller number, complete the prayer, and then make two prostrations of forgetfulness (sujud as-sahw) before the salam. The schools differ on whether sujud as-sahw comes before or after the salam in some cases, and all accept both.',
    refs: ['Sahih Muslim 571'],
  },
  {
    id: 'witr',
    topic: 'Prayer',
    question: 'Is witr prayer obligatory?',
    also: ['witr', 'witr rakahs'],
    answer:
      'Witr is prayed after Isha and before Fajr, with an odd number of rak‘ahs. The Hanafi school says it is wajib (necessary), prayed as three rak‘ahs. The Maliki, Shafi‘i and Hanbali schools say it is a strongly recommended sunnah. The Prophet ﷺ said: "Make witr the last of your prayer at night."',
    refs: ['Sahih al-Bukhari 998', 'Sahih Muslim 751'],
  },
  {
    id: 'sunnah-prayers',
    topic: 'Prayer',
    question: 'Which sunnah prayers go with the five prayers?',
    also: ['rawatib', 'sunnah rakahs', '12 rakahs'],
    answer:
      'The Prophet ﷺ said Allah builds a house in Paradise for whoever prays twelve rak‘ahs a day besides the obligatory ones. They are usually counted as:\n- 2 before Fajr\n- 4 before Dhuhr and 2 after\n- 2 after Maghrib\n- 2 after Isha\n\nThe two before Fajr are the most important.',
    refs: ['Sahih Muslim 728', 'Jami‘ at-Tirmidhi 415'],
  },
  {
    id: 'tahajjud',
    topic: 'Prayer',
    question: 'What is tahajjud?',
    also: ['night prayer', 'qiyam al layl', 'qiyam'],
    answer:
      'Tahajjud is voluntary prayer at night, ideally after sleeping and before Fajr, prayed two rak‘ahs at a time. The Prophet ﷺ said the best prayer after the obligatory ones is the night prayer, and that Allah descends in the last third of every night asking who will call on Him so He may answer.',
    refs: ['Quran 17:79', 'Sahih Muslim 1163', 'Sahih al-Bukhari 1145'],
  },
  {
    id: 'jumuah',
    topic: 'Prayer',
    question: 'Who has to pray Jumu‘ah?',
    also: ['friday prayer', 'jummah', 'jumah'],
    answer:
      'Jumu‘ah is obligatory for adult, sane, free Muslim men who are resident and not travelling or ill. It replaces Dhuhr. Women are not required to attend, but if they do, it counts and they do not pray Dhuhr.',
    refs: ['Quran 62:9', 'Sunan Abi Dawud 1067'],
  },
  {
    id: 'eid-prayer',
    topic: 'Prayer',
    question: 'Is the Eid prayer obligatory?',
    also: ['eid salah', 'salat al eid'],
    answer:
      'Eid prayer is two rak‘ahs in congregation in the morning of Eid, with extra takbirs.\n- Hanafi: wajib on those who must pray Jumu‘ah.\n- Maliki and Shafi‘i: a strongly recommended sunnah.\n- Hanbali: a communal obligation (fard kifayah).',
    refs: ['Quran 108:2', 'Sahih al-Bukhari 956'],
  },
  {
    id: 'dhikr-after',
    topic: 'Prayer',
    question: 'What do I say after prayer?',
    also: ['adhkar after salah', 'tasbih', 'subhanallah 33'],
    answer:
      'Say Astaghfirullah three times, then "Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram." Then SubhanAllah 33 times, Alhamdulillah 33 times and Allahu Akbar 33 times, completing a hundred with "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ‘ala kulli shay’in qadir."',
    refs: ['Sahih Muslim 591', 'Sahih Muslim 597'],
  },
  {
    id: 'menses-prayer',
    topic: 'Prayer',
    question: 'Do women pray or fast during their period?',
    also: ['menstruation', 'haid', 'period prayer', 'period fasting'],
    answer:
      'No. During menstruation and post-natal bleeding a woman does not pray or fast. Afterwards she makes up the missed fasts but not the missed prayers. ‘A’ishah said: "We were commanded to make up the fasts, and we were not commanded to make up the prayers."',
    refs: ['Sahih Muslim 335', 'Sahih al-Bukhari 321'],
  },
  {
    id: 'arabic-prayer',
    topic: 'Prayer',
    question: 'I don’t know Arabic yet. How do I pray?',
    also: ['new muslim prayer', 'pray in english', 'cant recite fatiha'],
    answer:
      'The Quran in prayer is recited in Arabic, so start by learning Al-Fatiha, little by little. Until you can, the Prophet ﷺ told a man who could not recite to say: "SubhanAllah, walhamdulillah, wa la ilaha illallah, wallahu akbar, wa la hawla wa la quwwata illa billah." Pray anyway while you learn. Allah does not burden anyone beyond what they can bear.',
    refs: ['Sunan Abi Dawud 832', 'Quran 2:286'],
  },

  // Fasting
  {
    id: 'fast-who',
    topic: 'Fasting',
    question: 'Who has to fast in Ramadan?',
    also: ['ramadan obligation', 'exempt from fasting', 'sick fasting', 'travel fasting'],
    answer:
      'Fasting Ramadan is obligatory for every adult, sane Muslim who is able. The sick and travellers may break the fast and make up the days later. Those who can never fast, such as the very elderly or chronically ill, feed a poor person for each day instead (fidyah). Pregnant and nursing women who fear harm may also break the fast; the schools differ on whether they make up, feed, or both.',
    refs: ['Quran 2:183-185'],
  },
  {
    id: 'fast-breakers',
    topic: 'Fasting',
    question: 'What breaks the fast?',
    also: ['invalidate fast', 'does brushing teeth break fast', 'ate by mistake', 'forgot and ate'],
    answer:
      'Deliberately eating, drinking or having intercourse during the day breaks the fast. Eating or drinking by mistake does not: the Prophet ﷺ said, "Whoever forgets while fasting and eats or drinks, let him complete his fast, for it is Allah who fed him and gave him drink."\n\nThings like brushing teeth without swallowing, a shower, or eye drops do not break the fast for most scholars, though the schools differ on details.',
    refs: ['Quran 2:187', 'Sahih al-Bukhari 1933', 'Sahih Muslim 1155'],
  },
  {
    id: 'suhoor',
    topic: 'Fasting',
    question: 'Why is suhoor important?',
    also: ['sehri', 'pre dawn meal', 'iftar'],
    answer:
      'The Prophet ﷺ said: "Take suhoor, for in suhoor there is blessing." It is sunnah to delay suhoor towards Fajr and to hurry to break the fast at sunset, ideally with dates or water.',
    refs: ['Sahih al-Bukhari 1923', 'Sahih Muslim 1095', 'Sahih al-Bukhari 1957'],
  },
  {
    id: 'arafah-fast',
    topic: 'Fasting',
    question: 'Which voluntary fasts are best?',
    also: ['arafah fast', 'ashura', 'sunnah fasts', 'monday thursday', 'six days shawwal'],
    answer:
      'Some well-known sunnah fasts:\n- The Day of Arafah: expiates the sins of the year before and the year after.\n- Ashura (10 Muharram): expiates the year before.\n- Six days of Shawwal after Ramadan: like fasting the whole year.\n- Mondays and Thursdays, and three days each month.',
    refs: ['Sahih Muslim 1162', 'Sahih Muslim 1164'],
  },

  // Zakat & charity
  {
    id: 'zakat',
    topic: 'Zakat & charity',
    question: 'How does zakat work?',
    also: ['how much zakat', 'nisab', 'zakat on savings', 'zakat on gold'],
    answer:
      'Zakat is due on savings, gold, silver, trade goods and some other wealth that reach the nisab and are held for a full lunar year. On money it is 2.5%. The nisab is the value of 85 g of gold or 595 g of silver; many scholars today use silver because it helps more of the poor.\n\nThe schools differ on details such as jewellery that is worn, so ask a scholar about your own case.',
    refs: ['Quran 9:60', 'Quran 2:43', 'Sahih al-Bukhari 1454'],
  },
  {
    id: 'zakat-who',
    topic: 'Zakat & charity',
    question: 'Who can receive zakat?',
    also: ['zakat recipients', 'give zakat to family'],
    answer:
      'The Quran names eight groups: the poor, the needy, those who collect zakat, those whose hearts are to be won over, freeing captives, those in debt, in the cause of Allah, and the stranded traveller. Zakat may not be given to your own parents, children or spouse, whom you are already responsible for.',
    refs: ['Quran 9:60'],
  },
  {
    id: 'zakat-fitr',
    topic: 'Zakat & charity',
    question: 'What is zakat al-fitr?',
    also: ['fitrana', 'fitra', 'eid charity'],
    answer:
      'Zakat al-fitr is a small charity paid for every Muslim in the household at the end of Ramadan, before the Eid prayer: one sa‘ (about 2.5 to 3 kg) of staple food such as dates, barley or rice. The Hanafi school allows paying its value in money; the other schools prefer food.',
    refs: ['Sahih al-Bukhari 1503', 'Sahih Muslim 984'],
  },
  {
    id: 'sadaqah',
    topic: 'Zakat & charity',
    question: 'Does charity have to be money?',
    also: ['sadaqah', 'small good deeds', 'smiling charity'],
    answer:
      'No. Sadaqah is any good given for Allah’s sake. The Prophet ﷺ said: "Your smile in the face of your brother is charity," and that removing something harmful from the road is charity too. He also said: "Charity does not decrease wealth."',
    refs: ['Jami‘ at-Tirmidhi 1956', 'Sahih Muslim 2588', 'Sahih Muslim 1009'],
  },

  // Hajj
  {
    id: 'hajj-who',
    topic: 'Hajj',
    question: 'Who has to go on Hajj?',
    also: ['hajj obligation', 'is hajj required', 'hajj once'],
    answer:
      'Hajj is obligatory once in a lifetime on every adult Muslim who is physically and financially able, with a safe route. The Prophet ﷺ was asked if it is every year and said: "If I said yes, it would become obligatory, and you would not be able to."',
    refs: ['Quran 3:97', 'Sahih Muslim 1337'],
  },
  {
    id: 'umrah-hajj-diff',
    topic: 'Hajj',
    question: 'What is the difference between Hajj and Umrah?',
    also: ['umrah vs hajj'],
    answer:
      'Umrah can be done at any time of year and takes a few hours: ihram, tawaf, sa‘i, and shaving or trimming. Hajj happens only from 8 to 13 Dhul Hijjah and includes Umrah’s acts plus Mina, Arafah, Muzdalifah and the stoning. Standing at Arafah is the heart of Hajj. See the Hajj and Umrah guide in the app for the steps.',
    refs: ['Quran 2:196', 'Jami‘ at-Tirmidhi 889'],
  },

  // Quran
  {
    id: 'quran-compiled',
    topic: 'Quran',
    question: 'How was the Quran put together?',
    also: ['quran compilation', 'mushaf', 'was the quran changed'],
    answer:
      'The Quran was revealed over 23 years and memorised and written down during the Prophet’s ﷺ life. After many memorisers died at Yamamah, Abu Bakr had Zayd ibn Thabit gather it into one book. Later ‘Uthman had official copies made and sent to the main cities. The Quran we recite today is the same text.',
    refs: ['Quran 15:9', 'Sahih al-Bukhari 4986', 'Sahih al-Bukhari 4987'],
  },
  {
    id: 'quran-reward',
    topic: 'Quran',
    question: 'What is the reward for reading the Quran?',
    also: ['reading quran benefits', 'each letter ten rewards'],
    answer:
      'The Prophet ﷺ said that whoever reads a letter of the Book of Allah gets a good deed, and each good deed is multiplied by ten. He also said that the one who reads with difficulty, struggling over it, gets a double reward. So keep going even if you are slow.',
    refs: ['Jami‘ at-Tirmidhi 2910', 'Sahih Muslim 798'],
  },
  {
    id: 'quran-wudu',
    topic: 'Quran',
    question: 'Do I need wudu to touch the Quran?',
    also: ['touch mushaf without wudu', 'read quran on phone without wudu'],
    answer:
      'The four schools say you need wudu to touch a printed copy of the Quran (the mushaf). Reciting from memory without wudu is allowed. Many scholars say reading on a phone is not the same as touching a mushaf, so wudu is not required for it, though it is better to have wudu.',
    refs: ['Quran 56:79', 'Muwatta Malik 15:1'],
  },

  // Daily life
  {
    id: 'halal-food',
    topic: 'Daily life',
    question: 'What food is halal?',
    also: ['haram food', 'pork', 'zabiha', 'seafood halal', 'meat of people of the book'],
    answer:
      'Most food is halal. The Quran forbids pork, blood, dead animals, and what is slaughtered in a name other than Allah’s; alcohol and intoxicants are also forbidden. Meat must be slaughtered properly. The food of the People of the Book is allowed by the Quran, and scholars differ on how that applies to meat today.\n\nOn seafood: the Maliki, Shafi‘i and Hanbali schools allow almost all sea creatures; the Hanafi school allows only fish.',
    refs: ['Quran 5:3', 'Quran 5:5', 'Quran 5:90', 'Sunan Abi Dawud 83'],
  },
  {
    id: 'bismillah-eating',
    topic: 'Daily life',
    question: 'What are the manners of eating?',
    also: ['eat with right hand', 'bismillah before eating', 'eating sunnah'],
    answer:
      'The Prophet ﷺ told a boy: "Say Bismillah, eat with your right hand, and eat from what is in front of you." If you forget Bismillah at the start, say "Bismillahi awwalahu wa akhirah." Say Alhamdulillah when you finish.',
    refs: ['Sahih al-Bukhari 5376', 'Sunan Abi Dawud 3767'],
  },
  {
    id: 'salam',
    topic: 'Daily life',
    question: 'Why do Muslims say salam?',
    also: ['assalamu alaikum', 'greeting', 'spread salam'],
    answer:
      '"As-salamu ‘alaykum" means "peace be upon you." The Prophet ﷺ said: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you something that, if you do it, you will love one another? Spread salam among yourselves." Replying to salam is an obligation.',
    refs: ['Sahih Muslim 54', 'Quran 4:86'],
  },
  {
    id: 'parents',
    topic: 'Daily life',
    question: 'What does Islam say about parents?',
    also: ['mother', 'father', 'respect parents', 'birr al walidayn'],
    answer:
      'After worshipping Allah, the Quran commands kindness to parents and not even saying "uff" to them. A man asked the Prophet ﷺ who most deserves his good company. He said "Your mother," three times, then "Your father."',
    refs: ['Quran 17:23-24', 'Sahih al-Bukhari 5971', 'Sahih Muslim 2548'],
  },
  {
    id: 'backbiting',
    topic: 'Daily life',
    question: 'What is backbiting?',
    also: ['gheebah', 'ghibah', 'gossip'],
    answer:
      'The Prophet ﷺ defined backbiting as "mentioning your brother in a way he would dislike." If what you say is true, that is backbiting; if it is false, it is slander, which is worse. The Quran compares backbiting to eating the flesh of your dead brother.',
    refs: ['Quran 49:12', 'Sahih Muslim 2589'],
  },
  {
    id: 'honesty',
    topic: 'Daily life',
    question: 'Is lying ever allowed?',
    also: ['lying', 'honesty', 'truthfulness'],
    answer:
      'Truthfulness leads to righteousness and lying leads to wrongdoing. Scholars mention narrow exceptions from a hadith: making peace between people, in war, and between spouses to keep love between them, which does not include deceiving them about rights.',
    refs: ['Sahih al-Bukhari 6094', 'Sahih Muslim 2605'],
  },
  {
    id: 'riba',
    topic: 'Daily life',
    question: 'Is interest haram?',
    also: ['riba', 'bank interest', 'mortgage', 'loan interest'],
    answer:
      'Yes. Riba (interest on loans) is clearly forbidden in the Quran, and the Prophet ﷺ cursed the one who takes it, the one who pays it, the one who writes it and its witnesses. For personal cases like a mortgage or student loan, speak to a scholar who knows the finance where you live.',
    refs: ['Quran 2:275-279', 'Sahih Muslim 1598'],
  },
  {
    id: 'hijab',
    topic: 'Daily life',
    question: 'Is hijab obligatory?',
    also: ['headscarf', 'niqab', 'covering', 'awrah women'],
    answer:
      'All four schools say a Muslim woman must cover her body and hair in front of men who are not close relatives. They differ on the face and hands: the Hanafi and Maliki schools say these do not have to be covered; the stronger view in the Shafi‘i and Hanbali schools is that they should be covered in front of non-mahram men, though many scholars in those schools also allow uncovering them.',
    refs: ['Quran 24:31', 'Quran 33:59'],
  },
  {
    id: 'music',
    topic: 'Daily life',
    question: 'Is music haram?',
    also: ['musical instruments', 'nasheed', 'singing'],
    answer:
      'The four schools generally prohibit musical instruments, citing a hadith in al-Bukhari about people who will make musical instruments lawful. They allow the daff (hand drum) at weddings and Eid, and singing with good words. Some scholars past and present have held a more lenient view. Nasheeds without instruments are widely accepted.',
    refs: ['Sahih al-Bukhari 5590', 'Sahih al-Bukhari 952'],
  },
  {
    id: 'death',
    topic: 'Daily life',
    question: 'What do I say when someone dies?',
    also: ['inna lillahi', 'condolences', 'funeral', 'janazah'],
    answer:
      'Say: "Inna lillahi wa inna ilayhi raji‘un" (To Allah we belong and to Him we return). The Prophet ﷺ taught adding: "Allahumma ajirni fi musibati wakhluf li khayran minha" (O Allah, reward me in my affliction and give me something better). Make dua for the one who died, and attend the janazah prayer if you can.',
    refs: ['Quran 2:156', 'Sahih Muslim 918'],
  },

  // Heart
  {
    id: 'repentance',
    topic: 'Heart',
    question: 'Will Allah forgive me?',
    also: ['tawbah', 'repent', 'forgiveness', 'i sinned', 'too many sins'],
    answer:
      'Yes, if you turn back to Him. Allah says: "O My servants who have wronged themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins." Sincere repentance means stopping the sin, regretting it, and intending not to return to it, and giving back any right taken from a person. The Prophet ﷺ said every child of Adam makes mistakes, and the best of them are those who repent.',
    refs: ['Quran 39:53', 'Jami‘ at-Tirmidhi 2499'],
  },
  {
    id: 'waswasa',
    topic: 'Heart',
    question: 'I get bad thoughts and doubts about my faith. What do I do?',
    also: ['waswas', 'waswasa', 'whispers', 'doubts', 'intrusive thoughts'],
    answer:
      'Some Companions told the Prophet ﷺ they found thoughts in themselves too terrible to speak about. He said: "That is clear faith," because hating those thoughts shows iman. When they come, seek refuge in Allah (A‘udhu billahi minash-shaytanir-rajim), stop following the thought, and carry on. If the thoughts are overwhelming, it is also good to talk to a counsellor or doctor.',
    refs: ['Sahih Muslim 132', 'Sahih al-Bukhari 3276'],
  },
  {
    id: 'dua-times',
    topic: 'Heart',
    question: 'When is dua most likely to be answered?',
    also: ['best time for dua', 'accepted dua', 'dua times'],
    answer:
      'Some times mentioned in the hadith:\n- the last third of the night\n- between the adhan and the iqamah\n- in sujud\n- while fasting and at iftar\n- on Fridays, especially the last hour after Asr\n- when travelling\n\nAsk with certainty, and do not give up because an answer seems slow.',
    refs: ['Sahih al-Bukhari 1145', 'Sunan Abi Dawud 521', 'Sahih Muslim 482', 'Sahih al-Bukhari 6340'],
  },
  {
    id: 'istighfar',
    topic: 'Heart',
    question: 'How often should I say Astaghfirullah?',
    also: ['istighfar', 'seeking forgiveness', 'sayyid al istighfar'],
    answer:
      'The Prophet ﷺ said: "By Allah, I seek Allah’s forgiveness and repent to Him more than seventy times a day." The best form is Sayyid al-Istighfar, which you can find in the Duas section of the app.',
    refs: ['Sahih al-Bukhari 6307', 'Sahih al-Bukhari 6306'],
  },
  {
    id: 'sabr',
    topic: 'Heart',
    question: 'I’m going through a hard time. What does Islam say?',
    also: ['sad', 'depressed', 'hardship', 'patience', 'sabr', 'anxiety'],
    answer:
      'Allah says: "Indeed, with hardship comes ease," and that He does not burden a soul beyond what it can bear. The Prophet ﷺ said that no fatigue, illness, worry or grief afflicts a believer, even a thorn’s prick, except that Allah wipes away some of his sins by it.\n\nKeep praying and making dua, and talk to someone you trust. If you feel unsafe, please contact local emergency services or a helpline straight away.',
    refs: ['Quran 94:5-6', 'Quran 2:286', 'Sahih al-Bukhari 5641'],
  },
];

const STOP = new Set(
  'a an and are as at be but by can do does for from how i if in is it its me my of on or should so that the this to was what when where which who why will with you your im dont i’m don’t'.split(' '),
);

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

// Light stemming so "prayers", "praying" and "prayer" match.
function stem(w: string) {
  return w.replace(/(ings|ing|ers|er|es|s)$/, '') || w;
}

const INDEX = FAQ.map((f) => {
  const strong = new Set([...words(f.question), ...(f.also ?? []).flatMap(words)].map(stem));
  return { faq: f, strong };
});

/** Library answers that best match a question, best first. Score 1 means every key word matched. */
export function searchFaq(question: string, limit = 3): { faq: Faq; score: number }[] {
  const q = [...new Set(words(question).map(stem))];
  if (q.length === 0) return [];
  return INDEX.map(({ faq, strong }) => {
    const hits = q.filter((w) => strong.has(w)).length;
    return { faq, score: hits / q.length };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Score at or above which the library answer is shown straight away. */
export const CONFIDENT_MATCH = 0.6;
