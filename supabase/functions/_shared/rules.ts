// Game rules shared by the app and the `complete-lesson` Edge Function.
// Pure functions only, no imports, so both Metro (app) and Deno (server) can load this file.

export const MAX_OIL = 5;
export const OIL_REFILL_MS = 30 * 60 * 1000; // one drop every 30 minutes
export const MAX_MERCY_DAYS = 2;

export const PRICES = {
  mercyDay: 200,
  oilRefill: 100,
} as const;

export const REWARDS = {
  lessonNoor: 10,
  perfectBonusNoor: 5,
  lessonPearls: 5,
  perfectBonusPearls: 5,
  unitChestPearls: 30,
} as const;

// Streak milestones and the Pearls they award.
export const STREAK_MILESTONES: Record<number, number> = {
  7: 50,
  30: 100,
  40: 150,
  100: 300,
  365: 1000,
};

export const LEAGUE_TIERS = ['Seed', 'Sprout', 'Sapling', 'Palm', 'Olive', 'Cedar'] as const;
export type LeagueTier = (typeof LEAGUE_TIERS)[number];

export type Streak = {
  current: number;
  longest: number;
  lastActiveDate: string | null; // YYYY-MM-DD in the user's own time zone
};

export type Wallet = {
  oil: number;
  oilUpdatedAt: number; // ms timestamp of the last refill tick
  pearls: number;
  mercyDays: number;
};

export type GameState = {
  noor: number;
  weeklyNoor: number;
  weekStart: string; // YYYY-MM-DD of the Monday the weekly count belongs to
  streak: Streak;
  wallet: Wallet;
  completedLessons: Record<string, { bestMistakes: number; completedAt: number }>;
  garden: string[]; // ids of plants grown, one per finished lesson
};

export function newGameState(now: number, today: string): GameState {
  return {
    noor: 0,
    weeklyNoor: 0,
    weekStart: mondayOf(today),
    streak: { current: 0, longest: 0, lastActiveDate: null },
    wallet: { oil: MAX_OIL, oilUpdatedAt: now, pearls: 0, mercyDays: 0 },
    completedLessons: {},
    garden: [],
  };
}

// ---------- dates ----------

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyToUtc(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dateKeyToUtc(to) - dateKeyToUtc(from)) / 86_400_000);
}

export function mondayOf(key: string): string {
  const t = dateKeyToUtc(key);
  const weekday = new Date(t).getUTCDay(); // 0 = Sunday
  const offset = (weekday + 6) % 7;
  const monday = new Date(t - offset * 86_400_000);
  return monday.toISOString().slice(0, 10);
}

// ---------- streak ----------

/** The streak as it should be shown today, before any lesson is done. */
export function effectiveStreak(streak: Streak, mercyDays: number, today: string): number {
  if (!streak.lastActiveDate) return 0;
  const gap = daysBetween(streak.lastActiveDate, today);
  if (gap <= 1) return streak.current;
  return gap - 1 <= mercyDays ? streak.current : 0;
}

/** Days the user has missed that a Mercy Day would need to cover. */
export function missedDays(streak: Streak, today: string): number {
  if (!streak.lastActiveDate) return 0;
  return Math.max(0, daysBetween(streak.lastActiveDate, today) - 1);
}

export type StreakResult = {
  streak: Streak;
  mercyDaysUsed: number;
  extended: boolean; // true the first time a lesson is done on a given day
  milestone: number | null;
};

export function recordActivity(streak: Streak, mercyDays: number, today: string): StreakResult {
  if (streak.lastActiveDate === today) {
    return { streak, mercyDaysUsed: 0, extended: false, milestone: null };
  }
  let current = 1;
  let mercyDaysUsed = 0;
  if (streak.lastActiveDate) {
    const missed = missedDays(streak, today);
    if (missed === 0) {
      current = streak.current + 1;
    } else if (missed <= mercyDays) {
      current = streak.current + 1;
      mercyDaysUsed = missed;
    }
  }
  const next: Streak = {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDate: today,
  };
  return {
    streak: next,
    mercyDaysUsed,
    extended: true,
    milestone: STREAK_MILESTONES[current] !== undefined ? current : null,
  };
}

// ---------- oil (lives) ----------

export function refillOil(wallet: Wallet, now: number): Wallet {
  if (wallet.oil >= MAX_OIL) return { ...wallet, oil: MAX_OIL, oilUpdatedAt: now };
  const drops = Math.floor((now - wallet.oilUpdatedAt) / OIL_REFILL_MS);
  if (drops <= 0) return wallet;
  const oil = Math.min(MAX_OIL, wallet.oil + drops);
  return {
    ...wallet,
    oil,
    oilUpdatedAt: oil >= MAX_OIL ? now : wallet.oilUpdatedAt + drops * OIL_REFILL_MS,
  };
}

