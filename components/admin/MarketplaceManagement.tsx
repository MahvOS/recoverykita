"use client";

import React, {
  ComponentType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RemoteImage } from "@/components/remote-image";
import {
  Package,
  Users,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  Search,
} from "lucide-react";
import { useMarketplaceProducts } from "@/hooks/useMarketplaceProducts";
import type {
  MarketplaceProduct,
  ProductPayload,
} from "@/hooks/useMarketplaceProducts";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(price: number): string {
  return `Rp ${Number(price).toLocaleString("id-ID")}`;
}

interface StockStatus {
  label: string;
  className: string;
}

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) {
    return {
      label: "Habis",
      className: "bg-rose-50 text-rose-700 border border-rose-200",
    };
  }
  if (stock <= 3) {
    return {
      label: "Stok Menipis",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }
  return {
    label: "Tersedia",
    className: "bg-emerald-50 text-[#198754] border border-emerald-200",
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-sm shadow-zinc-100/50 hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight block">
          {value}
        </span>
      </div>
    </div>
  );
}

interface ProductForm {
  title: string;
  slug: string;
  seller_name: string;
  price: string;
  category: string;
  stock: string;
  description: string;
  waste_impact_badge: string;
  is_active: boolean;
  thumbnail_file: File | null;
  thumbnail_preview: string | null;
  thumbnail_existing: string | null;
}

const EMPTY_FORM: ProductForm = {
  title: "",
  slug: "",
  seller_name: "",
  price: "",
  category: "",
  stock: "",
  description: "",
  waste_impact_badge: "",
  is_active: true,
  thumbnail_file: null,
  thumbnail_preview: null,
  thumbnail_existing: null,
};

