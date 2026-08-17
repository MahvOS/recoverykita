"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, MarketplaceProduct } from "@/lib/supabase";

const sortOptions = ["Terbaru", "Harga Terendah", "Harga Tertinggi"];

function normalizeGalleryUrls(
  value: string | string[] | null | undefined,
  fallback: string,
) {
  if (Array.isArray(value)) {
    const filtered = value.filter(Boolean);
    return filtered.length ? filtered : [fallback];
  }

  if (!value) return [fallback];

  try {
    const parsed = JSON.parse(value as string);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(Boolean);
      return filtered.length ? filtered : [fallback];
    }
  } catch {
    // split
  }

  const splitValue = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return splitValue.length ? splitValue : [fallback];
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("Terbaru");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*, seller:sellers(*)")
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setProducts((data as MarketplaceProduct[]) || []);
      } catch (err) {
        console.error("Fetch products error:", err);
        setError("Gagal memuat marketplace. Coba lagi nanti.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean)),
    );
    return [
      { id: "all", label: "Semua Kategori" },
      ...unique.map((category) => ({ id: category, label: category })),
    ];
  }, [products]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const sellerName = product.seller?.name ?? "";
      const productName = product.title ?? "";
      const matchCat =
        activeCategory === "all" || product.category === activeCategory;
      const matchMin = !minPrice || product.price >= Number(minPrice || 0);
      const matchMax =
        !maxPrice ||
        product.price <= Number(maxPrice || Number.MAX_SAFE_INTEGER);
      const matchSearch =
        !query ||
        productName.toLowerCase().includes(query) ||
        sellerName.toLowerCase().includes(query) ||
        (product.description ?? "").toLowerCase().includes(query);

      return matchCat && matchMin && matchMax && matchSearch;
    });
  }, [products, activeCategory, minPrice, maxPrice, searchQuery]);

  const sorted = useMemo(() => {
    const items = [...filtered];

    if (sortBy === "Harga Terendah") {
      items.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "Harga Tertinggi") {
      items.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      items.sort(
        (a, b) =>
          Number(new Date(b.created_at ?? 0).getTime()) -
          Number(new Date(a.created_at ?? 0).getTime()),
      );
    }

    return items;
  }, [filtered, sortBy]);

  const formatPrice = (price: number) =>
    `Rp ${Number(price).toLocaleString("id-ID").replace(/,/g, ".")}`;

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
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
              className="text-sm font-semibold text-[#0f5132] border-b-2 border-[#198754] pb-1 transition-colors"
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
              className="text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
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

      <section className="bg-gradient-to-b from-[#eaf6ee] to-[#fbfcfa] py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#0f5132] mb-3 tracking-tight">
          Marketplace RecoveryKita
        </h1>
        <p className="text-zinc-500 text-sm md:text-base max-w-md mx-auto leading-relaxed mb-8">
          Dukung pengrajin lokal dan selamatkan lingkungan dengan setiap
          pembelian. Temukan produk daur ulang berkualitas.
        </p>

        <div className="max-w-xl mx-auto relative">
          <div className="flex items-center bg-white border border-zinc-200 rounded-full px-5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#198754]/25 focus-within:border-[#198754] transition-all">
            <svg
              className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0"
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
              placeholder="Cari produk daur ulang..."
              className="w-full text-zinc-800 placeholder-zinc-400 bg-transparent border-none focus:outline-none text-sm"
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">
          <aside className="w-52 flex-shrink-0 hidden md:block">
            <div className="mb-8">
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Kategori
              </p>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat.id ? "bg-[#e8f5e9] text-[#0f5132] font-semibold" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">
                Harga
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white text-zinc-700"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="text"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white text-zinc-700"
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-500">
                Menampilkan{" "}
                <span className="font-semibold text-zinc-800">
                  {sorted.length} produk
                </span>
              </p>

              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 text-sm font-semibold text-[#0f5132] border border-zinc-200 rounded-xl px-4 py-2 bg-white hover:border-[#198754] transition-colors"
                >
                  {sortBy}
                  <svg
                    className={`w-4 h-4 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {sortOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#e8f5e9] transition-colors ${sortBy === opt ? "text-[#0f5132] font-semibold" : "text-zinc-600"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 h-80"
                  />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-zinc-500">
                Tidak ada produk yang cocok dengan filter Anda.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sorted.map((product) => {
                  const images = normalizeGalleryUrls(
                    product.gallery_urls,
                    product.thumbnail_url ?? "/logo.ico",
                  );
                  const sellerName = product.seller?.name ?? "Seller";
                  const badge =
                    product.waste_impact_badge ?? "Produk Daur Ulang";

                  return (
                    <Link
                      key={product.id}
                      href={`/marketplace/${product.slug}`}
                      className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                        <span className="absolute top-2 left-2 z-10 bg-[#e8f5e9]/90 text-[#0f5132] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                          <svg
                            className="w-3 h-3"
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
                          {badge}
                        </span>
                        <Image
                          src={images[0] ?? "/logo.ico"}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-zinc-400 font-medium">
                            {sellerName}
                          </p>
                          <h3 className="font-bold text-zinc-900 text-sm leading-tight group-hover:text-[#198754] transition-colors">
                            {product.title}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-900">
                            {formatPrice(product.price)}
                          </span>
                          <button className="w-8 h-8 bg-[#e8f5e9] text-[#0f5132] rounded-xl flex items-center justify-center hover:bg-[#0f5132] hover:text-white transition-colors flex-shrink-0">
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
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-zinc-200/60 mt-16 py-12 px-6">
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
