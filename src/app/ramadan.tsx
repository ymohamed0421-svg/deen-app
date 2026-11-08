import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { RAMADAN_DUAS } from '../content/adhkar';
import { addDays, daysUntil, hijriOf, ramadanDay } from '../lib/hijri';
import { formatCountdown, formatTime, prayerTimes } from '../lib/prayer';
import { requestReminderPermission } from '../lib/reminders';
import { useNow } from '../lib/usePrayerDay';
import { JUZ_STARTS } from '../lib/worship';
import { SURAHS } from '../quran/surahs';
import { useSettings } from '../state/SettingsProvider';
import { useWorship } from '../state/WorshipProvider';
import { colors } from '../theme';

const ODD_NIGHTS = [21, 23, 25, 27, 29];

function shortDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function RamadanScreen() {
  const { settings } = useSettings();
  const { worship, toggleFast, toggleJuz, update } = useWorship();
  const now = useNow(30_000);
  const adjust = worship.hijriAdjust;
  const h = hijriOf(now, adjust);
  const inRamadan = h.month === 9;
  const active = inRamadan || worship.ramadanPreview;
  const year = inRamadan || h.month < 9 ? h.year : h.year + 1;
  const start = ramadanDay(now, 1, adjust);
  const today = inRamadan ? h.day : null;

  if (!active) {
    const days = start ? daysUntil(now, start) : null;
    return (
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>RAMADAN {year}</Text>
          <Text style={styles.heroBig}>{days ?? '–'} days</Text>
          <Text style={styles.heroSub}>{start ? `Expected to begin around ${shortDate(start)}, depending on the moon.` : ''}</Text>
        </View>
        <Text style={styles.sub}>
          When Ramadan comes, this page turns into your Ramadan companion: suhoor and iftar countdowns, a fasting tracker, a one-juz-a-night
          taraweeh plan and reminders for the last ten nights.
        </Text>
        <Button title="Preview Ramadan mode" onPress={() => update({ ramadanPreview: true })} />
        <Text style={styles.footnote}>Want to get ready? Sha‘ban fasting and catching up on missed fasts are good places to start.</Text>
      </ScrollView>
    );
  }

  const loc = settings.location;
  const t = loc ? prayerTimes(loc, settings, now) : null;
  const tTomorrow = loc ? prayerTimes(loc, settings, addDays(now, 1)) : null;

  let countdown: { label: string; at: Date } | null = null;
  if (t && tTomorrow) {
    if (now < t.fajr) countdown = { label: 'Suhoor ends', at: t.fajr };
    else if (now < t.maghrib) countdown = { label: 'Iftar', at: t.maghrib };
    else countdown = { label: 'Suhoor ends', at: tTomorrow.fajr };
  }

  const fasted = Array.from({ length: 30 }, (_, i) => worship.fasts[`${year}-${i + 1}`]).filter((m) => m === 'fasted').length;
  const missed = Array.from({ length: 30 }, (_, i) => worship.fasts[`${year}-${i + 1}`]).filter((m) => m === 'missed').length;
  const juzDone = worship.taraweeh[year] ?? [];

  async function toggleQadr(on: boolean) {
    if (on && !(await requestReminderPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Deen in your phone settings to get these reminders.');
      return;
    }
    update({ qadrReminders: on });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
      {!inRamadan && (
        <Pressable onPress={() => update({ ramadanPreview: false })} style={styles.previewBar}>
          <Text style={styles.previewText}>Preview of Ramadan mode · tap to close</Text>
        </Pressable>
      )}

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>RAMADAN MUBARAK</Text>
        <Text style={styles.heroBig}>{today ? `Day ${today}` : `Ramadan ${year}`}</Text>
        {countdown ? (
          <>
            <Text style={styles.heroSub}>
              {countdown.label} in {formatCountdown(countdown.at.getTime() - now.getTime())}
            </Text>
            <View style={styles.timesRow}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Suhoor ends (Fajr)</Text>
                <Text style={styles.timeValue}>{formatTime(t!.fajr)}</Text>
              </View>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Iftar (Maghrib)</Text>
                <Text style={styles.timeValue}>{formatTime(t!.maghrib)}</Text>
              </View>
            </View>
          </>
        ) : (
          <Pressable onPress={() => router.push('/location')}>
            <Text style={[styles.heroSub, { textDecorationLine: 'underline' }]}>Set your location for suhoor and iftar times</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dua when breaking the fast</Text>
        <Text style={styles.arabic}>{RAMADAN_DUAS.iftar.arabic}</Text>
        <Text style={styles.translit}>{RAMADAN_DUAS.iftar.transliteration}</Text>
        <Text style={styles.english}>{RAMADAN_DUAS.iftar.english}</Text>
        <Text style={styles.ref}>{RAMADAN_DUAS.iftar.reference}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={styles.cardTitle}>Fasting tracker</Text>
          <Text style={styles.headStat}>
            {fasted} fasted{missed ? ` · ${missed} to make up` : ''}
          </Text>
        </View>
        <Text style={styles.sub}>Tap once for fasted, twice for a day you missed and need to make up.</Text>
        <View style={styles.grid}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
            const m = worship.fasts[`${year}-${d}`];
            return (
              <Pressable
                key={d}
                onPress={() => toggleFast(`${year}-${d}`)}
                accessibilityLabel={`Day ${d}${m === 'fasted' ? ', fasted' : m === 'missed' ? ', missed' : ''}`}
                style={[styles.dayCell, m === 'fasted' && styles.dayFasted, m === 'missed' && styles.dayMissed, d === today && styles.dayToday]}
              >
                <Text style={[styles.dayNum, m && { color: '#fff' }]}>{d}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.headRow}>
          <Text style={styles.cardTitle}>Taraweeh plan: a juz a night</Text>
          <Text style={styles.headStat}>{juzDone.length}/30</Text>
        </View>
        <Text style={styles.sub}>Finish the whole Quran this Ramadan. Tap the circle when you’ve read or heard a juz, or the name to open it.</Text>
        {JUZ_STARTS.map(([surah, ayah], i) => {
          const juz = i + 1;
          const done = juzDone.includes(juz);
          const tonight = today !== null && juz === today;
          return (
            <View key={juz} style={[styles.juzRow, tonight && styles.juzTonight]}>
              <Pressable
                onPress={() => toggleJuz(year, juz)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                style={[styles.juzCheck, done && styles.juzCheckOn]}
              >
                <Text style={styles.juzCheckText}>{done ? '✓' : ''}</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/quran/${surah}`)} style={{ flex: 1 }}>
                <Text style={styles.juzTitle}>
                  Night {juz}: Juz {juz}
                  {tonight ? ' · tonight' : ''}
                </Text>
                <Text style={styles.juzSub}>
                  Starts at {SURAHS[surah - 1]?.name} {surah}:{ayah}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laylat al-Qadr</Text>
        <Text style={styles.sub}>
          Better than a thousand months (Quran 97:3). Seek it in the odd nights of the last ten (Sahih al-Bukhari 2017). Each night begins at
          Maghrib the evening before.
        </Text>
        {ODD_NIGHTS.map((n) => {
          const evening = ramadanDay(now, n - 1, adjust);
          return (
            <View key={n} style={styles.nightRow}>
              <Text style={styles.nightName}>Night {n}</Text>
              <Text style={styles.nightDate}>{evening ? `${shortDate(evening)}, after Maghrib` : ''}</Text>
            </View>
          );
        })}
        <Text style={[styles.cardTitle, { fontSize: 15, marginTop: 12 }]}>The dua to say</Text>
        <Text style={styles.arabic}>{RAMADAN_DUAS.qadr.arabic}</Text>
        <Text style={styles.translit}>{RAMADAN_DUAS.qadr.transliteration}</Text>
        <Text style={styles.english}>{RAMADAN_DUAS.qadr.english}</Text>
        <Text style={styles.ref}>{RAMADAN_DUAS.qadr.reference}</Text>
        {Platform.OS !== 'web' && (
          <View style={[styles.headRow, { marginTop: 12 }]}>
            <Text style={[styles.sub, { flex: 1 }]}>Remind me at Maghrib on each odd night</Text>
            <Switch value={worship.qadrReminders} onValueChange={toggleQadr} trackColor={{ true: colors.green }} />
          </View>
        )}
      </View>

      <Text style={styles.footnote}>
        Ramadan dates are estimates; follow your local masjid’s announcement. Suhoor ends at the Fajr time shown, using your calculation
        method in the Prayer tab. Content awaiting review by a qualified scholar.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#24324A', borderRadius: 20, padding: 20, alignItems: 'center' },
  heroKicker: { color: colors.gold, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  heroBig: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 },
  heroSub: { color: '#ffffffdd', fontSize: 16, marginTop: 4, textAlign: 'center' },
  timesRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' },
  timeBox: { flex: 1, backgroundColor: '#ffffff1a', borderRadius: 12, padding: 10, alignItems: 'center' },
  timeLabel: { color: '#ffffffbb', fontSize: 12, fontWeight: '700' },
  timeValue: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  previewBar: { backgroundColor: colors.goldLight, borderRadius: 12, padding: 10, alignItems: 'center' },
  previewText: { fontWeight: '800', color: colors.ink },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16 },
  cardTitle: { fontWeight: '900', fontSize: 17, color: colors.ink },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  headStat: { fontWeight: '800', color: colors.green },
  sub: { color: colors.muted, marginTop: 4, lineHeight: 19 },
  arabic: { fontSize: 24, lineHeight: 42, textAlign: 'right', color: colors.ink, marginTop: 8, writingDirection: 'rtl' },
  translit: { color: colors.green, fontStyle: 'italic', marginTop: 6, lineHeight: 21 },
  english: { color: colors.ink, marginTop: 6, lineHeight: 22, fontSize: 15 },
  ref: { color: colors.muted, fontSize: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  dayCell: { width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dayFasted: { backgroundColor: colors.green, borderColor: colors.green },
  dayMissed: { backgroundColor: colors.red, borderColor: colors.red },
  dayToday: { borderColor: colors.gold, borderWidth: 3 },
  dayNum: { fontWeight: '800', color: colors.ink },
  juzRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10 },
  juzTonight: { backgroundColor: colors.goldLight },
  juzCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  juzCheckOn: { backgroundColor: colors.green, borderColor: colors.green },
  juzCheckText: { color: '#fff', fontWeight: '900' },
  juzTitle: { fontWeight: '800', color: colors.ink },
  juzSub: { color: colors.muted, fontSize: 13 },
  nightRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  nightName: { fontWeight: '800', color: colors.ink },
  nightDate: { color: colors.muted },
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 17 },
});