export default function MarketplaceManagement(): React.ReactElement {
  const {
    products,
    loading,
    error,
    saving,
    stockUpdatingId,
    activeCount,
    lowStockCount,
    sellerCount,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleActive,
  } = useMarketplaceProducts();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<MarketplaceProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<MarketplaceProduct | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const isEditMode = !!editingProduct;

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.category)
            .filter((c): c is string => Boolean(c) && c.trim() !== ""),
        ),
      ).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const sellerName = p.seller?.name?.toLowerCase() ?? "";
      return (
        (p.title?.toLowerCase() ?? "").includes(query) ||
        sellerName.includes(query) ||
        (p.category?.toLowerCase() ?? "").includes(query)
      );
    });
  }, [products, search]);

  const resetForm = () => {
    if (form.thumbnail_preview) {
      URL.revokeObjectURL(form.thumbnail_preview);
    }
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  };

  const openAdd = () => {
    resetForm();
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEdit = (product: MarketplaceProduct) => {
    if (form.thumbnail_preview) {
      URL.revokeObjectURL(form.thumbnail_preview);
    }
    setForm({
      title: product.title ?? "",
      slug: product.slug ?? "",
      seller_name: product.seller?.name ?? "",
      price: product.price != null ? String(product.price) : "",
      category: product.category ?? "",
      stock: product.stock != null ? String(product.stock) : "",
      description: product.description ?? "",
      waste_impact_badge: product.waste_impact_badge ?? "",
      is_active: product.is_active ?? false,
      thumbnail_file: null,
      thumbnail_preview: null,
      thumbnail_existing: product.thumbnail_url ?? null,
    });
    setSlugTouched(true);
    setEditingProduct(product);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : generateSlug(title),
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;

      if (form.thumbnail_preview) {
        URL.revokeObjectURL(form.thumbnail_preview);
      }

      setForm((prev) => ({
        ...prev,
        thumbnail_file: file,
        thumbnail_preview: URL.createObjectURL(file),
      }));
    }
  };

  const clearThumbnail = () => {
    if (form.thumbnail_preview) {
      URL.revokeObjectURL(form.thumbnail_preview);
    }
    setForm((prev) => ({
      ...prev,
      thumbnail_file: null,
      thumbnail_preview: null,
      thumbnail_existing: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildPayload = (): ProductPayload => ({
    title: form.title.trim(),
    slug: form.slug.trim(),
    seller_name: form.seller_name.trim(),
    price: Number(form.price) || 0,
    category: form.category.trim(),
    stock: Number(form.stock) || 0,
    is_active: form.is_active,
    waste_impact_badge: form.waste_impact_badge.trim(),
    description: form.description.trim(),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = buildPayload();
    if (!payload.title || !payload.seller_name) return;

    let result: MarketplaceProduct | null = null;

    if (isEditMode && editingProduct) {
      const fileToUpload = form.thumbnail_file
        ? form.thumbnail_file
        : undefined;

      result = await updateProduct(editingProduct.id, payload, fileToUpload);
    } else {
      result = await createProduct(payload, form.thumbnail_file ?? undefined);
    }

    if (result) {
      closeForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteProduct(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
            Pasar
          </h1>
          <p className="text-sm text-zinc-500">
            Kelola produk pasar sirkular dan stok mitra penjual.
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
            onClick={openAdd}
            className="h-10 rounded-lg bg-[#0f5132] px-5 text-sm font-bold text-white hover:bg-[#198754] inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Package}
          label="Total Produk Aktif"
          value={loading ? "—" : String(activeCount)}
          iconBg="bg-emerald-50 text-[#198754]"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stok Menipis / Habis"
          value={loading ? "—" : String(lowStockCount)}
          iconBg="bg-amber-50 text-amber-700"
        />
        <StatCard
          icon={Users}
          label="Total Mitra Penjual"
          value={loading ? "—" : String(sellerCount)}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Search Input Filter */}
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari produk atau penjual..."
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
                  Gambar
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Nama Produk
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Penjual
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">Harga</th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Kategori
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  Status Stok
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Stok
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Aktif
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8">
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-8 bg-zinc-100 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Belum ada produk yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onOpenEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onUpdateStock={updateStock}
                    onToggleActive={toggleActive}
                    stockUpdatingId={stockUpdatingId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <ProductFormModal
          open={formOpen}
          isEditMode={isEditMode}
          form={form}
          setForm={setForm}
          setSlugTouched={setSlugTouched}
          categories={categories}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          onTitleChange={handleTitleChange}
          onThumbnailChange={handleThumbnailChange}
          clearThumbnail={clearThumbnail}
          fileInputRef={fileInputRef}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function StockCell({
  product,
  onUpdateStock,
  stockUpdatingId,
}: {
  product: MarketplaceProduct;
  onUpdateStock: (id: string, value: number) => Promise<boolean>;
  stockUpdatingId: string | null;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const current = product.stock ?? 0;
  const busy = stockUpdatingId === product.id;

  const commit = (value: number) => {
    if (value < 0) value = 0;
    if (value === current || !Number.isFinite(value)) return;
    void onUpdateStock(product.id, value);
  };

  return (
    <div className="flex items-center gap-0.5 justify-center">
      <button
        type="button"
        onClick={() => commit(Math.max(0, current - 1))}
        disabled={busy}
        className="w-7 h-7 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white disabled:opacity-50 flex items-center justify-center text-sm font-bold"
        aria-label={`Kurangi stok ${product.title}`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "−"}
      </button>
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={draft === "" ? String(current) : draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setDraft(String(current))}
        onBlur={() => {
          const v = parseInt(draft, 10);
          setDraft("");
          if (!Number.isNaN(v)) commit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = parseInt(draft, 10);
            setDraft("");
            if (!Number.isNaN(v)) commit(v);
            inputRef.current?.blur();
          }
        }}
        disabled={busy}
        className="w-12 text-center text-sm font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#198754]/25 focus:border-[#198754] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => commit(current + 1)}
        disabled={busy}
        className="w-7 h-7 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-white disabled:opacity-50 flex items-center justify-center text-sm font-bold"
        aria-label={`Tambah stok ${product.title}`}
      >
        +
      </button>
    </div>
  );
}

function ActiveToggle({
  product,
  onToggle,
}: {
  product: MarketplaceProduct;
  onToggle: (id: string, isActive: boolean) => Promise<boolean>;
}) {
  const active = product.is_active ?? false;
  return (
    <div className="flex justify-center">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => void onToggle(product.id, !active)}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors outline-none ${
          active ? "bg-[#198754]" : "bg-zinc-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            active ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function ProductRow({
  product,
  onOpenEdit,
  onDelete,
  onUpdateStock,
  onToggleActive,
  stockUpdatingId,
}: {
  product: MarketplaceProduct;
  onOpenEdit: (product: MarketplaceProduct) => void;
  onDelete: (product: MarketplaceProduct) => void;
  onUpdateStock: (id: string, value: number) => Promise<boolean>;
  onToggleActive: (id: string, isActive: boolean) => Promise<boolean>;
  stockUpdatingId: string | null;
}) {
  const stock = product.stock ?? 0;
  const status = getStockStatus(stock);
  const thumbnail = product.thumbnail_url;

  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200">
          {thumbnail ? (
            <RemoteImage
              src={thumbnail}
              alt={product.title ?? "Produk"}
              fill
              className="object-cover"
            />
          ) : (
            <Package className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-900 text-sm block truncate max-w-[180px] sm:max-w-xs">
            {product.title ?? "—"}
          </span>
          {product.is_featured && (
            <span className="text-[9px] font-bold text-[#e65100] bg-[#fff3e0] px-1.5 py-0.5 rounded-full">
              Unggulan
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-zinc-700">
          {product.seller?.name ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-zinc-900">
          {formatPrice(product.price ?? 0)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-zinc-700 truncate block max-w-[120px]">
          {product.category ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <StockCell
          product={product}
          onUpdateStock={onUpdateStock}
          stockUpdatingId={stockUpdatingId}
        />
      </td>
      <td className="px-4 py-3">
        <ActiveToggle product={product} onToggle={onToggleActive} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenEdit(product)}
            className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#0f5132] transition-colors"
            aria-label={`Edit ${product.title}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="p-1.5 rounded-lg text-zinc-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            aria-label={`Hapus ${product.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeleteConfirm({
  product,
  onCancel,
  onConfirm,
}: {
  product: MarketplaceProduct;
  onCancel: () => void;
  onConfirm: () => void;
}) {
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
          <h3 className="text-lg font-extrabold text-zinc-900">Hapus Produk</h3>
        </div>
        <p className="text-sm text-zinc-600 mb-2">
          Apakah Anda yakin ingin menghapus produk{" "}
          <span className="font-bold">&quot;{product.title}&quot;</span>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          Data produk tidak dapat dikembalikan setelah dihapus.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductFormModalProps {
  open: boolean;
  isEditMode: boolean;
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  setSlugTouched: (v: boolean) => void;
  categories: string[];
  saving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearThumbnail: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function ProductFormModal({
  open,
  isEditMode,
  form,
  setForm,
  setSlugTouched,
  categories,
  saving,
  onSubmit,
  onCancel,
  onTitleChange,
  onThumbnailChange,
  clearThumbnail,
  fileInputRef,
}: ProductFormModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!open || !isMounted) return null;

  const preview = form.thumbnail_preview ?? form.thumbnail_existing;
  const updateField = (field: keyof ProductForm, value: string | boolean) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900">
              {isEditMode ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <p className="text-sm text-zinc-500">
              Lengkapi informasi produk marketplace.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-zinc-700">
              Judul Produk
              <input
                required
                value={form.title}
                onChange={onTitleChange}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Slug
              <input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value);
                }}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Penjual
              <input
                required
                value={form.seller_name}
                onChange={(e) => updateField("seller_name", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Kategori
              <select
                required
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 font-normal outline-none focus:border-[#198754]"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Harga
              <input
                required
                min="0"
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
              />
            </label>
            <label className="text-sm font-semibold text-zinc-700">
              Stok
              <input
                required
                min="0"
                type="number"
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-zinc-700">
            Badge Dampak
            <input
              value={form.waste_impact_badge}
              onChange={(e) =>
                updateField("waste_impact_badge", e.target.value)
              }
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 font-normal outline-none focus:border-[#198754]"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Deskripsi
            <textarea
              required
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-[#198754]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField("is_active", e.target.checked)}
              className="rounded accent-[#0f5132]"
            />{" "}
            Produk aktif
          </label>
          <div className="space-y-2 text-sm font-semibold text-zinc-700">
            Thumbnail
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onThumbnailChange}
              className="block w-full text-sm font-normal"
            />
            {preview && (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview thumbnail"
                  suppressHydrationWarning
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearThumbnail}
                  className="absolute right-1 top-1 rounded-full bg-white p-1 text-rose-600 shadow"
                  aria-label="Hapus thumbnail"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f5132] px-5 text-sm font-bold text-white hover:bg-[#198754] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
