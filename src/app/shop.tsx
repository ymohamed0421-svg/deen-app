import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { StatsBar } from '../components/StatsBar';
import { MAX_MERCY_DAYS, MAX_OIL, PRICES, canBuy, msUntilNextDrop, type ShopItem } from '../game/rules';
import { useGame } from '../state/GameProvider';
import { colors } from '../theme';

export default function ShopScreen() {
  const { state, purchase } = useGame();
  const w = state.wallet;
  const nextDrop = msUntilNextDrop(w, Date.now());

  const items: { id: ShopItem; icon: string; title: string; text: string; status: string }[] = [
    {
      id: 'mercyDay',
      icon: '🛡️',
      title: 'Mercy Day',
      text: 'Saves your streak if you miss a day. Used automatically.',
      status: `${w.mercyDays}/${MAX_MERCY_DAYS} held`,
    },
    {
      id: 'oilRefill',
      icon: '💧',
      title: 'Fill the lantern',
      text: 'Refills your Oil to full so you can keep learning.',
      status:
        w.oil >= MAX_OIL ? 'Oil is full' : `${w.oil}/${MAX_OIL} Oil. Next drop in ${Math.ceil((nextDrop ?? 0) / 60000)} min`,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatsBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.sub}>Spend the Pearls you earn from lessons, unit chests and streak milestones.</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.text}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Button
              title={`⚪ ${PRICES[item.id]}`}
              disabled={!canBuy(w, item.id)}
              color={colors.blue}
              shadow="#1F4F78"
              onPress={() => purchase(item.id)}
            />
          </View>
        ))}
        <Text style={styles.note}>Garden decorations and lantern styles are coming soon. Pearls can only be earned by learning.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  sub: { color: colors.muted, marginTop: 4, lineHeight: 20, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.line,
  },
  icon: { fontSize: 34 },
  cardTitle: { fontWeight: '900', fontSize: 17, color: colors.ink },
  cardText: { color: colors.muted, marginTop: 2, lineHeight: 19 },
  status: { color: colors.ink, marginTop: 6, fontWeight: '700', fontSize: 13 },
  note: { color: colors.muted, marginTop: 20, fontSize: 13, textAlign: 'center' },
});
