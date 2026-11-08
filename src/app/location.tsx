import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { CITIES } from '../lib/cities';
import { detectLocation } from '../lib/useLocation';
import { useSettings } from '../state/SettingsProvider';
import { colors, themed } from '../theme';

export default function LocationScreen() {
  const { settings, update } = useSettings();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CITIES.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q)) : CITIES;
  }, [query]);

  async function useGps() {
    setBusy(true);
    setError(null);
    try {
      const loc = await detectLocation();
      if (!loc) setError('Location permission was not given. Pick a city below instead.');
      else {
        update({ location: loc });
        router.back();
      }
    } catch {
      setError('Could not read your location. Pick a city below instead.');
    } finally {
      setBusy(false);
    }
  }

  function useCoordinates() {
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      setError('Enter a latitude between -90 and 90 and a longitude between -180 and 180.');
      return;
    }
    update({ location: { latitude: la, longitude: lo, name: `${la.toFixed(3)}, ${lo.toFixed(3)}`, auto: false } });
    router.back();
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={cities}
      keyExtractor={(c) => `${c.name}-${c.country}`}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 12 }}>
          {settings.location && (
            <Text style={styles.current}>
              Now using: <Text style={{ fontWeight: '800' }}>{settings.location.name}</Text>
              {settings.location.auto ? ' (automatic)' : ' (set by hand)'}
            </Text>
          )}
          <Button title={busy ? 'Finding you…' : '📍 Use my current location'} onPress={useGps} disabled={busy} />
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.section}>Or choose a city</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search cities"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => {
            update({ location: { latitude: item.latitude, longitude: item.longitude, name: `${item.name}, ${item.country}`, auto: false } });
            router.back();
          }}
        >
          <Text style={styles.city}>{item.name}</Text>
          <Text style={styles.country}>{item.country}</Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={{ gap: 10, marginTop: 20 }}>
          <Text style={styles.section}>City not listed? Enter coordinates</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput value={lat} onChangeText={setLat} placeholder="Latitude" keyboardType="numbers-and-punctuation" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
            <TextInput value={lng} onChangeText={setLng} placeholder="Longitude" keyboardType="numbers-and-punctuation" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
          </View>
          <Button title="Use these coordinates" variant="outline" onPress={useCoordinates} />
        </View>
      }
    />
  );
}

const styles = themed(() => ({
  current: { color: colors.ink, fontSize: 15 },
  error: { color: colors.red },
  section: { fontWeight: '900', color: colors.ink, fontSize: 16, marginTop: 8 },
  input: { padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, fontSize: 16, color: colors.ink },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  city: { fontSize: 16, fontWeight: '700', color: colors.ink },
  country: { color: colors.muted, fontSize: 13 },
}));
