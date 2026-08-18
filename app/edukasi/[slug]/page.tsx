"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RemoteImage } from "@/components/remote-image";
import { supabase, getSupabaseClient, Article } from "@/lib/supabase";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReadTime(format: string | null, minutes: number | null): string {
  const mins = minutes ?? 5;
  if (format === "Video") return `${mins} Menit Tonton`;
  return `${mins} Menit Baca`;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      setLoading(true);

      if (!supabase) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const client = getSupabaseClient() as any;
        const { data, error } = await client
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error || !data) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const articleData = data as Article;
        setArticle(articleData);

        await (client as any)
          .from("articles")
          .update({ views_count: (articleData.views_count ?? 0) + 1 })
          .eq("id", articleData.id);

        const { data: relatedData } = await (client as any)
          .from("articles")
          .select("*")
          .eq("category", articleData.category)
          .neq("id", articleData.id)
          .order("published_at", { ascending: false })
          .limit(2);

        if (relatedData) setRelated(relatedData as Article[]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#198754]/20 border-t-[#198754] rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-[#fbfcfa] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-semibold text-zinc-700">
          Artikel tidak ditemukan
        </p>
        <Link
          href="/edukasi"
          className="text-sm font-semibold text-[#198754] hover:text-[#0f5132] transition-colors"
        >
          ← Kembali ke Pusat Edukasi
        </Link>
      </div>
    );
  }

  const isHtml = article.content.trim().startsWith("<");

  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[#fbfcfa]/85 backdrop-blur-md border-b border-[#e2e8f0]/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col">
          <div className="h-20 flex items-center justify-between">
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
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0f5132] hover:bg-[#edf7ef]"
                >
                  Edukasi
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <nav className="text-xs text-zinc-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-[#198754] transition-colors">
            Beranda
          </Link>
          <span>›</span>
          <Link
            href="/edukasi"
            className="hover:text-[#198754] transition-colors"
          >
            Edukasi
          </Link>
          <span>›</span>
          <span className="text-zinc-600 font-medium">{article.category}</span>
        </nav>
      </div>

      {/* Hero Image + Title Overlay */}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-8">
        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] min-h-[220px] md:min-h-[320px]">
          <RemoteImage
            src={article.thumbnail_url}
            alt={article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 md:p-8 max-w-3xl shadow-lg">
              <h1 className="text-xl md:text-3xl font-black text-[#0f5132] leading-tight mb-4">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {article.author_name ?? "Tim Edukasi RecoveryKita"}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(article.published_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatReadTime(article.format, article.read_time_minutes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content + Sidebar */}
      <main className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-10">
          <article className="flex-1 min-w-0">
            {isHtml ? (
              <div
                className="article-content prose prose-zinc max-w-none
                  [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[#0f5132] [&_h2]:mt-8 [&_h2]:mb-4
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#0f5132] [&_h3]:mt-6 [&_h3]:mb-3
                  [&_p]:text-sm [&_p]:md:text-base [&_p]:text-zinc-700 [&_p]:leading-relaxed [&_p]:mb-4
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
                  [&_li]:text-sm [&_li]:text-zinc-700
                  [&_strong]:font-semibold [&_strong]:text-zinc-900"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="space-y-4">
                {article.content.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-sm md:text-base text-zinc-700 leading-relaxed"
                  >
                    {para}
                  </p>
                ))}
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-5">
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-4">
                  Artikel Terkait
                </p>
                <ul className="space-y-4">
                  {related.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/edukasi/${item.slug}`}
                        className="flex gap-3 group"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100">
                          <RemoteImage
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 group-hover:text-[#198754] transition-colors leading-snug line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            {formatDate(item.published_at)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-[#0f5132] rounded-2xl p-6 text-white space-y-4">
              <h3 className="font-extrabold text-base">
                Plastic-Free Challenge
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Uji pengetahuanmu tentang pengelolaan sampah plastik dan
                menangkan badge eco-warrior!
              </p>
              <button className="w-full bg-[#20c997] text-[#052617] text-xs font-bold py-3 rounded-xl hover:bg-[#1bb285] transition-colors">
                Ikuti Kuis Sekarang
              </button>
            </div>
          </aside>
        </div>
      </main>

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
