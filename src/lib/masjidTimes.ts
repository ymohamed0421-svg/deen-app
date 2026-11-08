import type { MasjidTimes } from '../../supabase/functions/_shared/masjidPage.ts';
import { supabase } from './supabase';

export type { MasjidTimes };

export const masjidTimesAvailable = Boolean(supabase);

const memo = new Map<string, Promise<MasjidTimes>>();

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Asks the `masjid-times` Edge Function to read today's iqamah and Jumu'ah times off a masjid's website. */
export function fetchMasjidTimes(m: { id: string; name: string; website?: string | null }): Promise<MasjidTimes> {
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

async function signIn() {
  if (!supabase) throw new Error('Not connected');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('Could not sign in.');
  }
  return supabase;
}

async function load(m: { id: string; name: string; website?: string | null }, date: string): Promise<MasjidTimes> {
  const client = await signIn();
  const call = client.functions.invoke('masjid-times', { body: { id: m.id, name: m.name, website: m.website ?? null, date } });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Took too long.')), 45_000));
  const { data, error } = await Promise.race([call, timeout]);
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'Couldn’t read the website.');
  }
  return data as MasjidTimes;
}

export type Correction = { iqamah: MasjidTimes['iqamah']; jumuah: string[] };

/** Saves times an app user typed in, so everyone sees the fixed schedule for this masjid. */
export async function submitCorrection(m: { id: string; name: string }, correction: Correction): Promise<MasjidTimes> {
  const client = await signIn();
  const { data, error } = await client.functions.invoke('masjid-times', { body: { id: m.id, name: m.name, correction } });
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'Couldn’t save the times.');
  }
  const result = data as MasjidTimes;
  memo.set(`${m.id}|${localDate()}`, Promise.resolve(result));
  return result;
}
