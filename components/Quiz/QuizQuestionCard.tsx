"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizMode, QuizQuestionCardProps } from "./types";

interface QuizOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
  mode: QuizMode;
  questionType?: "multiple_choice" | "checkbox";
}

function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  isWrong,
  onClick,
  mode,
  questionType,
}: QuizOptionProps) {
  const baseClasses =
    "relative flex items-center gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 text-left";

  const isCheckbox = questionType === "checkbox";

  if (mode === "review") {
    // 1. Jika opsi ini adalah jawaban BENAR (baik dipilih maupun tidak oleh user)
    if (isCorrect) {
      return (
        <div
          className={`${baseClasses} border-[#198754] bg-emerald-50 text-[#0f5132]`}
        >
          <div className="flex-1">
            <span className="text-xs font-bold text-[#0f5132]">
              {isSelected ? "Jawaban Anda (Benar)" : "Kunci Jawaban"}
            </span>
            <p className="text-sm font-medium">{option}</p>
          </div>
          {isCheckbox ? (
            <div className="h-5 w-5 flex-shrink-0 rounded border-2 border-[#198754] bg-[#198754] flex items-center justify-center">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#198754]" />
          )}
        </div>
      );
    }

    // 2. Jika opsi ini SALAH dan DIPILIH oleh user
    if (isWrong) {
      return (
        <div
          className={`${baseClasses} border-rose-400 bg-rose-50 text-rose-700`}
        >
          <div className="flex-1">
            <span className="text-xs font-bold text-rose-600">
              Jawaban Anda (Salah)
            </span>
            <p className="text-sm font-medium">{option}</p>
          </div>
          {isCheckbox ? (
            <div className="h-5 w-5 flex-shrink-0 rounded border-2 border-rose-400 bg-rose-100 flex items-center justify-center">
              <svg
                className="h-3 w-3 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <XCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
          )}
        </div>
      );
    }

    // 3. Opsi netral (bukan kunci jawaban & tidak dipilih user)
    return (
      <div
        className={`${baseClasses} border-zinc-200 bg-zinc-50 text-zinc-600 opacity-70`}
      >
        <div className="flex-1">
          <span className="text-xs font-bold text-zinc-400">Pilihan</span>
          <p className="text-sm font-medium">{option}</p>
        </div>
        {isCheckbox ? (
          <div className="h-5 w-5 flex-shrink-0 rounded border-2 border-zinc-300" />
        ) : (
          <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-300" />
        )}
      </div>
    );
  }

  // Mode Pengerjaan Quiz (bukan Review)
  return (
    <div
      className={`${baseClasses} cursor-pointer ${
        isSelected
          ? "border-[#198754] bg-[#e8f5e9] text-[#0f5132]"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-[#198754] hover:bg-[#e8f5e9] hover:text-[#0f5132]"
      }`}
      onClick={onClick}
    >
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {isCheckbox ? (
          <div
            className={`h-4 w-4 rounded border-2 transition-all ${
              isSelected
                ? "border-[#198754] bg-[#198754]"
                : "border-zinc-300 bg-white"
            }`}
          >
            {isSelected && (
              <svg
                className="h-3 w-3 text-white mx-auto mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        ) : (
          <div
            className={`rounded-full transition-all ${
              isSelected ? "bg-[#198754] h-4 w-4" : "bg-zinc-300 h-2.5 w-2.5"
            }`}
          />
        )}
      </div>
      <span className="text-sm font-medium">{option}</span>
      {!isCheckbox && (
        <span className="ml-auto text-xs font-bold text-zinc-400">
          {String.fromCharCode(65 + index)}
        </span>
      )}
    </div>
  );
}

export function QuizQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onSelect,
  mode,
}: QuizQuestionCardProps) {
  const isReview = mode === "review";
  const isCheckbox = question.type === "checkbox";
  const selectedArray = Array.isArray(selectedAnswer) ? selectedAnswer : [];

  const correctIndices =
    question.correctAnswerIndices ??
    (question.correctAnswerIndex !== undefined
      ? [question.correctAnswerIndex]
      : [0]);

  const isQuestionCorrect = (() => {
    if (selectedAnswer === undefined) return false;
    if (isCheckbox) {
      const correctSet = new Set(correctIndices);
      const selectedSet = new Set(selectedArray);
      return (
        correctSet.size === selectedSet.size &&
        [...correctSet].every((v) => selectedSet.has(v))
      );
    }
    return selectedAnswer === (question.correctAnswerIndex ?? 0);
  })();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-zinc-400">
            Pertanyaan {questionIndex + 1}/{totalQuestions}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {isCheckbox ? "Pilih Semua yang Benar" : "Pilihan Ganda"}
          </span>
          {isReview && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isQuestionCorrect
                  ? "bg-emerald-50 text-[#198754]"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {isQuestionCorrect ? "Benar" : "Salah"}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-zinc-900 text-sm sm:text-base mb-4 sm:mb-5 leading-snug">
        {question.question}
      </h3>

      <div className="flex flex-col gap-2.5 sm:gap-3">
        {question.options.map((option, optIndex) => {
          const isSelected = isCheckbox
            ? selectedArray.includes(optIndex)
            : selectedAnswer === optIndex;

          const isCorrect = isCheckbox
            ? correctIndices.includes(optIndex)
            : optIndex === (question.correctAnswerIndex ?? 0);

          const isWrong = isSelected && !isCorrect;

          return (
            <QuizOption
              key={optIndex}
              option={option}
              index={optIndex}
              isSelected={isSelected}
              isCorrect={isCorrect}
              isWrong={isWrong}
              onClick={() => onSelect(optIndex)}
              mode={mode}
              questionType={question.type}
            />
          );
        })}
      </div>
    </div>
  );
}
