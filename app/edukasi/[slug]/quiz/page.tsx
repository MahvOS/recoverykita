"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useParams } from "next/navigation";
import { supabase, getSupabaseClient, Article, Quiz } from "@/lib/supabase";
import { QuizInteractive } from "@/components/Quiz";
import type { QuizQuestion } from "@/lib/supabase";

interface QuizQuestionRow {
  id: string;
  question_text?: string;
  question?: string;
  type?: string;
}

interface QuizOptionRow {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface QuizHeaderRow {
  id: string;
  article_id: string;
  title?: string | null;
  description?: string | null;
}

export default function QuizPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      setLoading(true);

      if (!supabase) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient();

        const { data: articleData, error: articleError } = await client
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .single();

        if (articleError || !articleData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setArticle(articleData as Article);

        const { data: quizHeader, error: headerError } = await client
          .from("quizzes")
          .select("*")
          .eq("article_id", (articleData as Article).id)
          .maybeSingle();

        if (headerError) throw headerError;
        if (!quizHeader) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const header = quizHeader as QuizHeaderRow;

        const { data: questionsData, error: qError } = await client
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", header.id);

        if (qError) throw qError;
        if (
          !questionsData ||
          (questionsData as QuizQuestionRow[]).length === 0
        ) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const formattedQuestions: QuizQuestion[] = await Promise.all(
          (questionsData as QuizQuestionRow[]).map(async (q) => {
            const { data: optionsData } = await client
              .from("quiz_options")
              .select("*")
              .eq("question_id", q.id);

            const optionsList = (optionsData || []) as QuizOptionRow[];
            const optionsArray = optionsList.map((opt) => opt.option_text);
            const questionType =
              q.type === "checkbox" ? "checkbox" : "multiple_choice";

            let correctAnswerIndex = 0;
            let correctAnswerIndices: number[] | undefined;

            if (questionType === "checkbox") {
              correctAnswerIndices = optionsList
                .map((opt, idx) => (opt.is_correct === true ? idx : -1))
                .filter((idx) => idx >= 0);
              if (correctAnswerIndices.length === 0) {
                correctAnswerIndices = [0];
              }
              correctAnswerIndex = correctAnswerIndices[0];
            } else {
              const correctIndex = optionsList.findIndex(
                (opt) => opt.is_correct === true,
              );
              correctAnswerIndex = correctIndex >= 0 ? correctIndex : 0;
              correctAnswerIndices = [correctAnswerIndex];
            }

            return {
              id: q.id,
              question: q.question_text || q.question || "Pertanyaan",
              options: optionsArray,
              correctAnswerIndex,
              correctAnswerIndices,
              type: questionType,
            };
          }),
        );

        setQuiz({
          id: header.id,
          article_id: header.article_id,
          title: header.title ?? null,
          description: header.description ?? undefined,
          questions: formattedQuestions,
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Gagal memuat kuis.";
        console.error("Error fetching quiz data:", err);
        setNotFound(true);
        void message;
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#198754]/20 border-t-[#198754] rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-semibold text-zinc-700">
          Kuis tidak ditemukan
        </p>
        <Link
          href={`/edukasi/${slug}`}
          className="text-sm font-semibold text-[#198754] hover:text-[#0f5132] transition-colors"
        >
          ← Kembali ke Artikel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      <Navbar />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24">
        <nav className="text-xs text-zinc-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#198754] transition-colors">
            Beranda
          </Link>
          <span>›</span>
          <Link
            href="/edukasi"
            className="hover:text-[#198754] transition-colors"
          >
            Edukasi
          </Link>
          <span>›</span>
          {article && (
            <>
              <Link
                href={`/edukasi/${article.slug}`}
                className="hover:text-[#198754] transition-colors"
              >
                {article.title}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-zinc-600 font-medium">
            {quiz?.title ?? "Kuis Interaktif"}
          </span>
        </nav>
      </div>

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f5132] leading-tight">
              {quiz?.title ?? "Kuis Interaktif"}
            </h1>
            {quiz?.description && (
              <p className="text-sm text-zinc-500 max-w-2xl">
                {quiz.description}
              </p>
            )}
          </div>
          {article && (
            <div className="flex gap-3">
              <Link
                href={`/edukasi/${article.slug}#quiz-section`}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:border-[#198754] hover:text-[#0f5132] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12h18M3 12l8-8m-8 8l8 8"
                  />
                </svg>
                Kembali ke Artikel
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        {quiz ? (
          <QuizInteractive quiz={quiz} />
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-8 text-center">
            <p className="text-zinc-500 text-sm">
              Tidak ada kuis yang tersedia untuk artikel ini.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/60 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="relative w-7 h-7">
                <Image
                  src="/logosingle.ico"
                  alt="RecoveryKita Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold text-[#0f5132] tracking-tight">
                RecoveryKita
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} RecoveryKita. All rights reserved.{" "}
              <br className="md:hidden" />
              Menuju Ekonomi Sirkular Indonesia.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-medium text-zinc-500">
            <Link href="/" className="hover:text-[#198754] transition-colors">
              Beranda
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-[#198754] transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/peta"
              className="hover:text-[#198754] transition-colors"
            >
              Peta
            </Link>
            <Link
              href="/lapor"
              className="hover:text-[#198754] transition-colors"
            >
              Lapor
            </Link>
            <Link
              href="/edukasi"
              className="hover:text-[#198754] transition-colors"
            >
              Edukasi
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
