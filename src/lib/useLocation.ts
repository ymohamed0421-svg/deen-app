import * as Location from 'expo-location';
import type { SavedLocation } from '../state/SettingsProvider';

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
    // Reverse geocoding isn't available everywhere (for example on web). Coordinates are enough.
  }
  return { latitude, longitude, name, auto: true };
}
