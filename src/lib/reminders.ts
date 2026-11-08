import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Settings } from '../state/SettingsProvider';
import { iqamahReminders } from './clock';
import { PRAYERS, PRAYER_LABELS, prayerTimes } from './prayer';

// 7 days x 5 prayers = 35, under iOS's limit of 64 scheduled notifications. With iqamah reminders
// for a favorite masjid too, 6 days x (5 + 5) + one Jumu'ah = 61.
const DAYS_AHEAD = 7;
const DAYS_AHEAD_WITH_IQAMAH = 6;

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
  const iqamah = settings.iqamahReminders && settings.favoriteMasjid && settings.favoriteTimes ? settings.favoriteTimes : null;
  const adhan = settings.prayerReminders && settings.location;
  if (!adhan && !iqamah) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const now = Date.now();
  const days = iqamah ? DAYS_AHEAD_WITH_IQAMAH : DAYS_AHEAD;
  const at = (date: Date, title: string, body: string) =>
    Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'prayer' },
    });
  let count = 0;
  for (let day = 0; day < days; day++) {
    const date = new Date(now + day * 86_400_000);
    if (adhan && settings.location) {
      const times = prayerTimes(settings.location, settings, date);
      for (const p of PRAYERS) {
        if (times[p].getTime() <= now) continue;
        await at(times[p], `${PRAYER_LABELS[p]} 🕌`, LINES[p]);
        count++;
      }
    }
    if (iqamah && settings.favoriteMasjid) {
      for (const r of iqamahReminders(iqamah, date, settings.iqamahLeadMinutes, settings.favoriteMasjid.name)) {
        if (r.at.getTime() <= now) continue;
        await at(r.at, r.title, r.body);
        count++;
      }
    }
  }
  return count;
}
