import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DUAS } from '../content/daily';
import { colors } from '../theme';

export default function DuasScreen() {
  const categories = [...new Set(DUAS.map((d) => d.category))];
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      {categories.map((c) => (
        <View key={c} style={{ gap: 12 }}>
          <Text style={styles.category}>{c}</Text>
          {DUAS.filter((d) => d.category === c).map((d) => (
            <View key={d.title} style={styles.card}>
              <Text style={styles.title}>{d.title}</Text>
              <Text style={styles.arabic}>{d.arabic}</Text>
              <Text style={styles.translit}>{d.transliteration}</Text>
              <Text style={styles.english}>{d.english}</Text>
              <Text style={styles.ref}>{d.reference}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  category: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 8 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16 },
  title: { fontWeight: '800', fontSize: 16, color: colors.ink },
  arabic: { fontSize: 26, lineHeight: 46, textAlign: 'right', color: colors.ink, marginTop: 8, writingDirection: 'rtl' },
  translit: { color: colors.green, fontStyle: 'italic', marginTop: 6, lineHeight: 21 },
  english: { color: colors.ink, marginTop: 6, lineHeight: 22, fontSize: 15 },
  ref: { color: colors.muted, fontSize: 12, marginTop: 8 },
});
