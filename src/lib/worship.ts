// Prayer tracker and dhikr rules. Pure functions only, so tests run in Node.
import { STREAK_MILESTONES, mondayOf, recordActivity, toDateKey, type GameState } from '../../supabase/functions/_shared/rules.ts';

export const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type Fard = (typeof FARD)[number];
export type PrayerMark = 'onTime' | 'late';
export type DayPrayers = Partial<Record<Fard, PrayerMark>>;
export type PrayerLog = Record<string, DayPrayers>;

/** The prayer times of one day, as returned by adhan's PrayerTimes. */
export type DayTimes = Record<Fard | 'sunrise', Date>;

export const WORSHIP_REWARDS = {
  prayerNoor: 3, // logging a prayer for today
  fullDayBonusNoor: 10, // all five prayers logged on time today
  adhkarNoor: 10, // finishing the morning or evening adhkar, once a day each
  tasbihSetNoor: 3, // a full 33/33/34 tasbih after salah
  tasbihSetsPerDay: 5, // tasbih sets that earn Noor each day
} as const;

/**
 * The day a prayer belongs to. Before Fajr it is still "last night", so an Isha
 * prayed after midnight is logged on the evening it belongs to.
 */
export function prayerDayKey(now: Date, fajrToday: Date | null) {
  if (fajrToday && now < fajrToday) return toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12));
  return toDateKey(now);
}

/** When each prayer's time runs out: Fajr at sunrise, Isha at the next Fajr, the rest at the next prayer. */
export function windowEnd(p: Fard, today: DayTimes, tomorrow: DayTimes): Date {
  switch (p) {
    case 'fajr':
      return today.sunrise;
    case 'dhuhr':
      return today.asr;
    case 'asr':
      return today.maghrib;
    case 'maghrib':
      return today.isha;
    case 'isha':
      return tomorrow.fajr;
  }
}

/**
 * How a prayer tapped now should be marked: on time while its time is still in,
 * late once it has passed, or null if its time hasn't started yet.
 */
export function markFor(p: Fard, now: Date, today: DayTimes, tomorrow: DayTimes): PrayerMark | null {
  if (now < today[p]) return null;
  return now <= windowEnd(p, today, tomorrow) ? 'onTime' : 'late';
}

export function dayCounts(day: DayPrayers | undefined) {
  let prayed = 0;
  let onTime = 0;
  for (const p of FARD) {
    const m = day?.[p];
    if (m) prayed++;
    if (m === 'onTime') onTime++;
  }
  return { prayed, onTime };
}

/** The last `n` day keys ending at `lastKey`, oldest first. */
export function lastDays(lastKey: string, n = 7) {
  const [y, m, d] = lastKey.split('-').map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(toDateKey(new Date(y, m - 1, d - i, 12)));
  return out;
}

export function weekSummary(log: PrayerLog, lastKey: string) {
  const days = lastDays(lastKey, 7).map((key) => ({ key, ...dayCounts(log[key]) }));
  return {
    days,
    prayed: days.reduce((s, d) => s + d.prayed, 0),
    onTime: days.reduce((s, d) => s + d.onTime, 0),
    fullDays: days.filter((d) => d.onTime === 5).length,
  };
}

/** Noor for logging prayer `p` on today's prayer day, given what was already rewarded. */
export function prayerReward(day: DayPrayers, rewarded: Fard[], p: Fard) {
  if (rewarded.includes(p) || !day[p]) return { noor: 0, rewarded };
  const next = [...rewarded, p];
  let noor = WORSHIP_REWARDS.prayerNoor;
  if (dayCounts(day).onTime === 5) noor += WORSHIP_REWARDS.fullDayBonusNoor;
  return { noor, rewarded: next };
}

export type WorshipAward = { state: GameState; noor: number; streakExtended: boolean; streak: number; milestone: number | null };

/**
 * Adds Noor from worship to the game, and keeps today's streak alive when asked
 * (a prayer prayed on time counts for the streak just like a lesson).
 */
export function awardWorship(state: GameState, noor: number, today: string, extendStreak: boolean): WorshipAward {
  let streak = state.streak;
  let wallet = state.wallet;
  let streakExtended = false;
  let milestone: number | null = null;
  if (extendStreak) {
    const s = recordActivity(state.streak, state.wallet.mercyDays, today);
    streak = s.streak;
    streakExtended = s.extended;
    milestone = s.milestone;
    wallet = {
      ...wallet,
      mercyDays: wallet.mercyDays - s.mercyDaysUsed,
      pearls: wallet.pearls + (milestone ? STREAK_MILESTONES[milestone] : 0),
    };
  }
  const week = mondayOf(today);
  const weeklyNoor = (week === state.weekStart ? state.weeklyNoor : 0) + noor;
  return {
    state: { ...state, noor: state.noor + noor, weeklyNoor, weekStart: week, streak, wallet },
    noor,
    streakExtended,
    streak: streak.current,
    milestone,
  };
}

// ---------- Ramadan ----------

/** Where each of the 30 juz starts (surah, ayah), for a one-juz-a-night taraweeh plan. */
export const JUZ_STARTS: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

export type FastMark = 'fasted' | 'missed';

/** Cycles a day in the fasting tracker: blank, fasted, missed (to make up), blank. */
export function nextFastMark(m: FastMark | undefined): FastMark | undefined {
  if (!m) return 'fasted';
  if (m === 'fasted') return 'missed';
  return undefined;
}
