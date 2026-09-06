"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { MapReport, ReportStatus, Priority } from "@/types/admin";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

const LOCATION_STATUS_MAP: Record<ReportStatus, string> = {
  pending: "pending",
  in_progress: "in_progress",
  completed: "cleaned",
  rejected: "rejected",
};

const SELECT_COLUMNS =
  "id, title, description, category, waste_type, priority, status, " +
  "latitude, longitude, photo_urls, photo_url, reporter_name, reporter_phone, " +
  "address_notes, created_at, updated_at";

function normalizeStatus(value: unknown): ReportStatus {
  const str = String(value ?? "")
    .toLowerCase()
    .trim();
  if (str === "cleaned") return "completed";
  if (
    str === "pending" ||
    str === "in_progress" ||
    str === "completed" ||
    str === "rejected"
  ) {
    return str as ReportStatus;
  }
  return "pending";
}

interface FetchReportsFilters {
  category?: string;
  priority?: string;
  date?: string;
}

export async function fetchMapReports(
  filters: FetchReportsFilters = {},
): Promise<MapReport[]> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    console.warn("[fetchMapReports] Blocked:", guard.message);
    return [];
  }
  const admin = getSupabaseAdminClient();

  let query = admin
    .from("locations")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchMapReports error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const mapped: MapReport[] = rows.map((row) => {
    const pUrls = Array.isArray(row.photo_urls)
      ? (row.photo_urls.filter(
          (v): v is string => typeof v === "string",
        ) as string[])
      : typeof row.photo_url === "string" && row.photo_url.trim()
        ? [row.photo_url.trim()]
        : null;

    const primaryPhoto =
      typeof row.photo_url === "string" && row.photo_url.trim()
        ? row.photo_url.trim()
        : pUrls && pUrls.length > 0
          ? pUrls[0]
          : null;

    return {
      id: String(row.id),
      location_name:
        typeof row.address_notes === "string" && row.address_notes.trim()
          ? row.address_notes.trim()
          : typeof row.title === "string" && row.title.trim()
            ? row.title.trim()
            : null,
      description: typeof row.description === "string" ? row.description : null,
      category: typeof row.category === "string" ? row.category : null,
      latitude: row.latitude == null ? null : Number(row.latitude),
      longitude: row.longitude == null ? null : Number(row.longitude),
      status: normalizeStatus(row.status),
      priority:
        row.priority === "rendah" ||
        row.priority === "sedang" ||
        row.priority === "tinggi"
          ? (row.priority as Priority)
          : null,
      photo_url: primaryPhoto,
      photo_urls: pUrls,
      reporter_name:
        typeof row.reporter_name === "string" ? row.reporter_name : null,
      reporter_phone:
        typeof row.reporter_phone === "string" ? row.reporter_phone : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
      waste_type:
        typeof row.waste_type === "string"
          ? row.waste_type
          : Array.isArray(row.waste_type)
            ? (row.waste_type.filter(
                (v): v is string => typeof v === "string",
              ) as string[])
            : null,
    };
  });

  return mapped;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
): Promise<{ success: boolean; error?: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();
  const userId = guard.userId;

  try {
    const { data: currentRow } = await admin
      .from("locations")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    const currentStatus = normalizeStatus(
      (currentRow as Record<string, unknown> | null)?.status,
    );

    if (status === "rejected") {
      await admin.from("report_logs").insert({
        location_id: id,
        previous_status: currentStatus,
        new_status: "rejected",
        notes: "Laporan ditolak dan dihapus oleh admin.",
        updated_by: userId,
        created_at: new Date().toISOString(),
      });

      const { error: deleteError } = await admin
        .from("locations")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      revalidatePath("/admin");
      revalidatePath("/peta");
      return { success: true };
    }

    const targetStatus = LOCATION_STATUS_MAP[status] ?? status;
    const { error: updateError } = await admin
      .from("locations")
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    await admin.from("report_logs").insert({
      location_id: id,
      previous_status: currentStatus,
      new_status: status,
      notes: `Status diubah dari ${currentStatus} ke ${status} oleh admin.`,
      updated_by: userId,
      created_at: new Date().toISOString(),
    });

    revalidatePath("/admin");
    revalidatePath("/peta");
    return { success: true };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal memperbarui status laporan.";
    console.error("updateReportStatus error:", err);
    return { success: false, error: msg };
  }
}

export async function deleteReportServer(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return updateReportStatus(id, "rejected");
}
