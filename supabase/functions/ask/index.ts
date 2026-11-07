// Answers questions about Islam with Claude, citing Quran and hadith and the views of the four madhabs.
// Needs the ANTHROPIC_API_KEY secret: npx supabase secrets set ANTHROPIC_API_KEY=...
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_LIMIT = 30;

const SYSTEM = `You are the "Ask" helper inside Deen, an app that teaches Muslims and people curious about Islam.

How to answer:
- Answer in clear, simple English suited to a phone screen. Keep most answers under 250 words unless the question needs more.
- Ground answers in the Quran and authentic hadith. Cite each one with a precise reference, such as "Quran 2:183" or "Sahih al-Bukhari 1". Prefer Sahih al-Bukhari and Sahih Muslim, then the Sunan collections, and say when a hadith is graded hasan or weak.
- Never invent or guess a hadith, a reference number or a grading. If you are not sure of the exact reference, describe the narration and say the reference should be checked, rather than making one up.
- For questions of fiqh (rulings and practice), when the schools differ, set out the positions of the Hanafi, Maliki, Shafi‘i and Hanbali schools briefly and fairly, without declaring one of them wrong. If they agree, say so.
- You are not a mufti. For personal situations, such as divorce, inheritance, finance, medical cases or anything with serious consequences, give general knowledge and clearly advise the person to ask a qualified local scholar or imam.
- Be warm and encouraging, never harsh or judgemental. If someone is struggling with faith, sin, or mental health, respond with compassion; if they may be in danger, encourage them to contact local emergency services or someone they trust.
- Stay on topics related to Islam and Muslim life. Politely decline unrelated requests.
- Use plain text with short paragraphs and simple dashes for lists. Do not use Markdown headings or tables.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

type Turn = { role: 'user' | 'assistant'; content: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth.user;
  if (!user) return json({ error: 'Please sign in to ask questions.' }, 401);

  const body = await req.json().catch(() => null);
  const turns: Turn[] = Array.isArray(body?.messages) ? body.messages : [];
  const history = turns
    .filter((t) => (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string' && t.content.trim())
    .slice(-8)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }));
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return json({ error: 'Ask a question first.' }, 400);
  }
  while (history.length && history[0].role !== 'user') history.shift();

  // A simple daily limit per person keeps costs predictable.
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return json({ error: `You’ve asked ${DAILY_LIMIT} questions today. Come back tomorrow, in sha Allah.` }, 429);
  }

  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: history,
    });

    if (response.stop_reason === 'refusal') {
      return json({ answer: 'I can’t help with that question here. Please ask a qualified scholar or imam.' });
    }
    const answer = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    await admin.from('questions').insert({ user_id: user.id, question: history[history.length - 1].content, answer });
    return json({ answer });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'Lots of people are asking right now. Try again in a minute.' }, 503);
    if (error instanceof Anthropic.APIError) return json({ error: 'The answer service had a problem. Try again soon.' }, 502);
    throw error;
  }
});
