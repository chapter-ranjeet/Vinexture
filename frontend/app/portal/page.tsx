"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileBadge,
  FileCheck,
  FileText,
  FolderGit2,
  LogOut,
  PlayCircle,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCircle,
  X,
} from "lucide-react";

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

import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { clearAuthTokens, getAuthTokens, getUserFromAccessToken } from "@/lib/auth";

type Profile = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  headline: string;
  bio: string;
  portfolio_url: string;
  resume?: string | null;
};

type Application = {
  id: number;
  application_number: string;
  internship: number;
  internship_title: string;
  status: string;
  current_step: number;
  is_draft: boolean;
  created_at: string;
  latest_payment?: {
    id: number;
    amount: string;
    currency: string;
    reference: string;
    phone_number: string;
    status: string;
    receipt_url?: string | null;
    rejection_reason?: string;
  } | null;
};

type Internship = {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration: string;
  application_fee: string;
  is_open: boolean;
};

type ProjectAssignment = {
  id: number;
  application: number;
  application_number: string;
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

type Offer = {
  id: number;
  application: number;
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
  status: "draft" | "issued" | "accepted" | "expired" | "revoked";
  issue_date: string | null;
  acceptance_deadline: string | null;
  accepted_at: string | null;
  pdf_url: string;
  verification_url: string;
  can_accept: boolean;
  is_expired: boolean;
  created_at: string;
};

type PortalSection = "none" | "projects" | "applications" | "profile" | "offers";

export default function PortalPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Candidate");
  const [profile, setProfile] = useState<Profile>({ headline: "", bio: "", portfolio_url: "" });
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [acceptingOfferId, setAcceptingOfferId] = useState<number | null>(null);
  const [previewOfferModal, setPreviewOfferModal] = useState<Offer | null>(null);
  const [submissionUrls, setSubmissionUrls] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<Record<number, boolean>>({});
  
  // Exclusive section state: when one section is active, the others are automatically hidden!
  const [activeSection, setActiveSection] = useState<PortalSection>("none");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPortal = useCallback(async () => {
    const tokens = getAuthTokens();
    if (!tokens) {
      router.replace("/login");
      return;
    }
    const decoded = getUserFromAccessToken(tokens.access);

    const [profileData, applicationData, internshipData] = await Promise.all([
      fetchJson<Profile>("/candidates/me/"),
      fetchJson<{ results?: Application[] } | Application[]>("/applications/"),
      fetchJson<{ results?: Internship[] } | Internship[]>("/internships/"),
    ]);

    setProfile(profileData);
    const candidateName =
      profileData.name ||
      (profileData.first_name
        ? `${profileData.first_name} ${profileData.last_name || ""}`.trim()
        : "") ||
      decoded?.username ||
      decoded?.email?.split("@")[0] ||
      "Candidate";
    setUserName(candidateName);

    setApplications(Array.isArray(applicationData) ? applicationData : applicationData.results || []);
    setInternships(Array.isArray(internshipData) ? internshipData : internshipData.results || []);

    try {
      const projectsData = await fetchJson<ProjectAssignment[] | { results?: ProjectAssignment[] }>("/projects/my-projects/");
      const list = Array.isArray(projectsData) ? projectsData : projectsData?.results || [];
      setProjectAssignments(list);
      const urls: Record<number, string> = {};
      list.forEach((p) => {
        if (p.github_url) urls[p.id] = p.github_url;
      });
      setSubmissionUrls(urls);
    } catch {
      setProjectAssignments([]);
    }

    try {
      const offersData = await fetchJson<Offer[] | { results?: Offer[] }>("/offers/my/");
      setOffers(Array.isArray(offersData) ? offersData : offersData?.results || []);
    } catch {
      setOffers([]);
    }
  }, [router]);

  async function handleAcceptOffer(offerId: number) {
    if (!confirm("Confirm your acceptance of this official VINEXTURE internship offer?")) {
      return;
    }
    try {
      setAcceptingOfferId(offerId);
      setError("");
      const res = await fetchJson<{ message: string; offer: Offer }>(`/offers/${offerId}/accept/`, {
        method: "POST",
      });
      setMessage(res.message || "Offer successfully accepted! Welcome to the VINEXTURE Internship Program.");
      await loadPortal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept offer letter.");
    } finally {
      setAcceptingOfferId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPortal().catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your portal.");
      });
    }, 0);

    const handleProfileChange = () => {
      loadPortal().catch(() => {});
    };
    window.addEventListener("vinexture_profile_changed", handleProfileChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("vinexture_profile_changed", handleProfileChange);
    };
  }, [loadPortal]);

  // Handle URL query parameters and custom navigation events
  useEffect(() => {
    const checkParam = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab") as PortalSection | null;
        if (tab && ["projects", "applications", "profile", "offers"].includes(tab)) {
          setActiveSection(tab);
          setTimeout(() => {
            const el = document.getElementById("active-section-container");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      }
    };

    checkParam();

    const handleOpenSection = (e: Event) => {
      const customEvent = e as CustomEvent<PortalSection>;
      if (customEvent.detail) {
        setActiveSection(customEvent.detail);
        setTimeout(() => {
          const el = document.getElementById("active-section-container");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    };

    window.addEventListener("vinexture_open_section", handleOpenSection as EventListener);
    return () => window.removeEventListener("vinexture_open_section", handleOpenSection as EventListener);
  }, []);

  async function submitProject(assignmentId: number) {
    const rawUrl = (submissionUrls[assignmentId] || "").trim();
    if (!rawUrl) {
      setError("Please paste a valid GitHub repository URL.");
      return;
    }
    if (!/^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i.test(rawUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g. https://github.com/username/repository).");
      return;
    }

    try {
      setSubmittingId(assignmentId);
      setError("");
      setMessage("");
      const updated = await fetchJson<ProjectAssignment>(`/projects/assignments/${assignmentId}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: rawUrl }),
      });

      setProjectAssignments((prev) =>
        prev.map((item) => (item.id === assignmentId ? updated : item))
      );
      setMessage(`Project #${updated.project_order} ("${updated.project_title}") submitted successfully! Mentor review pending.`);
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : "Failed to submit project.");
    } finally {
      setSubmittingId(null);
    }
  }

  function getRemainingTime(deadlineStr: string | null, isOverdue: boolean) {
    if (!deadlineStr) return { text: "No deadline assigned", isOverdue: false, urgent: false };
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0 || isOverdue) {
      return { text: "Deadline Passed", isOverdue: true, urgent: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 2) return { text: `${days} days remaining`, isOverdue: false, urgent: false };
    if (days > 0) return { text: `${days}d ${hours}h remaining`, isOverdue: false, urgent: true };
    return { text: `${hours} hours remaining`, isOverdue: false, urgent: true };
  }

  function getProjectStatusBadge(status: string, isOverdue: boolean) {
    if (status === "completed") {
      return { label: "Approved / Completed", badge: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" };
    }
    if (status === "reviewed") {
      return { label: "Reviewed by Mentor", badge: "bg-blue-100 text-blue-800 border-blue-300 font-semibold" };
    }
    if (status === "submitted") {
      return { label: "Submitted for Review", badge: "bg-amber-100 text-amber-800 border-amber-300 font-semibold" };
    }
    if (isOverdue) {
      return { label: "Overdue", badge: "bg-red-100 text-red-800 border-red-300 font-bold" };
    }
    if (status === "in_progress") {
      return { label: "In Progress", badge: "bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold" };
    }
    return { label: "Assigned / Pending", badge: "bg-slate-100 text-slate-700 border-slate-300" };
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const updated = await fetchJson<Profile>("/candidates/me/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setProfile(updated);
      setMessage("Profile saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "draft":
        return { label: "Draft Application", badge: "bg-slate-100 text-slate-700 border-slate-300" };
      case "payment_pending":
        return { label: "Payment Verification Pending", badge: "bg-amber-100 text-amber-800 border-amber-300 font-semibold" };
      case "submitted":
        return { label: "Submitted & Under Review", badge: "bg-blue-100 text-blue-800 border-blue-300 font-semibold" };
      case "screening":
        return { label: "Screening In Progress", badge: "bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold" };
      case "interview":
        return { label: "Interview Scheduled", badge: "bg-purple-100 text-purple-800 border-purple-300 font-semibold" };
      case "accepted":
        return { label: "Accepted / Offer Extended", badge: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" };
      case "rejected":
        return { label: "Application Rejected", badge: "bg-red-100 text-red-800 border-red-300" };
      default:
        return { label: status, badge: "bg-slate-100 text-slate-700 border-slate-300" };
    }
  }

  const completedProjectsCount = projectAssignments.filter(
    (p) => p.status === "completed" || p.status === "reviewed"
  ).length;

  const pendingOffersCount = offers.filter((o) => o.status === "issued" && o.can_accept).length;
  const acceptedOffersCount = offers.filter((o) => o.status === "accepted").length;

  const cards = [
    {
      title: "Applications",
      value: String(applications.length).padStart(2, "0"),
      icon: FileText,
      section: "applications" as PortalSection,
    },
    ...(projectAssignments.length > 0
      ? [
          {
            title: "Assigned Projects",
            value: `${completedProjectsCount} / ${projectAssignments.length} Done`,
            icon: FolderGit2,
            section: "projects" as PortalSection,
          },
        ]
      : [
          {
            title: "Open Cohorts",
            value: String(internships.length).padStart(2, "0"),
            icon: Briefcase,
            section: "none" as PortalSection,
          },
        ]),
    {
      title: "My Offer Letter",
      value:
        pendingOffersCount > 0
          ? "Action Req."
          : acceptedOffersCount > 0
          ? "Accepted"
          : offers.length > 0
          ? `${offers.length} Offer`
          : "Pending",
      icon: FileBadge,
      section: "offers" as PortalSection,
    },
    {
      title: "Profile Health",
      value: profile.headline && profile.bio ? "95%" : "60%",
      icon: UserCircle,
      section: "profile" as PortalSection,
    },
  ];

  return (
    <ProtectedRoute>
      <main className="container-shell py-12 md:py-16">
        {/* Portal Top Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <Sparkles className="h-3 w-3" /> Candidate Portal
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Welcome Back, {userName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Select any section below to manage your projects, cohort applications, or profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/internships"
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Explore Cohorts
            </Link>
            <Button
              variant="secondary"
              className="gap-2 text-xs"
              onClick={() => {
                clearAuthTokens();
                router.push("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {message ? (
          <p className="mb-6 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
            {error}
          </p>
        ) : null}

        {/* Quick Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ title, value, icon: Icon, section }) => (
            <div
              key={title}
              onClick={() => {
                if (section !== "none") {
                  setActiveSection((prev) => (prev === section ? "none" : section));
                  setTimeout(() => {
                    const el = document.getElementById("active-section-container");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                }
              }}
              className={`soft-card rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm transition ${
                section !== "none" ? "cursor-pointer hover:border-blue-400 hover:shadow-md group" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
                    {section !== "none" && (
                      <span className="text-[10px] font-bold text-blue-600 underline">
                        {activeSection === section ? "Close" : "Open"}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">{value}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow transition ${
                    activeSection === section
                      ? "bg-blue-600 text-white group-hover:scale-105"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Required Banner for Issued Offer Letter */}
        {pendingOffersCount > 0 && (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                  <FileBadge className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    <Clock className="h-3 w-3" /> Action Required &bull; 2-Day Deadline
                  </div>
                  <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-950">
                    Official Internship Offer Letter Issued!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Congratulations! Your official offer letter is ready for review. Please accept before{" "}
                    <b>{offers.find((o) => o.status === "issued")?.acceptance_deadline}</b>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSection("offers");
                  setTimeout(() => {
                    document.getElementById("active-section-container")?.scrollIntoView({ behavior: "smooth" });
                  }, 150);
                }}
                className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
              >
                <Eye className="h-4 w-4" /> Review & Accept Offer &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OVERVIEW OF TITLES / SECTION HUB (Always visible as navigation controls) */}
        {/* ========================================================================= */}
        <div className="mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" /> Portal Sections
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any section to open it. Opening one section automatically hides the others.
              </p>
            </div>

            {activeSection !== "none" && (
              <button
                type="button"
                onClick={() => setActiveSection("none")}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview Hub
              </button>
            )}
          </div>

          {/* 4 Section Overview Title Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Internship Workspace / My Projects */}
            <div
              onClick={() => setActiveSection((prev) => (prev === "projects" ? "none" : "projects"))}
              className={`cursor-pointer rounded-[2rem] border p-6 transition-all duration-200 select-none ${
                activeSection === "projects"
                  ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    activeSection === "projects" ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                  }`}
                >
                  <FolderGit2 className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
                  {projectAssignments.length} Projects
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Internship Workspace</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Assigned milestone deliverables, requirements, countdown deadlines, and GitHub code submissions.
              </p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-400">
                  {completedProjectsCount} / {projectAssignments.length} Completed
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  {activeSection === "projects" ? "Hide Section ▲" : "Open Workspace →"}
                </span>
              </div>
            </div>

            {/* 2. Internship Applications */}
            <div
              onClick={() =>
                setActiveSection((prev) => (prev === "applications" ? "none" : "applications"))
              }
              className={`cursor-pointer rounded-[2rem] border p-6 transition-all duration-200 select-none ${
                activeSection === "applications"
                  ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    activeSection === "applications"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  <FileText className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                  {applications.length} Applications
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Internship Applications</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Review your submitted cohort applications, verify payment status, and track admission decisions.
              </p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-400">
                  {applications.length > 0 ? getStatusBadge(applications[0].status).label : "No Submissions"}
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  {activeSection === "applications" ? "Hide Section ▲" : "Open Applications →"}
                </span>
              </div>
            </div>

            {/* 3. My Offer Letter */}
            <div
              onClick={() => setActiveSection((prev) => (prev === "offers" ? "none" : "offers"))}
              className={`cursor-pointer rounded-[2rem] border p-6 transition-all duration-200 select-none ${
                activeSection === "offers"
                  ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    activeSection === "offers" ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                  }`}
                >
                  <FileBadge className="h-6 w-6" />
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    pendingOffersCount > 0
                      ? "bg-amber-100 text-amber-900 animate-pulse"
                      : acceptedOffersCount > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {pendingOffersCount > 0
                    ? "Action Req."
                    : acceptedOffersCount > 0
                    ? "Accepted"
                    : offers.length > 0
                    ? `${offers.length} Offer`
                    : "Selection Req."}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">My Offer Letter</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Official offer letters, 2-day acceptance deadline, download single-page A4 PDF, and verify QR codes.
              </p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-400">
                  {offers.length > 0 ? offers[0].offer_letter_number : "Selection Pending"}
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  {activeSection === "offers" ? "Hide Section ▲" : "View Offers →"}
                </span>
              </div>
            </div>

            {/* 4. Candidate Profile */}
            <div
              onClick={() => setActiveSection((prev) => (prev === "profile" ? "none" : "profile"))}
              className={`cursor-pointer rounded-[2rem] border p-6 transition-all duration-200 select-none ${
                activeSection === "profile"
                  ? "border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    activeSection === "profile" ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
                  }`}
                >
                  <UserCircle className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-purple-100 text-purple-800 px-3 py-1 text-xs font-bold">
                  {profile.headline && profile.bio ? "Complete" : "Snapshot"}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Candidate Profile</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Manage your professional headline, bio summary, portfolio website link, and credentials.
              </p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                <span className="text-slate-400">Personal Details</span>
                <span className="text-blue-600 flex items-center gap-1">
                  {activeSection === "profile" ? "Hide Section ▲" : "Open Profile →"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Anchor scroll target */}
        <div id="active-section-container" />

        {/* ========================================================================= */}
        {/* SECTION 1: MY PROJECTS / INTERNSHIP WORKSPACE (Rendered ONLY when active)  */}
        {/* ========================================================================= */}
        {activeSection === "projects" && (
          <div className="mt-10 rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
                  <Sparkles className="h-3 w-3" /> Intern Workspace
                </div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl flex items-center gap-3">
                  <span>My Projects</span>
                  <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-0.5 font-bold">
                    {projectAssignments.length} Assigned
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Complete your milestone deliverables, submit your GitHub repositories, and track mentor evaluations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
                  Progress:{" "}
                  <span className="font-bold text-slate-900">
                    {completedProjectsCount} / {projectAssignments.length}
                  </span>{" "}
                  Done
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection("none")}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Close section"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {projectAssignments.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <FolderGit2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-800 text-base">No projects assigned yet</p>
                <p className="mt-1">
                  Once your application is accepted, assigned project milestones will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6">
                {projectAssignments.map((assignment) => {
                  const remaining = getRemainingTime(assignment.assigned_deadline, assignment.is_overdue);
                  const statusBadge = getProjectStatusBadge(assignment.status, assignment.is_overdue);
                  const isSubmitting = submittingId === assignment.id;
                  const isLocked =
                    assignment.status === "completed" ||
                    (assignment.is_overdue &&
                      assignment.status !== "submitted" &&
                      assignment.status !== "reviewed");
                  const isExpanded = !!expandedInstructions[assignment.id];

                  return (
                    <div
                      key={assignment.id}
                      className="soft-card rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 transition hover:border-slate-300"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-white">
                            <FolderGit2 className="h-3.5 w-3.5" /> Project{" "}
                            {String(assignment.project_order).padStart(2, "0")}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.badge}`}>
                            {statusBadge.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            Cohort: <strong className="text-slate-700">{assignment.internship_title}</strong>
                          </span>
                        </div>

                        {/* Countdown / Remaining Time Badge */}
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                            remaining.isOverdue
                              ? "border-red-300 bg-red-50 text-red-700 font-bold"
                              : remaining.urgent
                              ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {remaining.isOverdue ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          <span>{remaining.text}</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="mt-5">
                        <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                          {assignment.project_title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {assignment.project_description}
                        </p>
                      </div>

                      {/* Instructions / Requirements (Collapsible) */}
                      {assignment.project_instructions ? (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedInstructions((prev) => ({
                                ...prev,
                                [assignment.id]: !prev[assignment.id],
                              }))
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" /> Hide Requirements & Instructions
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" /> View Requirements & Instructions
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                              <p className="font-bold text-slate-900 mb-1">Project Instructions & Deliverables:</p>
                              {assignment.project_instructions}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* Schedule / Duration details */}
                      <div className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs sm:grid-cols-3">
                        <div>
                          <span className="text-slate-400 font-medium">Assigned Start:</span>
                          <p className="mt-0.5 font-semibold text-slate-800">
                            {assignment.assigned_start_date
                              ? new Date(assignment.assigned_start_date).toLocaleDateString()
                              : "Immediate"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Assigned Deadline:</span>
                          <p className="mt-0.5 font-semibold text-slate-800">
                            {assignment.assigned_deadline
                              ? new Date(assignment.assigned_deadline).toLocaleString([], {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : `${assignment.duration_days} days`}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Allocated Duration:</span>
                          <p className="mt-0.5 font-semibold text-slate-800">
                            {assignment.duration_days} Days
                          </p>
                        </div>
                      </div>

                      {/* Admin Feedback */}
                      {assignment.admin_feedback ? (
                        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
                          <p className="font-bold text-blue-950 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Mentor Review Feedback:
                          </p>
                          <p className="mt-1 leading-relaxed">{assignment.admin_feedback}</p>
                        </div>
                      ) : null}

                      {/* GitHub Repository Submission Section */}
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          GitHub Repository Submission
                        </label>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Paste your public GitHub repository URL containing the complete codebase, commit history, and README.
                        </p>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="relative flex-1">
                            <GithubIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                              type="url"
                              disabled={isLocked || isSubmitting}
                              value={submissionUrls[assignment.id] ?? ""}
                              onChange={(e) =>
                                setSubmissionUrls((prev) => ({
                                  ...prev,
                                  [assignment.id]: e.target.value,
                                }))
                              }
                              placeholder="https://github.com/your-username/your-project-repository"
                              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-mono text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>

                          <Button
                            type="button"
                            disabled={isLocked || isSubmitting}
                            onClick={() => submitProject(assignment.id)}
                            className="gap-2 rounded-2xl px-5 text-xs font-semibold whitespace-nowrap"
                          >
                            {isSubmitting ? (
                              <>Submitting...</>
                            ) : assignment.status === "completed" ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                              </>
                            ) : assignment.github_url ? (
                              <>
                                <Send className="h-3.5 w-3.5" /> Update Submission
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" /> Submit Project
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Submission confirmation link */}
                        {assignment.github_url ? (
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">Submitted URL:</span>
                              <a
                                href={assignment.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-blue-600 underline hover:text-blue-800"
                              >
                                {assignment.github_url} <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {assignment.submitted_at && (
                              <span>
                                Submitted on:{" "}
                                {new Date(assignment.submitted_at).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {assignment.is_overdue &&
                          assignment.status !== "submitted" &&
                          assignment.status !== "reviewed" &&
                          assignment.status !== "completed" && (
                            <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Project deadline has passed. Submissions are closed.
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: INTERNSHIP APPLICATIONS (Rendered ONLY when active)            */}
        {/* ========================================================================= */}
        {activeSection === "applications" && (
          <div className="mt-10 rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Your Internship Applications
                </h2>
                <p className="text-sm text-slate-500">
                  Track status updates, payment verifications, and progression across your submissions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Start New Application <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveSection("none")}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Close section"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="py-16 text-center shadow-sm">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">No applications created yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Explore our published cohorts and apply to accelerate your career.
                </p>
                <div className="mt-6">
                  <Link
                    href="/internships"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    View Open Internships
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {applications.map((app) => {
                  const statusMeta = getStatusBadge(app.status);
                  const isDraft = app.status === "draft";
                  const isPaymentPending = app.status === "payment_pending";

                  let timelineIndex = 0;
                  if (app.status === "payment_pending") timelineIndex = 1;
                  else if (app.status === "submitted") timelineIndex = 2;
                  else if (app.status === "screening" || app.status === "interview") timelineIndex = 3;
                  else if (app.status === "accepted") timelineIndex = 4;

                  const timelineSteps = [
                    "Draft Started",
                    "Payment Submitted",
                    "Verified & Submitted",
                    "Screening & Interview",
                    "Final Decision",
                  ];

                  return (
                    <div
                      key={app.id}
                      className="soft-card rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                    >
                      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-xs font-bold text-white">
                              {app.application_number || `APP-${String(app.id).padStart(5, "0")}`}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                            {app.internship_title || "General Application"}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Started on: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {isDraft ? (
                            <Link
                              href={`/apply?applicationId=${app.id}`}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                              Resume Application <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : isPaymentPending ? (
                            <Link
                              href={`/apply?applicationId=${app.id}`}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              <QrCode className="h-3.5 w-3.5" /> View Payment Info
                            </Link>
                          ) : app.status === "accepted" ? null : (
                            <Link
                              href={`/apply?applicationId=${app.id}`}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Application
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Status Card: If Accepted, just show Accepted banner; otherwise show timeline */}
                      {app.status === "accepted" ? (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-base font-bold text-emerald-950">Application Accepted</p>
                              <p className="text-xs text-emerald-800 mt-0.5">
                                Congratulations! You have been accepted for this internship. Check your assigned deliverables in the Internship Workspace.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                            Application Progress
                          </p>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            {timelineSteps.map((stepTitle, idx) => {
                              const isCompleted = idx <= timelineIndex;
                              const isCurrent = idx === timelineIndex;

                              return (
                                <div
                                  key={stepTitle}
                                  className={`rounded-2xl border p-3 text-center transition ${
                                    isCurrent
                                      ? "border-blue-500 bg-blue-50/80 shadow-sm"
                                      : isCompleted
                                      ? "border-slate-200 bg-slate-50"
                                      : "border-slate-100 bg-white opacity-40"
                                  }`}
                                >
                                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                                    {isCompleted ? (
                                      <Check className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <span className="text-xs font-bold text-slate-400">{idx + 1}</span>
                                    )}
                                  </div>
                                  <span
                                    className={`mt-2 block text-[11px] font-semibold ${
                                      isCurrent
                                        ? "text-blue-900"
                                        : isCompleted
                                        ? "text-slate-800"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {stepTitle}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Additional Payment Status Note */}
                      {app.latest_payment ? (
                        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-900">Payment Reference:</span>{" "}
                              <span className="font-mono">{app.latest_payment.reference}</span> (
                              {app.latest_payment.currency} {app.latest_payment.amount})
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">Payment Status:</span>{" "}
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold capitalize ${
                                  app.latest_payment.status === "verified"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : app.latest_payment.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {app.latest_payment.status}
                              </span>
                            </div>
                          </div>
                          {app.latest_payment.receipt_url ? (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                              <span className="font-semibold text-slate-800">Uploaded Receipt:</span>
                              <a
                                href={app.latest_payment.receipt_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>View Receipt / Screenshot</span>
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </a>
                            </div>
                          ) : null}
                          {app.latest_payment.rejection_reason ? (
                            <p className="mt-2 text-red-700">
                              <strong>Rejection Note:</strong> {app.latest_payment.rejection_reason}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: MY OFFER LETTER (Rendered ONLY when active)                    */}
        {/* ========================================================================= */}
        {activeSection === "offers" && (
          <div className="mt-10 rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                  <FileBadge className="h-3.5 w-3.5" /> Official Documentation
                </div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl flex items-center gap-3">
                  <span>My Offer Letter</span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 font-bold">
                    {offers.length} {offers.length === 1 ? "Offer" : "Offers"}
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  View, download, and confirm your official internship offer. Official acceptance deadline is 2 days after issue.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveSection("none")}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition self-start sm:self-auto"
                title="Close section"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {offers.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                <FileBadge className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-800 text-base">No Offer Letters Yet</p>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  Offer letters are generated once your internship application has been officially accepted. Check your application status under the Internship Applications section.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection("applications")}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <FileText className="h-3.5 w-3.5" /> View Applications
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {offers.map((offer) => {
                  const isIssued = offer.status === "issued";
                  const isAccepted = offer.status === "accepted";
                  const isExpired = offer.status === "expired" || offer.is_expired;
                  const isRevoked = offer.status === "revoked";

                  return (
                    <div
                      key={offer.id}
                      className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md"
                    >
                      {/* Status Announcement Banner */}
                      {isIssued && (
                        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                                <Clock className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-amber-950">Action Required: Accept Your Offer</p>
                                <p className="text-xs text-amber-800 mt-0.5">
                                  Your offer letter was issued on <b>{offer.issue_date}</b>. Please confirm acceptance by{" "}
                                  <b>{offer.acceptance_deadline}</b> (2-day acceptance deadline).
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAcceptOffer(offer.id)}
                              disabled={acceptingOfferId === offer.id}
                              className="self-start sm:self-auto rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                            >
                              {acceptingOfferId === offer.id ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1" /> Accept Offer Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {isAccepted && (
                        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-emerald-950">Offer Officially Accepted</p>
                              <p className="text-xs text-emerald-800 mt-0.5">
                                You accepted this offer on{" "}
                                <b>{offer.accepted_at ? new Date(offer.accepted_at).toLocaleDateString() : "Record"}</b>.
                                Welcome to VINEXTURE! Your milestones can be accessed in the Internship Workspace.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {isExpired && (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                              <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-rose-950">Offer Acceptance Deadline Passed</p>
                              <p className="text-xs text-rose-800 mt-0.5">
                                The 2-day acceptance deadline ({offer.acceptance_deadline}) has expired. Please contact administration if you need assistance.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {offer.offer_letter_number}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-xs text-slate-500 font-mono">
                              ID: {offer.verification_code}
                            </span>
                          </div>
                          <h3 className="mt-1 text-xl font-bold text-slate-950">
                            {offer.internship_title} Intern
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Accepted
                            </span>
                          )}
                          {isIssued && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                              <Clock className="h-3 w-3" /> Issued &bull; Pending Acceptance
                            </span>
                          )}
                          {offer.status === "draft" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              Draft
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
                              Expired
                            </span>
                          )}
                          {isRevoked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 line-through">
                              Revoked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Internship Details Grid */}
                      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Position</p>
                          <p className="mt-1 font-bold text-slate-900">{offer.internship_title} Intern</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Duration & Mode</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {offer.duration} &bull; <span className="capitalize">{offer.mode}</span>
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Timeline</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {offer.start_date || "TBD"} &rarr; {offer.end_date || "TBD"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">Stipend</p>
                          <p className="mt-1 font-bold text-slate-900">{offer.stipend}</p>
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* View Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewOfferModal(offer)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Offer Letter
                          </button>

                          {/* Download PDF */}
                          <a
                            href={`http://localhost:8000/api/offers/${offer.id}/pdf/`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            <Download className="h-3.5 w-3.5 text-blue-600" /> Download PDF (A4)
                          </a>

                          {/* Public Verification */}
                          <Link
                            href={`/offers/verify/${offer.verification_code}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verify Authenticity
                          </Link>
                        </div>

                        {/* Accept Button if can accept */}
                        {offer.can_accept && (
                          <Button
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={acceptingOfferId === offer.id}
                            className="gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                          >
                            {acceptingOfferId === offer.id ? (
                              <>Accepting Offer...</>
                            ) : (
                              <>
                                <Check className="h-4 w-4" /> Accept Offer
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: CANDIDATE PROFILE FORM (Rendered ONLY when active)             */}
        {/* ========================================================================= */}
        {activeSection === "profile" && (
          <div className="mt-10 rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Candidate Profile</h2>
                <p className="text-sm text-slate-500">
                  Keep your headline, bio, and portfolio link up-to-date across all submissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection("none")}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Close section"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Headline
                  </label>
                  <input
                    value={profile.headline}
                    onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
                    placeholder="e.g. Full-Stack Developer & CS Undergrad"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Portfolio / Website URL
                  </label>
                  <input
                    value={profile.portfolio_url}
                    onChange={(event) =>
                      setProfile({ ...profile, portfolio_url: event.target.value })
                    }
                    placeholder="https://yourportfolio.dev"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  placeholder="Short professional summary, technical interests, or background..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection("none")}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <Button type="submit" className="gap-2 rounded-2xl px-6">
                  <Check className="h-4 w-4" /> Save Profile
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: View Offer Letter Preview */}
        {previewOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <FileBadge className="h-5 w-5 text-blue-600" />
                    Offer Letter: {previewOfferModal.offer_letter_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {previewOfferModal.internship_title} Intern &bull; Status: {previewOfferModal.status.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`http://localhost:8000/api/offers/${previewOfferModal.id}/pdf/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                  <button
                    onClick={() => setPreviewOfferModal(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-slate-100 min-h-[500px]">
                <iframe
                  src={`http://localhost:8000/api/offers/${previewOfferModal.id}/pdf/#toolbar=1`}
                  className="w-full h-full min-h-[500px] rounded-xl border border-slate-300 bg-white"
                  title="Offer Letter Preview"
                />
              </div>

              <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <span>
                  <b>Verification ID:</b> {previewOfferModal.verification_code}
                </span>
                {previewOfferModal.can_accept && (
                  <Button
                    onClick={() => {
                      const id = previewOfferModal.id;
                      setPreviewOfferModal(null);
                      handleAcceptOffer(id);
                    }}
                    className="rounded-full bg-emerald-600 px-5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Accept This Offer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
