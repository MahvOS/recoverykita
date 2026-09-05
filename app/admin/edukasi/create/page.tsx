"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EdukasiForm } from "@/components/admin/EdukasiForm";
import { createArticle } from "@/actions/edukasiActions";
import type { ArticlePayload, QuizPayload } from "@/hooks/useEdukasiData";

export default function CreateArticlePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: ArticlePayload, quiz?: QuizPayload) => {
    setSaving(true);
    setError(null);
    const result = await createArticle(payload, quiz);
    setSaving(false);
    if (result.success) {
      router.push("/admin/edukasi");
    } else {
      setError(result.error || "Gagal membuat artikel.");
    }
  };

  const handleCancel = () => {
    router.push("/admin/edukasi");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-950">
          Buat Artikel Edukasi
        </h1>
        <p className="text-sm text-zinc-500">
          Tambahkan artikel baru termasuk kuis interaktif.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
        <EdukasiForm
          article={null}
          quiz={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </div>
    </div>
  );
}
