import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { WORSHIP_REWARDS, dayCounts, nextFastMark, prayerReward, type Fard, type FastMark, type PrayerLog, type PrayerMark } from '../lib/worship';
import { reportPrayers } from '../lib/worshipSync';
import { toDateKey } from '../game/rules';
import type { AdhkarSet } from '../content/adhkar';
import { useGame } from './GameProvider';

const KEY = 'deen-app/worship/v1';

export type WorshipState = {
  prayerLog: PrayerLog; // day key -> prayers logged
  prayerRewarded: Record<string, Fard[]>; // day key -> prayers that already earned Noor
  adhkar: { day: string; done: AdhkarSet[]; counts: Record<string, number> }; // today's progress, key `${set}:${id}`
  tasbih: { day: string; today: number; total: number; sets: number };
  fasts: Record<string, FastMark>; // `${hijriYear}-${ramadanDay}`
  taraweeh: Record<string, number[]>; // hijri year -> juz finished
  hijriAdjust: number; // -2..2 days, to match local moon sighting
  fastReminders: boolean;
  qadrReminders: boolean;
  ramadanPreview: boolean;
};

const DEFAULTS: WorshipState = {
  prayerLog: {},
  prayerRewarded: {},
  adhkar: { day: '', done: [], counts: {} },
  tasbih: { day: '', today: 0, total: 0, sets: 0 },
  fasts: {},
  taraweeh: {},
  hijriAdjust: 0,
  fastReminders: false,
  qadrReminders: false,
  ramadanPreview: false,
};

export type Reward = { noor: number; streakExtended: boolean; streak: number };

type Ctx = {
  ready: boolean;
  worship: WorshipState;
  /** Logs (or clears, with null) a prayer. Only today's prayer day earns Noor and keeps the streak. */
  setPrayer: (day: string, p: Fard, mark: PrayerMark | null, isToday: boolean) => Reward | null;
  /** Counts one recitation of a dhikr in a set. Returns a reward when the whole set is finished. */
  countAdhkar: (set: AdhkarSet, id: string, times: number, allIds: { id: string; times: number }[]) => Reward | null;
  /** Adds taps to the tasbih. `finishedSet` is true when a full 33/33/34 was completed. */
  countTasbih: (finishedSet: boolean) => Reward | null;
  toggleFast: (key: string) => void;
  toggleJuz: (year: number, juz: number) => void;
  update: (patch: Partial<Pick<WorshipState, 'hijriAdjust' | 'fastReminders' | 'qadrReminders' | 'ramadanPreview'>>) => void;
};

const WorshipContext = createContext<Ctx | null>(null);

export function WorshipProvider({ children }: { children: ReactNode }) {
  const { earnNoor } = useGame();
  const [ready, setReady] = useState(false);
  const [worship, setWorship] = useState<WorshipState>(DEFAULTS);
  const ref = useRef(worship);
  ref.current = worship;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setWorship({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<WorshipState>) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(worship)).catch(() => {});
  }, [worship, ready]);

  const commit = useCallback((next: WorshipState) => {
    ref.current = next;
    setWorship(next);
  }, []);

  const setPrayer = useCallback(
    (day: string, p: Fard, mark: PrayerMark | null, isToday: boolean): Reward | null => {
      const w = ref.current;
      const dayLog = { ...w.prayerLog[day] };
      if (mark) dayLog[p] = mark;
      else delete dayLog[p];
      let next: WorshipState = { ...w, prayerLog: { ...w.prayerLog, [day]: dayLog } };
      let reward: Reward | null = null;
      if (isToday && mark) {
        const r = prayerReward(dayLog, w.prayerRewarded[day] ?? [], p);
        if (r.noor > 0 || mark === 'onTime') {
          const g = earnNoor(r.noor, mark === 'onTime');
          reward = { noor: r.noor, streakExtended: g.streakExtended, streak: g.streak };
        }
        next = { ...next, prayerRewarded: { ...w.prayerRewarded, [day]: r.rewarded } };
      }
      commit(next);
      if (isToday) reportPrayers(day, dayCounts(dayLog).prayed);
      return reward;
    },
    [commit, earnNoor],
  );

  const countAdhkar = useCallback(
    (set: AdhkarSet, id: string, times: number, all: { id: string; times: number }[]): Reward | null => {
      const w = ref.current;
      const today = toDateKey(new Date());
      const adhkar = w.adhkar.day === today ? w.adhkar : { day: today, done: [], counts: {} };
      const key = `${set}:${id}`;
      const counts = { ...adhkar.counts, [key]: Math.min(times, (adhkar.counts[key] ?? 0) + 1) };
      const finished = all.every((d) => (counts[`${set}:${d.id}`] ?? 0) >= d.times);
      let reward: Reward | null = null;
      let done = adhkar.done;
      if (finished && !done.includes(set)) {
        done = [...done, set];
        const g = earnNoor(WORSHIP_REWARDS.adhkarNoor);
        reward = { noor: WORSHIP_REWARDS.adhkarNoor, streakExtended: g.streakExtended, streak: g.streak };
      }
      commit({ ...w, adhkar: { day: today, done, counts } });
      return reward;
    },
    [commit, earnNoor],
  );

  const countTasbih = useCallback(
    (finishedSet: boolean): Reward | null => {
      const w = ref.current;
      const today = toDateKey(new Date());
      const t = w.tasbih.day === today ? w.tasbih : { day: today, today: 0, total: w.tasbih.total, sets: 0 };
      let reward: Reward | null = null;
      let sets = t.sets;
      if (finishedSet) {
        sets += 1;
        if (sets <= WORSHIP_REWARDS.tasbihSetsPerDay) {
          const g = earnNoor(WORSHIP_REWARDS.tasbihSetNoor);
          reward = { noor: WORSHIP_REWARDS.tasbihSetNoor, streakExtended: g.streakExtended, streak: g.streak };
        }
      }
      commit({ ...w, tasbih: { day: today, today: t.today + 1, total: t.total + 1, sets } });
      return reward;
    },
    [commit, earnNoor],
  );

  const toggleFast = useCallback(
    (key: string) => {
      const w = ref.current;
      const fasts = { ...w.fasts };
      const m = nextFastMark(fasts[key]);
      if (m) fasts[key] = m;
      else delete fasts[key];
      commit({ ...w, fasts });
    },
    [commit],
  );

  const toggleJuz = useCallback(
    (year: number, juz: number) => {
      const w = ref.current;
      const list = w.taraweeh[year] ?? [];
      const next = list.includes(juz) ? list.filter((j) => j !== juz) : [...list, juz];
      commit({ ...w, taraweeh: { ...w.taraweeh, [year]: next } });
    },
    [commit],
  );

  const update = useCallback((patch: Partial<WorshipState>) => commit({ ...ref.current, ...patch }), [commit]);

  const value = useMemo(
    () => ({ ready, worship, setPrayer, countAdhkar, countTasbih, toggleFast, toggleJuz, update }),
    [ready, worship, setPrayer, countAdhkar, countTasbih, toggleFast, toggleJuz, update],
  );
  return <WorshipContext.Provider value={value}>{children}</WorshipContext.Provider>;
}

export function useWorship() {
  const ctx = useContext(WorshipContext);
  if (!ctx) throw new Error('useWorship must be used inside WorshipProvider');
  return ctx;
}
