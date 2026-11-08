import { supabase } from './supabase';

/**
 * Shares how many of today's five prayers are logged, so friends can see it.
 * Best effort: works offline and before the server function exists.
 */
export async function reportPrayers(day: string, count: number) {
  try {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) return;
    }
    await supabase.rpc('report_prayers', { p_day: day, p_count: count });
  } catch {
    // ignore: sharing is optional
  }
}
