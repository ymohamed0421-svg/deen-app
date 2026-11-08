import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button } from '../components/Button';
import { CHECKIN_KM, CHECKIN_NOOR, checkIn, checkedIn } from '../lib/checkins';
import { prayerSlot, sortByJumuah } from '../lib/clock';
import { fetchMasjidTimes, masjidTimesAvailable, submitCorrection, type MasjidTimes } from '../lib/masjidTimes';
import { requestReminderPermission } from '../lib/reminders';
import { fetchPlaceMasjids, searchMasjidsByName } from '../lib/nearbyMasjids';
import { distanceKm, findNearbyMasjids, formatDistance, mergeMasjids, mapLinks, type Masjid } from '../lib/masjids';
import { PRAYERS, PRAYER_LABELS, formatTime, nextPrayer, prayerTimes } from '../lib/prayer';
import { useGame } from '../state/GameProvider';
import { useSettings, type FavoriteMasjid, type MyMasjid, type SavedLocation } from '../state/SettingsProvider';
import { colors } from '../theme';

type Origin = { latitude: number; longitude: number; fromGps: boolean };
type State =
  | { kind: 'loading'; step: string }
  | { kind: 'no-location' }
  | { kind: 'error'; origin: Origin }
  | { kind: 'done'; origin: Origin; masjids: Masjid[]; stale?: boolean };

const CACHE_KEY = 'deen-app/masjids/last/v2';
type Cached = { latitude: number; longitude: number; masjids: Masjid[] };

function within<T>(ms: number, p: Promise<T>): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

/** The phone's position, or null after 12 seconds (some browsers never answer if the prompt is ignored). */
async function currentPosition(): Promise<Origin | null> {
  try {
    const perm = await within(20_000, Location.requestForegroundPermissionsAsync());
    if (!perm?.granted) return null;
    const pos =
      (await within(12_000, Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }))) ??
      (await within(3_000, Location.getLastKnownPositionAsync()).catch(() => null));
    return pos ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude, fromGps: true } : null;
  } catch {
    return null;
  }
}

