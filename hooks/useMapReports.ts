"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type { MapReport, Priority, ReportStatus } from "@/types/admin";

const VALID_STATUS = new Set<ReportStatus>([
  "pending",
  "in_progress",
  "completed",
  "rejected",
]);

// PERBAIKAN: Mapping disesuaikan persis dengan value Enum report_status di PostgreSQL
const LOCATION_STATUS_MAP: Record<ReportStatus, string> = {
  pending: "pending",
  in_progress: "in_progress",
  completed: "cleaned",
  rejected: "rejected",
};

type Filters = {
  category: string;
  priority: "all" | Priority;
  date: string;
};

const EMPTY_FILTERS: Filters = { category: "all", priority: "all", date: "" };

export function useMapReports() {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [userId, setUserId] = useState<string | null>(null);

  const normalizeStatus = (value: unknown): ReportStatus => {
    const str = String(value ?? "")
      .toLowerCase()
      .trim();
    if (str === "cleaned") return "completed";
    if (VALID_STATUS.has(str as ReportStatus)) return str as ReportStatus;
    return "pending";
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!hasSupabaseConfig) {
      setAuthenticated(false);
      setError("Supabase belum dikonfigurasi.");
      setLoading(false);
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data: userData, error: authError } = await client.auth.getUser();

      if (authError || !userData.user) {
        setAuthenticated(false);
        setUserId(null);
        setReports([]);
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setUserId(userData.user.id);

      let query = client
        .from("locations")
        .select(
          `
          id, title, description, category, waste_type, priority, status, 
          latitude, longitude, photo_urls, reporter_name, reporter_phone, 
          address_notes, created_at, updated_at
        `,
        )
        .order("created_at", { ascending: false });

      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.priority !== "all") {
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

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      const mapped: MapReport[] = rows.map((row) => ({
        id: String(row.id),
        location_name:
          typeof row.address_notes === "string"
            ? row.address_notes
            : typeof row.title === "string"
              ? row.title
              : null,
        description:
          typeof row.description === "string" ? row.description : null,
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
        photo_url: null,
        photo_urls: Array.isArray(row.photo_urls)
          ? (row.photo_urls.filter(
              (v): v is string => typeof v === "string",
            ) as string[])
          : null,
        waste_type:
          typeof row.waste_type === "string"
            ? row.waste_type
            : Array.isArray(row.waste_type)
              ? (row.waste_type.filter(
                  (v): v is string => typeof v === "string",
                ) as string[])
              : null,
        reporter_name:
          typeof row.reporter_name === "string" ? row.reporter_name : null,
        reporter_phone:
          typeof row.reporter_phone === "string" ? row.reporter_phone : null,
        created_at: typeof row.created_at === "string" ? row.created_at : null,
        updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
      }));

      setReports(mapped);
    } catch (caught) {
      setReports([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Gagal memuat laporan dari Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateStatus = useCallback(
    async (id: string, status: ReportStatus) => {
      setUpdatingId(id);
      setError(null);

      const currentReport = reports.find((r) => r.id === id);
      const previousStatus = currentReport?.status ?? status;

      try {
        const client = getSupabaseClient() as unknown as {
          from: (table: string) => {
            update: (values: Record<string, unknown>) => {
              eq: (
                column: string,
                value: string,
              ) => Promise<{
                error: Error | null;
              }>;
            };
            insert: (
              values: Record<string, unknown>,
            ) => Promise<{ error: Error | null }>;
            delete: () => {
              eq: (
                column: string,
                value: string,
              ) => Promise<{
                error: Error | null;
              }>;
            };
          };
        };

        // 1. Jika status REJECTED -> Hapus dari tabel locations
        if (status === "rejected") {
          await client.from("report_logs").insert({
            location_id: id,
            previous_status: previousStatus,
            new_status: "rejected",
            notes: "Laporan ditolak dan dihapus oleh admin.",
            updated_by: userId,
            created_at: new Date().toISOString(),
          });

          const { error: deleteError } = await client
            .from("locations")
            .delete()
            .eq("id", id);

          if (deleteError) throw deleteError;

          setReports((current) => current.filter((r) => r.id !== id));
          return true;
        }

        // 2. Jika status selain REJECTED -> UPDATE status dengan value Enum yang valid
        const targetStatus = LOCATION_STATUS_MAP[status] ?? status;

        const { error: updateError } = await client
          .from("locations")
          .update({
            status: targetStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateError) throw updateError;
        const { error: logError } = await client.from("report_logs").insert({
          location_id: id,
          previous_status: previousStatus,
          new_status: status,
          notes: `Status diubah dari ${previousStatus} ke ${status} oleh admin.`,
          updated_by: userId ? String(userId) : "Admin",
          created_at: new Date().toISOString(),
        });

        if (logError) {
          console.warn("Log warning (Non-blocking):", logError.message);
        }

        setReports((current) =>
          current.map((r) =>
            r.id === id
              ? { ...r, status, updated_at: new Date().toISOString() }
              : r,
          ),
        );

        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Gagal memperbarui status.",
        );
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [reports, userId],
  );

  const deleteReport = useCallback(
    async (id: string) => {
      return updateStatus(id, "rejected");
    },
    [updateStatus],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchReports(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchReports]);

  const activeCount = useMemo(
    () => reports.filter((r) => r.status !== "completed").length,
    [reports],
  );

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    return reports.filter(
      (r) =>
        r.status === "completed" &&
        r.updated_at &&
        new Date(r.updated_at) >= weekStart,
    ).length;
  }, [reports]);

  return {
    reports,
    loading,
    error,
    authenticated,
    updatingId,
    refetch: fetchReports,
    updateStatus,
    deleteReport,
    filters,
    setFilters,
    activeCount,
    completedThisWeek,
  };
}
