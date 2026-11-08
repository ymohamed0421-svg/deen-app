// Free, keyless place search and reverse lookup.
// Search uses the Open-Meteo geocoding API (GeoNames data, every town worldwide, CORS enabled).
// Reverse lookup uses BigDataCloud's free client endpoint, with OpenStreetMap Nominatim as a backup.

export type Place = {
  name: string; // "Burke"
  region: string | null; // "Virginia"
  country: string; // "United States"
  countryCode: string; // "US"
  latitude: number;
  longitude: number;
  population?: number;
};

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico',
};
const STATE_CODES: Record<string, string> = Object.fromEntries(Object.entries(US_STATES).map(([k, v]) => [v.toLowerCase(), k]));

/** "Burke, VA" for US places, "Mississauga, Ontario, Canada" elsewhere. */
export function placeLabel(p: Pick<Place, 'name' | 'region' | 'country' | 'countryCode'>) {
  if (p.countryCode === 'US') {
    const code = p.region ? STATE_CODES[p.region.toLowerCase()] ?? p.region : null;
    return [p.name, code].filter(Boolean).join(', ');
  }
  const parts = [p.name];
  if (p.region && p.region !== p.name) parts.push(p.region);
  parts.push(p.country);
  return parts.join(', ');
}

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Classic Soundex, so "Berg" and "Burke" (both B620) count as sound-alikes. */
export function soundex(word: string) {
  const s = norm(word).replace(/[^a-z]/g, '');
  if (!s) return '';
  const codes: Record<string, string> = { b: '1', f: '1', p: '1', v: '1', c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2', d: '3', t: '3', l: '4', m: '5', n: '5', r: '6' };
  let out = s[0].toUpperCase();
  let last = codes[s[0]] ?? '';
  for (const ch of s.slice(1)) {
    const c = codes[ch] ?? '';
    if (c && c !== last) out += c;
    if (ch !== 'h' && ch !== 'w') last = c;
    if (out.length === 4) break;
  }
  return out.padEnd(4, '0');
}

type Query = { name: string; qualifier: string | null; stateCode: string | null };

/** Splits "Burke, Virginia" / "springfield va" into a town name and a state or country. */
export function parseQuery(raw: string): Query {
  const text = raw.trim();
  let name = text;
  let qualifier: string | null = null;
  if (text.includes(',')) {
    const [a, ...rest] = text.split(',');
    name = a.trim();
    qualifier = rest.join(',').trim() || null;
  } else {
    // "springfield va" or "burke virginia" without a comma.
    const words = text.split(/\s+/);
    for (let n = Math.min(3, words.length - 1); n >= 1; n--) {
      const tail = words.slice(-n).join(' ');
      if (US_STATES[tail.toUpperCase()] || STATE_CODES[tail.toLowerCase()]) {
        name = words.slice(0, -n).join(' ');
        qualifier = tail;
        break;
      }
    }
  }
  let stateCode: string | null = null;
  if (qualifier) {
    const q = qualifier.replace(/\b(usa|us|united states)\b/gi, '').replace(/[,.]/g, ' ').trim();
    if (US_STATES[q.toUpperCase()]) stateCode = q.toUpperCase();
    else if (STATE_CODES[q.toLowerCase()]) stateCode = STATE_CODES[q.toLowerCase()];
  }
  return { name, qualifier, stateCode };
}

function matchesQualifier(p: Place, q: Query) {
  if (!q.qualifier) return true;
  if (q.stateCode) return p.countryCode === 'US' && p.region === US_STATES[q.stateCode];
  const want = norm(q.qualifier);
  if (/^(usa|us|united states|america)$/.test(want)) return p.countryCode === 'US';
  return [p.region, p.country, p.countryCode].some((v) => v && norm(v).startsWith(want));
}

type OMResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  population?: number;
  feature_code?: string;
};

async function openMeteo(name: string, count: number, countryCode: string | null, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name, count: String(count), language: 'en', format: 'json' });
  if (countryCode) params.set('countryCode', countryCode);
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = (await res.json()) as { results?: OMResult[] };
  return (json.results ?? [])
    .filter((r) => !r.feature_code || r.feature_code.startsWith('PPL') || r.feature_code === 'ADM2' || r.feature_code === 'ADM3')
    .map((r) => ({
      name: r.name,
      region: r.admin1 ?? null,
      country: r.country ?? r.country_code ?? '',
      countryCode: r.country_code ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population,
    }));
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export type SearchResult = { places: Place[]; didYouMean: boolean };

