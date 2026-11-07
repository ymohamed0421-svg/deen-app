import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_RECITER } from '../quran/reciters';

export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export type SavedLocation = {
  latitude: number;
  longitude: number;
  name: string;
  auto: boolean; // true when it came from the phone's GPS
};

export type CalcMethodId =
  | 'MuslimWorldLeague'
  | 'NorthAmerica'
  | 'Egyptian'
  | 'UmmAlQura'
  | 'Karachi'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran'
  | 'MoonsightingCommittee';

export type Settings = {
  level: KnowledgeLevel | null; // null until the user picks one in onboarding
  location: SavedLocation | null;
  calcMethod: CalcMethodId;
  asrMadhab: 'shafi' | 'hanafi'; // shafi = Shafi'i, Maliki and Hanbali (shadow length 1), hanafi = shadow length 2
  reciter: string;
  prayerReminders: boolean;
};

const DEFAULTS: Settings = {
  level: null,
  location: null,
  calcMethod: 'MuslimWorldLeague',
  asrMadhab: 'shafi',
  reciter: DEFAULT_RECITER,
  prayerReminders: false,
};

const KEY = 'deen-app/settings/v1';

type Ctx = { ready: boolean; settings: Settings; update: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const value = useMemo(() => ({ ready, settings, update }), [ready, settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
