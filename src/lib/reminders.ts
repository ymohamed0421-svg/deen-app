import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Settings } from '../state/SettingsProvider';
import { iqamahReminders } from './clock';
import { addDays, hijriOf, sunnahFast } from './hijri';
import { PRAYERS, PRAYER_LABELS, prayerTimes } from './prayer';

// 7 days x 5 prayers = 35, under iOS's limit of 64 scheduled notifications. With iqamah reminders
// for a favorite masjid too, 6 days x (5 + 5) + one Jumu'ah = 61.
const DAYS_AHEAD = 7;
const DAYS_AHEAD_WITH_IQAMAH = 6;
// Fasting and Laylat al-Qadr reminders add at most two a day: 5 x (5 + 5 + 2) + one Jumu'ah = 61.
const DAYS_AHEAD_WITH_IQAMAH_AND_WORSHIP = 5;

/** Reminders from the worship tools, scheduled alongside the prayer reminders. */
export type WorshipReminders = { fastReminders: boolean; qadrReminders: boolean; hijriAdjust: number };

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
 * plus iqamah, sunnah fast and Laylat al-Qadr reminders when they're on.
 * They are delivered by the phone even when the app is closed. Calling this again
 * (every time the app opens or settings change) replaces the old schedule.
 */
export async function schedulePrayerReminders(settings: Settings, worship?: WorshipReminders) {
  if (Platform.OS === 'web') return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const iqamah = settings.iqamahReminders && settings.favoriteMasjid && settings.favoriteTimes ? settings.favoriteTimes : null;
  const adhan = settings.prayerReminders && settings.location;
  const extras = Boolean(worship?.fastReminders || worship?.qadrReminders);
  if (!adhan && !iqamah && !extras) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer', {
      name: 'Prayer times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const now = Date.now();
  const days = iqamah ? (extras ? DAYS_AHEAD_WITH_IQAMAH_AND_WORSHIP : DAYS_AHEAD_WITH_IQAMAH) : DAYS_AHEAD;
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
    if (worship?.fastReminders) {
      const fast = sunnahFast(addDays(date, 1), worship.hijriAdjust);
      const when = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 21, 0);
      if (fast && when.getTime() > now) {
        await at(when, 'Sunnah fast tomorrow 🌙', `Tomorrow is ${fast.reason}, a sunnah fast. Plan your suhoor.`);
        count++;
      }
    }
    if (worship?.qadrReminders) {
      // Odd nights begin at Maghrib on the 20th, 22nd, 24th, 26th and 28th of Ramadan.
      const h = hijriOf(date, worship.hijriAdjust);
      if (h.month === 9 && h.day >= 20 && h.day <= 28 && h.day % 2 === 0) {
        const when = settings.location
          ? prayerTimes(settings.location, settings, date).maghrib
          : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 0);
        if (when.getTime() > now) {
          await at(
            when,
            `Night ${h.day + 1} of Ramadan ✨`,
            'Tonight may be Laylat al-Qadr. Pray, read Quran and say: Allahumma innaka ‘Afuwwun tuhibbul-‘afwa fa‘fu ‘anni.',
          );
          count++;
        }
      }
    }
  }
  return count;
}
