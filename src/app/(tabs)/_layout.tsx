import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../theme';

const icon = (glyph: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>
);

export default function TabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Path', tabBarIcon: icon('🧭') }} />
      <Tabs.Screen name="garden" options={{ title: 'Garden', tabBarIcon: icon('🌿') }} />
      <Tabs.Screen name="league" options={{ title: 'League', tabBarIcon: icon('🏅') }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: icon('🛍️') }} />
    </Tabs>
  );
}
