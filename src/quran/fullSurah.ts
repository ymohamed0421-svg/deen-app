// Full-surah recordings with the start and end time of every ayah, from Quran.com's audio API.
// Playing one file for the whole surah has no gaps between ayahs, unlike one file per ayah.
import { RECITERS } from './reciters.ts';

export type SurahAudio = {
  url: string;
  /** Start and end of each ayah in seconds; index 0 is ayah 1. */
  timings: { from: number; to: number }[];
};

type ApiFile = {
  audio_url: string;
  verse_timings?: { verse_key: string; timestamp_from: number; timestamp_to: number }[];
};

const cache = new Map<string, Promise<SurahAudio>>();

/** Null when the reciter has no full-surah recordings; then the app plays ayah by ayah. */
export function fullSurahId(reciterId: string) {
  return RECITERS.find((r) => r.id === reciterId)?.qdc ?? null;
}

export function loadSurahAudio(qdc: number, surah: number): Promise<SurahAudio> {
  const key = `${qdc}:${surah}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${qdc}/audio_files?chapter=${surah}&segments=true`)
      .then((res) => {
        if (!res.ok) throw new Error(`audio ${res.status}`);
        return res.json();
      })
      .then((data: { audio_files?: ApiFile[] }) => parseAudioFile(data.audio_files?.[0]));
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

export function parseAudioFile(file: ApiFile | undefined): SurahAudio {
  if (!file?.audio_url || !file.verse_timings?.length) throw new Error('No full-surah audio');
  const timings = file.verse_timings
    .map((v) => ({ ayah: Number(v.verse_key.split(':')[1]), from: v.timestamp_from / 1000, to: v.timestamp_to / 1000 }))
    .sort((a, b) => a.ayah - b.ayah)
    .map(({ from, to }) => ({ from, to }));
  return { url: file.audio_url, timings };
}

/** Which ayah (0 based) is being recited at a time in the file. */
export function ayahAt(timings: SurahAudio['timings'], seconds: number) {
  let i = 0;
  while (i + 1 < timings.length && timings[i + 1].from <= seconds + 0.05) i++;
  return i;
}
