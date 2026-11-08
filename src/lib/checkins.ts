import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrayerName } from './prayer';

// Praying at the masjid earns Noor: once per prayer per day, only when the phone is at the masjid.
const KEY = 'deen-app/checkins/v1';
export const CHECKIN_NOOR = 15;
export const CHECKIN_KM = 0.25;

type Log = { days: Record<string, PrayerName[]>; total: number };

async function read(): Promise<Log> {
  const raw = await AsyncStorage.getItem(KEY).catch(() => null);
  try {
    return raw ? (JSON.parse(raw) as Log) : { days: {}, total: 0 };
  } catch {
    return { days: {}, total: 0 };
  }
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function checkedIn(prayer: PrayerName, day = dayKey()) {
  const log = await read();
  return { done: (log.days[day] ?? []).includes(prayer), total: log.total };
}

/** Records the check-in. Returns false if this prayer was already counted today. */
export async function checkIn(prayer: PrayerName, day = dayKey()) {
  const log = await read();
  const today = log.days[day] ?? [];
  if (today.includes(prayer)) return false;
  // Keep only the last two weeks of days.
  const days = Object.fromEntries(Object.entries(log.days).sort().slice(-13));
  days[day] = [...today, prayer];
  await AsyncStorage.setItem(KEY, JSON.stringify({ days, total: log.total + 1 })).catch(() => {});
  return true;
}
