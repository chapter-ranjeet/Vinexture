"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileBadge,
  FileText,
  FolderGit2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson } from "@/lib/api";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type Application = {
  id: number;
  application_number: string;
  user: number;
  applicant_name?: string;
  applicant_email?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  dob?: string;
  gender?: string;
  qualification?: string;
  college_university?: string;
  course?: string;
  specialization?: string;
  semester_year?: string;
  graduation_year?: string;
  cgpa?: string;
  technical_skills?: string;
  other_skills?: string;
  projects?: string;
  experience?: string;
  certifications?: string;
  resume_url?: string | null;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  preferred_mode?: string;
  availability?: string;
  expected_start_date?: string;
  why_join?: string;
  learning_expectations?: string;
  internship_title?: string;
  status: string;
  created_at: string;
  latest_payment?: {
    reference: string;
    amount: string;
    currency: string;
    phone_number: string;
    status: string;
    receipt_url?: string | null;
  } | null;
};

type AdminAssignment = {
  id: number;
  application: number;
  application_number: string;
  applicant_name: string;
  applicant_email: string;
  project: number;
  project_order: number;
  project_title: string;
  project_description: string;
  project_instructions: string;
  internship_title: string;
  assigned_start_date: string | null;
  assigned_deadline: string | null;
  duration_days: number;
  status: "pending" | "in_progress" | "submitted" | "reviewed" | "completed";
  github_url: string;
  submitted_at: string | null;
  admin_feedback: string;
  reviewed_at: string | null;
  is_overdue: boolean;
};

