// Helpers for reading a masjid's prayer schedule off its website. Pure functions, shared by the
// masjid-times Edge Function and its tests.

export type MasjidTimes = {
  found: boolean;
  /** Iqamah (congregation) times as the site writes them, e.g. "6:15 AM" or "5 min after sunset". */
  iqamah: { fajr: string | null; dhuhr: string | null; asr: string | null; maghrib: string | null; isha: string | null };
  jumuah: string[];
  /** Where the times came from, e.g. the page address. */
  source: string | null;
  note: string | null;
};

export const EMPTY: MasjidTimes = {
  found: false,
  iqamah: { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null },
  jumuah: [],
  source: null,
  note: null,
};

/** Only public http(s) sites: no local or private addresses, no odd ports. */
export function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== '80' && url.port !== '443') return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal') || host === 'localhost') return null;
  if (/^[\d.]+$/.test(host) || host.startsWith('[')) return null; // bare IP addresses
  return url;
}

// Prayer-time widgets that masjid sites often embed.
const WIDGET_HOSTS = [
  'masjidal.com',
  'mawaqit.net',
  'masjidbox.com',
  'themasjidapp.org',
  'timing.athanplus.com',
  'athanplus.com',
  'madinaapps.com',
  'mymasjid.ca',
  'my-masjid.com',
  'connectmazjid.com',
  'masjidnow.com',
];

/** Widget pages and schedule pages linked from a masjid's home page, most useful first. */
export function findScheduleUrls(html: string, base: URL, limit = 3): string[] {
  const found: string[] = [];
  const add = (href: string) => {
    try {
      const u = new URL(href.replace(/&amp;/g, '&'), base);
      if (!isSafeUrl(u.href) || found.includes(u.href)) return;
      found.push(u.href);
    } catch {
      // ignore bad links
    }
  };
  // 1. Embedded widgets (iframes and scripts), plus Masjidal's open time API.
  for (const m of html.matchAll(/(?:src|href|data-src)\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1];
    if (WIDGET_HOSTS.some((h) => href.includes(h))) add(href);
    const id = href.match(/masjidal\.com\/.*[?&]masjid_id=([\w-]+)/i)?.[1];
    if (id) add(`https://masjidal.com/api/v1/time/range?masjid_id=${id}`);
  }
  // 2. Links on the same site that look like a prayer schedule.
  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = m[2].replace(/<[^>]+>/g, ' ');
    if (/prayer|salah|salat|iqam|jumu|jumma|friday|timetable|schedule/i.test(`${m[1]} ${label}`)) {
      try {
        if (new URL(m[1], base).hostname.replace(/^www\./, '') === base.hostname.replace(/^www\./, '')) add(m[1]);
      } catch {
        // ignore
      }
    }
  }
  return found.slice(0, limit);
}

/** Page text for the model to read. Keeps script contents that mention prayer data (widgets put times there). */
export function pageText(body: string, maxChars = 20_000) {
  if (/^\s*[[{]/.test(body)) return body.slice(0, maxChars); // already JSON
  const text = body
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, js: string) =>
      /iqam|fajr|isha|maghrib|jumu|prayer/i.test(js) ? ` ${js.slice(0, 8000)} ` : ' ',
    )
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)\b[^>]*>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  return text.slice(0, maxChars);
}

/** True when a page plausibly has a schedule, so we only spend a model call when it's worth it. */
export function mentionsPrayerTimes(text: string) {
  const names = ['fajr', 'dhuhr', 'zuhr', 'asr', 'maghrib', 'isha', 'jumu', 'jumma', 'iqam'].filter((n) => text.toLowerCase().includes(n));
  return names.length >= 2 && /\d{1,2}:\d{2}/.test(text);
}

const clean = (v: unknown) => (typeof v === 'string' && v.trim() && v.trim().length <= 40 ? v.trim() : null);

/** Checks the model's JSON so the app only ever gets short strings in the expected shape. */
export function normalizeTimes(raw: unknown, source: string | null): MasjidTimes {
  const r = (raw ?? {}) as Record<string, unknown>;
  const iq = (r.iqamah ?? {}) as Record<string, unknown>;
  const iqamah = {
    fajr: clean(iq.fajr),
    dhuhr: clean(iq.dhuhr),
    asr: clean(iq.asr),
    maghrib: clean(iq.maghrib),
    isha: clean(iq.isha),
  };
  const jumuah = (Array.isArray(r.jumuah) ? r.jumuah : []).map(clean).filter((v): v is string => !!v).slice(0, 4);
  const found = Boolean(r.found) && (Object.values(iqamah).some(Boolean) || jumuah.length > 0);
  if (!found) return { ...EMPTY, source };
  return { found, iqamah, jumuah, source, note: typeof r.note === 'string' ? r.note.slice(0, 140) : null };
}
