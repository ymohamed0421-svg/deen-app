import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { findLesson } from '../../content/units';
import { colors } from '../../theme';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findLesson(String(id));
  if (!found) return <Text style={{ padding: 20 }}>Story not found</Text>;
  const { lesson, unit } = found;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: lesson.title }} />
      <Text style={[styles.kicker, { color: unit.color }]}>{unit.title.toUpperCase()}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      {(lesson.story ?? lesson.teach).split('\n\n').map((p, i) => (
        <Text key={i} style={styles.body}>
          {p}
        </Text>
      ))}
      <Button title="Test yourself" color={unit.color} onPress={() => router.push(`/lesson/${lesson.id}`)} style={{ marginTop: 12 }} />
      <Text style={styles.note}>Draft content, awaiting review by a qualified scholar.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink },
  body: { fontSize: 17, lineHeight: 27, color: colors.ink },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
