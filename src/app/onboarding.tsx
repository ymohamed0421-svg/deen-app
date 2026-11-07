import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Fanous, SpeechBubble } from '../components/Fanous';
import { LevelPicker } from '../components/LevelPicker';
import { useSettings, type KnowledgeLevel } from '../state/SettingsProvider';
import { colors } from '../theme';

export default function Onboarding() {
  const { settings, update } = useSettings();
  const [level, setLevel] = useState<KnowledgeLevel | null>(settings.level);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Fanous size={90} mood="cheer" />
          <SpeechBubble text="Assalamu alaikum! I’m Fanous. How well do you know Islam? I’ll shape your lessons to fit you." />
        </View>
        <LevelPicker value={level} onChange={setLevel} />
        <Text style={styles.note}>You can change this any time in More.</Text>
        <Button
          title="Continue"
          disabled={!level}
          onPress={() => {
            if (!level) return;
            update({ level });
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  optionSelected: { borderColor: colors.green, backgroundColor: '#EEF8F2' },
  icon: { fontSize: 34 },
  title: { fontSize: 18, fontWeight: '900', color: colors.ink },
  text: { color: colors.muted, marginTop: 2, lineHeight: 20 },
  note: { color: colors.muted, textAlign: 'center' },
});
