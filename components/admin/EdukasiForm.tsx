"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { supabase, getSupabaseClient, Article } from "@/lib/supabase";
import type { ArticlePayload, QuizPayload } from "@/hooks/useEdukasiData";
import { uploadArticleThumbnail } from "@/actions/edukasiActions";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORIES = [
  "Pengelolaan Sampah",
  "Energi & Iklim",
  "Air & Lingkungan",
  "Konsumsi Berkelanjutan",
  "Komunitas & Gerakan",
  "Plastik",
];

interface EditableQuizQuestion {
  id?: string;
  question_text: string;
  options: EditableQuizOption[];
  type?: "multiple_choice" | "checkbox";
}

interface EditableQuizOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
}

interface EdukasiFormProps {
  article?: Article | null;
  quiz?: {
    id: string;
    title: string;
    description: string | null;
    questions: {
      id: string;
      question_text: string;
      order_index: number;
      quiz_options: {
        id: string;
        option_text: string;
        is_correct: boolean;
        order_index: number;
      }[];
    }[];
  } | null;
  onSubmit: (
    payload: ArticlePayload,
    quiz?: QuizPayload,
    removeQuiz?: boolean,
  ) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const EMPTY_QUESTION: EditableQuizQuestion = {
  question_text: "",
  type: "multiple_choice",
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

export function EdukasiForm({
  article,
  quiz,
  onSubmit,
  onCancel,
  loading,
}: EdukasiFormProps) {
  const isEditMode = !!article;

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState(article?.summary ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    article?.thumbnail_url ?? "",
  );
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    article?.thumbnail_url ?? null,
  );
  const [readTime, setReadTime] = useState(
    article?.read_time_minutes?.toString() ?? "",
  );
  const [authorName, setAuthorName] = useState(article?.author_name ?? "");
  const [isFeatured, setIsFeatured] = useState(article?.is_featured ?? false);
  const [publishedAt, setPublishedAt] = useState(
    article?.published_at ? "true" : "false",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasQuiz, setHasQuiz] = useState(!!quiz && !!quiz.questions?.length);
  const [quizTitle, setQuizTitle] = useState(quiz?.title ?? "");
  const [quizDescription, setQuizDescription] = useState(
    quiz?.description ?? "",
  );
  const [questions, setQuestions] = useState<EditableQuizQuestion[]>(
    quiz && quiz.questions && quiz.questions.length > 0
      ? quiz.questions
          .map((q) => ({
            id: q.id,
            question_text: q.question_text,
            type: (q as { type?: string }).type as
              "multiple_choice" | "checkbox" | undefined,
            options: q.quiz_options
              .sort((a, b) => a.order_index - b.order_index)
              .map((opt) => ({
                id: opt.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                order_index: opt.order_index,
              })),
          }))
          .sort((a, b) =>
            a.options[0]?.order_index !== undefined &&
            b.options[0]?.order_index !== undefined
              ? a.options[0].order_index - b.options[0].order_index
              : 0,
          )
      : [structuredClone(EMPTY_QUESTION)],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!slugTouched) {
      setSlug(generateSlug(val));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;

      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }

      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const clearThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) {
      return thumbnailUrl || null;
    }

