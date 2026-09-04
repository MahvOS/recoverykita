import type {
  Quiz as SupabaseQuiz,
  QuizQuestion as SupabaseQuizQuestion,
} from "@/lib/supabase";

export interface QuizQuestion extends Omit<
  SupabaseQuizQuestion,
  "options" | "correctAnswerIndex" | "correctAnswerIndices" | "type"
> {
  question: string;
  options: string[];
  type?: "multiple_choice" | "checkbox";
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
}

export interface Quiz {
  id: string;
  article_id?: string | null;
  title?: string | null; // Izinkan null agar cocok dengan tipe Supabase
  questions: QuizQuestion[];
}

export type SelectedAnswers = Record<number, number | number[]>;

export type QuizMode = "interactive" | "review";

export interface QuizInteractiveProps {
  quiz: Quiz | SupabaseQuiz | null | undefined; // Izinkan SupabaseQuiz langsung sebagai prop
  articleId?: string;
}

export interface QuizQuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | number[] | undefined;
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
