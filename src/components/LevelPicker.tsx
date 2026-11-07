import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { KnowledgeLevel } from '../state/SettingsProvider';
import { colors } from '../theme';

const LEVELS: { id: KnowledgeLevel; icon: string; title: string; text: string }[] = [
  { id: 'beginner', icon: '🌱', title: 'Beginner', text: 'I’m new to Islam or want to start from the basics: the pillars, wudu and how to pray.' },
  { id: 'intermediate', icon: '🌿', title: 'Intermediate', text: 'I know the basics and pray. I want to learn more about faith, the Seerah and the Companions.' },
  { id: 'advanced', icon: '🌳', title: 'Advanced', text: 'I know a lot already. Give me harder questions, fiqh details and the views of the madhabs.' },
];

export function LevelPicker({ value, onChange }: { value: KnowledgeLevel | null; onChange: (l: KnowledgeLevel) => void }) {
  return (
    <View style={{ gap: 12 }}>
      {LEVELS.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => onChange(l.id)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === l.id }}
          style={[styles.option, value === l.id && styles.optionSelected]}
        >
          <Text style={styles.icon}>{l.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{l.title}</Text>
            <Text style={styles.text}>{l.text}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
  },
  optionSelected: { borderColor: colors.green, backgroundColor: '#EEF8F2' },
  icon: { fontSize: 34 },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink },
  text: { color: colors.muted, marginTop: 2, lineHeight: 20 },
});
