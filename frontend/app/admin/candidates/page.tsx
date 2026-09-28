"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson } from "@/lib/api";

type Candidate = {
  id: number;
  name: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  phone?: string;
  qualification?: string;
  college_university?: string;
  course?: string;
  specialization?: string;
  age?: number | string | null;
  gender?: string;
  nationality?: string;
  technical_skills?: string;
  headline?: string;
  bio?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  preferred_mode?: string;
  availability?: string;
  resume_url?: string | null;
  created_at: string;
};

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNationality, setSelectedNationality] = useState("all");

  useEffect(() => {
    fetchJson<{ results?: Candidate[] } | Candidate[]>("/candidates/")
      .then((payload) => setCandidates(Array.isArray(payload) ? payload : payload.results || []))
      .catch((loadError: unknown) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load candidates.")
      )
      .finally(() => setLoading(false));
  }, []);

  const nationalities = Array.from(
    new Set(candidates.map((c) => c.nationality).filter(Boolean))
  ) as string[];

  const filtered = candidates.filter((c) => {
    const searchStr = `${c.name} ${c.email} ${c.phone || ""} ${c.qualification || ""} ${
      c.college_university || ""
    } ${c.course || ""} ${c.technical_skills || ""} ${c.nationality || ""} ${c.headline || ""}`.toLowerCase();
    const matchesQuery = searchStr.includes(query.toLowerCase());
    const matchesNationality =
      selectedNationality === "all" || c.nationality === selectedNationality;
    return matchesQuery && matchesNationality;
  });

  const totalWithPhone = candidates.filter((c) => c.phone).length;
  const totalWithCollege = candidates.filter((c) => c.college_university).length;

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> Candidate Directory
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
              Candidates
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete applicant profiles including contact details, academic credentials, and demographics.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, phone, college..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs md:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {nationalities.length > 0 && (
              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs md:text-sm outline-none transition focus:border-blue-500"
              >
                <option value="all">All Nationalities</option>
                {nationalities.map((nat) => (
                  <option key={nat} value={nat}>
                    {nat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Candidates
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900">{candidates.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Phone Verified
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{totalWithPhone}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              College Recorded
            </span>
            <p className="mt-1 text-2xl font-bold text-blue-600">{totalWithCollege}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Filters
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-700">{filtered.length}</p>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading candidate directory...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm font-medium text-red-600 bg-red-50">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-16 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-900">No candidates match your search</p>
              <p className="text-xs text-slate-500">
                Try clearing search filters or check again once more candidates register.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Candidate Profile</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Academic & College</th>
                    <th className="px-6 py-4">Age / Gender</th>
                    <th className="px-6 py-4">Nationality</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((candidate) => {
                    const initials = candidate.name
                      ? candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "C";

                    return (
                      <tr key={candidate.id} className="transition hover:bg-slate-50/80">
                        {/* Avatar & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-sm">
                              {candidate.avatar_url ? (
                                <Image
                                  src={candidate.avatar_url}
                                  alt={candidate.name}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs">{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/candidates/${candidate.id}`}
                                className="block font-bold text-slate-900 hover:text-blue-600 transition"
                              >
                                {candidate.name || "Candidate #" + candidate.id}
                              </Link>
                              {candidate.headline ? (
                                <p className="truncate text-xs text-slate-500 max-w-[200px]">
                                  {candidate.headline}
                                </p>
                              ) : (
                                <span className="text-[10px] text-slate-400">Candidate</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Info (Email & Phone) */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{candidate.email}</span>
                            </div>
                            {candidate.phone ? (
                              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-900">
                                <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>{candidate.phone}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No phone added</span>
                            )}
                          </div>
                        </td>

                        {/* Academic & College */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {candidate.qualification ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                <GraduationCap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>{candidate.qualification}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                            {candidate.college_university && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {candidate.college_university}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Age / Gender */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {candidate.age ? (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                                {candidate.age} yrs
                              </span>
                            ) : null}
                            {candidate.gender ? (
                              <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                                {candidate.gender}
                              </span>
                            ) : null}
                            {!candidate.age && !candidate.gender && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Nationality */}
                        <td className="px-6 py-4">
                          {candidate.nationality ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                              <Globe className="h-3 w-3 text-blue-600" />
                              {candidate.nationality}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(candidate.created_at).toLocaleDateString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/candidates/${candidate.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-900 hover:text-white hover:border-slate-900"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AdminShell>
  );
}
