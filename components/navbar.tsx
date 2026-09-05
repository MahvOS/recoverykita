"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  { href: "/", label: "Beranda" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/peta", label: "Peta" },
  { href: "/lapor", label: "Lapor" },
  { href: "/edukasi", label: "Edukasi" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed top-0 z-50 w-full bg-[#fbfcfa]/95 backdrop-blur-md border-b border-[#e2e8f0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col">
        <div className="h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 w-20">
            <Link href="/" className="block">
              <div className="relative w-30 h-30 sm:w-35 sm:h-35">
                <Image
                  src="/logo.ico"
                  alt="RecoveryKita Logo"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-4 lg:gap-8 flex-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "text-sm font-semibold text-[#0f5132] border-b-2 border-[#198754] pb-1 transition-colors"
                    : "text-sm font-medium text-zinc-600 hover:text-[#0f5132] transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="w-20 flex justify-end">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex items-center p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-zinc-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16m-7 6h7"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-b border-[#e2e8f0]/60 bg-[#fbfcfa] px-3 sm:px-4 py-3 sm:py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={
                    isActive(item.href)
                      ? "rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#0f5132] hover:bg-[#edf7ef]"
                      : "rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
