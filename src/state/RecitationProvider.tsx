// Plays Quran recitation for the whole app. The ayahs of a surah are queued in a native playlist,
// so recitation moves from ayah to ayah by itself, keeps going when you leave the surah screen,
// lock the phone or switch to another app, and can be paused from the lock screen.
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus, type AudioPlaylistLoopMode } from 'expo-audio';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { RECITERS, ayahUrl } from '../quran/reciters';
import { SURAHS } from '../quran/surahs';
import { useSettings } from './SettingsProvider';

export type LoopMode = 'off' | 'ayah' | 'surah';
const TO_PLAYLIST: Record<LoopMode, AudioPlaylistLoopMode> = { off: 'none', ayah: 'single', surah: 'all' };

type Recitation = {
  /** The surah queued in the player, or null when nothing has been played. */
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
  const playlist = useAudioPlaylist({ loop: 'none', updateInterval: 1000 });
  const status = useAudioPlaylistStatus(playlist);
  const [surah, setSurah] = useState<number | null>(null);
  const [loop, setLoopState] = useState<LoopMode>('off');
  const queued = useRef<{ surah: number; reciter: string } | null>(null);

  useEffect(() => {
    // Keep reciting with the screen locked, on silent, or in another app.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  function queue(s: number, reciter: string) {
    if (queued.current?.surah === s && queued.current.reciter === reciter) return;
    const meta = SURAHS.find((x) => x.id === s);
    if (!meta) return;
    playlist.clear();
    for (let a = 1; a <= meta.verses; a++) playlist.add({ uri: ayahUrl(reciter, s, a) });
    queued.current = { surah: s, reciter };
  }

  function showOnLockScreen(s: number, reciter: string) {
    const meta = SURAHS.find((x) => x.id === s);
    const name = RECITERS.find((r) => r.id === reciter)?.name;
    try {
      playlist.setActiveForLockScreen(true, { title: meta ? `${meta.id}. ${meta.name}` : 'Quran', artist: name, albumTitle: 'Deen' });
    } catch {
      // Lock screen controls are not available everywhere (for example some web browsers).
    }
  }

  function playAyah(s: number, index: number) {
    queue(s, settings.reciter);
    setSurah(s);
    playlist.loop = TO_PLAYLIST[loop];
    playlist.skipTo(index);
    playlist.play();
    showOnLockScreen(s, settings.reciter);
  }

  function toggle() {
    if (surah === null) return;
    if (status.playing) playlist.pause();
    else playlist.play();
  }

  function stop() {
    playlist.pause();
    try {
      playlist.clearLockScreenControls();
    } catch {}
  }

  function setLoop(next: LoopMode) {
    setLoopState(next);
    playlist.loop = TO_PLAYLIST[next];
  }

  function changeReciter(reciterId: string) {
    update({ reciter: reciterId });
    if (surah === null) return;
    const at = status.currentIndex;
    const wasPlaying = status.playing;
    queue(surah, reciterId);
    playlist.skipTo(at);
    if (wasPlaying) {
      playlist.play();
      showOnLockScreen(surah, reciterId);
    }
  }

  // The playlist stops after the last ayah when not looping; forget the position then.
  const finished = status.didJustFinish && loop === 'off' && status.currentIndex >= status.trackCount - 1;

  const value: Recitation = {
    surah,
    index: status.currentIndex,
    playing: status.playing && !finished,
    loop,
    playAyah,
    toggle,
    stop,
    setLoop,
    changeReciter,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
