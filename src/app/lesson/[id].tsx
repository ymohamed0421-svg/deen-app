import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { ChoiceView, FillView, MatchView, OrderView, TrueFalseView } from '../../components/exercises';
import { Fanous, SpeechBubble, correctLines, wrongLines } from '../../components/Fanous';
import { exercisesFor, findLesson } from '../../content/units';
import { useSettings } from '../../state/SettingsProvider';
import type { Exercise } from '../../content/types';
import { wouldFinishUnit } from '../../game/progress';
import { MAX_OIL, type LessonRewards } from '../../game/rules';
import { useGame } from '../../state/GameProvider';
import { colors } from '../../theme';

type Phase = 'teach' | 'play' | 'done' | 'out-of-oil';

function haptic(kind: 'ok' | 'bad') {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findLesson(String(id));
  const { state, finishLesson, loseOil } = useGame();
  const level = useSettings().settings.level ?? 'beginner';
  const exercises = found ? exercisesFor(found.lesson, level) : [];

  // The queue holds exercise indexes. A wrong answer sends the exercise to the back to try again.
  const [queue, setQueue] = useState<number[]>(() => exercises.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [phase, setPhase] = useState<Phase>('teach');
  const [result, setResult] = useState<null | boolean>(null);
  const [mistakes, setMistakes] = useState(0);
  const [rewards, setRewards] = useState<LessonRewards | null>(null);
  const attempt = useRef(0);
  const finishesUnit = useMemo(() => (found ? wouldFinishUnit(state, found.lesson.id) : false), [found?.lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!found) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Lesson not found</Text>
        <Button title="Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  const { unit, lesson } = found;
  const total = exercises.length;
  const solved = position - (queue.length - total); // retries don't count as progress
  const progress = phase === 'done' ? 1 : Math.max(0, Math.min(1, solved / total));
  const exercise: Exercise | undefined = exercises[queue[position]];

  function onResult(correct: boolean) {
    setResult(correct);
    haptic(correct ? 'ok' : 'bad');
    if (!correct) {
      setMistakes((m) => m + 1);
      loseOil(unit.foundation);
      setQueue((q) => [...q, q[position]]);
    }
  }

  function onContinue() {
    const next = position + 1;
    setResult(null);
    attempt.current += 1;
    if (!unit.foundation && state.wallet.oil <= 0) {
      setPhase('out-of-oil');
      return;
    }
    if (next >= queue.length) {
      setRewards(finishLesson({ lessonId: lesson.id, mistakes, unitFinished: finishesUnit }));
      setPhase('done');
      return;
    }
    setPosition(next);
  }

  const seed = attempt.current + position * 13;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close lesson" hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: unit.color }]} />
        </View>
        <Text style={styles.oil}>💧 {unit.foundation ? '∞' : `${state.wallet.oil}/${MAX_OIL}`}</Text>
      </View>

      {phase === 'teach' && (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.kicker}>{unit.title.toUpperCase()}</Text>
          <Text style={styles.title}>{lesson.title}</Text>
          <View style={styles.teachCard}>
            <Text style={styles.teachText}>{lesson.teach}</Text>
          </View>
          <View style={styles.fanousRow}>
            <Fanous size={64} />
            <SpeechBubble text="Read this, then let’s practise. Mistakes are how we learn." />
          </View>
          <View style={{ height: 24 }} />
          <Button title="Start" color={unit.color} onPress={() => setPhase('play')} />
        </ScrollView>
      )}

      {phase === 'play' && exercise && (
        <View style={styles.playArea}>
          <View style={styles.body} key={`${position}-${queue[position]}`}>
            {exercise.type === 'choice' && <ChoiceView exercise={exercise} seed={seed} locked={result !== null} onResult={onResult} />}
            {exercise.type === 'order' && <OrderView exercise={exercise} seed={seed} locked={result !== null} onResult={onResult} />}
            {exercise.type === 'match' && <MatchView exercise={exercise} seed={seed} locked={result !== null} onResult={onResult} />}
            {exercise.type === 'truefalse' && <TrueFalseView exercise={exercise} seed={seed} locked={result !== null} onResult={onResult} />}
            {exercise.type === 'fill' && <FillView exercise={exercise} seed={seed} locked={result !== null} onResult={onResult} />}
          </View>
          {result !== null && (
            <View style={[styles.feedback, { backgroundColor: result ? '#DDF1E5' : colors.redLight }]}>
              <Text style={[styles.feedbackTitle, { color: result ? colors.green : colors.red }]}>
                {result ? correctLines[seed % correctLines.length] : wrongLines[seed % wrongLines.length]}
              </Text>
              <Text style={styles.feedbackText}>{exercise.explain}</Text>
              {exercise.source && <Text style={styles.source}>Source: {exercise.source.reference}</Text>}
              <Button
                title="Continue"
                color={result ? colors.green : colors.red}
                shadow={result ? colors.greenDark : '#9A3F2C'}
                onPress={onContinue}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </View>
      )}

      {phase === 'done' && rewards && (
        <ScrollView contentContainerStyle={[styles.body, { alignItems: 'center' }]}>
          <Fanous mood="cheer" size={120} flame={1} />
          <Text style={[styles.title, { textAlign: 'center', marginTop: 12 }]}>
            {mistakes === 0 ? 'Perfect lesson!' : 'Lesson complete!'}
          </Text>
          <View style={styles.rewardRow}>
            <Reward label="Noor" value={`+${rewards.noor}`} icon="✨" color={colors.green} />
            <Reward label="Pearls" value={`+${rewards.pearls}`} icon="⚪" color={colors.pearl} />
            <Reward label="Streak" value={`${rewards.streak}`} icon="🪔" color={colors.gold} />
          </View>
          {rewards.streakExtended && (
            <Text style={styles.doneLine}>
              {rewards.streak === 1 ? 'Your first flame is lit!' : `${rewards.streak} days in a row. MashaAllah!`}
            </Text>
          )}
          {rewards.mercyDaysUsed > 0 && <Text style={styles.doneLine}>A Mercy Day saved your streak.</Text>}
          {rewards.milestone && <Text style={styles.doneLine}>Milestone reached: {rewards.milestone} days! Bonus Pearls added.</Text>}
          {finishesUnit && rewards.firstTime && <Text style={styles.doneLine}>🎁 Unit chest opened: +30 Pearls</Text>}
          {rewards.firstTime && <Text style={styles.doneLine}>🌱 A new plant is growing in your garden.</Text>}
          <View style={{ height: 24 }} />
          <Button title="Continue" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </ScrollView>
      )}

      {phase === 'out-of-oil' && (
        <View style={[styles.body, { alignItems: 'center' }]}>
          <Fanous mood="worried" size={110} flame={0.2} />
          <Text style={[styles.title, { textAlign: 'center', marginTop: 12 }]}>Out of Oil</Text>
          <Text style={styles.doneLine}>Oil refills one drop every 30 minutes. You can also refill in the Shop, or keep learning in the foundation units, which never use Oil.</Text>
          <View style={{ height: 24 }} />
          <Button title="Go to Shop" onPress={() => router.replace('/shop')} style={{ alignSelf: 'stretch' }} />
          <Button title="Back to Path" variant="outline" onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: 10 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Reward({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[styles.reward, { borderColor: color }]}>
      <Text style={[styles.rewardLabel, { backgroundColor: color }]}>{label}</Text>
      <Text style={styles.rewardValue}>
        {icon} {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  close: { fontSize: 22, color: colors.muted, fontWeight: '700' },
  progressTrack: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.line, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  oil: { fontWeight: '800', color: colors.oil },
  playArea: { flex: 1 },
  body: { flexGrow: 1, flex: 1, padding: 20 },
  kicker: { color: colors.muted, fontWeight: '800', letterSpacing: 1, fontSize: 12 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink, marginTop: 4 },
  teachCard: { marginTop: 16, padding: 18, borderRadius: 16, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  teachText: { fontSize: 17, lineHeight: 26, color: colors.ink },
  fanousRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  feedback: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  feedbackTitle: { fontSize: 20, fontWeight: '900' },
  feedbackText: { fontSize: 15, color: colors.ink, marginTop: 6, lineHeight: 21 },
  source: { fontSize: 13, color: colors.muted, marginTop: 6, fontStyle: 'italic' },
  rewardRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  reward: { borderWidth: 2, borderRadius: 14, overflow: 'hidden', minWidth: 96, alignItems: 'center', backgroundColor: colors.card },
  rewardLabel: { color: '#fff', fontWeight: '800', fontSize: 12, alignSelf: 'stretch', textAlign: 'center', paddingVertical: 4 },
  rewardValue: { fontSize: 20, fontWeight: '900', color: colors.ink, paddingVertical: 10 },
  doneLine: { fontSize: 16, color: colors.ink, marginTop: 12, textAlign: 'center', lineHeight: 22 },
});
