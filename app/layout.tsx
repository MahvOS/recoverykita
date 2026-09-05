import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://recoverykita.vercel.app"),
  title: {
    default: "RecoveryKita | Aksi Lokal, Dampak Global",
    template: "%s | RecoveryKita",
  },
  description:
    "Platform crowdsourced waste management untuk melaporkan titik sampah liar, memantau Red Zone, dan mendukung ekonomi sirkular lewat marketplace barang daur ulang pengrajin lokal.",
  keywords: [
    "sampah",
    "daur ulang",
    "lingkungan",
    "peta sampah",
    "marketplace daur ulang",
    "edukasi lingkungan",
    "zero waste",
    "RecoveryKita",
  ],
  authors: [
    { name: "PAPAN ATAS!" },
    { name: "Mahvin Aflah Mulyana" },
    { name: "Sulthan Fatin Aditya" },
    { name: "Muhammad Adzka Mumtaza" },
  ],
  creator: "PAPAN ATAS!",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://recoverykita.vercel.app",
    siteName: "RecoveryKita",
    title: "RecoveryKita | Aksi Lokal, Dampak Global",
    description:
      "Platform crowdsourced waste management — lapor titik sampah, lihat Red Zone, belanja barang daur ulang, dan pelajari gaya hidup sirkular.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RecoveryKita | Aksi Lokal, Dampak Global",
    description:
      "Lapor titik sampah, lihat peta Red Zone, belanja barang daur ulang. Semua gratis untuk warga.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="overflow-x-hidden font-sans">{children}</body>
    </html>
  );
}
