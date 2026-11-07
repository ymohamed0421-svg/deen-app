/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ayahAt, parseAudioFile } from './fullSurah.ts';

const file = {
  audio_url: 'https://example.com/1.mp3',
  verse_timings: [
    { verse_key: '1:2', timestamp_from: 6090, timestamp_to: 11000 },
    { verse_key: '1:1', timestamp_from: 0, timestamp_to: 6090 },
    { verse_key: '1:3', timestamp_from: 11000, timestamp_to: 15000 },
  ],
};

test('parses timings in ayah order and in seconds', () => {
  const a = parseAudioFile(file);
  assert.equal(a.url, 'https://example.com/1.mp3');
  assert.deepEqual(a.timings, [
    { from: 0, to: 6.09 },
    { from: 6.09, to: 11 },
    { from: 11, to: 15 },
  ]);
});

test('finds the ayah being recited', () => {
  const { timings } = parseAudioFile(file);
  assert.equal(ayahAt(timings, 0), 0);
  assert.equal(ayahAt(timings, 6.5), 1);
  assert.equal(ayahAt(timings, 14.9), 2);
  assert.equal(ayahAt(timings, 99), 2);
});

test('rejects a file without timings', () => {
  assert.throws(() => parseAudioFile({ audio_url: 'x', verse_timings: [] }));
});
