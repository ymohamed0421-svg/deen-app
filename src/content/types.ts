export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

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
  minLevel?: KnowledgeLevel; // only shown to learners at this level or above
};

export type OrderExercise = {
  type: 'order';
  prompt: string;
  items: string[]; // in the correct order; the player shuffles them
  explain: string;
  source?: Source;
  minLevel?: KnowledgeLevel; // only shown to learners at this level or above
};

export type MatchExercise = {
  type: 'match';
  prompt: string;
  pairs: [string, string][];
  explain: string;
  source?: Source;
  minLevel?: KnowledgeLevel; // only shown to learners at this level or above
};

export type TrueFalseExercise = {
  type: 'truefalse';
  statement: string;
  answer: boolean;
  explain: string;
  source?: Source;
  minLevel?: KnowledgeLevel;
};

export type FillExercise = {
  type: 'fill';
  sentence: string; // contains ___ where the missing word goes
  options: string[];
  answer: number;
  explain: string;
  source?: Source;
  minLevel?: KnowledgeLevel;
};

export type Exercise = ChoiceExercise | OrderExercise | MatchExercise | TrueFalseExercise | FillExercise;

export type ReviewStatus = 'draft' | 'in_review' | 'approved';

export type Lesson = {
  id: string;
  title: string;
  teach: string; // short teaching card shown before the exercises
  story?: string; // longer reading for the Stories library
  exercises: Exercise[];
  reviewStatus: ReviewStatus;
};

export type Unit = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  foundation: boolean; // foundation units never cost Oil
  tier: KnowledgeLevel; // learners above this tier can skip ahead
  lessons: Lesson[];
};
