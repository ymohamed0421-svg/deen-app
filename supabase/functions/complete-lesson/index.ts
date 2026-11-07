// Records a finished lesson and awards Noor, Pearls, the streak and a garden plant.
// The rules are the same file the app uses, so the server and the app always agree.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { completeLesson, newGameState, toDateKey, type GameState } from '../_shared/rules.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Today's date in the user's own time zone, so a streak day matches their local day. */
function localDateKey(timezone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now); // YYYY-MM-DD
  } catch {
    return toDateKey(now);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth.user;
  if (!user) return json({ error: 'not signed in' }, 401);

  const { lessonId, mistakes, isReview, timezone } = await req.json();
  if (typeof lessonId !== 'string' || typeof mistakes !== 'number' || mistakes < 0) {
    return json({ error: 'bad request' }, 400);
  }

  const { data: lesson } = await admin.from('lessons').select('id, unit_id').eq('id', lessonId).single();
  if (!lesson) return json({ error: 'unknown lesson' }, 404);

  const [{ data: profile }, { data: streak }, { data: wallet }, { data: progress }, { data: unitLessons }] =
    await Promise.all([
      admin.from('profiles').select('noor, timezone').eq('id', user.id).single(),
      admin.from('streaks').select('*').eq('user_id', user.id).single(),
      admin.from('wallets').select('*').eq('user_id', user.id).single(),
      admin.from('lesson_progress').select('lesson_id, best_mistakes, completed_at').eq('user_id', user.id),
      admin.from('lessons').select('id').eq('unit_id', lesson.unit_id),
    ]);

  const now = new Date();
  const tz = typeof timezone === 'string' ? timezone : profile?.timezone ?? 'UTC';
  const today = localDateKey(tz, now);

  const state: GameState = {
    ...newGameState(now.getTime(), today),
    noor: profile?.noor ?? 0,
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      lastActiveDate: streak?.last_active_date ?? null,
    },
    wallet: {
      oil: wallet?.oil ?? 5,
      oilUpdatedAt: wallet ? new Date(wallet.oil_updated_at).getTime() : now.getTime(),
      pearls: wallet?.pearls ?? 0,
      mercyDays: wallet?.mercy_days ?? 0,
    },
    completedLessons: Object.fromEntries(
      (progress ?? []).map((p) => [p.lesson_id, { bestMistakes: p.best_mistakes, completedAt: new Date(p.completed_at).getTime() }]),
    ),
  };

  const done = new Set(Object.keys(state.completedLessons));
  const unitFinished =
    !isReview && !done.has(lessonId) && (unitLessons ?? []).every((l) => l.id === lessonId || done.has(l.id));

  const result = completeLesson(state, { lessonId, mistakes, unitFinished, isReview: Boolean(isReview) }, now.getTime(), today);
  const s = result.state;
  const r = result.rewards;
  const previous = state.completedLessons[lessonId];

  await Promise.all([
    admin.from('profiles').update({ noor: s.noor, timezone: tz }).eq('id', user.id),
    admin
      .from('streaks')
      .upsert({ user_id: user.id, current: s.streak.current, longest: s.streak.longest, last_active_date: s.streak.lastActiveDate }),
    admin.from('wallets').upsert({
      user_id: user.id,
      oil: s.wallet.oil,
      oil_updated_at: new Date(s.wallet.oilUpdatedAt).toISOString(),
      pearls: s.wallet.pearls,
      mercy_days: s.wallet.mercyDays,
    }),
    isReview
      ? Promise.resolve()
      : admin.from('lesson_progress').upsert({
          user_id: user.id,
          lesson_id: lessonId,
          best_mistakes: s.completedLessons[lessonId].bestMistakes,
          attempts: previous ? undefined : 1,
        }),
    admin.from('points_ledger').insert({ user_id: user.id, noor: r.noor, pearls: r.pearls, reason: `lesson:${lessonId}` }),
    r.firstTime ? admin.from('garden_items').insert({ user_id: user.id, kind: 'plant', lesson_id: lessonId }) : Promise.resolve(),
  ]);

  // Add the week's Noor to the user's current league, if they are in one.
  const { data: membership } = await admin
    .from('league_members')
    .select('league_id, weekly_noor, leagues!inner(week_start)')
    .eq('user_id', user.id)
    .eq('leagues.week_start', s.weekStart)
    .maybeSingle();
  if (membership) {
    await admin
      .from('league_members')
      .update({ weekly_noor: membership.weekly_noor + r.noor })
      .eq('league_id', membership.league_id)
      .eq('user_id', user.id);
  }

  return json({ rewards: r, streak: s.streak, wallet: s.wallet, noor: s.noor });
});
