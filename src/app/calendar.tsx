import { router } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { HIJRI_MONTHS_AR, HIJRI_SOURCE, formatHijri, hijriOf, inDaysText, upcomingEvents, upcomingSunnahFasts } from '../lib/hijri';
import { requestReminderPermission } from '../lib/reminders';
import { useNow } from '../lib/usePrayerDay';
import { useWorship } from '../state/WorshipProvider';
import { colors } from '../theme';

function gregorian(d: Date) {
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CalendarScreen() {
  const { worship, update } = useWorship();
  const now = useNow(60_000);
  const adjust = worship.hijriAdjust;
  const h = hijriOf(now, adjust);
  const events = upcomingEvents(now, adjust);
  const fasts = upcomingSunnahFasts(now, 14, adjust);

  async function toggleFastReminders(on: boolean) {
    if (on && !(await requestReminderPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Deen in your phone settings to get fasting reminders.');
      return;
    }
    update({ fastReminders: on });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
      <View style={styles.hero}>
        <Text style={styles.heroAr}>
          {h.day} {HIJRI_MONTHS_AR[h.month - 1]} {h.year}
        </Text>
        <Text style={styles.heroDate}>{formatHijri(h)}</Text>
        <Text style={styles.heroGreg}>{gregorian(now)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Match your masjid</Text>
        <Text style={styles.sub}>
          Months start with the moon sighting, so your community may be a day ahead or behind. Shift the date to match.
        </Text>
        <View style={styles.stepper}>
          {[-2, -1, 0, 1, 2].map((n) => (
            <Pressable key={n} onPress={() => update({ hijriAdjust: n })} style={[styles.step, adjust === n && styles.stepOn]}>
              <Text style={[styles.stepText, adjust === n && { color: '#fff' }]}>{n === 0 ? '0' : n > 0 ? `+${n}` : n}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.section}>Coming up</Text>
      {events.map((e) => (
        <Pressable
          key={e.id}
          disabled={e.id !== 'ramadan' && e.id !== 'qadr'}
          onPress={() => router.push('/ramadan')}
          style={[styles.event, e.id === 'ramadan' && { borderColor: colors.gold }]}
        >
          <View style={styles.countBox}>
            <Text style={styles.countNum}>{e.inDays}</Text>
            <Text style={styles.countUnit}>{e.inDays === 1 ? 'day' : 'days'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{e.title}</Text>
            <Text style={styles.eventDate}>
              {gregorian(e.date)} · {inDaysText(e.inDays)}
            </Text>
            <Text style={styles.sub}>{e.note}</Text>
          </View>
        </Pressable>
      ))}

      <Text style={styles.section}>Sunnah fasts, next two weeks</Text>
      <View style={styles.card}>
        {fasts.length === 0 && <Text style={styles.sub}>None in the next two weeks.</Text>}
        {fasts.map((f) => (
          <View key={f.date.toDateString()} style={styles.fastRow}>
            <Text style={styles.fastDate}>{gregorian(f.date)}</Text>
            <Text style={styles.fastReason}>{f.reason}</Text>
          </View>
        ))}
        <Text style={[styles.sub, { marginTop: 8 }]}>
          The Prophet ﷺ fasted Mondays and Thursdays (Jami‘ at-Tirmidhi 745) and the White Days, the 13th, 14th and 15th of each Hijri month
          (Jami‘ at-Tirmidhi 761). No fasting on the two Eids or the three days after Eid al-Adha.
        </Text>
      </View>

      {Platform.OS === 'web' ? (
        <Text style={styles.footnote}>Fasting reminders work in the phone app.</Text>
      ) : (
        <View style={[styles.card, styles.switchRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Remind me the night before</Text>
            <Text style={styles.sub}>A notification at 9 PM before each sunnah fast, so you can plan suhoor.</Text>
          </View>
          <Switch value={worship.fastReminders} onValueChange={toggleFastReminders} trackColor={{ true: colors.green }} />
        </View>
      )}

      <Text style={styles.footnote}>
        Dates use the {HIJRI_SOURCE === 'Umm al-Qura' ? 'Umm al-Qura calendar' : 'standard arithmetic Hijri calendar'} and are estimates. The
        start of Ramadan and the Eids depends on the moon sighting your community follows. Content awaiting review by a qualified scholar.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.green, borderRadius: 20, padding: 20, alignItems: 'center' },
  heroAr: { color: '#fff', fontSize: 30, fontWeight: '700', writingDirection: 'rtl' },
  heroDate: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 6 },
  heroGreg: { color: '#ffffffcc', marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16 },
  cardTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  sub: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  stepper: { flexDirection: 'row', gap: 8, marginTop: 10 },
  step: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 2, borderColor: colors.line, alignItems: 'center' },
  stepOn: { backgroundColor: colors.green, borderColor: colors.green },
  stepText: { fontWeight: '800', color: colors.ink },
  section: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 4 },
  event: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 14 },
  countBox: { width: 64, alignItems: 'center', paddingVertical: 6, borderRadius: 12, backgroundColor: colors.goldLight },
  countNum: { fontSize: 24, fontWeight: '900', color: colors.ink },
  countUnit: { fontSize: 11, fontWeight: '800', color: colors.muted },
  eventTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  eventDate: { color: colors.green, fontWeight: '700', marginTop: 2 },
  fastRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  fastDate: { fontWeight: '800', color: colors.ink },
  fastReason: { color: colors.muted, flexShrink: 1, textAlign: 'right' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 17 },
});
