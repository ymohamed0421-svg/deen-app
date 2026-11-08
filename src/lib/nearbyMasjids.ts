import { OTHER_FAITH, STRONG_MUSLIM } from '../../supabase/functions/_shared/tomtom.ts';
import { distanceKm, type Masjid } from './masjids';
import { supabase } from './supabase';

type PlaceMasjid = Omit<Masjid, 'km' | 'serviceTimes'>;

/**
 * Masjids from the `nearby-masjids` Edge Function (TomTom's map data). Returns null when it isn't
 * set up yet or doesn't answer within 10 seconds, so the app can fall back to OpenStreetMap.
 */
export async function fetchPlaceMasjids(latitude: number, longitude: number): Promise<Masjid[] | null> {
  if (!supabase) return null;
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) await supabase.auth.signInAnonymously();
    const call = supabase.functions.invoke('nearby-masjids', { body: { latitude, longitude } });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
    const res = await Promise.race([call, timeout]);
    if (!res || res.error || !Array.isArray(res.data?.masjids)) return null;
    return (res.data.masjids as PlaceMasjid[])
      .filter((m) => STRONG_MUSLIM.test(m.name) || !OTHER_FAITH.test(m.name))
      .map((m) => ({ ...m, serviceTimes: null, km: distanceKm(latitude, longitude, m.latitude, m.longitude) }))
      .sort((a, b) => a.km - b.km);
  } catch {
    return null;
  }
}

/** Looks up masjids by name anywhere (TomTom), with distances from where the person is. */
export async function searchMasjidsByName(query: string, latitude: number, longitude: number): Promise<Masjid[]> {
  if (!supabase) throw new Error('Search needs the app’s server, which isn’t connected.');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) await supabase.auth.signInAnonymously();
  const call = supabase.functions.invoke('nearby-masjids', { body: { query, latitude, longitude } });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The search took too long. Try again.')), 15_000));
  const res = await Promise.race([call, timeout]);
  if (res.error || !Array.isArray(res.data?.masjids)) {
    const body = await (res.error as { context?: Response } | null)?.context?.json?.().catch(() => null);
    throw new Error(body?.error === 'not-configured' ? 'Search isn’t set up yet.' : (body?.error ?? 'Search didn’t work. Try again.'));
  }
  return (res.data.masjids as PlaceMasjid[])
    .filter((m) => STRONG_MUSLIM.test(m.name) || !OTHER_FAITH.test(m.name))
    .map((m) => ({ ...m, serviceTimes: null, km: distanceKm(latitude, longitude, m.latitude, m.longitude) }));
}
