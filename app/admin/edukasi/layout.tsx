"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function EdukasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans antialiased text-zinc-800">
      <AdminSidebar
        activeView="education"
        onViewChange={(view) => {
          if (view === "education") {
            router.push("/admin/edukasi");
          } else {
            router.push("/admin");
          }
        }}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
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
            <span className="hidden sm:block text-sm font-medium text-zinc-500">
              Administrator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
