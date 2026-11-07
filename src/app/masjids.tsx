import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { findNearbyMasjids, formatDistance, mapLinks, type Masjid } from '../lib/masjids';
import { PRAYERS, PRAYER_LABELS, formatTime, nextPrayer, prayerTimes } from '../lib/prayer';
import { useSettings, type SavedLocation } from '../state/SettingsProvider';
import { colors } from '../theme';

type Origin = { latitude: number; longitude: number; fromGps: boolean };
type State =
  | { kind: 'loading' }
  | { kind: 'no-location' }
  | { kind: 'error'; origin: Origin }
  | { kind: 'done'; origin: Origin; masjids: Masjid[] };

async function currentPosition(): Promise<Origin | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, fromGps: true };
  } catch {
    return null;
  }
}

export default function MasjidsScreen() {
  const { settings } = useSettings();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [now] = useState(() => new Date());

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    const saved = settings.location;
    const origin = (await currentPosition()) ?? (saved ? { latitude: saved.latitude, longitude: saved.longitude, fromGps: false } : null);
    if (!origin) return setState({ kind: 'no-location' });
    try {
      setState({ kind: 'done', origin, masjids: await findNearbyMasjids(origin.latitude, origin.longitude) });
    } catch {
      setState({ kind: 'error', origin });
    }
  }, [settings.location]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.muted}>Finding masjids near you…</Text>
      </View>
    );
  }

  if (state.kind === 'no-location') {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.big}>📍</Text>
        <Text style={styles.text}>Allow location, or set your city, to see the masjids closest to you.</Text>
        <Button title="Try again" onPress={load} style={{ alignSelf: 'stretch' }} />
        <Button title="Set my city" variant="outline" onPress={() => router.push('/location')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const { origin } = state;
  const here: SavedLocation = { ...origin, name: '', auto: origin.fromGps };
  const today = prayerTimes(here, settings, now);
  const next = nextPrayer(here, settings, now);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}>
      <Text style={styles.sub}>
        {origin.fromGps ? 'Nearest to where you are now' : `Nearest to ${settings.location?.name ?? 'your saved location'}`}
      </Text>

      <View style={styles.timesCard}>
        <Text style={styles.timesLabel}>TODAY’S PRAYER TIMES HERE</Text>
        <View style={styles.timesRow}>
          {PRAYERS.map((p) => {
            const isNext = p === next.name && next.time.toDateString() === now.toDateString();
            return (
              <View key={p} style={[styles.timeCell, isNext && styles.timeCellNext]}>
                <Text style={[styles.timeName, isNext && { color: '#fff' }]}>{PRAYER_LABELS[p]}</Text>
                <Text style={[styles.timeValue, isNext && { color: '#fff' }]}>{formatTime(today[p])}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>
          These are prayer start times worked out for your spot. Each masjid sets its own iqamah (jama‘ah) time, usually a few
          minutes later, so check its website or call before you go.
        </Text>
      </View>

      {state.kind === 'error' && (
        <View style={styles.card}>
          <Text style={styles.text}>Couldn’t load masjids right now. Check your connection and try again.</Text>
          <Button title="Try again" onPress={load} />
        </View>
      )}

      {state.kind === 'done' && state.masjids.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.text}>No masjids found within 40 km on OpenStreetMap. Try Google Maps instead.</Text>
          <Button
            title="Search Google Maps"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/mosque/@${origin.latitude},${origin.longitude},12z`)}
          />
        </View>
      )}

      {state.kind === 'done' && state.masjids.map((m) => <MasjidCard key={m.id} masjid={m} />)}

      {state.kind === 'done' && state.masjids.length > 0 && (
        <Text style={styles.credit}>Masjid list from OpenStreetMap contributors. A masjid missing? It can be added at openstreetmap.org.</Text>
      )}
    </ScrollView>
  );
}

function MasjidCard({ masjid: m }: { masjid: Masjid }) {
  const { settings } = useSettings();
  const links = mapLinks(m);
  const next = nextPrayer({ latitude: m.latitude, longitude: m.longitude, name: m.name, auto: false }, settings);
  const preferApple = Platform.OS === 'ios';
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={styles.card}>
      <Pressable onPress={() => open(preferApple ? links.apple : links.google)} accessibilityRole="link">
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={2}>
            🕌 {m.name}
          </Text>
          <Text style={styles.distance}>{formatDistance(m.km)}</Text>
        </View>
        {m.address && <Text style={styles.address}>{m.address}</Text>}
      </Pressable>

      <View style={styles.nextPill}>
        <Text style={styles.nextText}>
          Next: <Text style={{ fontWeight: '900' }}>{PRAYER_LABELS[next.name]}</Text> starts {formatTime(next.time)}
        </Text>
      </View>
      {m.serviceTimes && <Text style={styles.address}>Listed times: {m.serviceTimes}</Text>}

      <View style={styles.actions}>
        <Chip label="Apple Maps" onPress={() => open(links.apple)} />
        <Chip label="Google Maps" onPress={() => open(links.google)} />
        {m.website && <Chip label="Website" onPress={() => open(m.website!)} />}
        {m.phone && <Chip label="Call" onPress={() => open(`tel:${m.phone!.replace(/[^\d+]/g, '')}`)} />}
      </View>
    </View>
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
  timesCard: { backgroundColor: colors.goldLight, borderRadius: 18, padding: 14, gap: 10 },
  timesLabel: { fontSize: 12, fontWeight: '900', color: colors.oil, letterSpacing: 1 },
  timesRow: { flexDirection: 'row', gap: 6 },
  timeCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: colors.card },
  timeCellNext: { backgroundColor: colors.green },
  timeName: { fontSize: 12, fontWeight: '800', color: colors.muted },
  timeValue: { fontSize: 13, fontWeight: '900', color: colors.ink, marginTop: 2 },
  note: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 17, fontWeight: '900', color: colors.ink },
  distance: { fontWeight: '900', color: colors.green, fontSize: 15 },
  address: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  nextPill: { alignSelf: 'flex-start', backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  nextText: { color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontWeight: '800', color: colors.greenDark },
  credit: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
