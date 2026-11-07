import * as Location from 'expo-location';
import type { SavedLocation } from '../state/SettingsProvider';
import { CITIES } from './cities';

/** Asks for permission and reads the phone's position. Returns null if the user says no. */
export async function detectLocation(): Promise<SavedLocation | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = pos.coords;
  let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) name = [place.city ?? place.subregion, place.country].filter(Boolean).join(', ') || name;
  } catch {
    // Reverse geocoding isn't available everywhere (for example on web).
  }
  if (name.includes(',') && /^-?\d/.test(name)) name = nearestCityName(latitude, longitude) ?? name;
  return { latitude, longitude, name, auto: true };
}

/** "Near Washington, D.C." when a listed city is within 150 km, so the screen shows a place, not numbers. */
export function nearestCityName(latitude: number, longitude: number) {
  const rad = Math.PI / 180;
  let best: { name: string; km: number } | null = null;
  for (const c of CITIES) {
    const dLat = (c.latitude - latitude) * rad;
    const dLng = (c.longitude - longitude) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(latitude * rad) * Math.cos(c.latitude * rad) * Math.sin(dLng / 2) ** 2;
    const km = 12742 * Math.asin(Math.sqrt(a));
    if (!best || km < best.km) best = { name: c.name, km };
  }
  return best && best.km < 150 ? `Near ${best.name}` : null;
}
