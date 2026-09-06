"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { MarketplaceProduct, Seller } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export interface MarketplaceResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ProductPayload {
  title: string;
  slug: string;
  seller_name: string;
  seller_phone_whatsapp: string;
  price: number;
  category: string;
  stock: number;
  is_active: boolean;
  waste_impact_badge?: string;
  description?: string;
  thumbnail_url?: string | null;
}

type SupabaseClient = ReturnType<typeof getSupabaseAdminClient>;

async function resolveSellerId(
  admin: SupabaseClient,
  sellerName: string,
  phoneWhatsapp: string,
): Promise<string> {
  const trimmed = sellerName.trim();
  if (!trimmed) {
    throw new Error("Nama penjual tidak boleh kosong.");
  }

  const { data: existing, error: fetchError } = await admin
    .from("sellers")
    .select("*")
    .ilike("name", trimmed)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  if (existing) {
    const { error: updateError } = await admin
      .from("sellers")
      .update({ phone_whatsapp: phoneWhatsapp.trim() })
      .eq("id", (existing as Seller).id);

    if (updateError) {
      throw updateError;
    }
    return (existing as Seller).id;
  }

  const { data, error: insertError } = await admin
    .from("sellers")
    .insert({ name: trimmed, phone_whatsapp: phoneWhatsapp.trim() })
    .select("*")
    .single();

  if (insertError || !data) {
    throw insertError ?? new Error("Gagal membuat penjual baru.");
  }

  return (data as Seller).id;
}

async function uploadThumbnail(
  admin: SupabaseClient,
  imageFile: File,
  prefix: string,
): Promise<string> {
  const fileExt = imageFile.name.split(".").pop();
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await admin.storage
    .from("marketplace-bucket")
    .upload(filePath, imageFile, { upsert: true });

  if (uploadError) {
    throw new Error(`Upload gambar gagal: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("marketplace-bucket").getPublicUrl(filePath);

  return publicUrl;
}

export async function fetchMarketplaceData(): Promise<{
  products: MarketplaceProduct[];
  sellers: Seller[];
}> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    console.warn("[fetchMarketplaceData] Blocked:", guard.message);
    return { products: [], sellers: [] };
  }
  const admin = getSupabaseAdminClient();

  const [productsRes, sellersRes] = await Promise.all([
    admin
      .from("products")
      .select("*, seller:sellers(*)")
      .order("created_at", { ascending: false }),
    admin.from("sellers").select("*").order("name", { ascending: true }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (sellersRes.error) throw sellersRes.error;

  return {
    products: (productsRes.data as MarketplaceProduct[]) || [],
    sellers: (sellersRes.data as Seller[]) || [],
  };
}

export async function createProductServer(
  payload: ProductPayload,
  imageFile?: File,
): Promise<MarketplaceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();

  try {
    const sellerId = await resolveSellerId(
      admin,
      payload.seller_name,
      payload.seller_phone_whatsapp,
    );

    let thumbnailUrl: string | null = null;
    if (imageFile && imageFile instanceof File) {
      thumbnailUrl = await uploadThumbnail(admin, imageFile, "new");
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

    const { data, error: dbError } = await admin
      .from("products")
      .insert(insertData)
      .select("*, seller:sellers(*)")
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Gagal menambah produk (tidak ada row).");

    revalidatePath("/admin");
    return { success: true, data: data as MarketplaceProduct };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menambah produk.";
    console.error("createProductServer error:", err);
    return { success: false, error: msg };
  }
}

export async function updateProductServer(
  id: string,
  payload: ProductPayload,
  imageFile?: File,
): Promise<MarketplaceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();

  try {
    const sellerId = await resolveSellerId(
      admin,
      payload.seller_name,
      payload.seller_phone_whatsapp,
    );

    let thumbnailUrl: string | null | undefined = payload.thumbnail_url;
    if (imageFile && imageFile instanceof File) {
      thumbnailUrl = await uploadThumbnail(admin, imageFile, id);
    }

    const updateData: Record<string, unknown> = {
      title: payload.title,
      slug: payload.slug,
      seller_id: sellerId,
      price: payload.price,
      category: payload.category,
      stock: payload.stock,
      is_active: payload.is_active,
      waste_impact_badge: payload.waste_impact_badge || null,
      description: payload.description || null,
      updated_at: new Date().toISOString(),
    };

    if (thumbnailUrl !== undefined) {
      updateData.thumbnail_url = thumbnailUrl;
    }

    const { data, error: dbError } = await admin
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select("*, seller:sellers(*)")
      .maybeSingle();

    if (dbError) throw dbError;
    if (!data) throw new Error("Produk tidak ditemukan atau gagal diperbarui.");

    revalidatePath("/admin");
    return { success: true, data: data as MarketplaceProduct };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Gagal memperbarui produk.";
    console.error("updateProductServer error:", err);
    return { success: false, error: msg };
  }
}

export async function deleteProductServer(
  id: string,
): Promise<MarketplaceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();

  try {
    const { data: product, error: fetchError } = await admin
      .from("products")
      .select("thumbnail_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { data, error: dbError } = await admin
      .from("products")
      .delete()
      .eq("id", id)
      .select();

    if (dbError) throw dbError;
    if (!data || data.length === 0) {
      throw new Error("Produk tidak ditemukan atau gagal dihapus.");
    }

    const thumbnailUrl =
      typeof product?.thumbnail_url === "string" ? product.thumbnail_url : "";
    const marker = "/storage/v1/object/public/marketplace-bucket/";
    const markerIndex = thumbnailUrl.indexOf(marker);
    const thumbnailPath =
      markerIndex >= 0
        ? decodeURIComponent(thumbnailUrl.slice(markerIndex + marker.length))
        : null;

    if (thumbnailPath) {
      const { error: storageError } = await admin.storage
        .from("marketplace-bucket")
        .remove([thumbnailPath]);
      if (storageError) {
        console.error("deleteProduct thumbnail error:", storageError);
      }
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus produk.";
    console.error("deleteProductServer error:", err);
    return { success: false, error: msg };
  }
}

export async function updateStockServer(
  id: string,
  newStock: number,
): Promise<MarketplaceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();

  try {
    const { error: dbError } = await admin
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate stok.";
    console.error("updateStockServer error:", err);
    return { success: false, error: msg };
  }
}

export async function toggleActiveServer(
  id: string,
  isActive: boolean,
): Promise<MarketplaceResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.message };
  }
  const admin = getSupabaseAdminClient();

  try {
    const { error: dbError } = await admin
      .from("products")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (dbError) throw dbError;

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengubah status.";
    console.error("toggleActiveServer error:", err);
    return { success: false, error: msg };
  }
}
