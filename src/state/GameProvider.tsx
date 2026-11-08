import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  buy,
  completeLesson,
  effectiveStreak,
  newGameState,
  refillOil,
  spendOil,
  toDateKey,
  type GameState,
  type LessonOutcome,
  type LessonRewards,
  type ShopItem,
} from '../game/rules';
import { syncLessonCompletion } from '../lib/sync';
import { awardWorship } from '../lib/worship';

const STORAGE_KEY = 'deen-app/game-state/v1';

type GameContextValue = {
  ready: boolean;
  state: GameState;
  today: string;
  displayStreak: number;
  finishLesson: (outcome: LessonOutcome) => LessonRewards;
  loseOil: (foundation: boolean) => void;
  purchase: (item: ShopItem) => boolean;
  /** Noor earned outside lessons: prayer, dhikr, masjid check-ins. `streak` keeps today's streak alive, like a lesson does. */
  earnNoor: (noor: number, streak?: boolean) => { streakExtended: boolean; streak: number; milestone: number | null };
  reset: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GameState>(() => newGameState(Date.now(), toDateKey(new Date())));
  const [now, setNow] = useState(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load saved progress.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState(JSON.parse(raw) as GameState);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Save on every change.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  // Tick once a minute so Oil refills and the date rolls over while the app is open.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => {
        const wallet = refillOil(s.wallet, t);
        return wallet === s.wallet ? s : { ...s, wallet };
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const today = toDateKey(new Date(now));

  const finishLesson = useCallback((outcome: LessonOutcome) => {
    const t = Date.now();
    const result = completeLesson(stateRef.current, outcome, t, toDateKey(new Date(t)));
    stateRef.current = result.state;
    setState(result.state);
    syncLessonCompletion(outcome).catch(() => {});
    return result.rewards;
  }, []);

  const loseOil = useCallback((foundation: boolean) => {
    setState((s) => ({ ...s, wallet: spendOil(s.wallet, Date.now(), foundation) }));
  }, []);

  const purchase = useCallback(
    (item: ShopItem) => {
      const next = buy(state.wallet, item, Date.now());
      if (next === state.wallet) return false;
      setState((s) => ({ ...s, wallet: buy(s.wallet, item, Date.now()) }));
      return true;
    },
    [state.wallet],
  );

  const earnNoor = useCallback((noor: number, streak = false) => {
    const result = awardWorship(stateRef.current, noor, toDateKey(new Date()), streak);
    stateRef.current = result.state;
    setState(result.state);
    return { streakExtended: result.streakExtended, streak: result.streak, milestone: result.milestone };
  }, []);

  const reset = useCallback(() => setState(newGameState(Date.now(), toDateKey(new Date()))), []);

  const value = useMemo<GameContextValue>(
    () => ({
      ready,
      state,
      today,
      displayStreak: effectiveStreak(state.streak, state.wallet.mercyDays, today),
      finishLesson,
      loseOil,
      purchase,
      earnNoor,
      reset,
    }),
    [ready, state, today, finishLesson, loseOil, purchase, earnNoor, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
