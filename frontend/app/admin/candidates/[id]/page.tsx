"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
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
  resume?: string | null;
  resume_url?: string | null;
  created_at: string;
  updated_at?: string;
};

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params
      .then(({ id }) =>
        fetchJson<Candidate>(`/candidates/${id}/`)
          .then(setCandidate)
          .catch((loadError: unknown) =>
            setError(loadError instanceof Error ? loadError.message : "Unable to load candidate.")
          )
      )
      .finally(() => setLoading(false));
  }, [params]);

  if (loading) {
    return (
      <AdminShell>
        <main className="container-shell py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading candidate profile...
          </div>
        </main>
      </AdminShell>
    );
  }

  if (error || !candidate) {
    return (
      <AdminShell>
        <main className="container-shell py-12">
          <Link
            href="/admin/candidates"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to candidates
          </Link>
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            {error || "Candidate not found."}
          </div>
        </main>
      </AdminShell>
    );
  }

  const displayName = candidate.name || candidate.username || `Candidate #${candidate.id}`;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <Link
          href="/admin/candidates"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to candidates directory
        </Link>

        {/* Hero Card */}
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-md sm:h-28 sm:w-28">
              {candidate.avatar_url ? (
                <Image
                  src={candidate.avatar_url}
                  alt={displayName}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold">{initials}</span>
              )}
            </div>

            {/* Candidate Header Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  <Sparkles className="h-3 w-3" /> Candidate #{candidate.id}
                </span>
                {candidate.nationality && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Globe className="h-3 w-3 text-slate-500" /> {candidate.nationality}
                  </span>
                )}
                {candidate.age && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {candidate.age} yrs old
                  </span>
                )}
                {candidate.gender && (
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                    {candidate.gender}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                {displayName}
              </h1>

              {candidate.headline && (
                <p className="text-sm font-medium text-slate-600">{candidate.headline}</p>
              )}

              <p className="text-xs text-slate-400">
                Registered on: {new Date(candidate.created_at).toLocaleDateString([], { dateStyle: "long" })}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* 1. Academic & Demographics Card */}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-bold text-slate-900">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Academic & Demographics
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Highest Qualification
                </dt>
                <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.qualification || "Not provided"}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  College / University
                </dt>
                <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.college_university || "Not provided"}
                </dd>
              </div>

              {candidate.course && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Degree / Course
                  </dt>
                  <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                    {candidate.course} {candidate.specialization ? `(${candidate.specialization})` : ""}
                  </dd>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Age
                </dt>
                <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.age ? `${candidate.age} years old` : "Not provided"}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gender
                </dt>
                <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.gender || "Not specified"}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nationality
                </dt>
                <dd className="font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.nationality || "Not specified"}
                </dd>
              </div>
            </dl>
          </section>

          {/* 2. Contact & Online Presence Card */}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-bold text-slate-900">
              <Phone className="h-5 w-5 text-emerald-600" />
              Contact & Online Presence
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email Address
                </dt>
                <dd className="mt-0.5 sm:mt-0">
                  <a
                    href={`mailto:${candidate.email}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {candidate.email}
                  </a>
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone Number
                </dt>
                <dd className="font-mono font-semibold text-slate-900 mt-0.5 sm:mt-0">
                  {candidate.phone ? (
                    <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">
                      {candidate.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No phone recorded</span>
                  )}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Username
                </dt>
                <dd className="font-mono text-slate-700 mt-0.5 sm:mt-0">
                  @{candidate.username}
                </dd>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Portfolio / Website
                </dt>
                <dd className="mt-0.5 sm:mt-0">
                  {candidate.portfolio_url ? (
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                    >
                      {candidate.portfolio_url} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </dd>
              </div>

              {candidate.github_url && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    GitHub Profile
                  </dt>
                  <dd className="mt-0.5 sm:mt-0">
                    <a
                      href={candidate.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                    >
                      {candidate.github_url} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </dd>
                </div>
              )}

              {candidate.linkedin_url && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    LinkedIn Profile
                  </dt>
                  <dd className="mt-0.5 sm:mt-0">
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                    >
                      {candidate.linkedin_url} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* 3. Bio & Professional Summary */}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-7 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-base font-bold text-slate-900">
              <FileText className="h-5 w-5 text-indigo-600" />
              Professional Summary & Resume
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Candidate Bio
                </span>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {candidate.bio || "No professional biography submitted yet."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Document Attachments
                </span>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {candidate.resume_url || candidate.resume ? "Candidate Resume" : "No Resume Uploaded"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {candidate.resume_url || candidate.resume ? "PDF Document" : "Candidate has not attached a resume yet."}
                      </p>
                    </div>
                  </div>
                  {(candidate.resume_url || candidate.resume) && (
                    <a
                      href={candidate.resume_url || candidate.resume || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                    >
                      View Resume
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
