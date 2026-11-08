// Saves memorization progress on the phone. Shared by every screen through one small store.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { ayahKey, grade, type Grade, type MemorizeStore } from '../quran/memorize';

const KEY = 'deen-app/memorize/v1';

let store: MemorizeStore = {};
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function load() {
  if (loaded) return;
  loaded = true;
  AsyncStorage.getItem(KEY)
    .then((raw) => {
      if (!raw) return;
      // Anything graded before the load finished wins over what was saved.
      store = { ...(JSON.parse(raw) as MemorizeStore), ...store };
      emit();
    })
    .catch(() => {});
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMemorizeStore() {
  return useSyncExternalStore(subscribe, () => store, () => store);
}

export function gradeAyah(surah: number, index: number, result: Grade, today: string) {
  const key = ayahKey(surah, index);
  store = { ...store, [key]: grade(store[key], result, today) };
  AsyncStorage.setItem(KEY, JSON.stringify(store)).catch(() => {});
  emit();
}
