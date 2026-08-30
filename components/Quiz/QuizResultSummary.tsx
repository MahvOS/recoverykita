"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizResultSummaryProps } from "./types";

export function QuizResultSummary({
  totalQuestions,
  correctCount,
  wrongCount,
  score,
}: QuizResultSummaryProps) {
  return (
    <div className="mb-6 rounded-2xl border border-[#198754]/20 bg-[#e8f5e9] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#0f5132]">Hasil Kuis</h3>
        <div className="text-right">
          <span className="text-2xl font-black text-[#0f5132]">
            {score}/100
          </span>
          <p className="text-xs text-zinc-500">
            {correctCount} dari {totalQuestions} benar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-[#198754]" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400">Benar</p>
            <p className="text-xl font-black text-[#198754]">{correctCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400">Salah</p>
            <p className="text-xl font-black text-rose-600">{wrongCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#198754] to-[#20c997]"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
