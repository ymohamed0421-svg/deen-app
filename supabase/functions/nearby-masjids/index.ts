// Finds masjids near a point with TomTom's Search API (free: 2,500 requests a day, no card).
// Make a key at https://developer.tomtom.com, then
//   npx supabase secrets set TOMTOM_API_KEY=...
// Results are saved per ~1 km area for a week, so most opens cost nothing.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { areaKey, isSearchMatch, searchKey, parseTomTom, type PlaceMasjid } from '../_shared/tomtom.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const WEEK_MS = 7 * 86_400_000;
const DAILY_SEARCHES = 100; // new (not saved) searches per person per day

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** One TomTom search: `categorySearch` matches TomTom's own category name, `poiSearch` matches place names. */
async function tomtom(key: string, kind: 'categorySearch' | 'poiSearch', text: string, lat: number, lon: number, radius: number) {
  const url =
    `https://api.tomtom.com/search/2/${kind}/${encodeURIComponent(text)}.json?key=${encodeURIComponent(key)}` +
    `&lat=${lat}&lon=${lon}&radius=${radius}&limit=100`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`TomTom ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return parseTomTom(await res.json());
}

async function search(key: string, lat: number, lon: number): Promise<PlaceMasjid[]> {
  // Ask for mosques by TomTom's category, plus places named "masjid" or "Islamic center"
  // (some are filed under a general category). A dense area has hundreds of churches, so
  // searching all places of worship would crowd masjids out. Everything is filtered again.
  const searches: [Parameters<typeof tomtom>[1], string][] = [
    ['categorySearch', 'mosque'],
    ['poiSearch', 'masjid'],
    ['poiSearch', 'islamic center'],
  ];
  const run = (radius: number) =>
    Promise.all(searches.map(([kind, text]) => tomtom(key, kind, text, lat, lon, radius).catch(() => [] as PlaceMasjid[])));
  let lists = await run(30_000);
  if (lists.flat().length < 5) lists = await run(60_000);
  const all: PlaceMasjid[] = [];
  for (const m of lists.flat()) if (!all.some((o) => o.id === m.id)) all.push(m);
  return all;
}

/** A masjid by name, anywhere: TomTom's fuzzy search, nudged towards where the person is. */
async function searchByName(key: string, query: string, lat: number, lon: number): Promise<PlaceMasjid[]> {
  const url =
    `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${encodeURIComponent(key)}` +
    `&lat=${lat}&lon=${lon}&limit=30&idxSet=POI`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`TomTom ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return parseTomTom(await res.json(), isSearchMatch);
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

  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 80) : '';
  if (body?.query !== undefined && query.length < 2) return json({ error: 'Type at least 2 letters.' }, 400);
  const area = query ? searchKey(query, lat, lon) : areaKey(lat, lon);
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
    let masjids: PlaceMasjid[];
    if (query) {
      masjids = await searchByName(key, query, Number(lat.toFixed(1)), Number(lon.toFixed(1)));
    } else {
      const [cLat, cLon] = area.replace(/^v\d+:/, '').split(',').map(Number);
      masjids = await search(key, cLat, cLon);
    }
    await admin.from('nearby_cache').upsert({ area, result: masjids, fetched_by: auth.user.id, fetched_at: new Date().toISOString() });
    return json({ masjids });
  } catch (error) {
    console.error(error);
    return json({ error: 'search-failed' }, 502);
  }
});
