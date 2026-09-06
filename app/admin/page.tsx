"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Map as MapIcon,
  Filter,
  FileText,
  X,
  Flame,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMapReports } from "@/hooks/useMapReports";
import { getHotspotClusters } from "@/actions/mapActions";
import type { MapReport, Priority, ReportStatus } from "@/types/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import MarketplaceManagement from "@/components/admin/MarketplaceManagement";
import UserManagement from "@/components/admin/UserManagement";
import { EdukasiManagement } from "@/components/admin/EdukasiManagement";
import AdminReportForm from "@/components/admin/AdminReportForm";
import Image from "next/image";

const AdminMap = dynamic(() => import("@/components/admin/AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] md:h-[420px] rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-medium animate-pulse border border-zinc-200">
      <Loader2 className="w-6 h-6 animate-spin text-[#198754] mr-2" />
      Memuat Peta...
    </div>
  ),
});

const ReportMap = dynamic(() => import("@/components/admin/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-slate-100">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
    </div>
  ),
});

const HotspotMap = dynamic(() => import("@/components/admin/HotspotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-slate-100">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
    </div>
  ),
});

const statusBadgeClass: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-800",
  Proses: "bg-blue-100 text-blue-800",
  Menunggu: "bg-orange-100 text-orange-800",
};

const statusLabel: Record<ReportStatus, string> = {
  pending: "Tertunda",
  in_progress: "Diproses",
  completed: "Selesai",
  rejected: "Ditolak",
};

const statusStyle: Record<ReportStatus, string> = {
  pending: "bg-rose-50 text-rose-700",
  in_progress: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-slate-100 text-slate-600",
};

const priorityLabel: Record<Priority, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
};

const categoryLabel = (value: string | null) =>
  value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Masalah Lingkungan";

const validCoordinate = (r: MapReport) =>
  r.latitude != null &&
  r.longitude != null &&
  Number.isFinite(r.latitude) &&
  Number.isFinite(r.longitude) &&
  Math.abs(r.latitude) <= 90 &&
  Math.abs(r.longitude) <= 180;

type Filters = {
  category: string;
  priority: "all" | Priority;
  date: string;
};

const emptyFilters: Filters = { category: "all", priority: "all", date: "" };

type HotspotArea = {
  id: string;
  name: string;
  count: number;
  latitude: number;
  longitude: number;
  latestReport: MapReport;
};

type TabType = "map" | "analytics";

type ViewType =
  | "dashboard"
  | "map-reports"
  | "marketplace"
  | "user-management"
  | "education"
  | "settings";

function AdminDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("dashboard");

  const handleViewChange = (view: string) => {
    setActiveView(view as ViewType);
  };
  const [deleteConfirm, setDeleteConfirm] = useState<MapReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { stats, reports, mapLocations, loading, dbStatus, error, refetch } =
    useAdminDashboard();
  const currentUser = useCurrentUser();
  const displayName = currentUser?.name || "Admin";

  const mapReports = useMapReports();
  const {
    reports: mapReportsList,
    loading: mapLoading,
    error: mapError,
    updatingId,
    refetch: refetchMap,
    updateStatus,
    deleteReport: deleteReportAction,
    filters,
    setFilters,
    activeCount,
    completedThisWeek,
  } = mapReports;

  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [selected, setSelected] = useState<MapReport | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("map");
  const [hotspots, setHotspots] = useState<HotspotArea[]>([]);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchHotspots = async () => {
      setHotspotsLoading(true);
      try {
        const data = await getHotspotClusters();
        if (!cancelled) {
          setHotspots(data);
        }
      } catch {
        if (!cancelled) {
          setHotspots([]);
        }
      } finally {
        if (!cancelled) {
          setHotspotsLoading(false);
        }
      }
    };

    fetchHotspots();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = React.useMemo(
    () =>
      [
        ...new Set(
          mapReportsList
            .map((r) => r.category)
            .filter((v): v is string => Boolean(v)),
        ),
      ].sort(),
    [mapReportsList],
  );

  const filtered = React.useMemo(() => {
    return mapReportsList.filter((r) => {
      const sameCategory =
        filters.category === "all" || r.category === filters.category;
      const samePriority =
        filters.priority === "all" || r.priority === filters.priority;
      const sameDate =
        !filters.date || Boolean(r.created_at?.startsWith(filters.date));
      return sameCategory && samePriority && sameDate;
    });
  }, [mapReportsList, filters]);

  const mapped = filtered.filter(validCoordinate);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const today = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans antialiased text-zinc-800">
      <AdminSidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {/* Main Content Area - offset by sidebar width on desktop */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <div className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 h-14 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <span>Server status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dbStatus.includes("Offline")
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {dbStatus}
                </span>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {activeView === "dashboard" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
                      Selamat Datang Kembali,{" "}
                      <span className="text-[#198754]">{displayName}</span>!
                    </h1>
                    <p className="text-sm text-zinc-500">
                      Berikut adalah pembaruan terbaru mengenai dampak ekonomi
                      sirkular kita.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-sm text-sm text-zinc-600 font-medium">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>{today}</span>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      onClick={refetch}
                      className="text-xs font-bold underline hover:no-underline"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <MetricCard
                    icon={Loader2}
                    label="Sedang Diproses"
                    value={stats.inProgressCount.toLocaleString("id-ID")}
                    iconBg="bg-blue-50 text-blue-600"
                  />
                  <MetricCard
                    icon={AlertTriangle}
                    label="Tertunda"
                    value={stats.pendingCount.toLocaleString("id-ID")}
                    iconBg="bg-orange-50 text-orange-600"
                  />
                  <MetricCard
                    icon={CheckCircle2}
                    label="Laporan Diselesaikan"
                    value={stats.reportsSolved.toLocaleString("id-ID")}
                    iconBg="bg-emerald-50 text-[#198754]"
                  />
                </div>

                {/* Main Split Grid - Map & Latest Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                        Ringkasan Peta
                      </h3>

                      {/* Legends */}
                      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-[#16a34a]">
                          <span className="w-2.5 h-2.5 bg-[#16a34a] rounded-full" />
                          <span>Bank Sampah</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[#dc2626]">
                          <span className="w-2.5 h-2.5 bg-[#dc2626] rounded-full" />
                          <span>Laporan Liar</span>
                        </span>
                      </div>
                    </div>

                    <AdminMap locations={mapLocations} />
                  </div>

                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                        Laporan Terbaru
                      </h3>
                      <Link
                        href="/peta"
                        className="text-[10px] sm:text-xs font-bold text-[#198754] hover:text-[#0f5132] inline-flex items-center gap-0.5 group transition-colors"
                      >
                        <span>Lihat Semua</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(7)].map((_, i) => (
                          <div key={i} className="py-3 animate-pulse">
                            <div className="h-4 bg-zinc-100 rounded w-16 mb-2" />
                            <div className="h-3 bg-zinc-100 rounded w-32" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100 flex-1">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            className="py-3 sm:py-4 flex items-center justify-between first:pt-0 last:pb-0"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-bold text-zinc-900 block truncate">
                                {report.id}
                              </span>
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-500 block truncate">
                                {report.location}
                                {Array.isArray(report.wasteType)
                                  ? report.wasteType.map((w) => (
                                      <span
                                        key={w}
                                        className="ml-1 inline-block rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700"
                                      >
                                        {w}
                                      </span>
                                    ))
                                  : ` • ${report.wasteType}`}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ml-2 ${
                                statusBadgeClass[report.status] ||
                                statusBadgeClass["Menunggu"]
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeView === "map-reports" && (
              <>
                {/* Welcome Title and Date Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
                      Laporan Peta
                    </h1>
                    <p className="text-sm text-zinc-500">
                      Tinjau dan kelola laporan masalah lingkungan berbasis
                      lokasi.
                    </p>
                  </div>

                  {/* Date Container */}
                  <div className="flex items-center gap-2.5 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-sm text-sm text-zinc-600 font-medium">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>{today}</span>
                  </div>
                </div>

                {/* Error Banner */}
                {mapError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                    <span>{mapError}</span>
                    <button
                      onClick={refetchMap}
                      className="text-xs font-bold underline hover:no-underline"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}

                <AdminReportForm onCreated={refetchMap} />

                {/* Top Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <MetricCard
                    icon={MapIcon}
                    label="Total Aktif"
                    value={mapLoading ? "—" : String(activeCount)}
                    iconBg="bg-emerald-50 text-[#198754]"
                  />
                  <MetricCard
                    icon={CheckCircle2}
                    label="Selesai (Mg Ini)"
                    value={mapLoading ? "—" : String(completedThisWeek)}
                    iconBg="bg-blue-50 text-blue-600"
                  />
                  <MetricCard
                    icon={FileText}
                    label="Total Laporan"
                    value={mapLoading ? "—" : String(mapReportsList.length)}
                    iconBg="bg-emerald-50 text-[#198754]"
                  />
                </div>

                {/* Filter Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFilters(draft);
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center"
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Filter className="h-4 w-4 text-[#198754]" />
                    Filter:
                  </span>
                  <select
                    aria-label="Jenis laporan"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                    className="h-10 min-w-48 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  >
                    <option value="all">Semua Jenis</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabel(c)}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Prioritas"
                    value={draft.priority}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        priority: e.target.value as Filters["priority"],
                      })
                    }
                    className="h-10 min-w-44 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
                  >
                    <option value="all">Semua Prioritas</option>
                    {Object.entries(priorityLabel).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <label className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      aria-label="Tanggal laporan"
                      type="date"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                      className="h-10 rounded-lg border border-zinc-200 pl-9 pr-3 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-[#0f5132] px-6 text-sm font-bold text-white hover:bg-[#198754]"
                  >
                    Terapkan
                  </button>
                  {(filters.category !== "all" ||
                    filters.priority !== "all" ||
                    filters.date) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(emptyFilters);
                        setFilters(emptyFilters);
                      }}
                      className="h-10 px-2 text-sm font-semibold text-zinc-500"
                    >
                      Reset
                    </button>
                  )}
                </form>

                {/* Tab Navigation */}
                <div className="flex gap-6 border-b border-zinc-200 text-sm">
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-1 pb-3 font-extrabold inline-flex items-center gap-2 ${
                      activeTab === "map"
                        ? "border-b-2 border-[#0f5132] text-[#0f5132]"
                        : "font-semibold text-zinc-400"
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                    Laporan Peta
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`px-1 pb-3 font-extrabold inline-flex items-center gap-2 ${
                      activeTab === "analytics"
                        ? "border-b-2 border-[#0f5132] text-[#0f5132]"
                        : "font-semibold text-zinc-400"
                    }`}
                  >
                    <Flame className="h-4 w-4" />
                    Analitik
                  </button>
                </div>

                {/* Content */}
                {mapError ? (
                  <State
                    tone="error"
                    title="Laporan gagal dimuat"
                    detail={mapError}
                    action={refetchMap}
                  />
                ) : mapLoading ? (
                  <State
                    loading
                    title="Memuat laporan"
                    detail="Mengambil laporan terbaru dari Supabase..."
                  />
                ) : mapReportsList.length === 0 ? (
                  <State
                    title="Belum ada laporan"
                    detail="Laporan masyarakat akan tampil di sini setelah dikirim."
                  />
                ) : activeTab === "map" ? (
                  <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <ReportMap
                        reports={mapped}
                        selectedId={selected?.id ?? null}
                        onSelect={setSelected}
                      />
                      {mapped.length === 0 && (
                        <div className="absolute inset-0 z-[500] grid place-items-center bg-white/85">
                          <div className="text-center">
                            <MapIcon className="mx-auto h-9 w-9 text-zinc-400" />
                            <p className="mt-2 font-bold">
                              Tidak ada lokasi yang cocok
                            </p>
                            <p className="text-sm text-zinc-500">
                              Ubah filter untuk menampilkan marker.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-zinc-100 p-5">
                        <div>
                          <h2 className="text-lg font-extrabold">
                            {selected ? "Detail Laporan" : "Laporan Terbaru"}
                          </h2>
                          <p className="text-xs text-zinc-400">
                            {filtered.length} laporan ditemukan
                          </p>
                        </div>
                        {selected && (
                          <button
                            onClick={() => setSelected(null)}
                            aria-label="Tutup detail"
                            className="rounded-lg p-2 hover:bg-zinc-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {selected ? (
                        <ReportDetail
                          report={selected}
                          updating={updatingId === selected.id}
                          onStatus={async (status) => {
                            if (status === "rejected") {
                              setDeleteConfirm(selected);
                            } else {
                              const updated = await updateStatus(
                                selected.id,
                                status,
                              );
                              if (updated)
                                setSelected({
                                  ...selected,
                                  status,
                                  updated_at: new Date().toISOString(),
                                });
                            }
                          }}
                          onDelete={() => setDeleteConfirm(selected)}
                        />
                      ) : (
                        <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
                          {filtered.map((r) => (
                            <ReportCard
                              key={r.id}
                              report={r}
                              onClick={() => setSelected(r)}
                            />
                          ))}
                          {filtered.length === 0 && (
                            <p className="p-8 text-center text-sm text-zinc-500">
                              Tidak ada laporan untuk filter ini.
                            </p>
                          )}
                        </div>
                      )}
                    </aside>
                  </section>
                ) : (
                  <AnalyticsView
                    hotspots={hotspots}
                    loading={hotspotsLoading}
                  />
                )}
              </>
            )}

            {activeView === "marketplace" && <MarketplaceManagement />}

            {activeView === "user-management" && <UserManagement />}

            {activeView === "education" && <EdukasiManagement />}
          </div>
        </div>
      </main>

      {deleteConfirm && (
        <DeleteConfirmModal
          report={deleteConfirm}
          loading={deleting}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={async () => {
            setDeleting(true);
            const deleted = await deleteReportAction(deleteConfirm.id);
            setDeleting(false);
            if (deleted) {
              setDeleteConfirm(null);
              setSelected(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboardContent;

function MetricCard({
  icon: Icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function ReportCard({
  report,
  onClick,
}: {
  report: MapReport;
  onClick: () => void;
}) {
  return (
    <article className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-[#0f5132]">
          #RPT-{report.id.slice(0, 8).toUpperCase()}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            statusStyle[report.status]
          }`}
        >
          {statusLabel[report.status]}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-extrabold capitalize text-zinc-900">
        {categoryLabel(report.category)}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
        {report.location_name ||
          report.description ||
          "Lokasi belum diberi nama"}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          Prioritas:{" "}
          <b className="text-zinc-700">
            {report.priority ? priorityLabel[report.priority] : "—"}
          </b>
        </span>
        <button
          onClick={onClick}
          className="font-extrabold text-[#198754] hover:underline"
        >
          Tinjau
        </button>
      </div>
    </article>
  );
}

function ReportDetail({
  report,
  updating,
  onStatus,
  onDelete,
}: {
  report: MapReport;
  updating: boolean;
  onStatus: (s: ReportStatus) => Promise<void>;
  onDelete: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos =
    report.photo_urls || (report.photo_url ? [report.photo_url] : []);

  return (
    <div className="space-y-5 p-5">
      <div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            statusStyle[report.status]
          }`}
        >
          {statusLabel[report.status]}
        </span>
        <h3 className="mt-4 font-extrabold capitalize">
          {categoryLabel(report.category)}
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {report.description || "Tidak ada deskripsi."}
        </p>
      </div>

      {/* Photo Carousel */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
            <Image
              src={photos[photoIndex]}
              alt={`Foto laporan ${photoIndex + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setPhotoIndex((prev) =>
                      prev === 0 ? photos.length - 1 : prev - 1,
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setPhotoIndex((prev) =>
                      prev === photos.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {photoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setPhotoIndex(idx)}
                  className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === photoIndex
                      ? "border-[#198754]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <dl className="space-y-3 border-y border-zinc-100 py-4 text-sm">
        <Info k="Lokasi" v={report.location_name || "—"} />
        <Info
          k="Prioritas"
          v={report.priority ? priorityLabel[report.priority] : "—"}
        />
        <Info k="Pelapor" v={report.reporter_name || "Anonim"} />
        {report.reporter_phone && <Info k="No. HP" v={report.reporter_phone} />}
        <Info
          k="Tanggal"
          v={
            report.created_at
              ? new Date(report.created_at).toLocaleString("id-ID")
              : "—"
          }
        />
        {report.waste_type && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-zinc-400">Jenis Sampah</dt>
            <dd className="flex flex-wrap gap-1.5 justify-end">
              {Array.isArray(report.waste_type) ? (
                report.waste_type.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700"
                  >
                    {w}
                  </span>
                ))
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                  {report.waste_type}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
      <label className="block text-xs font-bold text-zinc-600">
        Ubah status
        <select
          disabled={updating}
          value={report.status}
          onChange={(e) => void onStatus(e.target.value as ReportStatus)}
          className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
        >
          {Object.entries(statusLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      {updating && (
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Menyimpan perubahan...
        </p>
      )}
      {report.status === "completed" && (
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 w-full rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors"
        >
          Hapus Laporan Selesai
        </button>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{k}</dt>
      <dd className="max-w-[65%] text-right font-semibold">{v}</dd>
    </div>
  );
}

function State({
  title,
  detail,
  tone,
  loading,
  action,
}: {
  title: string;
  detail: string;
  tone?: "error";
  loading?: boolean;
  action?: () => void;
}) {
  return (
    <div
      className={`grid min-h-[420px] place-items-center rounded-2xl border text-center ${
        tone ? "border-rose-200 bg-rose-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div>
        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        ) : tone ? (
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
        ) : (
          <CheckCircle2 className="mx-auto h-8 w-8 text-zinc-400" />
        )}
        <h2 className="mt-3 font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{detail}</p>
        {action && (
          <button
            onClick={() => void action()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}

function AnalyticsView({
  hotspots,
  loading,
}: {
  hotspots: HotspotArea[];
  loading: boolean;
}) {
  const redZoneCount = hotspots.filter((h) => h.count >= 3).length;
  const totalAreas = hotspots.length;
  const maxHotspotCount = hotspots.length > 0 ? hotspots[0].count : 1;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <HotspotMap hotspots={hotspots} onSelect={() => {}} />
        {hotspots.length === 0 && !loading && (
          <div className="absolute inset-0 z-[500] grid place-items-center bg-white/85">
            <div className="text-center">
              <MapIcon className="mx-auto h-9 w-9 text-zinc-400" />
              <p className="mt-2 font-bold">Tidak ada data hotspot</p>
              <p className="text-sm text-zinc-500">
                Ubah filter untuk menampilkan area rawan.
              </p>
            </div>
          </div>
        )}
      </div>

      <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5">
          <h2 className="text-lg font-extrabold inline-flex items-center gap-2">
            <Flame className="h-5 w-5 text-rose-600" />
            Red-Zone / Hotspot
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {totalAreas} area teridentifikasi • {redZoneCount} red-zone
          </p>
        </div>
        <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
          {hotspots.map((area, index) => {
            const intensity = area.count / maxHotspotCount;
            const isRedZone = area.count >= 3;
            return (
              <div key={area.id} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-900">
                    #{index + 1} {area.name}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      isRedZone
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isRedZone ? "Red Zone" : "Hotspot"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(intensity * 100, 100)}%`,
                        background: isRedZone
                          ? "linear-gradient(to right, #f87171, #dc2626)"
                          : "linear-gradient(to right, #fbbf24, #f59e0b)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-zinc-700 w-8 text-right">
                    {area.count}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-zinc-400">
                  Laporan terakhir:{" "}
                  {area.latestReport.created_at
                    ? new Date(area.latestReport.created_at).toLocaleDateString(
                        "id-ID",
                      )
                    : "—"}
                </p>
              </div>
            );
          })}
          {hotspots.length === 0 && !loading && (
            <p className="p-8 text-center text-sm text-zinc-500">
              Tidak ada data hotspot untuk filter ini.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function DeleteConfirmModal({
  report,
  onConfirm,
  onCancel,
  loading,
}: {
  report: MapReport;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900">
            Tolak Laporan
          </h3>
        </div>
        <p className="text-sm text-zinc-600 mb-2">
          Apakah Anda yakin ingin menolak laporan{" "}
          <span className="font-bold">{report.location_name || "ini"}</span>?
        </p>
        <p className="text-xs text-zinc-500 mb-6">
          Data laporan akan{" "}
          <span className="font-bold text-red-600">dihapus permanen</span> dan
          tidak dapat dikembalikan.
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
            className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Menghapus..." : "Ya, Tolak & Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
