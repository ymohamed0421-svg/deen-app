import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SURAHS } from '../../quran/surahs';
import { useRecitation } from '../../state/RecitationProvider';
import { colors } from '../../theme';

export default function QuranScreen() {
  const [query, setQuery] = useState('');
  const rec = useRecitation();
  const playingSurah = rec.surah ? SURAHS.find((s) => s.id === rec.surah) : null;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter(
      (s) => String(s.id) === q || s.name.toLowerCase().includes(q) || s.meaning.toLowerCase().includes(q) || s.arabic.includes(query.trim()),
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>The Quran</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search surah name or number"
        placeholderTextColor={colors.muted}
        style={styles.search}
      />
      {playingSurah && (
        <View style={styles.now}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push(`/quran/${playingSurah.id}`)}>
            <Text style={styles.nowLabel}>{rec.playing ? 'NOW RECITING' : 'PAUSED'}</Text>
            <Text style={styles.nowName}>
              {playingSurah.name} · ayah {rec.index + 1}
            </Text>
          </Pressable>
          <Pressable onPress={rec.toggle} style={styles.nowBtn} accessibilityLabel={rec.playing ? 'Pause' : 'Play'}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>{rec.playing ? '⏸' : '▶'}</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/quran/${item.id}`)}>
            <View style={styles.num}>
              <Text style={styles.numText}>{item.id}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.meaning} · {item.verses} ayahs · {item.type === 'meccan' ? 'Makki' : 'Madani'}
              </Text>
            </View>
            <Text style={styles.arabic}>{item.arabic}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  now: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: colors.green },
  nowLabel: { color: '#ffffffcc', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  nowName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  nowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink, paddingHorizontal: 16, paddingTop: 12 },
  search: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.ink,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  num: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  numText: { fontWeight: '800', color: '#9A6B12', transform: [{ rotate: '-45deg' }] },
  name: { fontWeight: '800', fontSize: 16, color: colors.ink },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  arabic: { fontSize: 22, color: colors.green },
});
