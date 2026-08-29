"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  supabase,
  getSupabaseClient,
  MarketplaceProduct,
  Seller,
} from "@/lib/supabase";

export type { MarketplaceProduct };

export interface ProductPayload {
  title: string;
  slug: string;
  seller_name: string;
  price: number;
  category: string;
  stock: number;
  is_active: boolean;
  waste_impact_badge?: string;
  description?: string;
  thumbnail_url?: string | null;
}

export function useMarketplaceProducts() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [productsRes, sellersRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, seller:sellers(*)")
          .order("created_at", { ascending: false }),
        supabase.from("sellers").select("*").order("name", { ascending: true }),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (sellersRes.error) throw sellersRes.error;

      setProducts((productsRes.data as MarketplaceProduct[]) || []);
      setSellers((sellersRes.data as Seller[]) || []);
    } catch (err: any) {
      console.error("Error fetching marketplace data:", err);
      setError(err.message || "Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
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

  const resolveSellerId = async (sellerName: string): Promise<string> => {
    const trimmed = sellerName.trim();
    if (!trimmed) {
      throw new Error("Nama penjual tidak boleh kosong.");
    }

    const existing = sellers.find(
      (seller) => seller.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (existing) {
      return existing.id;
    }

    const client = getSupabaseClient();
    const { data, error: insertError } = await client
      .from("sellers")
      .insert({ name: trimmed })
      .select("id")
      .single();

    if (insertError || !data) {
      throw insertError ?? new Error("Gagal membuat penjual baru.");
    }

    const newSeller = data as { id: string };
    setSellers((prev) => [
      ...prev,
      { id: newSeller.id, name: trimmed } as Seller,
    ]);
    return newSeller.id;
  };

  const createProduct = async (
    payload: ProductPayload,
    imageFile?: File,
  ): Promise<MarketplaceProduct | null> => {
    if (!supabase) {
      setError("Client Supabase tidak tersedia.");
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      const sellerId = await resolveSellerId(payload.seller_name);
      let thumbnailUrl: string | null = null;

      if (imageFile && imageFile instanceof File) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("marketplace-bucket")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("marketplace-bucket")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      const insertData = {
        title: payload.title,
        slug: payload.slug,
        seller_id: sellerId,
        price: payload.price,
        category: payload.category,
        stock: payload.stock,
        is_active: payload.is_active,
        waste_impact_badge: payload.waste_impact_badge || null,
        description: payload.description || null,
        thumbnail_url: thumbnailUrl,
      };

      const { data, error: dbError } = await (supabase.from("products") as any)
        .insert(insertData)
        .select("*, seller:sellers(*)")
        .single();

      if (dbError) throw dbError;

      const created = data as MarketplaceProduct;
      setProducts((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err.message || "Gagal menambah produk.");
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
    if (!supabase) {
      setError("Client Supabase tidak tersedia.");
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      const sellerId = await resolveSellerId(payload.seller_name);
      let thumbnailUrl: string | null | undefined = payload.thumbnail_url;

      if (imageFile && imageFile instanceof File) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("marketplace-bucket")
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("marketplace-bucket")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      const updateData = {
        title: payload.title,
        slug: payload.slug,
        seller_id: sellerId,
        price: payload.price,
        category: payload.category,
        stock: payload.stock,
        is_active: payload.is_active,
        waste_impact_badge: payload.waste_impact_badge || null,
        description: payload.description || null,
        ...(thumbnailUrl !== undefined ? { thumbnail_url: thumbnailUrl } : {}),
        updated_at: new Date().toISOString(),
      };

      const { data, error: dbError } = await (supabase.from("products") as any)
        .update(updateData)
        .eq("id", id)
        .select("*, seller:sellers(*)")
        .single();

      if (dbError) throw dbError;

      const updated = data as MarketplaceProduct;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err.message || "Gagal memperbarui produk.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const client = getSupabaseClient() as any;
      const { data, error: dbError } = await client
        .from("products")
        .delete()
        .eq("id", id)
        .select();

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        throw new Error("Produk tidak ditemukan atau gagal dihapus.");
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError(err.message || "Gagal menghapus produk.");
      return false;
    }
  };

  const updateStock = async (
    id: string,
    newStock: number,
  ): Promise<boolean> => {
    if (!supabase) return false;

    setStockUpdatingId(id);
    try {
      const { error: dbError } = await (supabase.from("products") as any)
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
      );
      return true;
    } catch (err: any) {
      console.error("Error updating stock:", err);
      return false;
    } finally {
      setStockUpdatingId(null);
    }
  };

  const toggleActive = async (
    id: string,
    isActive: boolean,
  ): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { error: dbError } = await (supabase.from("products") as any)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) throw dbError;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)),
      );
      return true;
    } catch (err: any) {
      console.error("Error toggling active state:", err);
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
