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

export function buildQuery(latitude: number, longitude: number, radiusMeters: number) {
  const around = `(around:${Math.round(radiusMeters)},${latitude.toFixed(5)},${longitude.toFixed(5)})`;
  return `[out:json][timeout:25];nwr["amenity"="place_of_worship"]["religion"="muslim"]${around};out center tags 80;`;
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
    if (lat == null || lon == null) continue;
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

async function query(q: string) {
  let lastError: unknown;
  for (const base of ENDPOINTS) {
    try {
      const res = await fetch(`${base}?data=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      return (await res.json()) as { elements?: OsmElement[] };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/** The nearest masjids, widening the search from 10 km to 40 km when there are few close by. */
export async function findNearbyMasjids(latitude: number, longitude: number, limit = 25) {
  let found: Masjid[] = [];
  for (const radius of [10_000, 40_000]) {
    found = parseOverpass(await query(buildQuery(latitude, longitude, radius)), latitude, longitude);
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
