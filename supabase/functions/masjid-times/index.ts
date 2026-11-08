// Reads a masjid's own iqamah and Jumu'ah times off its website.
// The page (and any prayer-time widget it embeds) is fetched here, then the free Gemini tier
// picks the times out of the text. Results are kept for a day per masjid in `masjid_times`.
// Needs the same GEMINI_API_KEY secret as the `ask` function.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  EMPTY,
  findScheduleUrls,
  isSafeUrl,
  mentionsPrayerTimes,
  normalizeTimes,
  pageText,
  type MasjidTimes,
} from '../_shared/masjidPage.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
const DAILY_LOOKUPS = 40; // new website reads per person per day; cached answers don't count
const MAX_BYTES = 1_500_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Fetches a public page, following up to 3 redirects and checking each address. */
async function getPage(start: string): Promise<{ url: string; body: string } | null> {
  let url = isSafeUrl(start);
  for (let hop = 0; url && hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'DeenApp/1.0 (reads masjid prayer schedules)', Accept: 'text/html,application/json;q=0.9,*/*;q=0.5' },
    }).catch(() => null);
    if (!res) return null;
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = isSafeUrl(new URL(res.headers.get('location')!, url).href);
      continue;
    }
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!/html|json|text/i.test(type)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    return { url: url.href, body: new TextDecoder().decode(buf.slice(0, MAX_BYTES)) };
  }
  return null;
}

const PROMPT = `You read a mosque's web page text and pull out its prayer schedule.
Return only what the text states. Never guess or calculate a time.
- iqamah: the congregation (iqamah / jama'ah) time for each of the five daily prayers for the date given. If the page lists a weekly or monthly table, use the row for that date. If only adhan/start times are listed and no iqamah, return those but say so in note. Write times as the page does, for example "6:15 AM", or "5 min after sunset" for Maghrib. Use null when a prayer isn't listed.
- jumuah: each Friday prayer (khutbah or salah) time, like "1:30 PM". Empty list when not listed.
- found: false when the text has no prayer schedule for this mosque.
- note: a few words when something needs flagging, otherwise null.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    found: { type: 'BOOLEAN' },
    iqamah: {
      type: 'OBJECT',
      properties: Object.fromEntries(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => [p, { type: 'STRING', nullable: true }])),
    },
    jumuah: { type: 'ARRAY', items: { type: 'STRING' } },
    note: { type: 'STRING', nullable: true },
  },
  required: ['found', 'iqamah', 'jumuah'],
};

async function readTimes(key: string, name: string, date: string, pages: { url: string; text: string }[]) {
  const text = pages.map((p) => `--- ${p.url}\n${p.text}`).join('\n\n').slice(0, 40_000);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `Mosque: ${name}\nDate: ${date}\n\n${text}` }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const out = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
  return JSON.parse(out || '{}');
}

async function lookUp(key: string, website: string, name: string, date: string): Promise<MasjidTimes> {
  const home = await getPage(website);
  if (!home) return EMPTY;
  const pages = [{ url: home.url, text: pageText(home.body) }];
  for (const extra of findScheduleUrls(home.body, new URL(home.url))) {
    const p = await getPage(extra);
    if (p) pages.push({ url: p.url, text: pageText(p.body) });
  }
  const useful = pages.filter((p) => mentionsPrayerTimes(p.text));
  if (useful.length === 0) return { ...EMPTY, source: home.url };
  const source = useful.find((p) => p.url !== home.url)?.url ?? home.url;
  return normalizeTimes(await readTimes(key, name, date, useful), source);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth.user) return json({ error: 'Please sign in.' }, 401);

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id.slice(0, 64) : '';
  const website = typeof body?.website === 'string' ? body.website.slice(0, 300) : '';
  const name = typeof body?.name === 'string' ? body.name.slice(0, 120) : 'Masjid';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body?.date ?? '') ? body.date : new Date().toISOString().slice(0, 10);
  if (!/^((node|way|relation)\/\d+|site\/[a-z0-9-]{1,36}|tt\/[A-Za-z0-9_-]{1,60})$/.test(id) || !isSafeUrl(website)) return json({ error: 'Unknown masjid.' }, 400);

  const { data: cached } = await admin.from('masjid_times').select('result, for_date, website').eq('osm_id', id).maybeSingle();
  if (cached && cached.for_date === date && cached.website === website) return json(cached.result);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'Reading masjid websites is not set up yet.' }, 503);

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin
    .from('masjid_times')
    .select('osm_id', { count: 'exact', head: true })
    .eq('fetched_by', auth.user.id)
    .gte('fetched_at', since);
  if ((count ?? 0) >= DAILY_LOOKUPS) return json({ error: 'Try again tomorrow.' }, 429);

  try {
    const result = await lookUp(key, website, name, date);
    await admin.from('masjid_times').upsert({ osm_id: id, website, for_date: date, result, fetched_by: auth.user.id, fetched_at: new Date().toISOString() });
    return json(result);
  } catch (error) {
    console.error(error);
    return json({ error: 'Couldn’t read that website right now.' }, 502);
  }
});
