'use client';

import { useEffect, useMemo, useState } from 'react';
import { questions } from '@/data/questions';
import { generateQuiz } from '@/lib/generate-quiz';
import { Difficulty, Question, QuizAttemptSummary, QuizMode, Topic } from '@/lib/types';
import { MathText } from '@/components/math-text';

const questionCountOptions = [5, 10, 20, 30, 40, 60];
const historyStorageKey = 'quiz-geometria-history';

const topics: { value: Topic; label: string }[] = [
  { value: 'matrici', label: 'Matrici' },
  { value: 'determinanti', label: 'Determinanti' },
  { value: 'sistemi-lineari', label: 'Sistemi lineari' },
  { value: 'spazi-vettoriali', label: 'Spazi vettoriali' },
  { value: 'basi-dimensione', label: 'Basi e dimensione' },
  { value: 'applicazioni-lineari', label: 'Applicazioni lineari' },
  { value: 'autovalori', label: 'Autovalori' },
  { value: 'diagonalizzazione', label: 'Diagonalizzazione' },
  { value: 'teorema-spettrale', label: 'Teorema spettrale' },
  { value: 'geometria-piano', label: 'Geometria nel piano' },
  { value: 'geometria-spazio', label: 'Geometria nello spazio' },
];

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'facile', label: 'Facile' },
  { value: 'media', label: 'Media' },
  { value: 'difficile', label: 'Difficile' },
  { value: 'difficile-plus', label: 'Difficile Plus' },
];

const modes: { value: QuizMode; label: string; description: string }[] = [
  {
    value: 'allenamento',
    label: 'Allenamento',
    description: 'Feedback immediato dopo ogni risposta, ideale per studiare e capire gli errori.',
  },
  {
    value: 'esame',
    label: 'Esame',
    description: 'Correzione solo alla fine, per simulare una prova vera.',
  },
];

function getTopicLabel(topic: Topic) {
  return topics.find((item) => item.value === topic)?.label ?? topic;
}

function getDifficultyLabel(difficulty: Difficulty) {
  return difficulties.find((item) => item.value === difficulty)?.label ?? difficulty;
}

