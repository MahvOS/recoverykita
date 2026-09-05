import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";

const quickLinks = [
  { href: "/", label: "Beranda", desc: "Kembali ke halaman utama" },
  { href: "/lapor", label: "Lapor Sampah", desc: "Laporkan titik sampah liar" },
  { href: "/peta", label: "Peta Laporan", desc: "Lihat peta interaktif" },
  {
    href: "/marketplace",
    label: "Marketplace",
    desc: "Barang daur ulang pengrajin lokal",
  },
  { href: "/edukasi", label: "Edukasi", desc: "Artikel & kuis lingkungan" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fbfcfa] font-sans antialiased text-zinc-800">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 text-center">
        {/* Big illustration block */}
        <div className="relative mx-auto w-40 h-40 sm:w-56 sm:h-56 mb-6 sm:mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] blur-2xl opacity-60" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#eaf6ee] to-[#d6e9d8] border border-[#c3e6cb] flex items-center justify-center">
            <span className="font-black text-5xl sm:text-7xl text-[#0f5132] tracking-tight">
              404
            </span>
          </div>
          <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-2xl sm:text-3xl animate-float">
            🍃
          </div>
        </div>

        <p className="text-[11px] font-semibold tracking-wider text-[#198754] uppercase mb-2">
          Halaman tidak ditemukan
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f5132] tracking-tight mb-3 leading-tight">
          Tautan ini sudah terbuang
          <br className="hidden sm:block" />
          <span className="text-[#198754]">
            {" "}
            seperti sampah yang tak terkelola.
          </span>
        </h1>
        <p className="text-zinc-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed px-2 mb-8">
          Halaman yang kamu cari tidak ada, sudah dipindahkan, atau pernah
          dihapus.
        </p>

        {/* Back home CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f5132] text-white text-sm font-semibold rounded-2xl hover:bg-[#0c4028] transition-colors shadow-sm"
        >
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Kembali ke Beranda
        </Link>
      </main>

      <footer className="bg-white border-t border-zinc-200/60 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7">
              <Image
                src="/logosingle.ico"
                alt="RecoveryKita Logo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
              />
            </div>
            <span className="text-base font-bold text-[#0f5132] tracking-tight">
              RecoveryKita
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} RecoveryKita · Menuju Ekonomi Sirkular
            Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}
