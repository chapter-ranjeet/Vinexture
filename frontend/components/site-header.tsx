"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthTokens, getAuthTokens } from "@/lib/auth";

import { UserProfileMenu } from "@/components/user-profile-menu";

const navItems = [
  { href: "/solutions", label: "Solutions" },
  { href: "/talent", label: "Talent" },
  { href: "/internships", label: "Internships" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const tokens = getAuthTokens();
      setIsAuthenticated(Boolean(tokens?.access));
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("vinexture_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("vinexture_auth_changed", checkAuth);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between gap-4 md:gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="VINEXTURE Logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12 shrink-0 object-contain transition-transform group-hover:scale-105"
          />
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-950 flex items-center leading-none">
              VINE<span className="text-red-600">X</span>TURE
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.24em] text-slate-500 font-semibold">
              Technology • Digital Solutions • Talent
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/portal"
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Portal
              </Link>
              <UserProfileMenu />
            </div>
          ) : (
            <>
              <Link
                href="/contact"
                className="hidden h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50 lg:inline-flex"
              >
                Book a consult
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 sm:h-11 sm:px-5 sm:text-sm"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 sm:h-11 sm:px-5 sm:text-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
