"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type WasteCategory = "plastik" | "organik" | "b3" | "elektronik";
type Priority = "rendah" | "sedang" | "tinggi";

function normalizePhoneNumber(value: string): string {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("08")) return `+62${compact.slice(1)}`;
  if (compact.startsWith("62")) return `+${compact}`;
  return compact;
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function getInternalAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@accounts.recoverykita.local`;
}

interface FormData {
  location: string;
  latitude: number | null;
  longitude: number | null;
  category: WasteCategory;
  description: string;
  priority: Priority;
  photos: File[];
}

export default function LaporPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    location: "",
    latitude: null,
    longitude: null,
    category: "plastik",
    description: "",
    priority: "sedang",
    photos: [],
  });

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhoneNumber, setAuthPhoneNumber] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    let mounted = true;
    const client = getSupabaseClient();

    client.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
        setAuthChecked(true);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    setError("");

    try {
      const client = getSupabaseClient() as any;
      const username = normalizeUsername(authUsername);

      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        throw new Error(
          "Username harus 3-30 karakter dan hanya boleh berisi huruf kecil, angka, atau underscore.",
        );
      }

      if (authMode === "login") {
        const { error: loginError } = await client.auth.signInWithPassword({
          email: getInternalAuthEmail(username),
          password: authPassword,
        });
        if (loginError) throw loginError;
        setAuthMessage("Login berhasil. Form laporan sudah dapat digunakan.");
      } else {
        const phoneNumber = normalizePhoneNumber(authPhoneNumber);

        if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
          throw new Error(
            "Nomor telepon tidak valid. Gunakan format +628123456789 atau 08123456789.",
          );
        }

        const { data, error: registerError } = await client.auth.signUp({
          email: getInternalAuthEmail(username),
          password: authPassword,
          options: {
            data: {
              username,
              full_name: username,
              phone_number: phoneNumber,
            },
          },
        });
        if (registerError) throw registerError;

        if (data.user && data.session) {
          await client.from("profiles").upsert({
            id: data.user.id,
            full_name: username,
            phone_number: phoneNumber,
          });
          setAuthMessage(
            "Akun berhasil dibuat. Form laporan sudah dapat digunakan.",
          );
        } else {
          setAuthMessage(
            "Akun berhasil dibuat. Silakan login dengan username Anda.",
          );
          setAuthMode("login");
        }
      }
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "";
      setAuthMessage(message || "Autentikasi gagal. Silakan coba lagi.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await getSupabaseClient().auth.signOut();
    setUser(null);
    setAuthMessage("Anda sudah logout.");
  };

  // Initialize map
  useEffect(() => {
    if (!user || !mapRef.current || mapInstanceRef.current) return;

    const init = async () => {
      const L = (await import("leaflet")).default;

      if ((mapRef.current as any)?._leaflet_id) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Center of Indonesia (pas load mapnya)
      const map = L.map(mapRef.current!, {
        center: [-6.175392, 106.827153],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        }));

        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });

        L.marker([lat, lng]).addTo(map);
      });

      mapInstanceRef.current = map;
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [user]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      location: e.target.value,
    }));
  };

  const handleCategoryChange = (category: WasteCategory) => {
    setFormData((prev) => ({
      ...prev,
      category,
    }));
  };

  const handlePriorityChange = (priority: Priority) => {
    setFormData((prev) => ({
      ...prev,
      priority,
    }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (formData.photos.length + files.length > 3) {
      setError("Maksimal 3 foto");
      return;
    }

    for (const file of files) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Format harus JPG atau PNG");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran foto maksimal 5MB");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));

    // Generate preview
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError("");
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        throw new Error(
          "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di Vercel.",
        );
      }

      const client = getSupabaseClient() as any;
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      if (!currentUser) {
        throw new Error(
          "Anda harus login terlebih dahulu untuk mengirim laporan.",
        );
      }

      if (!formData.location) {
        throw new Error("Lokasi harus diisi");
      }
      if (!formData.category) {
        throw new Error("Kategori sampah harus dipilih");
      }
      if (!formData.description) {
        throw new Error("Keterangan tambahan harus diisi");
      }
      if (formData.photos.length === 0) {
        throw new Error("Minimal 1 foto harus diupload");
      }

      const { data: profile } = await client
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", currentUser.id)
        .maybeSingle();

      const photoUrls: string[] = [];
      for (let i = 0; i < formData.photos.length; i++) {
        const file = formData.photos[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        const { data: uploadData, error: uploadError } = await client.storage
          .from("report-photos")
          .upload(`photos/${fileName}`, file);

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = client.storage
          .from("report-photos")
          .getPublicUrl(`photos/${fileName}`);

        photoUrls.push(publicUrl);
      }

      const { error: insertError } = await client.from("report_logs").insert({
        user_id: currentUser.id,
        previous_status: "pending",
        new_status: "pending",
        category: formData.category,
        location_name: formData.location,
        description: formData.description,
        priority: formData.priority,
        photo_urls: photoUrls,
        reporter_name:
          profile?.full_name ??
          currentUser.user_metadata?.full_name ??
          "Pengguna RecoveryKita",
        reporter_phone:
          profile?.phone_number ??
          currentUser.user_metadata?.phone_number ??
          null,
        status: "pending",
        latitude: formData.latitude,
        longitude: formData.longitude,
        notes: `${formData.category} - ${formData.description} - Priority: ${formData.priority} - Location: ${formData.location} (${formData.latitude}, ${formData.longitude}) - Photos: ${photoUrls.join(", ")}`,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error(`Gagal menyimpan laporan: ${insertError.message}`);
      }

      setFormData({
        location: "",
        latitude: null,
        longitude: null,
        category: "plastik",
        description: "",
        priority: "sedang",
        photos: [],
      });
      setPreview([]);
      setSelectedLocation(null);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan tidak diketahui";
      console.error("Form submit error:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: {
    id: WasteCategory;
    label: string;
  }[] = [
    { id: "plastik", label: "Plastik" },
    { id: "organik", label: "Organik" },
    { id: "b3", label: "B3 / Berbahaya" },
    { id: "elektronik", label: "Elektronik" },
  ];

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#fbfcfa]/90 backdrop-blur-md border-b border-[#e2e8f0]/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/3">
              <Link href="/" className="block">
                <div className="relative w-37 h-37">
                  <Image
                    src="/logo.ico"
                    alt="RecoveryKita Logo"
                    fill
                    sizes="148px"
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-8 w-1/3">
              <Link
                href="/"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Beranda
              </Link>
              <Link
                href="/marketplace"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/peta"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Peta
              </Link>
              <Link
                href="/lapor"
                className="text-sm font-semibold text-[#0f5132] border-b-2 border-[#198754] pb-1 transition-colors"
              >
                Lapor
              </Link>
              <Link
                href="/edukasi"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Edukasi
              </Link>
            </nav>

            <div className="w-1/3 hidden md:block" />
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex items-center p-2 rounded-lg hover:bg-zinc-100"
            >
              <svg
                className="w-6 h-6 text-zinc-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16m-7 6h7"
                  }
                />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-b border-[#e2e8f0]/60 bg-[#fbfcfa] px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Beranda
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Marketplace
                </Link>
                <Link
                  href="/peta"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Peta
                </Link>
                <Link
                  href="/lapor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0f5132] hover:bg-[#edf7ef]"
                >
                  Lapor
                </Link>
                <Link
                  href="/edukasi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Edukasi
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ Laporan Anda berhasil dikirim! Terima kasih telah berkontribusi.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">✗ {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {!authChecked ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-200 text-center">
                <p className="text-zinc-600">Memuat Data..</p>
              </div>
            ) : !user ? (
              <div className="overflow-hidden bg-white rounded-3xl shadow-sm border border-zinc-200">
                <div className="bg-[#0f5132] px-8 py-8 text-white">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 7a3 3 0 11-6 0 3 3 0 016 0zM4 21a8 8 0 0116 0M19 8v6m3-3h-6"
                      />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold mb-2">
                    Masuk untuk Melaporkan
                  </h1>
                  <p className="text-sm leading-relaxed text-emerald-50/80">
                    Login dengan username dan password untuk membuka form
                    laporan titik sampah. Nomor telepon hanya disimpan sebagai
                    data profil.
                  </p>
                </div>

                <div className="p-8">
                  <div className="mb-6 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthMessage("");
                      }}
                      className={`rounded-lg py-2.5 text-sm font-semibold transition ${authMode === "login" ? "bg-white text-[#0f5132] shadow-sm" : "text-zinc-500"}`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthMessage("");
                      }}
                      className={`rounded-lg py-2.5 text-sm font-semibold transition ${authMode === "register" ? "bg-white text-[#0f5132] shadow-sm" : "text-zinc-500"}`}
                    >
                      Buat Akun
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === "register" && (
                      <input
                        type="tel"
                        value={authPhoneNumber}
                        onChange={(e) => setAuthPhoneNumber(e.target.value)}
                        placeholder="Nomor telepon profil, contoh +628123456789"
                        required
                        className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#198754] focus:border-transparent"
                      />
                    )}
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#198754] focus:border-transparent"
                    />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Password minimal 6 karakter"
                      minLength={6}
                      required
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#198754] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={authLoading || !supabase}
                      className="w-full bg-[#198754] hover:bg-[#0f5132] disabled:bg-zinc-300 text-white font-semibold py-3 rounded-xl transition"
                    >
                      {authLoading
                        ? "Memproses..."
                        : authMode === "login"
                          ? "Login"
                          : "Buat Akun"}
                    </button>
                  </form>

                  {authMessage && (
                    <p className="mt-4 text-sm text-[#0f5132]">{authMessage}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-200">
                <h1 className="text-3xl font-bold text-[#0f5132] mb-2">
                  Lapor Titik Sampah
                </h1>
                <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-xl bg-[#e8f5e9] text-sm">
                  <span className="text-[#0f5132]">
                    Login sebagai{" "}
                    {user.user_metadata?.full_name ?? user.phone ?? "Pengguna"}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-red-700 font-semibold hover:underline"
                  >
                    Logout
                  </button>
                </div>
                <p className="text-zinc-600 mb-6">
                  Partisipasi Anda sangat berharga! Laporkan titik sampah liar
                  di sekitar Anda agar segera ditindaklanjuti oleh komunitas dan
                  pihak terkait demi lingkungan yang lebih bersih.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Lokasi Sampah */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-3">
                      Lokasi Sampah
                    </label>
                    <div
                      ref={mapRef}
                      className="w-full h-72 rounded-xl border-2 border-zinc-300 mb-4 bg-zinc-100"
                      style={{ zIndex: 1 }}
                    />
                    <input
                      type="text"
                      placeholder="Cari alamat atau nama tempat..."
                      value={formData.location}
                      onChange={handleLocationChange}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#198754] focus:border-transparent bg-white"
                    />
                    {selectedLocation && (
                      <p className="mt-2 text-sm text-[#198754]">
                        ✓ Lokasi dipilih: {formData.location}
                      </p>
                    )}
                  </div>

                  {/* Foto Bukti */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-3">
                      Foto Bukti (Maks. 3 Foto)
                    </label>
                    <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center bg-zinc-50 hover:bg-zinc-100 transition cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <svg
                        className="mx-auto h-12 w-12 text-zinc-400 mb-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-12l-4-4h-8m20 24l-8-8m-6 0l-8 8m16-8v10"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="text-zinc-600">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#198754] font-medium hover:text-[#0f5132]"
                        >
                          Pilih File
                        </button>
                        {" atau drag & drop"}
                      </p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Format diizinkan: JPG, PNG (Maks 5MB)
                      </p>
                    </div>

                    {/* Photo Preview */}
                    {preview.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {preview.map((src, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                          >
                            <Image
                              src={src}
                              alt={`Preview ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kategori Sampah Utama */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-3">
                      Kategori Sampah Utama
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {categoryOptions.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`py-3 px-4 rounded-xl font-medium transition ${
                            formData.category === cat.id
                              ? "bg-[#198754] text-white"
                              : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keterangan Tambahan */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-3">
                      Keterangan Tambahan
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Jelaskan kondisi secara singkat, misalnya: 'Tumpukan sampah plastik di pinggir sungai, sudah mulai bau.'"
                      rows={4}
                      className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-[#198754] focus:border-transparent resize-none bg-white"
                    />
                  </div>

                  {/* Tingkat Prioritas */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 mb-3">
                      Tingkat Prioritas
                    </label>
                    <div className="flex gap-3">
                      {(["rendah", "sedang", "tinggi"] as Priority[]).map(
                        (priority) => {
                          const labels: Record<Priority, string> = {
                            rendah: "Rendah",
                            sedang: "Sedang",
                            tinggi: "Tinggi",
                          };

                          const colors: Record<Priority, string> = {
                            rendah:
                              "bg-green-100 text-green-800 border-green-300",
                            sedang:
                              "bg-yellow-100 text-yellow-800 border-yellow-300",
                            tinggi: "bg-red-100 text-red-800 border-red-300",
                          };

                          return (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => handlePriorityChange(priority)}
                              className={`px-4 py-2 rounded-xl font-medium border-2 transition ${
                                formData.priority === priority
                                  ? colors[priority]
                                  : `border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50`
                              }`}
                            >
                              ● {labels[priority]}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#198754] hover:bg-[#0f5132] disabled:bg-[#a3d9b5] text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      "Mengirim..."
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Kirim Laporan
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Guide Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-200 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-[#198754]">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#198754]">
                  Panduan Lapor
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    num: 1,
                    title: "Ambil Foto Jelas",
                    desc: "Pastikan tumpukan sampah terlihat jelas dari serikat lokasi jika memungkinkan.",
                  },
                  {
                    num: 2,
                    title: "Tandai Lokasi Akurat",
                    desc: "Gunakan pin peta atau tuliskan alamat lengkap agar relawan mudah menemukan lokasi.",
                  },
                  {
                    num: 3,
                    title: "Pantau Status",
                    desc: "Setelah diajukan, Anda dapat memantau proses pembersihan melalui halaman profil Anda",
                  },
                  {
                    num: 4,
                    title: "Identitas Aman",
                    desc: "Data pelapor dijaga kerahasiaannya.",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#e8f5e9] text-[#198754] font-semibold text-sm">
                        {item.num}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-zinc-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="border-t border-zinc-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.ico"
                    alt="RecoveryKita Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-white font-semibold">RecoveryKita</div>
              </div>
              <p className="text-sm">
                © 2026 RecoveryKita. All rights reserved. Menuju Ekonomi
                Sirkular Indonesia.
              </p>
              <div className="flex gap-6 mt-4 sm:mt-0">
                <Link href="/" className="hover:text-white">
                  Beranda
                </Link>
                <Link href="/marketplace" className="hover:text-white">
                  Marketplace
                </Link>
                <Link href="/peta" className="hover:text-white">
                  Peta
                </Link>
                <Link href="/lapor" className="hover:text-white">
                  Lapor
                </Link>
                <Link href="/edukasi" className="hover:text-white">
                  Edukasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
