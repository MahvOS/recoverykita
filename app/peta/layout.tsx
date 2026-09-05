import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peta Laporan | RecoveryKita",
  description:
    "Lihat peta interaktif titik sampah liar di sekitarmu. Filter berdasarkan jenis, prioritas, dan status penanganan.",
  openGraph: {
    title: "Peta Laporan | RecoveryKita",
    description:
      "Peta interaktif titik sampah liar. Lihat, filter, dan laporkan dari sekitarmu.",
    type: "website",
  },
};

export default function PetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
