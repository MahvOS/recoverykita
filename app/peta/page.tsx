"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  hasSupabaseConfig,
  getSupabaseClient,
  Location,
  MapLocationCategory,
} from "@/lib/supabase";

function buildCartoTileUrl(): string {
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

const CATEGORY_CONFIG: Record<
  MapLocationCategory,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    markerColor: string;
  }
> = {
  trash_dump: {
    label: "Titik Sampah Liar",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    markerColor: "#dc2626",
  },
  waste_bank: {
    label: "Bank Sampah",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    markerColor: "#16a34a",
  },
  community_action: {
    label: "Komunitas Aksi",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    markerColor: "#2563eb",
  },
};

// ─── Map Component (Client-only) ─────────────────────────────────────────────
interface MapProps {
  locations: Location[];
  activeFilters: Set<MapLocationCategory>;
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location | null) => void;
}

function LeafletMap({
  locations,
  activeFilters,
  selectedLocation,
  onSelectLocation,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const init = async () => {
      let L: any = null;
      try {
        const mod = await import("leaflet");
        L = mod.default ?? mod;
      } catch (importError) {
        console.error("[PetaPage] Gagal memuat Leaflet:", importError);
        return;
      }

      if ((mapRef.current as any)?._leaflet_id) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center of Indonesia (roughly)
      const map = L.map(mapRef.current!, {
        center: [-6.175392, 106.827153],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer(buildCartoTileUrl(), {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      let L: any = null;
      try {
        const mod = await import("leaflet");
        L = mod.default ?? mod;
      } catch (importError) {
        console.error("[PetaPage] Gagal memuat Leaflet:", importError);
        return;
      }

      const map = mapInstanceRef.current!;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const filtered = locations.filter((loc) =>
        activeFilters.has(loc.category),
      );

      filtered.forEach((loc) => {
        const cfg = CATEGORY_CONFIG[loc.category];
        const photoUrl = loc.photo_urls?.[0] || loc.photo_url;

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width: 36px; height: 36px;
              background: ${cfg.markerColor};
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              display: flex; align-items: center; justify-content: center;
            ">
              <div style="transform: rotate(45deg); color: white; font-size: 14px; line-height:1;">
                ${loc.category === "trash_dump" ? "⚠" : loc.category === "waste_bank" ? "♻" : "🤝"}
              </div>
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon });

        // Popup
        let popupHtml = [
          `<div style="font-family:sans-serif;min-width:200px;padding:6px 4px">`,
          `<span style="display:inline-block;background:${cfg.bg};color:${cfg.color};border:1px solid ${cfg.border};font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;margin-bottom:6px">${cfg.label}</span>`,
          `<p style="font-size:15px;font-weight:700;color:#111;margin:0 0 4px">${loc.title}</p>`,
          `<p style="font-size:12px;color:#555;margin:0 0 4px;line-height:1.4">${loc.description}</p>`,
        ].join("");

        if (photoUrl) {
          popupHtml += `<img src="${photoUrl}" style="width:100%;max-height:120px;object-fit:cover;border-radius:4px;margin-bottom:4px;" />`;
        }

        if (loc.reporter_name) {
          popupHtml += `<p style="font-size:11px;color:#555;margin:0 0 2px"><span style="font-weight:700">Pelapor:</span> ${loc.reporter_name}</p>`;
        }
        if (loc.reporter_phone) {
          popupHtml += `<p style="font-size:11px;color:#555;margin:0 0 2px"><span style="font-weight:700">No. HP:</span> <a href="tel:${loc.reporter_phone}" style="color:#198754;text-decoration:underline">${loc.reporter_phone}</a></p>`;
        }
        if (loc.waste_type) {
          const wt = Array.isArray(loc.waste_type)
            ? loc.waste_type.join(", ")
            : loc.waste_type;
          popupHtml += `<p style="font-size:11px;color:#555;margin:0 0 2px"><span style="font-weight:700">Jenis Sampah:</span> ${wt}</p>`;
        }
        popupHtml += `<p style="font-size:10px;color:#999;margin:4px 0 0"><span style="font-weight:700">Tanggal:</span> ${new Date(loc.created_at).toLocaleDateString("id-ID")}</p>`;
        popupHtml += `</div>`;

        marker.bindPopup(popupHtml, {
          maxWidth: 320,
          closeButton: true,
          closeOnEscape: true,
          closeOnClick: true,
        });

        marker.on("click", () => onSelectLocation(loc));
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  }, [locations, activeFilters, onSelectLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    mapInstanceRef.current.flyTo(
      [selectedLocation.latitude, selectedLocation.longitude],
      16,
      { animate: true, duration: 1.2 },
    );
  }, [selectedLocation]);

  return <div ref={mapRef} className="w-full h-full" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PetaPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<MapLocationCategory>>(
    new Set(["trash_dump", "waste_bank", "community_action"]),
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);

      if (!hasSupabaseConfig) {
        setError(
          "Supabase belum dikonfigurasi. Tambahkan variabel environment di Vercel.",
        );
        setLocations([]);
        setLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient();

        const { data: locData, error: locError } = await client
          .from("locations")
          .select("*");

        if (locError) {
          setError("Gagal memuat data lokasi. Coba lagi nanti.");
          setLocations([]);
          setLoading(false);
          return;
        }

        const locations = (locData as Location[]) || [];

        setLocations(locations);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data lokasi. Coba lagi nanti.");
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const toggleFilter = (cat: MapLocationCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSelectLocation = useCallback((loc: Location | null) => {
    setSelectedLocation(loc);
  }, []);

  const searchResults = searchQuery.trim()
    ? locations.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : [];

  const visibleCount = locations.filter((l) =>
    activeFilters.has(l.category),
  ).length;

  const coveragePct =
    locations.length === 0
      ? 0
      : Math.round((new Set(locations.map((l) => l.category)).size / 3) * 100);

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800 flex flex-col">
      <Navbar />

      {/* ── Map Layout ── */}
      <div className="flex flex-1 relative min-h-0 pt-16 sm:pt-20 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)]">
        {sidebarOpen && (
          <div
            className="fixed inset-x-0 top-16 sm:top-20 bottom-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
          fixed inset-y-0 left-0 top-16 sm:top-20 z-40 w-[min(20rem,calc(100vw-2rem))] bg-white border-r border-zinc-100 flex flex-col overflow-hidden
          transform transition-transform duration-300 ease-in-out
          md:relative md:inset-auto md:transform-none md:w-72 md:z-auto lg:w-80
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-700">
              Filter & Pencarian
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100"
            >
              <svg
                className="w-5 h-5 text-zinc-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden md:block p-4 border-b border-zinc-100">
            <span className="text-sm font-semibold text-zinc-700">
              Filter & Pencarian
            </span>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 bg-[#f8fafb] border border-zinc-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#198754]/20 focus-within:border-[#198754] transition-all">
              <svg
                className="w-4 h-4 text-zinc-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi..."
                className="w-full text-sm text-zinc-800 placeholder-zinc-400 bg-transparent border-none focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {searchQuery.trim() && (
              <div className="mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    Lokasi tidak ditemukan
                  </p>
                ) : (
                  searchResults.map((loc) => {
                    const cfg = CATEGORY_CONFIG[loc.category];
                    return (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: cfg.markerColor }}
                          />
                          <span className="text-xs font-semibold text-zinc-900 truncate">
                            {loc.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate pl-4">
                          {cfg.label}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-100 flex-shrink-0">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Filter Area
            </p>
            <div className="space-y-2">
              {(
                Object.entries(CATEGORY_CONFIG) as [
                  MapLocationCategory,
                  (typeof CATEGORY_CONFIG)[MapLocationCategory],
                ][]
              ).map(([key, cfg]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer group py-1"
                >
                  <div className="relative w-5 h-5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={activeFilters.has(key)}
                      onChange={() => toggleFilter(key)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                      style={{
                        background: activeFilters.has(key)
                          ? cfg.markerColor
                          : "white",
                        borderColor: activeFilters.has(key)
                          ? cfg.markerColor
                          : "#d1d5db",
                      }}
                    >
                      {activeFilters.has(key) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    {cfg.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected location info */}
          {selectedLocation && (
            <div className="p-4 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                  Lokasi Dipilih
                </p>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div
                className="rounded-xl p-3 border"
                style={{
                  background: CATEGORY_CONFIG[selectedLocation.category].bg,
                  borderColor:
                    CATEGORY_CONFIG[selectedLocation.category].border,
                }}
              >
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      CATEGORY_CONFIG[selectedLocation.category].markerColor,
                    color: "white",
                  }}
                >
                  {CATEGORY_CONFIG[selectedLocation.category].label}
                </span>
                <p className="text-sm font-bold text-zinc-900 mt-2 mb-1 line-clamp-2">
                  {selectedLocation.title}
                </p>
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                  {selectedLocation.description}
                </p>
                {(() => {
                  const photos =
                    selectedLocation.photo_urls ||
                    (selectedLocation.photo_url
                      ? [selectedLocation.photo_url]
                      : []);
                  if (photos.length === 0) return null;
                  return (
                    <div className="mt-2">
                      <Image
                        src={photos[0]}
                        alt={selectedLocation.title || "Foto lokasi"}
                        width={280}
                        height={140}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg"
                        unoptimized
                      />
                      {photos.length > 1 && (
                        <div className="flex gap-1 mt-1.5 overflow-x-auto pb-0.5">
                          {photos.slice(1, 5).map((url, idx) => (
                            <Image
                              key={idx}
                              src={url}
                              alt={`Foto ${idx + 2}`}
                              width={60}
                              height={60}
                              className="w-15 h-15 object-cover rounded flex-shrink-0"
                              unoptimized
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {selectedLocation.waste_type && (
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-[10px] text-zinc-400">
                      Jenis Sampah
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                      {Array.isArray(selectedLocation.waste_type) ? (
                        selectedLocation.waste_type.map((w) => (
                          <span
                            key={w}
                            className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700"
                          >
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                          {selectedLocation.waste_type}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-1 flex justify-between gap-4">
                  <span className="text-[10px] text-zinc-400">Pelapor</span>
                  <span className="text-[10px] font-medium text-zinc-700">
                    {selectedLocation.reporter_name || "Anonim"}
                  </span>
                </div>
                {selectedLocation.reporter_phone && (
                  <div className="flex justify-between gap-4 items-center">
                    <span className="text-[10px] text-zinc-400">No. HP</span>
                    <a
                      href={`tel:${selectedLocation.reporter_phone}`}
                      className="text-[10px] font-medium text-zinc-700 hover:text-[#198754] hover:underline"
                    >
                      {selectedLocation.reporter_phone}
                    </a>
                  </div>
                )}
                <div className="mt-1 flex justify-between gap-4">
                  <span className="text-[10px] text-zinc-400">Tanggal Lap</span>
                  <span className="text-[10px] font-medium text-zinc-700">
                    {new Date(selectedLocation.created_at).toLocaleString(
                      "id-ID",
                    )}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                  {selectedLocation.latitude.toFixed(4)},{" "}
                  {selectedLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Summary stats */}
          <div className="p-4 border-t border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Ringkasan Data
            </p>
            {loading ? (
              <div className="flex gap-2 animate-pulse">
                <div className="h-10 w-20 bg-zinc-100 rounded-lg" />
                <div className="h-10 w-20 bg-zinc-100 rounded-lg" />
              </div>
            ) : (
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-black text-[#dc2626]">
                    {locations.length}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Total Titik Terlapor
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#16a34a]">
                    {coveragePct}%
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Area Tercover
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lapor button */}
          <div className="p-4 pt-0">
            <Link
              href="/lapor"
              className="w-full bg-[#0f5132] text-white text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#0c4028] transition-colors"
            >
              Lapor Titik Baru
            </Link>
          </div>
        </aside>

        {/* ── Map Area ── */}
        <div className="flex-1 relative">
          {/* Mobile filter button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 md:hidden bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-full p-2.5 sm:p-3 shadow-md hover:bg-white transition-colors"
            aria-label="Buka filter peta"
          >
            <svg
              className="w-5 h-5 text-zinc-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-3 border-[#198754]/20 border-t-[#198754] rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 font-medium">
                Memuat data lokasi...
              </p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 z-20 bg-white/90 flex items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-zinc-700 mb-1">
                  Gagal Memuat Data
                </p>
                <p className="text-xs text-zinc-400">{error}</p>
              </div>
            </div>
          )}

          {/* Visible pins legend */}
          <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-xl shadow-md p-3 text-xs space-y-1.5 hidden sm:block">
            <p className="font-bold text-zinc-500 text-[10px] uppercase tracking-wide mb-2">
              Legenda
            </p>
            {(
              Object.entries(CATEGORY_CONFIG) as [
                MapLocationCategory,
                (typeof CATEGORY_CONFIG)[MapLocationCategory],
              ][]
            ).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: cfg.markerColor }}
                />
                <span className="text-zinc-600">{cfg.label}</span>
                <span className="text-zinc-400 ml-auto">
                  ({locations.filter((l) => l.category === key).length})
                </span>
              </div>
            ))}
            <div className="border-t border-zinc-100 pt-1.5 mt-1 text-zinc-500 font-medium">
              Tampil: {visibleCount} titik
            </div>
          </div>

          {/* Mobile legend - simplified */}
          <div className="absolute bottom-3 left-3 right-16 z-10 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-xl shadow-md p-2.5 sm:p-3 text-xs space-y-1.5 sm:hidden max-w-[calc(100%-5rem)]">
            <p className="font-bold text-zinc-500 text-[10px] uppercase tracking-wide mb-2">
              Legenda
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(CATEGORY_CONFIG) as [
                  MapLocationCategory,
                  (typeof CATEGORY_CONFIG)[MapLocationCategory],
                ][]
              ).map(([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-1 bg-zinc-50 rounded-full px-2 py-1"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cfg.markerColor }}
                  />
                  <span className="text-zinc-600 text-[10px]">{cfg.label}</span>
                </div>
              ))}
            </div>
            <div className="text-zinc-500 font-medium text-center">
              Tampil: {visibleCount} titik
            </div>
          </div>

          <LeafletMap
            locations={locations}
            activeFilters={activeFilters}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="hidden sm:block bg-white border-t border-zinc-200/60 py-4 sm:py-6 px-4 sm:px-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 sm:gap-6">
          <div className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                <Image
                  src="/favicon.ico"
                  alt="RecoveryKita Logo"
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </div>
              <span className="text-sm sm:text-base font-bold text-[#0f5132] tracking-tight">
                RecoveryKita
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-400">
              © {new Date().getFullYear()} RecoveryKita. All rights reserved.
              Menuju Ekonomi Sirkular Indonesia.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-medium text-zinc-500">
            <Link href="/" className="hover:text-[#198754] transition-colors">
              Beranda
            </Link>
            <Link
              href="/marketplace"
              className="hover:text-[#198754] transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/peta"
              className="hover:text-[#198754] transition-colors"
            >
              Peta
            </Link>
            <Link
              href="/lapor"
              className="hover:text-[#198754] transition-colors"
            >
              Lapor
            </Link>
            <Link
              href="/edukasi"
              className="hover:text-[#198754] transition-colors"
            >
              Edukasi
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
