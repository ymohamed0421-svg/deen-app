/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newGameState } from '../../supabase/functions/_shared/rules.ts';
import { awardWorship, dayCounts, lastDays, markFor, nextFastMark, prayerDayKey, prayerReward, weekSummary, type DayTimes } from './worship.ts';

const at = (h: number, m = 0) => new Date(2026, 10, 8, h, m);
const today: DayTimes = { fajr: at(5, 30), sunrise: at(6, 50), dhuhr: at(11, 55), asr: at(14, 40), maghrib: at(17, 0), isha: at(18, 20) };
const tomorrow: DayTimes = { ...today, fajr: new Date(2026, 10, 9, 5, 31) };

test('before Fajr the prayer day is still yesterday', () => {
  assert.equal(prayerDayKey(new Date(2026, 10, 8, 1, 0), today.fajr), '2026-11-07');
  assert.equal(prayerDayKey(new Date(2026, 10, 8, 6, 0), today.fajr), '2026-11-08');
  assert.equal(prayerDayKey(new Date(2026, 10, 8, 1, 0), null), '2026-11-08');
});

test('marks a prayer on time while its time is in, late after', () => {
  assert.equal(markFor('dhuhr', at(11, 0), today, tomorrow), null);
  assert.equal(markFor('dhuhr', at(12, 30), today, tomorrow), 'onTime');
  assert.equal(markFor('dhuhr', at(15, 0), today, tomorrow), 'late');
  assert.equal(markFor('fajr', at(7, 0), today, tomorrow), 'late');
  assert.equal(markFor('isha', new Date(2026, 10, 9, 2, 0), today, tomorrow), 'onTime');
});

test('rewards each prayer once and adds a bonus for all five on time', () => {
  const day = { fajr: 'onTime', dhuhr: 'onTime', asr: 'onTime', maghrib: 'onTime' } as const;
  const r1 = prayerReward(day, [], 'fajr');
  assert.equal(r1.noor, 3);
  assert.equal(prayerReward(day, r1.rewarded, 'fajr').noor, 0);
  const full = { ...day, isha: 'onTime' } as const;
  assert.equal(prayerReward(full, ['fajr', 'dhuhr', 'asr', 'maghrib'], 'isha').noor, 13);
  assert.deepEqual(dayCounts({ fajr: 'late', dhuhr: 'onTime' }), { prayed: 2, onTime: 1 });
});

test('summarises the last seven days', () => {
  assert.deepEqual(lastDays('2026-11-08', 3), ['2026-11-06', '2026-11-07', '2026-11-08']);
  const w = weekSummary({ '2026-11-08': { fajr: 'onTime', isha: 'late' }, '2026-11-01': { fajr: 'onTime' } }, '2026-11-08');
  assert.equal(w.days.length, 7);
  assert.equal(w.prayed, 2);
  assert.equal(w.onTime, 1);
});

test('worship Noor adds to the game and on-time prayer keeps the streak', () => {
  const s = newGameState(0, '2026-11-07');
  s.streak = { current: 6, longest: 6, lastActiveDate: '2026-11-07' };
  const a = awardWorship(s, 3, '2026-11-08', true);
  assert.equal(a.state.noor, 3);
  assert.equal(a.state.weeklyNoor, 3);
  assert.equal(a.streak, 7);
  assert.equal(a.milestone, 7);
  assert.equal(a.state.wallet.pearls, 50);
  const b = awardWorship(a.state, 10, '2026-11-08', false);
  assert.equal(b.state.noor, 13);
  assert.equal(b.streakExtended, false);
});

test('fasting tracker cycles fasted, missed, blank', () => {
  assert.equal(nextFastMark(undefined), 'fasted');
  assert.equal(nextFastMark('fasted'), 'missed');
  assert.equal(nextFastMark('missed'), undefined);
});
