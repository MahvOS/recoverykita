"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { MarketplaceProduct, Seller } from "@/lib/supabase";
export type { MarketplaceProduct, Seller };
import type { ProductPayload } from "@/actions/marketplaceActions";
export type { ProductPayload } from "@/actions/marketplaceActions";
import {
  fetchMarketplaceData,
  createProductServer,
  updateProductServer,
  deleteProductServer,
  updateStockServer,
  toggleActiveServer,
} from "@/actions/marketplaceActions";

export function useMarketplaceProducts() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { products: fetchedProducts, sellers: fetchedSellers } =
        await fetchMarketplaceData();
      setProducts(fetchedProducts);
      setSellers(fetchedSellers);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil data produk.";
      console.error("Error fetching marketplace data:", err);
      setError(msg);
      setProducts([]);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const activeCount = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products],
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => (p.stock ?? 0) <= 3).length,
    [products],
  );

  const sellerCount = useMemo(() => {
    const names = products
      .map((p) => p.seller?.name)
      .filter((name): name is string => Boolean(name));

    const uniqueLower = new Set(names.map((name) => name.trim().toLowerCase()));

    return uniqueLower.size;
  }, [products]);

  const createProduct = async (
    payload: ProductPayload,
    imageFile?: File,
  ): Promise<MarketplaceProduct | null> => {
    setSaving(true);
    setError(null);

    try {
      const result = await createProductServer(payload, imageFile);

      if (result.success && result.data) {
        const created = result.data as MarketplaceProduct;
        setProducts((prev) => [created, ...prev]);
        await fetchData();
        return created;
      }

      setError(result.error || "Gagal menambah produk.");
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambah produk.";
      console.error("Error creating product:", err);
      setError(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (
    id: string,
    payload: ProductPayload,
    imageFile?: File,
  ): Promise<MarketplaceProduct | null> => {
    setSaving(true);
    setError(null);

    try {
      const result = await updateProductServer(id, payload, imageFile);

      if (result.success && result.data) {
        const updated = result.data as MarketplaceProduct;
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        await fetchData();
        return updated;
      }

      setError(result.error || "Gagal memperbarui produk.");
      return null;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memperbarui produk.";
      console.error("Error updating product:", err);
      setError(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const result = await deleteProductServer(id);

      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return true;
      }

      setError(result.error || "Gagal menghapus produk.");
      return false;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal menghapus produk.";
      console.error("Error deleting product:", err);
      setError(msg);
      return false;
    }
  };

  const updateStock = async (
    id: string,
    newStock: number,
  ): Promise<boolean> => {
    setStockUpdatingId(id);
    try {
      const result = await updateStockServer(id, newStock);

      if (result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
        );
        return true;
      }

      setError(result.error || "Gagal mengupdate stok.");
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengupdate stok.";
      console.error("Error updating stock:", err);
      setError(msg);
      return false;
    } finally {
      setStockUpdatingId(null);
    }
  };

  const toggleActive = async (
    id: string,
    isActive: boolean,
  ): Promise<boolean> => {
    try {
      const result = await toggleActiveServer(id, isActive);

      if (result.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
        );
        return true;
      }

      setError(result.error || "Gagal mengubah status.");
      return false;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengubah status.";
      console.error("Error toggling active state:", err);
      setError(msg);
      return false;
    }
  };

  return {
    products,
    sellers,
    loading,
    saving,
    stockUpdatingId,
    error,
    activeCount,
    lowStockCount,
    sellerCount,
    refetch: fetchData,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleActive,
  };
}
