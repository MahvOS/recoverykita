"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, getSupabaseClient, Article } from "@/lib/supabase";

export interface EdukasiArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  thumbnail_url: string;
  read_time_minutes: number | null;
  author_name: string | null;
  is_featured: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  has_quiz: boolean;
}

export interface EdukasiQuizOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface EdukasiQuizQuestion {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  quiz_options: EdukasiQuizOption[];
}

export interface EdukasiQuiz {
  id: string;
  title: string;
  description: string | null;
  questions: EdukasiQuizQuestion[];
}

export interface ArticleWithQuiz {
  article: Article;
  quiz: EdukasiQuiz | null;
}

export interface QuizOptionPayload {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizQuestionPayload {
  id?: string;
  question_text: string;
  explanation?: string;
  order_index: number;
  options: QuizOptionPayload[];
}

export interface QuizPayload {
  id?: string;
  title: string;
  description?: string;
  questions: QuizQuestionPayload[];
}

export interface ArticlePayload {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  thumbnail_url: string | null;
  read_time_minutes: number | null;
  author_name: string | null;
  is_featured: boolean;
  published_at: string | null;
}

export interface UseEdukasiDataReturn {
  articles: EdukasiArticle[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  refetch: () => void;
  fetchArticleWithQuiz: (id: string) => Promise<ArticleWithQuiz | null>;
  createArticle: (
    payload: ArticlePayload,
    quiz?: QuizPayload,
  ) => Promise<EdukasiArticle | null>;
  updateArticle: (
    id: string,
    payload: ArticlePayload,
    quiz?: QuizPayload,
    removeQuiz?: boolean,
  ) => Promise<EdukasiArticle | null>;
  deleteArticle: (id: string) => Promise<boolean>;
}

export function useEdukasiData(): UseEdukasiDataReturn {
  const [articles, setArticles] = useState<EdukasiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseClient();

      const articlesRes = await client
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (articlesRes.error) throw articlesRes.error;

      const quizzesRes = await client.from("quizzes").select("article_id");

      const articleIdsWithQuiz = new Set(
        (quizzesRes.data || []).map(
          (q: { article_id: string }) => q.article_id,
        ),
      );

      const data = (articlesRes.data || []).map((a: any) => ({
        ...a,
        has_quiz: articleIdsWithQuiz.has(a.id),
      })) as EdukasiArticle[];

      setArticles(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengambil data.";
      console.error("Error fetching edukasi data:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const createArticle = useCallback(
    async (
      payload: ArticlePayload,
      quiz?: QuizPayload,
    ): Promise<EdukasiArticle | null> => {
      if (!supabase) {
        setError("Client Supabase tidak tersedia.");
        return null;
      }

      setSaving(true);
      setError(null);
      const client = getSupabaseClient();

      try {
        const { data, error: dbError } = await (client as any)
          .from("articles")
          .insert({
            title: payload.title,
            slug: payload.slug,
            summary: payload.summary,
            content: payload.content,
            category: payload.category,
            thumbnail_url: payload.thumbnail_url,
            read_time_minutes: payload.read_time_minutes,
            author_name: payload.author_name,
            is_featured: payload.is_featured,
            published_at: payload.published_at,
          })
          .select("*")
          .single();

        if (dbError) throw dbError;

        const article = data as any;

        if (quiz && quiz.questions.length > 0) {
          await saveQuiz(client, article.id, quiz);
        }

        setArticles((prev) => [
          { ...article, has_quiz: !!quiz && quiz.questions.length > 0 },
          ...prev,
        ]);

        return { ...article, has_quiz: !!quiz && quiz.questions.length > 0 };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal menyimpan artikel.";
        console.error("Error creating article:", err);
        setError(msg);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateArticle = useCallback(
    async (
      id: string,
      payload: ArticlePayload,
      quiz?: QuizPayload,
      removeQuiz = false,
    ): Promise<EdukasiArticle | null> => {
      if (!supabase) {
        setError("Client Supabase tidak tersedia.");
        return null;
      }

      setSaving(true);
      setError(null);
      const client = getSupabaseClient();

      try {
        const { data, error: dbError } = await (client as any)
          .from("articles")
          .update({
            title: payload.title,
            slug: payload.slug,
            summary: payload.summary,
            content: payload.content,
            category: payload.category,
            thumbnail_url: payload.thumbnail_url,
            read_time_minutes: payload.read_time_minutes,
            author_name: payload.author_name,
            is_featured: payload.is_featured,
            published_at: payload.published_at,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*")
          .single();

        if (dbError) throw dbError;

        const updated = data as any;

        if (removeQuiz) {
          await removeQuizForArticle(client, id);
        } else if (quiz && quiz.questions.length > 0) {
          const { data: existingQuiz } = await (client as any)
            .from("quizzes")
            .select("id")
            .eq("article_id", id)
            .maybeSingle();

          if (existingQuiz) {
            await saveQuiz(client, id, { ...quiz, id: existingQuiz.id });
          } else {
            await saveQuiz(client, id, quiz);
          }
        }

        const hasQuiz = !removeQuiz && !!quiz && quiz.questions.length > 0;
        setArticles((prev) =>
          prev.map((a) =>
            a.id === id ? { ...updated, has_quiz: hasQuiz } : a,
          ),
        );

        return { ...updated, has_quiz: hasQuiz };
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal memperbarui artikel.";
        console.error("Error updating article:", err);
        setError(msg);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const fetchArticleWithQuiz = useCallback(
    async (id: string): Promise<ArticleWithQuiz | null> => {
      if (!supabase) return null;

      try {
        const client = getSupabaseClient();

        const { data: articleData, error: articleError } = await client
          .from("articles")
          .select("*")
          .eq("id", id)
          .single();

        if (articleError || !articleData) return null;

        const article = articleData as Article;

        const { data: quizHeader, error: quizError } = await client
          .from("quizzes")
          .select("*")
          .eq("article_id", article.id)
          .maybeSingle();

        if (quizError) {
          console.error("Quiz fetch error:", quizError);
        }

        let quiz: EdukasiQuiz | null = null;

        if (quizHeader) {
          const header = quizHeader as {
            id: string;
            title: string | null;
            description: string | null;
          };

          const { data: questionsData, error: qError } = await client
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", header.id)
            .order("order_index", { ascending: true });

          if (!qError && questionsData) {
            const questions: EdukasiQuizQuestion[] = [];

            for (const q of questionsData as Array<{
              id: string;
              question_text: string;
              explanation: string | null;
              order_index: number;
            }>) {
              const { data: optionsData } = await client
                .from("quiz_options")
                .select("*")
                .eq("question_id", q.id)
                .order("order_index", { ascending: true });

              questions.push({
                id: q.id,
                question_text: q.question_text,
                explanation: q.explanation ?? null,
                order_index: q.order_index,
                quiz_options: (optionsData || []).map(
                  (opt: {
                    id: string;
                    option_text: string;
                    is_correct: boolean;
                    order_index: number;
                  }) => ({
                    id: opt.id,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct === true,
                    order_index: opt.order_index,
                  }),
                ),
              });
            }

            quiz = {
              id: header.id,
              title: header.title ?? "",
              description: header.description ?? null,
              questions,
            };
          }
        }

        return { article, quiz };
      } catch (err: unknown) {
        console.error("Error fetching article with quiz:", err);
        return null;
      }
    },
    [],
  );

  const deleteArticle = useCallback(async (id: string): Promise<boolean> => {
    if (!supabase) {
      setError("Client Supabase tidak tersedia.");
      return false;
    }

    try {
      const client = getSupabaseClient();

      await removeQuizForArticle(client, id);

      const { error: dbError } = await (client as any)
        .from("articles")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      setArticles((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal menghapus artikel.";
      console.error("Error deleting article:", err);
      setError(msg);
      return false;
    }
  }, []);

  return {
    articles,
    loading,
    saving,
    error,
    refetch: fetchData,
    fetchArticleWithQuiz,
    createArticle,
    updateArticle,
    deleteArticle,
  };
}

async function saveQuiz(
  client: ReturnType<typeof getSupabaseClient>,
  articleId: string,
  quiz: QuizPayload,
): Promise<void> {
  const quizPayload: Record<string, unknown> = {
    article_id: articleId,
    title: quiz.title,
    description: quiz.description ?? null,
  };

  if (quiz.id) {
    quizPayload.id = quiz.id;
  }

  const { data: quizData, error: quizError } = await (client as any)
    .from("quizzes")
    .upsert(quizPayload)
    .select("id")
    .single();

  if (quizError) throw quizError;

  const quizId = (quizData as { id: string }).id;

  const { data: existingQuestions } = await (client as any)
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (existingQuestions && existingQuestions.length > 0) {
    const questionIds = existingQuestions.map((q: { id: string }) => q.id);
    await (client as any)
      .from("quiz_options")
      .delete()
      .in("question_id", questionIds);

    await (client as any).from("quiz_questions").delete().eq("quiz_id", quizId);
  }

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const { data: qData, error: qError } = await (client as any)
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_text: q.question_text,
        explanation: q.explanation ?? null,
        order_index: i,
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

    const { error: optError } = await (client as any)
      .from("quiz_options")
      .insert(optionsToInsert);

    if (optError) throw optError;
  }
}

async function removeQuizForArticle(
  client: ReturnType<typeof getSupabaseClient>,
  articleId: string,
): Promise<void> {
  const { data: quizData } = await (client as any)
    .from("quizzes")
    .select("id")
    .eq("article_id", articleId)
    .maybeSingle();

  if (!quizData) return;

  const quizId = (quizData as { id: string }).id;

  const { data: questionsData } = await (client as any)
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", quizId);

  if (questionsData && questionsData.length > 0) {
    const questionIds = questionsData.map((q: { id: string }) => q.id);
    await (client as any)
      .from("quiz_options")
      .delete()
      .in("question_id", questionIds);
  }

  await (client as any).from("quiz_questions").delete().eq("quiz_id", quizId);

  await (client as any).from("quizzes").delete().eq("id", quizId);
}
