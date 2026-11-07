import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

const icon = (glyph: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>
);

export default function TabsLayout() {
  const { ready, settings } = useSettings();
  if (ready && !settings.level) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: 2 },
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Learn', tabBarIcon: icon('🧭') }} />
      <Tabs.Screen name="quran" options={{ title: 'Quran', tabBarIcon: icon('📖') }} />
      <Tabs.Screen name="prayer" options={{ title: 'Prayer', tabBarIcon: icon('🕌') }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask', tabBarIcon: icon('💬') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('✨') }} />
    </Tabs>
  );
}
