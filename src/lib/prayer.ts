import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import type { Settings, SavedLocation } from '../state/SettingsProvider';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerName = (typeof PRAYERS)[number];

export const PRAYER_LABELS: Record<PrayerName | 'sunrise', string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const CALC_METHODS: { id: Settings['calcMethod']; label: string }[] = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League' },
  { id: 'NorthAmerica', label: 'ISNA (North America)' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)' },
  { id: 'Karachi', label: 'University of Karachi' },
  { id: 'Dubai', label: 'Dubai' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'Singapore', label: 'Singapore' },
  { id: 'Turkey', label: 'Diyanet (Turkey)' },
  { id: 'Tehran', label: 'Tehran' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
];

export function prayerTimes(location: SavedLocation, settings: Pick<Settings, 'calcMethod' | 'asrMadhab'>, date = new Date()) {
  const params = CalculationMethod[settings.calcMethod]();
  params.madhab = settings.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return new PrayerTimes(new Coordinates(location.latitude, location.longitude), date, params);
}

/** Compass bearing to the Ka‘bah, in degrees clockwise from true north. */
export function qiblaBearing(location: SavedLocation) {
  return Qibla(new Coordinates(location.latitude, location.longitude));
}

/** The next prayer from now, looking into tomorrow after Isha. */
export function nextPrayer(location: SavedLocation, settings: Pick<Settings, 'calcMethod' | 'asrMadhab'>, now = new Date()) {
  const today = prayerTimes(location, settings, now);
  for (const p of PRAYERS) {
    if (today[p] > now) return { name: p, time: today[p] };
  }
  const tomorrow = prayerTimes(location, settings, new Date(now.getTime() + 86_400_000));
  return { name: 'fajr' as PrayerName, time: tomorrow.fajr };
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
