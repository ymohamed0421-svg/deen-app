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


const MASJID_NAME = /masjid|mosque|islamic|musall|jamia|jame\b|muslim|ummah|\bmadina|medina|\bdar al|\bdar-al|\bdarul|\bmakkah|\bmecca/i;
export const STRONG_MUSLIM = /masjid|mosque|islamic|muslim|musall/i;

export const OTHER_FAITH =
  /church|chapel|cathedral|parish|ministr|fellowship|congregation|synagogue|jewish|hebrew|chabad|shul|temple|gurdwara|sikh|hindu|mandir|buddhis|vihara|kingdom hall|jehovah|baptist|methodist|lutheran|presbyterian|catholic|episcopal|orthodox|adventist|pentecostal|evangel|christ|gospel|bible|mormon|latter[- ]day|unitarian|quaker|bah[aá]'?i/i;

/** Only places that are clearly Muslim: TomTom files them as mosques, or the name says so. */
export function isTomTomMasjid(r: TomTomResult) {
  const name = r.poi?.name ?? '';
  const labels = [
    ...(r.poi?.categories ?? []),
    ...(r.poi?.classifications ?? []).flatMap((c) => [c.code ?? '', ...(c.names ?? []).map((n) => n.name ?? '')]),
  ].join(' ');
  if (STRONG_MUSLIM.test(name)) return true; // e.g. "Temple Hills Mosque"
  if (OTHER_FAITH.test(name) || OTHER_FAITH.test(labels)) return false;
  return /mosque|islam/i.test(labels) || MASJID_NAME.test(name);
}

/**
 * For a name the person typed in: also keep places TomTom files as worship, religious or
 * community centres (some masjids are listed that way), as long as nothing says another faith.
 */
export function isSearchMatch(r: TomTomResult) {
  if (isTomTomMasjid(r)) return true;
  const name = r.poi?.name ?? '';
  const labels = [
    ...(r.poi?.categories ?? []),
    ...(r.poi?.classifications ?? []).flatMap((c) => [c.code ?? '', ...(c.names ?? []).map((n) => n.name ?? '')]),
  ].join(' ');
  if (OTHER_FAITH.test(name) || OTHER_FAITH.test(labels)) return false;
  return /worship|religio|community|cultural/i.test(labels);
}

function cleanUrl(url: string | undefined) {
  if (!url) return null;
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function parseTomTom(json: { results?: TomTomResult[] }, keep: (r: TomTomResult) => boolean = isTomTomMasjid): PlaceMasjid[] {
  const out: PlaceMasjid[] = [];
  for (const r of json.results ?? []) {
    const lat = r.position?.lat;
    const lon = r.position?.lon;
    const name = r.poi?.name?.trim();
    if (lat == null || lon == null || !name || !r.id || !keep(r)) continue;
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
  return `v2:${latitude.toFixed(2)},${longitude.toFixed(2)}`; // v2: stricter filter, ignore older saved searches
}

/** Saved-search key for a typed name, near a ~10 km area (results are biased to where you are). */
export function searchKey(query: string, latitude: number, longitude: number) {
  const q = query.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
  return `q1:${q}@${latitude.toFixed(1)},${longitude.toFixed(1)}`;
}
