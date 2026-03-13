import { create } from "zustand";

export interface TestQuestion {
  id: string;
  questionText: string;
  questionType: "mcq" | "true_false" | "short_answer" | "essay";
  options: { text: string; isCorrect: boolean }[] | null;
  points: number;
  sortOrder: number;
}

export interface TestAnswer {
  questionId: string;
  selectedOption: number | null; // index for MCQ/true_false
  answerText: string | null; // for short_answer/essay
}

interface TestState {
  attemptId: string | null;
  questions: TestQuestion[];
  answers: Map<string, TestAnswer>;
  currentQuestionIndex: number;
  timeRemainingSeconds: number;
  isSubmitting: boolean;
  isSubmitted: boolean;

  // Actions
  initTest: (attemptId: string, questions: TestQuestion[], durationSeconds: number) => void;
  setCurrentQuestion: (index: number) => void;
  setAnswer: (questionId: string, answer: Partial<TestAnswer>) => void;
  tick: () => void;
  setSubmitting: (submitting: boolean) => void;
  setSubmitted: () => void;
  getAnswersArray: () => TestAnswer[];
  reset: () => void;
}

export const useTestStore = create<TestState>((set, get) => ({
  attemptId: null,
  questions: [],
  answers: new Map(),
  currentQuestionIndex: 0,
  timeRemainingSeconds: 0,
  isSubmitting: false,
  isSubmitted: false,

  initTest: (attemptId, questions, durationSeconds) => {
    const answers = new Map<string, TestAnswer>();
    questions.forEach((q) => {
      answers.set(q.id, {
        questionId: q.id,
        selectedOption: null,
        answerText: null,
      });
    });
    set({
      attemptId,
      questions,
      answers,
      currentQuestionIndex: 0,
      timeRemainingSeconds: durationSeconds,
      isSubmitting: false,
      isSubmitted: false,
    });
  },

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),

  setAnswer: (questionId, answer) => {
    const answers = new Map(get().answers);
    const existing = answers.get(questionId) || {
      questionId,
      selectedOption: null,
      answerText: null,
    };
    answers.set(questionId, { ...existing, ...answer });
    set({ answers });
  },

  tick: () => {
    set((state) => ({
      timeRemainingSeconds: Math.max(0, state.timeRemainingSeconds - 1),
    }));
  },

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  setSubmitted: () => set({ isSubmitted: true, isSubmitting: false }),

  getAnswersArray: () => {
    return Array.from(get().answers.values());
  },

  reset: () =>
    set({
      attemptId: null,
      questions: [],
      answers: new Map(),
      currentQuestionIndex: 0,
      timeRemainingSeconds: 0,
      isSubmitting: false,
      isSubmitted: false,
    }),
}));
