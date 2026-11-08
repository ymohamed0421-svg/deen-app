// Nearby masjids from OpenStreetMap, through the free Overpass API. No key, no cost.
// OpenStreetMap rarely has a masjid's iqamah schedule, so the app shows prayer start
// times calculated for the masjid's spot and links to the masjid's own website or phone.

export type Masjid = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  km: number;
  address: string | null;
  website: string | null;
  phone: string | null;
  /** OpenStreetMap's `service_times` tag, when a mapper added the masjid's schedule. */
  serviceTimes: string | null;
};

export type OsmElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/**
 * Close by, fetch every place of worship and community centre (fast: indexed tags) and pick masjids
 * out of them here, because many masjids are mapped without religion=muslim. Farther out, only
 * ask for ones tagged as Muslim, so the reply stays small.
 */
export function buildQuery(latitude: number, longitude: number, radiusMeters: number, broad = true) {
  const around = `(around:${Math.round(radiusMeters)},${latitude.toFixed(5)},${longitude.toFixed(5)})`;
  const parts = broad
    ? [`nwr["amenity"="place_of_worship"]${around};`, `nwr["amenity"="community_centre"]${around};`, `nwr["building"="mosque"]${around};`]
    : [`nwr["amenity"="place_of_worship"]["religion"="muslim"]${around};`, `nwr["building"="mosque"]${around};`];
  return `[out:json][timeout:25];(${parts.join('')});out center tags;`;
}

const MASJID_NAME = /masjid|mosque|islamic|musall|jamia|jame\b|muslim|ummah|\bmadina|medina|\bdar al|\bdar-al|\bdarul|\bmakkah|\bmecca/i;

/** True for elements that look like a masjid, even when the map lacks religion=muslim. */
export function isMasjid(t: Record<string, string>) {
  if (t.religion === 'muslim' || t.building === 'mosque') return true;
  if (t.religion && t.religion !== 'muslim') return false;
  return MASJID_NAME.test(`${t.name ?? ''} ${t['name:en'] ?? ''} ${t.official_name ?? ''}`);
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function addressOf(t: Record<string, string>) {
  if (t['addr:full']) return t['addr:full'];
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const parts = [street, t['addr:city'], t['addr:state']].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function cleanUrl(url: string | undefined) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Turns an Overpass reply into masjids sorted nearest first, with unnamed and duplicate entries dropped. */
export function parseOverpass(json: { elements?: OsmElement[] }, latitude: number, longitude: number): Masjid[] {
  const out: Masjid[] = [];
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const t = el.tags ?? {};
    if (lat == null || lon == null || !isMasjid(t)) continue;
    const name = t['name:en'] || t.name || t['official_name'];
    if (!name) continue;
    out.push({
      id: `${el.type}/${el.id}`,
      name,
      latitude: lat,
      longitude: lon,
      km: distanceKm(latitude, longitude, lat, lon),
      address: addressOf(t),
      website: cleanUrl(t.website || t['contact:website'] || t.url),
      phone: t.phone || t['contact:phone'] || null,
      serviceTimes: t.service_times || null,
    });
  }
  out.sort((a, b) => a.km - b.km);
  // The same masjid is sometimes mapped twice (a point and a building outline).
  return out.filter((m, i) => !out.slice(0, i).some((o) => o.name === m.name && distanceKm(o.latitude, o.longitude, m.latitude, m.longitude) < 0.15));
}

/** Asks every Overpass server at once and takes the first good answer, giving up after 25 seconds. */
async function query(q: string) {
  const controllers = ENDPOINTS.map(() => new AbortController());
  const timer = setTimeout(() => controllers.forEach((c) => c.abort()), 25_000);
  try {
    return await Promise.any(
      ENDPOINTS.map(async (base, i) => {
        const res = await fetch(`${base}?data=${encodeURIComponent(q)}`, { signal: controllers[i].signal });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const json = (await res.json()) as { elements?: OsmElement[]; remark?: string };
        if (!json.elements) throw new Error(json.remark ?? 'Overpass gave no data');
        return json;
      }),
    );
  } finally {
    clearTimeout(timer);
    controllers.forEach((c) => c.abort());
  }
}

/** The nearest masjids, widening the search from 10 km to 40 km when there are few close by. */
export async function findNearbyMasjids(latitude: number, longitude: number, limit = 25) {
  let found: Masjid[] = [];
  for (const [radius, broad] of [[10_000, true], [40_000, false]] as const) {
    try {
      const wider = parseOverpass(await query(buildQuery(latitude, longitude, radius, broad)), latitude, longitude);
      const seen = new Set(found.map((m) => m.id));
      found = [...found, ...wider.filter((m) => !seen.has(m.id))].sort((a, b) => a.km - b.km);
    } catch (e) {
      if (found.length === 0) throw e; // keep the closer results if only the wider search fails
      break;
    }
    if (found.length >= 5) break;
  }
  return found.slice(0, limit);
}

export function mapLinks(m: Pick<Masjid, 'name' | 'latitude' | 'longitude'>) {
  const ll = `${m.latitude},${m.longitude}`;
  return {
    apple: `https://maps.apple.com/?q=${encodeURIComponent(m.name)}&ll=${ll}`,
    google: `https://www.google.com/maps/search/?api=1&query=${ll}`,
  };
}

/** Miles for US and UK English, kilometres everywhere else. */
export function formatDistance(km: number, locale = Intl.DateTimeFormat().resolvedOptions().locale) {
  const miles = /-(US|GB|LR|MM)\b/i.test(locale);
  const v = miles ? km * 0.621371 : km;
  const unit = miles ? 'mi' : 'km';
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${unit}`;
}
