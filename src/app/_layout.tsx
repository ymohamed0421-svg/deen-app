import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReminderSync } from '../components/ReminderSync';
import { GameProvider } from '../state/GameProvider';
import { SettingsProvider } from '../state/SettingsProvider';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GameProvider>
          <StatusBar style="dark" />
          <ReminderSync />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.ink,
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="quran/[surah]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="duas" options={{ headerShown: true, title: 'Duas' }} />
            <Stack.Screen name="guide" options={{ headerShown: true, title: 'Umrah and Hajj' }} />
            <Stack.Screen name="stories/index" options={{ headerShown: true, title: 'Stories' }} />
            <Stack.Screen name="stories/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="location" options={{ headerShown: true, title: 'Your location', presentation: 'modal' }} />
          </Stack>
        </GameProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
