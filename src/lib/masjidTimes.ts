import type { MasjidTimes } from '../../supabase/functions/_shared/masjidPage.ts';
import { supabase } from './supabase';

export type { MasjidTimes };

export const masjidTimesAvailable = Boolean(supabase);

const memo = new Map<string, Promise<MasjidTimes>>();

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Asks the `masjid-times` Edge Function to read today's iqamah and Jumu'ah times off a masjid's website. */
export function fetchMasjidTimes(m: { id: string; name: string; website: string }): Promise<MasjidTimes> {
  const date = localDate();
  const key = `${m.id}|${date}`;
  let p = memo.get(key);
  if (!p) {
    p = load(m, date);
    p.catch(() => memo.delete(key));
    memo.set(key, p);
  }
  return p;
}

async function load(m: { id: string; name: string; website: string }, date: string): Promise<MasjidTimes> {
  if (!supabase) throw new Error('Not connected');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('Could not sign in.');
  }
  const { data, error } = await supabase.functions.invoke('masjid-times', { body: { ...m, date } });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'Couldn’t read the website.');
  }
  return data as MasjidTimes;
}
