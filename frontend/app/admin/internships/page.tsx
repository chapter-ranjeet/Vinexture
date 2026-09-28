"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  FileCode,
  FolderGit2,
  HelpCircle,
  Loader2,
  Lock,
  Plus,
  QrCode,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { fetchJson, postJson, uploadFormData } from "@/lib/api";

type ProjectConfig = {
  id?: number;
  title: string;
  description: string;
  instructions: string;
  order: number;
  default_days: number;
};

type PreviousQrItem = {
  internship_id: number;
  internship_title: string;
  file_name: string;
  url: string;
  updated_at?: string;
};

type Internship = {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration: string;
  internship_type: string;
  category: string;
  skills_required: string;
  eligibility: string;
  available_seats: number | null;
  start_date: string | null;
  application_deadline: string | null;
  status: "draft" | "published" | "closed";
  project_count?: number;
  projects?: ProjectConfig[];
  application_fee: string;
  nepal_application_fee: string;
  currency: string;
  india_payment_qr_url: string | null;
  nepal_payment_qr_url: string | null;
  payment_instructions: string;
  created_at: string;
};

const defaultInitialProjects: ProjectConfig[] = [
  {
    order: 1,
    title: "Project 1: Foundations & Architecture",
    description: "Analyze core problem specifications, review reference architecture, and deliver initial design or data schema.",
    instructions: "Submit a GitHub repository containing architectural blueprint, requirements breakdown, and environment setup scripts.",
    default_days: 5,
  },
  {
    order: 2,
    title: "Project 2: Core Implementation",
    description: "Develop the primary logic, user interface components, or data transformation modules.",
    instructions: "Provide working source code with unit test coverage and complete README documentation in your GitHub repository.",
    default_days: 7,
  },
];

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [internshipType, setInternshipType] = useState<"remote" | "onsite" | "hybrid">("remote");
  const [category, setCategory] = useState("Product & Design");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [availableSeats, setAvailableSeats] = useState<number | "">(10);
  const [startDate, setStartDate] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "closed">("published");

  // Payment & QR Fields
  const [applicationFee, setApplicationFee] = useState("99.00");
  const [nepalApplicationFee, setNepalApplicationFee] = useState("99.00");
  const [currency, setCurrency] = useState("INR");
  const [paymentInstructions, setPaymentInstructions] = useState(
    "Scan the QR code to pay the application fee. Enter the Transaction ID and payment phone number to proceed."
  );

  // Projects Configuration (Up to 5 Projects)
  const [projects, setProjects] = useState<ProjectConfig[]>(defaultInitialProjects);

  // Upload Files & Previews
  const [indiaQrFile, setIndiaQrFile] = useState<File | null>(null);
  const [nepalQrFile, setNepalQrFile] = useState<File | null>(null);
  const [currentIndiaQrUrl, setCurrentIndiaQrUrl] = useState<string | null>(null);
  const [currentNepalQrUrl, setCurrentNepalQrUrl] = useState<string | null>(null);

  // Previous QR Library
  const [previousIndiaQrs, setPreviousIndiaQrs] = useState<PreviousQrItem[]>([]);
  const [previousNepalQrs, setPreviousNepalQrs] = useState<PreviousQrItem[]>([]);
  const [selectedPreviousIndiaQr, setSelectedPreviousIndiaQr] = useState<PreviousQrItem | null>(null);
  const [selectedPreviousNepalQr, setSelectedPreviousNepalQr] = useState<PreviousQrItem | null>(null);
  const [clearIndiaQr, setClearIndiaQr] = useState(false);
  const [clearNepalQr, setClearNepalQr] = useState(false);

  // Deletion modals & states
  const [deleteModalTarget, setDeleteModalTarget] = useState<Internship | null>(null);
  const [deletingInternship, setDeletingInternship] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInternships() {
    try {
      setLoading(true);
      const payload = await fetchJson<{ results?: Internship[] } | Internship[]>("/admin/internships/");
      setInternships(Array.isArray(payload) ? payload : payload.results || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load internships.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreviousQrs() {
    try {
      const res = await fetchJson<{ india_qrs?: PreviousQrItem[]; nepal_qrs?: PreviousQrItem[] }>(
        "/admin/internships/payment-qrs/"
      );
      if (res) {
        setPreviousIndiaQrs(res.india_qrs || []);
        setPreviousNepalQrs(res.nepal_qrs || []);
      }
    } catch {
      // Non-critical background load
    }
  }

  useEffect(() => {
    void loadInternships();
    void loadPreviousQrs();
  }, []);


  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setDuration("3 Months");
    setInternshipType("remote");
    setCategory("Product & Design");
    setSkillsRequired("");
    setEligibility("");
    setAvailableSeats(10);
    setStartDate("");
    setApplicationDeadline("");
    setStatus("published");
    setApplicationFee("99.00");
    setNepalApplicationFee("99.00");
    setCurrency("INR");
    setPaymentInstructions(
      "Scan the QR code to pay the application fee. Enter the Transaction ID and payment phone number to proceed."
    );
    setProjects(defaultInitialProjects);
    setIndiaQrFile(null);
    setNepalQrFile(null);
    setCurrentIndiaQrUrl(null);
    setCurrentNepalQrUrl(null);
    setSelectedPreviousIndiaQr(null);
    setSelectedPreviousNepalQr(null);
    setClearIndiaQr(false);
    setClearNepalQr(false);
  }

  async function startEdit(internship: Internship) {
    setEditingId(internship.id);
    setTitle(internship.title || "");
    setSlug(internship.slug || "");
    setDescription(internship.description || "");
    setDuration(internship.duration || "3 Months");
    setInternshipType((internship.internship_type as "remote" | "onsite" | "hybrid") || "remote");
    setCategory(internship.category || "Product & Design");
    setSkillsRequired(internship.skills_required || "");
    setEligibility(internship.eligibility || "");
    setAvailableSeats(internship.available_seats ?? 10);
    setStartDate(internship.start_date ? internship.start_date.slice(0, 10) : "");
    if (internship.application_deadline) {
      const dt = new Date(internship.application_deadline);
      const iso = dt.toISOString().slice(0, 16);
      setApplicationDeadline(iso);
    } else {
      setApplicationDeadline("");
    }
    setStatus(internship.status || "published");
    setApplicationFee(internship.application_fee || "99.00");
    setNepalApplicationFee(internship.nepal_application_fee || "99.00");
    setCurrency(internship.currency || "INR");
    setPaymentInstructions(
      internship.payment_instructions ||
        "Scan the QR code to pay the application fee. Enter the Transaction ID and payment phone number to proceed."
    );
    setCurrentIndiaQrUrl(internship.india_payment_qr_url);
    setCurrentNepalQrUrl(internship.nepal_payment_qr_url);
    setIndiaQrFile(null);
    setNepalQrFile(null);
    setSelectedPreviousIndiaQr(null);
    setSelectedPreviousNepalQr(null);
    setClearIndiaQr(false);
    setClearNepalQr(false);

    // Fetch existing projects for this internship
    try {
      const projRes = await fetchJson<{ results?: ProjectConfig[] } | ProjectConfig[]>(
        `/admin/internships/${internship.id}/projects/`
      );
      const list = Array.isArray(projRes) ? projRes : projRes.results || [];
      if (list.length > 0) {
        setProjects(list.sort((a, b) => a.order - b.order));
      } else {
        setProjects(defaultInitialProjects);
      }
    } catch {
      setProjects(defaultInitialProjects);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Project management helpers
  function addProject() {
    if (projects.length >= 5) {
      setError("An internship can have a maximum of 5 projects.");
      return;
    }
    const nextOrder = projects.length + 1;
    setProjects([
      ...projects,
      {
        order: nextOrder,
        title: `Project ${nextOrder}: Milestone Title`,
        description: "Specify the deliverable and expected functionality...",
        instructions: "Requirements for submission via GitHub repository link...",
        default_days: nextOrder === 3 ? 10 : nextOrder === 5 ? 14 : 7,
      },
    ]);
  }

  function removeProject(indexToRemove: number) {
    const filtered = projects.filter((_, idx) => idx !== indexToRemove);
    // Re-index orders 1..N
    const reindexed = filtered.map((p, idx) => ({ ...p, order: idx + 1 }));
    setProjects(reindexed);
  }

  async function handleDeleteProject(index: number) {
    const proj = projects[index];
    if (projects.length <= 1) {
      setError("An internship requires at least 1 milestone project.");
      return;
    }

    if (proj.id) {
      const ok = window.confirm(`Permanently delete Project #${proj.order}: "${proj.title}"?`);
      if (!ok) return;

      try {
        setDeletingProjectId(proj.id);
        await fetchJson(`/admin/projects/${proj.id}/`, { method: "DELETE" });
        setMessage(`Project "${proj.title}" deleted.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete project.");
        return;
      } finally {
        setDeletingProjectId(null);
      }
    }

    removeProject(index);
  }

  function updateProjectField(index: number, field: keyof ProjectConfig, value: string | number) {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  }

  async function saveInternship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (slug.trim()) formData.append("slug", slug.trim());
      formData.append("description", description.trim());
      formData.append("duration", duration.trim());
      formData.append("internship_type", internshipType);
      formData.append("category", category.trim());
      formData.append("skills_required", skillsRequired.trim());
      formData.append("eligibility", eligibility.trim());
      if (availableSeats !== "") formData.append("available_seats", String(availableSeats));
      if (startDate) formData.append("start_date", startDate);
      if (applicationDeadline) {
        const isoDeadline = new Date(applicationDeadline).toISOString();
        formData.append("application_deadline", isoDeadline);
      }
      formData.append("status", status);
      formData.append("application_fee", applicationFee);
      formData.append("nepal_application_fee", nepalApplicationFee);
      formData.append("currency", currency);
      formData.append("payment_instructions", paymentInstructions.trim());

      // India QR handling
      if (indiaQrFile) {
        formData.append("india_payment_qr", indiaQrFile);
      } else if (selectedPreviousIndiaQr) {
        formData.append("copy_india_qr_from", String(selectedPreviousIndiaQr.internship_id));
        formData.append("reuse_india_qr", selectedPreviousIndiaQr.file_name);
      } else if (clearIndiaQr) {
        formData.append("clear_india_qr", "true");
      }

      // Nepal QR handling
      if (nepalQrFile) {
        formData.append("nepal_payment_qr", nepalQrFile);
      } else if (selectedPreviousNepalQr) {
        formData.append("copy_nepal_qr_from", String(selectedPreviousNepalQr.internship_id));
        formData.append("reuse_nepal_qr", selectedPreviousNepalQr.file_name);
      } else if (clearNepalQr) {
        formData.append("clear_nepal_qr", "true");
      }

      let savedInternship: Internship;
      if (editingId) {
        savedInternship = await uploadFormData<Internship>(`/admin/internships/${editingId}/`, formData, "PATCH");
      } else {
        savedInternship = await uploadFormData<Internship>("/admin/internships/", formData, "POST");
      }

      // Save configured projects
      for (const proj of projects) {
        if (!proj.title.trim()) continue;
        const projectPayload = {
          internship: savedInternship.id,
          order: proj.order,
          title: proj.title.trim(),
          description: proj.description.trim(),
          instructions: proj.instructions.trim(),
          default_days: proj.default_days || 7,
        };

        if (proj.id) {
          await fetchJson(`/admin/projects/${proj.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectPayload),
          });
        } else {
          await postJson(`/admin/internships/${savedInternship.id}/projects/`, projectPayload);
        }
      }

      setMessage(
        editingId
          ? "Internship and projects updated successfully."
          : "Internship and projects created successfully."
      );
      resetForm();
      await loadInternships();
      await loadPreviousQrs();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save internship.");
    } finally {
      setSaving(false);
    }
  }

  async function executeDeleteInternship(internship: Internship) {
    try {
      setDeletingInternship(true);
      await fetchJson(`/admin/internships/${internship.id}/`, { method: "DELETE" });
      setMessage(`Internship "${internship.title}" and its configured curriculum were deleted successfully.`);
      setDeleteModalTarget(null);
      if (editingId === internship.id) {
        resetForm();
      }
      await loadInternships();
      await loadPreviousQrs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete internship.");
    } finally {
      setDeletingInternship(false);
    }
  }


  async function quickSetStatus(internship: Internship, newStatus: "published" | "closed" | "draft") {
    try {
      setError("");
      await fetchJson(`/admin/internships/${internship.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadInternships();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <Briefcase className="h-3.5 w-3.5" /> Internship Management
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Cohorts, QR Setup & Projects
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure curriculum projects (up to 5), manage deadlines, and setup regional payment QR codes.
            </p>
          </div>

          {editingId ? (
            <Button variant="secondary" onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" /> Switch to Create New
            </Button>
          ) : null}
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

        {/* CREATE / EDIT FORM */}
        <form
          onSubmit={saveInternship}
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? `Editing Cohort (#${editingId})` : "Create New Internship Cohort"}
            </h2>
            {editingId && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                Editing Mode
              </span>
            )}
          </div>

          <div className="space-y-8">
            {/* Section 1: Core Details */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                1. Program Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AI & Full-Stack Engineering Intern"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Slug (URL identifier)</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated from title if left empty"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive description of the internship and day-to-day responsibilities..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Product & Design / Engineering / Data & AI / Operations"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Duration</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 Months / 6 Months"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Internship Mode</label>
                  <select
                    value={internshipType}
                    onChange={(e) => setInternshipType(e.target.value as "remote" | "onsite" | "hybrid")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Available Seats</label>
                  <input
                    type="number"
                    min={0}
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 10"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Expected Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Application Deadline (Backend Enforced)
                  </label>
                  <input
                    type="datetime-local"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published" | "closed")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="published">Published (Accepting applications)</option>
                    <option value="closed">Closed (Applications prevented)</option>
                    <option value="draft">Draft (Hidden from public)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Eligibility Criteria</label>
                  <input
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="e.g. Students in Engineering, Design, or recent graduates"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Skills Required</label>
                  <input
                    value={skillsRequired}
                    onChange={(e) => setSkillsRequired(e.target.value)}
                    placeholder="e.g. Python, React, Next.js, Figma, SQL, REST APIs"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Projects Configuration (Up to 5 Projects) */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      2. Project Curriculum (Up to 5 Projects)
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Define the projects for this cohort. <strong>Note:</strong> Durations/deadlines are{" "}
                    <strong>not fixed</strong> now — you assign individual deadlines (e.g. 5, 7, 10 days) when an applicant is{" "}
                    <strong>Accepted</strong>.
                  </p>
                </div>

                {projects.length < 5 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addProject}
                    className="gap-1.5 self-start text-xs font-semibold sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Project ({projects.length}/5)
                  </Button>
                )}
              </div>

              <div className="mt-5 space-y-4">
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {proj.order}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">Project #{proj.order}</h4>
                      </div>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          disabled={deletingProjectId === proj.id}
                          onClick={() => void handleDeleteProject(idx)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingProjectId === proj.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete Project
                        </button>
                      )}

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={proj.title}
                          onChange={(e) => updateProjectField(idx, "title", e.target.value)}
                          placeholder="e.g. Design System Foundations"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium outline-none transition focus:border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Suggested Default Duration (Days)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={proj.default_days}
                          onChange={(e) => updateProjectField(idx, "default_days", Number(e.target.value))}
                          placeholder="e.g. 7"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium outline-none transition focus:border-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Project Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={proj.description}
                          onChange={(e) => updateProjectField(idx, "description", e.target.value)}
                          placeholder="What the intern will build or accomplish in this project..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-slate-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Requirements & Submission Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={proj.instructions}
                          onChange={(e) => updateProjectField(idx, "instructions", e.target.value)}
                          placeholder="What needs to be in their GitHub repository (e.g. tests, README, live preview)..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Payment & QR Settings */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                3. Application Fee & QR Codes
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    India Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={applicationFee}
                    onChange={(e) => setApplicationFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Nepal Fee (NPR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={nepalApplicationFee}
                    onChange={(e) => setNepalApplicationFee(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Currency</label>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Payment Instructions</label>
                  <input
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Instructions shown to candidate on the QR payment step..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* QR Upload & Previous QR Library Cards */}
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {/* India UPI QR */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        India Payment QR (UPI QR Image)
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Displayed dynamically to Indian applicants (₹{applicationFee}).
                      </p>
                    </div>
                    {(currentIndiaQrUrl || indiaQrFile || selectedPreviousIndiaQr) && !clearIndiaQr ? (
                      <button
                        type="button"
                        onClick={() => {
                          setClearIndiaQr(true);
                          setIndiaQrFile(null);
                          setSelectedPreviousIndiaQr(null);
                        }}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                      >
                        Remove QR
                      </button>
                    ) : clearIndiaQr ? (
                      <button
                        type="button"
                        onClick={() => setClearIndiaQr(false)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Undo Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    {clearIndiaQr ? (
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 text-[10px] font-bold text-red-700 text-center p-1">
                        Removed
                      </div>
                    ) : indiaQrFile ? (
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 text-center p-1">
                        New File
                      </div>
                    ) : selectedPreviousIndiaQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPreviousIndiaQr.url}
                        alt="Selected India QR"
                        className="h-20 w-20 rounded-xl border-2 border-emerald-500 object-contain bg-white p-1"
                      />
                    ) : currentIndiaQrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentIndiaQrUrl}
                        alt="India UPI QR"
                        className="h-20 w-20 rounded-xl border border-slate-200 object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                        <QrCode className="h-8 w-8" />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        id="india-qr-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIndiaQrFile(file);
                            setSelectedPreviousIndiaQr(null);
                            setClearIndiaQr(false);
                          }
                        }}
                      />
                      <label
                        htmlFor="india-qr-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {currentIndiaQrUrl || selectedPreviousIndiaQr ? "Upload New Image" : "Upload UPI QR"}
                      </label>
                      {indiaQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">{indiaQrFile.name}</p>
                      )}
                      {selectedPreviousIndiaQr && !indiaQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          Reusing from: {selectedPreviousIndiaQr.internship_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Previous India QRs Library */}
                  {previousIndiaQrs.length > 0 && (
                    <div className="mt-4 border-t border-slate-200/80 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Select from Previously Uploaded India QRs ({previousIndiaQrs.length}):
                      </p>
                      <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1">
                        {previousIndiaQrs.map((qr) => {
                          const isSelected =
                            selectedPreviousIndiaQr?.file_name === qr.file_name ||
                            (!selectedPreviousIndiaQr && !indiaQrFile && currentIndiaQrUrl === qr.url);

                          return (
                            <button
                              key={qr.file_name}
                              type="button"
                              onClick={() => {
                                setSelectedPreviousIndiaQr(qr);
                                setIndiaQrFile(null);
                                setClearIndiaQr(false);
                              }}
                              className={`flex shrink-0 items-center gap-2 rounded-xl border p-2 text-left transition ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qr.url}
                                alt={qr.internship_title}
                                className="h-10 w-10 rounded-lg border border-slate-100 object-contain bg-white p-0.5"
                              />
                              <div className="max-w-[130px]">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {qr.internship_title}
                                </p>
                                <span className={`inline-block text-[10px] font-semibold ${isSelected ? "text-emerald-700" : "text-blue-600"}`}>
                                  {isSelected ? "✓ Selected" : "Click to use"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nepal eSewa QR */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Nepal Payment QR (eSewa QR Image)
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Displayed dynamically to Nepali applicants (NPR {nepalApplicationFee}).
                      </p>
                    </div>
                    {(currentNepalQrUrl || nepalQrFile || selectedPreviousNepalQr) && !clearNepalQr ? (
                      <button
                        type="button"
                        onClick={() => {
                          setClearNepalQr(true);
                          setNepalQrFile(null);
                          setSelectedPreviousNepalQr(null);
                        }}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800"
                      >
                        Remove QR
                      </button>
                    ) : clearNepalQr ? (
                      <button
                        type="button"
                        onClick={() => setClearNepalQr(false)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Undo Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    {clearNepalQr ? (
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 text-[10px] font-bold text-red-700 text-center p-1">
                        Removed
                      </div>
                    ) : nepalQrFile ? (
                      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 text-center p-1">
                        New File
                      </div>
                    ) : selectedPreviousNepalQr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedPreviousNepalQr.url}
                        alt="Selected Nepal QR"
                        className="h-20 w-20 rounded-xl border-2 border-emerald-500 object-contain bg-white p-1"
                      />
                    ) : currentNepalQrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentNepalQrUrl}
                        alt="Nepal eSewa QR"
                        className="h-20 w-20 rounded-xl border border-slate-200 object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                        <QrCode className="h-8 w-8" />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        id="nepal-qr-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNepalQrFile(file);
                            setSelectedPreviousNepalQr(null);
                            setClearNepalQr(false);
                          }
                        }}
                      />
                      <label
                        htmlFor="nepal-qr-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {currentNepalQrUrl || selectedPreviousNepalQr ? "Upload New Image" : "Upload eSewa QR"}
                      </label>
                      {nepalQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">{nepalQrFile.name}</p>
                      )}
                      {selectedPreviousNepalQr && !nepalQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          Reusing from: {selectedPreviousNepalQr.internship_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Previous Nepal QRs Library */}
                  {previousNepalQrs.length > 0 && (
                    <div className="mt-4 border-t border-slate-200/80 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Select from Previously Uploaded Nepal QRs ({previousNepalQrs.length}):
                      </p>
                      <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1">
                        {previousNepalQrs.map((qr) => {
                          const isSelected =
                            selectedPreviousNepalQr?.file_name === qr.file_name ||
                            (!selectedPreviousNepalQr && !nepalQrFile && currentNepalQrUrl === qr.url);

                          return (
                            <button
                              key={qr.file_name}
                              type="button"
                              onClick={() => {
                                setSelectedPreviousNepalQr(qr);
                                setNepalQrFile(null);
                                setClearNepalQr(false);
                              }}
                              className={`flex shrink-0 items-center gap-2 rounded-xl border p-2 text-left transition ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qr.url}
                                alt={qr.internship_title}
                                className="h-10 w-10 rounded-lg border border-slate-100 object-contain bg-white p-0.5"
                              />
                              <div className="max-w-[130px]">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {qr.internship_title}
                                </p>
                                <span className={`inline-block text-[10px] font-semibold ${isSelected ? "text-emerald-700" : "text-emerald-600"}`}>
                                  {isSelected ? "✓ Selected" : "Click to use"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <div>
                {editingId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const cur = internships.find((i) => i.id === editingId);
                      if (cur) setDeleteModalTarget(cur);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Trash2 className="h-4 w-4" /> Delete This Internship
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="gap-2 px-6">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> {editingId ? "Update Internship & Curriculum" : "Publish Internship & Curriculum"}
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </form>

        {/* LIST OF INTERNSHIPS TABLE */}
        <section className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">Configured Internships ({internships.length})</h2>
          </div>

          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
              <span className="text-sm font-medium text-slate-500">Loading internships...</span>
            </div>
          ) : internships.length === 0 ? (
            <p className="p-8 text-sm text-slate-500">No internships found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Title & Category</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Projects</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Fee (India / Nepal)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {internships.map((internship) => {
                    const isClosed = internship.status === "closed";
                    const isPublished = internship.status === "published";
                    const projCount = internship.project_count ?? internship.projects?.length ?? 0;

                    return (
                      <tr key={internship.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{internship.title}</p>
                          <p className="text-xs text-slate-500">
                            {internship.category} • {internship.duration || "3 Months"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                            {internship.internship_type || "Remote"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <FolderGit2 className="h-3 w-3" /> {projCount} / 5 Projects
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600">
                          {internship.application_deadline ? (
                            <span>{new Date(internship.application_deadline).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-slate-400">No deadline set</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold text-slate-900">
                          ₹{internship.application_fee || "99"} / NPR {internship.nepal_application_fee || "99"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isPublished
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isClosed
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {internship.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(internship)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </button>

                            {isPublished ? (
                              <button
                                type="button"
                                onClick={() => void quickSetStatus(internship, "closed")}
                                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Close
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void quickSetStatus(internship, "published")}
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                Reopen / Publish
                              </button>
                            )}

                            <Link
                              href={`/internships#${internship.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeleteModalTarget(internship)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-800 transition"
                              title="Delete Internship"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </section>

        {/* DELETE CONFIRMATION MODAL */}
        {deleteModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Internship Cohort?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete{" "}
                <strong className="text-slate-800">{deleteModalTarget.title}</strong>? This will permanently
                remove this internship, its configured milestone projects, and any associated curriculum data. This
                action cannot be undone.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={deletingInternship}
                  onClick={() => setDeleteModalTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deletingInternship}
                  onClick={() => void executeDeleteInternship(deleteModalTarget)}
                  className="gap-2"
                >
                  {deletingInternship ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" /> Yes, Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

