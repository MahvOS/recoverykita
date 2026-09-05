"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Circle, Path } from "leaflet";
import type { HotspotArea } from "@/types/admin";
import "leaflet/dist/leaflet.css";

function buildCartoTileUrl(): string {
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

const isLeafletElement = (el: HTMLDivElement | null): boolean => {
  if (!el) return false;
  const id = (el as HTMLDivElement & { _leaflet_id?: string | number })
    ._leaflet_id;
  return typeof id !== "undefined" && id !== null;
};

export default function HotspotMap({
  hotspots,
  onSelect,
}: {
  hotspots: HotspotArea[];
  onSelect: (r: HotspotArea) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<(Circle | Path)[]>([]);
  const selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(true);
  const initIdRef = useRef(0);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    mountedRef.current = true;
    const initId = ++initIdRef.current;
    let mapInstance: LeafletMap | null = null;

    const initMap = async () => {
      if (
        !mountedRef.current ||
        initId !== initIdRef.current ||
        mapRef.current ||
        !elementRef.current
      ) {
        return;
      }

      let L: any = null;
      try {
        const mod = await import("leaflet");
        L = mod.default ?? mod;
      } catch (importError) {
        console.error("[HotspotMap] Gagal memuat Leaflet:", importError);
        return;
      }

      if (
        !mountedRef.current ||
        initId !== initIdRef.current ||
        mapRef.current ||
        !elementRef.current
      ) {
        return;
      }

      try {
        mapInstance = L.map(elementRef.current, {
          center: [-6.2, 106.816],
          zoom: 11,
          zoomControl: false,
        });

        L.tileLayer(buildCartoTileUrl(), {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        if (!mountedRef.current || initId !== initIdRef.current) {
          mapInstance?.remove();
          mapInstance = null;
          return;
        }

        mapRef.current = mapInstance;

        if (mountedRef.current) {
          setReady(true);
        }

        requestAnimationFrame(() => {
          if (
            mountedRef.current &&
            mapInstance &&
            elementRef.current &&
            isLeafletElement(elementRef.current)
          ) {
            try {
              mapInstance.invalidateSize();
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

        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch {
            // ignore removal errors
          }
          mapRef.current = null;
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
    if (!ready || !mapRef.current || !mountedRef.current || !elementRef.current)
      return;

    const updateMarkers = async () => {
      const { default: L } = await import("leaflet");

      if (
        !mountedRef.current ||
        !mapRef.current ||
        !elementRef.current ||
        !isLeafletElement(elementRef.current)
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

      const maxCount = hotspots.length > 0 ? hotspots[0].count : 1;
      const bounds: [number, number][] = [];

      hotspots.forEach((area) => {
        if (
          area.latitude == null ||
          area.longitude == null ||
          !Number.isFinite(area.latitude) ||
          !Number.isFinite(area.longitude)
        )
          return;

        const intensity = maxCount > 0 ? area.count / maxCount : 0;
        // Skala radius dalam meter (300m s/d 1500m) agar pas di level zoom kota
        const radius = Math.max(300, 300 + intensity * 1200);
        const isRedZone = area.count >= 3;
        const color = isRedZone
          ? `rgba(220, 38, 38, ${0.3 + intensity * 0.5})`
          : `rgba(245, 158, 11, ${0.3 + intensity * 0.5})`;

        try {
          const circle = L.circle([area.latitude, area.longitude], {
            radius,
            color: isRedZone ? "#dc2626" : "#f59e0b",
            fillColor: color,
            fillOpacity: 0.6,
            weight: 2,
          })
            .bindPopup(
              `<div style="font-family:sans-serif;padding:4px;">
                <strong style="font-size:13px;">${area.name}</strong><br/>
                <span style="font-size:12px;color:#666;">${area.count} laporan</span><br/>
                <span style="font-size:11px;color:${isRedZone ? "#dc2626" : "#d97706"};font-weight:bold;">
                  ${isRedZone ? "Red Zone" : "Hotspot"}
                </span>
              </div>`,
            )
            .on("click", () => {
              if (mountedRef.current && selectRef.current) {
                selectRef.current(area);
              }
            });

          if (
            mapRef.current &&
            mountedRef.current &&
            elementRef.current &&
            isLeafletElement(elementRef.current)
          ) {
            circle.addTo(mapRef.current);
            markersRef.current.push(circle);
            bounds.push([area.latitude, area.longitude]);
          }
        } catch {
          // skip invalid marker
        }
      });

      if (
        bounds.length > 0 &&
        mapRef.current &&
        mountedRef.current &&
        elementRef.current &&
        isLeafletElement(elementRef.current)
      ) {
        try {
          mapRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
          requestAnimationFrame(() => {
            if (
              mountedRef.current &&
              mapRef.current &&
              elementRef.current &&
              isLeafletElement(elementRef.current)
            ) {
              try {
                mapRef.current!.invalidateSize();
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
  }, [hotspots, ready]);

  return (
    <div
      ref={elementRef}
      className="h-[500px] w-full bg-slate-100 xl:h-[620px]"
      aria-label="Peta hotspot analitik"
    />
  );
}
