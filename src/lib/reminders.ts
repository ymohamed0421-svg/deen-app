import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Settings } from '../state/SettingsProvider';
import { addDays, hijriOf, sunnahFast } from './hijri';
import { PRAYERS, PRAYER_LABELS, prayerTimes } from './prayer';

/** Reminders from the worship tools, scheduled alongside the prayer reminders. */
export type WorshipReminders = { fastReminders: boolean; qadrReminders: boolean; hijriAdjust: number };

const DAYS_AHEAD = 7; // 7 days x 5 prayers = 35, plus at most 7 fasting and 4 Laylat al-Qadr reminders: under iOS's limit of 64

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
 * Schedules a local notification at each of the five prayer times for the next week,
 * plus sunnah fast and Laylat al-Qadr reminders when they're on. They are delivered by
 * the phone even when the app is closed. Calling this again (every time the app opens
 * or settings change) replaces the old schedule.
 */
export async function schedulePrayerReminders(settings: Settings, worship?: WorshipReminders) {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const wantsPrayer = settings.prayerReminders && settings.location;
  if (!wantsPrayer && !worship?.fastReminders && !worship?.qadrReminders) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const now = Date.now();
  let count = 0;
  const schedule = async (title: string, body: string, at: Date) => {
    if (at.getTime() <= now) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'prayer' },
    });
    count++;
  };

  for (let day = 0; day < DAYS_AHEAD; day++) {
    const date = new Date(now + day * 86_400_000);
    const times = settings.location ? prayerTimes(settings.location, settings, date) : null;

    if (wantsPrayer && times) {
      for (const p of PRAYERS) await schedule(`${PRAYER_LABELS[p]} 🕌`, LINES[p], times[p]);
    }

    if (worship?.fastReminders) {
      const fast = sunnahFast(addDays(date, 1), worship.hijriAdjust);
      if (fast) {
        const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 21, 0);
        await schedule('Sunnah fast tomorrow 🌙', `Tomorrow is ${fast.reason}, a sunnah fast. Plan your suhoor.`, at);
      }
    }

    if (worship?.qadrReminders) {
      // Odd nights begin at Maghrib on the 20th, 22nd, 24th, 26th and 28th of Ramadan.
      const h = hijriOf(date, worship.hijriAdjust);
      if (h.month === 9 && h.day >= 20 && h.day <= 28 && h.day % 2 === 0) {
        const at = times?.maghrib ?? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 0);
        await schedule(
          `Night ${h.day + 1} of Ramadan ✨`,
          'Tonight may be Laylat al-Qadr. Pray, read Quran and say: Allahumma innaka ‘Afuwwun tuhibbul-‘afwa fa‘fu ‘anni.',
          at,
        );
      }
    }
  }
  return count;
}
