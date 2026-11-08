import { Text, View } from 'react-native';
import { dailyItem } from '../content/daily';
import { useGame } from '../state/GameProvider';
import { colors, themed } from '../theme';

/** Hadith or dua of the day. Changes every day at midnight. */
export function DailyCard() {
  const { today } = useGame();
  const daily = dailyItem(today);
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{daily.kind === 'hadith' ? 'HADITH OF THE DAY' : 'DUA OF THE DAY'}</Text>
      {daily.kind === 'hadith' ? (
        <Text style={styles.body}>“{daily.item.text}”</Text>
      ) : (
        <>
          <Text style={styles.title}>{daily.item.title}</Text>
          <Text style={styles.arabic}>{daily.item.arabic}</Text>
          <Text style={styles.translit}>{daily.item.transliteration}</Text>
          <Text style={styles.body}>{daily.item.english}</Text>
        </>
      )}
      <Text style={styles.ref}>{daily.item.reference}</Text>
    </View>
  );
}

const styles = themed(() => ({
  card: { backgroundColor: colors.goldLight, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: colors.goldBorder, marginBottom: 8 },
  kicker: { fontWeight: '900', color: colors.goldInk, fontSize: 12, letterSpacing: 1 },
  title: { fontWeight: '800', color: colors.ink, fontSize: 16, marginTop: 6 },
  arabic: { fontSize: 24, color: colors.ink, textAlign: 'right', marginTop: 8, lineHeight: 42, writingDirection: 'rtl' },
  translit: { fontStyle: 'italic', color: colors.muted, marginTop: 4, lineHeight: 20 },
  body: { fontSize: 16, color: colors.ink, marginTop: 6, lineHeight: 23 },
  ref: { color: colors.muted, fontSize: 12, marginTop: 8 },
}));
