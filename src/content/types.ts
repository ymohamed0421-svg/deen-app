export type Source = {
  kind: 'quran' | 'hadith';
  reference: string; // e.g. "Quran 2:183" or "Sahih al-Bukhari 8"
};

export type ChoiceExercise = {
  type: 'choice';
  prompt: string;
  options: string[];
  answer: number; // index into options
  explain: string;
  source?: Source;
};

export type OrderExercise = {
  type: 'order';
  prompt: string;
  items: string[]; // in the correct order; the player shuffles them
  explain: string;
  source?: Source;
};

export type MatchExercise = {
  type: 'match';
  prompt: string;
  pairs: [string, string][];
  explain: string;
  source?: Source;
};

export type Exercise = ChoiceExercise | OrderExercise | MatchExercise;

export type ReviewStatus = 'draft' | 'in_review' | 'approved';

export type Lesson = {
  id: string;
  title: string;
  teach: string; // short teaching card shown before the exercises
  exercises: Exercise[];
  reviewStatus: ReviewStatus;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  foundation: boolean; // foundation units never cost Oil
  lessons: Lesson[];
};
