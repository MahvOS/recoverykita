"use server";

import { getSupabaseClient } from "@/lib/supabase";
import type { HotspotArea, MapReport } from "@/types/admin";

function isValidCoordinate(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (lat == null || lng == null) return false;
  const la = Number(lat);
  const ln = Number(lng);
  return (
    Number.isFinite(la) &&
    Number.isFinite(ln) &&
    Math.abs(la) <= 90 &&
    Math.abs(ln) <= 180
  );
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getHotspotClusters(): Promise<HotspotArea[]> {
  const client = getSupabaseClient();

  const { data, error } = await client.rpc("get_hotspot_clusters");

  if (error) {
    console.error("Gagal mengambil data hotspot:", error);
    return [];
  }

  const rows = Array.isArray(data) ? data : [];

  const seen = new Map<string, number>();
  const results: HotspotArea[] = [];

  for (const row of rows) {
    const latestReportRaw = row.latest_report as Record<string, unknown> | null;

    const latestReport: MapReport = {
      id: String(latestReportRaw?.id ?? ""),
      location_name:
        typeof latestReportRaw?.location_name === "string"
          ? latestReportRaw.location_name
          : typeof latestReportRaw?.description === "string"
            ? latestReportRaw.description
            : null,
      description:
        typeof latestReportRaw?.description === "string"
          ? latestReportRaw.description
          : null,
      category:
        typeof latestReportRaw?.category === "string"
          ? latestReportRaw.category
          : null,
      latitude:
        latestReportRaw?.latitude == null
          ? null
          : Number(latestReportRaw.latitude),
      longitude:
        latestReportRaw?.longitude == null
          ? null
          : Number(latestReportRaw.longitude),
      status: (latestReportRaw?.status as MapReport["status"]) ?? "pending",
      priority:
        latestReportRaw?.priority === "rendah" ||
        latestReportRaw?.priority === "sedang" ||
        latestReportRaw?.priority === "tinggi"
          ? (latestReportRaw.priority as MapReport["priority"])
          : null,
      photo_url:
        typeof latestReportRaw?.photo_url === "string"
          ? latestReportRaw.photo_url
          : null,
      photo_urls: Array.isArray(latestReportRaw?.photo_urls)
        ? (latestReportRaw.photo_urls.filter(
            (v): v is string => typeof v === "string",
          ) as string[])
        : null,
      reporter_name:
        typeof latestReportRaw?.reporter_name === "string"
          ? latestReportRaw.reporter_name
          : null,
      reporter_phone:
        typeof latestReportRaw?.reporter_phone === "string"
          ? latestReportRaw.reporter_phone
          : null,
      created_at:
        typeof latestReportRaw?.created_at === "string"
          ? latestReportRaw.created_at
          : null,
      updated_at:
        typeof latestReportRaw?.updated_at === "string"
          ? latestReportRaw.updated_at
          : null,
      waste_type:
        typeof latestReportRaw?.waste_type === "string"
          ? latestReportRaw.waste_type
          : Array.isArray(latestReportRaw?.waste_type)
            ? (latestReportRaw.waste_type.filter(
                (v): v is string => typeof v === "string",
              ) as string[])
            : null,
    };

    const lat = Number(row.latitude ?? 0);
    const lng = Number(row.longitude ?? 0);
    const name = String(
      row.name ?? `Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    );
    const count = Number(row.count ?? 0);

    if (!isValidCoordinate(lat, lng)) {
      continue;
    }

    const baseKey = `${name}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const occurrence = seen.get(baseKey) ?? 0;
    seen.set(baseKey, occurrence + 1);

    results.push({
      id: occurrence > 0 ? `${baseKey}_${occurrence}` : baseKey,
      name,
      count,
      latitude: lat,
      longitude: lng,
      latestReport,
    });
  }

  const threshold = 500;
  const touchedByRedZone = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    if (results[i].count < 3) continue;

    for (let j = 0; j < results.length; j++) {
      if (i === j) continue;

      const distance = haversineDistance(
        results[i].latitude,
        results[i].longitude,
        results[j].latitude,
        results[j].longitude,
      );

      if (distance <= threshold) {
        touchedByRedZone.add(results[j].id);
      }
    }
  }

  for (const area of results) {
    if (area.count >= 3 || touchedByRedZone.has(area.id)) {
      area.count = Math.max(area.count, 3);
    }
  }

  results.sort((a, b) => b.count - a.count);

  return results;
}
