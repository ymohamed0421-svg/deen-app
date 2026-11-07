/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_OIL,
  OIL_REFILL_MS,
  buy,
  completeLesson,
  effectiveStreak,
  levelFromNoor,
  mondayOf,
  newGameState,
  recordActivity,
  refillOil,
  spendOil,
} from './rules.ts';

test('streak grows on consecutive days and ignores repeats on the same day', () => {
  let s = recordActivity({ current: 0, longest: 0, lastActiveDate: null }, 0, '2026-11-01').streak;
  assert.equal(s.current, 1);
  s = recordActivity(s, 0, '2026-11-01').streak;
  assert.equal(s.current, 1);
  s = recordActivity(s, 0, '2026-11-02').streak;
  assert.equal(s.current, 2);
});

test('a missed day resets the streak without a Mercy Day', () => {
  const s = { current: 5, longest: 5, lastActiveDate: '2026-11-01' };
  const r = recordActivity(s, 0, '2026-11-03');
  assert.equal(r.streak.current, 1);
  assert.equal(r.streak.longest, 5);
  assert.equal(effectiveStreak(s, 0, '2026-11-03'), 0);
});

test('a Mercy Day covers a missed day and is used up', () => {
  const s = { current: 5, longest: 5, lastActiveDate: '2026-11-01' };
  assert.equal(effectiveStreak(s, 1, '2026-11-03'), 5);
  const r = recordActivity(s, 1, '2026-11-03');
  assert.equal(r.streak.current, 6);
  assert.equal(r.mercyDaysUsed, 1);
  // Two missed days need two Mercy Days.
  assert.equal(recordActivity(s, 1, '2026-11-04').streak.current, 1);
  assert.equal(recordActivity(s, 2, '2026-11-04').streak.current, 6);
});

test('streak milestones are reported', () => {
  const r = recordActivity({ current: 6, longest: 6, lastActiveDate: '2026-11-01' }, 0, '2026-11-02');
  assert.equal(r.milestone, 7);
});

test('oil refills over time and foundation lessons never cost oil', () => {
  const now = 1_000_000;
  let w = { oil: MAX_OIL, oilUpdatedAt: now, pearls: 0, mercyDays: 0 };
  w = spendOil(w, now, false);
  w = spendOil(w, now, false);
  assert.equal(w.oil, 3);
  assert.equal(spendOil(w, now, true).oil, 3);
  assert.equal(refillOil(w, now + OIL_REFILL_MS).oil, 4);
  assert.equal(refillOil(w, now + 10 * OIL_REFILL_MS).oil, MAX_OIL);
});

test('shop enforces prices and limits', () => {
  const w = { oil: 2, oilUpdatedAt: 0, pearls: 450, mercyDays: 0 };
  const a = buy(w, 'mercyDay', 0);
  assert.equal(a.mercyDays, 1);
  assert.equal(a.pearls, 250);
  const b = buy(buy(a, 'mercyDay', 0), 'mercyDay', 0);
  assert.equal(b.mercyDays, 2); // capped at 2
  assert.equal(buy(w, 'oilRefill', 0).oil, MAX_OIL);
});

test('completing a lesson awards Noor, Pearls, a plant and a streak day', () => {
  const s0 = newGameState(0, '2026-11-02');
  const { state, rewards } = completeLesson(
    s0,
    { lessonId: 'pillars-1', mistakes: 0, unitFinished: false },
    0,
    '2026-11-02',
  );
  assert.equal(rewards.noor, 15);
  assert.equal(rewards.pearls, 10);
  assert.equal(state.streak.current, 1);
  assert.deepEqual(state.garden, ['pillars-1']);
  // Repeating gives half Noor and no new plant.
  const again = completeLesson(state, { lessonId: 'pillars-1', mistakes: 2, unitFinished: false }, 0, '2026-11-02');
  assert.equal(again.rewards.noor, 5);
  assert.equal(again.state.garden.length, 1);
  assert.equal(again.state.completedLessons['pillars-1'].bestMistakes, 0);
});

test('weekly Noor resets on a new week', () => {
  assert.equal(mondayOf('2026-11-08'), '2026-11-02'); // Sunday belongs to the week of Monday the 2nd
  const s0 = { ...newGameState(0, '2026-11-02'), weeklyNoor: 80 };
  const { state } = completeLesson(s0, { lessonId: 'x', mistakes: 0, unitFinished: false }, 0, '2026-11-09');
  assert.equal(state.weeklyNoor, 15);
});

test('levels need more Noor each time', () => {
  assert.deepEqual(levelFromNoor(0), { level: 1, into: 0, needed: 100 });
  assert.deepEqual(levelFromNoor(260), { level: 3, into: 10, needed: 200 });
});
