"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { EdukasiForm } from "@/components/admin/EdukasiForm";
import { updateArticle } from "@/actions/edukasiActions";
import type {
  ArticlePayload,
  QuizPayload,
  EdukasiQuiz,
} from "@/hooks/useEdukasiData";
import type { Article } from "@/lib/supabase";

function quizToForm(quiz: EdukasiQuiz | null) {
  if (!quiz) return null;

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      order_index: q.order_index,
      type: q.type,
      quiz_options: q.quiz_options
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_index: opt.order_index,
        })),
    })),
  };
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [quiz, setQuiz] = useState<ReturnType<typeof quizToForm>>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/articles/${id}`);
        if (res.ok) {
          const json = await res.json();
          setArticle(json.article);
          setQuiz(quizToForm(json.quiz));
        } else {
          setArticle(null);
          setQuiz(null);
        }
      } catch {
        setArticle(null);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  const handleSubmit = async (
    payload: ArticlePayload,
    quizPayload?: QuizPayload,
    removeQuiz?: boolean,
  ) => {
    setSaving(true);
    setError(null);
    const result = await updateArticle(id, payload, quizPayload, removeQuiz);
    setSaving(false);
    if (result.success) {
      router.push("/admin/edukasi");
    } else {
      setError(result.error || "Gagal memperbarui artikel.");
    }
  };

  const handleCancel = () => {
    router.push("/admin/edukasi");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="space-y-4">
          <div className="h-8 bg-zinc-100 rounded animate-pulse w-3/4" />
          <div className="h-8 bg-zinc-100 rounded animate-pulse w-1/2" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-zinc-500">Artikel tidak ditemukan.</p>
        <button
          onClick={() => router.push("/admin/edukasi")}
          className="mt-4 text-sm font-semibold text-[#198754] hover:underline"
        >
          ← Kembali ke Edukasi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-950">
          Edit Artikel Edukasi
        </h1>
        <p className="text-sm text-zinc-500">
          Perbarui artikel &quot;{article.title}&quot; termasuk kuisnya.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
        <EdukasiForm
          article={article}
          quiz={quiz}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </div>
    </div>
  );
}
