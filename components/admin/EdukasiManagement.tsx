"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Search,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useEdukasiData } from "@/hooks/useEdukasiData";
import type { EdukasiArticle } from "@/hooks/useEdukasiData";
import { RemoteImage } from "@/components/remote-image";
import { getAssets, uploadAsset, deleteAsset } from "@/actions/assetActions";
import { deleteArticle } from "@/actions/edukasiActions";
import type { DownloadableAsset } from "@/lib/supabase";

interface DeleteConfirmProps {
  article: EdukasiArticle;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteConfirm({
  article,
  onCancel,
  onConfirm,
  loading,
}: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900">
            Hapus Artikel
          </h3>
        </div>
        <p className="text-sm text-zinc-600 mb-2">
          Apakah Anda yakin ingin menghapus artikel{" "}
          <span className="font-bold">&quot;{article.title}&quot;</span>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          Data kuis, pertanyaan, dan opsi terkait akan ikut dihapus secara
          permanen.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EdukasiManagement() {
  const router = useRouter();
  const { articles, loading, error, refetch } = useEdukasiData();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EdukasiArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [assets, setAssets] = useState<DownloadableAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFileType, setUploadFileType] = useState("pdf");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        (a.author_name ?? "").toLowerCase().includes(query),
    );
  }, [articles, search]);

  const loadAssets = async () => {
    setAssetsLoading(true);
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (err) {
      console.error("Gagal memuat aset:", err);
    } finally {
      setAssetsLoading(false);
    }
  };

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAssets();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteArticle(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      setDeleteTarget(null);
      await refetch();
    }
  };

  const handleEdit = (article: EdukasiArticle) => {
    router.push(`/admin/edukasi/${article.id}/edit`);
  };

  const handleCreate = () => {
    router.push(`/admin/edukasi/create`);
  };

  const handleAssetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", uploadTitle.trim());
    formData.append("description", uploadDescription.trim());
    formData.append("file_type", uploadFileType);

    const result = await uploadAsset(formData);

    if (result.success && result.data) {
      setAssets((prev) => [result.data, ...prev]);
      setUploadTitle("");
      setUploadDescription("");
      setUploadFileType("pdf");
      setUploadFile(null);
      setShowUploadForm(false);
    } else {
      setUploadError(result.error || "Gagal mengunggah aset.");
    }

    setUploading(false);
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus aset ini?")) return;

    const result = await deleteAsset(assetId);
    if (result.success) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      await loadAssets();
    } else {
      alert(result.error || "Gagal menghapus aset.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
            Edukasi
          </h1>
          <p className="text-sm text-zinc-500">
            Kelola artikel, video, dan panduan edukasi termasuk kuis interaktif.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refetch()}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Perbarui
          </button>
          <button
            onClick={handleCreate}
            className="h-10 rounded-lg bg-[#0f5132] px-5 text-sm font-bold text-white hover:bg-[#198754] inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Artikel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => void refetch()}
            className="text-xs font-bold underline hover:no-underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari artikel atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm align-middle">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Thumbnail
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">Judul</th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Kategori
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Status Kuis
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-zinc-100 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Belum ada artikel. Klik tombol &quot;Tambah Artikel&quot;
                    untuk mulai.
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200">
                        {article.thumbnail_url ? (
                          <RemoteImage
                            src={article.thumbnail_url}
                            alt={article.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-zinc-900 text-sm block truncate max-w-[200px] sm:max-w-xs">
                        {article.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-700 truncate block max-w-[120px]">
                        {article.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {article.has_quiz ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-[#198754]">
                          Ada
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold bg-zinc-100 text-zinc-500">
                          Tidak Ada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(article)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0f5132] transition-colors"
                          aria-label={`Edit ${article.title}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(article)}
                          className="p-1.5 rounded-lg text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          aria-label={`Hapus ${article.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <DeleteConfirm
          article={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}

      {/* Asset Management Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900">
              Aset Edukasi
            </h2>
            <p className="text-xs text-zinc-500">
              Kelola panduan, poster, dan template unduhan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadForm((prev) => !prev)}
            className="h-9 rounded-lg bg-[#0f5132] px-4 text-xs font-bold text-white hover:bg-[#198754] inline-flex items-center gap-2 transition-colors"
          >
            {showUploadForm ? (
              <>
                <X className="w-4 h-4" />
                Tutup Form
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Aset
              </>
            )}
          </button>
        </div>

        {showUploadForm && (
          <form
            onSubmit={handleAssetUpload}
            className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-5 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Judul Aset
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Poster Kode Plastik"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">
                  Tipe File
                </label>
                <select
                  value={uploadFileType}
                  onChange={(e) => setUploadFileType(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754] bg-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="image">Image (JPEG/PNG)</option>
                  <option value="doc">DOC/DOCX</option>
                  <option value="xls">XLS/XLSX</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Deskripsi
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Deskripsi singkat aset ini..."
                rows={2}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                File
              </label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0f5132] file:text-white hover:file:bg-[#198754]"
                required
              />
              {uploadFile && (
                <p className="text-[11px] text-zinc-500">
                  Dipilih: {uploadFile.name} (
                  {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {uploadError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="h-9 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="h-9 rounded-lg bg-[#0f5132] px-4 text-sm font-bold text-white hover:bg-[#198754] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
          {assetsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-zinc-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-500">
              Belum ada aset unduhan. Klik tombol Upload Aset untuk mulai.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">
                      <FileText className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">
                        {asset.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {asset.description || asset.file_url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border border-zinc-200 rounded-full px-2.5 py-1">
                      {asset.file_type ?? "FILE"}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {asset.download_count ?? 0} unduhan
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      aria-label={`Hapus ${asset.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
