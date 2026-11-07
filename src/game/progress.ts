import type { KnowledgeLevel } from '../content/types';
import { UNITS, levelRank } from '../content/units';
import type { GameState } from './rules';

export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));

export function isDone(state: GameState, lessonId: string) {
  return Boolean(state.completedLessons[lessonId]);
}

/** Units below the learner's level are open to review but don't block the path. */
function gates(level: KnowledgeLevel, unitTier: KnowledgeLevel) {
  return levelRank(unitTier) >= levelRank(level);
}

/**
 * A lesson unlocks when every earlier lesson that gates the path is done.
 * Beginners go in order from the start. Intermediate and advanced learners
 * can open the easier units any time and start at their own level.
 */
export function isUnlocked(state: GameState, lessonId: string, level: KnowledgeLevel = 'beginner') {
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lessonId);
  const target = ALL_LESSONS[idx];
  if (target && !gates(level, target.unit.tier)) return true;
  return ALL_LESSONS.slice(0, idx).every((x) => !gates(level, x.unit.tier) || isDone(state, x.lesson.id));
}

/** The next lesson to play, or null when the whole path is finished. */
export function nextLessonId(state: GameState, level: KnowledgeLevel = 'beginner') {
  return (
    ALL_LESSONS.find((x) => gates(level, x.unit.tier) && !isDone(state, x.lesson.id))?.lesson.id ??
    ALL_LESSONS.find((x) => !isDone(state, x.lesson.id))?.lesson.id ??
    null
  );
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
