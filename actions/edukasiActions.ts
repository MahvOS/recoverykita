"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const ARTICLE_BUCKET = "educational-assets";

async function ensureUniqueSlug(
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  const admin = getSupabaseAdminClient();
  let candidate = baseSlug || "artikel";
  let counter = 1;

  while (counter < 50) {
    const { data } = await admin
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || data.id === excludeId) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

function normalizeString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeArticlePayload(payload: ArticlePayload) {
  return {
    title: normalizeString(payload.title) ?? "",
    slug: normalizeString(payload.slug) ?? "",
    summary: normalizeString(payload.summary) ?? "",
    content: payload.content ?? "",
    category: normalizeString(payload.category) ?? "",
    thumbnail_url: normalizeString(payload.thumbnail_url),
    read_time_minutes:
      typeof payload.read_time_minutes === "number"
        ? payload.read_time_minutes
        : null,
    author_name: normalizeString(payload.author_name),
    is_featured: payload.is_featured ?? false,
    published_at: normalizeString(payload.published_at),
  };
}

export interface ArticlePayload {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  thumbnail_url?: string | null;
  read_time_minutes?: number | null;
  author_name?: string | null;
  is_featured?: boolean;
  published_at?: string | null;
}

export interface QuizOptionPayload {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_index?: number;
}

export interface QuizQuestionPayload {
  id?: string;
  question_text: string;
  order_index: number;
  type?: "multiple_choice" | "checkbox";
  options: QuizOptionPayload[];
}

export interface QuizPayload {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestionPayload[];
}

async function removeQuizForArticle(articleId: string): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: existingQuiz } = await admin
    .from("quizzes")
    .select("id")
    .eq("article_id", articleId)
    .maybeSingle();

  if (!existingQuiz) return;

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", existingQuiz.id);

  const questionIds = (questions ?? []).map((q: { id: string }) => q.id);

  if (questionIds.length > 0) {
    await admin.from("quiz_options").delete().in("question_id", questionIds);
    await admin.from("quiz_questions").delete().in("id", questionIds);
  }

  await admin.from("quizzes").delete().eq("id", existingQuiz.id);
}

async function saveQuiz(articleId: string, quiz: QuizPayload): Promise<void> {
  const admin = getSupabaseAdminClient();

  if (quiz.id) {
    const { data: existingQuestions } = await admin
      .from("quiz_questions")
      .select("id")
      .eq("quiz_id", quiz.id);

    const existingIds = (existingQuestions ?? []).map(
      (q: { id: string }) => q.id,
    );

    if (existingIds.length > 0) {
      await admin.from("quiz_options").delete().in("question_id", existingIds);
      await admin.from("quiz_questions").delete().in("id", existingIds);
    }

    await admin.from("quizzes").delete().eq("id", quiz.id);
  }

  const { data: insertedQuiz, error: quizError } = await admin
    .from("quizzes")
    .insert({
      article_id: articleId,
      title: quiz.title,
      description: quiz.description ?? null,
    })
    .select("id")
    .single();

  if (quizError || !insertedQuiz) {
    throw quizError ?? new Error("Gagal membuat quiz.");
  }

  const quizId = (insertedQuiz as { id: string }).id;

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];

    const { data: qData, error: qError } = await admin
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_text: q.question_text,
        order_index: i,
        type: q.type ?? "multiple_choice",
      })
      .select("id")
      .single();

    if (qError) throw qError;

    const questionId = (qData as { id: string }).id;

    const optionsToInsert = q.options.map((opt, idx) => ({
      question_id: questionId,
      option_text: opt.option_text,
      is_correct: opt.is_correct,
      order_index: opt.order_index ?? idx,
    }));

    if (optionsToInsert.length > 0) {
      const { error: optError } = await admin
        .from("quiz_options")
        .insert(optionsToInsert);

      if (optError) throw optError;
    }
  }
}

