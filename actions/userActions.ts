"use server";

import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase";
import type { AdminUser, UserReport } from "@/types/admin";
import { revalidatePath } from "next/cache";

export async function getAdminUsers(): Promise<AdminUser[]> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin.rpc("get_admin_users");

  if (error) {
    console.error("Gagal mengambil daftar pengguna:", error);
    return [];
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    email: typeof row.email === "string" ? row.email : null,
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    phone_number:
      typeof row.phone_number === "string" ? row.phone_number : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    role: typeof row.role === "string" ? row.role : null,
    is_banned: row.is_banned === true,
    banned_at: typeof row.banned_at === "string" ? row.banned_at : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
  }));
}

export async function getUserReports(userId: string): Promise<UserReport[]> {
  const client = getSupabaseClient();

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name, phone_number")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Gagal mengambil profil pengguna:", profileError);
    return [];
  }

  const filters: string[] = [];
  if (profile.full_name) {
    filters.push(`reporter_name.eq.${profile.full_name}`);
  }
  if (profile.phone_number) {
    filters.push(`reporter_phone.eq.${profile.phone_number}`);
  }

  if (filters.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("locations")
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil riwayat laporan pengguna:", error);
    return [];
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    location_id: String(row.id ?? ""),
    category: typeof row.category === "string" ? row.category : null,
    location_name: typeof row.title === "string" ? row.title : null,
    description: typeof row.description === "string" ? row.description : null,
    status: typeof row.status === "string" ? row.status : null,
    priority:
      row.priority === "rendah" ||
      row.priority === "sedang" ||
      row.priority === "tinggi"
        ? (row.priority as UserReport["priority"])
        : null,
    reporter_name:
      typeof row.reporter_name === "string" ? row.reporter_name : null,
    reporter_phone:
      typeof row.reporter_phone === "string" ? row.reporter_phone : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    user_id: userId,
    location: {
      id: String(row.id ?? ""),
      title: typeof row.title === "string" ? row.title : null,
      category: typeof row.category === "string" ? row.category : null,
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      status: typeof row.status === "string" ? row.status : null,
      photo_url: typeof row.photo_url === "string" ? row.photo_url : null,
    },
  }));
}

export async function getUserReportCount(userId: string): Promise<number> {
  const client = getSupabaseClient();

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name, phone_number")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Gagal mengambil profil pengguna:", profileError);
    return 0;
  }

  const filters: string[] = [];
  if (profile.full_name) {
    filters.push(`reporter_name.eq.${profile.full_name}`);
  }
  if (profile.phone_number) {
    filters.push(`reporter_phone.eq.${profile.phone_number}`);
  }

  if (filters.length === 0) {
    return 0;
  }

  const { count, error } = await client
    .from("locations")
    .select("*", { count: "exact", head: true })
    .or(filters.join(","));

  if (error) {
    console.error("Gagal mengambil jumlah laporan pengguna:", error);
    return 0;
  }

  return count ?? 0;
}

export async function toggleBanUser(userId: string, currentStatus: boolean) {
  const admin = getSupabaseAdminClient();
  const publicClient = getSupabaseClient();

  if (!currentStatus) {
    // Ban mode: delete all reports + delete profile + delete auth user
    // 1. Hapus semua laporan di locations yang terkait dengan user ini
    const orFilters = [
      `reporter_id.eq.${userId}`,
      `user_id.eq.${userId}`,
      `created_by.eq.${userId}`,
    ];

    const { data: deletedReports, error: deleteReportsError } = await admin
      .from("locations")
      .delete()
      .or(orFilters.join(","))
      .select("id");

    if (deleteReportsError) {
      console.error(
        "Gagal menghapus laporan pengguna (filter user_id):",
        deleteReportsError,
      );
    }

    // 2. Fallback: hapus berdasarkan reporter_name & reporter_phone dari profile
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("id", userId)
      .maybeSingle();

    if (!profileError && profile) {
      const fallbackFilters: string[] = [];
      if (profile.full_name) {
        fallbackFilters.push(`reporter_name.eq.${profile.full_name}`);
      }
      if (profile.phone_number) {
        fallbackFilters.push(`reporter_phone.eq.${profile.phone_number}`);
      }

      if (fallbackFilters.length > 0) {
        const { data: deletedByName, error: deleteByNameError } = await admin
          .from("locations")
          .delete()
          .or(fallbackFilters.join(","))
          .select("id");

        if (deleteByNameError) {
          console.error(
            "Gagal menghapus laporan pengguna (fallback by name/phone):",
            deleteByNameError,
          );
        }

        if (Array.isArray(deletedByName)) {
          deletedReports?.push(...deletedByName);
        }
      }
    }

    const totalDeletedReports = Array.isArray(deletedReports)
      ? deletedReports.length
      : 0;

    // 3. Hapus dari auth.users (otomatis trigger hapus profiles via DB trigger)
    try {
      const { error: deleteAuthError } =
        await admin.auth.admin.deleteUser(userId);
      if (deleteAuthError) {
        console.error("Gagal menghapus user dari auth.users:", deleteAuthError);
      } else {
        console.log(
          `[Ban] User ${userId} dihapus dari auth.users via service role.`,
        );
      }
    } catch (adminErr) {
      console.error("Gagal menghapus user dari auth.users:", adminErr);
    }

    // 4. Pastikan profiles row juga terhapus (idempotent)
    const { error: deleteProfileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (deleteProfileError && deleteProfileError.code !== "PGRST116") {
      console.error("Gagal menghapus profil:", deleteProfileError);
    }

    revalidatePath("/admin");
    return { success: true, deletedReports: totalDeletedReports };
  }

  // Unban mode: just restore profile
  const { error } = await publicClient
    .from("profiles")
    .update({
      is_banned: !currentStatus,
      banned_at: !currentStatus ? new Date().toISOString() : null,
    })
    .eq("id", userId);

  if (error) {
    console.error("Gagal memperbarui status ban pengguna:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
