# Deen

A game-like app that teaches the basics of Islam in short daily lessons, built with Expo (React Native) and Supabase.

## What's in it

- **The Path**: units and lessons that unlock in order, with a chest at the end of each unit.
- **Lessons**: 3 to 5 minutes each, with multiple choice, put-in-order and match-the-pairs exercises, instant feedback and the source for each answer.
- **Istiqamah streak**: days in a row with at least one lesson. **Mercy Days** save the streak if you miss a day.
- **Noor**: points for every lesson, which raise your level and count toward the weekly **Garden League** (Seed, Sprout, Sapling, Palm, Olive, Cedar).
- **Oil and Pearls**: a wrong answer uses a drop of Oil (5 max, one refills every 30 minutes). Foundation units never use Oil. Pearls are earned by learning and spent in the Shop.
- **Garden**: every finished lesson plants something, and every 7-day streak grows a tree.
- **Fanous**: the lantern mascot, whose flame grows with your streak.

- **Your level**: on first launch the learner picks Beginner, Intermediate or Advanced. Beginners start at the pillars; others can jump ahead and get harder questions (fiqh details, madhab differences).
- **Varied lessons**: multiple choice, true or false, fill in the blank, put in order and match the pairs.
- **Quran**: all 114 surahs in Arabic with English (Saheeh International) and transliteration under every ayah. Audio by 11 reciters including Yasser Al-Dosari, with loop ayah and loop surah. Keeps playing with the screen locked.
- **Prayer**: prayer times calculated on the phone (adhan library), automatic GPS location or a city chosen by hand, 12 calculation methods, Hanafi or majority Asr, a Qibla compass, and reminders for all five prayers that arrive even when the app is closed.
- **Ask**: questions answered by Claude through the `ask` Edge Function, citing Quran and hadith and the four madhabs, with a daily limit per person.
- **More**: hadith or dua of the day, a duas library, Seerah and Companions stories, and an Umrah and Hajj guide.

Units written: The Five Pillars, How to Pray, The Seerah, The Companions (all levels), The Articles of Faith (intermediate) and Prayer in the Four Madhabs (advanced). All lesson content is a **first draft** and must be reviewed by a qualified scholar before release (see `reviewStatus` in `src/content/units.ts`).

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` to open it in the browser. The app works offline with progress saved on the device.

## Connect Supabase

1. Copy `.env.example` to `.env.local` and fill in your project URL and anon key.
2. Turn on **Anonymous sign-ins** in Supabase (Authentication > Providers).
3. Apply the schema and content, then deploy the function:

```bash
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push            # creates the tables and security rules
npm run seed                    # regenerates supabase/seed.sql from the lesson files
psql "$DATABASE_URL" -f supabase/seed.sql
npx supabase functions deploy complete-lesson
npx supabase secrets set ANTHROPIC_API_KEY=your-key   # for the Ask tab
npx supabase functions deploy ask
```

Prayer reminders, background Quran audio and the Qibla compass need a real phone. Notifications don't work in Expo Go on Android, so use a development build (`npx expo run:android` or `eas build --profile development`).

Quran text and translation come from the [quran-json](https://github.com/risan/quran-json) package (CC BY 4.0). Recitations stream from [everyayah.com](https://everyayah.com).

When a lesson is finished, the app calls the `complete-lesson` Edge Function, which recomputes rewards on the server so streaks and leagues can't be faked.

## Project layout

| Path | What it holds |
| --- | --- |
| `src/app/` | Screens (Expo Router): path, garden, league, shop, lesson player |
| `src/components/` | Fanous, buttons, exercise types, stats bar |
| `src/content/` | Lesson content and types |
| `supabase/functions/_shared/rules.ts` | Game rules shared by the app and the server |
| `supabase/functions/complete-lesson/` | Edge Function that awards Noor, Pearls and the streak |
| `supabase/migrations/` | Database schema and row level security |

## Checks

```bash
npm test          # game rules
npm run typecheck
```
