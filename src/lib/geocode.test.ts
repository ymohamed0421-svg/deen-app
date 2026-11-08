/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseQuery, placeLabel, searchPlaces, soundex } from './geocode.ts';

const town = (name: string, admin1: string, latitude: number, longitude: number, population?: number) => ({
  name, admin1, country: 'United States', country_code: 'US', latitude, longitude, population, feature_code: 'PPL',
});

// Canned Open-Meteo answers, keyed by "name|countryCode" (the real API ignores case).
const fixtures: Record<string, ReturnType<typeof town>[]> = {
  'bur|US': [town('Burke', 'Virginia', 38.793, -77.272, 41055), town('Burts', 'Virginia', 37.148, -76.462)],
  'ber|US': [town('Berea', 'Kentucky', 37.57, -84.3)],
  'springfield|US': [town('Springfield', 'Missouri', 37.2, -93.3, 169000), town('Springfield', 'Virginia', 38.789, -77.187, 30484)],
  'springfield|': [town('Springfield', 'Missouri', 37.2, -93.3, 169000), town('Springfield', 'Virginia', 38.789, -77.187, 30484)],
  'fort|US': [town('Fort Lewis', 'Washington', 47.08, -122.58)],
  'fort washington|': [town('Fort Washington', 'Maryland', 38.707, -77.023, 24000)],
};
globalThis.fetch = (async (url: string) => {
  const u = new URL(url);
  const key = `${(u.searchParams.get('name') ?? '').toLowerCase()}|${u.searchParams.get('countryCode') ?? ''}`;
  return { ok: true, json: async () => ({ results: fixtures[key] ?? [] }) };
}) as unknown as typeof fetch;

test('splits a town from its state, with or without a comma', () => {
  assert.deepEqual(parseQuery('Burke, Virginia'), { name: 'Burke', qualifier: 'Virginia', stateCode: 'VA' });
  assert.deepEqual(parseQuery('springfield va'), { name: 'springfield', qualifier: 'va', stateCode: 'VA' });
  assert.equal(parseQuery('Cairo').qualifier, null);
});

test('labels US towns with the state code', () => {
  assert.equal(placeLabel({ name: 'Burke', region: 'Virginia', country: 'United States', countryCode: 'US' }), 'Burke, VA');
  assert.equal(placeLabel({ name: 'Cairo', region: 'Cairo', country: 'Egypt', countryCode: 'EG' }), 'Cairo, Egypt');
});

test('Berg and Burke sound alike', () => {
  assert.equal(soundex('Berg'), soundex('Burke'));
});

test('"Berg, Virginia" suggests Burke, VA', async () => {
  const r = await searchPlaces('Berg, Virginia');
  assert.equal(r.didYouMean, true);
  assert.equal(placeLabel(r.places[0]), 'Burke, VA');
});

test('a state narrows Springfield to Virginia', async () => {
  const r = await searchPlaces('Springfield, VA');
  assert.deepEqual(r.places.map((p) => p.region), ['Virginia']);
});

test('places near the user come first', async () => {
  const r = await searchPlaces('Springfield', { latitude: 38.8, longitude: -77.3 });
  assert.equal(r.places[0].region, 'Virginia');
});

test('a town whose name ends in a state name is still found', async () => {
  const r = await searchPlaces('Fort Washington');
  assert.equal(r.places[0].name, 'Fort Washington');
});
