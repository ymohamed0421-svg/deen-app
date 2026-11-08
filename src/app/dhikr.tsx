import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { rewardLine } from '../components/PrayerTracker';
import { AFTER_SALAH, TASBIH_PRESETS, adhkarFor, type AdhkarSet, type Dhikr } from '../content/adhkar';
import { toDateKey } from '../game/rules';
import { WORSHIP_REWARDS } from '../lib/worship';
import { loadSurah } from '../quran/load';
import { useWorship } from '../state/WorshipProvider';
import { colors, themed } from '../theme';

type Tab = 'tasbih' | AdhkarSet;

function haptic(strong = false) {
  if (Platform.OS === 'web') return;
  (strong ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => {});
}

export default function DhikrScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const hour = new Date().getHours();
  const initial: Tab = params.tab === 'morning' || params.tab === 'evening' || params.tab === 'tasbih' ? params.tab : hour < 12 ? 'morning' : hour >= 15 ? 'evening' : 'tasbih';
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.segment}>
        {(['morning', 'evening', 'tasbih'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, tab === t && styles.segOn]}>
            <Text style={[styles.segText, tab === t && { color: '#fff' }]}>
              {t === 'morning' ? '🌅 Morning' : t === 'evening' ? '🌙 Evening' : '📿 Tasbih'}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'tasbih' ? <Tasbih /> : <Adhkar key={tab} set={tab} />}
    </View>
  );
}

