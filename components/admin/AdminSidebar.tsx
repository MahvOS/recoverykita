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
} from "lucide-react";

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
          flex flex-col justify-between p-6 flex-shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image
                src="/logosingle.ico"
                alt="RecoveryKita Logo"
                fill
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
      </aside>
    </>
  );
}
