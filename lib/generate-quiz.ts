import { questions } from '@/data/questions';
import { Difficulty, Question, Topic } from '@/lib/types';

export type QuizFilters = {
  count: number;
  topics: Topic[];
  difficulties: Difficulty[];
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function buildGroups(filtered: Question[], filters: QuizFilters) {
  const byTopic = new Map<Topic, Question[]>();
  const byDifficulty = new Map<Difficulty, Question[]>();

  for (const question of filtered) {
    byTopic.set(question.topic, [...(byTopic.get(question.topic) ?? []), question]);
    byDifficulty.set(question.difficulty, [...(byDifficulty.get(question.difficulty) ?? []), question]);
  }

  const activeTopics = filters.topics.length > 0 ? filters.topics : [...byTopic.keys()];
  const activeDifficulties =
    filters.difficulties.length > 0 ? filters.difficulties : [...byDifficulty.keys()];

  return { byTopic, byDifficulty, activeTopics, activeDifficulties };
}

export function generateQuiz(filters: QuizFilters): Question[] {
  const filtered = questions.filter((question) => {
    const topicOk = filters.topics.length === 0 || filters.topics.includes(question.topic);
    const difficultyOk =
      filters.difficulties.length === 0 || filters.difficulties.includes(question.difficulty);

    return topicOk && difficultyOk;
  });

  const target = Math.min(filters.count, filtered.length);
  if (target === 0) return [];

  const { byTopic, byDifficulty, activeTopics, activeDifficulties } = buildGroups(filtered, filters);
  const selected = new Map<string, Question>();

  const topicOrder = shuffle(activeTopics.filter((topic) => (byTopic.get(topic) ?? []).length > 0));
  for (const topic of topicOrder) {
    if (selected.size >= target) break;
    const candidate = shuffle(byTopic.get(topic) ?? []).find((question) => !selected.has(question.id));
    if (candidate) selected.set(candidate.id, candidate);
  }

  const difficultyOrder = shuffle(
    activeDifficulties.filter((difficulty) => (byDifficulty.get(difficulty) ?? []).length > 0),
  );
  for (const difficulty of difficultyOrder) {
    if (selected.size >= target) break;
    const candidate = shuffle(byDifficulty.get(difficulty) ?? []).find(
      (question) => !selected.has(question.id),
    );
    if (candidate) selected.set(candidate.id, candidate);
  }

  const remaining = shuffle(filtered).filter((question) => !selected.has(question.id));
  for (const question of remaining) {
    if (selected.size >= target) break;
    selected.set(question.id, question);
  }

  return shuffle([...selected.values()]);
}
