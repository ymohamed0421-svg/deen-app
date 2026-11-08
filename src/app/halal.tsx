import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { formatDistance, mapLinks, type Masjid } from '../lib/masjids';
import { searchHalalFood } from '../lib/nearbyMasjids';
import { useSettings } from '../state/SettingsProvider';
import { colors } from '../theme';

type State = { kind: 'loading' } | { kind: 'no-location' } | { kind: 'error'; message: string } | { kind: 'done'; places: Masjid[]; fromGps: boolean };

function within<T>(ms: number, p: Promise<T>): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

/** Halal restaurants and shops near you, from places on the map that say halal or zabiha. */
export default function HalalScreen() {
  const { settings } = useSettings();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    let spot: { latitude: number; longitude: number; fromGps: boolean } | null = null;
    try {
      const perm = await within(20_000, Location.requestForegroundPermissionsAsync());
      if (perm?.granted) {
        const pos = await within(12_000, Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (pos) spot = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, fromGps: true };
      }
    } catch {
      // fall back to the saved city
    }
    if (!spot && settings.location) spot = { latitude: settings.location.latitude, longitude: settings.location.longitude, fromGps: false };
    if (!spot) return setState({ kind: 'no-location' });
    try {
      const places = await searchHalalFood(spot.latitude, spot.longitude);
      setState({ kind: 'done', places: places.slice(0, 40), fromGps: spot.fromGps });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Search didn’t work. Try again.' });
    }
  }, [settings.location]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.muted}>Finding halal food near you…</Text>
      </View>
    );
  }
  if (state.kind === 'no-location') {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.big}>📍</Text>
        <Text style={styles.text}>Allow location, or set your city, to find halal food nearby.</Text>
        <Button title="Try again" onPress={load} style={{ alignSelf: 'stretch' }} />
        <Button title="Set my city" variant="outline" onPress={() => router.push('/location')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }
  if (state.kind === 'error') {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.text}>{state.message}</Text>
        <Button title="Try again" onPress={load} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const open = (url: string) => Linking.openURL(url).catch(() => {});
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      <Text style={styles.sub}>{state.fromGps ? 'Closest to where you are now' : `Closest to ${settings.location?.name ?? 'your city'}`}</Text>
      {state.places.length === 0 && <Text style={styles.text}>No places listed as halal within 20 km. Try Google Maps.</Text>}
      {state.places.map((p) => {
        const links = mapLinks(p);
        return (
          <View key={p.id} style={styles.card}>
            <Pressable onPress={() => open(Platform.OS === 'ios' ? links.apple : links.google)} accessibilityRole="link">
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={2}>
                  🍽️ {p.name}
                </Text>
                <Text style={styles.distance}>{formatDistance(p.km)}</Text>
              </View>
              {p.address && <Text style={styles.address}>{p.address}</Text>}
            </Pressable>
            <View style={styles.actions}>
              <Chip label="Apple Maps" onPress={() => open(links.apple)} />
              <Chip label="Google Maps" onPress={() => open(links.google)} />
              <Chip label="Waze" onPress={() => open(links.waze)} />
              {p.website && <Chip label="Website" onPress={() => open(p.website!)} />}
              {p.phone && <Chip label="Call" onPress={() => open(`tel:${p.phone!.replace(/[^\d+]/g, '')}`)} />}
            </View>
          </View>
        );
      })}
      <Text style={styles.credit}>
        Places whose map listing says halal or zabiha. Listings can be out of date, so ask the restaurant if you’re not sure.
      </Text>
    </ScrollView>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: colors.bg },
  big: { fontSize: 48 },
  text: { color: colors.ink, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  muted: { color: colors.muted },
  sub: { color: colors.muted, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 17, fontWeight: '900', color: colors.ink },
  distance: { fontWeight: '900', color: colors.green, fontSize: 15 },
  address: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontWeight: '800', color: colors.greenDark },
  credit: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
