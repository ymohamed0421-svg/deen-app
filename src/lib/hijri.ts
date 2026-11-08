// The Hijri (Islamic) calendar: today's date, upcoming events and sunnah fasts.
//
// Dates come from the Umm al-Qura calendar when the phone supports it, and from the
// standard arithmetic (tabular) Islamic calendar otherwise. Both are calculations: the
// real start of a month depends on moon sighting, so people can shift the date by up
// to two days to match their local masjid. Pure functions only, so tests run in Node.

export type HijriDate = { year: number; month: number; day: number };

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi‘ al-Awwal',
  'Rabi‘ al-Akhir',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  'Sha‘ban',
  'Ramadan',
  'Shawwal',
  'Dhul Qa‘dah',
  'Dhul Hijjah',
] as const;

export const HIJRI_MONTHS_AR = [
  'مُحَرَّم',
  'صَفَر',
  'رَبِيع الأَوَّل',
  'رَبِيع الآخِر',
  'جُمَادَى الأُولَى',
  'جُمَادَى الآخِرَة',
  'رَجَب',
  'شَعْبَان',
  'رَمَضَان',
  'شَوَّال',
  'ذُو القَعْدَة',
  'ذُو الحِجَّة',
] as const;

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a local calendar date (the time of day is ignored). */
function epochDay(d: Date) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** The arithmetic Islamic calendar (civil epoch, 16 July 622). Can differ from moon sighting by a day or two. */
export function tabularHijri(d: Date): HijriDate {
  const jd = epochDay(d) + 2440588; // Julian Day Number
  const days = jd - 1948440 + 10632;
  const n = Math.floor((days - 1) / 10631);
  let l = days - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

function readParts(f: Intl.DateTimeFormat, d: Date): HijriDate {
  const parts = f.formatToParts(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '', 10);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** The phone's Umm al-Qura calendar, if it has one that gives the right answer for a known date. */
const UMM_AL_QURA: Intl.DateTimeFormat | null = (() => {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
    // 8 November 2026 is 28 Jumada al-Ula 1448 in Umm al-Qura.
    const check = readParts(f, new Date(2026, 10, 8));
    return check.year === 1448 && check.month === 5 && check.day === 28 ? f : null;
  } catch {
    return null;
  }
})();

export const HIJRI_SOURCE: 'Umm al-Qura' | 'arithmetic' = UMM_AL_QURA ? 'Umm al-Qura' : 'arithmetic';

/** Hijri date for a local calendar day. `adjust` shifts it by whole days to match local moon sighting. */
export function hijriOf(d: Date, adjust = 0): HijriDate {
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + adjust, 12);
  if (UMM_AL_QURA) {
    try {
      const h = readParts(UMM_AL_QURA, shifted);
      if (h.year > 0 && h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 30) return h;
    } catch {
      // fall through to the arithmetic calendar
    }
  }
  return tabularHijri(shifted);
}

export function formatHijri(h: HijriDate) {
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`;
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
}

/** Whole calendar days from `from` to `to`. */
export function daysUntil(from: Date, to: Date) {
  return epochDay(to) - epochDay(from);
}

export function inDaysText(n: number) {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  return `in ${n} days`;
}

/** The first day from `from` (inclusive) whose Hijri date matches, within about 13 months. */
export function nextHijriDate(from: Date, month: number, day: number, adjust = 0): Date | null {
  for (let i = 0; i < 400; i++) {
    const d = addDays(from, i);
    const h = hijriOf(d, adjust);
    if (h.month === month && h.day === day) return d;
  }
  return null;
}

export type IslamicEvent = { id: string; title: string; month: number; day: number; note: string };

export const EVENTS: IslamicEvent[] = [
  { id: 'ramadan', title: 'Ramadan begins', month: 9, day: 1, note: 'The month of fasting.' },
  { id: 'qadr', title: 'Last ten nights', month: 9, day: 21, note: 'Seek Laylat al-Qadr in the odd nights.' },
  { id: 'fitr', title: 'Eid al-Fitr', month: 10, day: 1, note: 'No fasting on the day of Eid.' },
  { id: 'dhulhijjah', title: 'First ten days of Dhul Hijjah', month: 12, day: 1, note: 'The best days of the year for good deeds.' },
  { id: 'arafah', title: 'Day of Arafah', month: 12, day: 9, note: 'A sunnah fast for those not on Hajj.' },
  { id: 'adha', title: 'Eid al-Adha', month: 12, day: 10, note: 'No fasting on Eid and the three days after it.' },
  { id: 'newyear', title: 'Islamic New Year', month: 1, day: 1, note: 'The start of Muharram.' },
  { id: 'ashura', title: 'Day of Ashura', month: 1, day: 10, note: 'A sunnah fast, with the 9th or 11th as well.' },
];

export type UpcomingEvent = IslamicEvent & { date: Date; inDays: number };

/** Every event in the coming year, soonest first. */
export function upcomingEvents(today: Date, adjust = 0): UpcomingEvent[] {
  const out: UpcomingEvent[] = [];
  for (const e of EVENTS) {
    const date = nextHijriDate(today, e.month, e.day, adjust);
    if (date) out.push({ ...e, date, inDays: daysUntil(today, date) });
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}

/** Days on which fasting is not allowed: the two Eids and the days of Tashriq. */
export function isForbiddenFast(h: HijriDate) {
  return (h.month === 10 && h.day === 1) || (h.month === 12 && h.day >= 10 && h.day <= 13);
}

export type SunnahFast = { reason: string };

/**
 * Why a day is a recommended (sunnah) fast, or null. Ramadan is left out because
 * fasting is already obligatory then.
 */
export function sunnahFast(d: Date, adjust = 0): SunnahFast | null {
  const h = hijriOf(d, adjust);
  if (h.month === 9 || isForbiddenFast(h)) return null;
  if (h.month === 12 && h.day === 9) return { reason: 'the Day of Arafah' };
  if (h.month === 1 && h.day === 10) return { reason: 'the Day of Ashura' };
  if (h.month === 1 && h.day === 9) return { reason: 'Tasu‘a, the day before Ashura' };
  if (h.day >= 13 && h.day <= 15) return { reason: `one of the White Days (${h.day} ${HIJRI_MONTHS[h.month - 1]})` };
  const weekday = d.getDay();
  if (weekday === 1) return { reason: 'Monday' };
  if (weekday === 4) return { reason: 'Thursday' };
  return null;
}

/** Sunnah fast days from today over the next `days` days. */
export function upcomingSunnahFasts(today: Date, days: number, adjust = 0) {
  const out: { date: Date; reason: string }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(today, i);
    const f = sunnahFast(d, adjust);
    if (f) out.push({ date: d, reason: f.reason });
  }
  return out;
}

/** The Gregorian date that a given day of Ramadan falls on, for the Ramadan that is on now or next. */
export function ramadanDay(today: Date, day: number, adjust = 0): Date | null {
  const h = hijriOf(today, adjust);
  if (h.month === 9) return addDays(today, day - h.day);
  return nextHijriDate(today, 9, day, adjust);
}