/**
 * Finds towns and cities by name, including small places like "Burke, VA".
 * Results that match the typed state or country come first, then places near `near`, then bigger places.
 * When nothing matches (a typo, or speech-to-text writing "Berg" for "Burke"), it looks for sound-alike
 * names in the same state and returns them as "did you mean" suggestions.
 */
export async function searchPlaces(raw: string, near?: { latitude: number; longitude: number } | null, signal?: AbortSignal): Promise<SearchResult> {
  const q = parseQuery(raw);
  if (!q.qualifier || raw.includes(',')) return searchParsed(q, near, signal);
  // Without a comma, "Fort Washington" could be Fort in Washington state or the town Fort Washington: try both.
  const whole = parseQuery(raw.replace(/\s+/g, ' ').trim() + ',');
  const [split, full] = await Promise.all([searchParsed(q, near, signal), searchParsed(whole, near, signal)]);
  const exact = full.places.filter((p) => norm(p.name) === norm(whole.name));
  if (split.didYouMean && exact.length) return { places: exact, didYouMean: false };
  return { places: [...exact, ...split.places].slice(0, 15), didYouMean: split.didYouMean && !exact.length };
}

async function searchParsed(q: Query, near: { latitude: number; longitude: number } | null | undefined, signal?: AbortSignal): Promise<SearchResult> {
  if (q.name.length < 2) return { places: [], didYouMean: false };
  const country = q.stateCode || (q.qualifier && /^(usa|us|united states|america)$/i.test(q.qualifier.trim())) ? 'US' : null; // narrows the search to US towns

  const rank = (list: Place[]) => {
    const seen = new Set<string>();
    return list
      .filter((p) => {
        const key = `${p.name}|${p.region}|${p.countryCode}|${p.latitude.toFixed(2)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => {
        let score = Math.log10((p.population ?? 0) + 10);
        if (norm(p.name) === norm(q.name)) score += 3;
        if (near) score += Math.max(0, 6 - distanceKm(near.latitude, near.longitude, p.latitude, p.longitude) / 150);
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.p);
  };

  const direct = (await openMeteo(q.name, 40, country, signal)).filter((p) => matchesQualifier(p, q));
  if (direct.length) return { places: rank(direct).slice(0, 15), didYouMean: false };

  // Sound-alike fallback: search a few 3-letter prefixes (Bar, Ber, Bir, Bor, Bur for "Berg")
  // and keep names whose Soundex code matches.
  const word = norm(q.name).split(' ')[0];
  const target = soundex(q.name);
  const consonant = word.slice(1).match(/[^aeiouy ]/)?.[0];
  if (!target || !consonant) return { places: [], didYouMean: false };
  const prefixes = ['a', 'e', 'i', 'o', 'u'].map((v) => `${word[0]}${v}${consonant}`);
  const batches = await Promise.all(prefixes.map((pre) => openMeteo(pre, 100, country, signal).catch(() => [] as Place[])));
  const alike = batches.flat().filter((p) => matchesQualifier(p, q) && soundex(p.name) === target);
  return { places: rank(alike).slice(0, 10), didYouMean: alike.length > 0 };
}

/** The town name for a GPS position, for the web where the phone's own lookup isn't available. */
export async function reverseLookup(latitude: number, longitude: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (res.ok) {
      const j = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string; countryName?: string; countryCode?: string };
      const name = j.city || j.locality;
      if (name) return placeLabel({ name, region: j.principalSubdivision || null, country: j.countryName ?? '', countryCode: j.countryCode ?? '' });
    }
  } catch {
    // fall through to the backup
  }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${latitude}&lon=${longitude}`);
    if (res.ok) {
      const j = (await res.json()) as { address?: Record<string, string> };
      const a = j.address ?? {};
      const name = a.city || a.town || a.village || a.hamlet || a.suburb || a.county;
      if (name) return placeLabel({ name, region: a.state ?? null, country: a.country ?? '', countryCode: (a.country_code ?? '').toUpperCase() });
    }
  } catch {
    // offline
  }
  return null;
}

/** Formats the phone's own reverse-geocode result the same way. */
export function labelFromDevice(place: { city: string | null; district: string | null; subregion: string | null; region: string | null; country: string | null; isoCountryCode: string | null }) {
  const name = place.city ?? place.district ?? place.subregion;
  if (!name) return null;
  const code = place.isoCountryCode ?? '';
  let region = place.region;
  if (code === 'US' && region && US_STATES[region.toUpperCase()]) region = US_STATES[region.toUpperCase()];
  return placeLabel({ name, region, country: place.country ?? '', countryCode: code });
}
