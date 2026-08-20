"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RemoteImage } from "@/components/remote-image";
import {
  getSupabaseClient,
  MarketplaceProduct,
  supabase,
} from "@/lib/supabase";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<
    MarketplaceProduct[]
  >([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mapStats, setMapStats] = useState({
    trashDump: 0,
    wasteBank: 0,
    communityAction: 0,
    total: 0,
  });
  const [mapStatsLoading, setMapStatsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      if (!supabase) {
        setProductsLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient() as any;
        const { data, error } = await client
          .from("products")
          .select("*, seller:sellers(*)")
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;
        setFeaturedProducts((data as MarketplaceProduct[]) ?? []);
      } catch (error) {
        console.error("Fetch home products error:", error);
        setFeaturedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const fetchMapStats = async () => {
      if (!supabase) {
        setMapStatsLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient() as any;
        const [{ data: locations }, { data: reports }] = await Promise.all([
          client.from("locations").select("category"),
          client
            .from("report_logs")
            .select("category, status")
            .eq("status", "pending"),
        ]);

        const categories = [
          ...((locations ?? []) as { category: string }[]),
          ...((reports ?? []) as { category: string }[]),
        ];

        const trashDump = categories.filter(
          (item) => item.category === "trash_dump",
        ).length;
        const wasteBank = categories.filter(
          (item) => item.category === "waste_bank",
        ).length;
        const communityAction = categories.filter(
          (item) => item.category === "community_action",
        ).length;

        setMapStats({
          trashDump,
          wasteBank,
          communityAction,
          total: categories.length,
        });
      } catch (error) {
        console.error("Fetch home map stats error:", error);
      } finally {
        setMapStatsLoading(false);
      }
    };

    fetchMapStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    if (
      query.includes("botol") ||
      query.includes("kaca") ||
      query.includes("plastik") ||
      query.includes("kertas") ||
      query.includes("logam") ||
      query.includes("anorganik")
    ) {
      setSearchResult(
        "Anorganik (Bisa didaur ulang! Silakan cuci bersih dahulu sebelum disalurkan).",
      );
    } else if (
      query.includes("sisa") ||
      query.includes("makanan") ||
      query.includes("daun") ||
      query.includes("sayur") ||
      query.includes("buah") ||
      query.includes("organik")
    ) {
      setSearchResult(
        "Organik (Bisa dijadikan kompos di rumah atau disalurkan ke eco-enzyme creator!).",
      );
    } else if (
      query.includes("baterai") ||
      query.includes("lampu") ||
      query.includes("obat") ||
      query.includes("b3") ||
      query.includes("kimia") ||
      query.includes("racun")
    ) {
      setSearchResult(
        "B3 - Bahan Berbahaya & Beracun (Butuh penanganan khusus! Salurkan ke titik pembuangan resmi).",
      );
    } else {
      setSearchResult(
        "Kategori tidak ditemukan. Coba ketik: 'botol', 'daun', atau 'baterai'.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      <header className="sticky top-0 z-50 w-full bg-[#fbfcfa]/85 backdrop-blur-md border-b border-[#e2e8f0]/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/3">
              <div className="relative w-37 h-37">
                <Image
                  src="/logo.ico"
                  alt="RecoveryKita Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-8 w-1/3">
              <a
                href="#"
                className="text-sm font-semibold text-[#0f5132] border-b-2 border-[#198754] pb-1 transition-colors"
              >
                Beranda
              </a>
              <a
                href="/marketplace"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Marketplace
              </a>
              <a
                href="/peta"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
              >
                Peta
              </a>
              <a
                href="/lapor"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors text-nowrap"
              >
                Lapor
              </a>
              <a
                href="/edukasi"
                className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors text-nowrap"
              >
                Edukasi
              </a>
            </nav>

            <div className="w-1/3 hidden md:block" />

            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex items-center p-2 rounded-lg hover:bg-zinc-100 transition-colors"
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
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0f5132] hover:bg-[#edf7ef]"
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
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

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-16">
        {/* 2. Centered Hero Section with Floating Illustrations */}
        <section className="relative rounded-[2.5rem] bg-gradient-to-br from-[#eaf6ee] via-[#f1f8f4] to-[#fcfefe] border border-[#e2f0e7] overflow-hidden px-6 py-16 md:py-24 flex flex-col items-center justify-center text-center gap-10">
          {/* Floating Illustrations in the Background matching the mockup positions exactly */}

          {/* Top Left: Cardboard Box (4.png) */}
          <div className="absolute top-10 left-10 w-40 h-40 md:w-70 md:h-70 opacity-25 sm:opacity-85 pointer-events-none select-none -rotate-[15deg] animate-float">
            <Image
              src="/4.png"
              alt="Cardboard Box outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Top Right: Burger (burger.png) */}
          <div
            className="absolute top-6 right-10 w-24 h-24 md:w-57 md:h-57 opacity-25 sm:opacity-85 pointer-events-none select-none rotate-[25deg] animate-float-slow"
            style={{ animationDelay: "1.5s" }}
          >
            <Image
              src="/burger.png"
              alt="Burger outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Middle Left: Plastic Bottle (7.png) - positioned behind left of search bar */}
          <div
            className="absolute top-[22%] left-[28%] w-24 h-24 md:w-60 md:h-60 opacity-20 sm:opacity-60 pointer-events-none select-none rotate-[35deg] animate-float-slow"
            style={{ animationDelay: "0.8s" }}
          >
            <Image
              src="/7.png"
              alt="Bottle outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Middle Right: Cup with Straw (1.png) - positioned behind right of search bar */}
          <div
            className="absolute top-[18%] right-[26%] w-24 h-24 md:w-57 md:h-57 opacity-20 sm:opacity-60 pointer-events-none select-none rotate-[15deg] animate-float"
            style={{ animationDelay: "2.2s" }}
          >
            <Image
              src="/1.png"
              alt="Cup outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Bottom Left: Crumpled Bag (plastic.png) */}
          <div
            className="absolute bottom-12 left-6 w-28 h-28 md:w-54 md:h-54 opacity-25 sm:opacity-85 pointer-events-none select-none -rotate-[10deg] animate-float"
            style={{ animationDelay: "3s" }}
          >
            <Image
              src="/plastic.png"
              alt="Plastic Bag outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Bottom Right: Fish Bone (2.png) */}
          <div
            className="absolute bottom-10 right-8 w-24 h-24 md:w-56 md:h-56 opacity-25 sm:opacity-85 pointer-events-none select-none rotate-[-15deg] animate-float-slow"
            style={{ animationDelay: "0.5s" }}
          >
            <Image
              src="/2.png"
              alt="Fish Bone outline"
              fill
              className="object-contain"
            />
          </div>

          {/* Hero Content Centered */}
          <div className="z-10 flex flex-col items-center gap-6 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-[#0f5132] leading-tight tracking-tight max-w-3xl">
              Belajar Pilah Sampah Jadi Berkah
            </h1>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed max-w-xl">
              Mulai langkah kecilmu untuk lingkungan. Cari tahu cara mengelola
              barang bekas di rumahmu agar bernilai kembali.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl sm:rounded-full p-2 border border-zinc-200/80 shadow-md shadow-zinc-100/50 transition-all focus-within:ring-2 focus-within:ring-[#198754]/25 focus-within:border-[#198754]">
                <div className="flex items-center flex-1 px-3.5 py-2 sm:py-0">
                  <svg
                    className="w-5 h-5 text-zinc-400 mr-2 flex-shrink-0"
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
                    placeholder="Cari benda: 'botol kaca', 'baterai', 'kertas'..."
                    className="w-full text-zinc-800 placeholder-zinc-400 bg-transparent border-none focus:outline-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#0f5132] text-white rounded-xl sm:rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#0c4028] transition-all flex items-center justify-center gap-1.5"
                >
                  Cari
                </button>
              </div>

              {/* Search Result Feedback */}
              {searchResult && (
                <div className="p-3.5 bg-white border border-[#198754]/20 rounded-xl shadow-sm text-xs md:text-sm animate-pulse-subtle flex items-start justify-center gap-2 text-[#0f5132] font-semibold mx-auto max-w-xl">
                  <svg
                    className="w-5 h-5 text-[#198754] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{searchResult}</span>
                </div>
              )}
            </form>

            {/* Waste Categories Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
              {/* Category 1: Organik */}
              <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 flex flex-col items-start text-left gap-4 group hover:shadow-md hover:border-zinc-200 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-[#0f5132] text-lg">
                    Organik
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Sisa makanan, daun, dahan. Bisa diolah jadi kompos subur.
                  </p>
                </div>
              </div>

              {/* Category 2: Anorganik */}
              <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 flex flex-col items-start text-left gap-4 group hover:shadow-md hover:border-zinc-200 transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-[#0f5132] text-lg">
                    Anorganik
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Plastik, kertas, kaca, logam. Bisa didaur ulang jadi barang
                    baru.
                  </p>
                </div>
              </div>

              {/* Category 3: B3 */}
              <div className="bg-white border border-zinc-100 shadow-sm rounded-3xl p-6 flex flex-col items-start text-left gap-4 group hover:shadow-md hover:border-zinc-200 transition-all duration-300">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-[#0f5132] text-lg">B3</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Baterai, lampu, obat kadaluarsa. Butuh penanganan khusus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Impact Stats Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a3622]">
              Dampak Lingkungan Kita
            </h2>
            <p className="text-zinc-500 text-sm md:text-base">
              Bersama kita membuat perubahan nyata untuk bumi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white border border-[#e2e8f0]/60 shadow-md shadow-zinc-100/50 rounded-2xl p-6 md:p-8 flex items-center gap-6 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8f5e9] text-[#198754] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#198754] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-[#0f5132] tracking-tight">
                  12.450{" "}
                  <span className="text-lg font-bold text-zinc-500">Kg</span>
                </p>
                <p className="text-sm font-semibold text-zinc-400">
                  Total Sampah Terkumpul
                </p>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white border border-[#e2e8f0]/60 shadow-md shadow-zinc-100/50 rounded-2xl p-6 md:p-8 flex items-center gap-6 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8f5e9] text-[#198754] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#198754] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-[#0f5132] tracking-tight">
                  4.2{" "}
                  <span className="text-lg font-bold text-zinc-500">Tons</span>
                </p>
                <p className="text-sm font-semibold text-zinc-400">
                  Pengurangan CO₂
                </p>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white border border-[#e2e8f0]/60 shadow-md shadow-zinc-100/50 rounded-2xl p-6 md:p-8 flex items-center gap-6 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-[#e8f5e9] text-[#198754] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#198754] group-hover:text-white transition-colors duration-300">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-[#0f5132] tracking-tight">
                  2.450{" "}
                  <span className="text-lg font-bold text-zinc-500">Orang</span>
                </p>
                <p className="text-sm font-semibold text-zinc-400">
                  Relawan Berpartisipasi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Real-time Map Preview Section */}
        <section
          id="peta"
          className="relative rounded-[2rem] bg-[#052617] text-white overflow-hidden py-12 px-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 border border-emerald-950"
        >
          {/* Map Vector Lines Overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen bg-cover bg-center">
            {/* Styled dynamic SVG representing local map road meshes */}
            <svg
              className="w-full h-full min-w-[800px]"
              viewBox="0 0 1000 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-10 100 H1010 M-10 300 H1010 M-10 500 H1010"
                stroke="#00ff88"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <path
                d="M100 -10 V610 M400 -10 V610 M700 -10 V610 M900 -10 V610"
                stroke="#00ff88"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              {/* Roads */}
              <path
                d="M100 100 L400 300 L700 300 L900 500"
                stroke="#00ff88"
                strokeWidth="3"
              />
              <path
                d="M200 500 L400 300 L900 100"
                stroke="#00ff88"
                strokeWidth="2.5"
              />
              <path
                d="M700 100 L700 300 L400 500"
                stroke="#00ff88"
                strokeWidth="3"
              />
              {/* Points */}
              <circle
                cx="400"
                cy="300"
                r="16"
                fill="#00ff88"
                fillOpacity="0.25"
                stroke="#00ff88"
                strokeWidth="2"
              />
              <circle cx="400" cy="300" r="6" fill="#00ff88" />
              <circle
                cx="700"
                cy="300"
                r="14"
                fill="#00ff88"
                fillOpacity="0.2"
                stroke="#00ff88"
                strokeWidth="2"
              />
              <circle cx="700" cy="300" r="5" fill="#00ff88" />
              <circle
                cx="900"
                cy="500"
                r="14"
                fill="#00ff88"
                fillOpacity="0.2"
                stroke="#00ff88"
                strokeWidth="2"
              />
              <circle cx="900" cy="500" r="5" fill="#00ff88" />
            </svg>
          </div>

          <div className="z-10 flex-1 space-y-6 max-w-xl">
            <span className="inline-block border border-[#20c997] text-[#20c997] text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full tracking-wider bg-[#20c997]/10 uppercase">
              Peta Titik Pilah
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Pantau Dampak Secara Real-Time
            </h2>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
              Temukan lokasi pengumpulan sampah terdekat, pantau volume sampah
              yang terkumpul, dan ikuti gerakan minimalisasi sampah di kotamu.
            </p>
            <button className="bg-[#20c997] text-[#052617] rounded-full px-6 py-3.5 text-sm font-bold hover:bg-[#1bb285] transition-all transform hover:scale-[1.03] inline-flex items-center gap-2 shadow-lg shadow-[#20c997]/25">
              <a href="/peta" className="text-inherit no-underline">
                Lihat Peta Lengkap
              </a>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>

          {/* Interactive Map Visual Elements */}
          <div className="flex-1 w-full z-10 flex items-center justify-center">
            <div className="w-full max-w-[450px] aspect-[16/10] bg-[#0c3822] rounded-2xl p-5 border border-emerald-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              {/* Glow effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between border-b border-emerald-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                    Live Map Feed
                  </span>
                </div>
              </div>

              {/* Live category summary from the map data */}
              <div className="space-y-3.5 py-4">
                <div className="flex items-center justify-between bg-[#072416]/80 backdrop-blur-md rounded-xl p-3 border border-emerald-900/50 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold">SAMPAH LIAR AKTIF</h4>
                      <p className="text-[10px] text-emerald-500/80">
                        Laporan pending dan titik terdata
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {mapStatsLoading ? "..." : mapStats.trashDump}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#072416]/80 backdrop-blur-md rounded-xl p-3 border border-emerald-900/50 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold">BANK SAMPAH</h4>
                      <p className="text-[10px] text-emerald-500/80">
                        Lokasi pengumpulan terdata
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {mapStatsLoading ? "..." : mapStats.wasteBank}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#072416]/80 backdrop-blur-md rounded-xl p-3 border border-emerald-900/50 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold">KOMUNITAS AKSI</h4>
                      <p className="text-[10px] text-emerald-500/80">
                        Gerakan lingkungan terdata
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {mapStatsLoading ? "..." : mapStats.communityAction}
                  </span>
                </div>
              </div>

              {/* Visual Footer */}
              <div className="text-[10px] text-emerald-500/50 flex justify-between">
                <span>Data peta terbaru</span>
                <span>
                  Active Nodes: {mapStatsLoading ? "..." : mapStats.total}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. UMKM Products Section */}
        <section id="marketplace" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a3622]">
                Produk Daur Ulang UMKM Lokal
              </h2>
              <p className="text-zinc-500 text-sm md:text-base">
                Dukung ekonomi lokal dengan membeli karya kreatif daur ulang.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="text-sm font-semibold text-[#198754] hover:text-[#0f5132] transition-colors inline-flex items-center gap-1 group"
            >
              <span>Lihat Semua</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`product-loading-${index}`}
                  className="aspect-square rounded-2xl bg-zinc-100 animate-pulse"
                />
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => {
                const imageUrl = product.thumbnail_url || "/logo.ico";
                const sellerName = product.seller?.name || "UMKM Lokal";
                const whatsapp = product.seller?.phone_whatsapp;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300"
                  >
                    <Link
                      href={`/marketplace/${product.slug}`}
                      className="relative aspect-square w-full bg-zinc-100 overflow-hidden"
                    >
                      <span className="absolute top-3 left-3 z-10 bg-[#fff3e0] text-[#e65100] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                        {product.waste_impact_badge || "Daur Ulang"}
                      </span>
                      <RemoteImage
                        src={imageUrl}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <Link
                          href={`/marketplace/${product.slug}`}
                          className="font-bold text-zinc-900 group-hover:text-[#198754] text-sm md:text-base transition-colors leading-tight line-clamp-2"
                        >
                          {product.title}
                        </Link>
                        <p className="text-xs text-zinc-400 font-medium">
                          {sellerName}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm md:text-base font-bold text-zinc-900">
                          Rp {Number(product.price).toLocaleString("id-ID")}
                        </span>
                        {whatsapp ? (
                          <a
                            href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#0f5132] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#0c4028] transition-colors"
                          >
                            Beli / WA
                          </a>
                        ) : (
                          <Link
                            href={`/marketplace/${product.slug}`}
                            className="bg-[#0f5132] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#0c4028] transition-colors"
                          >
                            Lihat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="sm:col-span-2 lg:col-span-4 text-sm text-zinc-500">
                Produk UMKM belum tersedia.
              </p>
            )}

            {false && (
              <>
                {/* Card 1: Tas Anyaman */}
                <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                  <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                    {/* 100% Recycled Badge */}
                    <span className="absolute top-3 left-3 z-10 bg-[#fff3e0] text-[#e65100] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                      ♻️ 100% Daur Ulang
                    </span>
                    <Image
                      src="/product_tas.png"
                      alt="Tas Anyaman Bungkus Kopi"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-zinc-900 group-hover:text-[#198754] text-sm md:text-base transition-colors leading-tight">
                        Tas Anyaman Bungkus Kopi
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        PT Rezeki Banten
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-bold text-zinc-900">
                        Rp 85.000
                      </span>
                      <button className="bg-[#0f5132] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0c4028] transition-colors">
                        Beli / WA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 2: Lampu Hias */}
                <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                  <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                    <span className="absolute top-3 left-3 z-10 bg-[#fff3e0] text-[#e65100] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                      ♻️ 100% Daur Ulang
                    </span>
                    <Image
                      src="/product_lampu.png"
                      alt="Lampu Hias Botol Upcycle"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-zinc-900 group-hover:text-[#198754] text-sm md:text-base transition-colors leading-tight">
                        Lampu Hias Botol Upcycle
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        PT Cahaya Lestari
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-bold text-zinc-900">
                        Rp 150.000
                      </span>
                      <button className="bg-[#0f5132] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0c4028] transition-colors">
                        Beli / WA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Set Jurnal */}
                <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                  <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                    <span className="absolute top-3 left-3 z-10 bg-[#fff3e0] text-[#e65100] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                      ♻️ 100% Daur Ulang
                    </span>
                    <Image
                      src="/product_jurnal.png"
                      alt="Set Jurnal Kertas Daur Ulang"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-zinc-900 group-hover:text-[#198754] text-sm md:text-base transition-colors leading-tight">
                        Set Jurnal Kertas Daur Ulang
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        PT Serat Lestari
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-bold text-zinc-900">
                        Rp 45.000
                      </span>
                      <button className="bg-[#0f5132] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0c4028] transition-colors">
                        Beli / WA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4: Pot Tanaman */}
                <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                  <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                    <span className="absolute top-3 left-3 z-10 bg-[#fff3e0] text-[#e65100] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                      ♻️ 100% Daur Ulang
                    </span>
                    <Image
                      src="/product_pot.png"
                      alt="Pot Tanaman Motif Terrazzo"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-zinc-900 group-hover:text-[#198754] text-sm md:text-base transition-colors leading-tight">
                        Pot Tanaman Motif Terrazzo
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">
                        PT Plastik Lestari
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm md:text-base font-bold text-zinc-900">
                        Rp 65.000
                      </span>
                      <button className="bg-[#0f5132] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#0c4028] transition-colors">
                        Beli / WA
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 6. Community Challenge Section */}
        <section id="lapor" className="space-y-8">
          <div className="text-left space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0a3622]">
              Tantangan Komunitas
            </h2>
            <p className="text-zinc-500 text-sm md:text-base">
              Ikuti tantangan ramah lingkungan dan dapatkan hadiah menarik.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Challenge Card 1: Zero Waste Week */}
            <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-all duration-300">
              {/* Left visual box */}
              <div className="w-full sm:w-40 aspect-square sm:h-40 rounded-2xl bg-[#e3edff] flex items-center justify-center text-blue-600 flex-shrink-0 relative overflow-hidden">
                <Image
                  src="/plastic.png"
                  alt="Zero Waste Challenge icon"
                  fill
                  className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-md">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right content details */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#198754] transition-colors leading-tight">
                      Zero Waste Week
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                    Kumpulkan minimal 5kg sampah plastik bersih dalam seminggu
                    untuk didaur ulang.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                    <span>5kg / 5kg</span>
                    <span className="text-[#198754]">Tantangan Selesai</span>
                  </div>
                </div>

                <button className="w-full bg-[#0f5132] text-white text-xs font-semibold py-3 rounded-xl hover:bg-[#0c4028] transition-colors">
                  Ikuti Tantangan
                </button>
              </div>
            </div>

            {/* Challenge Card 2: Plastic-Free July */}
            <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-all duration-300">
              {/* Left visual box */}
              <div className="w-full sm:w-40 aspect-square sm:h-40 rounded-2xl bg-[#e6f9f0] flex items-center justify-center text-emerald-600 flex-shrink-0 relative overflow-hidden">
                <Image
                  src="/plastic.png"
                  alt="Plastic-Free Challenge icon"
                  fill
                  className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-md">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right content details */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#198754] transition-colors leading-tight">
                      Plastic-Free July
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">
                    Hindari penggunaan kantong plastik sekali pakai selama
                    sebulan penuh.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: "33.33%" }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                    <span>10 hari / 30 hari</span>
                    <span className="text-[#0a3622]">Sisa 20 hari lagi</span>
                  </div>
                </div>

                <button className="w-full bg-[#0f5132] text-white text-xs font-semibold py-3 rounded-xl hover:bg-[#0c4028] transition-colors">
                  Ikuti Tantangan
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="bg-white border-t border-zinc-200/60 mt-20 py-12 px-6">
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
              Ekonomi Sirkular Indonesia.
            </p>
          </div>

          {/* Footer links */}
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-medium text-zinc-500">
            <a href="/" className="hover:text-[#198754] transition-colors">
              Beranda
            </a>
            <a
              href="/marketplace"
              className="hover:text-[#198754] transition-colors"
            >
              Marketplace
            </a>
            <a href="/peta" className="hover:text-[#198754] transition-colors">
              Peta
            </a>
            <a href="/lapor" className="hover:text-[#198754] transition-colors">
              Lapor
            </a>
            <a
              href="/edukasi"
              className="hover:text-[#198754] transition-colors"
            >
              Edukasi
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
