import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Fanous, SpeechBubble } from '../components/Fanous';
import { LevelPicker } from '../components/LevelPicker';
import { useSettings, type KnowledgeLevel } from '../state/SettingsProvider';
import { colors, themed } from '../theme';

export default function Onboarding() {
  const { settings, update } = useSettings();
  const [level, setLevel] = useState<KnowledgeLevel | null>(settings.level);
  const [kids, setKids] = useState(settings.kidsMode);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Fanous size={90} mood="cheer" />
          <SpeechBubble text="Assalamu alaikum! I’m Fanous. How well do you know Islam? I’ll shape your lessons to fit you." />
        </View>
        <LevelPicker value={kids ? null : level} onChange={(l) => { setLevel(l); setKids(false); }} />
        <Pressable
          onPress={() => setKids(true)}
          accessibilityRole="radio"
          accessibilityState={{ selected: kids }}
          style={[styles.option, kids && styles.optionSelected]}
        >
          <Text style={styles.icon}>🧒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>For a child</Text>
            <Text style={styles.text}>Kids mode: short, simple lessons with big pictures and a gentle pace.</Text>
          </View>
        </Pressable>
        <Text style={styles.note}>You can change this any time in More.</Text>
        <Button
          title="Continue"
          disabled={!level && !kids}
          onPress={() => {
            if (kids) update({ level: 'beginner', kidsMode: true });
            else if (level) update({ level, kidsMode: false });
            else return;
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
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
  optionSelected: { borderColor: colors.green, backgroundColor: colors.greenLight },
  icon: { fontSize: 34 },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink },
  text: { color: colors.muted, marginTop: 2, lineHeight: 20 },
  note: { color: colors.muted, textAlign: 'center' },
}));
