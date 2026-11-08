import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { SavedLocation } from '../state/SettingsProvider';
import { CITIES } from './cities';
import { labelFromDevice, reverseLookup } from './geocode';

/** Asks for permission and reads the phone's position. Returns null if the user says no. */
export async function detectLocation(): Promise<SavedLocation | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude } = pos.coords;
  return { latitude, longitude, name: (await placeName(latitude, longitude)) ?? coords(latitude, longitude), auto: true };
}

/** The town for a position: the phone's own lookup on iOS and Android, a free web service on the website. */
export async function placeName(latitude: number, longitude: number): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = place && labelFromDevice(place);
      if (label) return label;
    } catch {
      // fall back to the web lookup below
    }
  }
  return (await reverseLookup(latitude, longitude)) ?? nearestCityName(latitude, longitude);
}

export function coords(latitude: number, longitude: number) {
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

/** True when a saved name is just numbers, for locations saved before towns were looked up. */
export function isCoordinateName(name: string) {
  return /^-?\d/.test(name) || name.startsWith('Near ');
}

/** "Near Washington, D.C." when a listed city is within 150 km; only used when offline. */
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
