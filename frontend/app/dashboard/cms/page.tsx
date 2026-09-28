"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function CMSDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/cms");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-900 mb-3" />
      <p className="text-sm font-semibold text-slate-700">Redirecting to Admin CMS Workspace...</p>
      <Link href="/admin/cms" className="mt-3 text-xs font-bold text-blue-600 underline">
        Click here if not redirected automatically
      </Link>
    </div>
  );
}

