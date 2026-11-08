import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Null until the Supabase URL and anon key are set in .env.local. The app then works offline only. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

let signingIn: Promise<boolean> | null = null;

/**
 * Makes sure there is a signed-in user, creating an anonymous guest the first time,
 * so progress and friends are saved before someone makes a real account.
 * Returns false when offline or Supabase isn't set up.
 */
export async function ensureSession(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  if (data.session) return true;
  // Two callers at once would otherwise create two guest accounts.
  signingIn ??= supabase.auth
    .signInAnonymously()
    .then(({ error }) => !error)
    .catch(() => false)
    .finally(() => {
      signingIn = null;
    });
  return signingIn;
}
