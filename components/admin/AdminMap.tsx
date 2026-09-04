"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

import type { LocationCategory } from "@/types/admin";

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;

function buildCartoTileUrl(): string {
  const base = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  if (!CARTO_API_KEY) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}api_key=${encodeURIComponent(CARTO_API_KEY)}`;
}

interface MapMarker {
  id: string;
  title: string;
  category: LocationCategory | string;
  latitude: number;
  longitude: number;
  status?: string;
}

interface AdminMapProps {
  locations: MapMarker[];
}

const isLeafletElement = (el: HTMLDivElement | null): boolean => {
  if (!el) return false;
  const id = (el as HTMLDivElement & { _leaflet_id?: string | number })
    ._leaflet_id;
  return typeof id !== "undefined" && id !== null;
};

export default function AdminMap({ locations }: AdminMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const mountedRef = useRef(true);
  const [ready, setReady] = useState(false);
  const initIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    const initId = ++initIdRef.current;

    const initMap = async () => {
      if (
        !mountedRef.current ||
        initId !== initIdRef.current ||
        mapInstanceRef.current ||
        !mapRef.current
      ) {
        return;
      }

      let L: any = null;
      try {
        const mod = await import("leaflet");
        L = mod.default ?? mod;
      } catch (importError) {
        console.error("[AdminMap] Gagal memuat Leaflet:", importError);
        return;
      }

      if (
        !mountedRef.current ||
        initId !== initIdRef.current ||
        mapInstanceRef.current ||
        !mapRef.current
      ) {
        return;
      }

      try {
        const centerCoord: [number, number] = [-6.2088, 106.8456];

        const map = L.map(mapRef.current, {
          center: centerCoord,
          zoom: 12,
          zoomControl: true,
        });

        L.tileLayer(buildCartoTileUrl(), {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        if (!mountedRef.current || initId !== initIdRef.current) {
          map.remove();
          return;
        }

        mapInstanceRef.current = map;

        if (mountedRef.current) {
          setReady(true);
        }

        requestAnimationFrame(() => {
          if (
            mountedRef.current &&
            mapInstanceRef.current &&
            mapRef.current &&
            isLeafletElement(mapRef.current)
          ) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {
              // ignore
            }
          }
        });
      } catch {
        // ignore init errors
      }
    };

    initMap();

    return () => {
      mountedRef.current = false;
      const currentId = initId;
      const markers = markersRef.current;
      markersRef.current = [];

      const cleanup = () => {
        if (currentId !== initIdRef.current) return;

        markers.forEach((marker) => {
          try {
            if (marker && typeof marker.remove === "function") {
              marker.remove();
            }
          } catch {
            // ignore removal errors
          }
        });

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {
            // ignore removal errors
          }
          mapInstanceRef.current = null;
        }
      };

      if (typeof window !== "undefined") {
        setTimeout(cleanup, 0);
      } else {
        cleanup();
      }
    };
  }, []);

  useEffect(() => {
    if (
      !ready ||
      !mapInstanceRef.current ||
      !mountedRef.current ||
      !mapRef.current
    )
      return;

    const updateMarkers = async () => {
      const { default: L } = await import("leaflet");

      if (
        !mountedRef.current ||
        !mapInstanceRef.current ||
        !mapRef.current ||
        !isLeafletElement(mapRef.current)
      ) {
        return;
      }

      const markers = markersRef.current;
      markersRef.current = [];

      markers.forEach((marker) => {
        try {
          if (marker && typeof marker.remove === "function") {
            marker.remove();
          }
        } catch {
          // ignore
        }
      });

      const bankSampahIcon = L.divIcon({
        className: "custom-div-icon-green",
        html: `
          <div class="relative flex flex-col items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#16a34a] border-2 border-white shadow-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <div class="w-1.5 h-1.5 bg-[#16a34a] rotate-45 -mt-1 border-r border-b border-white"></div>
          </div>
        `,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      });

      const laporanLiarIcon = L.divIcon({
        className: "custom-div-icon-red",
        html: `
          <div class="relative flex flex-col items-center">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#dc2626] border-2 border-white shadow-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div class="w-1.5 h-1.5 bg-[#dc2626] rotate-45 -mt-1 border-r border-b border-white"></div>
          </div>
        `,
        iconSize: [32, 36],
        iconAnchor: [16, 36],
      });

      const bounds: [number, number][] = [];

      const map = mapInstanceRef.current;

      locations.forEach((loc) => {
        if (!loc.latitude || !loc.longitude || !map) return;

        const isBankSampah = loc.category === "waste_bank";
        const icon = isBankSampah ? bankSampahIcon : laporanLiarIcon;

        try {
          const marker = L.marker([loc.latitude, loc.longitude], { icon })
            .bindPopup(
              `
              <div class="p-1">
                <h5 class="font-bold text-sm text-zinc-900 mb-0.5">${loc.title}</h5>
                <p class="text-xs text-zinc-500 m-0">${isBankSampah ? "Bank Sampah" : "Laporan Liar"} • ${loc.status || "Menunggu"}</p>
              </div>
            `,
            )
            .addTo(map);

          markersRef.current.push(marker);
          bounds.push([loc.latitude, loc.longitude]);
        } catch {
          // skip invalid marker
        }
      });

      if (
        bounds.length > 0 &&
        map &&
        mountedRef.current &&
        mapRef.current &&
        isLeafletElement(mapRef.current)
      ) {
        try {
          map.fitBounds(bounds, { padding: [40, 40] });
          requestAnimationFrame(() => {
            if (
              mountedRef.current &&
              mapInstanceRef.current &&
              mapRef.current &&
              isLeafletElement(mapRef.current)
            ) {
              try {
                mapInstanceRef.current.invalidateSize();
              } catch {
                // ignore
              }
            }
          });
        } catch {
          // ignore fitBounds errors
        }
      }
    };

    updateMarkers();
  }, [locations, ready]);

  return (
    <div className="relative w-full h-[380px] md:h-[420px] rounded-2xl overflow-hidden border border-zinc-200 shadow-inner z-10">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
