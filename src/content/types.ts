export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

export type Source = {
  kind: 'quran' | 'hadith';
  reference: string; // e.g. "Quran 2:183" or "Sahih al-Bukhari 8"
};

export type ChoiceExercise = {
  type: 'choice';
  prompt: string;
  picture?: string; // a big letter, word or emoji shown above the options
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
  picture?: string;
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

/** A big picture card on the teach screen: an Arabic letter, a word or an emoji. */
export type TeachCard = { big: string; title: string; text?: string };

export type Lesson = {
  id: string;
  title: string;
  teach: string; // short teaching card shown before the exercises
  cards?: TeachCard[];
  picture?: string; // an emoji for the lesson, used on the kids path
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

/** A course that sits beside the main path, with its own screen: the Arabic letters and Kids mode. */
export type Course = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  units: Unit[];
};
