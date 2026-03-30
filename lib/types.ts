export type Topic =
  | 'matrici'
  | 'determinanti'
  | 'sistemi-lineari'
  | 'spazi-vettoriali'
  | 'basi-dimensione'
  | 'applicazioni-lineari'
  | 'autovalori'
  | 'geometria-piano'
  | 'geometria-spazio';

export type Difficulty = 'facile' | 'media' | 'difficile';
export type QuizMode = 'allenamento' | 'esame';

export type Question = {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type QuizAttemptSummary = {
  dateIso: string;
  mode: QuizMode;
  total: number;
  correct: number;
  percentage: number;
  topicBreakdown: Partial<Record<Topic, { correct: number; total: number }>>;
};
