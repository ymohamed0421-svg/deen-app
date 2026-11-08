// Plain helpers for Friends and streak buddies. No app imports, so they run under `node --test`.

export type NudgeKind = 'pray' | 'study';

export type Friend = {
  friend_id: string;
  name: string;
  streak: number;
  studied_today: boolean;
  prayers_today: number | null; // null until they use the prayer tracker today
  buddy_streak: number;
  nudged_pray: boolean;
  nudged_study: boolean;
};

export const WEB_APP_URL = 'https://ymohamed0421-svg.github.io/deen-app';
const CODE_ALPHABET = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g;

/** Cleans what someone typed or pasted: "abc-12x", a full invite link, or a code with spaces. */
export function normalizeCode(input: string): string {
  const fromLink = /[?&]code=([A-Za-z0-9-]+)/.exec(input)?.[1];
  // Codes never use 0, O, 1 or I, so anything outside the alphabet is a typo or a separator.
  return (fromLink ?? input).toUpperCase().replace(CODE_ALPHABET, '').slice(0, 6);
}

export function isCompleteCode(code: string) {
  return code.length === 6;
}

/** Shows a code as "ABC 234" so it's easy to read out loud. */
export function formatCode(code: string) {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

export function inviteLink(code: string) {
  return `${WEB_APP_URL}/friends?code=${code}`;
}

export function inviteMessage(code: string, name: string | null) {
  const who = name ? `${name} wants` : 'I want';
  return `${who} to be your streak buddy on Deen 🪔 Let's keep each other going with prayer and learning.\n\nTap to add me: ${inviteLink(code)}\nOr enter my friend code: ${formatCode(code)}`;
}

/** Which nudges make sense right now. Nobody gets nudged for something they've already done. */
export function nudgeOptions(f: Friend): NudgeKind[] {
  const out: NudgeKind[] = [];
  if (f.prayers_today === null || f.prayers_today < 5) out.push('pray');
  if (!f.studied_today) out.push('study');
  return out;
}

export function nudgeButtonLabel(kind: NudgeKind) {
  return kind === 'pray' ? '🤲 Nudge to pray' : '📖 Nudge to study';
}

/** The notification a friend sees when a nudge arrives. */
export function nudgeNotification(fromName: string, kind: NudgeKind): { title: string; body: string } {
  return kind === 'pray'
    ? { title: `${fromName} is thinking of you`, body: 'A gentle reminder to pray. Every prayer counts, even a late one. 🤲' }
    : { title: `${fromName} sent you a nudge`, body: 'Keep your streak alive with a quick lesson today. 🪔' };
}

/** One line under a friend's name. */
export function statusLine(f: Friend): string {
  const study = f.studied_today ? '✅ Studied today' : '⏳ Hasn’t studied yet';
  const pray =
    f.prayers_today === null ? null : f.prayers_today >= 5 ? '🕌 All 5 prayers' : `🕌 ${f.prayers_today}/5 prayers`;
  return pray ? `${study} · ${pray}` : study;
}

/** Friends who still have something left today come first, then by name. */
export function sortFriends(list: Friend[]): Friend[] {
  return [...list].sort((a, b) => {
    const ad = a.studied_today && (a.prayers_today ?? 0) >= 5 ? 1 : 0;
    const bd = b.studied_today && (b.prayers_today ?? 0) >= 5 ? 1 : 0;
    return ad - bd || b.buddy_streak - a.buddy_streak || a.name.localeCompare(b.name);
  });
}

/** Turns a database error into something a person can act on. */
export function friendlyError(message: string | undefined): string {
  const m = message ?? '';
  if (/No one has that friend code/i.test(m)) return 'No one has that friend code. Check it and try again.';
  if (/your own friend code/i.test(m)) return 'That’s your own friend code. Send it to a friend instead!';
  if (/up to 100 friends/i.test(m)) return 'You can have up to 100 friends.';
  if (/display_name_length/i.test(m)) return 'Names can be up to 30 letters.';
  if (/fetch|network|Failed to/i.test(m)) return 'Couldn’t reach the internet. Try again in a moment.';
  if (/function .* does not exist|Could not find the function/i.test(m)) return 'Friends aren’t switched on yet. Try again later.';
  return 'Something went wrong. Try again in a moment.';
}
