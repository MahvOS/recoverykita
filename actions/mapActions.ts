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

const round2 = (num: number): number => {
  return Number(Number(num).toFixed(2));
};

export async function getHotspotClusters(): Promise<HotspotArea[]> {
  const client = getSupabaseClient();

  let rawReports: any[] = [];
  try {
    const { data: locData, error: locError } = await client
      .from("locations")
      .select(
        `
        id, title, description, category, waste_type, priority, status, 
        latitude, longitude, photo_urls, photo_url, reporter_name, reporter_phone, 
        address_notes, created_at, updated_at
      `,
      )
      .order("created_at", { ascending: false });

    if (!locError && Array.isArray(locData) && locData.length > 0) {
      rawReports = locData;
    }
  } catch (err) {
    console.warn("Gagal query langsung ke tabel locations, mencoba RPC:", err);
  }

  // 2. Fallback ke RPC jika query tabel locations kosong atau gagal
  if (rawReports.length === 0) {
    try {
      const { data: rpcData, error: rpcError } = await client.rpc(
        "get_hotspot_clusters",
      );
      if (!rpcError && Array.isArray(rpcData)) {
        rawReports = rpcData.map((row: any) => ({
          id: row.latest_report?.id,
          latitude: row.latitude,
          longitude: row.longitude,
          title: row.name,
          address_notes: row.name,
          created_at: row.latest_report?.created_at,
          status: row.latest_report?.status,
          priority: row.latest_report?.priority,
          category: row.latest_report?.category,
          description: row.latest_report?.description,
          reporter_name: row.latest_report?.reporter_name,
          reporter_phone: row.latest_report?.reporter_phone,
          photo_url: row.latest_report?.photo_url,
          photo_urls: row.latest_report?.photo_urls,
          waste_type: row.latest_report?.waste_type,
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil data hotspot dari RPC:", err);
    }
  }

  if (rawReports.length === 0) {
    return [];
  }

  // 3. Filter laporan valid & kelompokkan berdasarkan pembulatan 2 desimal (radius ~1.1 km)
  interface ClusterGroup {
    roundedLat: number;
    roundedLng: number;
    reports: any[];
  }

  const clusters = new Map<string, ClusterGroup>();

  for (const r of rawReports) {
    if (!isValidCoordinate(r.latitude, r.longitude)) continue;
    if (r.status === "rejected") continue;

    const rawLat = Number(r.latitude);
    const rawLng = Number(r.longitude);
    const roundedLat = round2(rawLat);
    const roundedLng = round2(rawLng);
    const clusterKey = `${roundedLat.toFixed(2)}, ${roundedLng.toFixed(2)}`;

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        roundedLat,
        roundedLng,
        reports: [],
      });
    }
    clusters.get(clusterKey)!.reports.push(r);
  }

  // 4. Bangun data HotspotArea per kluster
  const results: HotspotArea[] = [];

  for (const [key, cluster] of clusters.entries()) {
    const clusterReports = cluster.reports;
    if (clusterReports.length === 0) continue;

    // Urutkan laporan di dalam kluster dari yang paling baru
    clusterReports.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );

    const latestRow = clusterReports[0];

    // Hitung akumulasi laporan aktif (pending & in_progress)
    const activeReports = clusterReports.filter(
      (r) => r.status === "pending" || r.status === "in_progress",
    );

    // Total laporan per kluster: akumulasi laporan aktif (atau total jika semua sudah selesai)
    const count =
      activeReports.length > 0 ? activeReports.length : clusterReports.length;

    // Nama kluster: cari nama yang paling informatif
    const readableReport = clusterReports.find((r) => {
      const text = r.address_notes || r.title || r.location_name;
      return (
        typeof text === "string" &&
        text.trim().length > 0 &&
        !text.startsWith("-6.") &&
        !text.startsWith("-") &&
        text !== "Wilayah Tidak Diketahui"
      );
    });

    const clusterName =
      readableReport?.address_notes ||
      readableReport?.title ||
      readableReport?.location_name ||
      latestRow.address_notes ||
      latestRow.title ||
      latestRow.location_name ||
      `Area (${cluster.roundedLat.toFixed(2)}, ${cluster.roundedLng.toFixed(2)})`;

    // Titik pusat koordinat rata-rata kluster
    const avgLat =
      clusterReports.reduce((sum, r) => sum + Number(r.latitude), 0) /
      clusterReports.length;
    const avgLng =
      clusterReports.reduce((sum, r) => sum + Number(r.longitude), 0) /
      clusterReports.length;

    const latestReport: MapReport = {
      id: String(latestRow.id ?? key),
      location_name:
        typeof latestRow.address_notes === "string" &&
        latestRow.address_notes.trim()
          ? latestRow.address_notes.trim()
          : typeof latestRow.title === "string" && latestRow.title.trim()
            ? latestRow.title.trim()
            : clusterName,
      description:
        typeof latestRow.description === "string"
          ? latestRow.description
          : null,
      category:
        typeof latestRow.category === "string" ? latestRow.category : null,
      latitude: Number(latestRow.latitude ?? avgLat),
      longitude: Number(latestRow.longitude ?? avgLng),
      status: (latestRow.status as MapReport["status"]) ?? "pending",
      priority:
        latestRow.priority === "rendah" ||
        latestRow.priority === "sedang" ||
        latestRow.priority === "tinggi"
          ? (latestRow.priority as MapReport["priority"])
          : null,
      photo_url:
        typeof latestRow.photo_url === "string" && latestRow.photo_url.trim()
          ? latestRow.photo_url.trim()
          : Array.isArray(latestRow.photo_urls) &&
              latestRow.photo_urls.length > 0
            ? latestRow.photo_urls[0]
            : null,
      photo_urls: Array.isArray(latestRow.photo_urls)
        ? (latestRow.photo_urls.filter(
            (v: any) => typeof v === "string",
          ) as string[])
        : typeof latestRow.photo_url === "string" && latestRow.photo_url.trim()
          ? [latestRow.photo_url.trim()]
          : null,
      reporter_name:
        typeof latestRow.reporter_name === "string"
          ? latestRow.reporter_name
          : null,
      reporter_phone:
        typeof latestRow.reporter_phone === "string"
          ? latestRow.reporter_phone
          : null,
      created_at:
        typeof latestRow.created_at === "string" ? latestRow.created_at : null,
      updated_at:
        typeof latestRow.updated_at === "string" ? latestRow.updated_at : null,
      waste_type:
        typeof latestRow.waste_type === "string"
          ? latestRow.waste_type
          : Array.isArray(latestRow.waste_type)
            ? latestRow.waste_type.filter((v: any) => typeof v === "string")
            : null,
    };

    results.push({
      id: key,
      name: clusterName,
      count,
      latitude: Number(avgLat.toFixed(4)),
      longitude: Number(avgLng.toFixed(4)),
      latestReport,
    });
  }

  // 5. Efek penyebaran Red-Zone (jika titik terdekat berada dalam radius < 800m dari Red Zone)
  const threshold = 800;
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

  // Urutkan dari kluster dengan laporan terbanyak
  results.sort((a, b) => b.count - a.count);

  return results;
}
