"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RemoteImage } from "@/components/remote-image";
import {
  supabase,
  Article,
  CarbonFactor,
  WasteLookupGuide,
  DownloadableAsset,
  ContentFormat,
} from "@/lib/supabase";

const TOPIC_FILTERS = [
  "Semua Topik",
  "Daur Ulang",
  "Kompos",
  "Zero Waste",
  "DIY Upcycling",
  "Kebijakan Lingkungan",
];

const FORMAT_STYLES: Record<string, string> = {
  Artikel: "bg-[#e8f5e9] text-[#0f5132]",
  Video: "bg-[#e3edff] text-[#1d4ed8]",
  Infografis: "bg-[#fff3e0] text-[#c2410c]",
};

function formatViews(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k views`;
  }
  return `${count} views`;
}

function formatReadTime(
  format: ContentFormat | null,
  minutes: number | null,
): string {
  const mins = minutes ?? 5;
  if (format === "Video") return `${mins} menit tonton`;
  return `${mins} menit baca`;
}

function WasteIcon({ name }: { name: string | null }) {
  const key = (name ?? "").toLowerCase();

  if (
    key.includes("anorganik") ||
    key.includes("recycle") ||
    key.includes("recycling")
  ) {
    return (
      <svg
        className="w-8 h-8 sm:w-9 sm:h-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h10l-1.5 2.5M17 17H7l1.5-2.5M5 12h2m10 0h2M12 5V3m0 18v-2M8.5 8.5L6.7 6.7m10.6 10.6l-1.8-1.8M8.5 15.5L6.7 17.3m10.6-10.6l-1.8 1.8"
        />
      </svg>
    );
  }

  if (key.includes("organik") || key.includes("leaf")) {
    return (
      <svg
        className="w-8 h-8 sm:w-9 sm:h-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"
        />
      </svg>
    );
  }

  if (key.includes("b3") || key.includes("hazard") || key.includes("warning")) {
    return (
      <svg
        className="w-8 h-8 sm:w-9 sm:h-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-8 h-8 sm:w-9 sm:h-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3"
      />
    </svg>
  );
}

function AssetIcon({ type }: { type: string | null }) {
  const key = (type ?? "pdf").toLowerCase();
  if (key.includes("png") || key.includes("jpg") || key.includes("image")) {
    return (
      <svg
        className="w-10 h-10 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    );
  }
  if (key.includes("calendar") || key.includes("jadwal")) {
    return (
      <svg
        className="w-10 h-10 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-10 h-10 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default function EdukasiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [carbonFactors, setCarbonFactors] = useState<CarbonFactor[]>([]);
  const [wasteGuides, setWasteGuides] = useState<WasteLookupGuide[]>([]);
  const [assets, setAssets] = useState<DownloadableAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTopic, setActiveTopic] = useState("Semua Topik");
  const [weight, setWeight] = useState("");
  const [selectedWaste, setSelectedWaste] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<WasteLookupGuide | null>(
    null,
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [articlesRes, popularRes, carbonRes, guidesRes, assetsRes] =
          await Promise.all([
            supabase
              .from("articles")
              .select("*")
              .order("published_at", { ascending: false }),
            supabase
              .from("articles")
              .select("*")
              .order("views_count", { ascending: false })
              .limit(3),
            supabase.from("carbon_factors").select("*").order("waste_type"),
            supabase
              .from("waste_lookup_guides")
              .select("*")
              .order("category_name"),
            supabase
              .from("downloadable_assets")
              .select("*")
              .order("created_at", { ascending: false }),
          ]);

        if (!articlesRes.error && articlesRes.data)
          setArticles(articlesRes.data as Article[]);
        if (!popularRes.error && popularRes.data)
          setPopularArticles(popularRes.data as Article[]);
        if (!carbonRes.error && carbonRes.data) {
          const factors = carbonRes.data as CarbonFactor[];
          setCarbonFactors(factors);
          if (factors.length > 0) setSelectedWaste(factors[0].waste_type);
        }
        if (!guidesRes.error && guidesRes.data) {
          const guides = guidesRes.data as WasteLookupGuide[];
          setWasteGuides(guides);
          if (guides.length > 0) setSelectedGuide(guides[0]);
        }
        if (!assetsRes.error && assetsRes.data)
          setAssets(assetsRes.data as DownloadableAsset[]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredArticles = useMemo(() => {
    if (activeTopic === "Semua Topik") return articles;
    return articles.filter((a) => a.category === activeTopic);
  }, [articles, activeTopic]);

  const co2Result = useMemo(() => {
    const kg = parseFloat(weight);
    if (!kg || kg <= 0 || !selectedWaste) return null;
    const factor = carbonFactors.find((f) => f.waste_type === selectedWaste);
    if (!factor) return null;
    return (kg * Number(factor.co2_factor_per_kg)).toFixed(1);
  }, [weight, selectedWaste, carbonFactors]);

  const handleDownload = async (asset: DownloadableAsset) => {
    window.open(asset.file_url, "_blank", "noopener,noreferrer");
    await supabase
      .from("downloadable_assets")
      .update({ download_count: (asset.download_count ?? 0) + 1 })
      .eq("id", asset.id);
    setAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? { ...a, download_count: (a.download_count ?? 0) + 1 }
          : a,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#fbfcfa]/85 backdrop-blur-md border-b border-[#e2e8f0]/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 w-1/3">
            <Link href="/" className="relative w-37 h-37 block">
              <div className="relative w-37 h-37">
                <Image
                  src="/logo.ico"
                  alt="RecoveryKita Logo"
                  fill
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
              className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
            >
              Lapor
            </Link>
            <Link
              href="/edukasi"
              className="text-sm font-semibold text-[#0f5132] border-b-2 border-[#198754] pb-1 transition-colors"
            >
              Edukasi
            </Link>
          </nav>

          <div className="w-1/3 hidden md:block" />

          <button className="md:hidden flex items-center p-2 rounded-lg hover:bg-zinc-100 transition-colors">
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
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#0f5132] mb-3 tracking-tight">
          Pusat Edukasi RecoveryKita
        </h1>
        <p className="text-zinc-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Pelajari cara mengelola sampah secara berkelanjutan dan gaya hidup
          sirkular. Semua materi edukasi tersedia gratis untuk semua.
        </p>
      </section>

      <section className="bg-[#f0f7ff] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carbon Impact Calculator */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-extrabold text-[#0f5132] mb-1">
              Cek Dampak Sampahmu
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Hitung potensi reduksi emisi karbon dari sampah yang kamu kelola.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">
                  Berat (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Contoh: 2.5"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">
                  Jenis Sampah
                </label>
                <select
                  value={selectedWaste}
                  onChange={(e) => setSelectedWaste(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white text-zinc-800"
                >
                  {carbonFactors.map((f) => (
                    <option key={f.id} value={f.waste_type}>
                      {f.waste_type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#eaf6ee] border border-[#c3e6cb] rounded-xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">
                  Potensi Reduksi CO₂
                </p>
                <p className="text-2xl font-black text-[#0f5132]">
                  {co2Result !== null ? `${co2Result} kg` : "— kg"}
                </p>
              </div>
            </div>
          </div>

          {/* Waste Lookup */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 md:p-8">
            <h2 className="text-lg font-extrabold text-[#0f5132] mb-1">
              Interactive Waste Lookup
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Pilih kategori untuk melihat instruksi pembuangan.
            </p>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 mb-6">
              {wasteGuides.map((guide) => {
                const isActive = selectedGuide?.id === guide.id;
                const isB3 = guide.category_name.toLowerCase().includes("b3");
                const isOrganik = guide.category_name
                  .toLowerCase()
                  .includes("organik");
                const isAnorganik = guide.category_name
                  .toLowerCase()
                  .includes("anorganik");

                return (
                  <button
                    key={guide.id}
                    onClick={() => setSelectedGuide(guide)}
                    className={`flex min-h-[120px] sm:min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2.5 text-center transition-all ${
                      isActive
                        ? isB3
                          ? "border-red-400 bg-red-50 text-red-600"
                          : isOrganik
                            ? "border-blue-400 bg-blue-50 text-blue-600"
                            : isAnorganik
                              ? "border-amber-400 bg-amber-50 text-amber-700"
                              : "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200"
                    }`}
                  >
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/80 shadow-sm">
                      <WasteIcon
                        name={guide.icon_name ?? guide.category_name}
                      />
                    </div>
                    <span className="text-[10px] font-bold leading-tight sm:text-xs">
                      {guide.category_name}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedGuide && (
              <div className="bg-[#f8fafb] border border-zinc-100 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Contoh
                  </p>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {selectedGuide.examples}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Cara Buang
                  </p>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    {selectedGuide.disposal_instruction}
                  </p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-400 mt-4 italic">
              * Pilih kategori untuk melihat instruksi pembuangan.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {TOPIC_FILTERS.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTopic === topic
                  ? "bg-[#0f5132] text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-[#198754] hover:text-[#0f5132]"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Article Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[16/10] bg-zinc-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-zinc-100 rounded w-1/3" />
                      <div className="h-4 bg-zinc-100 rounded w-full" />
                      <div className="h-3 bg-zinc-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
                <p className="text-zinc-500 text-sm">
                  Belum ada artikel untuk topik ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/edukasi/${article.slug}`}
                    className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] w-full bg-zinc-100 overflow-hidden">
                      <span
                        className={`absolute top-3 left-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full ${FORMAT_STYLES[article.format ?? "Artikel"] ?? FORMAT_STYLES.Artikel}`}
                      >
                        {article.format ?? "Artikel"}
                      </span>
                      <RemoteImage
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <h3 className="font-bold text-zinc-900 text-sm md:text-base leading-snug group-hover:text-[#198754] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {article.summary}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-medium mt-auto pt-2">
                        {formatReadTime(
                          article.format,
                          article.read_time_minutes,
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
            {/* Popular Topics */}
            <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-5">
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-4">
                Topik Terpopuler
              </p>
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-2 bg-zinc-100 rounded w-1/3" />
                      <div className="h-3 bg-zinc-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-4">
                  {popularArticles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/edukasi/${article.slug}`}
                        className="group block"
                      >
                        <span className="text-[9px] font-bold text-[#198754] uppercase tracking-wider">
                          {article.category}
                        </span>
                        <p className="text-sm font-semibold text-zinc-800 group-hover:text-[#0f5132] transition-colors leading-snug mt-0.5 line-clamp-2">
                          {article.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          {formatViews(article.views_count ?? 0)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Downloadable Assets */}
      <section className="bg-white border-t border-zinc-100 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a3622] mb-2">
              Panduan & Poster Siap Cetak
            </h2>
            <p className="text-zinc-500 text-sm">
              Unduh materi edukasi gratis untuk RT/RW, sekolah, dan komunitasmu.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#f8fafb] rounded-2xl border border-zinc-100 p-6 h-64"
                />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm">
              Belum ada aset unduhan tersedia.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {assets.map((asset, idx) => (
                <div
                  key={asset.id}
                  className="bg-[#f8fafb] rounded-2xl border border-zinc-200/60 p-6 flex flex-col items-center text-center gap-4"
                >
                  <div className="w-full aspect-[4/3] bg-white rounded-xl border border-zinc-100 flex items-center justify-center">
                    <AssetIcon type={asset.file_type} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-zinc-900 text-sm">
                      {asset.title}
                    </h3>
                    {asset.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {asset.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload(asset)}
                    className={`w-full text-xs font-semibold py-3 rounded-xl transition-colors ${
                      idx === 0
                        ? "bg-[#0f5132] text-white hover:bg-[#0c4028]"
                        : "bg-white border border-zinc-300 text-zinc-800 hover:border-[#0f5132] hover:text-[#0f5132]"
                    }`}
                  >
                    {asset.file_type?.toUpperCase() === "PDF"
                      ? "Unduh PDF (Siap Cetak)"
                      : "Unduh Aset"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/60 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="relative w-7 h-7">
                <Image
                  src="/logo.ico"
                  alt="RecoveryKita Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-bold text-[#0f5132] tracking-tight">
                RecoveryKita
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} RecoveryKita. All rights reserved.{" "}
              <br className="md:hidden" />
              Menuju Ekonomi Sirkular Indonesia.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-medium text-zinc-500">
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
