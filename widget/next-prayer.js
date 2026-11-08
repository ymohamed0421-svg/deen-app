// DEEN_WIDGET: next prayer widget for the free Scriptable app on iPhone.
// The website build puts the adhan library (MIT licence) above this code and
// publishes it at https://ymohamed0421-svg.github.io/deen-app/widget/next-prayer.js
// The short script people paste into Scriptable (widget/scriptable-loader.js)
// downloads this file and calls deenWidget(config).
// Prayer times are worked out on the phone, the same way the Deen app does.

/* global adhan, ListWidget, Color, Font, LinearGradient, Location, Keychain, DateFormatter, Script, config, args */

const DEEN_URL = 'https://ymohamed0421-svg.github.io/deen-app/prayer';
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LABELS = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const PLACE_KEY = 'deen-widget-place';

async function deenWidget(settings) {
  const method = (settings && settings.method) || 'MuslimWorldLeague';
  const madhab = (settings && settings.madhab) === 'hanafi' ? 'hanafi' : 'shafi';
  const place = await findPlace(settings || {});

  const widget = new ListWidget();
  const gradient = new LinearGradient();
  gradient.colors = [new Color('#2F7D5B'), new Color('#1B4A35')];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  widget.url = DEEN_URL;
  widget.setPadding(14, 14, 14, 14);

  if (!place) {
    addText(widget, 'Deen', 12, true, 0.8);
    widget.addSpacer(6);
    addText(widget, 'Open Scriptable and tap this script once so it can find your location.', 13, false, 1);
    return finish(widget);
  }

  const now = new Date();
  const today = timesFor(place, method, madhab, now);
  let next = PRAYERS.map((p) => ({ name: p, time: today[p] })).find((p) => p.time > now);
  if (!next) {
    const tomorrow = timesFor(place, method, madhab, new Date(now.getTime() + 86400000));
    next = { name: 'fajr', time: tomorrow.fajr };
  }

  const family = config.widgetFamily || 'medium';
  const header = widget.addStack();
  header.centerAlignContent();
  addText(header, 'NEXT PRAYER', 10, true, 0.75);
  header.addSpacer();
  if (place.name && family !== 'small') addText(header, place.name, 10, false, 0.75);

  widget.addSpacer(4);
  addText(widget, LABELS[next.name], family === 'small' ? 28 : 30, true, 1);
  addText(widget, formatTime(next.time), 15, false, 0.9);
  widget.addSpacer(2);

  const countdown = widget.addStack();
  countdown.centerAlignContent();
  addText(countdown, 'in ', 15, true, 1, '#F3C668');
  const timer = countdown.addDate(next.time);
  timer.applyTimerStyle();
  timer.font = Font.boldSystemFont(15);
  timer.textColor = new Color('#F3C668');

  if (family !== 'small') {
    widget.addSpacer();
    const row = widget.addStack();
    for (let i = 0; i < PRAYERS.length; i++) {
      const p = PRAYERS[i];
      const isNext = p === next.name && today[p].getTime() === next.time.getTime();
      const cell = row.addStack();
      cell.layoutVertically();
      addText(cell, LABELS[p], 10, true, isNext ? 1 : 0.7, isNext ? '#F3C668' : null);
      addText(cell, formatTime(today[p]), 11, isNext, isNext ? 1 : 0.85, isNext ? '#F3C668' : null);
      if (i < PRAYERS.length - 1) row.addSpacer();
    }
  } else if (place.name) {
    widget.addSpacer();
    addText(widget, place.name, 10, false, 0.7);
  }

  // Ask iPhone to redraw just after this prayer starts, so it moves on to the next one.
  widget.refreshAfterDate = new Date(next.time.getTime() + 60000);
  return finish(widget);
}

function finish(widget) {
  if (config.runsInWidget) Script.setWidget(widget);
  else return widget.presentMedium();
  Script.complete();
}

function timesFor(place, method, madhab, date) {
  const make = adhan.CalculationMethod[method] || adhan.CalculationMethod.MuslimWorldLeague;
  const params = make();
  params.madhab = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  return new adhan.PrayerTimes(new adhan.Coordinates(place.latitude, place.longitude), date, params);
}

async function findPlace(settings) {
  // A place typed into the script wins. Otherwise use the phone's location and remember it.
  if (typeof settings.latitude === 'number' && typeof settings.longitude === 'number') {
    return { latitude: settings.latitude, longitude: settings.longitude, name: settings.placeName || '' };
  }
  let saved = null;
  try {
    if (Keychain.contains(PLACE_KEY)) saved = JSON.parse(Keychain.get(PLACE_KEY));
  } catch (e) {}
  try {
    Location.setAccuracyToThreeKilometers();
    const here = await Location.current();
    let name = '';
    try {
      const found = await Location.reverseGeocode(here.latitude, here.longitude);
      name = (found && found[0] && (found[0].locality || found[0].subAdministrativeArea)) || '';
    } catch (e) {}
    const place = { latitude: here.latitude, longitude: here.longitude, name: name || (saved && saved.name) || '' };
    Keychain.set(PLACE_KEY, JSON.stringify(place));
    return place;
  } catch (e) {
    return saved;
  }
}

function addText(parent, text, size, bold, opacity, hex) {
  const t = parent.addText(text);
  t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = new Color(hex || '#FFFFFF', opacity);
  t.lineLimit = 2;
  return t;
}

function formatTime(date) {
  const f = new DateFormatter();
  f.useNoDateStyle();
  f.useShortTimeStyle();
  return f.string(date);
}
