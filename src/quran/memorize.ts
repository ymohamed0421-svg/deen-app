// Memorization practice: hide an ayah, recite it from memory, reveal it and say how it went.
// Each ayah sits in a box. Getting it right moves it up a box and it comes back later;
// missing it sends it back to box 0 so it comes back today. Ayahs you keep missing are "weak".

/** Days to wait before an ayah comes back, by box. */
export const INTERVALS = [0, 1, 3, 7, 14, 30];

export type Grade = 'got' | 'hint' | 'missed';

export type Card = {
  box: number;
  /** Date key (YYYY-MM-DD) when the ayah is next due. */
  due: string;
  misses: number;
  seen: number;
  last: string;
};

/** Keyed by "surah:index", with index 0 based. */
export type MemorizeStore = Record<string, Card>;

export const ayahKey = (surah: number, index: number) => `${surah}:${index}`;

export function parseKey(key: string) {
  const [s, i] = key.split(':').map(Number);
  return { surah: s, index: i };
}

export function addDays(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * got: recited it with no help, so it moves up a box.
 * hint: needed a hint, so it stays where it is (at least box 1) and comes back tomorrow at the latest.
 * missed: back to box 0, due today.
 */
export function grade(card: Card | undefined, result: Grade, today: string): Card {
  const box = card?.box ?? 0;
  const next = result === 'got' ? Math.min(box + 1, INTERVALS.length - 1) : result === 'hint' ? Math.max(1, Math.min(box, 1)) : 0;
  return {
    box: next,
    due: addDays(today, INTERVALS[next]),
    misses: (card?.misses ?? 0) + (result === 'missed' ? 1 : 0),
    seen: (card?.seen ?? 0) + 1,
    last: today,
  };
}

/** Missed at least once and not yet solid. */
export function isWeak(card: Card | undefined) {
  return Boolean(card && card.misses > 0 && card.box <= 1);
}

/** Ayahs that are due today or earlier, weakest and most overdue first. */
export function dueKeys(store: MemorizeStore, today: string) {
  return Object.entries(store)
    .filter(([, c]) => c.due <= today)
    .sort(([ka, a], [kb, b]) => a.box - b.box || a.due.localeCompare(b.due) || compareKeys(ka, kb))
    .map(([k]) => k);
}

export function weakKeys(store: MemorizeStore) {
  return Object.entries(store)
    .filter(([, c]) => isWeak(c))
    .map(([k]) => k)
    .sort(compareKeys);
}

function compareKeys(a: string, b: string) {
  const x = parseKey(a);
  const y = parseKey(b);
  return x.surah - y.surah || x.index - y.index;
}

export type SurahProgress = { surah: number; practised: number; solid: number; weak: number; due: number };

/** One row per surah you have practised, in mushaf order. */
export function surahProgress(store: MemorizeStore, today: string): SurahProgress[] {
  const by = new Map<number, SurahProgress>();
  for (const [key, card] of Object.entries(store)) {
    const { surah } = parseKey(key);
    const row = by.get(surah) ?? { surah, practised: 0, solid: 0, weak: 0, due: 0 };
    row.practised += 1;
    if (card.box >= 3) row.solid += 1;
    if (isWeak(card)) row.weak += 1;
    if (card.due <= today) row.due += 1;
    by.set(surah, row);
  }
  return [...by.values()].sort((a, b) => a.surah - b.surah);
}

/** Splits an ayah into words for the hidden view and word-by-word hints. */
export function words(arabic: string) {
  return arabic.split(/\s+/).filter(Boolean);
}
