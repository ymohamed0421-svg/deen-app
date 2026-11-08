import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Fanous, SpeechBubble } from '../../components/Fanous';
import { dueKeys, parseKey, surahProgress, weakKeys } from '../../quran/memorize';
import { SURAHS } from '../../quran/surahs';
import { useGame } from '../../state/GameProvider';
import { useMemorizeStore } from '../../state/memorizeStore';
import { colors, themed } from '../../theme';

// Short surahs most people learn first, for a quick start.
const STARTERS = [1, 112, 113, 114, 108, 103];

export default function MemorizeHub() {
  const { today } = useGame();
  const memo = useMemorizeStore();
  const due = dueKeys(memo, today).length;
  const weak = weakKeys(memo).length;
  const rows = surahProgress(memo, today);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.body}>
      <View style={styles.hero}>
        <Fanous size={64} mood="happy" />
        <SpeechBubble text="Hide the words, recite from memory, then check. The ayahs you miss come back until they stick." />
      </View>

      <View style={styles.statRow}>
        <Stat value={due} label="Due today" />
        <Stat value={weak} label="Weak ayahs" />
        <Stat value={rows.reduce((n, r) => n + r.solid, 0)} label="Solid" />
      </View>

      <Button title={due > 0 ? `Review ${due} ayah${due === 1 ? '' : 's'}` : 'Nothing due today'} disabled={due === 0} onPress={() => router.push('/memorize/practice?mode=review')} />
      {weak > 0 && (
        <Button title={`Practise ${weak} weak ayah${weak === 1 ? '' : 's'}`} variant="outline" onPress={() => router.push('/memorize/practice?mode=weak')} style={{ marginTop: 10 }} />
      )}

      {rows.length > 0 && <Text style={styles.h2}>Your surahs</Text>}
      {rows.map((r) => {
        const meta = SURAHS.find((s) => s.id === r.surah);
        if (!meta) return null;
        const studied = Object.keys(memo).map(parseKey).filter((k) => k.surah === r.surah).map((k) => k.index);
        const to = Math.min(meta.verses - 1, Math.max(...studied) + 1);
        return (
          <Pressable key={r.surah} style={styles.row} onPress={() => router.push(`/memorize/practice?surah=${r.surah}&from=${Math.min(...studied)}&to=${to}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {meta.id}. {meta.name}
              </Text>
              <Text style={styles.rowText}>
                {r.practised} of {meta.verses} ayahs practised · {r.solid} solid{r.weak ? ` · ${r.weak} weak` : ''}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(r.solid / meta.verses) * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.arabic}>{meta.arabic}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.h2}>Start a surah</Text>
      <Text style={styles.rowText}>Or open any surah in the Quran tab and tap “Memorize”.</Text>
      <View style={styles.starters}>
        {STARTERS.map((id) => {
          const meta = SURAHS.find((s) => s.id === id)!;
          return (
            <Pressable key={id} style={styles.starter} onPress={() => router.push(`/memorize/practice?surah=${id}&from=0&to=${Math.min(meta.verses - 1, 6)}`)}>
              <Text style={styles.starterArabic}>{meta.arabic}</Text>
              <Text style={styles.starterName}>{meta.name}</Text>
              <Text style={styles.rowText}>{meta.verses} ayahs</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingBottom: 48 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.green },
  statLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  h2: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 24, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, marginTop: 10 },
  rowTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  rowText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', backgroundColor: colors.gold },
  arabic: { fontSize: 22, color: colors.green },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  starter: { width: '31%', flexGrow: 1, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line },
  starterArabic: { fontSize: 22, color: colors.green },
  starterName: { fontWeight: '800', color: colors.ink, marginTop: 4 },
}));
