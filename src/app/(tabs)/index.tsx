import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fanous, SpeechBubble, greetingLine } from '../../components/Fanous';
import { StatsBar } from '../../components/StatsBar';
import { UNITS } from '../../content/units';
import { isDone, isUnlocked, nextLessonId, unitDone } from '../../game/progress';
import { useGame } from '../../state/GameProvider';
import { colors } from '../../theme';

// Nodes wind left and right like a garden path.
const OFFSETS = [0, 50, 70, 40, -10, -60, -70, -40];

export default function PathScreen() {
  const { state, displayStreak, today } = useGame();
  const next = nextLessonId(state);
  const doneToday = state.streak.lastActiveDate === today;
  const seed = Number(today.replace(/-/g, ''));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatsBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Fanous mood={doneToday ? 'cheer' : displayStreak > 0 ? 'happy' : 'happy'} size={80} flame={Math.min(1, displayStreak / 10 + 0.3)} />
          <SpeechBubble text={greetingLine({ streak: displayStreak, doneToday, seed })} />
        </View>

        {UNITS.map((unit, u) => (
          <View key={unit.id} style={styles.unit}>
            <View style={[styles.unitHeader, { backgroundColor: unit.color }]}>
              <Text style={styles.unitKicker}>UNIT {u + 1}</Text>
              <Text style={styles.unitTitle}>{unit.title}</Text>
              <Text style={styles.unitSub}>{unit.subtitle}</Text>
            </View>

            {unit.lessons.map((lesson, i) => {
              const done = isDone(state, lesson.id);
              const open = isUnlocked(state, lesson.id);
              const current = lesson.id === next;
              return (
                <View key={lesson.id} style={[styles.nodeRow, { transform: [{ translateX: OFFSETS[i % OFFSETS.length] }] }]}>
                  {current && <Text style={styles.startTag}>START</Text>}
                  <Pressable
                    disabled={!open}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                    accessibilityLabel={`${lesson.title}${done ? ', done' : open ? '' : ', locked'}`}
                    style={({ pressed }) => [
                      styles.node,
                      { backgroundColor: done ? colors.gold : open ? unit.color : colors.locked },
                      { borderBottomColor: done ? '#B9861F' : open ? '#00000040' : '#BDB6A8' },
                      current && styles.nodeCurrent,
                      pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 3 },
                    ]}
                  >
                    <Text style={styles.nodeGlyph}>{done ? '★' : open ? '▶' : '🔒'}</Text>
                  </Pressable>
                  <Text style={[styles.nodeLabel, !open && { color: colors.muted }]}>{lesson.title}</Text>
                </View>
              );
            })}

            <View style={styles.chestRow}>
              <Text style={[styles.chest, !unitDone(state, unit.id) && { opacity: 0.35 }]}>
                {unitDone(state, unit.id) ? '🎁' : '🧰'}
              </Text>
              <Text style={styles.chestLabel}>{unitDone(state, unit.id) ? 'Chest opened: +30 Pearls' : 'Finish the unit to open'}</Text>
            </View>
          </View>
        ))}

        <View style={styles.comingSoon}>
          <Text style={styles.comingTitle}>Coming next</Text>
          <Text style={styles.comingText}>The six articles of faith, short surahs for salah, and the 40 Hadith of Imam an-Nawawi.</Text>
        </View>
        <Text style={styles.draftNote}>Lesson content is a first draft awaiting review by a qualified scholar.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 48, paddingHorizontal: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 8 },
  unit: { marginTop: 20 },
  unitHeader: { borderRadius: 16, padding: 16, marginBottom: 16 },
  unitKicker: { color: '#ffffffcc', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  unitTitle: { color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 2 },
  unitSub: { color: '#ffffffdd', fontSize: 14, marginTop: 2 },
  nodeRow: { alignItems: 'center', marginVertical: 10 },
  startTag: {
    color: colors.green,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  node: {
    width: 72,
    height: 66,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
  },
  nodeCurrent: { borderWidth: 4, borderColor: colors.goldLight, borderBottomWidth: 6 },
  nodeGlyph: { fontSize: 26, color: '#fff' },
  nodeLabel: { marginTop: 6, fontWeight: '700', color: colors.ink },
  chestRow: { alignItems: 'center', marginTop: 8 },
  chest: { fontSize: 40 },
  chestLabel: { color: colors.muted, fontSize: 13, marginTop: 2 },
  comingSoon: { marginTop: 32, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed' },
  comingTitle: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  comingText: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  draftNote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