    try {
      const fd = new FormData();
      fd.append("file", thumbnailFile);
      const result = await uploadArticleThumbnail(fd);
      if (result.success && result.url) {
        return result.url;
      }
      console.error("Thumbnail upload error:", result.error);
      alert(
        result.error ||
          "Gagal mengunggah thumbnail. Pastikan bucket 'educational-assets' ada di Supabase.",
      );
      return thumbnailUrl || null;
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      return thumbnailUrl || null;
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, structuredClone(EMPTY_QUESTION)]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (
    idx: number,
    field: "question_text" | "type",
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const toggleCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const isCheckbox = q.type === "checkbox";
        if (isCheckbox) {
          return {
            ...q,
            options: q.options.map((opt, j) =>
              j === optIdx ? { ...opt, is_correct: !opt.is_correct } : opt,
            ),
          };
        }
        return {
          ...q,
          options: q.options.map((opt, j) => ({
            ...opt,
            is_correct: j === optIdx,
          })),
        };
      }),
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: [...q.options, { option_text: "", is_correct: false }],
            }
          : q,
      ),
    );
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const filtered = q.options.filter((_, j) => j !== optIdx);
        return {
          ...q,
          options:
            filtered.length > 0
              ? filtered
              : [{ option_text: "", is_correct: false }],
        };
      }),
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((opt, j) =>
                j === optIdx ? { ...opt, option_text: value } : opt,
              ),
            }
          : q,
      ),
    );
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return "Judul artikel wajib diisi.";
    if (!slug.trim()) return "Slug tidak boleh kosong.";
    if (!content.trim()) return "Konten artikel wajib diisi.";
    if (!category) return "Kategori harus dipilih.";

    if (hasQuiz) {
      if (!quizTitle.trim()) return "Judul kuis wajib diisi.";
      if (questions.length === 0)
        return "Minimal harus ada 1 pertanyaan pada kuis.";
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) return `Pertanyaan ${i + 1} harus diisi.`;
        const validOptions = q.options.filter((o) => o.option_text.trim());
        if (validOptions.length < 2)
          return `Pertanyaan ${i + 1} harus memiliki minimal 2 pilihan jawaban.`;
        const hasCorrect = q.options.some((o) => o.is_correct);
        if (!hasCorrect)
          return `Pertanyaan ${i + 1} harus memiliki minimal 1 jawaban benar.`;
      }
    }

    return null;
  };

  const buildQuizPayload = (): QuizPayload | undefined => {
    if (!hasQuiz) return undefined;

    return {
      id: quiz?.id,
      title: quizTitle,
      description: quizDescription || undefined,
      questions: questions.map((q, qIdx) => ({
        id: q.id,
        question_text: q.question_text,
        order_index: qIdx,
        type: q.type ?? "multiple_choice",
        options: q.options
          .filter((o) => o.option_text.trim())
          .map((opt, optIdx) => ({
            id: opt.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index ?? optIdx,
          })),
      })),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const thumbnail = await uploadThumbnail();

    const payload: ArticlePayload = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      content,
      category,
      thumbnail_url: thumbnail,
      read_time_minutes: readTime ? parseInt(readTime, 10) : null,
      author_name: authorName.trim() || null,
      is_featured: isFeatured,
      published_at: publishedAt === "true" ? new Date().toISOString() : null,
    };

    const quizPayload = buildQuizPayload();
    const removeQuiz = !hasQuiz && !!quiz;

    await onSubmit(payload, quizPayload, removeQuiz);
  };

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Article Fields */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-zinc-900 mb-4">
          {isEditMode ? "Edit Artikel" : "Artikel Baru"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Judul *
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
              placeholder="Masukkan judul artikel"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
              placeholder="auto-generate dari judul"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Kategori *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
            >
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Durasi Baca (menit)
            </label>
            <input
              type="number"
              min="1"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Penulis
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
              placeholder="Tim Edukasi RecoveryKita"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded accent-[#0f5132]"
              />
              Artikel Unggulan
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={publishedAt === "true"}
                onChange={(e) =>
                  setPublishedAt(e.target.value === "true" ? "true" : "false")
                }
                className="rounded accent-[#0f5132]"
              />
              Terbitkan
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-1">
            Ringkasan
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
            placeholder="Ringkasan singkat artikel (opsional)"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-zinc-700 mb-1">
            Konten *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
            placeholder="Tuliskan konten artikel di sini. Gunakan HTML jika diperlukan (misal: &lt;h2&gt;Judul&lt;/h2&gt;)"
          />
        </div>

        <div className="mt-4 space-y-2 text-sm font-semibold text-zinc-700">
          Thumbnail
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="block w-full text-sm font-normal"
          />
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Atau masukkan URL gambar"
            className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
          />
          {(thumbnailPreview || thumbnailUrl) && (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailPreview || thumbnailUrl || ""}
                alt="Preview thumbnail"
                className="h-full w-full object-cover"
              />
              {thumbnailPreview && thumbnailPreview.startsWith("blob:") && (
                <button
                  type="button"
                  onClick={clearThumbnail}
                  className="absolute right-1 top-1 rounded-full bg-white p-1 text-rose-600 shadow"
                  aria-label="Hapus thumbnail"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Section */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasQuiz}
              onChange={(e) => setHasQuiz(e.target.checked)}
              className="rounded accent-[#0f5132]"
            />
            <span className="text-sm font-semibold text-zinc-700">
              Tambahkan Kuis untuk Artikel ini
            </span>
          </label>
        </div>

        {hasQuiz && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Judul Kuis
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                placeholder="Misal: Tantangan Kuis Plastik"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                Deskripsi Kuis
              </label>
              <textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                placeholder="Deskripsi singkat kuis (opsional)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Pertanyaan
              </label>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-zinc-200 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">
                        Pertanyaan {qIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                          aria-label={`Hapus pertanyaan ${qIdx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question_text}
                      onChange={(e) =>
                        updateQuestion(qIdx, "question_text", e.target.value)
                      }
                      className="w-full h-10 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                      placeholder="Masukkan pertanyaan"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={q.type ?? "multiple_choice"}
                        onChange={(e) =>
                          updateQuestion(qIdx, "type", e.target.value)
                        }
                        className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                      >
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="checkbox">
                          Checkbox (Beberapa Jawaban)
                        </option>
                      </select>
                    </div>

                    <label className="block text-xs font-bold text-zinc-400 mb-1">
                      {(q.type ?? "multiple_choice") === "checkbox"
                        ? "Tandai semua jawaban yang benar"
                        : "Pilih jawaban yang benar"}
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type={q.type === "checkbox" ? "checkbox" : "radio"}
                            name={`correct-${qIdx}`}
                            checked={opt.is_correct}
                            onChange={() => toggleCorrectOption(qIdx, optIdx)}
                            className="accent-[#198754]"
                          />
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) =>
                              updateOption(qIdx, optIdx, e.target.value)
                            }
                            className="flex-1 h-9 rounded-lg border border-zinc-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, optIdx)}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                            aria-label={`Hapus pilihan ${String.fromCharCode(65 + optIdx)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addOption(qIdx)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#198754] hover:text-[#0f5132] transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Tambah Pilihan
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Pertanyaan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-6 text-sm font-bold text-white hover:bg-[#198754] disabled:opacity-50 transition-colors"
        >
          {loading ? "Menyimpan..." : isEditMode ? "Perbarui" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
