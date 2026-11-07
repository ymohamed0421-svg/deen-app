import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { CALC_METHODS, PRAYER_LABELS, formatCountdown, formatTime, nextPrayer, prayerTimes, qiblaBearing } from '../../lib/prayer';
import { requestReminderPermission } from '../../lib/reminders';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

const ROWS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export default function PrayerScreen() {
  const { settings, update } = useSettings();
  const [now, setNow] = useState(new Date());
  const [showMethods, setShowMethods] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const loc = settings.location;

  if (!loc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={styles.title}>Prayer times</Text>
          <Text style={styles.text}>Set your location to see prayer times, the Qibla direction and prayer reminders.</Text>
          <Button title="Set my location" onPress={() => router.push('/location')} />
        </View>
      </SafeAreaView>
    );
  }

  const times = prayerTimes(loc, settings, now);
  const next = nextPrayer(loc, settings, now);

  async function toggleReminders(on: boolean) {
    if (on) {
      const ok = await requestReminderPermission();
      if (!ok) {
        Alert.alert('Notifications are off', 'Allow notifications for Deen in your phone settings to get prayer reminders.');
        return;
      }
    }
    update({ prayerReminders: on });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Text style={styles.title}>Prayer times</Text>

        <Pressable onPress={() => router.push('/location')} style={styles.locRow}>
          <Text style={styles.locText}>📍 {loc.name}</Text>
          <Text style={styles.change}>Change</Text>
        </Pressable>

        <View style={styles.nextCard}>
          <Text style={styles.nextLabel}>NEXT PRAYER</Text>
          <Text style={styles.nextName}>{PRAYER_LABELS[next.name]}</Text>
          <Text style={styles.nextTime}>
            {formatTime(next.time)} · in {formatCountdown(next.time.getTime() - now.getTime())}
          </Text>
        </View>

        <View style={styles.card}>
          {ROWS.map((p) => {
            const isNext = p === next.name && next.time.toDateString() === now.toDateString();
            return (
              <View key={p} style={[styles.timeRow, isNext && styles.timeRowNext]}>
                <Text style={[styles.timeName, p === 'sunrise' && { color: colors.muted }]}>{PRAYER_LABELS[p]}</Text>
                <Text style={[styles.timeValue, p === 'sunrise' && { color: colors.muted }]}>{formatTime(times[p])}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, styles.settingRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Remind me to pray</Text>
            <Text style={styles.settingText}>A notification at each of the five prayers, even when the app is closed.</Text>
          </View>
          <Switch value={settings.prayerReminders} onValueChange={toggleReminders} trackColor={{ true: colors.green }} />
        </View>

        <Qibla bearing={qiblaBearing(loc)} />

        <View style={styles.card}>
          <Text style={styles.settingTitle}>Asr time</Text>
          <View style={styles.segment}>
            {(['shafi', 'hanafi'] as const).map((m) => (
              <Pressable key={m} onPress={() => update({ asrMadhab: m })} style={[styles.segBtn, settings.asrMadhab === m && styles.segOn]}>
                <Text style={[styles.segText, settings.asrMadhab === m && { color: '#fff' }]}>
                  {m === 'shafi' ? 'Shafi‘i, Maliki, Hanbali' : 'Hanafi'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setShowMethods((v) => !v)} style={{ marginTop: 14 }}>
            <Text style={styles.settingTitle}>Calculation method</Text>
            <Text style={styles.settingText}>{CALC_METHODS.find((m) => m.id === settings.calcMethod)?.label} ▾</Text>
          </Pressable>
          {showMethods &&
            CALC_METHODS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  update({ calcMethod: m.id });
                  setShowMethods(false);
                }}
                style={styles.methodRow}
              >
                <Text style={[styles.text, m.id === settings.calcMethod && { color: colors.green, fontWeight: '800' }]}>{m.label}</Text>
              </Pressable>
            ))}
        </View>
        <Text style={styles.footnote}>Times are calculated on your phone for {loc.name} and shown in your phone’s time zone.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A compass needle pointing to the Ka‘bah, using the phone's heading where available. */
function Qibla({ bearing }: { bearing: number }) {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      sub = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    })().catch(() => {});
    return () => sub?.remove();
  }, []);

  const rotation = bearing - (heading ?? 0);
  const facing = heading !== null && Math.abs(((rotation + 540) % 360) - 180) < 5;

  return (
    <View style={[styles.card, { alignItems: 'center' }]}>
      <Text style={styles.settingTitle}>Qibla</Text>
      <View style={[styles.dial, facing && { borderColor: colors.green }]}>
        <View style={[styles.needleWrap, { transform: [{ rotate: `${-(heading ?? 0)}deg` }] }]}>
          <Text style={styles.north}>N</Text>
        </View>
        <View style={[styles.needleWrap, { transform: [{ rotate: `${rotation}deg` }] }]}>
          <Text style={styles.kaaba}>🕋</Text>
          <View style={[styles.needle, facing && { backgroundColor: colors.green }]} />
        </View>
      </View>
      <Text style={styles.text}>
        {Math.round(bearing)}° from north.{' '}
        {heading === null ? 'On a phone, hold it flat to use the live compass.' : facing ? 'You are facing the Qibla.' : 'Turn until the Ka‘bah is at the top.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  text: { color: colors.ink, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  locRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locText: { fontSize: 16, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  change: { color: colors.blue, fontWeight: '800' },
  nextCard: { backgroundColor: colors.green, borderRadius: 20, padding: 20 },
  nextLabel: { color: '#ffffffcc', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  nextName: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
  nextTime: { color: '#fff', fontSize: 16, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  timeRowNext: { backgroundColor: '#EEF8F2' },
  timeName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  timeValue: { fontSize: 17, fontWeight: '800', color: colors.ink },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  settingText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  segment: { flexDirection: 'row', gap: 8, marginTop: 8 },
  segBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: colors.line, alignItems: 'center' },
  segOn: { backgroundColor: colors.green, borderColor: colors.green },
  segText: { fontWeight: '700', color: colors.ink, fontSize: 13, textAlign: 'center' },
  methodRow: { paddingVertical: 8 },
  dial: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: colors.line, marginVertical: 16, alignItems: 'center', justifyContent: 'center' },
  north: { marginTop: 4, fontWeight: '900', color: colors.red },
  needleWrap: { position: 'absolute', width: 200, height: 200, alignItems: 'center' },
  kaaba: { fontSize: 28, marginTop: 14 },
  needle: { width: 6, height: 60, borderRadius: 3, backgroundColor: colors.gold },
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
