import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CoursePath } from '../../components/CoursePath';
import { Fanous, SpeechBubble } from '../../components/Fanous';
import { findCourse } from '../../content/courses';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

const INTRO: Record<string, string> = {
  arabic: 'Never read Arabic before? No problem. We’ll go a few letters at a time until you can read words from the Quran.',
  kids: 'Short lessons with big pictures. Take your time!',
};

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = findCourse(String(id));
  const kids = useSettings().settings.kidsMode;
  if (!course) return <Text style={{ padding: 20 }}>Course not found</Text>;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: course.title }} />
      <View style={styles.hero}>
        <Fanous size={64} mood="happy" />
        <SpeechBubble text={INTRO[course.id] ?? course.subtitle} />
      </View>
      <CoursePath course={course} big={kids || course.id === 'kids'} />
      <Text style={styles.note}>Lesson content is a first draft awaiting review by a qualified teacher.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, paddingBottom: 48 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
