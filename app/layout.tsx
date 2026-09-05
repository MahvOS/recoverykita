import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Image from "next/image";
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
  title: "RecoveryKita | Aksi Lokal, Dampak Global",
  description:
    "RecoveryKita adalah platform yang menghubungkan individu, komunitas, dan organisasi untuk berkolaborasi dalam upaya pemulihan bencana. Dengan fokus pada aksi lokal dan dampak global, kami menyediakan sumber daya, informasi, dan jaringan untuk mendukung pemulihan yang berkelanjutan dan inklusif.",
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
