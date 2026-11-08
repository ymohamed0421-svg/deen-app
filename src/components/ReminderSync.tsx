import { useEffect } from 'react';
import { schedulePrayerReminders } from '../lib/reminders';
import { useSettings } from '../state/SettingsProvider';

/** Keeps the next week of prayer reminders scheduled. Runs on launch and when settings change. */
export function ReminderSync() {
  const { ready, settings } = useSettings();
  const { prayerReminders, location, calcMethod, asrMadhab, iqamahReminders, favoriteTimes, iqamahLeadMinutes, favoriteMasjid } = settings;
  useEffect(() => {
    if (!ready) return;
    schedulePrayerReminders(settings).catch(() => {});
  }, [ready, prayerReminders, location?.latitude, location?.longitude, calcMethod, asrMadhab, iqamahReminders, favoriteTimes?.savedAt, iqamahLeadMinutes, favoriteMasjid?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
