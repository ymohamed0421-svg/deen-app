// Umrah and Hajj guide. FIRST DRAFT: must be checked by a qualified scholar before release.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Step = { title: string; text: string; when?: string };

const TALBIYAH = {
  arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
  transliteration: 'Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni‘mata laka wal-mulk, la sharika lak',
  english: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. All praise, blessings and sovereignty belong to You. You have no partner.',
  reference: 'Sahih al-Bukhari 1549, Sahih Muslim 1184',
};

const UMRAH: Step[] = [
  {
    title: 'Ihram at the miqat',
    text: 'Before passing the miqat, bathe, put on the ihram (two white unstitched sheets for men; modest everyday clothing for women), and make the intention for Umrah. From now, avoid the things forbidden in ihram, such as perfume, cutting hair or nails, and for men covering the head.',
  },
  { title: 'Recite the talbiyah', text: 'Say the talbiyah often on the way to Makkah, until you begin tawaf. Men say it aloud, women quietly.' },
  {
    title: 'Tawaf',
    text: 'Walk around the Ka‘bah seven times, anticlockwise, starting and ending at the Black Stone. Keep the Ka‘bah on your left. Make dua and dhikr in your own words.',
  },
  { title: 'Two rak‘ahs', text: 'Pray two rak‘ahs behind Maqam Ibrahim if you can, or anywhere in the masjid. Then drink Zamzam water.' },
  {
    title: 'Sa‘i',
    text: 'Walk seven times between the hills of Safa and Marwah, starting at Safa and ending at Marwah. This remembers Hajar’s search for water for her son Isma‘il.',
    when: 'Safa to Marwah counts as one, Marwah back to Safa as two',
  },
  { title: 'Shave or trim', text: 'Men shave the head or trim the hair; shaving is better. Women cut a fingertip’s length from their hair. Your Umrah is complete, and the restrictions of ihram end.' },
];

const HAJJ: Step[] = [
  { when: 'Before 8 Dhul Hijjah', title: 'Arrive and do Umrah', text: 'Most pilgrims perform Hajj at-Tamattu‘: they do an Umrah first, leave ihram, and wait in Makkah.' },
  { when: '8 Dhul Hijjah', title: 'Day of Tarwiyah: Mina', text: 'Put on ihram again with the intention of Hajj and go to Mina. Pray Dhuhr, Asr, Maghrib, Isha and the next Fajr there, shortening the four-rak‘ah prayers.' },
  {
    when: '9 Dhul Hijjah',
    title: 'Day of Arafah',
    text: 'Go to Arafah and stand in worship and dua until sunset. This is the heart of Hajj: the Prophet ﷺ said "Hajj is Arafah." After sunset, go to Muzdalifah.',
  },
  { when: 'Night of the 10th', title: 'Muzdalifah', text: 'Pray Maghrib and Isha together, spend the night under the open sky, and collect small pebbles for the stoning.' },
  {
    when: '10 Dhul Hijjah (Eid)',
    title: 'Day of Sacrifice',
    text: 'Stone Jamrat al-‘Aqabah with seven pebbles, offer the sacrifice (hady), shave or trim, then perform Tawaf al-Ifadah and the sa‘i of Hajj.',
  },
  {
    when: '11 to 13 Dhul Hijjah',
    title: 'Days of Tashriq in Mina',
    text: 'Stay in Mina and each day after midday stone the three jamarat, small, middle then large, with seven pebbles each. You may leave on the 12th before sunset.',
  },
  { when: 'Before leaving Makkah', title: 'Farewell tawaf', text: 'Perform Tawaf al-Wada‘, the last act before going home. Women in their menses are excused from it.' },
];

export default function GuideScreen() {
  const [tab, setTab] = useState<'umrah' | 'hajj'>('umrah');
  const steps = tab === 'umrah' ? UMRAH : HAJJ;
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}>
      <View style={styles.segment}>
        {(['umrah', 'hajj'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, tab === t && styles.segOn]}>
            <Text style={[styles.segText, tab === t && { color: '#fff' }]}>{t === 'umrah' ? 'Umrah' : 'Hajj'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>The talbiyah</Text>
        <Text style={styles.arabic}>{TALBIYAH.arabic}</Text>
        <Text style={styles.translit}>{TALBIYAH.transliteration}</Text>
        <Text style={styles.text}>{TALBIYAH.english}</Text>
        <Text style={styles.ref}>{TALBIYAH.reference}</Text>
      </View>

      {steps.map((s, i) => (
        <View key={s.title} style={styles.step}>
          <View style={styles.dot}>
            <Text style={styles.dotText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {s.when && <Text style={styles.when}>{s.when.toUpperCase()}</Text>}
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.ref}>
        This guide follows the common Tamattu‘ method and is a draft awaiting scholar review. Learn the details of your
        school and group with a qualified teacher before you travel.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.line, alignItems: 'center', backgroundColor: colors.card },
  segOn: { backgroundColor: colors.green, borderColor: colors.green },
  segText: { fontWeight: '900', color: colors.ink },
  card: { backgroundColor: colors.goldLight, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#F1D9A0' },
  arabic: { fontSize: 22, lineHeight: 40, textAlign: 'right', color: colors.ink, marginTop: 6, writingDirection: 'rtl' },
  translit: { color: colors.green, fontStyle: 'italic', marginTop: 6, lineHeight: 21 },
  step: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.line, padding: 14 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontWeight: '900' },
  when: { color: colors.gold, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  stepTitle: { fontWeight: '900', fontSize: 16, color: colors.ink },
  text: { color: colors.ink, lineHeight: 22, marginTop: 4, fontSize: 15 },
  ref: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 },
});
