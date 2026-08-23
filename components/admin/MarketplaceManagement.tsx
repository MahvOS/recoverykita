"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Image from "next/image";
import { RemoteImage } from "@/components/remote-image";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  RefreshCw,
  Search,
  X,
  Check,
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
  seller_id: string;
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

interface MarketplaceManagementProps {
  compact?: boolean;
}

const EMPTY_FORM: ProductForm = {
  title: "",
  slug: "",
  seller_id: "",
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

export default function MarketplaceManagement({
  compact,
}: MarketplaceManagementProps) {
  const {
    products,
    sellers,
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
        sellerName.includes(query)
      );
    });
  }, [products, search]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  };

  const openAdd = () => {
    resetForm();
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEdit = (product: MarketplaceProduct) => {
    setForm({
      title: product.title ?? "",
      slug: product.slug ?? "",
      seller_id: product.seller_id ?? "",
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
      if (!file.type.startsWith("image/")) {
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        return;
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
    seller_id: form.seller_id,
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

    if (!payload.title) {
      return;
    }

    let result: MarketplaceProduct | null = null;
    if (isEditMode && editingProduct) {
      result = await updateProduct(
        editingProduct.id,
        payload,
        form.thumbnail_file ?? undefined,
      );
    } else {
      result = await createProduct(payload, form.thumbnail_file ?? undefined);
    }

    if (result) {
      closeForm();
    }
  };

  const effectiveThumbnail = (product: MarketplaceProduct) =>
    product.thumbnail_url ?? null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteProduct(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  };

  if (formOpen || deleteTarget) {
    return null;
  }

  const content = (
    <>
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
            className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Perbarui
          </button>
          <button
            onClick={openAdd}
            className="h-10 rounded-lg bg-[#0f5132] px-5 text-sm font-bold text-white hover:bg-[#198754] inline-flex items-center gap-2"
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
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-5 bg-zinc-100 rounded animate-pulse"
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
                    Belum ada produk.
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
    </>
  );

  if (!formOpen && !deleteTarget) {
    return (
      <>
        {content}
        {formOpen && (
          <ProductFormModal
            open={formOpen}
            isEditMode={isEditMode}
            editingProduct={editingProduct}
            form={form}
            setForm={setForm}
            setSlugTouched={setSlugTouched}
            slugTouched={slugTouched}
            sellers={sellers}
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
      </>
    );
  }

  return (
    <>
      {content}
      {formOpen && (
        <ProductFormModal
          open={formOpen}
          isEditMode={isEditMode}
          editingProduct={editingProduct}
          form={form}
          setForm={setForm}
          setSlugTouched={setSlugTouched}
          slugTouched={slugTouched}
          sellers={sellers}
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
    </>
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

  const onIncrement = () => commit(current + 1);
  const onDecrement = () => commit(Math.max(0, current - 1));

  return (
    <div className="flex items-center gap-0.5 justify-center">
      <button
        type="button"
        onClick={onDecrement}
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
        onClick={onIncrement}
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
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-200">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          <span className="font-bold">"{product.title}"</span>?
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
  editingProduct: MarketplaceProduct | null;
  form: ProductForm;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  setSlugTouched: (v: boolean) => void;
  slugTouched: boolean;
  sellers: MarketplaceProduct["seller"] extends never ? never : SellerType[];
  categories: string[];
  saving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearThumbnail: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

import type { Seller as SellerType } from "@/lib/supabase";
