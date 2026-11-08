// Web version of the recitation player. iPhone Safari only keeps playing in the background
// if the same <audio> element carries on, so this uses one element for everything.
// Most reciters play one full-surah file with ayah timings, so there are no gaps between
// ayahs; the rest swap the ayah file when each one ends. Lock screen controls use the
// Media Session API.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ayahAt, fullSurahId, loadSurahAudio, type SurahAudio } from '../quran/fullSurah';
import { RECITERS, ayahUrl } from '../quran/reciters';
import { SURAHS } from '../quran/surahs';
import { useSettings } from './SettingsProvider';

/** 'range' repeats a stretch of ayahs (for memorizing); 'ayah' is a range of one. */
export type LoopMode = 'off' | 'ayah' | 'range' | 'surah';
export type AyahRange = { from: number; to: number };

type Recitation = {
  surah: number | null;
  index: number;
  playing: boolean;
  loop: LoopMode;
  range: AyahRange;
  playAyah: (surah: number, index: number) => void;
  toggle: () => void;
  stop: () => void;
  setLoop: (loop: LoopMode) => void;
  loopRange: (surah: number, from: number, to: number) => void;
  changeReciter: (reciterId: string) => void;
};

const Ctx = createContext<Recitation | null>(null);

type Now = {
  surah: number | null;
  index: number;
  loop: LoopMode;
  /** The ayahs repeated when loop is 'ayah' or 'range' (0 based, inclusive). */
  range: AyahRange;
  reciter: string;
  /** Set when a full-surah file is loaded; null when playing ayah by ayah. */
  full: { reciter: string; surah: number; audio: SurahAudio } | null;
};

