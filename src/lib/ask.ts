import { supabase } from './supabase';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const askAvailable = Boolean(supabase);

/** Sends the conversation to the `ask` Edge Function and returns the answer text. */
export async function askQuestion(messages: ChatTurn[]): Promise<string> {
  if (!supabase) throw new Error('Connect Supabase to turn on questions. See the README.');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('Could not sign in. Check your connection and try again.');
  }
  const { data, error } = await supabase.functions.invoke('ask', { body: { messages } });
  if (error) {
    // The function returns a friendly message in its JSON body for limits and errors.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error ?? 'Something went wrong. Please try again.');
  }
  return (data as { answer: string }).answer;
}
