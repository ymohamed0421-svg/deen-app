/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildQuery, isMasjid, mergeMasjids, formatDistance, mapLinks, parseOverpass, type OsmElement } from './masjids.ts';

test('builds an Overpass query for mosques around a point', () => {
  const q = buildQuery(38.7849, -77.1872, 10000);
  assert.match(q, /\["amenity"="place_of_worship"\]\(around:10000,38\.78490,-77\.18720\)/);
  assert.match(q, /out center tags/);
  assert.match(q, /\["building"="mosque"\]/);
  assert.match(q, /\["amenity"="community_centre"\]/);
  assert.match(buildQuery(1, 2, 40000, false), /\["religion"="muslim"\]/);
});

test('picks masjids out of all places of worship', () => {
  assert.ok(isMasjid({ name: 'PEACE Islamic Center' }));
  assert.ok(isMasjid({ name: 'Dar Al-Hijrah', religion: 'muslim' }));
  assert.ok(isMasjid({ name: 'Anything', building: 'mosque' }));
  assert.ok(!isMasjid({ name: 'St. Mary Church', religion: 'christian' }));
  assert.ok(!isMasjid({ name: 'Burke Community Center' }));
  assert.ok(!isMasjid({ name: 'Temple Rodef Shalom', building: 'mosque' }));
  assert.ok(isMasjid({ name: 'Temple Hills Mosque' }));
});

test('parses, sorts nearest first, drops unnamed and duplicate entries', () => {
  const json: { elements: OsmElement[] } = {
    elements: [
      { type: 'way', id: 1, center: { lat: 38.8, lon: -77.2 }, tags: { name: 'Far Masjid', website: 'far.org' } },
      { type: 'node', id: 2, lat: 38.785, lon: -77.188, tags: { name: 'Near Masjid', 'addr:housenumber': '1', 'addr:street': 'Main St', 'addr:city': 'Springfield' } },
      { type: 'way', id: 3, center: { lat: 38.7851, lon: -77.1881 }, tags: { name: 'Near Masjid' } },
      { type: 'node', id: 4, lat: 38.79, lon: -77.19, tags: {} },
    ],
  };
  const list = parseOverpass(json, 38.7849, -77.1872);
  assert.deepEqual(list.map((m) => m.name), ['Near Masjid', 'Far Masjid']);
  assert.equal(list[0].address, '1 Main St, Springfield');
  assert.equal(list[1].website, 'https://far.org');
  assert.ok(list[0].km < list[1].km);
});

test('map links and distances', () => {
  const l = mapLinks({ name: 'Dar Al-Hijrah', latitude: 38.86, longitude: -77.14 });
  assert.equal(l.google, 'https://www.google.com/maps/search/?api=1&query=38.86,-77.14');
  assert.match(l.apple, /^https:\/\/maps\.apple\.com\/\?q=Dar%20Al-Hijrah&ll=38\.86,-77\.14$/);
  assert.equal(formatDistance(1.609344, 'en-US'), '1.0 mi');
  assert.equal(formatDistance(12.4, 'en-CA'), '12 km');
});

test('merging adds only masjids the first list lacks', () => {
  const base = { address: null, website: null, phone: null, serviceTimes: null };
  const a = [{ ...base, id: 'tt/1', name: 'PEACE Islamic Center', latitude: 38.79, longitude: -77.27, km: 1 }];
  const b = [
    { ...base, id: 'node/1', name: 'Peace Center', latitude: 38.7905, longitude: -77.2705, km: 1.05 },
    { ...base, id: 'node/2', name: 'Masjid Al-Noor', latitude: 38.8, longitude: -77.2, km: 0.5 },
  ];
  assert.deepEqual(mergeMasjids(a, b).map((m) => m.id), ['node/2', 'tt/1']);
});
