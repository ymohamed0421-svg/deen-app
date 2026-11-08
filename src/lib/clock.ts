import { PRAYERS, PRAYER_LABELS, type PrayerName } from './prayer.ts';
// Turns times written on masjid websites ("6:15 AM", "1:30pm", "13:45") into dates.

/** The given day at that clock time, or null for things like "5 min after sunset". */
export function parseClock(text: string, day: Date, assumePm = false): Date | null {
  const m = text.trim().match(/^(\d{1,2})(?::|\.)(\d{2})\s*([ap])?\.?\s*m?\.?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const ap = m[3]?.toLowerCase();
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  if (!ap && assumePm && h < 12) h += 12;
  const d = new Date(day);
  d.setHours(h, min, 0, 0);
  return d;
}

/** Prayers after Fajr are written without AM/PM on many timetables ("1:30", "7:45"). */
export const AFTERNOON = { fajr: false, dhuhr: false, asr: true, maghrib: true, isha: true } as const;

/** Dhuhr written as "1:15" means 1:15 PM, but "12:30" stays noon-ish. */
export function parsePrayerClock(prayer: keyof typeof AFTERNOON | 'jumuah', text: string, day: Date) {
  const pm = prayer === 'dhuhr' || prayer === 'jumuah' ? /^(1|2|3|4)\b|^0?[1-4]:/.test(text.trim()) : AFTERNOON[prayer];
  return parseClock(text, day, pm);
}

/**
 * Reminders a few minutes before each iqamah at the favorite masjid that has a clock time
 * (not "5 min after sunset"), and before the first Jumu'ah on Fridays instead of Dhuhr.
 */
export function iqamahReminders(
  times: { iqamah: Partial<Record<PrayerName, string | null>>; jumuah: string[] },
  day: Date,
  leadMinutes: number,
  masjid: string,
) {
  const out: { at: Date; title: string; body: string }[] = [];
  const friday = day.getDay() === 5;
  for (const p of PRAYERS) {
    if (friday && p === 'dhuhr' && times.jumuah.length) continue;
    const text = times.iqamah[p];
    const clock = text ? parsePrayerClock(p, text, day) : null;
    if (!clock) continue;
    out.push({ at: new Date(clock.getTime() - leadMinutes * 60_000), title: `${PRAYER_LABELS[p]} iqamah in ${leadMinutes} min`, body: `${masjid} at ${text}` });
  }
  if (friday && times.jumuah[0]) {
    const clock = parsePrayerClock('jumuah', times.jumuah[0], day);
    if (clock) out.push({ at: new Date(clock.getTime() - leadMinutes * 60_000), title: `Jumu'ah in ${leadMinutes} min 🕌`, body: `${masjid} at ${times.jumuah[0]}` });
  }
  return out;
}

/** Which prayer's time it is now: the last one that has started (Isha until Fajr). */
export function prayerSlot(times: Record<PrayerName, Date>, now: Date): PrayerName {
  let slot: PrayerName = 'isha';
  for (const p of PRAYERS) if (times[p].getTime() <= now.getTime()) slot = p;
  return slot;
}

/** Jumu'ah times sorted by the earliest one, for the Friday finder. Unreadable times go last. */
export function sortByJumuah<T extends { jumuah: string[] }>(rows: T[], day: Date): T[] {
  const first = (r: T) => {
    const ts = r.jumuah.map((j) => parsePrayerClock('jumuah', j, day)?.getTime()).filter((t): t is number => t != null);
    return ts.length ? Math.min(...ts) : Infinity;
  };
  return [...rows].sort((a, b) => first(a) - first(b));
}
