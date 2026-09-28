"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { fetchJson } from "@/lib/api";

type VerificationData = {
  offer_letter_number: string;
  verification_code: string;
  candidate_name: string;
  candidate_email: string;
  internship_title: string;
  duration: string;
  mode: string;
  start_date: string;
  end_date: string;
  stipend: string;
  issue_date: string;
  acceptance_deadline: string;
  accepted_at: string | null;
  status: "draft" | "issued" | "accepted" | "expired" | "revoked";
  status_label: string;
  is_valid: boolean;
};

type VerificationResponse = {
  found: boolean;
  is_valid: boolean;
  message?: string;
  data?: VerificationData;
};

export default function VerifyOfferPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params?.code || "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError("");

    fetchJson<VerificationResponse>(`/offers/verify/${encodeURIComponent(code)}/`)
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Offer letter not found or invalid code.");
        setResult(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/offers/verify/${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const offer = result?.data;
  const isValid = result?.is_valid;
  const isAccepted = offer?.status === "accepted";
  const isRevoked = offer?.status === "revoked";
  const isExpired = offer?.status === "expired";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="VINEXTURE" width={44} height={44} className="h-10 w-10 object-contain" />
            <div className="text-left">
              <span className="block text-xl font-bold tracking-tight text-slate-900 leading-none">
                VINE<span className="text-red-600">X</span>TURE
              </span>
              <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold mt-1">
                Official Credential Verification
              </span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Offer Letter Verification
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Authenticating official internship offer credentials issued by VINEXTURE Technology Solutions.
          </p>
        </div>

        {/* Verification Card */}
        <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Verifying digital signature and offer record...
              </p>
              <p className="mt-1 text-xs text-slate-400">Querying: {code}</p>
            </div>
          ) : error || !result?.found || !offer ? (
            <div className="p-8 sm:p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">Invalid or Unverified Offer Letter</h2>
              <p className="mt-2 text-sm text-slate-600">
                No official VINEXTURE internship offer letter was found matching query:
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg py-1 px-3 inline-block">
                {code}
              </p>
              <p className="mt-4 text-xs text-slate-400 max-w-sm mx-auto">
                Please double-check the Offer Letter Number or scan the dynamic QR code directly from your official document.
              </p>
            </div>
          ) : (
            <div>
              {/* Top Banner Status */}
              <div
                className={`p-6 sm:p-8 text-center border-b ${
                  isAccepted
                    ? "bg-emerald-500 text-white"
                    : isValid
                    ? "bg-blue-600 text-white"
                    : isRevoked
                    ? "bg-zinc-800 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  {isAccepted ? (
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  ) : isValid ? (
                    <ShieldCheck className="h-8 w-8 text-white" />
                  ) : isRevoked ? (
                    <ShieldAlert className="h-8 w-8 text-white" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-white" />
                  )}
                </div>

                <div className="mt-3">
                  <span className="inline-block rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    {isAccepted
                      ? "Officially Verified & Accepted"
                      : isValid
                      ? "Authentic Offer Letter"
                      : isRevoked
                      ? "Offer Letter Revoked"
                      : "Offer Letter Expired"}
                  </span>
                  <h2 className="mt-2 text-xl sm:text-2xl font-black">
                    {isAccepted
                      ? "Offer Accepted by Candidate"
                      : isValid
                      ? "Issued & Valid for Acceptance"
                      : isRevoked
                      ? "This Offer Has Been Revoked"
                      : "Acceptance Deadline Expired"}
                  </h2>
                </div>
              </div>

              {/* Offer Details Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Candidate & Internship */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Candidate & Position
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{offer.candidate_name}</p>
                  <p className="text-xs text-slate-500">{offer.candidate_email}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{offer.internship_title} Intern</p>
                      <p className="text-[11px] text-slate-500">
                        {offer.duration} &bull; <span className="capitalize">{offer.mode}</span> Mode &bull; {offer.stipend}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
                      VINEXTURE
                    </span>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Offer Letter No.</p>
                    <p className="mt-1 font-mono font-bold text-slate-900">{offer.offer_letter_number}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Verification ID</p>
                    <p className="mt-1 font-mono font-bold text-slate-900">{offer.verification_code}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Date Issued</p>
                    <p className="mt-1 font-medium text-slate-800">{offer.issue_date || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      {isAccepted ? "Accepted Date" : "Acceptance Deadline"}
                    </p>
                    <p
                      className={`mt-1 font-medium ${
                        isAccepted
                          ? "text-emerald-700 font-bold"
                          : isExpired
                          ? "text-rose-600 font-bold"
                          : "text-slate-800"
                      }`}
                    >
                      {isAccepted && offer.accepted_at
                        ? new Date(offer.accepted_at).toLocaleDateString()
                        : offer.acceptance_deadline || "—"}
                    </p>
                  </div>
                </div>

                {/* Digital Verification Seal */}
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-900">Cryptographically Verified Credential</p>
                    <p className="mt-0.5">
                      This document is digitally registered by <b>VINEXTURE</b> (Global Remote Team). Authenticity is
                      verified against the official database ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search other offers */}
          <div className="border-t border-slate-100 bg-slate-50/60 p-6 sm:p-8">
            <p className="text-xs font-semibold text-slate-700">Verify Another Offer Letter</p>
            <form onSubmit={handleSearch} className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Offer Letter No. or Verification ID"
                  className="w-full rounded-full border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                Verify
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-slate-900 font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to VINEXTURE Home
              </Link>
              <Link href="/portal" className="text-blue-600 hover:underline font-medium">
                Candidate Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
