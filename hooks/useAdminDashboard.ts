"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDashboardData } from "@/actions/dashboardActions";
import type { MetricStats, RecentReport, MapLocation } from "@/types/admin";

export function useAdminDashboard() {
  const [stats, setStats] = useState<MetricStats>({
    inProgressCount: 0,
    pendingCount: 0,
    reportsSolved: 0,
  });
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState("Offline");
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardData();

      setStats(result.stats);
      setReports(result.reports);
      setMapLocations(result.mapLocations);
      setDbStatus(result.dbStatus);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as Record<string, unknown>).message)
            : typeof err === "string"
              ? err
              : "Gagal memuat data dashboard";

      console.error("Dashboard fetch error:", err);
      setDbStatus("Gagal Query");
      setError(message || "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchDashboard]);

  return {
    stats,
    reports,
    mapLocations,
    loading,
    dbStatus,
    error,
    refetch: fetchDashboard,
  };
}
