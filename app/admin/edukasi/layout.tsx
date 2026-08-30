"use client";

import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function EdukasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

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
      />

      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
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
