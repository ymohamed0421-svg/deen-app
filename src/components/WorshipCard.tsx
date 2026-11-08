import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toDateKey } from '../game/rules';
import { formatHijri, hijriOf, inDaysText, upcomingEvents } from '../lib/hijri';
import { PRAYER_LABELS, formatCountdown } from '../lib/prayer';
import { usePrayerDay } from '../lib/usePrayerDay';
import { FARD, dayCounts } from '../lib/worship';
import { useWorship } from '../state/WorshipProvider';
import { colors } from '../theme';

/** Home screen card: Hijri date, the next big day, today's prayers and the adhkar. */
export function WorshipCard() {
  const { worship } = useWorship();
  const { now, dayKey, today } = usePrayerDay(60_000);
  const adjust = worship.hijriAdjust;
  const h = hijriOf(now, adjust);
  const inRamadan = h.month === 9;
  const next = upcomingEvents(now, adjust).find((e) => !(inRamadan && e.id === 'ramadan'));
  const log = worship.prayerLog[dayKey] ?? {};
  const counts = dayCounts(log);
  const adhkarDone = worship.adhkar.day === toDateKey(now) ? worship.adhkar.done : [];
  const hour = now.getHours();
  const adhkarSet = hour < 12 ? 'morning' : hour >= 15 ? 'evening' : null;

  let ramadanLine: string | null = null;
  if (inRamadan && today) {
    if (now < today.maghrib && now >= today.fajr) ramadanLine = `Iftar in ${formatCountdown(today.maghrib.getTime() - now.getTime())}`;
    else ramadanLine = 'Ramadan Mubarak';
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(inRamadan ? '/ramadan' : '/calendar')} style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hijri}>{formatHijri(h)}</Text>
          <Text style={styles.event}>
            {inRamadan
              ? `🌙 Day ${h.day} of Ramadan${ramadanLine ? ` · ${ramadanLine}` : ''}`
              : next
                ? `${next.title} ${inDaysText(next.inDays)}`
                : ''}
          </Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/prayer')} style={styles.prayers} accessibilityLabel={`Today's prayers: ${counts.prayed} of 5. Open the tracker`}>
        <Text style={styles.label}>Today’s prayers</Text>
        <View style={styles.dots}>
          {FARD.map((p) => (
            <View key={p} style={styles.dotCol}>
              <View style={[styles.dot, log[p] === 'onTime' && { backgroundColor: colors.green }, log[p] === 'late' && { backgroundColor: colors.gold }]}>
                <Text style={styles.dotGlyph}>{log[p] ? '✓' : ''}</Text>
              </View>
              <Text style={styles.dotLabel}>{PRAYER_LABELS[p]}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      {adhkarSet && !adhkarDone.includes(adhkarSet) && (
        <Pressable onPress={() => router.push(`/dhikr?tab=${adhkarSet}`)} style={styles.adhkar}>
          <Text style={styles.adhkarText}>{adhkarSet === 'morning' ? '🌅 Say your morning adhkar' : '🌙 Say your evening adhkar'}</Text>
          <Text style={styles.adhkarNoor}>+10 Noor</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, padding: 14, marginBottom: 12, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center' },
  hijri: { fontWeight: '900', fontSize: 16, color: colors.ink },
  event: { color: colors.green, fontWeight: '700', marginTop: 2 },
  chev: { fontSize: 26, color: colors.muted },
  prayers: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  label: { fontWeight: '800', color: colors.muted, fontSize: 12, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dotCol: { alignItems: 'center', flex: 1 },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  dotGlyph: { color: '#fff', fontWeight: '900' },
  dotLabel: { fontSize: 11, color: colors.muted, marginTop: 3, fontWeight: '700' },
  adhkar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.goldLight, borderRadius: 12, padding: 10 },
  adhkarText: { fontWeight: '800', color: colors.ink },
  adhkarNoor: { fontWeight: '800', color: colors.oil },
});
