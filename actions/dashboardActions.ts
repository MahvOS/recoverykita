"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import type {
  Location,
  MapLocation,
  MetricStats,
  RecentReport,
} from "@/types/admin";
import { requireAdmin } from "@/lib/auth";

const STATUS_ALIAS_MAP: Record<string, string> = {
  Pending: "pending",
  "In Progress": "in_progress",
  Cleaned: "completed",
  Rejected: "rejected",
  Menunggu: "pending",
  Proses: "in_progress",
  Selesai: "completed",
  Tertunda: "pending",
  Diproses: "in_progress",
};

const normalizeStatus = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "pending";

  const lower = raw.toLowerCase();
  const direct =
    lower === "pending"
      ? "pending"
      : lower === "in_progress"
        ? "in_progress"
        : lower === "cleaned" || lower === "completed"
          ? "completed"
          : lower === "rejected"
            ? "rejected"
            : null;
  if (direct) return direct;

  return STATUS_ALIAS_MAP[raw] || "pending";
};

const locationSelect =
  "id, title, description, category, waste_type, priority, status, " +
  "latitude, longitude, photo_urls, reporter_name, reporter_phone, " +
  "address_notes, created_at";

export async function fetchDashboardData(): Promise<{
  stats: MetricStats;
  reports: RecentReport[];
  mapLocations: MapLocation[];
  dbStatus: string;
}> {
  await requireAdmin();
  const admin = getSupabaseAdminClient();

  try {
    const { data: locData, error: locError } = await admin
      .from("locations")
      .select(locationSelect);

    if (locError) {
      console.error("fetchDashboardData error:", locError);
      return {
        stats: { inProgressCount: 0, pendingCount: 0, reportsSolved: 0 },
        reports: [],
        mapLocations: [],
        dbStatus: "Gagal Query",
      };
    }

    const locations = (locData as unknown as Location[]) || [];

    const cleanedLocations = locations.filter((loc) => {
      const normalized = normalizeStatus(loc.status);
      return normalized === "completed";
    });

    const inProgressCount = locations.filter((loc) => {
      const normalized = normalizeStatus(loc.status);
      return normalized === "in_progress";
    }).length;

    const pendingCount = locations.filter((loc) => {
      const normalized = normalizeStatus(loc.status);
      return normalized === "pending";
    }).length;

    const reportsSolved = cleanedLocations.length;

    const sortedLocations = [...locations].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const recentReports: RecentReport[] = sortedLocations.map((loc) => {
      const normalized = normalizeStatus(loc.status);

      let status: "Menunggu" | "Selesai" | "Proses" = "Menunggu";
      if (normalized === "completed") {
        status = "Selesai";
      } else if (normalized === "in_progress") {
        status = "Proses";
      }

      const shortId = `REP-${loc.id.slice(0, 8)}`;
      const locationName =
        loc.address_notes || loc.title?.split(",")[0] || "Lokasi";

      return {
        id: shortId,
        location: locationName,
        wasteType: loc.waste_type || "Umum",
        status,
      };
    });

    const mappedLocations: MapLocation[] = locations.map((loc) => ({
      id: loc.id,
      title: loc.title || "Lokasi Sampah",
      category: loc.category || "trash_dump",
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      status: loc.status || "Menunggu",
      photo_url: loc.photo_url ?? null,
    }));

    return {
      stats: {
        inProgressCount,
        pendingCount,
        reportsSolved,
      },
      reports: recentReports,
      mapLocations: mappedLocations,
      dbStatus: "Aktif",
    };
  } catch (err) {
    console.error("fetchDashboardData exception:", err);
    return {
      stats: { inProgressCount: 0, pendingCount: 0, reportsSolved: 0 },
      reports: [],
      mapLocations: [],
      dbStatus: "Offline",
    };
  }
}
