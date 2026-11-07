import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Settings } from '../state/SettingsProvider';
import { PRAYERS, PRAYER_LABELS, prayerTimes } from './prayer';

const DAYS_AHEAD = 7; // 7 days x 5 prayers = 35, under iOS's limit of 64 scheduled notifications

const LINES: Record<string, string> = {
  fajr: 'Prayer is better than sleep. Time for Fajr.',
  dhuhr: 'Take a break for Dhuhr.',
  asr: 'Asr has started. Don’t let the afternoon slip by.',
  maghrib: 'The sun has set. Time for Maghrib.',
  isha: 'End your day with Isha.',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Schedules a local notification at each of the five prayer times for the next week.
 * They are delivered by the phone even when the app is closed. Calling this again
 * (every time the app opens or settings change) replaces the old schedule.
 */
export async function schedulePrayerReminders(settings: Settings) {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.prayerReminders || !settings.location) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const now = Date.now();
  let count = 0;
  for (let day = 0; day < DAYS_AHEAD; day++) {
    const times = prayerTimes(settings.location, settings, new Date(now + day * 86_400_000));
    for (const p of PRAYERS) {
      const at = times[p];
      if (at.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: `${PRAYER_LABELS[p]} 🕌`, body: LINES[p], sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'prayer' },
      });
      count++;
    }
  }
  return count;
}
