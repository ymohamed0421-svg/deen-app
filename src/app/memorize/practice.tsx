import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Fanous, SpeechBubble } from '../../components/Fanous';
import { loadSurah } from '../../quran/load';
import { ayahKey, dueKeys, parseKey, weakKeys, words, type Grade } from '../../quran/memorize';
import { SURAHS } from '../../quran/surahs';
import { useGame } from '../../state/GameProvider';
import { gradeAyah, useMemorizeStore } from '../../state/memorizeStore';
import { useRecitation } from '../../state/RecitationProvider';
import { colors, themed } from '../../theme';

type Item = { surah: number; index: number };
type Phase = 'setup' | 'recite' | 'done';

/**
 * Practice reciting from memory.
 * /memorize/practice?surah=1&from=0&to=6  picks a range of one surah (0 based, inclusive)
 * /memorize/practice?mode=review          everything due today
 * /memorize/practice?mode=weak            only the ayahs you keep missing
 */
export default function PracticeScreen() {
  const params = useLocalSearchParams<{ surah?: string; from?: string; to?: string; mode?: string }>();
  const mode = params.mode === 'review' || params.mode === 'weak' ? params.mode : 'range';
  const surahId = Number(params.surah ?? 1);
  const meta = SURAHS.find((s) => s.id === surahId);
  const total = meta?.verses ?? 0;
  const { today } = useGame();
  const memo = useMemorizeStore();
  const rec = useRecitation();

  const [from, setFrom] = useState(() => clamp(Number(params.from ?? 0), 0, total - 1));
  const [to, setTo] = useState(() => clamp(Number(params.to ?? Math.min(6, total - 1)), 0, total - 1));
  const [phase, setPhase] = useState<Phase>(mode === 'range' ? 'setup' : 'recite');
  const [queue, setQueue] = useState<Item[]>(() => (mode === 'range' ? [] : listFor(mode)));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hints, setHints] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [results, setResults] = useState<Record<string, Grade>>({}); // first try only
  const listening = useRef(false);

  function listFor(m: 'review' | 'weak'): Item[] {
    return (m === 'review' ? dueKeys(memo, today) : weakKeys(memo)).map(parseKey);
  }

  // The review list fills in once saved progress has loaded.
  useEffect(() => {
    if (mode !== 'range' && queue.length === 0 && phase === 'recite') setQueue(listFor(mode));
  }, [memo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop any listening we started when leaving the screen.
  useEffect(() => () => {
    if (listening.current) rec.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const item = queue[pos];
  const ayahs = useMemo(() => (item ? loadSurah(item.surah) : []), [item?.surah]); // eslint-disable-line react-hooks/exhaustive-deps
  const ayah = item ? ayahs[item.index] : undefined;
  const ayahWords = ayah ? words(ayah[0]) : [];
  const itemMeta = item ? SURAHS.find((s) => s.id === item.surah) : undefined;
  const firstTryCount = Object.keys(results).length;

  function start() {
    const list: Item[] = [];
    for (let i = from; i <= to; i++) list.push({ surah: surahId, index: i });
    setQueue(list);
    setPos(0);
    setResults({});
    setPhase('recite');
  }

  function stopListening() {
    if (listening.current) {
      rec.stop();
      listening.current = false;
    }
  }

  function listen() {
    if (!item) return;
    // Repeats this one ayah until you move on.
    listening.current = true;
    rec.loopRange(item.surah, item.index, item.index);
  }

  function mark(result: Grade) {
    if (!item) return;
    const key = ayahKey(item.surah, item.index);
    gradeAyah(item.surah, item.index, result, today);
    if (!(key in results)) setResults((r) => ({ ...r, [key]: result }));
    // A missed ayah comes back at the end of this session too.
    const nextQueue = result === 'missed' ? [...queue, item] : queue;
    setQueue(nextQueue);
    stopListening();
    setRevealed(false);
    setHints(0);
    setShowMeaning(false);
    if (pos + 1 >= nextQueue.length) setPhase('done');
    else setPos(pos + 1);
  }

  function practiseWeakAgain() {
    const weak = queue.filter((q, i) => queue.findIndex((x) => x.surah === q.surah && x.index === q.index) === i && results[ayahKey(q.surah, q.index)] !== 'got');
    setQueue(weak);
    setPos(0);
    setResults({});
    setPhase('recite');
  }

  if (mode === 'range' && !meta) return <Text style={{ padding: 20 }}>Surah not found</Text>;

  const title = mode === 'review' ? 'Review' : mode === 'weak' ? 'Weak ayahs' : `Memorize ${meta?.name}`;

  return (
    <View style={styles.safe}>
      <Stack.Screen options={{ title }} />

      {phase === 'setup' && meta && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.hero}>
            <Fanous size={64} />
            <SpeechBubble text="Pick a few ayahs. I’ll hide them, you recite from memory, then check yourself." />
          </View>
          <Text style={styles.label}>Which ayahs?</Text>
          <Stepper label="From ayah" value={from + 1} onMove={(by) => {
            const f = clamp(from + by, 0, total - 1);
            setFrom(f);
            if (f > to) setTo(f);
          }} />
          <Stepper label="To ayah" value={to + 1} onMove={(by) => {
            const t = clamp(to + by, 0, total - 1);
            setTo(t);
            if (t < from) setFrom(t);
          }} />
          <Text style={styles.tip}>
            Tip: start small, 3 to 7 ayahs. Listen to them on loop first, then come here to test yourself. Ayahs you miss come back until they stick.
          </Text>
          <Button title={`Start: ayahs ${from + 1}–${to + 1}`} onPress={start} style={{ marginTop: 16 }} />
        </ScrollView>
      )}

      {phase === 'recite' && !item && (
        <View style={[styles.body, { alignItems: 'center' }]}>
          <Fanous mood="cheer" size={100} />
          <Text style={styles.big}>{mode === 'weak' ? 'No weak ayahs. MashaAllah!' : 'Nothing to review today.'}</Text>
          <Text style={styles.tip}>Open any surah and tap “Memorize” to start on new ayahs.</Text>
          <Button title="Back" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 20 }} />
        </View>
      )}

      {phase === 'recite' && item && ayah && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(pos / queue.length) * 100}%` }]} />
          </View>
          <Text style={styles.kicker}>
            {itemMeta?.name.toUpperCase()} · AYAH {item.index + 1}
          </Text>

          {item.index > 0 && (
            <View style={styles.cue}>
              <Text style={styles.cueLabel}>Comes after</Text>
              <Text style={styles.cueArabic} numberOfLines={2}>
                {ayahs[item.index - 1][0]}
              </Text>
            </View>
          )}
          {item.index === 0 && <Text style={styles.cueLabel}>The first ayah of the surah</Text>}

          <View style={styles.card}>
            {revealed ? (
              <>
                <Text style={styles.arabic}>{ayah[0]}</Text>
                <Text style={styles.translit}>{ayah[2]}</Text>
                <Text style={styles.english}>{ayah[1]}</Text>
              </>
            ) : (
              <>
                <View style={styles.words}>
                  {ayahWords.map((w, i) =>
                    i < hints ? (
                      <Text key={i} style={styles.word}>
                        {w}
                      </Text>
                    ) : (
                      <View key={i} style={[styles.hidden, { width: 18 + Math.min(w.length, 12) * 5 }]} />
                    ),
                  )}
                </View>
                <Text style={styles.count}>{ayahWords.length} words</Text>
                {showMeaning && <Text style={styles.english}>{ayah[1]}</Text>}
              </>
            )}
          </View>

          {!revealed ? (
            <>
              <Text style={styles.tip}>Recite it out loud from memory, then reveal to check.</Text>
              <View style={styles.row}>
                <SmallBtn text={hints >= ayahWords.length ? 'All words shown' : '💡 Next word'} disabled={hints >= ayahWords.length} onPress={() => setHints((h) => h + 1)} />
                <SmallBtn text={showMeaning ? 'Hide meaning' : '📝 Meaning'} onPress={() => setShowMeaning((v) => !v)} />
                <SmallBtn text={rec.playing && listening.current ? '⏸ Stop' : '🔊 Listen'} onPress={() => (rec.playing && listening.current ? stopListening() : listen())} />
              </View>
              <Button title="Reveal" onPress={() => setRevealed(true)} style={{ marginTop: 16 }} />
            </>
          ) : (
            <>
              <Text style={styles.tip}>How did it go?</Text>
              <View style={{ gap: 10 }}>
                <Button title="✅ I got it" onPress={() => mark(hints > 0 ? 'hint' : 'got')} />
                <Button title="❌ I missed some" color={colors.red} shadow="#9A3F2C" onPress={() => mark('missed')} />
              </View>
              {hints > 0 && <Text style={styles.small}>You used a hint, so this one comes back sooner.</Text>}
              <View style={[styles.row, { marginTop: 12 }]}>
                <SmallBtn text={rec.playing && listening.current ? '⏸ Stop' : '🔊 Listen'} onPress={() => (rec.playing && listening.current ? stopListening() : listen())} />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {phase === 'done' && (
        <ScrollView contentContainerStyle={[styles.body, { alignItems: 'center' }]}>
          <Fanous mood="cheer" size={110} flame={1} />
          <Text style={styles.big}>Session done!</Text>
          <Text style={styles.summary}>
            {Object.values(results).filter((r) => r === 'got').length} of {firstTryCount} right on the first try
          </Text>
          {Object.values(results).some((r) => r !== 'got') ? (
            <>
              <Text style={styles.tip}>The ayahs you missed or needed a hint for will come back in your review.</Text>
              <Button title="Practise those again now" onPress={practiseWeakAgain} style={{ alignSelf: 'stretch', marginTop: 16 }} />
            </>
          ) : (
            <Text style={styles.tip}>Every ayah on the first try. They will come back in a few days to keep them fresh.</Text>
          )}
          <Button title="Done" variant="outline" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 10 }} />
        </ScrollView>
      )}
    </View>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

function SmallBtn({ text, onPress, disabled }: { text: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.small_btn, disabled && { opacity: 0.5 }]} accessibilityRole="button">
      <Text style={styles.smallBtnText}>{text}</Text>
    </Pressable>
  );
}

function Stepper({ label, value, onMove }: { label: string; value: number; onMove: (by: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {[-10, -1].map((by) => (
          <Pressable key={by} onPress={() => onMove(by)} style={styles.stepBtn} accessibilityLabel={`${label} ${by}`}>
            <Text style={styles.stepBtnText}>{by === -1 ? '−' : '−10'}</Text>
          </Pressable>
        ))}
        <Text style={styles.stepValue}>{value}</Text>
        {[1, 10].map((by) => (
          <Pressable key={by} onPress={() => onMove(by)} style={styles.stepBtn} accessibilityLabel={`${label} plus ${by}`}>
            <Text style={styles.stepBtnText}>{by === 1 ? '+' : '+10'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 48, flexGrow: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  label: { fontSize: 18, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  tip: { color: colors.muted, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  small: { color: colors.muted, fontSize: 13, marginTop: 8, textAlign: 'center' },
  big: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 12, textAlign: 'center' },
  summary: { fontSize: 17, color: colors.ink, marginTop: 8, fontWeight: '700' },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1, fontSize: 12, marginTop: 12 },
  progressTrack: { height: 12, borderRadius: 6, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 6 },
  cue: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: colors.goldLight },
  cueLabel: { color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 10 },
  cueArabic: { fontSize: 20, lineHeight: 36, color: colors.ink, textAlign: 'right', writingDirection: 'rtl', opacity: 0.8 },
  card: { marginTop: 14, padding: 18, minHeight: 160, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, justifyContent: 'center' },
  words: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  word: { fontSize: 26, lineHeight: 46, color: colors.ink },
  hidden: { height: 26, borderRadius: 8, backgroundColor: colors.line, marginVertical: 10 },
  count: { color: colors.muted, fontSize: 12, marginTop: 10, textAlign: 'center' },
  arabic: { fontSize: 28, lineHeight: 52, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  translit: { fontSize: 15, color: colors.green, fontStyle: 'italic', marginTop: 8, lineHeight: 22 },
  english: { fontSize: 16, color: colors.ink, marginTop: 8, lineHeight: 24 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  small_btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  smallBtnText: { fontWeight: '800', color: colors.ink, fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  stepLabel: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  stepValue: { minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.green },
  stepBtn: { minWidth: 38, height: 38, paddingHorizontal: 6, borderRadius: 12, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontWeight: '800', color: colors.ink },
}));
