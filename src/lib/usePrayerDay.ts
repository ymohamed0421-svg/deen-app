import { useEffect, useState } from 'react';
import { useSettings } from '../state/SettingsProvider';
import { prayerTimes } from './prayer';
import { prayerDayKey, type DayTimes } from './worship';

/** A clock that ticks every `ms`, for countdowns. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * The prayer day we are in (before Fajr it is still last night), with that day's
 * prayer times and the next day's. Times are null until a location is set.
 */
export function usePrayerDay(tickMs = 30_000) {
  const { settings } = useSettings();
  const now = useNow(tickMs);
  const loc = settings.location;
  if (!loc) return { now, dayKey: prayerDayKey(now, null), today: null, tomorrow: null };
  const cal = prayerTimes(loc, settings, now) as unknown as DayTimes;
  const dayKey = prayerDayKey(now, cal.fajr);
  // Before Fajr, "today" for prayers is yesterday's times.
  const base = now < cal.fajr ? new Date(now.getTime() - 86_400_000) : now;
  const today = (base === now ? cal : prayerTimes(loc, settings, base)) as unknown as DayTimes;
  const tomorrow = prayerTimes(loc, settings, new Date(base.getTime() + 86_400_000)) as unknown as DayTimes;
  return { now, dayKey, today, tomorrow };
}
