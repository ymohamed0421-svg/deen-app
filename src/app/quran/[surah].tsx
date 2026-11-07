import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadSurah } from '../../quran/load';
import { RECITERS, ayahUrl } from '../../quran/reciters';
import { SURAHS } from '../../quran/surahs';
import { useSettings } from '../../state/SettingsProvider';
import { colors } from '../../theme';

type LoopMode = 'off' | 'ayah' | 'surah';
const LOOP_LABEL: Record<LoopMode, string> = { off: 'Loop off', ayah: 'Loop ayah', surah: 'Loop surah' };
const NEXT_LOOP: Record<LoopMode, LoopMode> = { off: 'ayah', ayah: 'surah', surah: 'off' };

export default function SurahScreen() {
  const { surah } = useLocalSearchParams<{ surah: string }>();
  const id = Number(surah);
  const meta = SURAHS.find((s) => s.id === id);
  const ayahs = useMemo(() => loadSurah(id), [id]);
  const { settings, update } = useSettings();

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<number | null>(null); // index of the ayah playing
  const [loop, setLoop] = useState<LoopMode>('off');
  const [showReciters, setShowReciters] = useState(false);
  const [showTranslit, setShowTranslit] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    // Keep reciting with the screen locked or the phone on silent.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  }, []);

  // Looping one ayah is handled by the player itself.
  useEffect(() => {
    player.loop = loop === 'ayah';
  }, [loop, player]);

  function playAyah(index: number) {
    setCurrent(index);
    player.replace({ uri: ayahUrl(settings.reciter, id, index + 1) });
    player.loop = loop === 'ayah';
    player.play();
    listRef.current?.scrollToIndex({ index, viewPosition: 0.2, animated: true });
  }

  // When an ayah ends, move to the next one, or wrap around when looping the surah.
  useEffect(() => {
    if (!status.didJustFinish || current === null || loop === 'ayah') return;
    const next = current + 1;
    if (next < ayahs.length) playAyah(next);
    else if (loop === 'surah') playAyah(0);
    else setCurrent(null);
  }, [status.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePlay() {
    if (current === null) return playAyah(0);
    if (status.playing) player.pause();
    else player.play();
  }

  function chooseReciter(reciterId: string) {
    update({ reciter: reciterId });
    setShowReciters(false);
    if (current !== null) {
      player.replace({ uri: ayahUrl(reciterId, id, current + 1) });
      player.play();
    }
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
            <Pressable onPress={() => setShowTranslit((v) => !v)} style={styles.smallToggle}>
              <Text style={styles.smallToggleText}>{showTranslit ? 'Hide' : 'Show'} transliteration</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const active = current === index;
          return (
            <View style={[styles.ayah, active && styles.ayahActive]}>
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
                    onPress={() => (active && status.playing ? player.pause() : playAyah(index))}
                    style={styles.iconBtn}
                  >
                    <Text style={styles.iconBtnText}>{active && status.playing ? '⏸' : '▶'}</Text>
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
            </Text>
          )}
        </Pressable>
        <Pressable onPress={() => setLoop(NEXT_LOOP[loop])} style={[styles.loopBtn, loop !== 'off' && styles.loopOn]}>
          <Text style={[styles.loopText, loop !== 'off' && { color: '#fff' }]}>{LOOP_LABEL[loop]}</Text>
        </Pressable>
        <Pressable onPress={togglePlay} style={styles.playBtn} accessibilityLabel={status.playing ? 'Pause' : 'Play surah'}>
          <Text style={styles.playText}>{status.playing ? '⏸' : '▶'}</Text>
        </Pressable>
      </View>

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
