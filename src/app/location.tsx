import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { CITIES } from '../lib/cities';
import { placeLabel, searchPlaces, type Place } from '../lib/geocode';
import { coords, detectLocation, placeName } from '../lib/useLocation';
import { useSettings } from '../state/SettingsProvider';
import { colors, themed } from '../theme';

type Row = { key: string; title: string; subtitle: string; latitude: number; longitude: number; label: string };

const fromPlace = (p: Place): Row => ({
  key: `${p.name}-${p.region}-${p.countryCode}-${p.latitude.toFixed(3)}`,
  title: p.name,
  subtitle: [p.region, p.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
  latitude: p.latitude,
  longitude: p.longitude,
  label: placeLabel(p),
});

const POPULAR: Row[] = CITIES.map((c) => ({
  key: `${c.name}-${c.country}`,
  title: c.name,
  subtitle: c.country,
  latitude: c.latitude,
  longitude: c.longitude,
  label: `${c.name}, ${c.country}`,
}));

export default function LocationScreen() {
  const { settings, update } = useSettings();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [results, setResults] = useState<Row[] | null>(null);
  const [didYouMean, setDidYouMean] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const near = useRef(settings.location);

  // Search every town worldwide as the user types (debounced), falling back to the built-in list offline.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchPlaces(q, near.current, ctrl.signal);
        setResults(r.places.map(fromPlace));
        setDidYouMean(r.didYouMean);
        setSearchError(false);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setSearchError(true);
        setResults(null);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  const offline = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? POPULAR.filter((c) => `${c.title} ${c.subtitle}`.toLowerCase().includes(q)) : POPULAR;
  }, [query]);

  const rows = results ?? (query.trim().length >= 2 && !searchError ? [] : offline);

  async function useGps() {
    setBusy(true);
    setError(null);
    try {
      const loc = await detectLocation();
      if (!loc) setError('Location permission was not given. Search for your town below instead.');
      else {
        update({ location: loc });
        router.back();
      }
    } catch {
      setError('Could not read your location. Search for your town below instead.');
    } finally {
      setBusy(false);
    }
  }

  async function useCoordinates() {
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      setError('Enter a latitude between -90 and 90 and a longitude between -180 and 180.');
      return;
    }
    setBusy(true);
    const name = (await placeName(la, lo).catch(() => null)) ?? coords(la, lo);
    setBusy(false);
    update({ location: { latitude: la, longitude: lo, name, auto: false } });
    router.back();
  }

  let header: string;
  if (query.trim().length < 2) header = 'Popular cities';
  else if (searching) header = 'Searching…';
  else if (searchError) header = 'Offline, showing the built-in list';
  else if (didYouMean) header = `No exact match for “${query.trim()}”. Did you mean:`;
  else if (rows.length) header = 'Results';
  else header = 'No towns found. Check the spelling, or add the state, like “Burke, VA”.';

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={rows}
      keyExtractor={(c) => c.key}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          {settings.location && (
            <Text style={styles.current}>
              Now using: <Text style={{ fontWeight: '800' }}>{settings.location.name}</Text>
              {settings.location.auto ? ' (automatic)' : ' (set by hand)'}
            </Text>
          )}
          <Button title={busy ? 'Finding you…' : '📍 Use my current location'} onPress={useGps} disabled={busy} />
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.section}>Or search for your town</Text>
          <View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="City or town, e.g. Springfield, VA"
              placeholderTextColor={colors.muted}
              style={[styles.input, { paddingRight: 40 }]}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searching && <ActivityIndicator style={styles.spinner} color={colors.green} />}
          </View>
          <Text style={styles.listHeader}>{header}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.goldLight }]}
          onPress={() => {
            update({ location: { latitude: item.latitude, longitude: item.longitude, name: item.label, auto: false } });
            router.back();
          }}
        >
          <Text style={styles.city}>{item.title}</Text>
          <Text style={styles.country}>{item.subtitle}</Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={{ gap: 10, marginTop: 20 }}>
          <Text style={styles.section}>Still can’t find it? Enter coordinates</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput value={lat} onChangeText={setLat} placeholder="Latitude" keyboardType="numbers-and-punctuation" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
            <TextInput value={lng} onChangeText={setLng} placeholder="Longitude" keyboardType="numbers-and-punctuation" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
          </View>
          <Button title="Use these coordinates" variant="outline" onPress={useCoordinates} disabled={busy} />
          <Text style={styles.credit}>Town search by Open-Meteo (GeoNames data).</Text>
        </View>
      }
    />
  );
}

const styles = themed(() => ({
  current: { color: colors.ink, fontSize: 15 },
  error: { color: colors.red },
  section: { fontWeight: '900', color: colors.ink, fontSize: 16, marginTop: 8 },
  listHeader: { color: colors.muted, fontWeight: '700', fontSize: 13, marginTop: 4 },
  input: { padding: 12, minWidth: 0, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, fontSize: 16, color: colors.ink },
  spinner: { position: 'absolute', right: 12, top: 14 },
  row: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.line },
  city: { fontSize: 16, fontWeight: '700', color: colors.ink },
  country: { color: colors.muted, fontSize: 13 },
  credit: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
}));
