import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReminderSync } from '../components/ReminderSync';
import { TravelCheck } from '../components/TravelCheck';
import { GameProvider } from '../state/GameProvider';
import { RecitationProvider } from '../state/RecitationProvider';
import { SettingsProvider } from '../state/SettingsProvider';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <GameProvider>
          <RecitationProvider>
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
            <Stack.Screen name="garden" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="league" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="shop" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="duas" options={{ headerShown: true, title: 'Duas' }} />
            <Stack.Screen name="guide" options={{ headerShown: true, title: 'Umrah and Hajj' }} />
            <Stack.Screen name="stories/index" options={{ headerShown: true, title: 'Stories' }} />
            <Stack.Screen name="stories/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="memorize/index" options={{ headerShown: true, title: 'Memorize the Quran' }} />
            <Stack.Screen name="memorize/practice" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="course/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="masjids" options={{ headerShown: true, title: 'Masjids near you' }} />
            <Stack.Screen name="halal" options={{ headerShown: true, title: 'Halal food nearby' }} />
            <Stack.Screen name="location" options={{ headerShown: true, title: 'Your location', presentation: 'modal' }} />
          </Stack>
          <TravelCheck />
          </RecitationProvider>
        </GameProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
