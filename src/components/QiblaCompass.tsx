import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { magvar } from 'magvar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { distanceKm } from '../lib/geocode';
import { colors, themed } from '../theme';
import { Button } from './Button';

const KAABA = { latitude: 21.4225, longitude: 39.8262 };
const FACING_WITHIN = 4; // degrees
const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

type Status = 'starting' | 'tap-to-start' | 'live' | 'no-compass' | 'denied';
type Props = { bearing: number; latitude: number; longitude: number };

const norm360 = (a: number) => ((a % 360) + 360) % 360;
const signedDiff = (to: number, from: number) => ((to - from + 540) % 360) - 180;
const withCommas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * A live compass: the dial turns with the phone so north on the dial matches real north, and the
 * Ka‘bah marker sits on the Qibla bearing. Turn until the Ka‘bah lines up with the arrow at the top.
 * Works in the app (expo-location heading) and on the website (the browser's compass events).
 */
export function QiblaCompass({ bearing, latitude, longitude }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 72, 300);
  const [status, setStatus] = useState<Status>('starting');
  const [heading, setHeading] = useState<number | null>(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const smooth = useRef<number | null>(null); // unwrapped, so the dial never spins the long way past north
  const startWeb = useRef<(() => void) | null>(null);

  // Phones give magnetic north on the web (and sometimes on Android); convert it to true north.
  const declination = useMemo(() => {
    try {
      return magvar(latitude, longitude);
    } catch {
      return 0;
    }
  }, [latitude, longitude]);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    smooth.current = null;

    const onHeading = (trueHeading: number, low: boolean) => {
      if (cancelled || !Number.isFinite(trueHeading)) return;
      const raw = norm360(trueHeading);
      const prev = smooth.current;
      // Light smoothing takes out sensor jitter without feeling laggy.
      const next = prev === null ? raw : prev + signedDiff(raw, norm360(prev)) * 0.35;
      smooth.current = next;
      rotation.setValue(-next);
      const shown = Math.round(norm360(next));
      setHeading((h) => (h === shown ? h : shown));
      setLowAccuracy(low);
      setStatus('live');
    };

    if (Platform.OS !== 'web') {
      (async () => {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!perm.granted) return setStatus('denied');
        const sub = await Location.watchHeadingAsync((h) => {
          const t = h.trueHeading >= 0 ? h.trueHeading : h.magHeading + declination;
          onHeading(t, h.accuracy > 0 && h.accuracy < 2);
        });
        if (cancelled) sub.remove();
        else stop = () => sub.remove();
      })().catch(() => !cancelled && setStatus('no-compass'));
    } else {
      const w = typeof window !== 'undefined' ? (window as any) : null;
      const DOE = w?.DeviceOrientationEvent;
      if (!DOE) {
        setStatus('no-compass');
        return;
      }
      const handler = (e: any) => {
        if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
          // iPhone Safari: degrees from magnetic north, already relative to the top of the phone.
          const acc = typeof e.webkitCompassAccuracy === 'number' ? e.webkitCompassAccuracy : 0;
          onHeading(e.webkitCompassHeading + declination, acc < 0 || acc > 25);
        } else if (e.absolute && typeof e.alpha === 'number') {
          // Android Chrome: alpha counts counter-clockwise from magnetic north.
          onHeading(360 - e.alpha + declination, false);
        }
      };
      const eventName = 'ondeviceorientationabsolute' in w ? 'deviceorientationabsolute' : 'deviceorientation';
      let timer: ReturnType<typeof setTimeout> | null = null;
      const listen = () => {
        w.addEventListener(eventName, handler, true);
        stop = () => w.removeEventListener(eventName, handler, true);
        // Laptops have no compass; say so instead of showing a dial that never moves.
        timer = setTimeout(() => !cancelled && smooth.current === null && setStatus('no-compass'), 2500);
      };
      if (typeof DOE.requestPermission === 'function') {
        // iOS only lets a page read the compass after a tap.
        setStatus('tap-to-start');
        startWeb.current = () => {
          setStatus('starting');
          DOE.requestPermission()
            .then((r: string) => (r === 'granted' ? listen() : setStatus('denied')))
            .catch(() => setStatus('denied'));
        };
      } else listen();
      const prevStop = () => stop?.();
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        prevStop();
      };
    }

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [declination, rotation]);

  const live = status === 'live' && heading !== null;
  const diff = live ? signedDiff(bearing, heading) : 0;
  const facing = live && Math.abs(diff) <= FACING_WITHIN;

  const wasFacing = useRef(false);
  useEffect(() => {
    if (facing && !wasFacing.current && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasFacing.current = facing;
  }, [facing]);

  const km = distanceKm(latitude, longitude, KAABA.latitude, KAABA.longitude);
  const point = POINTS[Math.round(norm360(bearing) / 22.5) % 16];
  const accent = facing ? colors.green : colors.ink;

  let headline: string;
  let sub: string;
  if (facing) {
    headline = 'You’re facing the Qibla';
    sub = 'Hold still and keep your phone flat.';
  } else if (live) {
    headline = `Turn ${diff > 0 ? 'right' : 'left'} ${Math.abs(Math.round(diff))}°`;
    sub = 'Hold your phone flat and turn until the Ka‘bah meets the arrow.';
  } else if (status === 'tap-to-start') {
    headline = 'Tap to start the compass';
    sub = 'Your phone will ask to allow motion and orientation.';
  } else if (status === 'denied') {
    headline = `Qibla is ${Math.round(bearing)}° ${point}`;
    sub = Platform.OS === 'web' ? 'Compass access was turned off. Reload the page and tap Allow.' : 'Allow location for Deen in Settings to use the live compass.';
  } else if (status === 'no-compass') {
    headline = `Qibla is ${Math.round(bearing)}° ${point}`;
    sub = 'This device has no compass. Use a phone, or face this many degrees clockwise from north.';
  } else {
    headline = 'Starting compass…';
    sub = 'Hold your phone flat.';
  }

  const ticks = useMemo(() => Array.from({ length: 72 }, (_, i) => i * 5), []);
  const spin = rotation.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'], extrapolate: 'extend' });

  return (
    <View style={[styles.card, facing && styles.cardFacing]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Qibla</Text>
        {live && <Text style={styles.headingBadge}>{heading}° {POINTS[Math.round(heading / 22.5) % 16]}</Text>}
      </View>

      <Text style={[styles.headline, { color: accent }]}>{headline}</Text>
      <Text style={styles.sub}>{sub}</Text>

      {/* The fixed arrow is where the top of the phone points. */}
      <View style={[styles.arrow, { borderBottomColor: facing ? colors.green : colors.gold }]} />
      <View style={[styles.dial, { width: size, height: size, borderRadius: size / 2 }, facing && { borderColor: colors.green, backgroundColor: colors.greenLight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: live ? spin : '0deg' }] }]}>
          {ticks.map((deg) => {
            const major = deg % 30 === 0;
            return (
              <View key={deg} style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${deg}deg` }] }]}>
                <View style={[styles.tick, major ? styles.tickMajor : null, deg === 0 && { backgroundColor: colors.red }]} />
              </View>
            );
          })}
          {(['N', 'E', 'S', 'W'] as const).map((c, i) => (
            <View key={c} style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${i * 90}deg` }] }]}>
              <Text style={[styles.cardinal, c === 'N' && { color: colors.red }]}>{c}</Text>
            </View>
          ))}
          {/* Qibla line and Ka‘bah on the dial, at the bearing from north. */}
          <View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${bearing}deg` }] }]}>
            <View style={[styles.kaabaBubble, { marginTop: size * 0.17 }, facing && { borderColor: colors.green }]}>
              <Text style={styles.kaaba}>🕋</Text>
            </View>
            <View style={[styles.qiblaLine, { height: size * 0.33 - 48 }, facing && { backgroundColor: colors.green }]} />
          </View>
        </Animated.View>
        <View style={[styles.hub, facing && { backgroundColor: colors.green }]} />
      </View>

      {status === 'tap-to-start' && <Button title="🧭 Start compass" onPress={() => startWeb.current?.()} style={{ alignSelf: 'stretch', marginTop: 16 }} />}

      <View style={styles.facts}>
        <View style={styles.fact}>
          <Text style={styles.factValue}>
            {Math.round(bearing)}° {point}
          </Text>
          <Text style={styles.factLabel}>from true north</Text>
        </View>
        <View style={styles.fact}>
          <Text style={styles.factValue}>{withCommas(km)} km</Text>
          <Text style={styles.factLabel}>{withCommas(km * 0.621371)} mi to Makkah</Text>
        </View>
      </View>

      {live && lowAccuracy && <Text style={styles.calibrate}>⚠️ The compass needs calibrating: wave your phone in a figure 8 a few times.</Text>}
      <Text style={styles.tip}>Keep the phone away from magnets, cases with magnets, and metal. If in doubt, follow your local masjid’s direction.</Text>
    </View>
  );
}

const styles = themed(() => ({
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16, alignItems: 'center' },
  cardFacing: { borderColor: colors.green },
  titleRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '900', fontSize: 16, color: colors.ink },
  headingBadge: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  headline: { fontSize: 24, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 4, lineHeight: 19 },
  arrow: {
    marginTop: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dial: { marginTop: 4, borderWidth: 4, borderColor: colors.line, backgroundColor: colors.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  tick: { width: 2, height: 6, marginTop: 4, backgroundColor: colors.locked, borderRadius: 1 },
  tickMajor: { width: 3, height: 12, backgroundColor: colors.muted },
  cardinal: { marginTop: 18, fontWeight: '900', fontSize: 16, color: colors.ink },
  kaabaBubble: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  kaaba: { fontSize: 24 },
  qiblaLine: { width: 5, borderRadius: 3, backgroundColor: colors.gold },
  hub: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.ink },
  facts: { flexDirection: 'row', gap: 10, marginTop: 16, alignSelf: 'stretch' },
  fact: { flex: 1, backgroundColor: colors.bg, borderRadius: 12, padding: 10, alignItems: 'center' },
  factValue: { fontWeight: '900', fontSize: 17, color: colors.ink },
  factLabel: { color: colors.muted, fontSize: 12, marginTop: 2, textAlign: 'center' },
  calibrate: { color: colors.oil, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  tip: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 17 },
}));
