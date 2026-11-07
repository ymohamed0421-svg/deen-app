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

Units 1 (The Five Pillars) and 2 (How to Pray) are written. All lesson content is a **first draft** and must be reviewed by a qualified scholar before release (see `reviewStatus` in `src/content/units.ts`).

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
```

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
