import { toDateKey } from '../game/rules';
import { friendlyError, normalizeCode, sortFriends, type Friend, type NudgeKind } from './friendsLogic';
import { ensureSession, supabase } from './supabase';

export class FriendsError extends Error {}

function client() {
  if (!supabase) throw new FriendsError('Friends need an internet connection to the Deen server.');
  return supabase;
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const sb = client();
  if (!(await ensureSession())) throw new FriendsError('Couldn’t sign you in. Check your internet and try again.');
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new FriendsError(friendlyError(error.message));
  return data as T;
}

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getFriendCode = () => rpc<string>('my_friend_code');

export async function addFriend(codeOrLink: string) {
  return rpc<string>('add_friend', { p_code: normalizeCode(codeOrLink) });
}

export const removeFriend = (friendId: string) => rpc<void>('remove_friend', { p_friend: friendId });

export async function listFriends() {
  return sortFriends((await rpc<Friend[]>('my_friends')) ?? []);
}

/** True when sent, false when this nudge was already sent to them today. */
export const sendNudge = (friendId: string, kind: NudgeKind) => rpc<boolean>('send_nudge', { p_friend: friendId, p_kind: kind });

export type IncomingNudge = { id: number; from_name: string; kind: NudgeKind; created_at: string };

/** New nudges for the user. Each one is returned once. Quiet if not signed in or offline. */
export async function takeNudges(): Promise<IncomingNudge[]> {
  if (!supabase) return [];
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return [];
  const { data, error } = await supabase.rpc('take_nudges');
  return error ? [] : ((data ?? []) as IncomingNudge[]);
}

export async function getMyName(): Promise<string | null> {
  const sb = client();
  if (!(await ensureSession())) return null;
  const { data: s } = await sb.auth.getSession();
  const { data } = await sb.from('profiles').select('display_name').eq('id', s.session!.user.id).maybeSingle();
  return (data?.display_name as string | null) ?? null;
}

export async function setMyName(name: string) {
  const sb = client();
  if (!(await ensureSession())) throw new FriendsError('Couldn’t sign you in. Check your internet and try again.');
  const { data: s } = await sb.auth.getSession();
  const { error } = await sb.from('profiles').update({ display_name: name.trim().slice(0, 30) }).eq('id', s.session!.user.id);
  if (error) throw new FriendsError(friendlyError(error.message));
}

/**
 * Tells friends about the user's day. Only runs for people who already have an account
 * (they finished a lesson or opened Friends), so it never signs anyone up by itself.
 * Leave a field out to keep what was shared before. Returns true once it's saved.
 */
export async function shareStatus(status: { studied?: boolean; prayers?: number; streak?: number }): Promise<boolean> {
  if (!supabase) return false;
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return false;
  const { error } = await supabase.rpc('share_status', {
    p_day: toDateKey(new Date()),
    p_timezone: timezone(),
    p_studied: status.studied ?? null,
    p_prayers: status.prayers ?? null,
    p_streak: status.streak ?? null,
  });
  return !error;
}
