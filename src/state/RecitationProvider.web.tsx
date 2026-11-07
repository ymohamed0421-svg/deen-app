// Web version of the recitation player. iPhone Safari only keeps playing in the background
// if the same <audio> element carries on, so this uses one element and swaps the ayah file
// when each one ends, instead of a new element per ayah. Lock screen controls use the
// Media Session API.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { RECITERS, ayahUrl } from '../quran/reciters';
import { SURAHS } from '../quran/surahs';
import { useSettings } from './SettingsProvider';

export type LoopMode = 'off' | 'ayah' | 'surah';

type Recitation = {
  surah: number | null;
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
  const audio = useRef<HTMLAudioElement | null>(null);
  const [surah, setSurah] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoopState] = useState<LoopMode>('off');

  // The ended handler reads these, so keep the latest values in a ref.
  const now = useRef({ surah: null as number | null, index: 0, loop: 'off' as LoopMode, reciter: settings.reciter });
  now.current = { surah, index, loop, reciter: settings.reciter };

  function el() {
    if (!audio.current) {
      const a = new Audio();
      a.preload = 'auto';
      a.setAttribute('playsinline', '');
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      a.addEventListener('ended', onEnded);
      audio.current = a;
    }
    return audio.current;
  }

  function load(s: number, i: number, reciter: string) {
    const a = el();
    a.src = ayahUrl(reciter, s, i + 1);
    a.loop = now.current.loop === 'ayah';
    setSurah(s);
    setIndex(i);
    now.current = { ...now.current, surah: s, index: i };
    a.play().catch(() => setPlaying(false));
    showOnLockScreen(s, i, reciter);
  }

  function onEnded() {
    const { surah: s, index: i, loop: l, reciter } = now.current;
    if (s === null) return;
    const total = SURAHS.find((x) => x.id === s)?.verses ?? 0;
    if (i + 1 < total) load(s, i + 1, reciter);
    else if (l === 'surah') load(s, 0, reciter);
    else setPlaying(false);
  }

  function showOnLockScreen(s: number, i: number, reciter: string) {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms || typeof MediaMetadata === 'undefined') return;
    const meta = SURAHS.find((x) => x.id === s);
    ms.metadata = new MediaMetadata({
      title: meta ? `${meta.name} · ayah ${i + 1}` : 'Quran',
      artist: RECITERS.find((r) => r.id === reciter)?.name ?? '',
      album: 'Deen',
    });
  }

  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
    if (!ms) return;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {}
    };
    set('play', () => audio.current?.play());
    set('pause', () => audio.current?.pause());
    set('nexttrack', () => {
      const { surah: s, index: i, reciter } = now.current;
      const total = SURAHS.find((x) => x.id === s)?.verses ?? 0;
      if (s !== null && i + 1 < total) load(s, i + 1, reciter);
    });
    set('previoustrack', () => {
      const { surah: s, index: i, reciter } = now.current;
      if (s !== null && i > 0) load(s, i - 1, reciter);
    });
    return () => {
      audio.current?.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: Recitation = {
    surah,
    index,
    playing,
    loop,
    playAyah: (s, i) => load(s, i, settings.reciter),
    toggle: () => {
      const a = audio.current;
      if (!a || surah === null) return;
      if (a.paused) a.play().catch(() => {});
      else a.pause();
    },
    stop: () => audio.current?.pause(),
    setLoop: (next) => {
      setLoopState(next);
      now.current = { ...now.current, loop: next };
      if (audio.current) audio.current.loop = next === 'ayah';
    },
    changeReciter: (reciterId) => {
      update({ reciter: reciterId });
      if (surah !== null && playing) load(surah, index, reciterId);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
