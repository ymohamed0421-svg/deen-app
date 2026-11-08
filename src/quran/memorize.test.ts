import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, dueKeys, grade, isWeak, surahProgress, weakKeys, words, type MemorizeStore } from './memorize.ts';

const today = '2026-11-08';

test('addDays crosses months', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays(today, 0), today);
});

test('getting an ayah right moves it up and pushes it later', () => {
  const a = grade(undefined, 'got', today);
  assert.equal(a.box, 1);
  assert.equal(a.due, '2026-11-09');
  const b = grade(a, 'got', '2026-11-09');
  assert.equal(b.box, 2);
  assert.equal(b.due, '2026-11-12');
});

test('missing an ayah sends it back to today and marks it weak', () => {
  const solid = { box: 4, due: today, misses: 0, seen: 5, last: today };
  const missed = grade(solid, 'missed', today);
  assert.equal(missed.box, 0);
  assert.equal(missed.due, today);
  assert.equal(missed.misses, 1);
  assert.ok(isWeak(missed));
});

test('needing a hint keeps it close', () => {
  assert.equal(grade(undefined, 'hint', today).box, 1);
  assert.equal(grade({ box: 4, due: today, misses: 0, seen: 5, last: today }, 'hint', today).box, 1);
});

test('due and weak lists', () => {
  const store: MemorizeStore = {
    '112:1': { box: 2, due: '2026-11-01', misses: 0, seen: 3, last: '2026-10-29' },
    '1:3': { box: 0, due: today, misses: 2, seen: 4, last: today },
    '1:0': { box: 3, due: '2026-11-20', misses: 1, seen: 6, last: today },
  };
  assert.deepEqual(dueKeys(store, today), ['1:3', '112:1']);
  assert.deepEqual(weakKeys(store), ['1:3']);
  const rows = surahProgress(store, today);
  assert.deepEqual(rows.map((r) => [r.surah, r.practised, r.solid, r.weak, r.due]), [
    [1, 2, 1, 1, 1],
    [112, 1, 0, 0, 1],
  ]);
});

test('words splits on spaces', () => {
  assert.deepEqual(words('قُلْ هُوَ  ٱللَّهُ أَحَدٌ'), ['قُلْ', 'هُوَ', 'ٱللَّهُ', 'أَحَدٌ']);
});
