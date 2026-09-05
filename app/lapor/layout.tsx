import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lapor Sampah | RecoveryKita",
  description:
    "Laporkan titik sampah liar di sekitarmu. Login, pilih lokasi di peta, tambahkan foto, dan kirim laporan ke tim kebersihan.",
  openGraph: {
    title: "Lapor Sampah | RecoveryKita",
    description:
      "Laporkan titik sampah liar di sekitarmu dengan mudah lewat peta interaktif.",
    type: "website",
  },
};

export default function LaporLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
