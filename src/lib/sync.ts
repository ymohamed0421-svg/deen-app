import type { LessonOutcome } from '../game/rules';
import { supabase } from './supabase';

/**
 * Sends a finished lesson to the `complete-lesson` Edge Function, which recomputes
 * rewards on the server so streaks, Noor and leagues can't be faked.
 * Signs the user in anonymously the first time so progress is saved before they make an account.
 */
export async function syncLessonCompletion(outcome: LessonOutcome) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return;
  }
  await supabase.functions.invoke('complete-lesson', {
    body: { ...outcome, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });
}
