import { useEffect } from 'react';
import { schedulePrayerReminders } from '../lib/reminders';
import { useSettings } from '../state/SettingsProvider';
import { useWorship } from '../state/WorshipProvider';

/** Keeps the next week of prayer, fasting and Laylat al-Qadr reminders scheduled. Runs on launch and when settings change. */
export function ReminderSync() {
  const { ready, settings } = useSettings();
  const { ready: worshipReady, worship } = useWorship();
  const { prayerReminders, location, calcMethod, asrMadhab } = settings;
  const { fastReminders, qadrReminders, hijriAdjust } = worship;
  useEffect(() => {
    if (!ready || !worshipReady) return;
    schedulePrayerReminders(settings, { fastReminders, qadrReminders, hijriAdjust }).catch(() => {});
  }, [ready, worshipReady, prayerReminders, location?.latitude, location?.longitude, calcMethod, asrMadhab, fastReminders, qadrReminders, hijriAdjust]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
