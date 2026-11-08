import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Fragment } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReminderSync } from '../components/ReminderSync';
import { TravelCheck } from '../components/TravelCheck';
import { GameProvider } from '../state/GameProvider';
import { RecitationProvider } from '../state/RecitationProvider';
import { SettingsProvider, useSettings } from '../state/SettingsProvider';
import { WorshipProvider } from '../state/WorshipProvider';
import { applyScheme, colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GameProvider>
          <WorshipProvider>
          <RecitationProvider>
          <ReminderSync />
          <ThemedApp />
          <TravelCheck />
          </RecitationProvider>
          </WorshipProvider>
        </GameProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

/**
 * Picks light or dark colours (from the setting, or the phone when it is set
 * to "system") and redraws every screen when that changes.
 */
function ThemedApp() {
  const { settings } = useSettings();
  const system = useColorScheme();
  const scheme = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
  applyScheme(scheme);
  return (
    <Fragment key={scheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen name="garden" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="league" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="shop" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="duas" options={{ headerShown: true, title: 'Duas' }} />
        <Stack.Screen name="guide" options={{ headerShown: true, title: 'Umrah and Hajj' }} />
        <Stack.Screen name="stories/index" options={{ headerShown: true, title: 'Stories' }} />
        <Stack.Screen name="stories/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="zakat" options={{ headerShown: true, title: 'Zakat calculator' }} />
        <Stack.Screen name="masjids" options={{ headerShown: true, title: 'Masjids near you' }} />
        <Stack.Screen name="dhikr" options={{ headerShown: true, title: 'Dhikr' }} />
        <Stack.Screen name="calendar" options={{ headerShown: true, title: 'Islamic calendar' }} />
        <Stack.Screen name="ramadan" options={{ headerShown: true, title: 'Ramadan' }} />
        <Stack.Screen name="halal" options={{ headerShown: true, title: 'Halal food nearby' }} />
        <Stack.Screen name="location" options={{ headerShown: true, title: 'Your location', presentation: 'modal' }} />
      </Stack>
    </Fragment>
  );
}
