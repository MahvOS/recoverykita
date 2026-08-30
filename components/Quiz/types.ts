import type { Quiz, QuizQuestion } from "@/lib/supabase";

export type { Quiz, QuizQuestion };

export type SelectedAnswers = Record<number, number>;

export type QuizMode = "interactive" | "review";

export interface QuizInteractiveProps {
  quiz: Quiz | null | undefined;
  articleId?: string;
}

export interface QuizQuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | undefined;
  onSelect: (optionIndex: number) => void;
  mode: QuizMode;
  isCorrect?: boolean;
}

export interface QuizResultSummaryProps {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
}

export interface QuizProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  isSubmitted: boolean;
}
