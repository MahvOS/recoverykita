"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMapReports,
  updateReportStatus,
  deleteReportServer,
} from "@/actions/reportActions";
import type { MapReport, Priority, ReportStatus } from "@/types/admin";

export type { MapReport, Priority, ReportStatus };

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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMapReports({
        category: filters.category,
        priority: filters.priority,
        date: filters.date,
      });
      setReports(data);
    } catch (err: unknown) {
      setReports([]);
      setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateStatus = useCallback(async (id: string, status: ReportStatus) => {
    setUpdatingId(id);
    setError(null);

    try {
      const result = await updateReportStatus(id, status);

      if (result.success) {
        setReports((current) =>
          current.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  updated_at: new Date().toISOString(),
                }
              : r,
          ),
        );
        return true;
      }

      setError(result.error || "Gagal memperbarui status.");
      return false;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui status.",
      );
      return false;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    setUpdatingId(id);
    setError(null);

    try {
      const result = await deleteReportServer(id);

      if (result.success) {
        setReports((current) => current.filter((r) => r.id !== id));
        return true;
      }

      setError(result.error || "Gagal menghapus laporan.");
      return false;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus laporan.");
      return false;
    } finally {
      setUpdatingId(null);
    }
  }, []);

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
    authenticated: true,
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
