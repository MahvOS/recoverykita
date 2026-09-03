"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Send } from "lucide-react";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizResultSummary } from "./QuizResultSummary";
import type { Quiz, QuizQuestion, QuizMode, SelectedAnswers } from "./types";

interface QuizInteractiveProps {
  quiz: Quiz | null | undefined;
}

function normalizeQuiz(quiz: unknown): Quiz | null {
  if (!quiz || typeof quiz !== "object") return null;

  const q = quiz as Record<string, unknown>;
  const questionsRaw = q.questions;

  if (!Array.isArray(questionsRaw)) return null;

  const questions: QuizQuestion[] = [];

  for (const item of questionsRaw) {
    if (!item || typeof item !== "object") continue;
    const qi = item as Record<string, unknown>;

    const options: string[] = Array.isArray(qi.options)
      ? qi.options.map((o: unknown) => String(o ?? "")).filter(Boolean)
      : [];

    if (!qi.question || typeof qi.question !== "string" || options.length < 2) {
      continue;
    }

    // Mendukung berbagai penamaan key index jawaban benar dari database
    const rawCorrect =
      qi.correctAnswerIndex ??
      qi.correct_answer_index ??
      qi.correct_answer ??
      qi.correctAnswer;

    const parsedCorrect =
      typeof rawCorrect === "string" ? parseInt(rawCorrect, 10) : rawCorrect;

    const correctAnswerIndex =
      typeof parsedCorrect === "number" &&
      !Number.isNaN(parsedCorrect) &&
      parsedCorrect >= 0 &&
      parsedCorrect < options.length
        ? parsedCorrect
        : 0;

    const explanation =
      typeof qi.explanation === "string"
        ? qi.explanation
        : typeof qi.explanation_text === "string"
          ? qi.explanation_text
          : undefined;

    questions.push({
      id: String(qi.id ?? crypto.randomUUID()),
      question: qi.question,
      options,
      correctAnswerIndex,
      ...(explanation !== undefined ? { explanation } : {}),
    });
  }

  if (questions.length === 0) return null;

  return {
    id: typeof q.id === "string" ? String(q.id) : "",
    article_id: String(q.article_id ?? q.articleId ?? ""),
    title:
      typeof q.title === "string" && q.title.trim()
        ? q.title.trim()
        : "Kuis Pengetahuan",
    questions,
  };
}

export function QuizInteractive({ quiz }: QuizInteractiveProps) {
  const parsedQuiz = useMemo(() => normalizeQuiz(quiz), [quiz]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const questions = parsedQuiz?.questions ?? [];
  const title = parsedQuiz?.title ?? "Kuis Pengetahuan";

  const score = useMemo(() => {
    if (!parsedQuiz) return 0;
    let correct = 0;
    parsedQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) correct++;
    });
    return correct;
  }, [selectedAnswers, parsedQuiz]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const correctCount = score;
  const wrongCount = totalQuestions - correctCount;
  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const currentQuestion = questions[currentQuestionIndex] ?? questions[0];
  const isCurrentAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

  const mode: QuizMode = isSubmitted ? "review" : "interactive";

  if (!parsedQuiz) {
    return null;
  }

  const handleSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    const hasCurrent = selectedAnswers[currentQuestionIndex] !== undefined;
    if (!hasCurrent) return;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentQuestionIndex(idx);
  };

  const handleSubmit = () => {
    if (!allAnswered || isSubmitted) return;
    setIsSubmitted(true);
  };

  return (
    <section className="w-full" aria-label="Kuis Interaktif">
      {!isSubmitted && (
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Bertemu {answeredCount} dari {totalQuestions} terjawab
          </span>
          <span>
            Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
          </span>
        </div>
      )}

      {!isSubmitted && (
        <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#198754] to-[#20c997] transition-all"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      )}

      {!isSubmitted && (
        <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
          {questions.map((_, idx) => {
            const answered = selectedAnswers[idx] !== undefined;
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJump(idx)}
                className={`flex-shrink-0 flex items-center justify-center rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  isCurrent
                    ? "border-[#198754] bg-[#e8f5e9] text-[#0f5132]"
                    : answered
                      ? "border-[#198754] bg-emerald-50 text-[#198754]"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {!isSubmitted ? (
        <>
          <QuizQuestionCard
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswers[currentQuestionIndex]}
            onSelect={handleSelect}
            mode={mode}
          />

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                allAnswered
                  ? "bg-[#20c997] text-[#052617] hover:bg-[#1bb285]"
                  : "bg-zinc-200 text-zinc-500"
              }`}
            >
              <Send className="h-4 w-4" />
              Kirim Jawaban
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Lanjut
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <QuizResultSummary
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            wrongCount={wrongCount}
            score={scorePercent}
          />

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctAnswerIndex;

              return (
                <QuizQuestionCard
                  key={q.id}
                  question={q}
                  questionIndex={idx}
                  totalQuestions={totalQuestions}
                  selectedAnswer={userAnswer}
                  onSelect={() => {}}
                  mode="review"
                  isCorrect={isCorrect}
                />
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Ulangi Kuis
            </button>
          </div>
        </>
      )}
    </section>
  );
}
