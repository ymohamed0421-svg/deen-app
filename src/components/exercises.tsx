import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChoiceExercise, MatchExercise, OrderExercise } from '../content/types';
import { colors } from '../theme';
import { Button } from './Button';

function shuffle<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed + 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props<T> = { exercise: T; seed: number; locked: boolean; onResult: (correct: boolean) => void };

// ---------- multiple choice ----------

export function ChoiceView({ exercise, locked, onResult }: Props<ChoiceExercise>) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <View style={styles.fill}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={styles.gap}>
        {exercise.options.map((option, i) => (
          <Pressable
            key={option}
            disabled={locked}
            onPress={() => setSelected(i)}
            style={[styles.option, selected === i && styles.optionSelected]}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.spacer} />
      {!locked && <Button title="Check" disabled={selected === null} onPress={() => onResult(selected === exercise.answer)} />}
    </View>
  );
}

// ---------- put in order ----------

export function OrderView({ exercise, seed, locked, onResult }: Props<OrderExercise>) {
  const bank = useMemo(() => {
    let s = shuffle(exercise.items.map((text, i) => ({ text, i })), seed);
    // Make sure it doesn't start already solved.
    if (s.every((x, idx) => x.i === idx)) s = [...s.slice(1), s[0]];
    return s;
  }, [exercise, seed]);
  const [chosen, setChosen] = useState<number[]>([]); // indexes into bank
  const answer = chosen.map((b) => bank[b].i);
  return (
    <View style={styles.fill}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={[styles.answerArea]}>
        {chosen.map((b, pos) => (
          <Pressable
            key={b}
            disabled={locked}
            onPress={() => setChosen(chosen.filter((x) => x !== b))}
            style={styles.chip}
          >
            <Text style={styles.chipText}>
              {pos + 1}. {bank[b].text}
            </Text>
          </Pressable>
        ))}
        {chosen.length === 0 && <Text style={styles.hint}>Tap the steps below in the right order</Text>}
      </View>
      <View style={styles.bank}>
        {bank.map((item, b) =>
          chosen.includes(b) ? (
            <View key={b} style={[styles.chip, styles.chipGhost]}>
              <Text style={[styles.chipText, { color: 'transparent' }]}>{item.text}</Text>
            </View>
          ) : (
            <Pressable key={b} disabled={locked} onPress={() => setChosen([...chosen, b])} style={styles.chip}>
              <Text style={styles.chipText}>{item.text}</Text>
            </Pressable>
          ),
        )}
      </View>
      <View style={styles.spacer} />
      {!locked && (
        <Button
          title="Check"
          disabled={chosen.length !== bank.length}
          onPress={() => onResult(answer.every((v, idx) => v === idx))}
        />
      )}
    </View>
  );
}

// ---------- match the pairs ----------

export function MatchView({ exercise, seed, locked, onResult }: Props<MatchExercise>) {
  const left = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p[0], i })), seed), [exercise, seed]);
  const right = useMemo(() => shuffle(exercise.pairs.map((p, i) => ({ text: p[1], i })), seed + 7), [exercise, seed]);
  const [pickedLeft, setPickedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [hadMistake, setHadMistake] = useState(false);

  function pickRight(i: number) {
    if (pickedLeft === null) return;
    if (pickedLeft === i) {
      const next = [...matched, i];
      setMatched(next);
      setPickedLeft(null);
      if (next.length === exercise.pairs.length) onResult(!hadMistake);
    } else {
      setHadMistake(true);
      setWrongFlash(i);
      setPickedLeft(null);
      setTimeout(() => setWrongFlash(null), 500);
    }
  }

  const cell = (text: string, i: number, side: 'l' | 'r') => {
    const done = matched.includes(i);
    const active = side === 'l' && pickedLeft === i;
    const wrong = side === 'r' && wrongFlash === i;
    return (
      <Pressable
        key={`${side}${i}`}
        disabled={locked || done}
        onPress={() => (side === 'l' ? setPickedLeft(i) : pickRight(i))}
        style={[styles.option, styles.matchCell, active && styles.optionSelected, done && styles.matchDone, wrong && styles.matchWrong]}
      >
        <Text style={[styles.optionText, done && { color: colors.green }]}>{text}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.fill}>
      <Text style={styles.prompt}>{exercise.prompt}</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[styles.gap, { flex: 1 }]}>{left.map((x) => cell(x.text, x.i, 'l'))}</View>
        <View style={[styles.gap, { flex: 1 }]}>{right.map((x) => cell(x.text, x.i, 'r'))}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  spacer: { flex: 1, minHeight: 16 },
  prompt: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 20, lineHeight: 28 },
  gap: { gap: 10 },
  option: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.card,
  },
  optionSelected: { borderColor: colors.blue, backgroundColor: '#E6F0F8' },
  optionText: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  matchCell: { minHeight: 56, justifyContent: 'center' },
  matchDone: { borderColor: '#BFE0CF', backgroundColor: '#EEF8F2' },
  matchWrong: { borderColor: colors.red, backgroundColor: colors.redLight },
  answerArea: {
    minHeight: 90,
    borderBottomWidth: 2,
    borderColor: colors.line,
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignContent: 'flex-start',
  },
  hint: { color: colors.muted, fontSize: 15, marginTop: 8 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
  },
  chipGhost: { backgroundColor: colors.line, borderColor: colors.line },
  chipText: { fontSize: 15, color: colors.ink, fontWeight: '600' },
});
