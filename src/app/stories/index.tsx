import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { STORY_UNITS } from '../../content/units-stories';
import { colors, themed } from '../../theme';

export default function StoriesScreen() {
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      {STORY_UNITS.map((unit) => (
        <View key={unit.id} style={{ gap: 10 }}>
          <Text style={styles.unit}>{unit.title}</Text>
          {unit.lessons.map((l, i) => (
            <Pressable key={l.id} onPress={() => router.push(`/stories/${l.id}`)} style={styles.row}>
              <View style={[styles.num, { backgroundColor: unit.color }]}>
                <Text style={styles.numText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{l.title}</Text>
                <Text style={styles.text} numberOfLines={2}>
                  {l.teach}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = themed(() => ({
  unit: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontWeight: '900' },
  title: { fontWeight: '800', fontSize: 16, color: colors.ink },
  text: { color: colors.muted, marginTop: 2, lineHeight: 19 },
}));
