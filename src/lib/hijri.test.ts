/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HIJRI_SOURCE, hijriOf, isForbiddenFast, nextHijriDate, ramadanDay, sunnahFast, tabularHijri, upcomingEvents } from './hijri.ts';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);

test('reads Umm al-Qura dates in Node', () => {
  assert.equal(HIJRI_SOURCE, 'Umm al-Qura');
  assert.deepEqual(hijriOf(d(2026, 11, 8)), { year: 1448, month: 5, day: 28 });
  assert.deepEqual(hijriOf(d(2026, 2, 18)), { year: 1447, month: 9, day: 1 });
  assert.deepEqual(hijriOf(d(2026, 11, 8), 1), { year: 1448, month: 5, day: 29 });
});

test('the arithmetic fallback stays within two days of Umm al-Qura', () => {
  for (let i = 0; i < 3000; i += 7) {
    const day = d(2024, 1, 1 + i);
    const a = tabularHijri(day);
    const b = hijriOf(day);
    const toDays = (h: { year: number; month: number; day: number }) => h.year * 354.367 + (h.month - 1) * 29.53 + h.day;
    assert.ok(Math.abs(toDays(a) - toDays(b)) <= 2.5, `${day.toDateString()}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
});

test('finds the next Ramadan and Eid', () => {
  const ramadan = nextHijriDate(d(2026, 11, 8), 9, 1)!;
  assert.equal(ramadan.toDateString(), d(2027, 2, 8).toDateString());
  const events = upcomingEvents(d(2026, 11, 8));
  assert.equal(events[0].id, 'ramadan');
  assert.equal(events[0].inDays, 92);
  assert.ok(events.every((e, i) => i === 0 || e.inDays >= events[i - 1].inDays));
  assert.equal(ramadanDay(d(2026, 11, 8), 1)!.toDateString(), d(2027, 2, 8).toDateString());
  // During Ramadan, day numbers count from the current Ramadan.
  assert.equal(ramadanDay(d(2026, 2, 20), 1)!.toDateString(), d(2026, 2, 18).toDateString());
});

test('picks out sunnah fasts and skips forbidden days and Ramadan', () => {
  assert.equal(sunnahFast(d(2026, 11, 9))?.reason, 'Monday');
  assert.equal(sunnahFast(d(2026, 11, 12))?.reason, 'Thursday');
  assert.equal(sunnahFast(d(2026, 11, 10)), null); // Tuesday, 30 Jumada al-Ula
  assert.match(sunnahFast(d(2026, 11, 24))!.reason, /White Days/); // 14 Jumada al-Akhirah
  assert.equal(sunnahFast(d(2026, 2, 19)), null); // Thursday in Ramadan
  assert.equal(sunnahFast(d(2026, 5, 26))?.reason, 'the Day of Arafah');
  assert.equal(sunnahFast(d(2026, 5, 27)), null); // Eid al-Adha
  assert.ok(isForbiddenFast({ year: 1447, month: 12, day: 13 }));
});