function Tasbih() {
  const { worship, countTasbih } = useWorship();
  const [presetId, setPresetId] = useState(TASBIH_PRESETS[0].id);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const preset = TASBIH_PRESETS.find((p) => p.id === presetId)!;
  const today = worship.tasbih.day === toDateKey(new Date()) ? worship.tasbih.today : 0;

  function choose(id: string) {
    setPresetId(id);
    setCount(0);
    setMessage(null);
  }

  function tap() {
    const next = count + 1;
    const reachedTarget = preset.target > 0 && next === preset.target;
    // The tasbih after salah ends on the 34th Allahu Akbar.
    const finishedSet = reachedTarget && presetId === AFTER_SALAH[AFTER_SALAH.length - 1];
    const reward = countTasbih(finishedSet);
    haptic(reachedTarget);
    if (reachedTarget) {
      const i = AFTER_SALAH.indexOf(presetId);
      if (i >= 0 && i < AFTER_SALAH.length - 1) {
        // Move on to the next of the three.
        setPresetId(AFTER_SALAH[i + 1]);
        setCount(0);
        setMessage(`${preset.label} ×${preset.target} done`);
        return;
      }
      setMessage(finishedSet ? `Tasbih complete. ${rewardLine(reward) ?? ''}` : `${preset.label} ×${preset.target} done`);
    } else if (preset.target > 0 && next > preset.target) {
      setMessage(null);
    }
    setCount(next);
  }

  const progress = preset.target > 0 ? Math.min(1, count / preset.target) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48, alignItems: 'center' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ alignSelf: 'stretch' }}>
        {TASBIH_PRESETS.map((p) => (
          <Pressable key={p.id} onPress={() => choose(p.id)} style={[styles.chip, p.id === presetId && styles.chipOn]}>
            <Text style={[styles.chipText, p.id === presetId && { color: '#fff' }]}>
              {p.label}
              {p.target ? ` ${p.target}` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {preset.arabic ? <Text style={styles.bigArabic}>{preset.arabic}</Text> : <Text style={styles.sub}>Count anything you like.</Text>}

      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel={`Count. ${count}${preset.target ? ` of ${preset.target}` : ''}`}
        style={({ pressed }) => [styles.counter, pressed && { transform: [{ scale: 0.97 }] }]}
      >
        <View style={[styles.counterFill, { height: `${progress * 100}%` }]} />
        <Text style={styles.counterNum}>{count}</Text>
        {preset.target > 0 && <Text style={styles.counterOf}>of {preset.target}</Text>}
        <Text style={styles.counterHint}>Tap anywhere on the circle</Text>
      </Pressable>

      {message && <Text style={styles.message}>{message}</Text>}

      <Pressable onPress={() => choose(presetId)}>
        <Text style={styles.link}>Reset</Text>
      </Pressable>

      <Text style={styles.sub}>
        Today: {today} · All time: {worship.tasbih.total}
      </Text>
      <Text style={styles.note}>
        After each prayer: SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 (Sahih Muslim 597). The counter moves on by itself. A full set earns{' '}
        {WORSHIP_REWARDS.tasbihSetNoor} Noor, up to {WORSHIP_REWARDS.tasbihSetsPerDay} times a day.
      </Text>
    </ScrollView>
  );
}

function arabicOf(d: Dhikr) {
  if (typeof d.arabic === 'string') return d.arabic;
  return d.arabic
    .map(([surah, from, to]) =>
      loadSurah(surah)
        .slice(from - 1, to)
        .map((a) => a[0])
        .join(' ۝ '),
    )
    .join('\n\n');
}

function Adhkar({ set }: { set: AdhkarSet }) {
  const { worship, countAdhkar } = useWorship();
  const list = useMemo(() => adhkarFor(set), [set]);
  const all = useMemo(() => list.map((d) => ({ id: d.id, times: d.times })), [list]);
  const [message, setMessage] = useState<string | null>(null);
  const isToday = worship.adhkar.day === toDateKey(new Date());
  const countOf = (id: string) => (isToday ? worship.adhkar.counts[`${set}:${id}`] ?? 0 : 0);
  const doneCount = list.filter((d) => countOf(d.id) >= d.times).length;
  const finished = isToday && worship.adhkar.done.includes(set);

  function tap(d: Dhikr) {
    if (countOf(d.id) >= d.times) return;
    const last = countOf(d.id) + 1 >= d.times;
    haptic(last);
    const reward = countAdhkar(set, d.id, d.times, all);
    if (reward) setMessage(`${set === 'morning' ? 'Morning' : 'Evening'} adhkar complete. ${rewardLine(reward) ?? ''}`);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      <View style={styles.progressCard}>
        <Text style={styles.title}>{set === 'morning' ? 'Morning adhkar' : 'Evening adhkar'}</Text>
        <Text style={styles.sub}>
          {set === 'morning' ? 'Best said after Fajr, before the sun is high.' : 'Best said after Asr, before the night sets in.'} Tap a card each
          time you say it.
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(doneCount / list.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {finished ? `Done today ✓ (+${WORSHIP_REWARDS.adhkarNoor} Noor)` : `${doneCount} of ${list.length} · finish all for ${WORSHIP_REWARDS.adhkarNoor} Noor`}
        </Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      {list.map((d) => {
        const c = countOf(d.id);
        const done = c >= d.times;
        return (
          <Pressable key={d.id} onPress={() => tap(d)} style={[styles.card, done && styles.cardDone]} accessibilityRole="button">
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{d.title}</Text>
              <View style={[styles.badge, done && { backgroundColor: colors.green }]}>
                <Text style={[styles.badgeText, done && { color: '#fff' }]}>{done ? '✓' : d.times > 1 ? `${d.times - c} left` : 'Tap'}</Text>
              </View>
            </View>
            <Text style={styles.arabic}>{arabicOf(d)}</Text>
            <Text style={styles.translit}>{d.transliteration}</Text>
            <Text style={styles.english}>{d.english}</Text>
            {d.virtue && <Text style={styles.virtue}>{d.virtue}</Text>}
            <Text style={styles.ref}>
              {d.times > 1 ? `${d.times} times · ` : ''}
              {d.reference}
            </Text>
          </Pressable>
        );
      })}
      <Text style={styles.note}>These adhkar are a first draft awaiting review by a qualified scholar.</Text>
    </ScrollView>
  );
}

const styles = themed(() => ({
  segment: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center' },
  segOn: { backgroundColor: colors.green, borderColor: colors.green },
  segText: { fontWeight: '800', color: colors.ink },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontWeight: '800', color: colors.ink },
  bigArabic: { fontSize: 34, color: colors.ink, textAlign: 'center', marginTop: 8 },
  counter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.card,
    borderWidth: 6,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  counterFill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.greenLight },
  counterNum: { fontSize: 72, fontWeight: '900', color: colors.green },
  counterOf: { fontSize: 16, color: colors.muted, fontWeight: '700' },
  counterHint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  message: { color: colors.greenInk, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  link: { color: colors.blue, fontWeight: '800' },
  sub: { color: colors.muted, lineHeight: 19, textAlign: 'center' },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 17 },
  progressCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16, gap: 6 },
  title: { fontWeight: '900', fontSize: 20, color: colors.ink },
  progressTrack: { height: 12, borderRadius: 6, backgroundColor: colors.bg, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: 12, backgroundColor: colors.green },
  progressText: { fontWeight: '800', color: colors.greenInk },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.line, padding: 16 },
  cardDone: { opacity: 0.6, borderColor: colors.green },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: '900', fontSize: 16, color: colors.ink, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.goldLight },
  badgeText: { fontWeight: '900', color: colors.ink, fontSize: 13 },
  arabic: { fontSize: 24, lineHeight: 44, textAlign: 'right', color: colors.ink, marginTop: 8, writingDirection: 'rtl' },
  translit: { color: colors.greenInk, fontStyle: 'italic', marginTop: 6, lineHeight: 21 },
  english: { color: colors.ink, marginTop: 6, lineHeight: 22, fontSize: 15 },
  virtue: { color: colors.muted, marginTop: 6, lineHeight: 20, fontSize: 14 },
  ref: { color: colors.muted, fontSize: 12, marginTop: 8 },
}));
