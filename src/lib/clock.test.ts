/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { iqamahReminders, parseClock, parsePrayerClock, prayerSlot, sortByJumuah } from './clock.ts';

const day = new Date(2026, 10, 7);
const hm = (d: Date | null) => (d ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : null);

test('reads common timetable formats', () => {
  assert.equal(hm(parseClock('6:15 AM', day)), '6:15');
  assert.equal(hm(parseClock('1:30pm', day)), '13:30');
  assert.equal(hm(parseClock('12:05 PM', day)), '12:05');
  assert.equal(hm(parseClock('12:05 a.m.', day)), '0:05');
  assert.equal(hm(parseClock('19:45', day)), '19:45');
  assert.equal(parseClock('5 min after sunset', day), null);
});

test('guesses PM for later prayers written without AM/PM', () => {
  assert.equal(hm(parsePrayerClock('isha', '7:45', day)), '19:45');
  assert.equal(hm(parsePrayerClock('dhuhr', '1:30', day)), '13:30');
  assert.equal(hm(parsePrayerClock('dhuhr', '12:30', day)), '12:30');
  assert.equal(hm(parsePrayerClock('fajr', '6:00', day)), '6:00');
  assert.equal(hm(parsePrayerClock('jumuah', '1:15', day)), '13:15');
});

test('iqamah reminders come before each clock time, and Jumu\'ah replaces Dhuhr on Fridays', () => {
  const times = { iqamah: { fajr: '6:15 AM', dhuhr: '1:30', asr: null, maghrib: '5 min after sunset', isha: '7:45' }, jumuah: ['1:15 PM', '2:15 PM'] };
  const thursday = new Date(2026, 10, 12);
  const r = iqamahReminders(times, thursday, 10, 'PEACE');
  assert.deepEqual(r.map((x) => [x.at.getHours(), x.at.getMinutes()]), [[6, 5], [13, 20], [19, 35]]);
  const friday = iqamahReminders(times, new Date(2026, 10, 13), 15, 'PEACE');
  assert.deepEqual(friday.map((x) => x.title), ['Fajr iqamah in 15 min', 'Isha iqamah in 15 min', "Jumu'ah in 15 min 🕌"]);
  assert.equal(friday[2].at.getHours(), 13);
  assert.equal(friday[2].at.getMinutes(), 0);
});

test('prayer slot is the last prayer that started, and Jumu\'ah sorts earliest first', () => {
  const d = (h: number, m = 0) => new Date(2026, 10, 13, h, m);
  const times = { fajr: d(5, 40), dhuhr: d(12, 5), asr: d(14, 50), maghrib: d(17, 2), isha: d(18, 25) };
  assert.equal(prayerSlot(times, d(4)), 'isha');
  assert.equal(prayerSlot(times, d(13)), 'dhuhr');
  assert.equal(prayerSlot(times, d(20)), 'isha');
  const rows = [{ n: 'a', jumuah: ['2:15 PM'] }, { n: 'b', jumuah: [] }, { n: 'c', jumuah: ['1:30', '12:45 PM'] }];
  assert.deepEqual(sortByJumuah(rows, d(9)).map((r) => r.n), ['c', 'a', 'b']);
});
