"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map as MapIcon,
  Store,
  Users,
  GraduationCap,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const menuItems = [
  { name: "Dasbor", icon: LayoutDashboard, view: "dashboard", href: null },
  { name: "Laporan Peta", icon: MapIcon, view: "map-reports", href: null },
  { name: "Pasar", icon: Store, view: "marketplace", href: null },
  { name: "User Management", icon: Users, view: "user-management", href: null },
  {
    name: "Edukasi",
    icon: GraduationCap,
    view: "education",
    href: null,
  },
];

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AdminSidebar({
  activeView,
  onViewChange,
  isOpen,
  onOpenChange,
}: AdminSidebarProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const sidebarOpen = isOpen ?? internalOpen;

  const [loggingOut, setLoggingOut] = useState(false);
  const currentUser = useCurrentUser();
  const adminName = currentUser?.name || "Admin";

  const setSidebarOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const handleClick = (item: (typeof menuItems)[number]) => {
    setSidebarOpen(false);
    if (item.href) {
      router.push(item.href);
    } else {
      onViewChange(item.view);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const client = getSupabaseAuthClient() as any;
      await client.auth.signOut();
    } catch (err) {
      console.error("Logout gagal:", err);
    } finally {
      setSidebarOpen(false);
      router.push("/lapor");
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed agar selalu terlihat saat scroll */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200
          flex flex-col p-6 flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex-1 min-h-0 space-y-8 overflow-y-auto">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image
                src="/favicon.ico"
                alt="RecoveryKita Logo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <span className="text-lg font-black text-[#0f5132] tracking-tight block">
                Recovery<span className="text-[#198754]">Kita</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase -mt-1 block">
                Admin Dashboard
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => handleClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#bbf7d0] text-[#0f5132]"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-[#0f5132]" : "text-zinc-500"}`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User info + Logout */}
        <div className="pt-4 mt-4 border-t border-zinc-200 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#0f5132] to-[#198754] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 truncate">
                {adminName}
              </p>
              <p className="text-[10px] font-semibold text-[#198754] tracking-wider uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </aside>
    </>
  );
}
