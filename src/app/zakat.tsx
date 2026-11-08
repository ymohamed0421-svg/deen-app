import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { calculateZakat, formatMoney, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS, parseAmount, type ZakatInput } from '../lib/zakat';
import { colors, themed } from '../theme';

type Field = 'cash' | 'goldGrams' | 'goldPricePerGram' | 'silverGrams' | 'silverPricePerGram' | 'investments' | 'business' | 'owedToYou' | 'debts';

type Form = Record<Field, string> & { currency: string; nisabBasis: ZakatInput['nisabBasis']; fullYear: boolean };

const EMPTY: Form = {
  currency: '$',
  cash: '',
  goldGrams: '',
  goldPricePerGram: '',
  silverGrams: '',
  silverPricePerGram: '',
  investments: '',
  business: '',
  owedToYou: '',
  debts: '',
  nisabBasis: 'silver',
  fullYear: true,
};

const KEY = 'deen-app/zakat/v1';

export default function ZakatScreen() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setForm({ ...EMPTY, ...(JSON.parse(raw) as Partial<Form>) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(form)).catch(() => {});
  }, [form, loaded]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const cur = form.currency.trim() || '$';

  const result = useMemo(
    () =>
      calculateZakat({
        cash: parseAmount(form.cash),
        goldGrams: parseAmount(form.goldGrams),
        goldPricePerGram: parseAmount(form.goldPricePerGram),
        silverGrams: parseAmount(form.silverGrams),
        silverPricePerGram: parseAmount(form.silverPricePerGram),
        investments: parseAmount(form.investments),
        business: parseAmount(form.business),
        owedToYou: parseAmount(form.owedToYou),
        debts: parseAmount(form.debts),
        nisabBasis: form.nisabBasis,
        fullYear: form.fullYear,
      }),
    [form],
  );

  const money = (field: Field, label: string, hint?: string) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={styles.inputRow}>
        <Text style={styles.prefix}>{cur}</Text>
        <TextInput
          value={form[field]}
          onChangeText={(t) => set({ [field]: t } as Partial<Form>)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );

  const grams = (field: Field, label: string) => (
    <View style={[styles.field, { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={form[field]}
          onChangeText={(t) => set({ [field]: t } as Partial<Form>)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel={label}
        />
        <Text style={styles.prefix}>g</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Zakat is 2.5% of your savings once they reach the nisab (the minimum amount) and you have had them for a full lunar year. Fill in what applies to you and leave the rest empty.
      </Text>

      <View style={styles.card}>
        <Text style={styles.section}>Your currency</Text>
        <View style={styles.chips}>
          {['$', '£', '€', 'C$', 'A$', 'AED ', 'SAR ', 'Rs '].map((c) => (
            <Pressable key={c} onPress={() => set({ currency: c })} style={[styles.chip, form.currency === c && styles.chipOn]}>
              <Text style={styles.chipText}>{c.trim()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Money</Text>
        {money('cash', 'Cash and bank accounts', 'Savings, current accounts and cash at home')}
        {money('investments', 'Shares, funds and other investments', 'What they would sell for today')}
        {money('business', 'Business stock', 'Goods you hold to sell, at their sale value')}
        {money('owedToYou', 'Money owed to you', 'Loans you expect to get back')}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Gold and silver</Text>
        <Text style={styles.hint}>Look up today’s price per gram online. It is needed to work out the nisab.</Text>
        <View style={styles.pair}>
          {grams('goldGrams', 'Gold you own')}
          {grams('silverGrams', 'Silver you own')}
        </View>
        {money('goldPricePerGram', 'Gold price per gram')}
        {money('silverPricePerGram', 'Silver price per gram')}
        <Text style={styles.hint}>Scholars differ on jewellery you wear every day. Many include it, others do not, so ask a scholar you trust.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Take away</Text>
        {money('debts', 'Debts you must pay now', 'Bills and payments due now, not the whole of a long loan like a mortgage')}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Nisab</Text>
        <Text style={styles.hint}>
          The nisab is the value of {NISAB_SILVER_GRAMS} g of silver or {NISAB_GOLD_GRAMS} g of gold. Many scholars use silver for money because it is lower, so more zakat reaches people in need.
        </Text>
        <View style={styles.chips}>
          {(['silver', 'gold'] as const).map((b) => (
            <Pressable key={b} onPress={() => set({ nisabBasis: b })} style={[styles.chip, form.nisabBasis === b && styles.chipOn]}>
              <Text style={styles.chipText}>{b === 'silver' ? `Silver (${NISAB_SILVER_GRAMS} g)` : `Gold (${NISAB_GOLD_GRAMS} g)`}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => set({ fullYear: !form.fullYear })} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: form.fullYear }}>
          <View style={[styles.box, form.fullYear && styles.boxOn]}>{form.fullYear && <Text style={styles.tick}>✓</Text>}</View>
          <Text style={[styles.label, { flex: 1 }]}>I have had at least the nisab for a full lunar year (about 354 days)</Text>
        </Pressable>
      </View>

      <View style={[styles.result, result.status === 'owed' && styles.resultOwed]}>
        {result.status === 'need-price' ? (
          <Text style={styles.resultText}>Add today’s {result.metal} price per gram to see your result.</Text>
        ) : (
          <>
            <Text style={styles.resultLabel}>{result.status === 'owed' ? 'ZAKAT YOU OWE' : 'NO ZAKAT DUE'}</Text>
            {result.status === 'owed' && <Text style={styles.big}>{formatMoney(result.zakat, cur)}</Text>}
            <Text style={styles.resultText}>
              {result.status === 'owed'
                ? `That is 2.5% of ${formatMoney(result.total, cur)}.`
                : result.status === 'not-yet'
                  ? `Your total of ${formatMoney(result.total, cur)} is above the nisab, but zakat is due once you have had it for a full lunar year.`
                  : `Your total of ${formatMoney(result.total, cur)} is below the nisab of ${formatMoney(result.nisab, cur)}.`}
            </Text>
            <Text style={styles.resultSub}>Nisab today: {formatMoney(result.nisab, cur)}</Text>
          </>
        )}
      </View>

      <Text style={styles.note}>
        This is a guide, not a fatwa. Rules on jewellery, debts, retirement funds and business assets differ between scholars, so please check your zakat with a scholar or your local masjid.
      </Text>

      <Pressable onPress={() => setForm({ ...EMPTY, currency: form.currency })} style={styles.clear}>
        <Text style={styles.clearText}>Clear everything</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = themed(() => ({
  intro: { color: colors.ink, lineHeight: 22, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 16, gap: 10 },
  section: { fontSize: 18, fontWeight: '900', color: colors.ink },
  field: { gap: 4 },
  label: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, backgroundColor: colors.bg },
  prefix: { color: colors.muted, fontWeight: '800', fontSize: 16 },
  input: { flex: 1, paddingVertical: 10, fontSize: 17, color: colors.ink, minWidth: 0 },
  pair: { flexDirection: 'row', gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2, borderColor: colors.line },
  chipOn: { borderColor: colors.green, backgroundColor: colors.greenLight },
  chipText: { fontWeight: '800', color: colors.ink },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.green, borderColor: colors.green },
  tick: { color: '#fff', fontWeight: '900' },
  result: { backgroundColor: colors.goldLight, borderRadius: 18, padding: 18, gap: 6, borderWidth: 2, borderColor: colors.goldBorder },
  resultOwed: { backgroundColor: colors.greenLight, borderColor: colors.greenBorder },
  resultLabel: { fontSize: 12, fontWeight: '900', color: colors.greenInk, letterSpacing: 1 },
  big: { fontSize: 36, fontWeight: '900', color: colors.ink },
  resultText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  resultSub: { color: colors.muted, fontSize: 13 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  clear: { alignItems: 'center', paddingVertical: 10 },
  clearText: { color: colors.red, fontWeight: '800' },
}));
