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

  useEffect(() => {
    void loadInternships();
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

      if (indiaQrFile) {
        formData.append("india_payment_qr", indiaQrFile);
      }
      if (nepalQrFile) {
        formData.append("nepal_payment_qr", nepalQrFile);
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save internship.");
    } finally {
      setSaving(false);
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
                          onClick={() => removeProject(idx)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
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

              {/* QR Upload Cards */}
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {/* India UPI QR */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    India Payment QR (UPI QR Image)
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Displayed dynamically to Indian applicants (₹{applicationFee}).
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    {indiaQrFile ? (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                        New file
                      </div>
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
                          if (file) setIndiaQrFile(file);
                        }}
                      />
                      <label
                        htmlFor="india-qr-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {currentIndiaQrUrl ? "Replace UPI QR" : "Upload UPI QR"}
                      </label>
                      {indiaQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">{indiaQrFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nepal eSewa QR */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nepal Payment QR (eSewa QR Image)
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Displayed dynamically to Nepali applicants (NPR {nepalApplicationFee}).
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    {nepalQrFile ? (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700">
                        New file
                      </div>
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
                          if (file) setNepalQrFile(file);
                        }}
                      />
                      <label
                        htmlFor="nepal-qr-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {currentNepalQrUrl ? "Replace eSewa QR" : "Upload eSewa QR"}
                      </label>
                      {nepalQrFile && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">{nepalQrFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
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
      </main>
    </AdminShell>
  );
}
