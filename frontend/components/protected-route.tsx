"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getAuthTokens } from "@/lib/auth";
import { fetchJson } from "@/lib/api";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const tokens = getAuthTokens();
      if (!tokens) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const profile = await fetchJson<{ role?: string; is_staff?: boolean }>("/auth/profile/");
        if (adminOnly && !profile.is_staff && profile.role !== "admin") {
          router.replace("/portal");
          return;
        }
      } catch {
        if (active) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (active) setAuthorized(true);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [adminOnly, pathname, router]);

  if (!authorized) {
    return <main className="container-shell flex min-h-[60vh] items-center justify-center py-20" aria-busy="true" />;
  }

  return children;
}
