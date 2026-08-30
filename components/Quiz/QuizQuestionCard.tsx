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
}

function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  isWrong,
  onClick,
  mode,
}: QuizOptionProps) {
  const baseClasses =
    "relative flex items-center gap-3 rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition-all duration-200 text-left";

  if (mode === "review") {
    if (isCorrect && isSelected) {
      return (
        <div
          className={`${baseClasses} border-[#198754] bg-emerald-50 text-[#0f5132]`}
        >
          <div className="flex-1">
            <span className="text-xs font-bold text-[#0f5132]">
              Jawaban Anda
            </span>
            <p className="text-sm font-medium">{option}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#198754]" />
        </div>
      );
    }

    if (isWrong) {
      return (
        <div
          className={`${baseClasses} border-rose-400 bg-rose-50 text-rose-700`}
        >
          <div className="flex-1">
            <span className="text-xs font-bold text-rose-600">
              Jawaban Anda
            </span>
            <p className="text-sm font-medium">{option}</p>
          </div>
          <XCircle className="h-5 w-5 flex-shrink-0 text-rose-600" />
        </div>
      );
    }

    if (isCorrect) {
      return (
        <div
          className={`${baseClasses} border-[#198754] bg-emerald-50 text-[#0f5132]`}
        >
          <div className="flex-1">
            <span className="text-xs font-bold text-[#0f5132]">Benar</span>
            <p className="text-sm font-medium">{option}</p>
          </div>
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#198754]" />
        </div>
      );
    }

    return (
      <div
        className={`${baseClasses} border-zinc-200 bg-zinc-50 text-zinc-600`}
        onClick={onClick}
      >
        <div className="flex-1">
          <span className="text-xs font-bold text-zinc-400">Pilihan</span>
          <p className="text-sm font-medium">{option}</p>
        </div>
        <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-zinc-300" />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${
        isSelected
          ? "border-[#198754] bg-[#e8f5e9] text-[#0f5132]"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-[#198754] hover:bg-[#e8f5e9] hover:text-[#0f5132]"
      }`}
      onClick={onClick}
    >
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <div
          className={`h-2.5 w-2.5 rounded-full transition-all ${
            isSelected ? "bg-[#198754] h-4 w-4" : "bg-zinc-300 h-2.5 w-2.5"
          }`}
        />
      </div>
      <span className="text-sm font-medium">{option}</span>
      <span className="ml-auto text-xs font-bold text-zinc-400">
        {String.fromCharCode(65 + index)}
      </span>
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

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-xs font-bold text-zinc-400">
            Pertanyaan {questionIndex + 1}/{totalQuestions}
          </span>
          {isReview && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                selectedAnswer !== undefined &&
                selectedAnswer === question.correctAnswerIndex
                  ? "bg-emerald-50 text-[#198754]"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {selectedAnswer !== undefined &&
              selectedAnswer === question.correctAnswerIndex
                ? "Benar"
                : "Salah"}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-bold text-zinc-900 text-sm sm:text-base mb-4 sm:mb-5 leading-snug">
        {question.question}
      </h3>

      <div className="flex flex-col gap-2.5 sm:gap-3">
        {question.options.map((option, optIndex) => {
          const isSelected = selectedAnswer === optIndex;
          const isCorrect = optIndex === question.correctAnswerIndex;
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
            />
          );
        })}
      </div>

      {isReview && question.explanation && (
        <div className="mt-4 rounded-xl bg-[#e8f5e9] border border-[#198754]/20 p-3.5 sm:p-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Penjelasan
          </span>
          <p className="mt-1 text-sm text-zinc-700 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
