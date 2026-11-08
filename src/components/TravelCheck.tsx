import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { distanceKm } from '../lib/masjids';
import { detectLocation } from '../lib/useLocation';
import { useSettings, type SavedLocation } from '../state/SettingsProvider';
import { colors } from '../theme';

const FAR_KM = 80;
const DISMISSED_KEY = 'deen-app/travel/dismissed';

/**
 * Travel mode: when the phone is far from the saved city (a trip), offers once to switch prayer
 * times, reminders and the Qibla to where you are. Only asks the phone for its position if
 * location was already allowed, so it never pops a permission prompt on launch.
 */
export function TravelCheck() {
  const { ready, settings, update } = useSettings();
  const insets = useSafeAreaInsets();
  const [offer, setOffer] = useState<SavedLocation | null>(null);
  const saved = settings.location;

  useEffect(() => {
    if (!ready || !saved || Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (!perm?.granted) return;
      const pos = (await Location.getLastKnownPositionAsync().catch(() => null)) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null));
      if (!pos || cancelled) return;
      const { latitude, longitude } = pos.coords;
      if (distanceKm(saved.latitude, saved.longitude, latitude, longitude) < FAR_KM) return;
      const raw = await AsyncStorage.getItem(DISMISSED_KEY).catch(() => null);
      const dismissed = raw ? (JSON.parse(raw) as { latitude: number; longitude: number }) : null;
      if (dismissed && distanceKm(dismissed.latitude, dismissed.longitude, latitude, longitude) < FAR_KM) return;
      const here = await detectLocation().catch(() => null);
      if (here && !cancelled) setOffer(here);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, saved?.latitude, saved?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!offer) return null;
  const dismiss = () => {
    AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify({ latitude: offer.latitude, longitude: offer.longitude })).catch(() => {});
    setOffer(null);
  };
  return (
    <View style={[styles.banner, { top: insets.top + 8 }]}>
      <Text style={styles.title}>✈️ Traveling?</Text>
      <Text style={styles.text}>
        You’re in {offer.name}, far from {saved?.name}. Switch prayer times and reminders to here?
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            update({ location: offer });
            setOffer(null);
          }}
          style={[styles.btn, { backgroundColor: colors.green }]}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, { color: '#fff' }]}>Switch to here</Text>
        </Pressable>
        <Pressable onPress={dismiss} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 100,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { fontSize: 16, fontWeight: '900', color: colors.ink },
  text: { color: colors.ink, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 2, borderColor: colors.green, paddingVertical: 10 },
  btnText: { fontWeight: '900', color: colors.greenDark },
});
