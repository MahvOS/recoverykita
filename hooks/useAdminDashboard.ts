"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type {
  Location,
  MetricStats,
  RecentReport,
  MapLocation,
} from "@/types/admin";

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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabase || !hasSupabaseConfig) {
      setDbStatus("Offline");
      setLoading(false);
      setError("Supabase belum dikonfigurasi.");
      return;
    }

    try {
      const client = getSupabaseClient();
      setDbStatus("Terhubung ke Supabase");

      const [locResult] = await Promise.all([
        client.from("locations").select(`
          id, title, description, category, waste_type, priority, status, 
          latitude, longitude, photo_urls, reporter_name, reporter_phone, 
          address_notes, created_at
        `),
      ]);

      if (locResult.error) throw locResult.error;

      const locations = (locResult.data as unknown as Location[]) || [];

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

      setStats({
        inProgressCount,
        pendingCount,
        reportsSolved,
      });

      const mappedLocations: MapLocation[] = locations.map((loc) => ({
        id: loc.id,
        title: loc.title || "Lokasi Sampah",
        category: loc.category || "trash_dump",
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        status: loc.status || "Menunggu",
        photo_url: loc.photo_url,
      }));
      setMapLocations(mappedLocations);

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
      setReports(recentReports);
    } catch (err) {
      console.error("Dashboard DB fetch error:", err);
      setDbStatus("Gagal Query");
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    reports,
    mapLocations,
    loading,
    dbStatus,
    error,
    refetch: fetchDashboardData,
  };
}
