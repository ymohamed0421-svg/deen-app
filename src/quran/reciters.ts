// Verse-by-verse recitations from everyayah.com: https://everyayah.com/data/<folder>/SSSAAA.mp3
/** folder: per-ayah files on everyayah.com. qdc: Quran.com recitation id with full-surah files and ayah timings (gapless). */
export type Reciter = { id: string; name: string; folder: string; qdc?: number };

export const RECITERS: Reciter[] = [
  { id: 'dosari', name: 'Yasser Al-Dosari', folder: 'Yasser_Ad-Dussary_128kbps', qdc: 97 },
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', folder: 'Alafasy_128kbps', qdc: 7 },
  { id: 'sudais', name: 'Abdurrahman As-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps', qdc: 3 },
  { id: 'shuraym', name: 'Saud Ash-Shuraym', folder: 'Saood_ash-Shuraym_128kbps', qdc: 10 },
  { id: 'muaiqly', name: 'Maher Al-Muaiqly', folder: 'MaherAlMuaiqly128kbps' },
  { id: 'abdulbasit', name: 'Abdul Basit Abdus-Samad', folder: 'Abdul_Basit_Murattal_192kbps', qdc: 2 },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps', qdc: 6 },
  { id: 'minshawi', name: 'Muhammad Siddiq Al-Minshawi', folder: 'Minshawy_Murattal_128kbps', qdc: 9 },
  { id: 'shatri', name: 'Abu Bakr Ash-Shatri', folder: 'Abu_Bakr_Ash-Shaatree_128kbps', qdc: 4 },
  { id: 'ajamy', name: 'Ahmed Al-Ajamy', folder: 'ahmed_ibn_ali_al_ajamy_128kbps' },
  { id: 'rifai', name: 'Hani Ar-Rifai', folder: 'Hani_Rifai_192kbps', qdc: 5 },
];

export const DEFAULT_RECITER = 'dosari';

export function ayahUrl(reciterId: string, surah: number, ayah: number) {
  const r = RECITERS.find((x) => x.id === reciterId) ?? RECITERS[0];
  const pad = (n: number) => String(n).padStart(3, '0');
  return `https://everyayah.com/data/${r.folder}/${pad(surah)}${pad(ayah)}.mp3`;
}