export default function MasjidsScreen() {
  const { settings } = useSettings();
  const [state, setState] = useState<State>({ kind: 'loading', step: 'Getting your location…' });
  const [now] = useState(() => new Date());

  const load = useCallback(async (useSaved = false) => {
    setState({ kind: 'loading', step: useSaved ? 'Finding masjids near you…' : 'Getting your location…' });
    const saved = settings.location;
    const fromSaved = saved ? { latitude: saved.latitude, longitude: saved.longitude, fromGps: false } : null;
    const origin = useSaved ? fromSaved : ((await currentPosition()) ?? fromSaved);
    if (!origin) return setState({ kind: 'no-location' });
    setState({ kind: 'loading', step: 'Finding masjids near you…' });
    const remember = (masjids: Masjid[]) =>
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ latitude: origin.latitude, longitude: origin.longitude, masjids })).catch(() => {});

    // Fast path: TomTom's data through our server (about a second). OpenStreetMap then fills in
    // any it lacks, in the background, without making anyone wait.
    const places = await fetchPlaceMasjids(origin.latitude, origin.longitude);
    if (places && places.length > 0) {
      setState({ kind: 'done', origin, masjids: places.slice(0, 30) });
      remember(places.slice(0, 30));
      findNearbyMasjids(origin.latitude, origin.longitude)
        .then((osm) => {
          const merged = mergeMasjids(places, osm).slice(0, 30);
          setState((s) => (s.kind === 'done' && s.origin === origin ? { ...s, masjids: merged } : s));
          remember(merged);
        })
        .catch(() => {});
      return;
    }

    try {
      const masjids = await findNearbyMasjids(origin.latitude, origin.longitude);
      setState({ kind: 'done', origin, masjids });
      remember(masjids);
    } catch {
      // The free map servers are sometimes busy: fall back to the last list found near here.
      const raw = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      const cached = raw ? (JSON.parse(raw) as Cached) : null;
      if (cached && distanceKm(cached.latitude, cached.longitude, origin.latitude, origin.longitude) < 5) {
        setState({ kind: 'done', origin, masjids: cached.masjids, stale: true });
      } else {
        setState({ kind: 'error', origin });
      }
    }
  }, [settings.location]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.muted}>{state.step}</Text>
        {settings.location && state.step.startsWith('Getting') && (
          <Pressable onPress={() => load(true)} style={{ marginTop: 8 }}>
            <Text style={styles.chipText}>Use {settings.location.name} instead</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (state.kind === 'no-location') {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={styles.big}>📍</Text>
        <Text style={styles.text}>Allow location, or set your city, to see the masjids closest to you.</Text>
        <Button title="Try again" onPress={() => load()} style={{ alignSelf: 'stretch' }} />
        <Button title="Set my city" variant="outline" onPress={() => router.push('/location')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const { origin } = state;
  const here: SavedLocation = { ...origin, name: '', auto: origin.fromGps };
  const today = prayerTimes(here, settings, now);
  const next = nextPrayer(here, settings, now);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 48 }}>
      <Text style={styles.sub}>
        {origin.fromGps ? 'Nearest to where you are now' : `Nearest to ${settings.location?.name ?? 'your saved location'}`}
      </Text>

      <View style={styles.timesCard}>
        <Text style={styles.timesLabel}>TODAY’S PRAYER TIMES HERE</Text>
        <View style={styles.timesRow}>
          {PRAYERS.map((p) => {
            const isNext = p === next.name && next.time.toDateString() === now.toDateString();
            return (
              <View key={p} style={[styles.timeCell, isNext && styles.timeCellNext]}>
                <Text style={[styles.timeName, isNext && { color: '#fff' }]}>{PRAYER_LABELS[p]}</Text>
                <Text style={[styles.timeValue, isNext && { color: '#fff' }]}>{formatTime(today[p])}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>
          These are prayer start times worked out for your spot. Each masjid sets its own iqamah (jama‘ah) time, usually a few
          minutes later. Where a masjid’s website lists its times, they show on its card.
        </Text>
      </View>

      <FavoriteSection origin={origin} />

      <MasjidSearch origin={origin} />

      <View style={styles.actions}>
        <Chip label="🍽️ Halal food nearby" onPress={() => router.push('/halal')} />
      </View>

      {state.kind === 'done' && state.masjids.length > 0 && <JumuahFinder masjids={state.masjids} now={now} />}

      <MyMasjids />

      {state.kind === 'error' && (
        <View style={styles.card}>
          <Text style={styles.text}>The free map service is busy right now. Try again in a minute.</Text>
          <Button title="Try again" onPress={() => load()} />
          <Chip
            label="Search Google Maps instead"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/mosque/@${state.origin.latitude},${state.origin.longitude},13z`).catch(() => {})}
          />
        </View>
      )}

      {state.kind === 'done' && state.masjids.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.text}>No masjids found within 40 km on OpenStreetMap. Try Google Maps instead.</Text>
          <Button
            title="Search Google Maps"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/mosque/@${origin.latitude},${origin.longitude},12z`)}
          />
        </View>
      )}

      {state.kind === 'done' && state.stale && (
        <Pressable onPress={() => load()}>
          <Text style={styles.address}>Showing the list from last time (the map service is busy). Tap to refresh.</Text>
        </Pressable>
      )}

      {state.kind === 'done' && state.masjids.map((m, i) => <MasjidCard key={m.id} masjid={m} auto={i < 3} atMasjid={origin.fromGps && m.km < CHECKIN_KM} />)}

      {state.kind === 'done' && state.masjids.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <Chip
            label="Don’t see your masjid? Search Google Maps"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/mosque/@${origin.latitude},${origin.longitude},12z`).catch(() => {})}
          />
          <Text style={styles.credit}>
            Masjid list from OpenStreetMap, a free map anyone can edit. Add a missing masjid at openstreetmap.org and it shows here for
            everyone within a day.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function MasjidCard({ masjid: m, auto, atMasjid = false }: { masjid: Masjid; auto: boolean; atMasjid?: boolean }) {
  const { settings, update } = useSettings();
  const isFavorite = settings.favoriteMasjid?.id === m.id;
  const toggleFavorite = () => {
    if (isFavorite) return update({ favoriteMasjid: null, favoriteTimes: null, iqamahReminders: false });
    const fav: FavoriteMasjid = { id: m.id, name: m.name, latitude: m.latitude, longitude: m.longitude, address: m.address, website: m.website, phone: m.phone };
    update({ favoriteMasjid: fav, favoriteTimes: null });
  };
  const onTimes = (t: MasjidTimes) => {
    if (!isFavorite || !t.found) return;
    const same = JSON.stringify(settings.favoriteTimes?.iqamah) === JSON.stringify(t.iqamah) && JSON.stringify(settings.favoriteTimes?.jumuah) === JSON.stringify(t.jumuah);
    if (!same) update({ favoriteTimes: { iqamah: t.iqamah, jumuah: t.jumuah, savedAt: new Date().toISOString() } });
  };
  const links = mapLinks(m);
  const next = nextPrayer({ latitude: m.latitude, longitude: m.longitude, name: m.name, auto: false }, settings);
  const preferApple = Platform.OS === 'ios';
  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <View style={styles.card}>
      <Pressable onPress={() => open(preferApple ? links.apple : links.google)} accessibilityRole="link">
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={2}>
            🕌 {m.name}
          </Text>
          <Text style={styles.distance}>{formatDistance(m.km)}</Text>
        </View>
        {m.address && <Text style={styles.address}>{m.address}</Text>}
      </Pressable>

      <View style={styles.nextPill}>
        <Text style={styles.nextText}>
          Next: <Text style={{ fontWeight: '900' }}>{PRAYER_LABELS[next.name]}</Text> starts {formatTime(next.time)}
        </Text>
      </View>
      {m.serviceTimes && <Text style={styles.address}>Listed times: {m.serviceTimes}</Text>}
      {masjidTimesAvailable && <WebsiteTimes masjid={m} website={m.website} auto={auto || isFavorite} onTimes={onTimes} />}
      {atMasjid && <CheckIn masjid={m} />}

      <View style={styles.actions}>
        <Chip label={isFavorite ? '★ My masjid' : '☆ Make my masjid'} onPress={toggleFavorite} />
        <Chip label="Apple Maps" onPress={() => open(links.apple)} />
        <Chip label="Google Maps" onPress={() => open(links.google)} />
        <Chip label="Waze" onPress={() => open(links.waze)} />
        {m.website && <Chip label="Website" onPress={() => open(m.website!)} />}
        {m.phone && <Chip label="Call" onPress={() => open(`tel:${m.phone!.replace(/[^\d+]/g, '')}`)} />}
      </View>
    </View>
  );
}

const IQAMAH_ROWS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

/** The masjid's own iqamah and Jumu'ah times: fixed by an app user, or read off its website. */
function WebsiteTimes({
  masjid: m,
  website,
  auto,
  onTimes,
}: {
  masjid: { id: string; name: string };
  website: string | null;
  auto: boolean;
  onTimes?: (t: MasjidTimes) => void;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'failed' | MasjidTimes>(auto ? 'loading' : 'idle');
  const [fixing, setFixing] = useState(false);

  const show = useCallback(
    (t: MasjidTimes) => {
      setState(t);
      onTimes?.(t);
    },
    [onTimes],
  );

  const load = useCallback(() => {
    setState('loading');
    fetchMasjidTimes({ id: m.id, name: m.name, website })
      .then(show)
      .catch(() => setState('failed'));
  }, [m.id, m.name, website]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (auto) load();
  }, [auto, load]);

  const current = typeof state === 'object' ? state : null;
  const form = fixing && (
    <FixTimes
      masjid={m}
      start={current}
      onDone={(t) => {
        setFixing(false);
        if (t) show(t);
      }}
    />
  );

  if (state === 'idle') {
    return (
      <View style={styles.actions}>
        <Chip label={website ? '⏱ Get times from its website' : '⏱ Check for iqamah times'} onPress={load} />
        {form || <Chip label="✏️ Add its times" onPress={() => setFixing(true)} />}
      </View>
    );
  }
  if (state === 'loading') {
    return (
      <View style={styles.siteRow}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.address}>{website ? 'Reading the masjid’s website…' : 'Checking for times…'}</Text>
      </View>
    );
  }
  if (state === 'failed' || !state.found) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={styles.address}>
          {website ? 'Its website doesn’t list times we could read.' : 'No iqamah times yet.'} Know them? Add them for everyone.
        </Text>
        {form || <Chip label="✏️ Add its times" onPress={() => setFixing(true)} />}
      </View>
    );
  }
  const rows = IQAMAH_ROWS.filter((p) => state.iqamah[p]);
  const community = state.source === 'community';
  return (
    <View style={styles.siteCard}>
      <Text style={styles.siteLabel}>{community ? 'IQAMAH TIMES FROM APP USERS' : 'FROM THE MASJID’S WEBSITE'}</Text>
      {rows.length > 0 && (
        <View style={styles.siteGrid}>
          {rows.map((p) => (
            <View key={p} style={styles.siteCell}>
              <Text style={styles.timeName}>{PRAYER_LABELS[p]}</Text>
              <Text style={styles.siteValue}>{state.iqamah[p]}</Text>
            </View>
          ))}
        </View>
      )}
      {state.jumuah.length > 0 && (
        <Text style={styles.nextText}>
          <Text style={{ fontWeight: '900' }}>Jumu‘ah: </Text>
          {state.jumuah.join(' · ')}
        </Text>
      )}
      {state.note && <Text style={styles.siteNote}>{state.note}</Text>}
      {!community && <Text style={styles.siteNote}>Read automatically, so it can be wrong or out of date. Check with the masjid if it matters.</Text>}
      {form || <Chip label="✏️ Times wrong? Fix them" onPress={() => setFixing(true)} />}
    </View>
  );
}

const JUMUAH_PLACEHOLDER = 'Jumu‘ah, e.g. 1:15 PM, 2:15 PM';

/** Lets anyone correct a masjid's times. The fix is shown to everyone who opens this masjid. */
function FixTimes({ masjid: m, start, onDone }: { masjid: { id: string; name: string }; start: MasjidTimes | null; onDone: (t: MasjidTimes | null) => void }) {
  const [iqamah, setIqamah] = useState<Record<(typeof IQAMAH_ROWS)[number], string>>(() =>
    Object.fromEntries(IQAMAH_ROWS.map((p) => [p, start?.iqamah[p] ?? ''])) as Record<(typeof IQAMAH_ROWS)[number], string>,
  );
  const [jumuah, setJumuah] = useState(start?.jumuah.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const t = await submitCorrection(m, {
        iqamah: Object.fromEntries(IQAMAH_ROWS.map((p) => [p, iqamah[p].trim() || null])) as MasjidTimes['iqamah'],
        jumuah: jumuah.split(/[,;·]/).map((j) => j.trim()).filter(Boolean),
      });
      onDone(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save. Try again.');
      setSaving(false);
    }
  }

  return (
    <View style={styles.fixCard}>
      <Text style={styles.siteLabel}>FIX THE IQAMAH TIMES FOR EVERYONE</Text>
      <View style={styles.siteGrid}>
        {IQAMAH_ROWS.map((p) => (
          <View key={p} style={styles.fixCell}>
            <Text style={styles.timeName}>{PRAYER_LABELS[p]}</Text>
            <TextInput
              value={iqamah[p]}
              onChangeText={(v) => setIqamah((s) => ({ ...s, [p]: v }))}
              placeholder={p === 'maghrib' ? 'sunset+5' : '0:00 PM'}
              placeholderTextColor={colors.muted}
              style={styles.fixInput}
              maxLength={40}
            />
          </View>
        ))}
      </View>
      <TextInput value={jumuah} onChangeText={setJumuah} placeholder={JUMUAH_PLACEHOLDER} placeholderTextColor={colors.muted} style={styles.input} maxLength={80} />
      <Text style={styles.siteNote}>Only add times you know are right, like from the masjid’s board or announcements.</Text>
      {error && <Text style={[styles.siteNote, { color: '#B42318' }]}>{error}</Text>}
      <View style={styles.actions}>
        <Button title={saving ? 'Saving…' : 'Save for everyone'} onPress={save} disabled={saving} style={{ flex: 1 }} />
        <Button title="Cancel" variant="outline" onPress={() => onDone(null)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** "I prayed here": +Noor once per prayer per day, shown only when the phone is at the masjid. */
function CheckIn({ masjid: m }: { masjid: Masjid }) {
  const { settings } = useSettings();
  const { earnNoor } = useGame();
  const now = new Date();
  const prayer = prayerSlot(prayerTimes({ latitude: m.latitude, longitude: m.longitude, name: m.name, auto: false }, settings, now), now);
  const [status, setStatus] = useState<{ done: boolean; total: number } | null>(null);

  useEffect(() => {
    checkedIn(prayer).then(setStatus);
  }, [prayer]);

  async function press() {
    if (await checkIn(prayer)) {
      earnNoor(CHECKIN_NOOR);
      setStatus((s) => ({ done: true, total: (s?.total ?? 0) + 1 }));
    }
  }

  if (!status) return null;
  if (status.done) {
    return (
      <View style={styles.checkDone}>
        <Text style={styles.nextText}>
          ✅ You prayed {PRAYER_LABELS[prayer]} at the masjid. {status.total > 1 ? `${status.total} prayers at the masjid so far.` : ''}
        </Text>
      </View>
    );
  }
  return <Button title={`🕌 I prayed ${PRAYER_LABELS[prayer]} here  +${CHECKIN_NOOR} Noor`} onPress={press} />;
}

const LEADS = [5, 10, 15, 20, 30];

/** The user's own masjid, at the top, with reminders before its iqamah. */
function FavoriteSection({ origin }: { origin: Origin }) {
  const { settings, update } = useSettings();
  const fav = settings.favoriteMasjid;
  if (!fav) {
    return <Text style={styles.address}>Tip: tap ☆ Make my masjid on your usual masjid to keep it at the top and get reminders before its iqamah.</Text>;
  }
  const km = distanceKm(origin.latitude, origin.longitude, fav.latitude, fav.longitude);
  const hasTimes = settings.favoriteTimes && Object.values(settings.favoriteTimes.iqamah).some(Boolean);

  async function toggleReminders(on: boolean) {
    if (on && Platform.OS !== 'web' && !(await requestReminderPermission())) {
      Alert.alert('Notifications are off', 'Turn on notifications for Deen in Settings to get iqamah reminders.');
      return;
    }
    update({ iqamahReminders: on });
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.section}>Your masjid</Text>
      <MasjidCard masjid={{ ...fav, km, serviceTimes: null }} auto atMasjid={origin.fromGps && km < CHECKIN_KM} />
      <View style={styles.card}>
        <View style={styles.siteRow}>
          <Text style={[styles.nextText, { flex: 1, fontWeight: '800' }]}>Remind me before iqamah</Text>
          <Switch value={settings.iqamahReminders} onValueChange={toggleReminders} trackColor={{ true: colors.green, false: colors.line }} />
        </View>
        {settings.iqamahReminders && (
          <View style={styles.actions}>
            {LEADS.map((n) => (
              <Pressable
                key={n}
                onPress={() => update({ iqamahLeadMinutes: n })}
                style={[styles.chip, settings.iqamahLeadMinutes === n && { backgroundColor: colors.green, borderColor: colors.green }]}
              >
                <Text style={[styles.chipText, settings.iqamahLeadMinutes === n && { color: '#fff' }]}>{n} min</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={styles.siteNote}>
          {Platform.OS === 'web'
            ? 'Reminders work in the phone app, not in the browser.'
            : hasTimes
              ? 'Uses the iqamah and Jumu‘ah times shown above. On Fridays you get a Jumu‘ah reminder instead of Dhuhr.'
              : 'Reminders start once this masjid has iqamah times. If none show, tap Add its times.'}
        </Text>
      </View>
    </View>
  );
}

type JumuahRow = { masjid: Masjid; jumuah: string[]; community: boolean };

/** Every nearby masjid's Friday prayer times in one list, earliest first. Opens by itself on Fridays. */
function JumuahFinder({ masjids, now }: { masjids: Masjid[]; now: Date }) {
  const friday = now.getDay() === 5;
  const [open, setOpen] = useState(friday);
  const [rows, setRows] = useState<JumuahRow[] | null>(null);

  useEffect(() => {
    if (!open || rows || !masjidTimesAvailable) return;
    const pick = masjids.slice(0, 10);
    Promise.allSettled(pick.map((m) => fetchMasjidTimes({ id: m.id, name: m.name, website: m.website }))).then((results) => {
      const found: JumuahRow[] = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.jumuah.length) found.push({ masjid: pick[i], jumuah: r.value.jumuah, community: r.value.source === 'community' });
      });
      setRows(sortByJumuah(found, now));
    });
  }, [open, rows, masjids, now]);

  if (!masjidTimesAvailable) return null;
  if (!open) return <Chip label="🕌 Find Jumu‘ah near me" onPress={() => setOpen(true)} />;

  const open1 = (m: Masjid) => {
    const links = mapLinks(m);
    Linking.openURL(Platform.OS === 'ios' ? links.apple : links.google).catch(() => {});
  };

  return (
    <View style={[styles.card, { borderColor: colors.green }]}>
      <View style={styles.siteRow}>
        <Text style={[styles.name, { flex: 1 }]}>🕌 Jumu‘ah near you</Text>
        {!friday && (
          <Pressable onPress={() => setOpen(false)}>
            <Text style={styles.chipText}>Hide</Text>
          </Pressable>
        )}
      </View>
      {!rows ? (
        <View style={styles.siteRow}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.address}>Checking the masjids’ Friday times…</Text>
        </View>
      ) : rows.length === 0 ? (
        <Text style={styles.address}>None of the closest masjids list Jumu‘ah times yet. Add them on a masjid’s card with ✏️ Add its times.</Text>
      ) : (
        rows.map((r) => (
          <Pressable key={r.masjid.id} onPress={() => open1(r.masjid)} style={styles.jumuahRow} accessibilityRole="link">
            <View style={{ flex: 1 }}>
              <Text style={styles.jumuahName} numberOfLines={1}>
                {r.masjid.name}
              </Text>
              <Text style={styles.siteNote}>
                {formatDistance(r.masjid.km)}
                {r.community ? ' · from app users' : ' · from its website'}
              </Text>
            </View>
            <Text style={styles.jumuahTimes}>{r.jumuah.join('\n')}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

/** Look up any masjid by name, near or far. */
function MasjidSearch({ origin }: { origin: Origin }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ query: string; masjids: Masjid[] } | { query: string; error: string } | 'loading' | null>(null);

  async function run() {
    const q = text.trim();
    if (q.length < 2) return;
    setResult('loading');
    try {
      setResult({ query: q, masjids: await searchMasjidsByName(q, origin.latitude, origin.longitude) });
    } catch (e) {
      setResult({ query: q, error: e instanceof Error ? e.message : 'Search didn’t work. Try again.' });
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.searchRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={run}
          placeholder="Search any masjid by name or town"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable onPress={run} accessibilityRole="button" accessibilityLabel="Search" style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>
      {result === 'loading' && (
        <View style={styles.siteRow}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.address}>Searching…</Text>
        </View>
      )}
      {result && result !== 'loading' && (
        <>
          <View style={styles.siteRow}>
            <Text style={[styles.section, { flex: 1 }]}>Results for “{result.query}”</Text>
            <Pressable onPress={() => { setResult(null); setText(''); }}>
              <Text style={styles.chipText}>Clear</Text>
            </Pressable>
          </View>
          {'error' in result ? (
            <Text style={styles.address}>{result.error}</Text>
          ) : result.masjids.length === 0 ? (
            <Text style={styles.address}>No masjid found by that name. Try adding the town, like “Dar Al-Hijrah Falls Church”.</Text>
          ) : (
            result.masjids.map((m, i) => <MasjidCard key={`s-${m.id}`} masjid={m} auto={i < 2} />)
          )}
        </>
      )}
    </View>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'masjid';
}

/** Masjids the user added by hand: always shown first, with their website's times. */
function MyMasjids() {
  const { settings, update } = useSettings();
  const mine = settings.myMasjids ?? [];
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [website, setWebsite] = useState('');

  function save() {
    const n = name.trim();
    if (!n) return;
    let site = website.trim() || null;
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    const m: MyMasjid = { id: `site/${slug(site ?? `${n}-${place}`)}`, name: n, place: place.trim(), website: site };
    update({ myMasjids: [...mine.filter((x) => x.id !== m.id), m] });
    setName('');
    setPlace('');
    setWebsite('');
    setAdding(false);
  }

  return (
    <View style={{ gap: 10 }}>
      {mine.length > 0 && <Text style={styles.section}>Your masjids</Text>}
      {mine.map((m) => (
        <MyMasjidCard key={m.id} masjid={m} onRemove={() => update({ myMasjids: mine.filter((x) => x.id !== m.id) })} />
      ))}
      {adding ? (
        <View style={styles.card}>
          <Text style={styles.name}>Add a masjid</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Name, e.g. PEACE Islamic Center" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={place} onChangeText={setPlace} placeholder="Town or address, e.g. Burke, VA" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="Website (optional, for its prayer times)"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="url"
            style={styles.input}
          />
          <View style={styles.actions}>
            <Button title="Save" onPress={save} disabled={!name.trim()} style={{ flex: 1 }} />
            <Button title="Cancel" variant="outline" onPress={() => setAdding(false)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <Chip label="＋ Add a masjid that’s missing" onPress={() => setAdding(true)} />
      )}
      {(mine.length > 0 || adding) && <Text style={styles.section}>Nearby</Text>}
    </View>
  );
}

function MyMasjidCard({ masjid: m, onRemove }: { masjid: MyMasjid; onRemove: () => void }) {
  const q = encodeURIComponent([m.name, m.place].filter(Boolean).join(', '));
  const apple = `https://maps.apple.com/?q=${q}`;
  const google = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const waze = `https://waze.com/ul?q=${q}&navigate=yes`;
  const open = (url: string) => Linking.openURL(url).catch(() => {});
  return (
    <View style={[styles.card, { borderColor: colors.gold }]}>
      <Pressable onPress={() => open(Platform.OS === 'ios' ? apple : google)} accessibilityRole="link">
        <Text style={styles.name}>⭐ {m.name}</Text>
        {!!m.place && <Text style={styles.address}>{m.place}</Text>}
      </Pressable>
      {masjidTimesAvailable && <WebsiteTimes masjid={m} website={m.website} auto />}
      <View style={styles.actions}>
        <Chip label="Apple Maps" onPress={() => open(apple)} />
        <Chip label="Google Maps" onPress={() => open(google)} />
        <Chip label="Waze" onPress={() => open(waze)} />
        {m.website && <Chip label="Website" onPress={() => open(m.website!)} />}
        <Chip label="Remove" onPress={onRemove} />
      </View>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]} accessibilityRole="button">
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: colors.bg },
  big: { fontSize: 48 },
  text: { color: colors.ink, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  muted: { color: colors.muted },
  sub: { color: colors.muted, fontWeight: '700' },
  timesCard: { backgroundColor: colors.goldLight, borderRadius: 18, padding: 14, gap: 10 },
  timesLabel: { fontSize: 12, fontWeight: '900', color: colors.oil, letterSpacing: 1 },
  timesRow: { flexDirection: 'row', gap: 6 },
  timeCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: colors.card },
  timeCellNext: { backgroundColor: colors.green },
  timeName: { fontSize: 12, fontWeight: '800', color: colors.muted },
  timeValue: { fontSize: 13, fontWeight: '900', color: colors.ink, marginTop: 2 },
  note: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontSize: 17, fontWeight: '900', color: colors.ink },
  distance: { fontWeight: '900', color: colors.green, fontSize: 15 },
  address: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  nextPill: { alignSelf: 'flex-start', backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  nextText: { color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontWeight: '800', color: colors.greenDark },
  siteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  siteCard: { backgroundColor: '#EAF4EE', borderRadius: 14, padding: 12, gap: 8 },
  siteLabel: { fontSize: 11, fontWeight: '900', color: colors.green, letterSpacing: 1 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  siteCell: { minWidth: 58, flexGrow: 1, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.card },
  siteValue: { fontSize: 13, fontWeight: '900', color: colors.ink, marginTop: 2, textAlign: 'center' },
  siteNote: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBtn: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  searchBtnText: { color: '#fff', fontWeight: '900' },
  section: { fontSize: 18, fontWeight: '900', color: colors.ink, marginTop: 4 },
  input: { borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink, backgroundColor: colors.bg },
  fixCard: { backgroundColor: colors.bg, borderRadius: 14, padding: 12, gap: 8, borderWidth: 2, borderColor: colors.line },
  fixCell: { width: '30%', flexGrow: 1, gap: 2 },
  fixInput: { borderWidth: 2, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, color: colors.ink, backgroundColor: colors.card },
  checkDone: { backgroundColor: '#EAF4EE', borderRadius: 12, padding: 10 },
  jumuahRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line },
  jumuahName: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  jumuahTimes: { fontWeight: '900', color: colors.green, textAlign: 'right' },
  credit: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