/** Uses one drop of Oil for a wrong answer. Foundation lessons never cost Oil. */
export function spendOil(wallet: Wallet, now: number, foundation: boolean): Wallet {
  if (foundation) return wallet;
  const w = refillOil(wallet, now);
  if (w.oil <= 0) return w;
  return { ...w, oil: w.oil - 1, oilUpdatedAt: w.oil >= MAX_OIL ? now : w.oilUpdatedAt };
}

export function msUntilNextDrop(wallet: Wallet, now: number): number | null {
  if (wallet.oil >= MAX_OIL) return null;
  return Math.max(0, wallet.oilUpdatedAt + OIL_REFILL_MS - now);
}

/** A review lesson refills one drop as a reward for practising. */
export function reviewRefill(wallet: Wallet): Wallet {
  return { ...wallet, oil: Math.min(MAX_OIL, wallet.oil + 1) };
}

// ---------- shop ----------

export type ShopItem = 'mercyDay' | 'oilRefill';

export function canBuy(wallet: Wallet, item: ShopItem): boolean {
  if (wallet.pearls < PRICES[item]) return false;
  if (item === 'mercyDay') return wallet.mercyDays < MAX_MERCY_DAYS;
  return wallet.oil < MAX_OIL;
}

export function buy(wallet: Wallet, item: ShopItem, now: number): Wallet {
  if (!canBuy(wallet, item)) return wallet;
  const pearls = wallet.pearls - PRICES[item];
  if (item === 'mercyDay') return { ...wallet, pearls, mercyDays: wallet.mercyDays + 1 };
  return { ...wallet, pearls, oil: MAX_OIL, oilUpdatedAt: now };
}

// ---------- finishing a lesson ----------

export type LessonOutcome = {
  lessonId: string;
  mistakes: number;
  unitFinished: boolean; // true when this lesson completes its unit for the first time
  isReview?: boolean;
};

export type LessonRewards = {
  noor: number;
  pearls: number;
  streakExtended: boolean;
  streak: number;
  milestone: number | null;
  mercyDaysUsed: number;
  firstTime: boolean;
};

export function completeLesson(
  state: GameState,
  outcome: LessonOutcome,
  now: number,
  today: string,
): { state: GameState; rewards: LessonRewards } {
  const perfect = outcome.mistakes === 0;
  const previous = state.completedLessons[outcome.lessonId];
  const firstTime = !previous && !outcome.isReview;

  let noor = REWARDS.lessonNoor + (perfect ? REWARDS.perfectBonusNoor : 0);
  // Repeating a lesson still counts, at half Noor, so practice is always worth it.
  if (!firstTime) noor = Math.ceil(noor / 2);
  let pearls = REWARDS.lessonPearls + (perfect ? REWARDS.perfectBonusPearls : 0);
  if (outcome.unitFinished) pearls += REWARDS.unitChestPearls;

  const s = recordActivity(state.streak, state.wallet.mercyDays, today);
  if (s.milestone) pearls += STREAK_MILESTONES[s.milestone];

  let wallet = refillOil(state.wallet, now);
  wallet = { ...wallet, pearls: wallet.pearls + pearls, mercyDays: wallet.mercyDays - s.mercyDaysUsed };
  if (outcome.isReview) wallet = reviewRefill(wallet);

  const week = mondayOf(today);
  const weeklyNoor = (week === state.weekStart ? state.weeklyNoor : 0) + noor;

  const completedLessons = { ...state.completedLessons };
  if (!outcome.isReview) {
    completedLessons[outcome.lessonId] = {
      bestMistakes: Math.min(previous?.bestMistakes ?? Infinity, outcome.mistakes),
      completedAt: previous?.completedAt ?? now,
    };
  }

  return {
    state: {
      ...state,
      noor: state.noor + noor,
      weeklyNoor,
      weekStart: week,
      streak: s.streak,
      wallet,
      completedLessons,
      garden: firstTime ? [...state.garden, outcome.lessonId] : state.garden,
    },
    rewards: {
      noor,
      pearls,
      streakExtended: s.extended,
      streak: s.streak.current,
      milestone: s.milestone,
      mercyDaysUsed: s.mercyDaysUsed,
      firstTime,
    },
  };
}

// ---------- levels ----------

/** Level from total Noor: each level needs 50 more Noor than the last. */
export function levelFromNoor(noor: number): { level: number; into: number; needed: number } {
  let level = 1;
  let needed = 100;
  let remaining = noor;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += 50;
  }
  return { level, into: remaining, needed };
}
