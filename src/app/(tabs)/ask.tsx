import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fanous } from '../../components/Fanous';
import { CONFIDENT_MATCH, FAQ, FAQ_TOPICS, searchFaq, type Faq, type FaqTopic } from '../../content/faq';
import { askAvailable, askQuestion, type ChatTurn } from '../../lib/ask';
import { colors, themed } from '../../theme';

type Turn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; source: 'library' | 'ai' | 'none'; faq?: Faq; related?: Faq[]; question?: string };

export default function AskScreen() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<FaqTopic | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  const scrollDown = () => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);

  async function askAi(question: string, history: Turn[]) {
    setError(null);
    setBusy(true);
    try {
      const chat: ChatTurn[] = history.map((t) => ({ role: t.role, content: t.content }));
      if (chat[chat.length - 1]?.content !== question) chat.push({ role: 'user', content: question });
      const answer = await askQuestion(chat);
      setTurns((now) => [...now, { role: 'assistant', content: answer, source: 'ai' }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    setError(null);
    const exact = FAQ.find((f) => f.question === q);
    const matches = exact ? [{ faq: exact, score: 1 }] : searchFaq(q, 4);
    const best = matches[0];
    const next: Turn[] = [...turns, { role: 'user', content: q }];

    if (best && best.score >= CONFIDENT_MATCH) {
      const related = matches.slice(1).filter((m) => m.score >= 0.34).map((m) => m.faq);
      setTurns([...next, { role: 'assistant', content: best.faq.answer, source: 'library', faq: best.faq, related, question: q }]);
      scrollDown();
      return;
    }
    if (askAvailable) {
      setTurns(next);
      askAi(q, next);
      return;
    }
    setTurns([
      ...next,
      {
        role: 'assistant',
        source: 'none',
        question: q,
        related: matches.map((m) => m.faq),
        content: matches.length
          ? 'I don’t have an answer to exactly that yet. Are any of these what you meant?'
          : 'I don’t have an answer to that in the library yet. Try different words, or browse the topics above. For anything important, ask a local imam or scholar.',
      },
    ]);
    scrollDown();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Ask about Islam</Text>
          <Text style={styles.note}>
            Common questions are answered from the app’s library, with Quran and hadith references and where the madhabs
            differ.{askAvailable ? ' Other questions are answered by Google’s Gemini AI, which can make mistakes. Don’t type anything private, as Google may use questions to improve its AI.' : ''} Check important
            matters with a qualified scholar.
          </Text>

          {turns.length === 0 && (
            <View style={{ gap: 10, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Fanous size={56} />
                <Text style={[styles.note, { flex: 1 }]}>Type a question, or pick a topic to browse.</Text>
              </View>
              <View style={styles.chips}>
                {FAQ_TOPICS.map((t) => (
                  <Pressable key={t} onPress={() => setTopic(topic === t ? null : t)} style={[styles.chip, topic === t && styles.chipOn]}>
                    <Text style={[styles.chipText, topic === t && { color: '#fff' }]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              {topic &&
                FAQ.filter((f) => f.topic === topic).map((f) => (
                  <Pressable key={f.id} onPress={() => send(f.question)} style={styles.suggestion}>
                    <Text style={styles.suggestionText}>{f.question}</Text>
                  </Pressable>
                ))}
            </View>
          )}

          {turns.map((t, i) =>
            t.role === 'user' ? (
              <View key={i} style={[styles.bubble, styles.user]}>
                <Text style={[styles.bubbleText, { color: '#fff' }]}>{t.content}</Text>
              </View>
            ) : (
              <View key={i} style={[styles.bubble, styles.bot]}>
                {t.source === 'library' && t.faq && <Text style={styles.tag}>FROM THE LIBRARY · {t.faq.question.toUpperCase()}</Text>}
                {t.source === 'ai' && <Text style={[styles.tag, { color: colors.blue }]}>AI ANSWER · CHECK WITH A SCHOLAR</Text>}
                <Text style={styles.bubbleText}>{t.content}</Text>
                {t.faq && t.faq.refs.length > 0 && <Text style={styles.refs}>{t.faq.refs.join(' · ')}</Text>}
                {t.related && t.related.length > 0 && (
                  <View style={{ gap: 6, marginTop: 10 }}>
                    {t.source === 'library' && <Text style={styles.relatedLabel}>Related</Text>}
                    {t.related.map((f) => (
                      <Pressable key={f.id} onPress={() => send(f.question)} style={styles.related}>
                        <Text style={styles.relatedText}>{f.question}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {t.source === 'library' && askAvailable && t.question && i === turns.length - 1 && !busy && (
                  <Pressable onPress={() => askAi(t.question!, turns.slice(0, -1))} style={{ marginTop: 10 }}>
                    <Text style={styles.link}>Not what you asked? Ask AI instead</Text>
                  </Pressable>
                )}
              </View>
            ),
          )}
          {busy && (
            <View style={[styles.bubble, styles.bot, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
              <ActivityIndicator color={colors.green} />
              <Text style={styles.bubbleText}>Looking through the sources…</Text>
            </View>
          )}
          {error && <Text style={{ color: colors.red }}>{error}</Text>}
          {turns.length > 0 && !busy && (
            <Pressable onPress={() => setTurns([])}>
              <Text style={[styles.link, { textAlign: 'center' }]}>Browse topics</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <Pressable onPress={() => send(input)} disabled={!input.trim() || busy} style={[styles.send, (!input.trim() || busy) && { opacity: 0.4 }]}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  note: { color: colors.muted, lineHeight: 20 },
  suggestion: { padding: 14, borderRadius: 14, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  suggestionText: { color: colors.ink, fontWeight: '600' },
  bubble: { padding: 14, borderRadius: 18, maxWidth: '90%' },
  user: { alignSelf: 'flex-end', backgroundColor: colors.green, borderBottomRightRadius: 4 },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, borderBottomLeftRadius: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontWeight: '800', color: colors.ink, fontSize: 13 },
  tag: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  refs: { color: colors.muted, fontSize: 13, marginTop: 10, lineHeight: 19 },
  relatedLabel: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  related: { padding: 10, borderRadius: 12, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  relatedText: { color: colors.ink, fontWeight: '600' },
  link: { color: colors.blue, fontWeight: '800' },
  bubbleText: { fontSize: 16, lineHeight: 23, color: colors.ink },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: colors.bg, alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 120, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card, fontSize: 16, color: colors.ink },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
}));
