import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const admin = getSupabaseAdminClient();

    const { data: article, error: articleError } = await admin
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (articleError) {
      return NextResponse.json(
        { error: articleError.message },
        { status: 500 },
      );
    }

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: quizHeader } = await admin
      .from("quizzes")
      .select("*")
      .eq("article_id", id)
      .maybeSingle();

    let quiz: Record<string, unknown> | null = quizHeader;
    let questions: Array<Record<string, unknown>> = [];

    if (quizHeader) {
      const { data: questionsData } = await admin
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizHeader.id)
        .order("order_index", { ascending: true });

      const questionIds = (questionsData ?? []).map(
        (q: { id: string }) => q.id,
      );

      let options: Array<Record<string, unknown>> = [];
      if (questionIds.length > 0) {
        const { data: optionsData } = await admin
          .from("quiz_options")
          .select("*")
          .in("question_id", questionIds)
          .order("order_index", { ascending: true });
        options = optionsData ?? [];
      }

      questions = (questionsData ?? []).map((q: Record<string, unknown>) => ({
        ...q,
        quiz_options: options.filter((opt) => opt.question_id === q.id),
      }));

      quiz = {
        ...quizHeader,
        questions,
      };
    }

    return NextResponse.json({ article, quiz });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
