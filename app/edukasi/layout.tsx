import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pusat Edukasi | RecoveryKita",
  description:
    "Bacaan, panduan, dan kuis untuk gaya hidup sirkular. Pelajari cara mengelola sampah secara berkelanjutan.",
  openGraph: {
    title: "Pusat Edukasi | RecoveryKita",
    description:
      "Bacaan, panduan, dan kuis untuk gaya hidup sirkular. Materi gratis untuk semua.",
    type: "website",
  },
};

export default function EdukasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
