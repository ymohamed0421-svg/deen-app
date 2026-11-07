// Plays Quran recitation for the whole app, so it keeps going when you leave the surah screen,
// lock the phone or switch apps, with lock screen controls.
//
// Most reciters play from one full-surah recording with ayah timings, so there are no gaps
// between ayahs. Reciters without one play ayah by ayah from a native playlist.
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioPlaylist,
  useAudioPlaylistStatus,
  type AudioPlaylistLoopMode,
} from 'expo-audio';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ayahAt, fullSurahId, loadSurahAudio, type SurahAudio } from '../quran/fullSurah';
import { RECITERS, ayahUrl } from '../quran/reciters';
import { SURAHS } from '../quran/surahs';
import { useSettings } from './SettingsProvider';

export type LoopMode = 'off' | 'ayah' | 'surah';
const TO_PLAYLIST: Record<LoopMode, AudioPlaylistLoopMode> = { off: 'none', ayah: 'single', surah: 'all' };

type Recitation = {
  /** The surah in the player, or null when nothing has been played. */
  surah: number | null;
  /** Index of the ayah playing in that surah (0 based). */
  index: number;
  playing: boolean;
  loop: LoopMode;
  playAyah: (surah: number, index: number) => void;
  toggle: () => void;
  stop: () => void;
  setLoop: (loop: LoopMode) => void;
  changeReciter: (reciterId: string) => void;
};

const Ctx = createContext<Recitation | null>(null);

export function RecitationProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();

  // Full-surah player (gapless).
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const full = useRef<{ surah: number; reciter: string; audio: SurahAudio } | null>(null);

  // Ayah-by-ayah player for reciters without full-surah files, or if those can't load.
  const playlist = useAudioPlaylist({ loop: 'none', updateInterval: 1000 });
  const plStatus = useAudioPlaylistStatus(playlist);
  const queued = useRef<{ surah: number; reciter: string } | null>(null);

  const [mode, setMode] = useState<'full' | 'ayah'>('full');
  const [surah, setSurah] = useState<number | null>(null);
  const [loop, setLoopState] = useState<LoopMode>('off');
  const loopRef = useRef<LoopMode>('off'); // read by start(), which can run in the same tap as setLoop
  const [loopedAyah, setLoopedAyah] = useState(0);
  const request = useRef(0);
  const pendingSeek = useRef<number | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  const fullIndex = full.current ? ayahAt(full.current.audio.timings, status.currentTime) : 0;
  const index = mode === 'full' ? fullIndex : plStatus.currentIndex;

  useEffect(() => {
    if (status.isLoaded && pendingSeek.current !== null) {
      const to = pendingSeek.current;
      pendingSeek.current = null;
      player.seekTo(to).catch(() => {});
    }
  }, [status.isLoaded, status.duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loop one ayah in the full-surah file by jumping back to its start.
  useEffect(() => {
    if (mode !== 'full' || loop !== 'ayah' || !full.current || !status.playing) return;
    const t = full.current.audio.timings[loopedAyah];
    if (t && (status.currentTime >= t.to - 0.08 || status.currentTime < t.from - 0.5)) player.seekTo(t.from);
  }, [status.currentTime]); // eslint-disable-line react-hooks/exhaustive-deps

  function lockScreen(target: { setActiveForLockScreen: (a: boolean, m?: object) => void }, s: number, reciter: string) {
    const meta = SURAHS.find((x) => x.id === s);
    try {
      target.setActiveForLockScreen(true, {
        title: meta ? `${meta.id}. ${meta.name}` : 'Quran',
        artist: RECITERS.find((r) => r.id === reciter)?.name,
        albumTitle: 'Deen',
      });
    } catch {
      // Not available everywhere.
    }
  }

  function playByAyah(s: number, i: number, reciter: string) {
    player.pause();
    if (queued.current?.surah !== s || queued.current.reciter !== reciter) {
      const meta = SURAHS.find((x) => x.id === s);
      playlist.clear();
      for (let a = 1; a <= (meta?.verses ?? 0); a++) playlist.add({ uri: ayahUrl(reciter, s, a) });
      queued.current = { surah: s, reciter };
    }
    setMode('ayah');
    playlist.loop = TO_PLAYLIST[loopRef.current];
    playlist.skipTo(i);
    playlist.play();
    lockScreen(playlist, s, reciter);
  }

  async function start(s: number, i: number, reciter: string) {
    const ticket = ++request.current;
    setSurah(s);
    setLoopedAyah(i);
    const qdc = fullSurahId(reciter);
    if (qdc === null) return playByAyah(s, i, reciter);
    try {
      const sameFile = full.current?.surah === s && full.current.reciter === reciter;
      const audio = sameFile ? full.current!.audio : await loadSurahAudio(qdc, s);
      if (ticket !== request.current) return; // the person tapped something else meanwhile
      playlist.pause();
      setMode('full');
      player.loop = loopRef.current === 'surah';
      if (!sameFile) {
        // Seeking only works once the new file has loaded; the effect below does it then.
        full.current = { surah: s, reciter, audio };
        pendingSeek.current = audio.timings[i]?.from ?? 0;
        player.replace({ uri: audio.url });
      } else {
        await player.seekTo(audio.timings[i]?.from ?? 0);
      }
      player.play();
      lockScreen(player, s, reciter);
    } catch {
      if (ticket === request.current) playByAyah(s, i, reciter);
    }
  }

  const playing = mode === 'full' ? status.playing : plStatus.playing;

  const value: Recitation = {
    surah,
    index,
    playing,
    loop,
    playAyah: (s, i) => void start(s, i, settings.reciter),
    toggle: () => {
      if (surah === null) return;
      const p = mode === 'full' ? player : playlist;
      if (playing) p.pause();
      else p.play();
    },
    stop: () => {
      player.pause();
      playlist.pause();
    },
    setLoop: (next) => {
      setLoopState(next);
      loopRef.current = next;
      setLoopedAyah(index);
      player.loop = next === 'surah';
      playlist.loop = TO_PLAYLIST[next];
    },
    changeReciter: (reciterId) => {
      update({ reciter: reciterId });
      if (surah !== null && playing) void start(surah, index, reciterId);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
