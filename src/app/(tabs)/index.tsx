import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fanous, SpeechBubble, greetingLine } from '../../components/Fanous';
import { StatsBar } from '../../components/StatsBar';
import { CoursePath } from '../../components/CoursePath';
import { KIDS_COURSE } from '../../content/course-kids';
import { UNITS } from '../../content/units';
import { isDone, isUnlocked, nextLessonId, unitDone } from '../../game/progress';
import { DailyCard } from '../../components/DailyCard';
import { WorshipCard } from '../../components/WorshipCard';
import { useGame } from '../../state/GameProvider';
import { useSettings } from '../../state/SettingsProvider';
import { colors, themed } from '../../theme';

// Nodes wind left and right like a garden path.
const OFFSETS = [0, 50, 70, 40, -10, -60, -70, -40];

export default function PathScreen() {
  const { state, displayStreak, today } = useGame();
  const { settings } = useSettings();
  const level = settings.level ?? 'beginner';
  const next = nextLessonId(state, level);
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

        {settings.kidsMode ? (
          <>
            <View style={styles.quickRow}>
              <QuickLink icon="🌿" label="Garden" onPress={() => router.push('/garden')} />
              <QuickLink icon="ا ب" label="Arabic letters" onPress={() => router.push('/course/arabic')} />
            </View>
            <CoursePath course={KIDS_COURSE} big />
            <Text style={styles.draftNote}>Kids mode is on. Turn it off in More to see the full path.</Text>
            <Text style={styles.draftNote}>Lesson content is a first draft awaiting review by a qualified scholar.</Text>
          </>
        ) : (
          <>
        <View style={styles.quickRow}>
          <QuickLink icon="🌿" label="Garden" onPress={() => router.push('/garden')} />
          <QuickLink icon="🏅" label="League" onPress={() => router.push('/league')} />
          <QuickLink icon="🛍️" label="Shop" onPress={() => router.push('/shop')} />
        </View>

        <WorshipCard />

        <DailyCard />

        <View style={styles.quickRow}>
          <FeatureCard icon="ا ب" title="Read Arabic" text="Letters to Quran words" onPress={() => router.push('/course/arabic')} />
          <FeatureCard icon="🧠" title="Memorize" text="Recite from memory" onPress={() => router.push('/memorize')} />
        </View>

        {UNITS.map((unit, u) => (
          <View key={unit.id} style={styles.unit}>
            <View style={[styles.unitHeader, { backgroundColor: unit.color }]}>
              <Text style={styles.unitKicker}>UNIT {u + 1}</Text>
              <Text style={styles.unitTitle}>{unit.title}</Text>
              <Text style={styles.unitSub}>{unit.subtitle}</Text>
              {unit.tier !== 'beginner' && <Text style={styles.tierTag}>{unit.tier === 'intermediate' ? 'Intermediate' : 'Advanced'}</Text>}
            </View>

            {unit.lessons.map((lesson, i) => {
              const done = isDone(state, lesson.id);
              const open = isUnlocked(state, lesson.id, level);
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
                      { borderBottomColor: done ? '#B9861F' : open ? '#00000040' : colors.lockedDark },
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickLink({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quick} accessibilityRole="button">
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function FeatureCard({ icon, title, text, onPress }: { icon: string; title: string; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.feature} accessibilityRole="button">
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </Pressable>
  );
}

const styles = themed(() => ({
  feature: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line },
  featureIcon: { fontSize: 24, color: colors.blue, fontWeight: '700' },
  featureTitle: { fontWeight: '900', color: colors.ink, fontSize: 16, marginTop: 4 },
  featureText: { color: colors.muted, fontSize: 13, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 12 },
  quick: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: colors.card, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line },
  quickLabel: { fontWeight: '800', color: colors.ink, marginTop: 2 },
  tierTag: { marginTop: 8, alignSelf: 'flex-start', color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1, backgroundColor: '#00000033', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
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
}));
