import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { CALC_METHODS, PRAYER_LABELS, formatCountdown, formatTime, nextPrayer, prayerTimes, qiblaBearing } from '../../lib/prayer';
import { requestReminderPermission } from '../../lib/reminders';
import { QiblaCompass } from '../../components/QiblaCompass';
import { isCoordinateName, placeName } from '../../lib/useLocation';
import { useSettings } from '../../state/SettingsProvider';
import { colors, themed } from '../../theme';

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

  // Locations saved before town lookup existed show numbers or "Near …"; look up the real town once.
  useEffect(() => {
    if (!loc || !isCoordinateName(loc.name)) return;
    let alive = true;
    placeName(loc.latitude, loc.longitude)
      .then((name) => {
        if (alive && name && !name.startsWith('Near ')) update({ location: { ...loc, name } });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loc?.latitude, loc?.longitude, loc?.name]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {Platform.OS === 'web' ? (
          <View style={styles.card}>
            <Text style={styles.settingTitle}>Prayer reminders</Text>
            <Text style={styles.settingText}>
              Websites can’t send reminders when they’re closed, so prayer reminders only work in the phone app. Keep this
              page open to see the countdown to the next prayer.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, styles.settingRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Remind me to pray</Text>
              <Text style={styles.settingText}>A notification at each of the five prayers, even when the app is closed.</Text>
            </View>
            <Switch value={settings.prayerReminders} onValueChange={toggleReminders} trackColor={{ true: colors.green }} />
          </View>
        )}

        <QiblaCompass bearing={qiblaBearing(loc)} latitude={loc.latitude} longitude={loc.longitude} />

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
        <Text style={styles.footnote}>
          Times are calculated on your phone for {loc.name} and shown in your phone’s time zone. Other apps and masjids may differ by a
          minute or two because they add a safety margin or use another method. Pick your masjid’s method above to match it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
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
  timeRowNext: { backgroundColor: colors.greenLight },
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
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center' },
}));
