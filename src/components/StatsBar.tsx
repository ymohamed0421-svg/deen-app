import { StyleSheet, Text, View } from 'react-native';
import { MAX_OIL } from '../game/rules';
import { useGame } from '../state/GameProvider';
import { colors } from '../theme';

export function StatsBar() {
  const { state, displayStreak } = useGame();
  return (
    <View style={styles.row}>
      <Stat icon="🪔" value={displayStreak} label="streak" color={colors.gold} />
      <Stat icon="✨" value={state.noor} label="Noor" color={colors.green} />
      <Stat icon="💧" value={`${state.wallet.oil}/${MAX_OIL}`} label="Oil" color={colors.oil} />
      <Stat icon="⚪" value={state.wallet.pearls} label="Pearls" color={colors.pearl} />
    </View>
  );
}

function Stat({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${value} ${label}`}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 18 },
  value: { fontSize: 16, fontWeight: '800' },
});
