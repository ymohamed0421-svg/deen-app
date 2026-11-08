import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ChoiceExercise, FillExercise, MatchExercise, OrderExercise, TrueFalseExercise } from '../content/types';
import { colors, themed } from '../theme';
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

type Props<T> = { exercise: T; seed: number; locked: boolean; onResult: (correct: boolean) => void; big?: boolean };

const ARABIC = /[\u0600-\u06FF]/;

/** Arabic letters and words need to be much bigger than English to read. */
function textStyle(text: string, big?: boolean) {
  if (ARABIC.test(text)) return [styles.optionText, styles.arabicText];
  return big ? [styles.optionText, styles.bigText] : styles.optionText;
}

function Picture({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.picture}>
      <Text style={[styles.pictureText, ARABIC.test(value) && styles.pictureArabic]}>{value}</Text>
    </View>
  );
}

// ---------- multiple choice ----------

export function ChoiceView({ exercise, locked, onResult, big }: Props<ChoiceExercise>) {
  const [selected, setSelected] = useState<number | null>(null);
  const glyphs = exercise.options.every((o) => ARABIC.test(o) && o.length <= 4);
  return (
    <View style={styles.fill}>
      <Text style={[styles.prompt, big && styles.bigPrompt]}>{exercise.prompt}</Text>
      <Picture value={exercise.picture} />
      <View style={[styles.gap, glyphs && styles.glyphRow]}>
        {exercise.options.map((option, i) => (
          <Pressable
            key={option}
            disabled={locked}
            onPress={() => setSelected(i)}
            style={[styles.option, glyphs && styles.glyphOption, big && styles.bigOption, selected === i && styles.optionSelected]}
          >
            <Text style={textStyle(option, big)}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.spacer} />
      {!locked && <Button title="Check" disabled={selected === null} onPress={() => onResult(selected === exercise.answer)} />}
    </View>
  );
}

// ---------- true or false ----------

export function TrueFalseView({ exercise, locked, onResult, big }: Props<TrueFalseExercise>) {
  const [selected, setSelected] = useState<boolean | null>(null);
  return (
    <View style={styles.fill}>
      <Text style={styles.kicker}>{big ? 'YES OR NO?' : 'TRUE OR FALSE?'}</Text>
      <Picture value={exercise.picture} />
      <View style={styles.statement}>
        <Text style={[styles.statementText, big && { fontSize: 24, lineHeight: 34 }]}>{exercise.statement}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {[true, false].map((v) => (
          <Pressable
            key={String(v)}
            disabled={locked}
            onPress={() => setSelected(v)}
            style={[styles.option, styles.tfOption, selected === v && styles.optionSelected]}
          >
            <Text style={styles.tfIcon}>{v ? '✓' : '✗'}</Text>
            <Text style={textStyle('x', big)}>{big ? (v ? 'Yes' : 'No') : v ? 'True' : 'False'}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.spacer} />
      {!locked && <Button title="Check" disabled={selected === null} onPress={() => onResult(selected === exercise.answer)} />}
    </View>
  );
}

// ---------- fill in the blank ----------

export function FillView({ exercise, locked, onResult }: Props<FillExercise>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [before, after] = exercise.sentence.split('___');
  return (
    <View style={styles.fill}>
      <Text style={styles.kicker}>FILL IN THE BLANK</Text>
      <View style={styles.statement}>
        <Text style={styles.statementText}>
          {before}
          <Text style={styles.blank}>{selected === null ? ' ______ ' : ` ${exercise.options[selected]} `}</Text>
          {after}
        </Text>
      </View>
      <View style={styles.bank}>
        {exercise.options.map((o, i) => (
          <Pressable key={o} disabled={locked} onPress={() => setSelected(i)} style={[styles.chip, selected === i && styles.optionSelected]}>
            <Text style={styles.chipText}>{o}</Text>
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
            <Text style={[styles.chipText, ARABIC.test(bank[b].text) && styles.arabicChip]}>
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
              <Text style={[styles.chipText, ARABIC.test(item.text) && styles.arabicChip, { color: 'transparent' }]}>{item.text}</Text>
            </View>
          ) : (
            <Pressable key={b} disabled={locked} onPress={() => setChosen([...chosen, b])} style={styles.chip}>
              <Text style={[styles.chipText, ARABIC.test(item.text) && styles.arabicChip]}>{item.text}</Text>
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
        <Text style={[textStyle(text), done && { color: colors.green }]}>{text}</Text>
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

const styles = themed(() => ({
  fill: { flex: 1 },
  picture: { alignSelf: 'center', minWidth: 140, paddingHorizontal: 24, paddingVertical: 8, marginBottom: 20, borderRadius: 24, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, alignItems: 'center' },
  pictureText: { fontSize: 72, lineHeight: 96, color: colors.ink },
  pictureArabic: { fontSize: 64, lineHeight: 120 },
  arabicText: { fontSize: 30, lineHeight: 50, fontWeight: '400', textAlign: 'center' },
  arabicChip: { fontSize: 24, lineHeight: 40 },
  bigText: { fontSize: 20, fontWeight: '800' },
  bigPrompt: { fontSize: 26, lineHeight: 34, textAlign: 'center' },
  bigOption: { paddingVertical: 18, borderRadius: 20 },
  glyphRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  glyphOption: { minWidth: 72, alignItems: 'center' },
  kicker: { fontWeight: '900', color: colors.muted, letterSpacing: 1, fontSize: 12, marginBottom: 10 },
  statement: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, borderRadius: 16, padding: 18, marginBottom: 20 },
  statementText: { fontSize: 20, lineHeight: 30, color: colors.ink, fontWeight: '700' },
  blank: { color: colors.blue, textDecorationLine: 'underline', fontWeight: '900' },
  tfOption: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  tfIcon: { fontSize: 28, fontWeight: '900', color: colors.ink },
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
  optionSelected: { borderColor: colors.blue, backgroundColor: colors.blueLight },
  optionText: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  matchCell: { minHeight: 56, justifyContent: 'center' },
  matchDone: { borderColor: colors.greenBorder, backgroundColor: colors.greenLight },
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
}));
