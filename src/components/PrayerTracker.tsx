import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PRAYER_LABELS, formatTime } from '../lib/prayer';
import { usePrayerDay } from '../lib/usePrayerDay';
import { FARD, dayCounts, markFor, weekSummary, type Fard } from '../lib/worship';
import { useWorship, type Reward } from '../state/WorshipProvider';
import { colors } from '../theme';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayOf(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return WEEKDAY[new Date(y, m - 1, d).getDay()];
}

export function rewardLine(r: Reward | null) {
  if (!r) return null;
  const parts: string[] = [];
  if (r.noor > 0) parts.push(`+${r.noor} Noor`);
  if (r.streakExtended) parts.push(`streak ${r.streak} 🔥`);
  return parts.length ? parts.join(' · ') : null;
}

/** Tap each of the five prayers when you've prayed it, and see the last seven days. */
export function PrayerTracker() {
  const { worship, setPrayer } = useWorship();
  const { now, dayKey, today, tomorrow } = usePrayerDay();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const day = selected ?? dayKey;
  const isToday = day === dayKey;
  const log = worship.prayerLog[day] ?? {};
  const counts = dayCounts(log);
  const week = weekSummary(worship.prayerLog, dayKey);

  function tap(p: Fard) {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    if (log[p]) {
      setPrayer(day, p, null, isToday);
      setMessage(null);
      return;
    }
    // Today: on time while the prayer's time is in, late after. Earlier days: on time unless changed.
    const mark = isToday && today && tomorrow ? markFor(p, now, today, tomorrow) ?? 'onTime' : 'onTime';
    const reward = setPrayer(day, p, mark, isToday);
    const after = dayCounts({ ...log, [p]: mark });
    const line = rewardLine(reward);
    setMessage(
      after.onTime === 5 && isToday
        ? `All five on time today. MashaAllah! ${line ?? ''}`
        : line ?? (isToday ? null : 'Saved. Earlier days don’t earn Noor.'),
    );
  }

  function flip(p: Fard) {
    const m = log[p];
    if (!m) return;
    const reward = setPrayer(day, p, m === 'onTime' ? 'late' : 'onTime', isToday);
    setMessage(rewardLine(reward));
  }

  const notYet = (p: Fard) => isToday && today !== null && now < today[p];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{isToday ? 'Did you pray?' : `${weekdayOf(day)} ${day.slice(5).replace('-', '/')}`}</Text>
        <Text style={styles.count}>
          {counts.prayed}/5{counts.prayed > 0 ? ` · ${counts.onTime} on time` : ''}
        </Text>
      </View>
      <Text style={styles.sub}>
        {isToday ? 'Tap a prayer once you’ve prayed it. Praying on time keeps your streak going.' : 'Fill in a day you missed logging.'}
      </Text>

      {FARD.map((p) => {
        const mark = log[p];
        const waiting = notYet(p) && !mark;
        return (
          <View key={p} style={styles.row}>
            <Pressable
              onPress={() => tap(p)}
              disabled={waiting}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(mark), disabled: waiting }}
              accessibilityLabel={`${PRAYER_LABELS[p]}${mark ? ', prayed' : ''}`}
              style={[styles.check, mark === 'onTime' && styles.checkOn, mark === 'late' && styles.checkLate, waiting && { opacity: 0.4 }]}
            >
              <Text style={styles.checkGlyph}>{mark ? '✓' : ''}</Text>
            </Pressable>
            <Pressable onPress={() => tap(p)} disabled={waiting} style={{ flex: 1 }}>
              <Text style={[styles.name, waiting && { color: colors.muted }]}>{PRAYER_LABELS[p]}</Text>
              {isToday && today && <Text style={styles.time}>{waiting ? `Starts ${formatTime(today[p])}` : formatTime(today[p])}</Text>}
            </Pressable>
            {mark && (
              <Pressable onPress={() => flip(p)} style={[styles.chip, mark === 'late' && styles.chipLate]} accessibilityLabel="Change on time or late">
                <Text style={[styles.chipText, mark === 'late' && { color: colors.oil }]}>{mark === 'onTime' ? 'On time' : 'Late'} ⇄</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {message && <Text style={styles.message}>{message}</Text>}

      <Text style={[styles.title, { fontSize: 15, marginTop: 14 }]}>Last 7 days</Text>
      <View style={styles.chart}>
        {week.days.map((d) => {
          const on = d.key === day;
          return (
            <Pressable
              key={d.key}
              onPress={() => {
                setSelected(d.key === dayKey ? null : d.key);
                setMessage(null);
              }}
              style={styles.barCol}
              accessibilityLabel={`${weekdayOf(d.key)}: ${d.prayed} of 5 prayed, ${d.onTime} on time`}
            >
              <View style={styles.barTrack}>
                <View style={{ flex: 5 - d.prayed }} />
                {d.prayed - d.onTime > 0 && <View style={[styles.barLate, { flex: d.prayed - d.onTime }]} />}
                {d.onTime > 0 && <View style={[styles.barOn, { flex: d.onTime }]} />}
              </View>
              <Text style={[styles.barLabel, on && { color: colors.green, fontWeight: '900' }]}>
                {d.key === dayKey ? 'Today' : weekdayOf(d.key)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.dot, { backgroundColor: colors.green }]} />
        <Text style={styles.legend}>On time</Text>
        <View style={[styles.dot, { backgroundColor: colors.gold }]} />
        <Text style={styles.legend}>Late</Text>
        <Text style={[styles.legend, { flex: 1, textAlign: 'right' }]}>
          {week.prayed}/35 this week · {week.onTime} on time
        </Text>
      </View>
      {!isToday && (
        <Pressable onPress={() => setSelected(null)}>
          <Text style={styles.backToday}>Back to today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontWeight: '900', fontSize: 18, color: colors.ink },
  count: { fontWeight: '800', color: colors.green },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 8, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  check: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.green, borderColor: colors.green },
  checkLate: { backgroundColor: colors.gold, borderColor: colors.gold },
  checkGlyph: { color: '#fff', fontWeight: '900', fontSize: 18 },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  time: { color: colors.muted, fontSize: 13 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#EEF8F2' },
  chipLate: { backgroundColor: colors.goldLight },
  chipText: { fontWeight: '800', color: colors.green, fontSize: 13 },
  message: { marginTop: 6, color: colors.green, fontWeight: '800', textAlign: 'center' },
  chart: { flexDirection: 'row', gap: 6, marginTop: 10, height: 110 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { flex: 1, width: '70%', borderRadius: 8, backgroundColor: colors.bg, overflow: 'hidden' },
  barOn: { backgroundColor: colors.green },
  barLate: { backgroundColor: colors.gold },
  barLabel: { fontSize: 11, color: colors.muted, marginTop: 4, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legend: { color: colors.muted, fontSize: 12, marginRight: 6 },
  backToday: { color: colors.blue, fontWeight: '800', textAlign: 'center', marginTop: 10 },
});