const statuses = [
  "draft",
  "payment_pending",
  "submitted",
  "screening",
  "interview",
  "accepted",
  "rejected",
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assigned Projects Management State
  const [assignmentModalApp, setAssignmentModalApp] = useState<Application | null>(null);
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [feedbackInputs, setFeedbackInputs] = useState<Record<number, string>>({});
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  async function loadApplications() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString() ? `?${params.toString()}` : "";

      const payload = await fetchJson<{ results?: Application[] } | Application[]>(
        `/admin/applications/${query}`
      );
      setApplications(Array.isArray(payload) ? payload : payload.results || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [filterStatus]);

  async function updateStatus(id: number, status: string) {
    setError("");
    try {
      await fetchJson<Application>(`/admin/applications/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadApplications();
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update application.");
    }
  }

  async function openAssignmentsModal(app: Application) {
    setAssignmentModalApp(app);
    setAssignmentMessage("");
    setAssignmentError("");
    setLoadingAssignments(true);
    try {
      const data = await fetchJson<AdminAssignment[] | { results?: AdminAssignment[] }>(
        `/admin/assignments/?application=${app.id}`
      );
      const list = Array.isArray(data) ? data : data.results || [];
      list.sort((a, b) => a.project_order - b.project_order);
      setAssignments(list);
      const feedbacks: Record<number, string> = {};
      list.forEach((item) => {
        if (item.admin_feedback) feedbacks[item.id] = item.admin_feedback;
      });
      setFeedbackInputs(feedbacks);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to load project assignments.");
    } finally {
      setLoadingAssignments(false);
    }
  }

  function handleDurationPreset(assignmentId: number, days: number) {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const startDate = a.assigned_start_date ? new Date(a.assigned_start_date) : new Date();
        const deadline = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
        return {
          ...a,
          duration_days: days,
          assigned_deadline: deadline.toISOString(),
        };
      })
    );
  }

  function handleStartDateChange(assignmentId: number, dateStr: string) {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const startDate = new Date(dateStr);
        const deadline = new Date(startDate.getTime() + a.duration_days * 24 * 60 * 60 * 1000);
        return {
          ...a,
          assigned_start_date: dateStr,
          assigned_deadline: deadline.toISOString(),
        };
      })
    );
  }

  function handleDaysInputChange(assignmentId: number, days: number) {
    const validDays = isNaN(days) || days < 1 ? 1 : days;
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const startDate = a.assigned_start_date ? new Date(a.assigned_start_date) : new Date();
        const deadline = new Date(startDate.getTime() + validDays * 24 * 60 * 60 * 1000);
        return {
          ...a,
          duration_days: validDays,
          assigned_deadline: deadline.toISOString(),
        };
      })
    );
  }

  async function saveProjectAssignments() {
    if (!assignmentModalApp) return;
    try {
      setSavingAssignments(true);
      setAssignmentMessage("");
      setAssignmentError("");

      const payload = {
        assignments: assignments.map((a) => ({
          project_id: a.project,
          duration_days: a.duration_days,
          assigned_start_date: a.assigned_start_date
            ? new Date(a.assigned_start_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          status: a.status,
        })),
      };

      const updated = await fetchJson<AdminAssignment[]>(
        `/admin/applications/${assignmentModalApp.id}/assign-projects/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const list = Array.isArray(updated) ? updated : [];
      list.sort((a, b) => a.project_order - b.project_order);
      setAssignments(list);
      setAssignmentMessage("Project durations, deadlines, and schedules saved successfully! Automatically synced with the Intern Portal.");
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to save project assignments.");
    } finally {
      setSavingAssignments(false);
    }
  }

  async function updateProjectReviewStatus(
    assignmentId: number,
    newStatus: AdminAssignment["status"],
    feedback?: string
  ) {
    try {
      setReviewingId(assignmentId);
      setAssignmentMessage("");
      setAssignmentError("");

      const updated = await fetchJson<AdminAssignment>(`/admin/assignments/${assignmentId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          admin_feedback: feedback !== undefined ? feedback : feedbackInputs[assignmentId] || "",
        }),
      });

      setAssignments((prev) =>
        prev.map((item) => (item.id === assignmentId ? updated : item))
      );
      setAssignmentMessage(`Project #${updated.project_order} status marked as "${newStatus.replace("_", " ")}" successfully.`);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Failed to update project status.");
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Candidate Pipeline</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Internship Applications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review detailed multi-step candidate profiles, qualifications, resume PDFs, and update pipeline status.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Filters & Search */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadApplications();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ref number, or college..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </form>

          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 outline-none"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Applications */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium text-slate-500">Loading candidate applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-3 font-bold text-slate-900">No applications found</p>
              <p className="mt-1 text-xs text-slate-500">Try clearing the search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Application Ref</th>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Cohort Program</th>
                    <th className="px-6 py-4">Education / CGPA</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((application) => {
                    const name =
                      application.full_name ||
                      application.applicant_name ||
                      application.applicant_email ||
                      `Candidate #${application.user}`;
                    const email = application.email || application.applicant_email;

                    return (
                      <tr key={application.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {application.application_number || `APP-${String(application.id).padStart(5, "0")}`}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{name}</p>
                          <p className="text-xs text-slate-500">{email}</p>
                          {application.phone ? (
                            <p className="text-xs text-slate-400">{application.phone}</p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <span className="font-medium text-slate-900">
                            {application.internship_title || "General Application"}
                          </span>
                          <p className="text-xs text-slate-500">
                            Mode: <span className="capitalize">{application.preferred_mode || "Remote"}</span>
                          </p>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600">
                          <p className="font-medium text-slate-900">
                            {application.qualification || "—"}{" "}
                            {application.course ? `(${application.course})` : ""}
                          </p>
                          <p className="text-slate-500">{application.college_university || "—"}</p>
                          {application.cgpa ? (
                            <p className="text-slate-700 font-semibold">CGPA: {application.cgpa}</p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={application.status}
                            onChange={(e) => updateStatus(application.id, e.target.value)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize outline-none"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {application.status === "accepted" && (
                              <button
                                type="button"
                                onClick={() => openAssignmentsModal(application)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                              >
                                <FolderGit2 className="h-3.5 w-3.5" /> Assigned Projects
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedApp(application)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-slate-50 transition"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </button>
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

        {/* DETAILED APPLICATION VIEW MODAL */}
        {selectedApp ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                    {selectedApp.application_number}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {selectedApp.full_name || selectedApp.applicant_name || "Candidate Application"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cohort: {selectedApp.internship_title || "General Application"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6 text-sm">
                {/* 1. Contact & Personal */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-2 font-bold text-slate-900">Personal & Contact Info</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <strong>Email:</strong> {selectedApp.email || selectedApp.applicant_email || "—"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedApp.phone || "—"}
                    </p>
                    <p>
                      <strong>Country:</strong> {selectedApp.country || "—"}
                    </p>
                    <p>
                      <strong>DOB:</strong> {selectedApp.dob || "—"}
                    </p>
                    <p>
                      <strong>Gender:</strong> <span className="capitalize">{selectedApp.gender || "—"}</span>
                    </p>
                  </div>
                </div>

                {/* 2. Education */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-2 font-bold text-slate-900">Academic Background</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <strong>Qualification:</strong> {selectedApp.qualification || "—"}
                    </p>
                    <p>
                      <strong>College / University:</strong> {selectedApp.college_university || "—"}
                    </p>
                    <p>
                      <strong>Course:</strong> {selectedApp.course || "—"}
                    </p>
                    <p>
                      <strong>Specialization:</strong> {selectedApp.specialization || "—"}
                    </p>
                    <p>
                      <strong>Semester / Year:</strong> {selectedApp.semester_year || "—"}
                    </p>
                    <p>
                      <strong>Graduation:</strong> {selectedApp.graduation_year || "—"}
                    </p>
                    <p className="sm:col-span-2">
                      <strong>CGPA:</strong> {selectedApp.cgpa || "—"}
                    </p>
                  </div>
                </div>

                {/* 3. Skills & Experience */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-2 font-bold text-slate-900">Skills & Projects</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Technical Skills:</strong> {selectedApp.technical_skills || "—"}
                    </p>
                    <p>
                      <strong>Other Skills:</strong> {selectedApp.other_skills || "—"}
                    </p>
                    <p>
                      <strong>Projects:</strong> {selectedApp.projects || "—"}
                    </p>
                    <p>
                      <strong>Experience:</strong> {selectedApp.experience || "—"}
                    </p>
                    <p>
                      <strong>Certifications:</strong> {selectedApp.certifications || "—"}
                    </p>
                  </div>
                </div>

                {/* 4. Resume & Online Profiles */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-2 font-bold text-slate-900">Documents & Profiles</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          <strong>Resume / CV:</strong>{" "}
                          {!selectedApp.resume_url && <span className="text-slate-400">Not provided</span>}
                        </span>
                        {selectedApp.resume_url && (
                          <a
                            href={selectedApp.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {selectedApp.resume_url.includes("drive.google.com")
                              ? "Open Google Drive Resume"
                              : "Open Resume Link"}
                          </a>
                        )}
                      </div>
                    </div>
                    {selectedApp.github_url && (
                      <p>
                        <strong>GitHub:</strong>{" "}
                        <a
                          href={selectedApp.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {selectedApp.github_url}
                        </a>
                      </p>
                    )}
                    {selectedApp.linkedin_url && (
                      <p>
                        <strong>LinkedIn:</strong>{" "}
                        <a
                          href={selectedApp.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {selectedApp.linkedin_url}
                        </a>
                      </p>
                    )}
                    {selectedApp.portfolio_url && (
                      <p>
                        <strong>Portfolio:</strong>{" "}
                        <a
                          href={selectedApp.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {selectedApp.portfolio_url}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Motivation & Preferences */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="mb-2 font-bold text-slate-900">Preferences & Motivation</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Preferred Mode:</strong>{" "}
                      <span className="capitalize">{selectedApp.preferred_mode || "—"}</span>
                    </p>
                    <p>
                      <strong>Availability:</strong> {selectedApp.availability || "—"}
                    </p>
                    <p>
                      <strong>Expected Start:</strong> {selectedApp.expected_start_date || "—"}
                    </p>
                    <p>
                      <strong>Why Join VINEXTURE:</strong> {selectedApp.why_join || "—"}
                    </p>
                    <p>
                      <strong>Learning Expectations:</strong> {selectedApp.learning_expectations || "—"}
                    </p>
                  </div>
                </div>

                {/* 6. Payment Information */}
                {selectedApp.latest_payment && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <h3 className="mb-2 font-bold text-slate-900 flex items-center justify-between">
                      <span>Payment Verification</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold ${
                          selectedApp.latest_payment.status === "verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedApp.latest_payment.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {selectedApp.latest_payment.status}
                      </span>
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <p>
                        <strong>Amount:</strong> {selectedApp.latest_payment.currency} {selectedApp.latest_payment.amount}
                      </p>
                      <p>
                        <strong>Transaction Ref:</strong>{" "}
                        <span className="font-mono font-bold text-slate-900">{selectedApp.latest_payment.reference}</span>
                      </p>
                      <p>
                        <strong>Payment Phone:</strong> {selectedApp.latest_payment.phone_number || "—"}
                      </p>
                      {selectedApp.latest_payment.receipt_url ? (
                        <p className="sm:col-span-2">
                          <strong>Receipt / Proof:</strong>{" "}
                          <a
                            href={selectedApp.latest_payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-600 underline hover:text-blue-800"
                          >
                            <FileText className="h-3.5 w-3.5" /> View Uploaded Receipt / Screenshot
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        </p>
                      ) : (
                        <p className="sm:col-span-2 text-slate-400 italic">No receipt attached</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Accepted Candidate Banner */}
                {selectedApp.status === "accepted" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Candidate Accepted for Cohort
                      </p>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Configure project durations (e.g. 5, 7, 10, 14 days), adjust deadlines, and evaluate submitted GitHub links.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/admin/offers"
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-white px-3.5 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition whitespace-nowrap"
                      >
                        <FileBadge className="h-3.5 w-3.5" /> Generate / View Offer
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedApp;
                          setSelectedApp(null);
                          openAssignmentsModal(target);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition whitespace-nowrap"
                      >
                        <FolderGit2 className="h-3.5 w-3.5" /> Manage Assigned Projects
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Switcher in Modal */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">Update Status:</span>
                    <select
                      value={selectedApp.status}
                      onChange={(e) => updateStatus(selectedApp.id, e.target.value)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold capitalize outline-none"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="rounded-full bg-slate-900 px-5 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ASSIGNED PROJECTS & DEADLINES MODAL */}
        {assignmentModalApp ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                      <FolderGit2 className="h-3.5 w-3.5" /> Project Curriculum Management
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {assignmentModalApp.application_number}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
                    {assignmentModalApp.full_name || assignmentModalApp.applicant_name || "Intern Projects"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cohort: <strong className="text-slate-800">{assignmentModalApp.internship_title || "Internship Program"}</strong> | Candidate Email: {assignmentModalApp.email || assignmentModalApp.applicant_email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignmentModalApp(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {assignmentMessage ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {assignmentMessage}
                </div>
              ) : null}

              {assignmentError ? (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  {assignmentError}
                </div>
              ) : null}

              {/* Body */}
              <div className="mt-6 space-y-6">
                {loadingAssignments ? (
                  <div className="flex min-h-[220px] items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
                    <span className="text-sm font-medium text-slate-600">Loading project assignments...</span>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                    <FolderGit2 className="mx-auto h-10 w-10 text-slate-400" />
                    <h4 className="mt-3 text-base font-bold text-slate-900">No Projects Configured for this Cohort</h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                      Please visit the <strong>Internships &rarr; Edit Cohort &rarr; Section 2 (Project Curriculum)</strong> to configure up to 5 projects for this internship.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                      <p>
                        <strong>Duration Rule:</strong> Durations are not fixed on internship creation. Assign individual project duration (e.g. 5, 7, 10, 14 days) per intern. Start dates default to today or sequential progression.
                      </p>
                      <button
                        type="button"
                        onClick={saveProjectAssignments}
                        disabled={savingAssignments}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                      >
                        {savingAssignments ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save All Schedules
                      </button>
                    </div>

                    {assignments.map((assignment) => {
                      const isOverdue = assignment.is_overdue && assignment.status !== "submitted" && assignment.status !== "reviewed" && assignment.status !== "completed";
                      const isReviewing = reviewingId === assignment.id;

                      return (
                        <div
                          key={assignment.id}
                          className={`rounded-[1.8rem] border p-6 transition ${
                            isOverdue
                              ? "border-red-300 bg-red-50/20"
                              : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          {/* Project Header */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-white">
                                Project {assignment.project_order}
                              </span>
                              <h3 className="text-base font-bold text-slate-950">
                                {assignment.project_title}
                              </h3>
                              {isOverdue && (
                                <span className="rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Overdue
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Status:</span>
                              <select
                                value={assignment.status}
                                onChange={(e) =>
                                  setAssignments((prev) =>
                                    prev.map((a) =>
                                      a.id === assignment.id ? { ...a, status: e.target.value as AdminAssignment["status"] } : a
                                    )
                                  )
                                }
                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold capitalize outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="submitted">Submitted</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>

                          {assignment.project_description && (
                            <p className="mt-3 text-xs leading-relaxed text-slate-600">
                              {assignment.project_description}
                            </p>
                          )}

                          {/* Schedule & Duration Configurator */}
                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Assign Duration & Deadline
                              </label>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400">Quick Presets:</span>
                                {[5, 7, 10, 14, 21].map((days) => (
                                  <button
                                    key={days}
                                    type="button"
                                    onClick={() => handleDurationPreset(assignment.id, days)}
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                                      assignment.duration_days === days
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    {days}d
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              <div>
                                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Duration (Days):
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  max="180"
                                  value={assignment.duration_days}
                                  onChange={(e) => handleDaysInputChange(assignment.id, parseInt(e.target.value))}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-slate-400"
                                />
                              </div>

                              <div>
                                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Start Date:
                                </span>
                                <input
                                  type="date"
                                  value={
                                    assignment.assigned_start_date
                                      ? new Date(assignment.assigned_start_date).toISOString().split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => handleStartDateChange(assignment.id, e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-400"
                                />
                              </div>

                              <div>
                                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Assigned Deadline:
                                </span>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 flex items-center justify-between">
                                  <span>
                                    {assignment.assigned_deadline
                                      ? new Date(assignment.assigned_deadline).toLocaleString([], {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })
                                      : "Not calculated"}
                                  </span>
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Submission and Evaluation Box */}
                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                              Candidate Submission & Mentor Review
                            </span>

                            {assignment.github_url ? (
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-white border border-slate-200 p-3">
                                  <div className="flex items-center gap-2">
                                    <GithubIcon className="h-4 w-4 text-slate-700 shrink-0" />
                                    <a
                                      href={assignment.github_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-xs font-semibold text-blue-600 underline hover:text-blue-800 break-all"
                                    >
                                      {assignment.github_url}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <a
                                      href={assignment.github_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Open GitHub Repo
                                    </a>
                                  </div>
                                </div>

                                {assignment.submitted_at && (
                                  <p className="text-[11px] text-slate-500">
                                    Submitted on:{" "}
                                    <strong>
                                      {new Date(assignment.submitted_at).toLocaleString([], {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </strong>
                                  </p>
                                )}

                                {/* Review actions & feedback note */}
                                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                  <label className="text-[11px] font-semibold text-slate-600">
                                    Mentor Review Feedback / Evaluation Notes:
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={feedbackInputs[assignment.id] ?? ""}
                                    onChange={(e) =>
                                      setFeedbackInputs((prev) => ({
                                        ...prev,
                                        [assignment.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Provide feedback on the candidate's implementation, code architecture, tests, or completion criteria..."
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-slate-400"
                                  />

                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={isReviewing}
                                      onClick={() =>
                                        updateProjectReviewStatus(
                                          assignment.id,
                                          assignment.status,
                                          feedbackInputs[assignment.id]
                                        )
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                                    >
                                      <Save className="h-3 w-3" /> Save Feedback Only
                                    </button>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isReviewing}
                                        onClick={() =>
                                          updateProjectReviewStatus(
                                            assignment.id,
                                            "reviewed",
                                            feedbackInputs[assignment.id]
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                      >
                                        {isReviewing ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                        Mark as Reviewed
                                      </button>

                                      <button
                                        type="button"
                                        disabled={isReviewing}
                                        onClick={() =>
                                          updateProjectReviewStatus(
                                            assignment.id,
                                            "completed",
                                            feedbackInputs[assignment.id]
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                                      >
                                        {isReviewing ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-3 w-3" />
                                        )}
                                        Mark as Completed
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 py-1">
                                {isOverdue ? (
                                  <span className="font-semibold text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Project is overdue. Candidate has not submitted repository before deadline.
                                  </span>
                                ) : (
                                  <span className="italic">
                                    Awaiting candidate submission. The intern must paste their GitHub repository link in the Candidate Portal before the deadline.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500">
                  Deadlines are enforced on the backend. Candidate submissions after the deadline will be rejected unless deadline is extended here.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignmentModalApp(null)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveProjectAssignments}
                    disabled={savingAssignments || assignments.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-6 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
                  >
                    {savingAssignments ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save All Project Deadlines
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminShell>
  );
}
