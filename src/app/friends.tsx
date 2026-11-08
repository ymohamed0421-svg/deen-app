import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Fanous, SpeechBubble } from '../components/Fanous';
import { addFriend, getFriendCode, getMyName, listFriends, removeFriend, sendNudge, setMyName } from '../lib/friends';
import {
  formatCode,
  inviteLink,
  inviteMessage,
  isCompleteCode,
  normalizeCode,
  nudgeButtonLabel,
  nudgeOptions,
  statusLine,
  type Friend,
  type NudgeKind,
} from '../lib/friendsLogic';
import { supabase } from '../lib/supabase';
import { useGame } from '../state/GameProvider';
import { colors } from '../theme';

function confirm(title: string, message: string, ok: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function FriendsScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { displayStreak } = useGame();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [entry, setEntry] = useState(params.code ? normalizeCode(params.code) : '');
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, n, f] = await Promise.all([getFriendCode(), getMyName(), listFriends()]);
      setCode(c);
      setName(n);
      setFriends(f);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Opening an invite link fills in the code.
  useEffect(() => {
    if (params.code) setEntry(normalizeCode(params.code));
  }, [params.code]);

  async function saveName() {
    const n = nameDraft.trim();
    if (!n) return;
    try {
      await setMyName(n);
      setName(n);
      setEditingName(false);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }

  async function add() {
    if (!isCompleteCode(entry)) return;
    setAdding(true);
    setNotice(null);
    try {
      const who = await addFriend(entry);
      setEntry('');
      setNotice(`🎉 You and ${who} are now streak buddies!`);
      setFriends(await listFriends());
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function share() {
    if (!code) return;
    const message = inviteMessage(code, name);
    if (Platform.OS === 'web') {
      const nav = navigator as Navigator & { share?: (d: { text: string; url?: string }) => Promise<void> };
      try {
        if (nav.share) {
          await nav.share({ text: message });
          return;
        }
        await nav.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // They closed the share sheet.
      }
      return;
    }
    Share.share({ message }).catch(() => {});
  }

  async function nudge(f: Friend, kind: NudgeKind) {
    const flag = kind === 'pray' ? 'nudged_pray' : 'nudged_study';
    setFriends((list) => list.map((x) => (x.friend_id === f.friend_id ? { ...x, [flag]: true } : x)));
    try {
      await sendNudge(f.friend_id, kind);
      setNotice(`Nudge sent to ${f.name}. They’ll see it next time they open Deen.`);
    } catch (e) {
      setFriends((list) => list.map((x) => (x.friend_id === f.friend_id ? { ...x, [flag]: false } : x)));
      setNotice((e as Error).message);
    }
  }

  async function remove(f: Friend) {
    if (!(await confirm(`Remove ${f.name}?`, 'You’ll stop seeing each other’s streaks, and your buddy streak ends.', 'Remove'))) return;
    try {
      await removeFriend(f.friend_id);
      setFriends((list) => list.filter((x) => x.friend_id !== f.friend_id));
    } catch (e) {
      setNotice((e as Error).message);
    }
  }

  if (!supabase) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ padding: 20 }}>
          <Text style={styles.text}>Friends need the Deen server, which isn’t set up in this copy of the app.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const needsName = !loading && !error && (!name || editingName);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>Streak buddies</Text>
        <Text style={styles.text}>
          Add friends to see each other’s streaks, keep a buddy streak going on days you both learn, and send a gentle nudge when
          someone hasn’t prayed or studied yet.
        </Text>

        {loading && <ActivityIndicator color={colors.green} style={{ marginTop: 24 }} />}

        {error && (
          <View style={[styles.card, { borderColor: colors.red, backgroundColor: colors.redLight }]}>
            <Text style={styles.cardText}>{error}</Text>
            <Button title="Try again" variant="outline" onPress={() => { setLoading(true); load(); }} style={{ marginTop: 12 }} />
          </View>
        )}

        {needsName && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What should friends call you?</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your first name"
              placeholderTextColor={colors.muted}
              maxLength={30}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={saveName}
              style={styles.input}
            />
            <Button title="Save" onPress={saveName} disabled={!nameDraft.trim()} style={{ marginTop: 10 }} />
          </View>
        )}

        {code && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Your friend code</Text>
              {name && !editingName && (
                <Pressable onPress={() => { setNameDraft(name); setEditingName(true); }}>
                  <Text style={styles.link}>{name} · Edit</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.code} selectable>{formatCode(code)}</Text>
            <Text style={styles.small} selectable>{inviteLink(code)}</Text>
            <Button title={copied ? 'Copied!' : 'Invite a friend'} onPress={share} style={{ marginTop: 12 }} />
          </View>
        )}

        {!loading && !error && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add a friend</Text>
            <Text style={styles.cardText}>Type their 6-letter code, or paste their invite.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                value={entry}
                onChangeText={(t) => setEntry(normalizeCode(t))}
                placeholder="ABC 234"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={add}
                style={[styles.input, styles.codeInput, { flex: 1, minWidth: 0, marginTop: 0 }]}
              />
              <Button title={adding ? '…' : 'Add'} onPress={add} disabled={!isCompleteCode(entry) || adding} />
            </View>
            {params.code && entry && <Text style={[styles.small, { marginTop: 8 }]}>Tap Add to become streak buddies.</Text>}
          </View>
        )}

        {notice && (
          <Pressable onPress={() => setNotice(null)} style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </Pressable>
        )}

        {friends.length > 0 && (
          <Text style={[styles.title, { fontSize: 20, marginTop: 20 }]}>Friends · today</Text>
        )}
        {friends.map((f) => (
          <View key={f.friend_id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.friendName} numberOfLines={1}>{f.name}</Text>
              <Text style={styles.streak}>🪔 {f.streak}</Text>
            </View>
            <Text style={styles.cardText}>{statusLine(f)}</Text>
            {f.buddy_streak > 0 ? (
              <Text style={styles.buddy}>🤝 {f.buddy_streak}-day buddy streak</Text>
            ) : (
              <Text style={styles.small}>🤝 Both learn today to start a buddy streak</Text>
            )}
            <View style={styles.nudges}>
              {nudgeOptions(f).map((kind) => {
                const sent = kind === 'pray' ? f.nudged_pray : f.nudged_study;
                return (
                  <Pressable
                    key={kind}
                    disabled={sent}
                    onPress={() => nudge(f, kind)}
                    style={({ pressed }) => [styles.nudge, sent && styles.nudgeSent, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={[styles.nudgeText, sent && { color: colors.muted }]}>{sent ? `✓ ${kind === 'pray' ? 'Prayer' : 'Study'} nudge sent` : nudgeButtonLabel(kind)}</Text>
                  </Pressable>
                );
              })}
              {nudgeOptions(f).length === 0 && <Text style={styles.buddy}>MashaAllah, all done today!</Text>}
            </View>
            <Pressable onPress={() => remove(f)} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}

        {!loading && !error && friends.length === 0 && (
          <View style={styles.fanousRow}>
            <Fanous size={60} mood="cheer" />
            <SpeechBubble text={`Your streak is ${displayStreak}. It’s easier to keep going together. Invite a friend!`} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  text: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  card: { marginTop: 14, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line },
  cardTitle: { fontWeight: '900', fontSize: 17, color: colors.ink },
  cardText: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  small: { color: colors.muted, fontSize: 12, marginTop: 6 },
  link: { color: colors.green, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 36, fontWeight: '900', color: colors.green, letterSpacing: 4, marginTop: 8, textAlign: 'center' },
  input: {
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  codeInput: { fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  notice: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: colors.goldLight, borderWidth: 2, borderColor: colors.gold },
  noticeText: { color: colors.ink, fontWeight: '700', lineHeight: 20 },
  friendName: { flex: 1, fontWeight: '900', fontSize: 18, color: colors.ink },
  streak: { fontSize: 18, fontWeight: '900', color: colors.gold },
  buddy: { color: colors.green, fontWeight: '800', marginTop: 6 },
  nudges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  nudge: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EEF8F2', borderWidth: 2, borderColor: colors.green },
  nudgeSent: { backgroundColor: colors.bg, borderColor: colors.line },
  nudgeText: { fontWeight: '800', color: colors.greenDark },
  remove: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  fanousRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
});
