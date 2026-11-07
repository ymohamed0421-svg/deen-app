import { UNITS } from '../content/units';
import type { GameState } from './rules';

export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));

export function isDone(state: GameState, lessonId: string) {
  return Boolean(state.completedLessons[lessonId]);
}

/** A lesson unlocks when every lesson before it on the path is done. */
export function isUnlocked(state: GameState, lessonId: string) {
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lessonId);
  return ALL_LESSONS.slice(0, idx).every((x) => isDone(state, x.lesson.id));
}

/** The next lesson to play, or null when the whole path is finished. */
export function nextLessonId(state: GameState) {
  return ALL_LESSONS.find((x) => !isDone(state, x.lesson.id))?.lesson.id ?? null;
}

export function unitDone(state: GameState, unitId: string) {
  const unit = UNITS.find((u) => u.id === unitId);
  return Boolean(unit && unit.lessons.every((l) => isDone(state, l.id)));
}

/** True when finishing `lessonId` would complete its unit for the first time. */
export function wouldFinishUnit(state: GameState, lessonId: string) {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unit || unitDone(state, unit.id)) return false;
  return unit.lessons.every((l) => l.id === lessonId || isDone(state, l.id));
}
