import { ARABIC_COURSE } from './course-arabic.ts';
import { KIDS_COURSE } from './course-kids.ts';
import type { Course } from './types.ts';

/** Courses beside the main path. Their lessons use the same lesson screen and rewards. */
export const COURSES: Course[] = [ARABIC_COURSE, KIDS_COURSE];

export const findCourse = (id: string) => COURSES.find((c) => c.id === id);

/** The course a unit belongs to, or undefined for the main path. */
export const courseOfUnit = (unitId: string) => COURSES.find((c) => c.units.some((u) => u.id === unitId));
