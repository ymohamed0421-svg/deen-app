// Verse-by-verse recitations from everyayah.com: https://everyayah.com/data/<folder>/SSSAAA.mp3
export type Reciter = { id: string; name: string; folder: string };

export const RECITERS: Reciter[] = [
  { id: 'dosari', name: 'Yasser Al-Dosari', folder: 'Yasser_Ad-Dussary_128kbps' },
  { id: 'alafasy', name: 'Mishary Rashid Alafasy', folder: 'Alafasy_128kbps' },
  { id: 'sudais', name: 'Abdurrahman As-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'shuraym', name: 'Saud Ash-Shuraym', folder: 'Saood_ash-Shuraym_128kbps' },
  { id: 'muaiqly', name: 'Maher Al-Muaiqly', folder: 'MaherAlMuaiqly128kbps' },
  { id: 'abdulbasit', name: 'Abdul Basit Abdus-Samad', folder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps' },
  { id: 'minshawi', name: 'Muhammad Siddiq Al-Minshawi', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'shatri', name: 'Abu Bakr Ash-Shatri', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
  { id: 'ajamy', name: 'Ahmed Al-Ajamy', folder: 'ahmed_ibn_ali_al_ajamy_128kbps' },
  { id: 'rifai', name: 'Hani Ar-Rifai', folder: 'Hani_Rifai_192kbps' },
];

export const DEFAULT_RECITER = 'dosari';

export function ayahUrl(reciterId: string, surah: number, ayah: number) {
  const r = RECITERS.find((x) => x.id === reciterId) ?? RECITERS[0];
  const pad = (n: number) => String(n).padStart(3, '0');
  return `https://everyayah.com/data/${r.folder}/${pad(surah)}${pad(ayah)}.mp3`;
}
