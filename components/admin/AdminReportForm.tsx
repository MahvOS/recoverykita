"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createAdminReport } from "@/actions/reportActions";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";

const categories = [
  { value: "trash_dump", label: "Titik Sampah Liar" },
  { value: "waste_bank", label: "Bank Sampah" },
  { value: "community_action", label: "Komunitas Aksi" },
];

const wasteTypes = [
  ["organik", "Organik"],
  ["plastik", "Plastik"],
  ["kertas", "Kertas"],
  ["logam", "Logam"],
  ["kaca", "Kaca"],
  ["b3", "B3"],
  ["elektronik", "Elektronik"],
] as const;

export default function AdminReportForm({
  onCreated,
}: {
  onCreated: () => Promise<void> | void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;

    let mounted = true;
    let map: LeafletMap | null = null;

    const initializeMap = async () => {
      const { default: L } = await import("leaflet");
      if (!mounted || !mapRef.current) return;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(mapRef.current, {
        center: [-6.2088, 106.8456],
        zoom: 12,
        zoomControl: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (event) => {
        const selectedLatitude = event.latlng.lat.toFixed(6);
        const selectedLongitude = event.latlng.lng.toFixed(6);
        setLatitude(selectedLatitude);
        setLongitude(selectedLongitude);

        if (markerRef.current) markerRef.current.remove();
        markerRef.current = L.marker(event.latlng).addTo(map as LeafletMap);
      });

      mapInstanceRef.current = map;
      window.setTimeout(() => map?.invalidateSize(), 0);
    };

    void initializeMap();

    return () => {
      mounted = false;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapInstanceRef.current = null;
    };
  }, [open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await createAdminReport(new FormData(event.currentTarget));
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Gagal membuat laporan.");
      return;
    }

    formRef.current?.reset();
    setLatitude("");
    setLongitude("");
    setOpen(false);
    await onCreated();
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-zinc-900">
            Buat Laporan Admin
          </h2>
          <p className="text-sm text-zinc-500">
            Tambahkan titik sampah, bank sampah, atau komunitas aksi langsung
            dari dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f5132] px-4 text-sm font-bold text-white hover:bg-[#198754]"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Tutup" : "Tambah Laporan"}
        </button>
      </div>

      {open && (
        <form
          ref={formRef}
          onSubmit={submit}
          className="mt-5 space-y-4 border-t border-zinc-100 pt-5"
        >
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700 md:col-span-2">
              Judul lokasi *
              <input
                name="title"
                required
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal"
                placeholder="Contoh: Bank Sampah Melati"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Jenis laporan *
              <select
                name="category"
                required
                defaultValue="trash_dump"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 font-normal"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Prioritas
              <select
                name="priority"
                defaultValue="sedang"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 font-normal"
              >
                <option value="rendah">Rendah</option>
                <option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-zinc-700">
                Pilih lokasi di peta *
              </p>
              <div
                ref={mapRef}
                className="mt-1 h-72 w-full overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Klik peta untuk mengisi latitude dan longitude.
              </p>
            </div>
            <label className="text-sm font-semibold text-zinc-700">
              Latitude *
              <input
                name="latitude"
                required
                readOnly
                value={latitude}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 font-normal"
                placeholder="Klik peta"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Longitude *
              <input
                name="longitude"
                required
                readOnly
                value={longitude}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 font-normal"
                placeholder="Klik peta"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700 md:col-span-2">
              Alamat / catatan lokasi
              <input
                name="address_notes"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700 md:col-span-2">
              Deskripsi *
              <textarea
                name="description"
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Nama pelapor
              <input
                name="reporter_name"
                defaultValue="Admin"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Nomor telepon
              <input
                name="reporter_phone"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Foto (maks. 3, opsional)
              <input
                name="photos"
                type="file"
                accept="image/*"
                multiple
                className="mt-1 block w-full text-sm font-normal"
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-zinc-700">
              Jenis sampah
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {wasteTypes.map(([value, label]) => (
                <label
                  key={value}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700"
                >
                  <input type="checkbox" name="waste_type" value={value} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f5132] px-5 text-sm font-bold text-white hover:bg-[#198754] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Laporan
          </button>
        </form>
      )}
    </section>
  );
}
