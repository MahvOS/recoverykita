"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  hasSupabaseConfig,
  getSupabaseClient,
  MarketplaceProduct,
} from "@/lib/supabase";

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
    // split comma-separated string
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

      if (!hasSupabaseConfig) {
        setError(
          "Supabase belum dikonfigurasi. Silakan tambahkan variabel environment di Vercel.",
        );
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient();
        const { data, error: fetchError } = await client
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

  const totalSavedKg = useMemo(
    () =>
      products.reduce(
        (acc, p) => acc + (p.seller?.total_waste_saved_kg ?? 0),
        0,
      ),
    [products],
  );
  const featuredProducts = useMemo(() => products.slice(0, 3), [products]);

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      <Navbar />

      {/* HERO — asimetris */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-16 h-72 bg-gradient-to-br from-[#eaf6ee] via-[#f1f8f4] to-[#fcfefe] opacity-60 pointer-events-none"
        />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Headline kiri */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <p className="text-[11px] font-semibold tracking-wider text-[#198754] mb-3 uppercase">
                Marketplace Pengrajin Lokal
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f5132] leading-[1.1] tracking-tight">
                Barang layak pakai,
                <br />
                <span className="text-[#198754]">diselamatkan</span> dari tempat
                pembuangan.
              </h1>
              <p className="mt-5 text-sm sm:text-[15px] text-zinc-600 leading-relaxed max-w-md">
                Setiap tas, celana, dan keranjang di sini dibuat tangan oleh
                pengrajin dari limbah rumah tangga. Plastik jadi anyaman, denim
                jadipapan, kardus jadi binder.
              </p>

              <div className="mt-7 max-w-md">
                <div className="flex items-center bg-white border border-zinc-200 rounded-2xl sm:rounded-full px-4 sm:px-5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#198754]/25 focus-within:border-[#198754] transition-all">
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
            </div>

            {/* Kolase foto produk kanan */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <HeroCollage products={featuredProducts} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Mobile filters */}
        <div className="md:hidden mb-6 space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-2.5 w-max min-w-full pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${activeCategory === cat.id ? "bg-[#0f5132] text-white shadow-sm" : "bg-white border border-zinc-200 text-zinc-600 hover:border-[#198754] hover:text-[#0f5132]}"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Harga min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex-1 min-w-0 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white text-zinc-700"
            />
            <span className="text-zinc-400 text-xs">-</span>
            <input
              type="text"
              placeholder="Harga max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex-1 min-w-0 border border-zinc-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#198754]/30 focus:border-[#198754] bg-white text-zinc-700"
            />
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="w-56 sm:w-60 flex-shrink-0 hidden md:block">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <p className="text-sm text-zinc-500">
                Menampilkan{" "}
                <span className="font-semibold text-zinc-800">
                  {sorted.length} produk
                </span>
              </p>

              <div className="relative self-start sm:self-auto">
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
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4">
                {sorted.map((product) => {
                  const primaryImage =
                    product.thumbnail_url ||
                    normalizeGalleryUrls(
                      product.gallery_urls,
                      "/logo.ico",
                    )[0] ||
                    "/logo.ico";

                  const sellerName = product.seller?.name ?? "Seller";
                  const savedKg = product.seller?.total_waste_saved_kg ?? 0;
                  const badge =
                    product.waste_impact_badge ?? "Produk Daur Ulang";

                  return (
                    <Link
                      key={product.id}
                      href={`/marketplace/${product.slug}`}
                      className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                        {savedKg > 0 && (
                          <span className="absolute top-2 right-2 z-10 bg-[#e8f5e9]/90 text-[#0f5132] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                            {Math.round(savedKg)} kg diselamatkan
                          </span>
                        )}
                        <Image
                          src={primaryImage}
                          alt={product.title ?? "Produk"}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <p className="text-[11px] text-zinc-400 font-medium">
                            {sellerName}
                          </p>
                          <h3 className="font-bold text-zinc-900 text-sm leading-tight group-hover:text-[#198754] transition-colors">
                            {product.title}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                              {product.category ?? "Kategori"}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                              Stok: {product.stock ?? 0}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${product.is_active ? "bg-emerald-50 text-[#198754]" : "bg-rose-50 text-rose-700"}`}
                            >
                              {product.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-900">
                            {formatPrice(product.price)}
                          </span>
                          <button className="w-9 h-9 sm:w-8 sm:h-8 bg-[#e8f5e9] text-[#0f5132] rounded-xl flex items-center justify-center hover:bg-[#0f5132] hover:text-white transition-colors flex-shrink-0">
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

      <footer className="bg-white border-t border-zinc-200/60 mt-12 sm:mt-16 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/logosingle.ico"
                  alt="RecoveryKita Logo"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

function HeroCollage({
  products,
  loading,
}: {
  products: MarketplaceProduct[];
  loading: boolean;
}) {
  const placeholders = ["/logo.ico", "/logo.ico", "/logo.ico"];
  const items = loading
    ? placeholders
    : [
        products[0]?.thumbnail_url || placeholders[0],
        products[1]?.thumbnail_url || placeholders[1],
        products[2]?.thumbnail_url || placeholders[2],
      ];

  return (
    <div className="relative h-[320px] sm:h-[400px] lg:h-[520px]">
      {/* Foto utama */}
      <div className="absolute top-0 right-2 sm:right-6 w-[58%] h-[68%] rotate-[2deg] rounded-2xl shadow-xl border border-zinc-200/60 overflow-hidden bg-white">
        <Image
          src={items[0] ?? "/logo.ico"}
          alt="Karya utama"
          fill
          sizes="(max-width: 1024px) 60vw, 40vw"
          className="object-cover"
          priority
        />
        <span className="absolute bottom-3 left-3 z-10 bg-[#e8f5e9]/90 text-[#0f5132] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
          Karya pilihan
        </span>
      </div>

      {/* Foto kedua */}
      <div className="absolute bottom-2 right-0 w-[42%] h-[44%] -rotate-[3deg] rounded-2xl shadow-lg border border-zinc-200/60 overflow-hidden bg-white">
        <Image
          src={items[1] ?? "/logo.ico"}
          alt="Karya kedua"
          fill
          sizes="(max-width: 1024px) 45vw, 30vw"
          className="object-cover"
        />
        <span className="absolute bottom-2 right-2 z-10 bg-[#e8f5e9]/90 text-[#0f5132] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
          Pengrajin lokal
        </span>
      </div>

      {/* Foto ketiga — aksen */}
      <div className="absolute top-[40%] left-0 w-[34%] h-[36%] rotate-[4deg] rounded-2xl shadow-lg border border-zinc-200/60 overflow-hidden bg-white">
        <Image
          src={items[2] ?? "/logo.ico"}
          alt="Karya ketiga"
          fill
          sizes="(max-width: 1024px) 35vw, 25vw"
          className="object-cover"
        />
        <span className="absolute top-2 left-2 z-10 bg-[#e8f5e9]/90 text-[#0f5132] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
          Baru
        </span>
      </div>
    </div>
  );
}
