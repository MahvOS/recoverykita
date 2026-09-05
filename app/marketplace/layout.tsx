import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace | RecoveryKita",
  description:
    "Pasar barang daur ulang buatan pengrajin lokal — tas, celana, dan keranjang dari limbah rumah tangga. Setiap pembelian menyelamatkan lingkungan.",
  openGraph: {
    title: "Marketplace | RecoveryKita",
    description:
      "Pasar barang daur ulang buatan pengrajin lokal. Setiap pembelian menyelamatkan lingkungan.",
    type: "website",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
