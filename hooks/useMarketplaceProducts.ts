"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type { MarketplaceProduct, Seller } from "@/lib/supabase";

export type { MarketplaceProduct } from "@/lib/supabase";
export type { Seller } from "@/lib/supabase";

export interface ProductPayload {
  title: string;
  slug: string;
  seller_id: string;
  price: number;
  category: string;
  stock: number;
  is_active: boolean;
  waste_impact_badge: string;
  description: string;
}

const selectQuery = "*, seller:sellers(*)";

async function uploadThumbnail(file: File): Promise<string> {
  const client = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `thumbnails/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: uploadError } = await client.storage
    .from("products")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = client.storage
    .from("products")
    .getPublicUrl(fileName);

  return urlData?.publicUrl ?? "";
}

export function useMarketplaceProducts() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!supabase || !hasSupabaseConfig) {
      setProducts([]);
      setLoading(false);
      setError("Supabase belum dikonfigurasi.");
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error: fetchError } = await client
        .from("products")
        .select(selectQuery)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setProducts((data as MarketplaceProduct[]) || []);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellers = useCallback(async () => {
    if (!supabase || !hasSupabaseConfig) {
      setSellers([]);
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error: fetchError } = await client
        .from("sellers")
        .select("*")
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      setSellers((data as Seller[]) || []);
    } catch (err) {
      console.error("Fetch sellers error:", err);
      setSellers([]);
    }
  }, []);

  const createProduct = useCallback(
    async (payload: ProductPayload, thumbnailFile?: File) => {
      setSaving(true);
      setError(null);

      try {
        if (!supabase || !hasSupabaseConfig) {
          throw new Error("Supabase belum dikonfigurasi.");
        }

        const client = getSupabaseClient() as any;
        let thumbnail_url: string | null = null;

        if (thumbnailFile) {
          thumbnail_url = await uploadThumbnail(thumbnailFile);
        }

        const {
          title,
          slug,
          seller_id,
          price,
          category,
          stock,
          is_active,
          waste_impact_badge,
          description,
        } = payload;

        const { data, error: insertError } = await client
          .from("products")
          .insert({
            title,
            slug,
            seller_id,
            price,
            category,
            stock,
            is_active,
            waste_impact_badge,
            description,
            thumbnail_url,
          })
          .select(selectQuery)
          .single();

        if (insertError) throw insertError;

        const created = (data as MarketplaceProduct) ?? null;
        if (created) {
          setProducts((prev) => [created, ...prev]);
        }
        return created;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal menyimpan produk.",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const updateProduct = useCallback(
    async (id: string, payload: ProductPayload, thumbnailFile?: File) => {
      setSaving(true);
      setError(null);

      try {
        if (!supabase || !hasSupabaseConfig) {
          throw new Error("Supabase belum dikonfigurasi.");
        }

        const client = getSupabaseClient() as any;
        const {
          title,
          slug,
          seller_id,
          price,
          category,
          stock,
          is_active,
          waste_impact_badge,
          description,
        } = payload;

        const updates: Record<string, unknown> = {
          title,
          slug,
          seller_id,
          price,
          category,
          stock,
          is_active,
          waste_impact_badge,
          description,
        };

        if (thumbnailFile) {
          updates.thumbnail_url = await uploadThumbnail(thumbnailFile);
        }

        updates.updated_at = new Date().toISOString();

        const { data, error: updateError } = await client
          .from("products")
          .update(updates)
          .eq("id", id)
          .select(selectQuery)
          .single();

        if (updateError) throw updateError;

        const updated = (data as MarketplaceProduct) ?? null;
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        }
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memperbarui produk.",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const deleteProduct = useCallback(async (id: string) => {
    setError(null);

    try {
      if (!supabase || !hasSupabaseConfig) {
        throw new Error("Supabase belum dikonfigurasi.");
      }

      const client = getSupabaseClient() as any;
      const { error: deleteError } = await client
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
      return false;
    }
  }, []);

  const updateStock = useCallback(async (id: string, newStock: number) => {
    setStockUpdatingId(id);
    setError(null);

    try {
      if (!supabase || !hasSupabaseConfig) {
        throw new Error("Supabase belum dikonfigurasi.");
      }

      const client = getSupabaseClient() as any;
      const { error: updateError } = await client
        .from("products")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) throw updateError;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui stok.");
      return false;
    } finally {
      setStockUpdatingId(null);
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean) => {
    setError(null);

    try {
      if (!supabase || !hasSupabaseConfig) {
        throw new Error("Supabase belum dikonfigurasi.");
      }

      const client = getSupabaseClient() as any;
      const { error: updateError } = await client
        .from("products")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status.");
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchProducts();
    void fetchSellers();
  }, [fetchProducts, fetchSellers]);

  useEffect(() => {
    void fetchProducts();
    void fetchSellers();
  }, [fetchProducts, fetchSellers]);

  const activeCount = products.filter(
    (p) => (p.stock ?? 0) > 0 && p.is_active === true,
  ).length;

  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= 3).length;

  return {
    products,
    sellers,
    loading,
    error,
    saving,
    stockUpdatingId,
    activeCount,
    lowStockCount,
    sellerCount: sellers.length,
    refetch: fetchProducts,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleActive,
  };
}
