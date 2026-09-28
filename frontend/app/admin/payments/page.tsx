"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Phone,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson } from "@/lib/api";

type Payment = {
  id: number;
  application: number;
  application_number?: string;
  applicant_name?: string;
  applicant_email: string;
  application_status?: string;
  internship_title?: string | null;
  amount: string;
  currency: string;
  phone_number?: string;
  country?: string;
  payment_method?: string;
  reference: string;
  receipt?: string | null;
  receipt_url?: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string;
  created_at: string;
  updated_at: string;
};

const statuses: Payment["status"][] = ["pending", "verified", "rejected"];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString() ? `?${params.toString()}` : "";

      const payload = await fetchJson<{ results?: Payment[] } | Payment[]>(`/admin/payments/${query}`);
      setPayments(Array.isArray(payload) ? payload : payload.results || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void loadPayments();
  }, [filter]);

  async function updatePayment(payment: Payment, status: Payment["status"]) {
    let rejection_reason = "";
    if (status === "rejected") {
      const reason = window.prompt("Enter the rejection reason:", payment.rejection_reason || "");
      if (reason === null) return;
      rejection_reason = reason.trim();
      if (!rejection_reason) {
        setError("A rejection reason is required to reject a payment.");
        return;
      }
    }

    setSaving(payment.id);
    setError("");
    setMessage("");

    try {
      await fetchJson<Payment>(`/admin/payments/${payment.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejection_reason }),
      });
      setMessage(
        status === "verified"
          ? `Payment verified! Associated application (${payment.application_number || `#${payment.application}`}) is now SUBMITTED.`
          : `Payment marked as ${status}.`
      );
      await loadPayments();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update payment.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <QrCode className="h-3.5 w-3.5" /> Finance Operations
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Candidate Payment Verification
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verify UPI & eSewa transaction references. Approving a payment automatically advances the candidate application to SUBMITTED.
          </p>
        </div>

        {message ? (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadPayments();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Transaction ID, Phone, Email, Ref..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </form>

          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium text-slate-500">Loading submitted payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <QrCode className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-3 font-bold text-slate-900">No payment submissions found</p>
              <p className="mt-1 text-xs text-slate-500">
                Candidate fee transactions submitted for verification will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Transaction ID / Reference</th>
                    <th className="px-6 py-4">Applicant & Phone</th>
                    <th className="px-6 py-4">Receipt / Screenshot</th>
                    <th className="px-6 py-4">Application Ref</th>
                    <th className="px-6 py-4">Cohort</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => {
                    const isPending = payment.status === "pending";
                    const isVerified = payment.status === "verified";
                    const isRejected = payment.status === "rejected";

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-slate-950">{payment.reference}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                              {payment.payment_method === "esewa_qr" ? "eSewa Nepal" : "UPI India"}
                            </span>
                            <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {payment.applicant_name || payment.applicant_email}
                          </p>
                          <p className="text-xs text-slate-500">{payment.applicant_email}</p>
                          {payment.phone_number ? (
                            <p className="flex items-center gap-1 text-xs font-medium text-slate-700">
                              <Phone className="h-3 w-3 text-slate-400" /> {payment.phone_number}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4">
                          {payment.receipt_url ? (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-900 shadow-xs"
                              title="Open receipt or screenshot in new tab"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                              <span>View Receipt</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No receipt</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                          {payment.application_number || `APP-${payment.application}`}
                          {payment.application_status ? (
                            <p className="font-sans text-[11px] capitalize text-slate-500">
                              App: {payment.application_status}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-700">
                          {payment.internship_title || "General Application"}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-900">
                          {payment.currency === "NPR" ? "NPR" : "₹"} {payment.amount}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isVerified
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isRejected
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isVerified && <CheckCircle2 className="h-3 w-3" />}
                            {isRejected && <XCircle className="h-3 w-3" />}
                            {isPending && <Clock className="h-3 w-3" />}
                            <span className="capitalize">{payment.status}</span>
                          </span>
                          {payment.rejection_reason ? (
                            <p className="mt-1 text-[11px] text-red-600">
                              Reason: {payment.rejection_reason}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  disabled={saving === payment.id}
                                  onClick={() => void updatePayment(payment, "verified")}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {saving === payment.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  Approve & Submit
                                </button>
                                <button
                                  type="button"
                                  disabled={saving === payment.id}
                                  onClick={() => void updatePayment(payment, "rejected")}
                                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <select
                                disabled={saving === payment.id}
                                value={payment.status}
                                onChange={(e) =>
                                  void updatePayment(payment, e.target.value as Payment["status"])
                                }
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize outline-none"
                              >
                                {statuses.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
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
