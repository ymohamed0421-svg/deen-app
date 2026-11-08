import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shareStatus, takeNudges, type IncomingNudge } from '../lib/friends';
import { nudgeNotification } from '../lib/friendsLogic';
import { useGame } from '../state/GameProvider';
import { colors } from '../theme';

const POLL_MS = 2 * 60_000;

/**
 * Runs in the background of the whole app:
 * - shares today's streak and "studied today" with friends whenever they change,
 * - checks for nudges from friends when the app opens and every two minutes while it's open,
 *   and shows them as a banner at the top of the screen.
 */
export function FriendSync() {
  const { ready, state, today, displayStreak } = useGame();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<IncomingNudge[]>([]);
  const lastShared = useRef('');

  const studied = state.streak.lastActiveDate === today;
  const statusKey = `${today}|${studied}|${displayStreak}`;
  const statusRef = useRef({ statusKey, studied, displayStreak });
  statusRef.current = { statusKey, studied, displayStreak };

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function tick() {
      const s = statusRef.current;
      if (lastShared.current !== s.statusKey) {
        // False until the user has an account, or when offline. Then it tries again next time.
        const ok = await shareStatus({ studied: s.studied || undefined, streak: s.displayStreak }).catch(() => false);
        if (ok) lastShared.current = s.statusKey;
      }
      const nudges = await takeNudges().catch(() => []);
      if (!cancelled && nudges.length) setBanner((b) => [...nudges, ...b].slice(0, 3));
    }

    tick();
    const id = setInterval(() => {
      if (AppState.currentState === 'active') tick();
    }, POLL_MS);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') tick();
    });
    return () => {
      cancelled = true;
      clearInterval(id);
      sub.remove();
    };
  }, [ready, statusKey]);

  // Hide the banner after a while.
  useEffect(() => {
    if (!banner.length) return;
    const id = setTimeout(() => setBanner([]), 12_000);
    return () => clearTimeout(id);
  }, [banner]);

  if (!banner.length) return null;
  const first = banner[0];
  const { title, body } = nudgeNotification(first.from_name, first.kind);
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setBanner([]);
          router.push(first.kind === 'pray' ? '/prayer' : '/');
        }}
        style={styles.banner}
      >
        <Text style={styles.icon}>{first.kind === 'pray' ? '🤲' : '🪔'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {banner.length > 1 && <Text style={styles.more}>+{banner.length - 1} more from friends</Text>}
        </View>
        <Pressable accessibilityLabel="Close" hitSlop={12} onPress={() => setBanner([])}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000, alignItems: 'center' },
  banner: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.goldLight,
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: { fontSize: 30 },
  title: { fontWeight: '900', color: colors.ink, fontSize: 15 },
  body: { color: colors.ink, marginTop: 2, lineHeight: 19 },
  more: { color: colors.muted, marginTop: 4, fontSize: 12, fontWeight: '700' },
  close: { fontSize: 18, color: colors.muted, fontWeight: '900' },
});
