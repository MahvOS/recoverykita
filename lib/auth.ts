import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type AdminGuardResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      reason: "unauthenticated" | "forbidden" | "config_error";
      message: string;
    };

export async function requireAuthenticatedUser(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, message: "Supabase env belum dikonfigurasi." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {}
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user
    ? { ok: true, userId: user.id }
    : { ok: false, message: "Anda harus login untuk melakukan aksi ini." };
}

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      reason: "config_error",
      message: "Supabase env belum dikonfigurasi.",
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {}
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "Anda harus login untuk melakukan aksi ini.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    return {
      ok: false,
      reason: "forbidden",
      message: `Gagal membaca profil: ${error.message}`,
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false,
      reason: "forbidden",
      message: "Hanya admin yang dapat melakukan aksi ini.",
    };
  }

  return { ok: true, userId: user.id };
}

export async function requireAdminClient() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    throw new Error(guard.message);
  }
  return getSupabaseAdminClient();
}