function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function SelectionSummary({
  label,
  selectedCount,
  totalCount,
  allLabel,
}: {
  label: string;
  selectedCount: number;
  totalCount: number;
  allLabel: string;
}) {
  const isAll = selectedCount === 0 || selectedCount === totalCount;

  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <span className="font-medium text-slate-600">{label}:</span>
      <span className={`rounded-full px-2.5 py-1 ${isAll ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
        {isAll ? allLabel : `${selectedCount} selezionati`}
      </span>
    </div>
  );
}

function summarizeAttempt(quiz: Question[], answers: Record<string, number>, mode: QuizMode): QuizAttemptSummary {
  const topicBreakdown: QuizAttemptSummary['topicBreakdown'] = {};
  let correct = 0;

  for (const question of quiz) {
    const isCorrect = answers[question.id] === question.correctIndex;
    if (isCorrect) correct += 1;

    topicBreakdown[question.topic] = topicBreakdown[question.topic] ?? { correct: 0, total: 0 };
    topicBreakdown[question.topic]!.total += 1;
    if (isCorrect) topicBreakdown[question.topic]!.correct += 1;
  }

  return {
    dateIso: new Date().toISOString(),
    mode,
    total: quiz.length,
    correct,
    percentage: quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0,
    topicBreakdown,
  };
}

function loadHistory(): QuizAttemptSummary[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(historyStorageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as QuizAttemptSummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: QuizAttemptSummary[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(historyStorageKey, JSON.stringify(history.slice(0, 12)));
}

export function QuizApp() {
  const [count, setCount] = useState<number>(10);
  const [mode, setMode] = useState<QuizMode>('allenamento');
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<QuizAttemptSummary[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const maxQuestionsAvailable = useMemo(() => {
    return questions.filter((question) => {
      const topicOk = selectedTopics.length === 0 || selectedTopics.includes(question.topic);
      const difficultyOk =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(question.difficulty);
      return topicOk && difficultyOk;
    }).length;
  }, [selectedTopics, selectedDifficulties]);

  const allTopicsActive = selectedTopics.length === 0 || selectedTopics.length === topics.length;
  const allDifficultiesActive =
    selectedDifficulties.length === 0 || selectedDifficulties.length === difficulties.length;

  const currentQuestion = quiz[currentIndex];
  const currentQuestionAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const currentQuestionRevealed = currentQuestion ? revealedIds.includes(currentQuestion.id) : false;
  const answeredCount = Object.keys(answers).length;
  const progress = quiz.length > 0 ? Math.round(((currentIndex + 1) / quiz.length) * 100) : 0;
  const canFinishExam = quiz.length > 0 && answeredCount === quiz.length;

  const latestAttempt = history[0];
  const weakTopics = latestAttempt
    ? Object.entries(latestAttempt.topicBreakdown)
        .filter(([, stats]) => stats && stats.total > 0)
        .map(([topic, stats]) => ({
          topic: topic as Topic,
          percentage: Math.round(((stats?.correct ?? 0) / (stats?.total ?? 1)) * 100),
        }))
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 3)
    : [];

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    );
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties((current) =>
      current.includes(difficulty)
        ? current.filter((item) => item !== difficulty)
        : [...current, difficulty],
    );
  };

  const resetSession = () => {
    setAnswers({});
    setRevealedIds([]);
    setSubmitted(false);
    setCurrentIndex(0);
  };

  const handleGenerate = () => {
    const safeCount = Math.min(count, maxQuestionsAvailable || count);
    const nextQuiz = generateQuiz({
      count: safeCount,
      topics: selectedTopics,
      difficulties: selectedDifficulties,
    });

    setQuiz(nextQuiz);
    resetSession();
  };

  const handleSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    if (mode === 'allenamento' && revealedIds.includes(questionId)) return;

    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || !currentQuestionAnswered) return;
    if (mode !== 'allenamento') return;

    setRevealedIds((current) =>
      current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id],
    );
  };

  const persistAttempt = (summary: QuizAttemptSummary) => {
    const nextHistory = [summary, ...history].slice(0, 12);
    setHistory(nextHistory);
    saveHistory(nextHistory);
  };

  const handleSubmit = () => {
    const summary = summarizeAttempt(quiz, answers, mode);
    setSubmitted(true);
    setRevealedIds(quiz.map((question) => question.id));
    persistAttempt(summary);
  };

  const correctCount = quiz.filter((question) => answers[question.id] === question.correctIndex).length;
  const percentage = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Versione migliorata</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Quiz di Geometria e Algebra Lineare</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Quiz bilanciati per argomento e difficoltà, modalità allenamento o esame, formule
            matematiche e statistiche locali per capire dove conviene ripassare.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Domande nel serbatoio" value={questions.length} />
          <StatCard title="Disponibili coi filtri attuali" value={maxQuestionsAvailable} />
          <StatCard title="Risposte date" value={answeredCount} hint="Nel quiz in corso" />
          <StatCard
            title="Ultimo risultato"
            value={latestAttempt ? `${latestAttempt.percentage}%` : '—'}
            hint={latestAttempt ? `${latestAttempt.correct}/${latestAttempt.total} corrette` : 'Ancora nessun tentativo'}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">1. Configura il quiz</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="count" className="mb-2 block text-sm font-medium text-slate-700">
                  Numero di domande
                </label>
                <select
                  id="count"
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3"
                >
                  {questionCountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Se chiedi più domande di quelle disponibili coi filtri, il quiz userà il massimo
                  disponibile.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Modalità</p>
                <div className="grid gap-3">
                  {modes.map((item) => {
                    const active = mode === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMode(item.value)}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-800'
                        }`}
                      >
                        <p className="font-semibold">{item.label}</p>
                        <p className={`mt-1 text-sm ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Argomenti</p>
                  <button
                    type="button"
                    onClick={() => setSelectedTopics([])}
                    className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
                  >
                    Tutti gli argomenti
                  </button>
                </div>
                <SelectionSummary
                  label="Stato"
                  selectedCount={selectedTopics.length}
                  totalCount={topics.length}
                  allLabel="Nessun filtro: verranno usati tutti gli argomenti"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {topics.map((topic) => {
                    const active = allTopicsActive || selectedTopics.includes(topic.value);
                    return (
                      <button
                        key={topic.value}
                        type="button"
                        onClick={() => toggleTopic(topic.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Se non selezioni nulla, il quiz pesca da tutti gli argomenti.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">Difficoltà</p>
                  <button
                    type="button"
                    onClick={() => setSelectedDifficulties([])}
                    className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
                  >
                    Tutte le difficoltà
                  </button>
                </div>
                <SelectionSummary
                  label="Stato"
                  selectedCount={selectedDifficulties.length}
                  totalCount={difficulties.length}
                  allLabel="Nessun filtro: verranno usate tutte le difficoltà"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {difficulties.map((difficulty) => {
                    const active = allDifficultiesActive || selectedDifficulties.includes(difficulty.value);
                    return (
                      <button
                        key={difficulty.value}
                        type="button"
                        onClick={() => toggleDifficulty(difficulty.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {difficulty.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Se non selezioni nulla, il quiz pesca da facile, media, difficile e difficile plus.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Anteprima configurazione</p>
              <p className="mt-1">
                Il quiz userà <span className="font-semibold">{count}</span> domande in modalità{' '}
                <span className="font-semibold">{mode}</span>, con{' '}
                <span className="font-semibold">{allTopicsActive ? 'tutti gli argomenti' : `${selectedTopics.length} argomenti selezionati`}</span>{' '}
                e <span className="font-semibold">{allDifficultiesActive ? 'tutte le difficoltà' : `${selectedDifficulties.length} difficoltà selezionate`}</span>.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
              >
                Genera quiz
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTopics([]);
                  setSelectedDifficulties([]);
                  setCount(10);
                  setMode('allenamento');
                }}
                className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700"
              >
                Reset filtri
              </button>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">2. Come userei il tool</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Allenamento per capire subito gli errori.</li>
                <li>Esame per simulare una mini prova a tempo libero.</li>
                <li>Filtro per argomento quando vuoi fare recupero mirato.</li>
                <li>Il blocco difficile plus punta a quesiti che collegano piu argomenti insieme.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Argomenti da ripassare per primi</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {weakTopics.length > 0 ? (
                  weakTopics.map((item) => (
                    <Pill key={item.topic}>
                      {getTopicLabel(item.topic)} · {item.percentage}%
                    </Pill>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Compariranno dopo il primo quiz completato.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Ultimi tentativi</h3>
              <div className="mt-3 space-y-3">
                {history.length > 0 ? (
                  history.slice(0, 4).map((attempt, index) => (
                    <div key={`${attempt.dateIso}-${index}`} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-medium">
                        {attempt.percentage}% · {attempt.correct}/{attempt.total} corrette
                      </p>
                      <p className="mt-1 text-slate-500">
                        {attempt.mode} · {new Date(attempt.dateIso).toLocaleString('it-IT')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nessuno storico salvato nel browser.</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        {quiz.length > 0 && currentQuestion ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">3. Svolgi il quiz</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Domanda {currentIndex + 1} di {quiz.length}
                </p>
              </div>
              {submitted ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  Punteggio finale: {correctCount}/{quiz.length} · {percentage}%
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Modalità {mode}
                </div>
              )}
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
            </div>

            <article className="mt-6 rounded-[1.75rem] border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Domanda {currentIndex + 1}</span>
                <span>•</span>
                <span>{getTopicLabel(currentQuestion.topic)}</span>
                <span>•</span>
                <span>{getDifficultyLabel(currentQuestion.difficulty)}</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                <MathText text={currentQuestion.prompt} />
              </h3>

              <div className="mt-5 grid gap-3">
                {currentQuestion.options.map((option, optionIndex) => {
                  const checked = answers[currentQuestion.id] === optionIndex;
                  const showCorrect = revealedIds.includes(currentQuestion.id) && optionIndex === currentQuestion.correctIndex;
                  const showWrong =
                    revealedIds.includes(currentQuestion.id) && checked && optionIndex !== currentQuestion.correctIndex;

                  return (
                    <label
                      key={`${currentQuestion.id}-${optionIndex}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        showCorrect
                          ? 'border-emerald-400 bg-emerald-50'
                          : showWrong
                            ? 'border-rose-400 bg-rose-50'
                            : checked
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 bg-white'
                      } ${submitted ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        checked={checked}
                        onChange={() => handleSelect(currentQuestion.id, optionIndex)}
                        className="mt-1"
                        disabled={submitted || (mode === 'allenamento' && currentQuestionRevealed)}
                      />
                      <span className="text-slate-800">
                        <MathText text={option} />
                      </span>
                    </label>
                  );
                })}
              </div>

              {revealedIds.includes(currentQuestion.id) ? (
                <div
                  className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                    answers[currentQuestion.id] === currentQuestion.correctIndex
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-900'
                  }`}
                >
                  <p className="font-semibold">
                    {answers[currentQuestion.id] === currentQuestion.correctIndex ? 'Risposta corretta' : 'Da rivedere'}
                  </p>
                  <p className="mt-1">
                    <MathText text={currentQuestion.explanation} />
                  </p>
                </div>
              ) : null}
            </article>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                  disabled={currentIndex === 0}
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Indietro
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((value) => Math.min(quiz.length - 1, value + 1))}
                  disabled={currentIndex === quiz.length - 1}
                  className="rounded-2xl border border-slate-300 px-4 py-3 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Avanti
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {mode === 'allenamento' && !submitted ? (
                  <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={!currentQuestionAnswered || currentQuestionRevealed}
                    className="rounded-2xl border border-slate-900 px-4 py-3 font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Controlla risposta
                  </button>
                ) : null}

                {!submitted ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={mode === 'esame' ? !canFinishExam : false}
                    className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {mode === 'esame' ? 'Consegna quiz' : 'Chiudi e valuta quiz'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
                  >
                    Genera nuovo quiz
                  </button>
                )}
              </div>
            </div>

            {mode === 'esame' && !submitted && !canFinishExam ? (
              <p className="mt-4 text-sm text-slate-500">
                In modalità esame puoi consegnare solo dopo aver risposto a tutte le domande.
              </p>
            ) : null}
          </section>
        ) : null}

        {submitted && quiz.length > 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">4. Correzione finale</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Qui sotto trovi punteggio, riepilogo per argomento e tutte le spiegazioni.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                {correctCount}/{quiz.length} corrette · {percentage}%
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard title="Risultato" value={`${percentage}%`} />
              <StatCard title="Corrette" value={`${correctCount}/${quiz.length}`} />
              <StatCard
                title="Argomento più debole"
                value={weakTopics[0] ? getTopicLabel(weakTopics[0].topic) : '—'}
                hint={weakTopics[0] ? `${weakTopics[0].percentage}% nell’ultimo tentativo` : undefined}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Object.entries(summarizeAttempt(quiz, answers, mode).topicBreakdown).map(([topic, stats]) => (
                <div key={topic} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{getTopicLabel(topic as Topic)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {stats?.correct}/{stats?.total} corrette ·{' '}
                    {Math.round((((stats?.correct ?? 0) / (stats?.total ?? 1)) * 100))}%
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {quiz.map((question, index) => {
                const selectedAnswer = answers[question.id];
                const isCorrect = selectedAnswer === question.correctIndex;

                return (
                  <article key={question.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <span>Domanda {index + 1}</span>
                      <span>•</span>
                      <span>{getTopicLabel(question.topic)}</span>
                      <span>•</span>
                      <span>{getDifficultyLabel(question.difficulty)}</span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      <MathText text={question.prompt} />
                    </h3>

                    <div className="mt-4 grid gap-3">
                      {question.options.map((option, optionIndex) => {
                        const checked = selectedAnswer === optionIndex;
                        const showCorrect = optionIndex === question.correctIndex;
                        const showWrong = checked && optionIndex !== question.correctIndex;

                        return (
                          <div
                            key={`${question.id}-${optionIndex}`}
                            className={`rounded-2xl border px-4 py-3 ${
                              showCorrect
                                ? 'border-emerald-400 bg-emerald-50'
                                : showWrong
                                  ? 'border-rose-400 bg-rose-50'
                                  : 'border-slate-200 bg-white'
                            }`}
                          >
                            <MathText text={option} />
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                        isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                      }`}
                    >
                      <p className="font-semibold">{isCorrect ? 'Corretta' : 'Da rivedere'}</p>
                      <p className="mt-1">
                        <MathText text={question.explanation} />
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
