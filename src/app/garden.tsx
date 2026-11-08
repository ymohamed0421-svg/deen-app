import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fanous, SpeechBubble } from '../components/Fanous';
import { StatsBar } from '../components/StatsBar';
import { levelFromNoor } from '../game/rules';
import { useGame } from '../state/GameProvider';
import { colors, themed } from '../theme';

const PLANTS = ['🌱', '🌿', '🌷', '🌼', '🌻', '🪴', '🌳', '🌴'];

export default function GardenScreen() {
  const { state, displayStreak } = useGame();
  const { level, into, needed } = levelFromNoor(state.noor);
  // Long streaks grow trees: one tree for every 7 days.
  const trees = Math.floor(state.streak.longest / 7);
  const plots = Math.max(12, state.garden.length + trees + 4);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatsBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your garden</Text>
        <Text style={styles.sub}>Every lesson you finish plants something new. Every 7-day streak grows a tree.</Text>

        <View style={styles.levelCard}>
          <Text style={styles.levelText}>Level {level}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(into / needed) * 100}%` }]} />
          </View>
          <Text style={styles.levelSub}>
            {into} / {needed} Noor to level {level + 1}
          </Text>
        </View>

        <View style={styles.grid}>
          {Array.from({ length: plots }).map((_, i) => {
            const isTree = i < trees;
            const plantIndex = i - trees;
            const grown = isTree || plantIndex < state.garden.length;
            return (
              <View key={i} style={[styles.plot, grown && styles.plotGrown]}>
                <Text style={styles.plant}>{isTree ? '🌳' : grown ? PLANTS[plantIndex % PLANTS.length] : ''}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.fanousRow}>
          <Fanous size={64} flame={Math.min(1, displayStreak / 10 + 0.3)} />
          <SpeechBubble
            text={
              state.garden.length === 0
                ? 'Empty soil, full of promise. Finish a lesson to plant your first seed.'
                : `${state.garden.length} plants and counting. I light it up at night, you know.`
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  levelCard: { marginTop: 16, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line },
  levelText: { fontWeight: '900', fontSize: 18, color: colors.ink },
  track: { height: 14, backgroundColor: colors.line, borderRadius: 7, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.green, borderRadius: 7 },
  levelSub: { color: colors.muted, marginTop: 6, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, justifyContent: 'center' },
  plot: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.soil, alignItems: 'center', justifyContent: 'center' },
  plotGrown: { backgroundColor: colors.sprout },
  plant: { fontSize: 36 },
  fanousRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
}));
