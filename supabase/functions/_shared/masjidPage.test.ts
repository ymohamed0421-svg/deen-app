/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findScheduleUrls, isSafeUrl, mentionsPrayerTimes, normalizeTimes, pageText } from './masjidPage.ts';

test('only public web addresses are fetched', () => {
  assert.ok(isSafeUrl('https://example-masjid.org/prayer'));
  assert.equal(isSafeUrl('http://localhost/x'), null);
  assert.equal(isSafeUrl('http://169.254.169.254/latest'), null);
  assert.equal(isSafeUrl('https://example.org:8443/'), null);
  assert.equal(isSafeUrl('file:///etc/passwd'), null);
  assert.equal(isSafeUrl('not a url'), null);
});

test('finds embedded widgets, the Masjidal API, and schedule links on the same site', () => {
  const html = `
    <iframe src="https://masjidal.com/widget/simple/v3?masjid_id=AbC123"></iframe>
    <a href="/about">About</a>
    <a href="/prayer-times">Prayer Times</a>
    <a href="https://other.org/prayer">Elsewhere</a>`;
  const urls = findScheduleUrls(html, new URL('https://www.mymasjid.org/'));
  assert.deepEqual(urls, [
    'https://masjidal.com/widget/simple/v3?masjid_id=AbC123',
    'https://masjidal.com/api/v1/time/range?masjid_id=AbC123',
    'https://www.mymasjid.org/prayer-times',
  ]);
});

test('page text keeps table cells and prayer data in scripts, drops other scripts', () => {
  const html = `<style>.a{}</style><script>track()</script><script>var t={fajr:"6:00",isha:"7:30"}</script>
    <table><tr><td>Fajr</td><td>6:00 AM</td></tr><tr><td>Isha</td><td>7:30 PM</td></tr></table>`;
  const text = pageText(html);
  assert.ok(!text.includes('track()'));
  assert.ok(text.includes('fajr:"6:00"'));
  assert.match(text, /Fajr \| 6:00 AM/);
  assert.ok(mentionsPrayerTimes(text));
  assert.ok(!mentionsPrayerTimes('Welcome to our community. Donate today.'));
});

test('normalizes model output and rejects junk', () => {
  const ok = normalizeTimes(
    { found: true, iqamah: { fajr: '6:15 AM', maghrib: '5 min after sunset', isha: 'x'.repeat(80) }, jumuah: ['1:15 PM', 7, '2:30 PM'] },
    'https://m.org',
  );
  assert.equal(ok.found, true);
  assert.equal(ok.iqamah.fajr, '6:15 AM');
  assert.equal(ok.iqamah.isha, null);
  assert.deepEqual(ok.jumuah, ['1:15 PM', '2:30 PM']);
  assert.equal(normalizeTimes({ found: true, iqamah: {} }, null).found, false);
  assert.equal(normalizeTimes('garbage', null).found, false);
});
