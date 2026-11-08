import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { Course } from '../content/types';
import { courseLessonOpen, courseNextLesson, isDone } from '../game/progress';
import { useGame } from '../state/GameProvider';
import { colors, themed } from '../theme';

/** A course's lessons as a list of cards that open one after another. `big` is for Kids mode. */
export function CoursePath({ course, big = false }: { course: Course; big?: boolean }) {
  const { state } = useGame();
  const next = courseNextLesson(state, course.units);
  const all = course.units.flatMap((u) => u.lessons);
  const done = all.filter((l) => isDone(state, l.id)).length;

  return (
    <View>
      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(done / all.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {done}/{all.length}
        </Text>
      </View>
      {course.units.map((unit) => (
        <View key={unit.id} style={{ marginTop: 16 }}>
          <View style={[styles.unitHeader, { backgroundColor: unit.color }]}>
            <Text style={[styles.unitTitle, big && { fontSize: 24 }]}>{unit.title}</Text>
            <Text style={styles.unitSub}>{unit.subtitle}</Text>
          </View>
          <View style={big ? styles.kidsGrid : { gap: 10 }}>
            {unit.lessons.map((lesson) => {
              const finished = isDone(state, lesson.id);
              const open = courseLessonOpen(state, course.units, lesson.id);
              const current = lesson.id === next;
              const art = lesson.picture ?? lesson.cards?.[0]?.big ?? '▶';
              return (
                <Pressable
                  key={lesson.id}
                  disabled={!open}
                  onPress={() => router.push(`/lesson/${lesson.id}`)}
                  accessibilityLabel={`${lesson.title}${finished ? ', done' : open ? '' : ', locked'}`}
                  style={({ pressed }) => [
                    big ? styles.kidsCard : styles.row,
                    current && { borderColor: unit.color },
                    !open && { opacity: 0.5 },
                    pressed && { transform: [{ translateY: 2 }] },
                  ]}
                >
                  <View style={[big ? styles.kidsArt : styles.art, { backgroundColor: finished ? colors.goldLight : open ? `${unit.color}22` : colors.line }]}>
                    <Text style={big ? styles.kidsArtText : styles.artText}>{open ? art : '🔒'}</Text>
                  </View>
                  <View style={big ? { alignItems: 'center' } : { flex: 1 }}>
                    <Text style={[styles.lessonTitle, big && styles.kidsTitle]}>{lesson.title}</Text>
                    {current && <Text style={[styles.tag, { color: unit.color }]}>{big ? 'TAP TO PLAY' : 'START HERE'}</Text>}
                    {finished && <Text style={styles.done}>★ Done</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = themed(() => ({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.gold },
  progressText: { fontWeight: '800', color: colors.muted },
  unitHeader: { borderRadius: 16, padding: 16, marginBottom: 12 },
  unitTitle: { color: '#fff', fontWeight: '800', fontSize: 20 },
  unitSub: { color: '#ffffffdd', fontSize: 14, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line },
  art: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  artText: { fontSize: 26, color: colors.ink },
  lessonTitle: { fontWeight: '800', fontSize: 16, color: colors.ink },
  tag: { fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 2 },
  done: { color: colors.goldInk, fontWeight: '800', fontSize: 12, marginTop: 2 },
  kidsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kidsCard: { width: '47%', flexGrow: 1, alignItems: 'center', gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.card, borderWidth: 3, borderBottomWidth: 6, borderColor: colors.line },
  kidsArt: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  kidsArtText: { fontSize: 54 },
  kidsTitle: { fontSize: 18, textAlign: 'center' },
}));
