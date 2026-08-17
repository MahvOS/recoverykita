import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
