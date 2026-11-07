import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadSurah } from '../../quran/load';
import { RECITERS } from '../../quran/reciters';
import { SURAHS } from '../../quran/surahs';
import { useRecitation, type LoopMode } from '../../state/RecitationProvider';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

const LOOP_LABEL: Record<LoopMode, string> = { off: 'Loop off', ayah: 'Loop ayah', range: 'Loop range', surah: 'Loop surah' };
const NEXT_LOOP: Record<LoopMode, LoopMode> = { off: 'ayah', ayah: 'surah', range: 'off', surah: 'off' };

export default function SurahScreen() {
  const { surah } = useLocalSearchParams<{ surah: string }>();
  const id = Number(surah);
  const meta = SURAHS.find((s) => s.id === id);
  const ayahs = useMemo(() => loadSurah(id), [id]);
  const { settings } = useSettings();
  const rec = useRecitation();

  // Recitation keeps playing in the background and across screens, so show it only when it is this surah.
  const here = rec.surah === id;
  const current = here ? rec.index : null;
  const playing = here && rec.playing;
  const loop = rec.loop;
  const looping = here && loop === 'range';

  const [showReciters, setShowReciters] = useState(false);
  const [showTranslit, setShowTranslit] = useState(true);
  const [showRange, setShowRange] = useState(false);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const listRef = useRef<FlatList>(null);

  // Follow the ayah being recited.
  useEffect(() => {
    if (current !== null && playing) listRef.current?.scrollToIndex({ index: current, viewPosition: 0.2, animated: true });
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  function playAyah(index: number) {
    rec.playAyah(id, index);
  }

  function togglePlay() {
    if (!here) return playAyah(0);
    rec.toggle();
  }

  function chooseReciter(reciterId: string) {
    setShowReciters(false);
    rec.changeReciter(reciterId);
  }

  function setLoop(next: LoopMode) {
    rec.setLoop(next);
  }

  function openRange() {
    if (looping) {
      setFrom(rec.range.from);
      setTo(rec.range.to);
    } else {
      // Start from the ayah playing now, or the top, and suggest ten ayahs.
      const start = current ?? 0;
      setFrom(start);
      setTo(Math.min(start + 9, ayahs.length - 1));
    }
    setShowRange(true);
  }

  function startRange() {
    setShowRange(false);
    rec.loopRange(id, from, to);
  }

  // Keep From at or before To while stepping.
  function moveFrom(by: number) {
    const f = Math.max(0, Math.min(ayahs.length - 1, from + by));
    setFrom(f);
    if (f > to) setTo(f);
  }
  function moveTo(by: number) {
    const t = Math.max(0, Math.min(ayahs.length - 1, to + by));
    setTo(t);
    if (t < from) setFrom(t);
  }

  if (!meta) return <Text style={{ padding: 20 }}>Surah not found</Text>;
  const reciter = RECITERS.find((r) => r.id === settings.reciter) ?? RECITERS[0];

  return (
    <View style={styles.safe}>
      <Stack.Screen options={{ title: `${meta.id}. ${meta.name}` }} />
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(_, i) => String(i)}
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerArabic}>{meta.arabic}</Text>
            <Text style={styles.headerMeta}>
              {meta.meaning} · {meta.verses} ayahs
            </Text>
            {id !== 1 && id !== 9 && <Text style={styles.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable onPress={() => setShowTranslit((v) => !v)} style={styles.smallToggle}>
                <Text style={styles.smallToggleText}>{showTranslit ? 'Hide' : 'Show'} transliteration</Text>
              </Pressable>
              <Pressable onPress={openRange} style={[styles.smallToggle, looping && styles.smallToggleOn]} accessibilityLabel="Loop a range of ayahs">
                <Text style={[styles.smallToggleText, looping && { color: '#fff' }]}>
                  🔁 {looping ? `Looping ${rec.range.from + 1}–${rec.range.to + 1}` : 'Loop a range'}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const active = current === index;
          const inRange = looping && index >= rec.range.from && index <= rec.range.to;
          return (
            <View style={[styles.ayah, inRange && styles.ayahInRange, active && styles.ayahActive]}>
              <View style={styles.ayahTop}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{index + 1}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    accessibilityLabel={`Loop ayah ${index + 1}`}
                    onPress={() => {
                      setLoop('ayah');
                      playAyah(index);
                    }}
                    style={[styles.iconBtn, active && loop === 'ayah' && styles.iconBtnOn]}
                  >
                    <Text style={styles.iconBtnText}>🔁</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Play ayah ${index + 1}`}
                    onPress={() => (active && playing ? rec.toggle() : playAyah(index))}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.iconBtnText}>{active && playing ? '⏸' : '▶'}</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.arabic}>{item[0]}</Text>
              {showTranslit && <Text style={styles.translit}>{item[2]}</Text>}
              <Text style={styles.english}>{item[1]}</Text>
            </View>
          );
        }}
      />

      <View style={styles.bar}>
        <Pressable onPress={() => setShowReciters(true)} style={{ flex: 1 }}>
          <Text style={styles.barLabel}>RECITER</Text>
          <Text style={styles.barValue} numberOfLines={1}>
            {reciter.name} ▾
          </Text>
          {current !== null && (
            <Text style={styles.barSub}>
              Ayah {current + 1} of {ayahs.length}
              {looping ? ` · repeating ${rec.range.from + 1}–${rec.range.to + 1}` : ''}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={() => setLoop(NEXT_LOOP[loop])} style={[styles.loopBtn, loop !== 'off' && styles.loopOn]}>
          <Text style={[styles.loopText, loop !== 'off' && { color: '#fff' }]}>{LOOP_LABEL[loop]}</Text>
        </Pressable>
        <Pressable onPress={togglePlay} style={styles.playBtn} accessibilityLabel={playing ? 'Pause' : 'Play surah'}>
          <Text style={styles.playText}>{playing ? '⏸' : '▶'}</Text>
        </Pressable>
      </View>

      <Modal visible={showRange} transparent animationType="slide" onRequestClose={() => setShowRange(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowRange(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Loop a range</Text>
          <Text style={styles.sheetHint}>Pick the ayahs to memorize. They repeat over and over with no gap until you stop.</Text>
          <Stepper label="From ayah" value={from + 1} onMove={moveFrom} />
          <Stepper label="To ayah" value={to + 1} onMove={moveTo} />
          <View style={styles.presets}>
            {[
              { label: 'First half', f: 0, t: Math.max(0, Math.ceil(ayahs.length / 2) - 1) },
              { label: 'Second half', f: Math.ceil(ayahs.length / 2) >= ayahs.length ? 0 : Math.ceil(ayahs.length / 2), t: ayahs.length - 1 },
              { label: 'Whole surah', f: 0, t: ayahs.length - 1 },
            ].map((p) => (
              <Pressable
                key={p.label}
                onPress={() => {
                  setFrom(p.f);
                  setTo(p.t);
                }}
                style={[styles.preset, from === p.f && to === p.t && styles.presetOn]}
              >
                <Text style={styles.presetText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={startRange} style={styles.startBtn} accessibilityLabel="Start looping">
            <Text style={styles.startText}>
              🔁 Loop ayahs {from + 1}–{to + 1}
            </Text>
          </Pressable>
          {looping && (
            <Pressable
              onPress={() => {
                setShowRange(false);
                setLoop('off');
              }}
              style={styles.stopLoop}
            >
              <Text style={styles.smallToggleText}>Stop looping</Text>
            </Pressable>
          )}
        </View>
      </Modal>

      <Modal visible={showReciters} transparent animationType="slide" onRequestClose={() => setShowReciters(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowReciters(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Choose a reciter</Text>
          <ScrollView>
            {RECITERS.map((r) => (
              <Pressable key={r.id} onPress={() => chooseReciter(r.id)} style={[styles.reciter, r.id === reciter.id && styles.reciterOn]}>
                <Text style={styles.reciterName}>{r.name}</Text>
                {r.id === reciter.id && <Text style={{ color: colors.green, fontWeight: '900' }}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Stepper({ label, value, onMove }: { label: string; value: number; onMove: (by: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <StepBtn text="−10" onPress={() => onMove(-10)} label={`${label} minus 10`} />
        <StepBtn text="−" onPress={() => onMove(-1)} label={`${label} minus 1`} />
        <Text style={styles.stepValue}>{value}</Text>
        <StepBtn text="+" onPress={() => onMove(1)} label={`${label} plus 1`} />
        <StepBtn text="+10" onPress={() => onMove(10)} label={`${label} plus 10`} />
      </View>
    </View>
  );
}

function StepBtn({ text, onPress, label }: { text: string; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.stepBtn} accessibilityLabel={label}>
      <Text style={styles.stepBtnText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', padding: 20, gap: 6 },
  headerArabic: { fontSize: 36, color: colors.green },
  headerMeta: { color: colors.muted },
  bismillah: { fontSize: 26, color: colors.ink, marginTop: 10 },
  smallToggle: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.line },
  smallToggleText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  ayah: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  ayahActive: { backgroundColor: '#EEF8F2' },
  ayahInRange: { backgroundColor: '#FBF6EA' },
  smallToggleOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  sheetHint: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  stepLabel: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  stepValue: { minWidth: 40, textAlign: 'center', fontSize: 20, fontWeight: '900', color: colors.green },
  stepBtn: { minWidth: 38, height: 38, paddingHorizontal: 6, borderRadius: 12, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontWeight: '800', color: colors.ink },
  presets: { flexDirection: 'row', gap: 8, marginVertical: 12, flexWrap: 'wrap' },
  preset: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 2, borderColor: colors.line },
  presetOn: { borderColor: colors.gold, backgroundColor: colors.goldLight },
  presetText: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  startBtn: { backgroundColor: colors.green, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  stopLoop: { alignItems: 'center', paddingVertical: 12 },
  ayahTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '800', color: '#9A6B12', fontSize: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: colors.goldLight, borderColor: colors.gold },
  iconBtnText: { fontSize: 15 },
  arabic: { fontSize: 28, lineHeight: 52, color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  translit: { fontSize: 15, color: colors.green, fontStyle: 'italic', marginTop: 8, lineHeight: 22 },
  english: { fontSize: 16, color: colors.ink, marginTop: 6, lineHeight: 24 },
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  barLabel: { fontSize: 11, fontWeight: '900', color: colors.muted, letterSpacing: 1 },
  barValue: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  barSub: { color: colors.muted, fontSize: 12 },
  loopBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: colors.line },
  loopOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  loopText: { fontWeight: '800', fontSize: 12, color: colors.ink },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 22 },
  backdrop: { flex: 1, backgroundColor: '#0006' },
  sheet: { maxHeight: '60%', backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: colors.ink, marginBottom: 10 },
  reciter: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12 },
  reciterOn: { backgroundColor: '#EEF8F2' },
  reciterName: { fontSize: 16, color: colors.ink, fontWeight: '600' },
});
