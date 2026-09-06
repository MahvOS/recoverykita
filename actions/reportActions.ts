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

const LOCATION_CATEGORIES = [
  "trash_dump",
  "waste_bank",
  "community_action",
] as const;

type ReportPhotoRow = {
  photo_url?: unknown;
  photo_urls?: unknown;
};

function getReportPhotoPaths(row: ReportPhotoRow): string[] {
  const urls = [
    ...(typeof row.photo_url === "string" ? [row.photo_url] : []),
    ...(Array.isArray(row.photo_urls)
      ? row.photo_urls.filter(
          (value): value is string => typeof value === "string",
        )
      : []),
  ];

  return Array.from(
    new Set(
      urls
        .map((url) => {
          const marker = "/storage/v1/object/public/report-photos/";
          const index = url.indexOf(marker);
          return index >= 0
            ? decodeURIComponent(url.slice(index + marker.length))
            : null;
        })
        .filter((path): path is string => Boolean(path)),
    ),
  );
}

export async function removeReportPhotos(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  rows: ReportPhotoRow[],
): Promise<void> {
  const paths = Array.from(new Set(rows.flatMap(getReportPhotoPaths)));
  if (paths.length === 0) return;

  const { error } = await admin.storage.from("report-photos").remove(paths);
  if (error) {
    console.error("Gagal menghapus foto laporan dari Storage:", error);
  }
}

export async function createAdminReport(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, error: guard.message };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const addressNotes = String(formData.get("address_notes") ?? "").trim();
  const reporterName = String(formData.get("reporter_name") ?? "").trim();
  const reporterPhone = String(formData.get("reporter_phone") ?? "").trim();
  const priority = String(formData.get("priority") ?? "sedang");
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const wasteTypes = formData.getAll("waste_type").map(String).filter(Boolean);

  if (!title || !description) {
    return { success: false, error: "Judul dan deskripsi wajib diisi." };
  }
  if (
    !LOCATION_CATEGORIES.includes(
      category as (typeof LOCATION_CATEGORIES)[number],
    )
  ) {
    return { success: false, error: "Kategori laporan tidak valid." };
  }
  if (!["rendah", "sedang", "tinggi"].includes(priority)) {
    return { success: false, error: "Prioritas laporan tidak valid." };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return {
      success: false,
      error: "Latitude harus berada antara -90 dan 90.",
    };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return {
      success: false,
      error: "Longitude harus berada antara -180 dan 180.",
    };
  }

  const admin = getSupabaseAdminClient();
  const uploadedPaths: string[] = [];
  const photoUrls: string[] = [];

  try {
    const files = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0)
      .slice(0, 3);

    for (const file of files) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: "Foto harus berupa gambar maksimal 5MB.",
        };
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `admin/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from("report-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      photoUrls.push(
        admin.storage.from("report-photos").getPublicUrl(path).data.publicUrl,
      );
    }

    const { error: insertError } = await admin.from("locations").insert({
      title,
      description,
      category,
      latitude,
      longitude,
      address_notes: addressNotes || null,
      photo_url: photoUrls[0] ?? null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      status: "pending",
      reporter_name: reporterName || "Admin",
      reporter_phone: reporterPhone || null,
      priority,
      waste_type: wasteTypes,
    });

    if (insertError) throw insertError;

    revalidatePath("/admin");
    revalidatePath("/peta");
    return { success: true };
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await admin.storage.from("report-photos").remove(uploadedPaths);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat laporan.",
    };
  }
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
      const { data: reportToDelete } = await admin
        .from("locations")
        .select("photo_url, photo_urls")
        .eq("id", id)
        .maybeSingle();

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

      if (reportToDelete) {
        await removeReportPhotos(admin, [reportToDelete]);
      }

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
