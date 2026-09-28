 "use client";

import { Bell, Briefcase, Download, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson } from "@/lib/api";
import { useEffect } from "react";

const rows = [
  ["Portfolio review", "12 candidates", "High priority"],
  ["AI cohort onboarding", "7 candidates", "Scheduled"],
  ["Hiring pipeline", "24 roles", "Active"],
];

export default function DashboardPage() {
  const [showAlerts, setShowAlerts] = useState(false);
  const [overview, setOverview] = useState<{ candidates: number; internships: number; applications: number; pending_applications: number; recent_activity: { label: string; created_at: string }[] } | null>(null);
  const [error, setError] = useState("");

  function exportReport() {
    const report = ["Metric,Value", `Candidates,${overview?.candidates ?? 0}`, `Active internships,${overview?.internships ?? 0}`, `Applications,${overview?.applications ?? 0}`, `Pending applications,${overview?.pending_applications ?? 0}`].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vinexture-operations-report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetchJson<typeof overview>("/admin/overview/")
      .then(setOverview)
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data."));
  }, []);

  return (
    <AdminShell>
    <main className="container-shell py-10 md:py-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Admin dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Operations overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/cms" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900">
            Manage content
          </Link>
          <button type="button" onClick={() => setShowAlerts((current) => !current)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900">
            <Bell className="h-4 w-4" /> Alerts
          </button>
          <button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            <Download className="h-4 w-4" /> Export report
          </button>
        </div>
      </div>
      {error ? <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {showAlerts ? <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">{overview?.recent_activity?.length ? `${overview.recent_activity.length} recent activity items loaded.` : "No recent activity available."}</div> : null}

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {[
          ["Candidates", overview ? String(overview.candidates) : "—"],
          ["Active internships", overview ? String(overview.internships) : "—"],
          ["Applications", overview ? String(overview.applications) : "—"],
          ["Pending review", overview ? String(overview.pending_applications) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="soft-card rounded-[1.8rem] p-6">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="soft-card rounded-[2rem] p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Team workload</h2>
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mt-6 space-y-4">
            {rows.map(([title, volume, status]) => (
              <div key={title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500">{volume}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card rounded-[2rem] p-8">
          <h2 className="text-xl font-semibold text-slate-900">Priority actions</h2>
          <div className="mt-6 space-y-4 text-slate-600">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Briefcase className="h-5 w-5 text-blue-700" /> Review intern cohorts
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Users className="h-5 w-5 text-blue-700" /> Activate hiring pipeline
            </div>
          </div>
        </div>
      </div>
    </main>
    </AdminShell>
  );
}
