"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson, getPdfUrl, downloadPdfFile, getApiUrl } from "@/lib/api";
import { getAuthTokens } from "@/lib/auth";

type Offer = {
  id: number;
  application: number;
  application_status: string;
  applicant_email: string;
  applicant_name: string;
  candidate_name: string;
  candidate_email: string;
  internship_title: string;
  duration: string;
  mode: string;
  start_date: string;
  end_date: string;
  stipend: string;
  offer_letter_number: string;
  verification_code: string;
  status: "draft" | "issued" | "accepted" | "expired" | "revoked";
  issue_date: string | null;
  acceptance_deadline: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  revocation_reason: string;
  pdf_url: string;
  verification_url: string;
  can_accept: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
};

type EligibleApplication = {
  id: number;
  candidate_name: string;
  candidate_email: string;
  internship_title: string;
  duration: string;
  mode: string;
  stipend: string;
  has_offer: boolean;
  offer?: {
    id: number;
    offer_letter_number: string;
    status: string;
  } | null;
  accepted_date?: string | null;
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [eligibleApps, setEligibleApps] = useState<EligibleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null);
  const [revokeModalOffer, setRevokeModalOffer] = useState<Offer | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate form state
  const [selectedAppId, setSelectedAppId] = useState<number | "">("");
  const [genCandidateName, setGenCandidateName] = useState("");
  const [genCandidateEmail, setGenCandidateEmail] = useState("");
  const [genInternshipTitle, setGenInternshipTitle] = useState("");
  const [genDuration, setGenDuration] = useState("4 Weeks");
  const [genMode, setGenMode] = useState("Remote");
  const [genStipend, setGenStipend] = useState("Unpaid");
  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [genIssueImmediately, setGenIssueImmediately] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function handleDownload(offer: Offer) {
    try {
      setDownloadingId(offer.id);
      await downloadPdfFile(
        `admin/offers/${offer.id}/pdf/`,
        `VINEXTURE_Offer_Letter_${offer.offer_letter_number || offer.id}.pdf`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to download offer letter PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
  const [previewPdfLoading, setPreviewPdfLoading] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState("");

  useEffect(() => {
    if (!previewOffer) {
      if (previewPdfBlobUrl) {
        URL.revokeObjectURL(previewPdfBlobUrl);
      }
      setPreviewPdfBlobUrl(null);
      setPreviewPdfError("");
      return;
    }

    let isMounted = true;
    setPreviewPdfLoading(true);
    setPreviewPdfError("");

    async function loadPdf() {
      try {
        const url = getApiUrl(`admin/offers/${previewOffer!.id}/pdf/`);
        const tokens = getAuthTokens();
        const headers = new Headers();
        if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);

        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status} while loading PDF.`);
        }
        const blob = await response.blob();
        if (isMounted) {
          const blobUrl = URL.createObjectURL(blob);
          setPreviewPdfBlobUrl(blobUrl);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setPreviewPdfError(err instanceof Error ? err.message : "Failed to load offer letter preview.");
        }
      } finally {
        if (isMounted) {
          setPreviewPdfLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [previewOffer]);

  // Load offer letters
  async function loadOffers() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const endpoint = `/admin/offers/${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await fetchJson<{ results?: Offer[] } | Offer[]>(endpoint);
      setOffers(Array.isArray(data) ? data : data.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load offer letters.");
    } finally {
      setLoading(false);
    }
  }

  // Load candidates eligible for an offer (status: accepted)
  async function loadEligibleApplications() {
    try {
      const data = await fetchJson<EligibleApplication[]>("/admin/offers/eligible-applications/");
      setEligibleApps(Array.isArray(data) ? data : []);
    } catch {
      // Non-fatal
    }
  }

  useEffect(() => {
    loadOffers();
    loadEligibleApplications();
  }, [statusFilter]);

  // When search changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOffers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-populate form when selecting an application in the modal
  function handleSelectApplication(appIdStr: string) {
    const id = Number(appIdStr);
    setSelectedAppId(id || "");
    const app = eligibleApps.find((a) => a.id === id);
    if (app) {
      setGenCandidateName(app.candidate_name);
      setGenCandidateEmail(app.candidate_email);
      setGenInternshipTitle(app.internship_title);
      setGenDuration(app.duration || "4 Weeks");
      setGenMode(app.mode || "Remote");
      setGenStipend(app.stipend || "Unpaid");

      // Default start date = next Monday
      const now = new Date();
      const nextMon = new Date(now.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7)));
      const startIso = nextMon.toISOString().split("T")[0];
      setGenStartDate(startIso);

      // Default end date = 4 weeks later
      const endD = new Date(nextMon);
      endD.setDate(endD.getDate() + 28);
      setGenEndDate(endD.toISOString().split("T")[0]);
    }
  }

  // Generate offer letter submit
  async function handleGenerateOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppId) {
      setError("Please select an eligible accepted candidate application.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const payload = {
        application: selectedAppId,
        candidate_name: genCandidateName,
        candidate_email: genCandidateEmail,
        internship_title: genInternshipTitle,
        duration: genDuration,
        mode: genMode,
        stipend: genStipend,
        start_date: genStartDate,
        end_date: genEndDate,
        status: genIssueImmediately ? "issued" : "draft",
      };

      await fetchJson("/admin/offers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSuccessMsg(
        genIssueImmediately
          ? `Offer letter generated and issued successfully! Acceptance deadline set to 2 days.`
          : `Offer letter drafted successfully.`
      );
      setIsGenerateModalOpen(false);
      setSelectedAppId("");
      await loadOffers();
      await loadEligibleApplications();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate offer letter.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Issue an existing draft or expired offer
  async function handleIssueOffer(offerId: number) {
    if (!confirm("Issue this offer letter now? The 2-day acceptance deadline will start immediately.")) {
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      await fetchJson(`/admin/offers/${offerId}/issue/`, {
        method: "POST",
      });
      setSuccessMsg("Offer letter issued successfully! Candidate notified.");
      await loadOffers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to issue offer letter.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Revoke offer submit
  async function handleRevokeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!revokeModalOffer) return;
    try {
      setIsSubmitting(true);
      setError("");
      await fetchJson(`/admin/offers/${revokeModalOffer.id}/revoke/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revocationReason }),
      });
      setSuccessMsg(`Offer ${revokeModalOffer.offer_letter_number} revoked.`);
      setRevokeModalOffer(null);
      setRevocationReason("");
      await loadOffers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke offer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Stats
  const stats = useMemo(() => {
    return {
      total: offers.length,
      draft: offers.filter((o) => o.status === "draft").length,
      issued: offers.filter((o) => o.status === "issued").length,
      accepted: offers.filter((o) => o.status === "accepted").length,
      expired: offers.filter((o) => o.status === "expired" || o.is_expired).length,
      revoked: offers.filter((o) => o.status === "revoked").length,
    };
  }, [offers]);

  // Status Badge UI
  function renderStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Accepted
          </span>
        );
      case "issued":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Clock className="h-3 w-3" /> Issued (Pending)
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <FileText className="h-3 w-3" /> Draft
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3 w-3" /> Expired
          </span>
        );
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200 line-through">
            <Ban className="h-3 w-3" /> Revoked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 capitalize">
            {status}
          </span>
        );
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-8 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <FileCheck className="h-3.5 w-3.5" /> Hiring Pipeline & Credentialing
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Offer Letters
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Generate, preview, issue, and track official single-page A4 offer letters with dynamic QR verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                loadOffers();
                loadEligibleApplications();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              <Plus className="h-4 w-4" /> Generate Offer Letter
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Issued (Pending)</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{stats.issued}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Accepted</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{stats.accepted}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Drafts</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{stats.draft}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium text-rose-700 uppercase tracking-wider">Expired</p>
            <p className="mt-1 text-2xl font-bold text-rose-900">{stats.expired}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Revoked</p>
            <p className="mt-1 text-2xl font-bold text-zinc-800">{stats.revoked}</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, email, offer letter no, or verification code..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses ({stats.total})</option>
              <option value="draft">Draft ({stats.draft})</option>
              <option value="issued">Issued ({stats.issued})</option>
              <option value="accepted">Accepted ({stats.accepted})</option>
              <option value="expired">Expired ({stats.expired})</option>
              <option value="revoked">Revoked ({stats.revoked})</option>
            </select>
          </div>
        </div>

        {/* Offer Letters Table */}
        <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Offer Letter No.</th>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Internship & Mode</th>
                  <th className="px-6 py-4">Timeline & Deadline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                      <p className="mt-2">Loading offer letters...</p>
                    </td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">
                      <FileCheck className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 font-semibold text-slate-800">No offer letters found</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {statusFilter !== "all"
                          ? `No offer letters currently in '${statusFilter}' status.`
                          : "Generate your first offer letter for a selected candidate."}
                      </p>
                      <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
                      >
                        <Plus className="h-3.5 w-3.5" /> Generate Offer Letter
                      </button>
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => {
                    const isRevoked = offer.status === "revoked";
                    const isDraft = offer.status === "draft";
                    const isIssued = offer.status === "issued";
                    const isExpired = offer.status === "expired" || offer.is_expired;

                    return (
                      <tr key={offer.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="font-bold text-slate-900">{offer.offer_letter_number}</span>
                          <span className="block text-[11px] text-slate-400">
                            Verification: {offer.verification_code}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{offer.candidate_name || offer.applicant_name}</p>
                          <p className="text-xs text-slate-500">{offer.candidate_email || offer.applicant_email}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{offer.internship_title}</p>
                          <p className="text-xs text-slate-500">
                            {offer.duration} • <span className="capitalize">{offer.mode}</span> • {offer.stipend}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          {offer.issue_date ? (
                            <>
                              <p className="text-slate-700">
                                <b>Issued:</b> {offer.issue_date}
                              </p>
                              {offer.acceptance_deadline && (
                                <p
                                  className={`mt-0.5 ${
                                    isExpired
                                      ? "text-rose-600 font-semibold"
                                      : isIssued
                                      ? "text-amber-700 font-medium"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <b>Deadline:</b> {offer.acceptance_deadline}
                                </p>
                              )}
                              {offer.accepted_at && (
                                <p className="mt-0.5 text-emerald-700 font-medium">
                                  <b>Accepted:</b> {new Date(offer.accepted_at).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">Not issued yet</span>
                          )}
                        </td>

                        <td className="px-6 py-4">{renderStatusBadge(offer.status)}</td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() => setPreviewOffer(offer)}
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="Preview Offer Letter"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Download PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownload(offer)}
                              disabled={downloadingId === offer.id}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
                              title="Download Single-page A4 PDF"
                            >
                              {downloadingId === offer.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>

                            {/* Verify QR / Public Verification page */}
                            <Link
                              href={`/offers/verify/${offer.verification_code}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                              title="Open Verification Page"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Link>

                            {/* Issue Button (if draft or expired) */}
                            {(isDraft || isExpired) && !isRevoked && (
                              <button
                                type="button"
                                onClick={() => handleIssueOffer(offer.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                                title="Issue Offer with 2-day acceptance deadline"
                              >
                                <Send className="h-3 w-3" /> Issue
                              </button>
                            )}

                            {/* Revoke Button */}
                            {!isRevoked && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRevokeModalOffer(offer);
                                  setRevocationReason("");
                                }}
                                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                                title="Revoke Offer"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: GENERATE OFFER LETTER (Restricted to SELECTED / ACCEPTED candidates) */}
        {/* ========================================================================= */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Generate Official Offer Letter</h2>
                    <p className="text-xs text-slate-500">
                      Restricted to selected/accepted candidate applications.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateOffer} className="mt-6 space-y-4">
                {/* Candidate Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Select Accepted Candidate Application *
                  </label>
                  <select
                    required
                    value={selectedAppId}
                    onChange={(e) => handleSelectApplication(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choose an accepted candidate --</option>
                    {eligibleApps.map((app) => (
                      <option key={app.id} value={app.id} disabled={app.has_offer}>
                        {app.candidate_name} ({app.candidate_email}) — {app.internship_title}
                        {app.has_offer ? ` [Already Has Offer: ${app.offer?.offer_letter_number}]` : " [Eligible]"}
                      </option>
                    ))}
                  </select>
                  {eligibleApps.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No accepted candidates found. First mark an application as &quot;Accepted&quot; in Admin &rarr; Applications.
                    </p>
                  )}
                </div>

                {selectedAppId && (
                  <>
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs space-y-1">
                      <p className="font-semibold text-slate-900">Auto-populated Details:</p>
                      <p className="text-slate-600">
                        Candidate: <b>{genCandidateName}</b> &bull; Email: <b>{genCandidateEmail}</b>
                      </p>
                      <p className="text-slate-600">
                        Internship: <b>{genInternshipTitle}</b> &bull; Mode: <b>{genMode}</b>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Candidate Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={genCandidateName}
                          onChange={(e) => setGenCandidateName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Candidate Email
                        </label>
                        <input
                          type="email"
                          required
                          value={genCandidateEmail}
                          onChange={(e) => setGenCandidateEmail(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Duration
                        </label>
                        <input
                          type="text"
                          required
                          value={genDuration}
                          onChange={(e) => setGenDuration(e.target.value)}
                          placeholder="e.g. 4 Weeks"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Mode
                        </label>
                        <select
                          value={genMode}
                          onChange={(e) => setGenMode(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Stipend
                        </label>
                        <input
                          type="text"
                          required
                          value={genStipend}
                          onChange={(e) => setGenStipend(e.target.value)}
                          placeholder="e.g. Unpaid or Rs. 10,000 / month"
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Start Date
                        </label>
                        <input
                          type="date"
                          required
                          value={genStartDate}
                          onChange={(e) => setGenStartDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                          End Date
                        </label>
                        <input
                          type="date"
                          required
                          value={genEndDate}
                          onChange={(e) => setGenEndDate(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Issue Option */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genIssueImmediately}
                          onChange={(e) => setGenIssueImmediately(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-blue-900">
                            Issue Immediately (Candidate Can Accept Now)
                          </p>
                          <p className="text-[11px] text-blue-700">
                            Sets issue date to today and initiates the 2-day acceptance deadline. Sends a notification to the candidate.
                          </p>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="rounded-full px-5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedAppId || isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-3.5 w-3.5" /> Generate & Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: PREVIEW OFFER LETTER */}
        {/* ========================================================================= */}
        {previewOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Offer Letter Preview: {previewOffer.offer_letter_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate: {previewOffer.candidate_name} &bull; Status: {previewOffer.status.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(previewOffer)}
                    disabled={downloadingId === previewOffer.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    {downloadingId === previewOffer.id ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" /> Download A4 PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewOffer(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Embedded PDF Viewer or iframe */}
              <div className="flex-1 p-4 bg-slate-100 min-h-[520px] flex flex-col justify-center items-center">
                {previewPdfLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <RefreshCw className="h-9 w-9 animate-spin text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Generating & Loading Offer Letter...</p>
                      <p className="text-xs text-slate-500 mt-1">Populating official VINEXTURE letterhead, seal, and QR verification</p>
                    </div>
                  </div>
                ) : previewPdfError ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 text-center max-w-md">
                    <AlertCircle className="h-10 w-10 text-rose-500" />
                    <p className="text-sm font-bold text-slate-900">Could not render preview</p>
                    <p className="text-xs text-rose-600">{previewPdfError}</p>
                    <button
                      type="button"
                      onClick={() => handleDownload(previewOffer)}
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF Instead
                    </button>
                  </div>
                ) : previewPdfBlobUrl ? (
                  <object
                    data={`${previewPdfBlobUrl}#toolbar=1`}
                    type="application/pdf"
                    className="w-full h-full min-h-[520px] rounded-xl border border-slate-300 bg-white"
                  >
                    <iframe
                      src={`${previewPdfBlobUrl}#toolbar=1`}
                      className="w-full h-full min-h-[520px] rounded-xl border border-slate-300 bg-white"
                      title="Offer Letter PDF"
                    />
                  </object>
                ) : null}
              </div>

              {/* Footer info */}
              <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <span>
                  <b>Verification ID:</b> {previewOffer.verification_code}
                </span>
                <Link
                  href={`/offers/verify/${previewOffer.verification_code}`}
                  target="_blank"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Open Verification Page <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: REVOKE OFFER */}
        {/* ========================================================================= */}
        {revokeModalOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Revoke Offer Letter</h3>
                  <p className="text-xs text-slate-500">{revokeModalOffer.offer_letter_number}</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                Revoking this offer will permanently mark it as revoked, invalidate its verification, and notify the candidate.
              </p>

              <form onSubmit={handleRevokeSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Reason for Revocation *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    placeholder="e.g. Candidate withdrew application, administrative adjustment..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs shadow-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRevokeModalOffer(null)}
                    className="rounded-full px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Ban className="h-3.5 w-3.5" /> Revoke Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
