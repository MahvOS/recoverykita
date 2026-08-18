"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  supabase,
  getSupabaseClient,
  MarketplaceProduct,
} from "@/lib/supabase";

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
    // value may be a comma-separated string
  }

  const splitValue = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return splitValue.length ? splitValue : [fallback];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      if (!supabase) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from("products")
          .select("*, seller:sellers(*)")
          .eq("slug", slug)
          .single();

        if (error) {
          throw error;
        }

        setProduct((data as MarketplaceProduct) ?? null);
      } catch (err) {
        console.error("Fetch product detail error:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const images = useMemo(() => {
    if (!product) return ["/logo.ico"];
    return normalizeGalleryUrls(
      product.gallery_urls,
      product.thumbnail_url ?? "/logo.ico",
    );
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex items-center justify-center">
        <div className="text-center text-zinc-500">Memuat produk...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Produk tidak ditemukan.</p>
          <Link
            href="/marketplace"
            className="text-[#198754] font-semibold hover:underline"
          >
            ← Kembali ke Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) =>
    `Rp ${Number(price).toLocaleString("id-ID").replace(/,/g, ".")}`;

  const sellerName = product.seller?.name ?? "Seller";
  const sellerWhatsapp = product.seller?.phone_whatsapp ?? "";
  const badge = product.waste_impact_badge ?? "Produk Daur Ulang";
  const savedLabel = product.waste_impact_badge ?? "Produk Daur Ulang";

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      <header className="sticky top-0 z-50 w-full bg-[#fbfcfa]/85 backdrop-blur-md border-b border-[#e2e8f0]/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col">
          <div className="h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 w-1/3">
              <Link href="/" className="block">
                <div className="relative w-36 h-14">
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
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Beranda
                </Link>
                <Link
                  href="/marketplace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0f5132] hover:bg-[#edf7ef]"
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8">
          <Link
            href="/marketplace"
            className="hover:text-[#198754] transition-colors"
          >
            Marketplace
          </Link>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-400">Produk Daur Ulang</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-zinc-700 font-medium">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-zinc-100 aspect-square w-full mb-4">
              <span className="absolute top-4 left-4 z-10 bg-[#e8f5e9]/95 text-[#0f5132] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
                <svg
                  className="w-3.5 h-3.5"
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
                {savedLabel}
              </span>
              <Image
                src={images[activeImage]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === i ? "border-[#198754] shadow-md" : "border-transparent hover:border-zinc-300"}`}
                >
                  <Image
                    src={img}
                    alt={`${product.title} view ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#0f5132] font-bold mb-3">
              {product.category}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight mb-3">
              {product.title}
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              Dijual oleh{" "}
              <span className="font-semibold text-zinc-700">{sellerName}</span>
            </p>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-black text-zinc-900">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-[#0f5132] bg-[#e8f5e9] px-2.5 py-1 rounded-full font-semibold">
                {badge}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${isWishlisted ? "bg-[#0f5132] text-white border-[#0f5132]" : "border-zinc-200 text-zinc-700 hover:border-[#198754] hover:text-[#198754]"}`}
              >
                <svg
                  className="w-4 h-4"
                  fill={isWishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-8.5-4.9-10.5-9.2C.6 9.1 2.4 4 7.3 4c2 0 3.1 1 4.7 3 1.6-2 2.7-3 4.7-3 4.9 0 6.7 5.1 5.8 7.8C20.5 16.1 12 21 12 21z"
                  />
                </svg>
                {isWishlisted ? "Tersimpan" : "Simpan"}
              </button>

              <a
                href={
                  sellerWhatsapp
                    ? `https://wa.me/${sellerWhatsapp.replace(/\D/g, "")}`
                    : "#"
                }
                target={sellerWhatsapp ? "_blank" : undefined}
                rel={sellerWhatsapp ? "noreferrer" : undefined}
                className="flex-1 bg-[#198754] hover:bg-[#0f5132] text-white font-semibold px-5 py-2.5 rounded-xl text-center transition-colors"
              >
                Chat via WhatsApp
              </a>
            </div>

            <div className="border-t border-zinc-200 pt-6">
              <p className="text-sm font-semibold text-zinc-700 mb-3">
                Deskripsi Produk
              </p>
              <p className="text-sm text-zinc-600 leading-7 whitespace-pre-line">
                {product.description ?? "Tidak ada deskripsi."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">
                Penyelamatan
              </p>
              <p className="text-xl font-black text-[#0f5132]">
                {product.seller?.total_waste_saved_kg ?? 0} kg
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">
                Bahan Daur Ulang
              </p>
              <p className="text-sm font-semibold text-zinc-700">
                {savedLabel}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">
                Pengrajin
              </p>
              <p className="text-sm font-semibold text-zinc-700">
                {sellerName}
              </p>
            </div>
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
