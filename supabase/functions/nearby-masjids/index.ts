// Finds masjids near a point with TomTom's Search API (free: 2,500 requests a day, no card).
// Make a key at https://developer.tomtom.com, then
//   npx supabase secrets set TOMTOM_API_KEY=...
// Results are saved per ~1 km area for a week, so most opens cost nothing.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { MOSQUE_CATEGORY, WORSHIP_CATEGORY, areaKey, parseTomTom, type PlaceMasjid } from '../_shared/tomtom.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const WEEK_MS = 7 * 86_400_000;
const DAILY_SEARCHES = 60; // new (not saved) searches per person per day

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

async function tomtom(key: string, lat: number, lon: number, radius: number, categorySet: number) {
  const url =
    `https://api.tomtom.com/search/2/nearbySearch/.json?key=${encodeURIComponent(key)}` +
    `&lat=${lat}&lon=${lon}&radius=${radius}&limit=100&categorySet=${categorySet}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`TomTom ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return parseTomTom(await res.json());
}

async function search(key: string, lat: number, lon: number): Promise<PlaceMasjid[]> {
  // Mosques by category, plus every place of worship nearby picked by name (some masjids are
  // filed only as "place of worship"). Widen when few are close.
  const [mosques, worship] = await Promise.all([
    tomtom(key, lat, lon, 25_000, MOSQUE_CATEGORY),
    tomtom(key, lat, lon, 10_000, WORSHIP_CATEGORY).catch(() => [] as PlaceMasjid[]),
  ]);
  let all = [...mosques, ...worship.filter((w) => !mosques.some((m) => m.id === w.id))];
  if (all.length < 5) {
    const far = await tomtom(key, lat, lon, 50_000, MOSQUE_CATEGORY).catch(() => [] as PlaceMasjid[]);
    all = [...all, ...far.filter((f) => !all.some((m) => m.id === f.id))];
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!auth.user) return json({ error: 'Please sign in.' }, 401);

  const body = await req.json().catch(() => null);
  const lat = Number(body?.latitude);
  const lon = Number(body?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return json({ error: 'Bad location.' }, 400);
  }

  const area = areaKey(lat, lon);
  const { data: cached } = await admin.from('nearby_cache').select('result, fetched_at').eq('area', area).maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < WEEK_MS) return json({ masjids: cached.result });

  const key = Deno.env.get('TOMTOM_API_KEY');
  if (!key) return json({ error: 'not-configured' }, 503);

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin
    .from('nearby_cache')
    .select('area', { count: 'exact', head: true })
    .eq('fetched_by', auth.user.id)
    .gte('fetched_at', since);
  if ((count ?? 0) >= DAILY_SEARCHES) return json({ error: 'Try again tomorrow.' }, 429);

  try {
    // Search from the centre of the area so the saved result fits everyone in it.
    const [cLat, cLon] = area.split(',').map(Number);
    const masjids = await search(key, cLat, cLon);
    await admin.from('nearby_cache').upsert({ area, result: masjids, fetched_by: auth.user.id, fetched_at: new Date().toISOString() });
    return json({ masjids });
  } catch (error) {
    console.error(error);
    return json({ error: 'search-failed' }, 502);
  }
});
