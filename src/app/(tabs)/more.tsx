import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyCard } from '../../components/DailyCard';
import { LevelPicker } from '../../components/LevelPicker';
import { useSettings, type ThemeChoice } from '../../state/SettingsProvider';
import { colors, themed } from '../../theme';

const LINKS: { icon: string; title: string; text: string; href: Href }[] = [
  { icon: '🧠', title: 'Memorize the Quran', text: 'Recite from memory and review weak ayahs', href: '/memorize' },
  { icon: '📖', title: 'Read Arabic', text: 'Learn the letters and read the Quran from zero', href: '/course/arabic' },
  { icon: '📿', title: 'Dhikr', text: 'Tasbih counter and morning and evening adhkar', href: '/dhikr' },
  { icon: '🗓️', title: 'Islamic calendar', text: 'Hijri date, Ramadan and Eid countdowns, sunnah fasts', href: '/calendar' },
  { icon: '🌙', title: 'Ramadan', text: 'Suhoor and iftar, fasting tracker, taraweeh plan', href: '/ramadan' },
  { icon: '🕌', title: 'Masjids near you', text: 'Closest masjids, iqamah and Jumu‘ah times, directions', href: '/masjids' },
  { icon: '🍽️', title: 'Halal food nearby', text: 'Halal restaurants and shops close to you', href: '/halal' },
  { icon: '💰', title: 'Zakat calculator', text: 'See if zakat is due on your savings and gold, and how much', href: '/zakat' },
  { icon: '🤲', title: 'Duas', text: 'Everyday duas with Arabic, transliteration and meaning', href: '/duas' },
  { icon: '📜', title: 'Stories', text: 'The Seerah and the Companions', href: '/stories' },
  { icon: '🕋', title: 'Umrah and Hajj guide', text: 'Step by step, day by day', href: '/guide' },
  { icon: '🌿', title: 'Your garden', text: 'Your level and everything you’ve grown', href: '/garden' },
  { icon: '🏅', title: 'Garden League', text: 'This week’s Noor and your tier', href: '/league' },
  { icon: '🛍️', title: 'Shop', text: 'Mercy Days and Oil refills', href: '/shop' },
  { icon: '📍', title: 'Location', text: 'For prayer times and the Qibla', href: '/location' },
];

const THEMES: { id: ThemeChoice; icon: string; label: string }[] = [
  { id: 'system', icon: '📱', label: 'Same as phone' },
  { id: 'light', icon: '☀️', label: 'Light' },
  { id: 'dark', icon: '🌙', label: 'Dark' },
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
        <Text style={[styles.title, { fontSize: 20, marginTop: 12 }]}>Kids mode</Text>
        <View style={styles.row}>
          <Text style={styles.icon}>🧒</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Kids mode</Text>
            <Text style={styles.rowText}>Short, simple lessons with big pictures and gentle feedback. Shows the kids path on the Learn tab.</Text>
          </View>
          <Switch
            value={settings.kidsMode}
            onValueChange={(kidsMode) => update({ kidsMode })}
            trackColor={{ true: colors.green, false: colors.line }}
            accessibilityLabel="Kids mode"
          />
        </View>
        <Text style={[styles.title, { fontSize: 20, marginTop: 12 }]}>Your level</Text>
        <Text style={styles.rowText}>Lessons and questions adjust to the level you choose.</Text>
        <LevelPicker value={settings.level} onChange={(level) => update({ level })} />
        <Text style={[styles.title, { fontSize: 20, marginTop: 12 }]}>Appearance</Text>
        <Text style={styles.rowText}>Dark mode is easier on the eyes at night and for Fajr.</Text>
        <View style={styles.themes}>
          {THEMES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => update({ theme: t.id })}
              style={[styles.theme, settings.theme === t.id && styles.themeOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.theme === t.id }}
            >
              <Text style={styles.icon}>{t.icon}</Text>
              <Text style={styles.rowTitle}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  icon: { fontSize: 28 },
  rowTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  rowText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  chev: { fontSize: 28, color: colors.muted },
  themes: { flexDirection: 'row', gap: 8 },
  theme: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  themeOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
}));