export async function updateArticle(
  id: string,
  payload: ArticlePayload,
  quiz?: QuizPayload,
  removeQuiz = false,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return { success: false, error: guard.message };
    }
    const admin = getSupabaseAdminClient();

    const normalized = normalizeArticlePayload(payload);
    const uniqueSlug = await ensureUniqueSlug(normalized.slug, id);

    const { data: updated, error: dbError } = await admin
      .from("articles")
      .update({
        title: normalized.title,
        slug: uniqueSlug,
        summary: normalized.summary,
        content: normalized.content,
        category: normalized.category,
        thumbnail_url: normalized.thumbnail_url,
        read_time_minutes: normalized.read_time_minutes,
        author_name: normalized.author_name,
        is_featured: normalized.is_featured,
        published_at: normalized.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (dbError) {
      console.error("updateArticle error:", dbError);
      return { success: false, error: dbError.message };
    }

    if (!updated) {
      return {
        success: false,
        error: "Artikel tidak ditemukan di database.",
      };
    }

    if (removeQuiz) {
      await removeQuizForArticle(id);
    } else if (quiz && quiz.questions.length > 0) {
      await saveQuiz(id, quiz);
    }

    revalidatePath("/edukasi");
    revalidatePath(`/edukasi/${uniqueSlug}`);
    revalidatePath("/admin/edukasi");
    revalidatePath(`/admin/edukasi/${id}/edit`);

    return { success: true, data: updated };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Gagal memperbarui artikel.";
    console.error("updateArticle exception:", err);
    return { success: false, error: msg };
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      console.warn("[deleteArticle] Blocked:", guard.message);
      return false;
    }
    const admin = getSupabaseAdminClient();
    await removeQuizForArticle(id);
    const { error } = await admin.from("articles").delete().eq("id", id);
    if (error) {
      console.error("deleteArticle error:", error);
      return false;
    }
    revalidatePath("/edukasi");
    revalidatePath("/admin/edukasi");
    return true;
  } catch (err) {
    console.error("deleteArticle exception:", err);
    return false;
  }
}

export async function createArticle(
  payload: ArticlePayload,
  quiz?: QuizPayload,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return { success: false, error: guard.message };
    }
    const admin = getSupabaseAdminClient();

    const normalized = normalizeArticlePayload(payload);
    const uniqueSlug = await ensureUniqueSlug(normalized.slug);

    const { data: created, error: dbError } = await admin
      .from("articles")
      .insert({
        title: normalized.title,
        slug: uniqueSlug,
        summary: normalized.summary,
        content: normalized.content,
        category: normalized.category,
        thumbnail_url: normalized.thumbnail_url,
        read_time_minutes: normalized.read_time_minutes,
        author_name: normalized.author_name,
        is_featured: normalized.is_featured,
        published_at: normalized.published_at,
      })
      .select("*")
      .single();

    if (dbError || !created) {
      return {
        success: false,
        error: dbError?.message ?? "Gagal membuat artikel.",
      };
    }

    const createdId = (created as { id: string }).id;

    if (quiz && quiz.questions.length > 0) {
      await saveQuiz(createdId, quiz);
    }

    revalidatePath("/edukasi");
    revalidatePath("/admin/edukasi");

    return { success: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat artikel.";
    console.error("createArticle exception:", err);
    return { success: false, error: msg };
  }
}

export async function uploadArticleThumbnail(
  formData: FormData,
): Promise<{ success: boolean; url?: string | null; error?: string }> {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) {
      return { success: false, error: guard.message };
    }
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "File tidak ditemukan." };
    }

    const admin = getSupabaseAdminClient();
    const fileExt = (file.name.split(".").pop() || "bin").toLowerCase();
    const fileName = `articles/thumb-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from(ARTICLE_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("uploadArticleThumbnail error:", uploadError);
      return {
        success: false,
        error: `Upload gagal: ${uploadError.message}. Pastikan bucket "${ARTICLE_BUCKET}" ada di Supabase.`,
      };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(ARTICLE_BUCKET).getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Gagal mengunggah thumbnail.";
    console.error("uploadArticleThumbnail exception:", err);
    return { success: false, error: msg };
  }
}
