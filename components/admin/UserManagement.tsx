"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, ShieldAlert, ShieldCheck, X, RefreshCw } from "lucide-react";
import {
  getAdminUsers,
  getUserReports,
  getUserReportCount,
  toggleBanUser,
} from "@/actions/userActions";
import type { AdminUser, UserReport } from "@/types/admin";
import Image from "next/image";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;

  const confirmClass =
    tone === "success"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-rose-600 hover:bg-rose-700 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              tone === "success" ? "bg-emerald-100" : "bg-rose-100"
            }`}
          >
            {tone === "success" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-rose-600" />
            )}
          </div>
          <h3 className="text-lg font-extrabold text-zinc-900">{title}</h3>
        </div>
        <p className="text-sm text-zinc-600 mb-2">{description}</p>
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
            className={`h-10 rounded-lg px-4 text-sm font-bold text-white disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({
  user,
  reports,
  loading,
  onClose,
}: {
  user: AdminUser;
  reports: UserReport[];
  loading: boolean;
  onClose: () => void;
}) {
  const reportCount = reports.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900">
              Detail Pengguna
            </h2>
            <p className="text-sm text-zinc-500">
              Informasi lengkap dan riwayat laporan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Nama
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {user.full_name || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Email
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 break-all">
              {user.email || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              No. Telepon
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {user.phone_number || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Role
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 capitalize">
              {user.role || "user"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Status
            </p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                user.is_banned
                  ? "bg-rose-50 text-rose-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {user.is_banned ? "Banned" : "Aktif"}
            </span>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Laporan
            </p>
            <p className="mt-1 text-sm font-extrabold text-zinc-900">
              {reportCount}
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-extrabold text-zinc-900 mb-3">
            Riwayat Laporan
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-zinc-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Pengguna belum mengirim laporan.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {report.location_name || report.description || "Laporan"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {report.created_at
                        ? new Date(report.created_at).toLocaleString("id-ID")
                        : "—"}
                    </p>
                  </div>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                      report.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : report.status === "rejected"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {report.status || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [detailReports, setDetailReports] = useState<UserReport[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banLoading, setBanLoading] = useState(false);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminUsers().then(async (data) => {
      if (!cancelled) {
        setUsers(data);
        setLoading(false);
        if (data.length > 0) {
          setCountsLoading(true);
          const counts = await Promise.all(
            data.map(
              async (u) => [u.id, await getUserReportCount(u.id)] as const,
            ),
          );
          if (!cancelled) {
            setReportCounts(Object.fromEntries(counts));
            setCountsLoading(false);
          }
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone_number || "").toLowerCase();
      return (
        name.includes(query) || email.includes(query) || phone.includes(query)
      );
    });
  }, [users, search]);

  const openDetail = async (user: AdminUser) => {
    setDetailUser(user);
    setDetailLoading(true);
    setDetailReports([]);
    const reports = await getUserReports(user.id);
    setDetailReports(reports);
    setDetailLoading(false);
  };

  const handleBanToggle = async () => {
    if (!banTarget) return;
    setBanLoading(true);
    const result = await toggleBanUser(
      banTarget.id,
      banTarget.is_banned ?? false,
    );
    setBanLoading(false);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banTarget.id
            ? {
                ...u,
                is_banned: !banTarget.is_banned,
                banned_at: !banTarget.is_banned
                  ? new Date().toISOString()
                  : null,
              }
            : u,
        ),
      );
      setBanTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">
            User Management
          </h1>
          <p className="text-sm text-zinc-500">
            Kelola pengguna, role, dan status akses akun.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            getAdminUsers().then(async (data) => {
              setUsers(data);
              setLoading(false);
              if (data.length > 0) {
                setCountsLoading(true);
                const counts = await Promise.all(
                  data.map(
                    async (u) =>
                      [u.id, await getUserReportCount(u.id)] as const,
                  ),
                );
                setReportCounts(Object.fromEntries(counts));
                setCountsLoading(false);
              }
            });
          }}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 inline-flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Perbarui
        </button>
      </div>

      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau no. telepon..."
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
                  Nama / Email
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">
                  No. Telepon
                </th>
                <th className="text-left px-4 py-3 whitespace-nowrap">Role</th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Total Laporan
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Status
                </th>
                <th className="text-center px-4 py-3 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
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
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700 overflow-hidden">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.full_name ?? "User"}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (user.full_name || user.email || "U")
                              .slice(0, 2)
                              .toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-900 truncate max-w-[200px] sm:max-w-xs">
                            {user.full_name || "Pengguna"}
                          </p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-xs">
                            {user.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {user.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 capitalize">
                      {user.role || "user"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-zinc-900 text-center">
                      {countsLoading || loading
                        ? "..."
                        : (reportCounts[user.id] ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          user.is_banned
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.is_banned ? "Banned" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(user)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#0f5132] hover:bg-zinc-100 transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => setBanTarget(user)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            user.is_banned
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {user.is_banned ? "Unban" : "Ban"}
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

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          reports={detailReports}
          loading={detailLoading}
          onClose={() => {
            setDetailUser(null);
            setDetailReports([]);
          }}
        />
      )}

      <ConfirmDialog
        open={!!banTarget}
        title={
          banTarget?.is_banned ? "Buka Blokir Pengguna" : "Blokir Pengguna"
        }
        description={
          banTarget
            ? `Apakah Anda yakin ingin ${
                banTarget.is_banned ? "membuka blokir" : "memblokir"
              } pengguna "${banTarget.full_name || banTarget.email}"?`
            : ""
        }
        confirmLabel={
          banLoading
            ? "Memproses..."
            : banTarget?.is_banned
              ? "Ya, Buka Blokir"
              : "Ya, Blokir"
        }
        tone={banTarget?.is_banned ? "success" : "danger"}
        loading={banLoading}
        onConfirm={handleBanToggle}
        onCancel={() => setBanTarget(null)}
      />
    </div>
  );
}
