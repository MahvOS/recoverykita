"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { DownloadableAsset } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getAssets(): Promise<DownloadableAsset[]> {
  const client = getSupabaseAdminClient();

  const { data, error } = await client
    .from("downloadable_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil daftar aset:", error);
    return [];
  }

  return (data || []) as DownloadableAsset[];
}

export async function uploadAsset(formData: FormData) {
  const client = getSupabaseAdminClient();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const fileType = (formData.get("file_type") as string | null)?.trim();

  if (!file || !title || !fileType) {
    return { success: false, error: "File, judul, dan tipe file wajib diisi." };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await client.storage
    .from("educational-assets")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Gagal mengunggah file:", uploadError);
    return { success: false, error: "Gagal mengunggah file." };
  }

  const {
    data: { publicUrl },
  } = client.storage.from("educational-assets").getPublicUrl(fileName);

  const { data, error: dbError } = await client
    .from("downloadable_assets")
    .insert({
      title,
      description: description || null,
      file_url: publicUrl,
      file_type: fileType,
      download_count: 0,
    })
    .select("*")
    .single();

  if (dbError) {
    console.error("Gagal menyimpan record aset:", dbError);
    await client.storage.from("educational-assets").remove([fileName]);
    return { success: false, error: "Gagal menyimpan data aset." };
  }

  revalidatePath("/admin/edukasi");
  revalidatePath("/edukasi");

  return { success: true, data: data as DownloadableAsset };
}

export async function deleteAsset(assetId: string) {
  const client = getSupabaseAdminClient();

  const { data: asset, error: fetchError } = await client
    .from("downloadable_assets")
    .select("file_url")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "Aset tidak ditemukan." };
  }

  const filePath = (asset.file_url as string).split("/").pop();
  if (filePath) {
    const { error: removeError } = await client.storage
      .from("educational-assets")
      .remove([filePath]);

    if (removeError) {
      console.error("Gagal menghapus file dari storage:", removeError);
    }
  }

  const { data: deleted, error: dbError } = await client
    .from("downloadable_assets")
    .delete()
    .eq("id", assetId)
    .select();

  if (dbError || !deleted || deleted.length === 0) {
    console.error("Gagal menghapus record aset:", dbError);
    return { success: false, error: "Gagal menghapus aset." };
  }

  revalidatePath("/admin/edukasi");
  revalidatePath("/edukasi");

  return { success: true };
}

export async function trackDownload(assetId: string) {
  const client = getSupabaseAdminClient();

  const { data: current, error: fetchError } = await client
    .from("downloadable_assets")
    .select("download_count")
    .eq("id", assetId)
    .single();

  if (fetchError || !current) {
    return { success: false };
  }

  const nextCount = (current.download_count ?? 0) + 1;

  const { error: updateError } = await client
    .from("downloadable_assets")
    .update({ download_count: nextCount })
    .eq("id", assetId);

  if (updateError) {
    console.error("Gagal mencatat download:", updateError);
    return { success: false };
  }

  return { success: true };
}
