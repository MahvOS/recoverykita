"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { MapReport } from "@/types/admin";
import "leaflet/dist/leaflet.css";

const isLeafletElement = (el: HTMLDivElement | null): boolean => {
  if (!el) return false;
  const id = (el as HTMLDivElement & { _leaflet_id?: string | number })
    ._leaflet_id;
  return typeof id !== "undefined" && id !== null;
};

export default function ReportMap({
  reports,
  selectedId,
  onSelect,
}: {
  reports: MapReport[];
  selectedId: string | null;
  onSelect: (r: MapReport) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
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

      const { default: L } = await import("leaflet");

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

        L.control.zoom({ position: "topright" }).addTo(mapInstance);
        L.tileLayer("https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        if (!mountedRef.current || initId !== initIdRef.current) {
          mapInstance.remove();
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

      const bounds: [number, number][] = [];

      reports.forEach((r) => {
        if (r.latitude == null || r.longitude == null) return;
        if (!Number.isFinite(r.latitude) || !Number.isFinite(r.longitude))
          return;
        if (Math.abs(r.latitude) > 90 || Math.abs(r.longitude) > 180) return;

        const selected = r.id === selectedId;
        const green = r.status === "completed" || r.status === "in_progress";

        const icon = L.divIcon({
          className: "",
          html: `<span style="display:grid;place-items:center;width:${selected ? 38 : 32}px;height:${selected ? 38 : 32}px;border-radius:9999px;background:${green ? "#22a968" : "#de756c"};border:3px solid white;box-shadow:0 3px 10px #0003;color:white;font:700 11px sans-serif">1</span>`,
          iconSize: [selected ? 38 : 32, selected ? 38 : 32],
          iconAnchor: [16, 16],
        });

        try {
          const marker = L.marker([r.latitude, r.longitude], {
            icon,
            title: r.location_name || "Laporan",
          }).on("click", () => {
            if (mountedRef.current && selectRef.current) {
              selectRef.current(r);
            }
          });

          if (
            mapRef.current &&
            mountedRef.current &&
            elementRef.current &&
            isLeafletElement(elementRef.current)
          ) {
            marker.addTo(mapRef.current);
            markersRef.current.push(marker);
            bounds.push([r.latitude, r.longitude]);
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
  }, [reports, selectedId, ready]);

  return (
    <div
      ref={elementRef}
      className="h-[500px] w-full bg-slate-100 xl:h-[620px]"
      aria-label="Peta sebaran laporan"
    />
  );
}
