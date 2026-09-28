"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  FolderGit2,
  Loader2,
  Save,
  Search,
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
  updated_at: string;
};

export default function AdminProjectsOverviewPage() {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Edit / Review Modal
  const [editingAssignment, setEditingAssignment] = useState<AdminAssignment | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AdminAssignment["status"]>("submitted");
  const [durationInput, setDurationInput] = useState<number>(7);
  const [startDateInput, setStartDateInput] = useState<string>("");
  const [savingAction, setSavingAction] = useState(false);

  async function loadAssignments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (overdueOnly) params.set("overdue", "true");

      const query = params.toString() ? `?${params.toString()}` : "";
      const payload = await fetchJson<{ results?: AdminAssignment[] } | AdminAssignment[]>(
        `/admin/assignments/${query}`
      );
      setAssignments(Array.isArray(payload) ? payload : payload.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssignments();
  }, [statusFilter, overdueOnly]);

  function openEditModal(assignment: AdminAssignment) {
    setEditingAssignment(assignment);
    setFeedbackInput(assignment.admin_feedback || "");
    setSelectedStatus(assignment.status);
    setDurationInput(assignment.duration_days || 7);
    setStartDateInput(
      assignment.assigned_start_date
        ? new Date(assignment.assigned_start_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setMessage("");
    setError("");
  }

  async function handleSaveAssignmentModal() {
    if (!editingAssignment) return;
    try {
      setSavingAction(true);
      setError("");

      const startD = startDateInput ? new Date(startDateInput) : new Date();
      const deadline = new Date(startD.getTime() + durationInput * 24 * 60 * 60 * 1000);

      const updated = await fetchJson<AdminAssignment>(
        `/admin/assignments/${editingAssignment.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: selectedStatus,
            admin_feedback: feedbackInput,
            duration_days: durationInput,
            assigned_start_date: startDateInput,
            assigned_deadline: deadline.toISOString(),
          }),
        }
      );

      setAssignments((prev) =>
        prev.map((item) => (item.id === editingAssignment.id ? updated : item))
      );
      setMessage(`Project #${updated.project_order} for ${updated.applicant_name} updated successfully!`);
      setEditingAssignment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment.");
    } finally {
      setSavingAction(false);
    }
  }

  async function quickReview(assignment: AdminAssignment, newStatus: "reviewed" | "completed") {
    try {
      setError("");
      const updated = await fetchJson<AdminAssignment>(
        `/admin/assignments/${assignment.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );
      setAssignments((prev) =>
        prev.map((item) => (item.id === assignment.id ? updated : item))
      );
      setMessage(`Project #${updated.project_order} marked as "${newStatus}"!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project status.");
    }
  }

  // Quick metrics
  const totalCount = assignments.length;
  const submittedCount = assignments.filter((a) => a.status === "submitted").length;
  const overdueCount = assignments.filter(
    (a) => a.is_overdue && a.status !== "submitted" && a.status !== "reviewed" && a.status !== "completed"
  ).length;
  const completedCount = assignments.filter((a) => a.status === "completed").length;

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            <FolderGit2 className="h-3.5 w-3.5" /> Project Curriculum Operations
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Assigned Projects & Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track individual project progress, assign durations and deadlines, evaluate submitted GitHub links, and identify overdue deliverables.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            {error}
          </div>
        ) : null}

        {/* Metric Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Projects</span>
            <p className="mt-1 text-3xl font-extrabold text-slate-950">{totalCount}</p>
          </div>
          <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-700">Submitted (Needs Review)</span>
            <p className="mt-1 text-3xl font-extrabold text-amber-900">{submittedCount}</p>
          </div>
          <div className="rounded-[1.6rem] border border-red-200 bg-red-50/50 p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-red-700">Overdue Deliverables</span>
            <p className="mt-1 text-3xl font-extrabold text-red-900">{overdueCount}</p>
          </div>
          <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-700">Completed Projects</span>
            <p className="mt-1 text-3xl font-extrabold text-emerald-900">{completedCount}</p>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAssignments();
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, email, project, GitHub repo..."
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs outline-none transition focus:border-slate-400 shadow-sm"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 outline-none shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted (Needs Review)</option>
              <option value="reviewed">Reviewed</option>
              <option value="completed">Completed</option>
            </select>

            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className={overdueOnly ? "text-red-700 font-bold" : ""}>Overdue Only</span>
            </label>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium text-slate-500">Loading project deliverables...</span>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <FolderGit2 className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-3 font-bold text-slate-900">No project assignments found</p>
              <p className="mt-1 text-xs text-slate-500">Try clearing filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Candidate & Cohort</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Schedule & Deadline</th>
                    <th className="px-6 py-4">Submitted GitHub Repo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => {
                    const isOverdue =
                      assignment.is_overdue &&
                      assignment.status !== "submitted" &&
                      assignment.status !== "reviewed" &&
                      assignment.status !== "completed";

                    return (
                      <tr key={assignment.id} className="hover:bg-slate-50/50">
                        {/* Candidate */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{assignment.applicant_name || "Intern"}</p>
                          <p className="text-slate-500">{assignment.applicant_email}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {assignment.application_number}
                            </span>
                            <span className="text-[11px] text-slate-600 truncate max-w-[160px]">
                              {assignment.internship_title}
                            </span>
                          </div>
                        </td>

                        {/* Project Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">
                              #{assignment.project_order}
                            </span>
                            <span className="font-semibold text-slate-900">{assignment.project_title}</span>
                          </div>
                          {assignment.project_description && (
                            <p className="mt-1 text-slate-500 line-clamp-2 max-w-[240px]">
                              {assignment.project_description}
                            </p>
                          )}
                        </td>

                        {/* Schedule & Deadline */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">
                            {assignment.duration_days} Days allocated
                          </p>
                          <div className="mt-0.5 text-slate-500">
                            Deadline:{" "}
                            <span className="font-semibold text-slate-700">
                              {assignment.assigned_deadline
                                ? new Date(assignment.assigned_deadline).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Not set"}
                            </span>
                          </div>
                          {isOverdue && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 font-bold text-red-800">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </td>

                        {/* GitHub Submission */}
                        <td className="px-6 py-4">
                          {assignment.github_url ? (
                            <div className="space-y-1">
                              <a
                                href={assignment.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-blue-600 underline hover:text-blue-800 max-w-[200px] truncate"
                              >
                                <GithubIcon className="h-3.5 w-3.5 text-slate-700 shrink-0" />
                                <span className="truncate">{assignment.github_url}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                              {assignment.submitted_at && (
                                <p className="text-[10px] text-slate-400">
                                  {new Date(assignment.submitted_at).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No repo submitted yet</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                              assignment.status === "completed"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                                : assignment.status === "reviewed"
                                ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                                : assignment.status === "submitted"
                                ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                                : assignment.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {assignment.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {assignment.status === "submitted" && (
                              <button
                                type="button"
                                onClick={() => quickReview(assignment, "reviewed")}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                              >
                                <Check className="h-3 w-3" /> Review
                              </button>
                            )}

                            {assignment.status === "reviewed" && (
                              <button
                                type="button"
                                onClick={() => quickReview(assignment, "completed")}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Complete
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openEditModal(assignment)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit / Evaluate
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

        {/* Edit / Review Modal */}
        {editingAssignment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                      Project {editingAssignment.project_order}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {editingAssignment.application_number}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    {editingAssignment.project_title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate: <strong>{editingAssignment.applicant_name}</strong> ({editingAssignment.applicant_email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-5 text-xs">
                {/* Description & Requirements */}
                {editingAssignment.project_description && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-800">Description:</p>
                    <p className="mt-0.5 text-slate-600">{editingAssignment.project_description}</p>
                  </div>
                )}

                {/* Duration & Start Date */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700">
                    Adjust Duration & Deadline
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-slate-500 mb-1 font-medium">Duration (Days):</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={durationInput}
                          onChange={(e) => setDurationInput(parseInt(e.target.value) || 1)}
                          className="w-full rounded-xl border border-slate-200 p-2 font-semibold outline-none focus:border-slate-400"
                        />
                        {[5, 7, 10, 14].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDurationInput(d)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold border ${
                              durationInput === d ? "bg-slate-900 text-white" : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-medium">Start Date:</label>
                      <input
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2 outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate GitHub link */}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Submitted Repository
                  </h4>
                  {editingAssignment.github_url ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 truncate">
                        <GithubIcon className="h-4 w-4 text-slate-700 shrink-0" />
                        <span className="font-mono text-blue-600 truncate">{editingAssignment.github_url}</span>
                      </div>
                      <a
                        href={editingAssignment.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        <ExternalLink className="h-3 w-3" /> Visit Repository
                      </a>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No repository submitted by candidate yet.</p>
                  )}
                </div>

                {/* Evaluation Status & Feedback */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700">
                    Evaluation & Feedback
                  </h4>
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Project Status:</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as AdminAssignment["status"])}
                      className="w-full rounded-xl border border-slate-200 p-2 font-semibold capitalize outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Mentor Review Feedback:</label>
                    <textarea
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Write feedback notes, praise, or code suggestions for the intern..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingAction}
                  onClick={handleSaveAssignmentModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminShell>
  );
}
