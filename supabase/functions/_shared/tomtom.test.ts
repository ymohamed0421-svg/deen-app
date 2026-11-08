/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { areaKey, parseTomTom } from './tomtom.ts';

test('keeps mosques and Islamic centers, drops churches and duplicates', () => {
  const list = parseTomTom({
    results: [
      { id: 'A1', poi: { name: 'PEACE Islamic Center', url: 'peacecenter.org', phone: '+1 703 555 0100' }, address: { freeformAddress: 'Burke, VA' }, position: { lat: 38.79, lon: -77.27 } },
      { id: 'B2', poi: { name: 'Hawa Center', categorySet: [{ id: 7339002 }] }, position: { lat: 38.8, lon: -77.3 } },
      { id: 'C3', poi: { name: 'St. Mary Catholic Church', categorySet: [{ id: 7339003 }] }, position: { lat: 38.8, lon: -77.3 } },
      { id: 'D4', poi: { name: 'Community Hall' }, position: { lat: 38.8, lon: -77.3 } },
      { id: 'A1', poi: { name: 'PEACE Islamic Center' }, position: { lat: 38.79, lon: -77.27 } },
      { id: 'E/5=', poi: { name: 'Masjid Ash-Shura', categories: ['mosque'] }, position: { lat: 38.7, lon: -77.2 } },
    ],
  });
  assert.deepEqual(list.map((m) => m.name), ['PEACE Islamic Center', 'Hawa Center', 'Masjid Ash-Shura']);
  assert.equal(list[0].website, 'https://peacecenter.org');
  assert.equal(list[0].id, 'tt/A1');
  assert.equal(list[2].id, 'tt/E-5-');
});

test('area key rounds to about a kilometre', () => {
  assert.equal(areaKey(38.79321, -77.27174), '38.79,-77.27');
});
