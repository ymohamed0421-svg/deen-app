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
- **Quran**: all 114 surahs in Arabic with English (Saheeh International) and transliteration under every ayah. Audio by 11 reciters including Yasser Al-Dosari, with loop ayah and loop surah. Recitation keeps going when you leave the screen, lock the phone or open another app, with lock screen controls.
- **Prayer**: prayer times calculated on the phone (adhan library), automatic GPS location or a city chosen by hand, 12 calculation methods, Hanafi or majority Asr, a Qibla compass, and reminders for all five prayers that arrive even when the app is closed.
- **Ask**: a built-in library of common questions (`src/content/faq.ts`) answered from the Quran and hadith with the four madhabs' views, free and offline. Anything else goes to the `ask` Edge Function, which uses Gemini's free tier (or Claude if you set that key instead), with a daily limit per person.
- **More**: hadith or dua of the day, a duas library, Seerah and Companions stories, and an Umrah and Hajj guide.

Units written: The Five Pillars, How to Pray, The Seerah, The Companions (all levels), The Articles of Faith (intermediate) and Prayer in the Four Madhabs (advanced). All lesson content is a **first draft** and must be reviewed by a qualified scholar before release (see `reviewStatus` in `src/content/units.ts`).

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `w` to open it in the browser. The app works offline with progress saved on the device.

## Connect Supabase

The app is set up for the `deen-app` Supabase project: its URL and publishable key are in `.env` (both are public). To create the tables and deploy the functions, run these once from the project folder:

```bash
npx supabase login                                          # opens the browser
npx supabase link --project-ref xkfpcpdbqqratcaqxktl        # asks for the database password
npx supabase db push --remote --include-seed                # tables, security rules and lesson content
npx supabase functions deploy complete-lesson --remote=xkfpcpdbqqratcaqxktl
npx supabase functions deploy ask --remote=xkfpcpdbqqratcaqxktl
npx supabase secrets set GEMINI_API_KEY=your-key            # optional: free key from aistudio.google.com/apikey for AI answers
```

Then turn on **Anonymous sign-ins** in the Supabase dashboard (Authentication > Sign In / Providers). After changing lesson files, run `npm run seed` to regenerate `supabase/seed.sql`.

Prayer reminders, background Quran audio and the Qibla compass need a real phone. Notifications don't work in Expo Go on Android, so use a development build (`npx expo run:android` or `eas build --profile development`).

Quran text and translation come from the [quran-json](https://github.com/risan/quran-json) package (CC BY 4.0). Recitations stream from [everyayah.com](https://everyayah.com).

When a lesson is finished, the app calls the `complete-lesson` Edge Function, which recomputes rewards on the server so streaks and leagues can't be faked.

## Share it with friends (free web version)

`.github/workflows/web.yml` builds the web version and publishes it with GitHub Pages on every push to `main`, at https://ymohamed0421-svg.github.io/deen-app/. To set it up once:

1. On GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
2. The web build reads the public Supabase URL and publishable key from `.env`.

On iPhone, friends open the link in Safari and choose **Share > Add to Home Screen**. Background prayer notifications and the live Qibla compass only work in the phone app.

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
