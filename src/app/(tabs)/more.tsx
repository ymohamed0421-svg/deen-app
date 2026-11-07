import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyCard } from '../../components/DailyCard';
import { LevelPicker } from '../../components/LevelPicker';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

const LINKS: { icon: string; title: string; text: string; href: Href }[] = [
  { icon: '🤲', title: 'Duas', text: 'Everyday duas with Arabic, transliteration and meaning', href: '/duas' },
  { icon: '📜', title: 'Stories', text: 'The Seerah and the Companions', href: '/stories' },
  { icon: '🕋', title: 'Umrah and Hajj guide', text: 'Step by step, day by day', href: '/guide' },
  { icon: '🌿', title: 'Your garden', text: 'Your level and everything you’ve grown', href: '/garden' },
  { icon: '🏅', title: 'Garden League', text: 'This week’s Noor and your tier', href: '/league' },
  { icon: '🛍️', title: 'Shop', text: 'Mercy Days and Oil refills', href: '/shop' },
  { icon: '📍', title: 'Location', text: 'For prayer times and the Qibla', href: '/location' },
];

export default function MoreScreen() {
  const { settings, update } = useSettings();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
        <Text style={styles.title}>More</Text>
        <DailyCard />
        {LINKS.map((l) => (
          <Pressable key={l.title} onPress={() => router.push(l.href)} style={styles.row}>
            <Text style={styles.icon}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{l.title}</Text>
              <Text style={styles.rowText}>{l.text}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
        <Text style={[styles.title, { fontSize: 20, marginTop: 12 }]}>Your level</Text>
        <Text style={styles.rowText}>Lessons and questions adjust to the level you choose.</Text>
        <LevelPicker value={settings.level} onChange={(level) => update({ level })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  icon: { fontSize: 28 },
  rowTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  rowText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  chev: { fontSize: 28, color: colors.muted },
});