export function RecitationProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [surah, setSurah] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoopState] = useState<LoopMode>('off');
  const [range, setRangeState] = useState<AyahRange>({ from: 0, to: 0 });
  const request = useRef(0);

  // Event handlers read these, so keep the latest values in a ref.
  const now = useRef<Now>({ surah: null, index: 0, loop: 'off', range: { from: 0, to: 0 }, reciter: settings.reciter, full: null });
  now.current.reciter = settings.reciter;

  function setAt(i: number) {
    if (i !== now.current.index) {
      now.current.index = i;
      setIndex(i);
      const { surah: s, reciter } = now.current;
      if (s !== null) showOnLockScreen(s, i, reciter);
    }
  }

  function setRange(r: AyahRange) {
    now.current.range = r;
    setRangeState(r);
  }

  const repeating = () => now.current.loop === 'ayah' || now.current.loop === 'range';

  function el() {
    if (!audio.current) {
      const a = new Audio();
      a.preload = 'auto';
      a.setAttribute('playsinline', '');
      a.addEventListener('play', () => setPlaying(true));
      a.addEventListener('pause', () => setPlaying(false));
      a.addEventListener('ended', onEnded);
      a.addEventListener('timeupdate', onTime);
      audio.current = a;
    }
    return audio.current;
  }

  function onTime() {
    const a = audio.current;
    const f = now.current.full;
    if (!a || !f) return;
    const t = f.audio.timings;
    if (repeating()) {
      const { from, to } = now.current.range;
      const first = t[from];
      const last = t[to];
      // The last ayah of the surah runs to the end of the file; onEnded loops that case.
      const pastEnd = last && to < t.length - 1 && a.currentTime >= last.to - 0.15;
      if (first && (pastEnd || a.currentTime < first.from - 0.5)) a.currentTime = first.from;
    }
    setAt(ayahAt(t, a.currentTime));
  }

  function onEnded() {
    const { surah: s, index: i, loop: l, reciter, full } = now.current;
    if (s === null) return;
    if (full) {
      if (l === 'surah' || repeating()) {
        audio.current!.currentTime = l === 'surah' ? 0 : (full.audio.timings[now.current.range.from]?.from ?? 0);
        audio.current!.play().catch(() => {});
      }
      return;
    }
    const total = SURAHS.find((x) => x.id === s)?.verses ?? 0;
    const { from, to } = now.current.range;
    if (l === 'range') playOneAyah(s, i + 1 > to || i < from ? from : i + 1, reciter);
    else if (i + 1 < total) playOneAyah(s, i + 1, reciter);
    else if (l === 'surah') playOneAyah(s, 0, reciter);
  }

  function playOneAyah(s: number, i: number, reciter: string) {
    const a = el();
    now.current = { ...now.current, surah: s, full: null };
    a.src = ayahUrl(reciter, s, i + 1);
    a.loop = now.current.loop === 'ayah';
    setAt(i);
    a.play().catch(() => setPlaying(false));
  }

  async function start(s: number, i: number, reciter: string) {
    const ticket = ++request.current;
    const a = el();
    setSurah(s);
    now.current = { ...now.current, surah: s };
    if (now.current.loop === 'ayah') setRange({ from: i, to: i });
    showOnLockScreen(s, i, reciter);
    const qdc = fullSurahId(reciter);
    const f = now.current.full;
    const sameFile = f && f.surah === s && f.reciter === reciter;
    if (qdc === null) return playOneAyah(s, i, reciter);
    if (!sameFile) {
      // Safari only lets audio start inside a tap, so begin with the single ayah right away and
      // switch to the gapless full-surah file as soon as its timings arrive.
      playOneAyah(s, i, reciter);
    }
    try {
      const fileAudio = sameFile ? f!.audio : await loadSurahAudio(qdc, s);
      if (ticket !== request.current) return;
      if (!sameFile) {
        a.src = fileAudio.url;
        now.current.full = { reciter, surah: s, audio: fileAudio };
      }
      a.loop = false;
      await seek(a, fileAudio.timings[i]?.from ?? 0);
      if (ticket !== request.current) return;
      setAt(i);
      await a.play();
    } catch {
      if (ticket === request.current) playOneAyah(s, i, reciter);
    }
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
    const jump = (by: number) => {
      const { surah: s, index: i, reciter } = now.current;
      const total = SURAHS.find((x) => x.id === s)?.verses ?? 0;
      if (s !== null && i + by >= 0 && i + by < total) void start(s, i + by, reciter);
    };
    set('play', () => audio.current?.play());
    set('pause', () => audio.current?.pause());
    set('nexttrack', () => jump(1));
    set('previoustrack', () => jump(-1));
    return () => {
      audio.current?.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setLoop(next: LoopMode) {
    setLoopState(next);
    now.current.loop = next;
    if (next === 'ayah') setRange({ from: now.current.index, to: now.current.index });
    if (audio.current) audio.current.loop = next === 'ayah' && !now.current.full;
  }

  const value: Recitation = {
    surah,
    index,
    playing,
    loop,
    range,
    playAyah: (s, i) => {
      // Playing an ayah outside the repeated range ends the range loop.
      const r = now.current.range;
      if (now.current.loop === 'range' && (s !== now.current.surah || i < r.from || i > r.to)) setLoop('off');
      void start(s, i, settings.reciter);
    },
    toggle: () => {
      const a = audio.current;
      if (!a || surah === null) return;
      if (a.paused) a.play().catch(() => {});
      else a.pause();
    },
    stop: () => audio.current?.pause(),
    setLoop,
    loopRange: (s, from, to) => {
      setLoop('range');
      setRange({ from: Math.min(from, to), to: Math.max(from, to) });
      void start(s, Math.min(from, to), settings.reciter);
    },
    changeReciter: (reciterId) => {
      update({ reciter: reciterId });
      if (surah !== null && playing) void start(surah, index, reciterId);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Sets the position once the file's length is known; Safari ignores it before that. */
function seek(a: HTMLAudioElement, seconds: number) {
  return new Promise<void>((resolve) => {
    const go = () => {
      a.currentTime = seconds;
      resolve();
    };
    if (a.readyState >= 1) go();
    else a.addEventListener('loadedmetadata', go, { once: true });
  });
}

export function useRecitation() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useRecitation must be used inside RecitationProvider');
  return v;
}
