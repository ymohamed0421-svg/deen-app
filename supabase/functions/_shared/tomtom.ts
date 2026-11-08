// Turns TomTom Search API results into the app's masjid shape. Pure, shared with tests.

export type PlaceMasjid = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  website: string | null;
  phone: string | null;
};

type TomTomResult = {
  id?: string;
  poi?: {
    name?: string;
    phone?: string;
    url?: string;
    categories?: string[];
    categorySet?: { id: number }[];
    classifications?: { code?: string; names?: { name?: string }[] }[];
  };
  address?: { freeformAddress?: string };
  position?: { lat?: number; lon?: number };
};

export const MOSQUE_CATEGORY = 7339002; // TomTom: Place of Worship › Mosque
export const WORSHIP_CATEGORY = 7339; // TomTom: Place of Worship (all)

const MASJID_NAME = /masjid|mosque|islamic|musall|jamia|jame\b|muslim|ummah|\bmadina|medina|\bdar al|\bdar-al|\bdarul|\bmakkah|\bmecca/i;
const OTHER_FAITH = /church|chapel|cathedral|parish|synagogue|temple|gurdwara|kingdom hall|baptist|methodist|lutheran|presbyterian|catholic|episcopal/i;

export function isTomTomMasjid(r: TomTomResult) {
  const name = r.poi?.name ?? '';
  const cats = (r.poi?.categories ?? []).join(' ');
  if (r.poi?.categorySet?.some((c) => c.id === MOSQUE_CATEGORY) || /mosque/i.test(cats)) return true;
  if (OTHER_FAITH.test(name)) return false;
  return MASJID_NAME.test(name);
}

function cleanUrl(url: string | undefined) {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function parseTomTom(json: { results?: TomTomResult[] }): PlaceMasjid[] {
  const out: PlaceMasjid[] = [];
  for (const r of json.results ?? []) {
    const lat = r.position?.lat;
    const lon = r.position?.lon;
    const name = r.poi?.name?.trim();
    if (lat == null || lon == null || !name || !r.id || !isTomTomMasjid(r)) continue;
    if (out.some((o) => o.id === `tt/${r.id}`)) continue;
    out.push({
      id: `tt/${r.id.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 60)}`,
      name,
      latitude: lat,
      longitude: lon,
      address: r.address?.freeformAddress ?? null,
      website: cleanUrl(r.poi?.url),
      phone: r.poi?.phone ?? null,
    });
  }
  return out;
}

/** Rounds to about 1 km so nearby people share one saved search. */
export function areaKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}
