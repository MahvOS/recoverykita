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
} from "lucide-react";
import { useEdukasiData } from "@/hooks/useEdukasiData";
import type { EdukasiArticle } from "@/hooks/useEdukasiData";
import { RemoteImage } from "@/components/remote-image";

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
  const { articles, loading, error, refetch, deleteArticle } = useEdukasiData();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EdukasiArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteArticle(deleteTarget.id);
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  const handleEdit = (article: EdukasiArticle) => {
    router.push(`/admin/edukasi/${article.id}/edit`);
  };

  const handleCreate = () => {
    router.push(`/admin/edukasi/create`);
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
    </div>
  );
}
