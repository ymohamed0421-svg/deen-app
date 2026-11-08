import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fanous, SpeechBubble } from '../components/Fanous';
import { StatsBar } from '../components/StatsBar';
import { LEAGUE_TIERS } from '../game/rules';
import { useGame } from '../state/GameProvider';
import { colors } from '../theme';

const TIER_ICONS = ['🌰', '🌱', '🌿', '🌴', '🫒', '🌲'];

export default function LeagueScreen() {
  const { state } = useGame();
  const tierIndex = 0; // Everyone starts in Seed. Promotion is decided weekly on the server.

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatsBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Garden League</Text>
        <Text style={styles.sub}>Each week you join 30 learners at your level. The top 7 move up a tier. Leagues rank lessons learned, never worship.</Text>

        <View style={styles.tiers}>
          {LEAGUE_TIERS.map((tier, i) => (
            <View key={tier} style={[styles.tier, i === tierIndex && styles.tierActive, i > tierIndex && { opacity: 0.4 }]}>
              <Text style={styles.tierIcon}>{TIER_ICONS[i]}</Text>
              <Text style={styles.tierName}>{tier}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This week</Text>
          <Text style={styles.big}>✨ {state.weeklyNoor} Noor</Text>
          <Text style={styles.cardText}>Week starting {state.weekStart}</Text>
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/friends')}>
          <Text style={styles.cardTitle}>Streak buddies ›</Text>
          <Text style={styles.cardText}>Add friends with a code, keep a buddy streak going together, and nudge each other to pray and study.</Text>
        </Pressable>

        <View style={styles.fanousRow}>
          <Fanous size={60} />
          <SpeechBubble text="Healthy competition only. We race to learn, then we make dua for each other." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tier: { width: '31%', alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line },
  tierActive: { borderColor: colors.green, backgroundColor: '#EEF8F2' },
  tierIcon: { fontSize: 28 },
  tierName: { fontWeight: '800', color: colors.ink, marginTop: 4 },
  card: { marginTop: 16, padding: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line },
  cardTitle: { fontWeight: '900', fontSize: 17, color: colors.ink },
  big: { fontSize: 28, fontWeight: '900', color: colors.green, marginTop: 6 },
  cardText: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  fanousRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
});
