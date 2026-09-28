"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Layout,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { fetchJson, postJson } from "@/lib/api";

type CMSPage = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type CMSAnnouncement = {
  id: number;
  title: string;
  message: string;
  badge: string;
  link_url: string;
  banner_type: "info" | "alert" | "success" | "promo";
  is_active: boolean;
  created_at: string;
};

type CMSFaq = {
  id: number;
  question: string;
  answer: string;
  category: "general" | "internships" | "payment" | "certificates";
  order: number;
  is_published: boolean;
  created_at: string;
};

type SiteSettings = {
  support_email?: string;
  support_phone?: string;
  whatsapp_number?: string;
  office_address?: string;
  linkedin_url?: string;
  github_url?: string;
  [key: string]: string | undefined;
};

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<"pages" | "announcements" | "faqs" | "settings">("pages");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [announcements, setAnnouncements] = useState<CMSAnnouncement[]>([]);
  const [faqs, setFaqs] = useState<CMSFaq[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    support_email: "support@vinexture.com",
    support_phone: "+91 98765 43210",
    whatsapp_number: "+91 98765 43210",
    office_address: "VINEXTURE HQ, Technology Park, Bengaluru, India",
    linkedin_url: "https://linkedin.com/company/vinexture",
    github_url: "https://github.com/vinexture",
  });

  // Modal / Preview states
  const [previewPage, setPreviewPage] = useState<CMSPage | null>(null);
  const [deletePageTarget, setDeletePageTarget] = useState<CMSPage | null>(null);
  const [deleteAnnouncementTarget, setDeleteAnnouncementTarget] = useState<CMSAnnouncement | null>(null);
  const [deleteFaqTarget, setDeleteFaqTarget] = useState<CMSFaq | null>(null);

  // Forms - Page Form
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageExcerpt, setPageExcerpt] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageIsPublished, setPageIsPublished] = useState(true);
  const [savingPage, setSavingPage] = useState(false);

  // Forms - Announcement Form
  const [editingAnnounceId, setEditingAnnounceId] = useState<number | null>(null);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announceBadge, setAnnounceBadge] = useState("Announcement");
  const [announceLink, setAnnounceLink] = useState("/internships");
  const [announceType, setAnnounceType] = useState<"info" | "alert" | "success" | "promo">("promo");
  const [announceActive, setAnnounceActive] = useState(true);
  const [savingAnnounce, setSavingAnnounce] = useState(false);

  // Forms - FAQ Form
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState<"general" | "internships" | "payment" | "certificates">("internships");
  const [faqOrder, setFaqOrder] = useState(1);
  const [faqPublished, setFaqPublished] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);

  // Settings Save
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadCMSData() {
    setLoading(true);
    try {
      const [pagesRes, annRes, faqsRes, setRes] = await Promise.allSettled([
        fetchJson<{ results?: CMSPage[] } | CMSPage[]>("/cms/pages/"),
        fetchJson<{ results?: CMSAnnouncement[] } | CMSAnnouncement[]>("/cms/announcements/"),
        fetchJson<{ results?: CMSFaq[] } | CMSFaq[]>("/cms/faqs/"),
        fetchJson<SiteSettings>("/cms/settings/"),
      ]);

      if (pagesRes.status === "fulfilled" && pagesRes.value) {
        setPages(Array.isArray(pagesRes.value) ? pagesRes.value : pagesRes.value.results || []);
      }
      if (annRes.status === "fulfilled" && annRes.value) {
        setAnnouncements(Array.isArray(annRes.value) ? annRes.value : annRes.value.results || []);
      }
      if (faqsRes.status === "fulfilled" && faqsRes.value) {
        setFaqs(Array.isArray(faqsRes.value) ? faqsRes.value : faqsRes.value.results || []);
      }
      if (setRes.status === "fulfilled" && setRes.value) {
        setSettings((prev) => ({ ...prev, ...setRes.value }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CMS content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCMSData();
  }, []);

  // PAGE METHODS
  function resetPageForm() {
    setEditingPageId(null);
    setPageTitle("");
    setPageSlug("");
    setPageExcerpt("");
    setPageContent("");
    setPageIsPublished(true);
  }

  function startEditPage(p: CMSPage) {
    setEditingPageId(p.id);
    setPageTitle(p.title);
    setPageSlug(p.slug);
    setPageExcerpt(p.excerpt || "");
    setPageContent(p.content);
    setPageIsPublished(p.is_published);
    window.scrollTo({ top: 200, behavior: "smooth" });
  }

  async function savePage(e: FormEvent) {
    e.preventDefault();
    setSavingPage(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: pageTitle.trim(),
        slug: pageSlug.trim() || undefined,
        excerpt: pageExcerpt.trim(),
        content: pageContent.trim(),
        is_published: pageIsPublished,
      };

      if (editingPageId) {
        await fetchJson(`/cms/pages/${editingPageId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setMessage("Page updated successfully.");
      } else {
        await postJson("/cms/pages/", payload);
        setMessage("New CMS page created successfully.");
      }
      resetPageForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save CMS page.");
    } finally {
      setSavingPage(false);
    }
  }

  async function togglePagePublish(page: CMSPage) {
    try {
      await fetchJson(`/cms/pages/${page.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !page.is_published }),
      });
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update publish state.");
    }
  }

  async function executeDeletePage(page: CMSPage) {
    try {
      await fetchJson(`/cms/pages/${page.id}/`, { method: "DELETE" });
      setMessage(`Page "${page.title}" deleted.`);
      setDeletePageTarget(null);
      if (editingPageId === page.id) resetPageForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page.");
    }
  }

  // ANNOUNCEMENT METHODS
  function resetAnnounceForm() {
    setEditingAnnounceId(null);
    setAnnounceTitle("");
    setAnnounceMessage("");
    setAnnounceBadge("Announcement");
    setAnnounceLink("/internships");
    setAnnounceType("promo");
    setAnnounceActive(true);
  }

  function startEditAnnounce(a: CMSAnnouncement) {
    setEditingAnnounceId(a.id);
    setAnnounceTitle(a.title);
    setAnnounceMessage(a.message);
    setAnnounceBadge(a.badge);
    setAnnounceLink(a.link_url);
    setAnnounceType(a.banner_type);
    setAnnounceActive(a.is_active);
    window.scrollTo({ top: 200, behavior: "smooth" });
  }

  async function saveAnnouncement(e: FormEvent) {
    e.preventDefault();
    setSavingAnnounce(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title: announceTitle.trim(),
        message: announceMessage.trim(),
        badge: announceBadge.trim(),
        link_url: announceLink.trim(),
        banner_type: announceType,
        is_active: announceActive,
      };

      if (editingAnnounceId) {
        await fetchJson(`/cms/announcements/${editingAnnounceId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setMessage("Announcement updated.");
      } else {
        await postJson("/cms/announcements/", payload);
        setMessage("Announcement published.");
      }
      resetAnnounceForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save announcement.");
    } finally {
      setSavingAnnounce(false);
    }
  }

  async function toggleAnnounceActive(a: CMSAnnouncement) {
    try {
      await fetchJson(`/cms/announcements/${a.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !a.is_active }),
      });
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle announcement.");
    }
  }

  async function executeDeleteAnnouncement(a: CMSAnnouncement) {
    try {
      await fetchJson(`/cms/announcements/${a.id}/`, { method: "DELETE" });
      setMessage(`Announcement deleted.`);
      setDeleteAnnouncementTarget(null);
      if (editingAnnounceId === a.id) resetAnnounceForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete announcement.");
    }
  }

  // FAQ METHODS
  function resetFaqForm() {
    setEditingFaqId(null);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqCategory("internships");
    setFaqOrder(1);
    setFaqPublished(true);
  }

  function startEditFaq(f: CMSFaq) {
    setEditingFaqId(f.id);
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
    setFaqCategory(f.category);
    setFaqOrder(f.order);
    setFaqPublished(f.is_published);
    window.scrollTo({ top: 200, behavior: "smooth" });
  }

  async function saveFaq(e: FormEvent) {
    e.preventDefault();
    setSavingFaq(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        question: faqQuestion.trim(),
        answer: faqAnswer.trim(),
        category: faqCategory,
        order: faqOrder,
        is_published: faqPublished,
      };

      if (editingFaqId) {
        await fetchJson(`/cms/faqs/${editingFaqId}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setMessage("FAQ updated.");
      } else {
        await postJson("/cms/faqs/", payload);
        setMessage("FAQ added to Knowledge Base.");
      }
      resetFaqForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save FAQ.");
    } finally {
      setSavingFaq(false);
    }
  }

  async function executeDeleteFaq(f: CMSFaq) {
    try {
      await fetchJson(`/cms/faqs/${f.id}/`, { method: "DELETE" });
      setMessage(`FAQ deleted.`);
      setDeleteFaqTarget(null);
      if (editingFaqId === f.id) resetFaqForm();
      await loadCMSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete FAQ.");
    }
  }

  // SETTINGS SAVE
  async function saveCompanySettings(e: FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setError("");
    setMessage("");

    try {
      await postJson("/cms/settings/", settings);
      setMessage("Company contact info & site settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  }

  // Filtered lists
  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" /> CMS & Content Architecture
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Portal Content Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Publish policies, announcement tickers, FAQs, and configure official company contact metadata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => void loadCMSData()} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">CMS Pages</span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{pages.length}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {pages.filter((p) => p.is_published).length} published live
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Announcements</span>
              <Megaphone className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{announcements.length}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {announcements.filter((a) => a.is_active).length} currently active
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">FAQs & Help</span>
              <HelpCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{faqs.length}</p>
            <p className="mt-0.5 text-xs text-slate-400">Organized across 4 categories</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Settings</span>
              <Settings className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">Active</p>
            <p className="mt-0.5 text-xs text-slate-400">Contact & helpdesk synchronized</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("pages")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "pages"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="h-4 w-4" /> Static Pages & Policies ({pages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "announcements"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Megaphone className="h-4 w-4" /> Announcements & Banners ({announcements.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("faqs")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "faqs"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="h-4 w-4" /> FAQ Knowledge Base ({faqs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === "settings"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Settings className="h-4 w-4" /> Company & Contact Settings
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CMS PAGES */}
        {/* ========================================================================= */}
        {activeTab === "pages" && (
          <div className="mt-8 space-y-10">
            {/* Create / Edit Page Form */}
            <form
              onSubmit={savePage}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingPageId ? `Editing Page #${editingPageId}` : "Create New CMS Page"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Draft rich content, policies, or program guidelines with live markdown/HTML formatting.
                  </p>
                </div>
                {editingPageId && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    Editing Mode
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Page Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="e.g. Terms of Service & Candidate Standards"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    URL Slug (auto-generated if empty)
                  </label>
                  <input
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="e.g. terms-of-service"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Short Excerpt / Meta Description
                  </label>
                  <input
                    value={pageExcerpt}
                    onChange={(e) => setPageExcerpt(e.target.value)}
                    placeholder="One-line summary displayed on search results and page headers..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Page Content (Markdown / Text) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={pageContent}
                    onChange={(e) => setPageContent(e.target.value)}
                    placeholder="Write detailed documentation, terms, or guidelines here..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between border-t border-slate-100 pt-4">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={pageIsPublished}
                      onChange={(e) => setPageIsPublished(e.target.checked)}
                      className="h-4 w-4 rounded text-slate-900"
                    />
                    Publish page immediately (visible to visitors)
                  </label>

                  <div className="flex items-center gap-3">
                    {editingPageId && (
                      <Button type="button" variant="secondary" onClick={resetPageForm}>
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={savingPage} className="gap-2 px-6">
                      {savingPage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> {editingPageId ? "Update Page" : "Create Page"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Pages Table */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Configured Pages ({pages.length})</h2>
                  <p className="text-xs text-slate-500">Live content routes served at /cms/pages/[slug]</p>
                </div>

                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              {filteredPages.length === 0 ? (
                <p className="p-8 text-sm text-slate-500">No CMS pages match your query.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Title & Excerpt</th>
                        <th className="px-6 py-4">Route Path</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Last Updated</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPages.map((page) => (
                        <tr key={page.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{page.title}</p>
                            {page.excerpt && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{page.excerpt}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-blue-600">/{page.slug}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => void togglePagePublish(page)}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                                page.is_published
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {page.is_published ? (
                                <>
                                  <ToggleRight className="h-3.5 w-3.5" /> Published
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-3.5 w-3.5" /> Draft
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewPage(page)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditPage(page)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletePageTarget(page)}
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-800"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANNOUNCEMENTS & BANNERS */}
        {/* ========================================================================= */}
        {activeTab === "announcements" && (
          <div className="mt-8 space-y-10">
            {/* Announcement Form */}
            <form
              onSubmit={saveAnnouncement}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingAnnounceId ? `Editing Announcement #${editingAnnounceId}` : "Create Site Announcement"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage top ticker alert banners displayed on portal homepages and candidate dashboards.
                  </p>
                </div>
                {editingAnnounceId && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Editing Mode
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Banner Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="e.g. Winter & Spring 2026 Cohorts Now Open"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Badge Label</label>
                  <input
                    value={announceBadge}
                    onChange={(e) => setAnnounceBadge(e.target.value)}
                    placeholder="e.g. Announcement / Urgent / New"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Message Body <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    placeholder="Full announcement description shown to candidates..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Destination Link URL</label>
                  <input
                    value={announceLink}
                    onChange={(e) => setAnnounceLink(e.target.value)}
                    placeholder="e.g. /internships or /portal"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Banner Type</label>
                  <select
                    value={announceType}
                    onChange={(e) => setAnnounceType(e.target.value as "info" | "alert" | "success" | "promo")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="promo">Promo (Blue / Indigo Accent)</option>
                    <option value="alert">Alert (Red / Urgent Notice)</option>
                    <option value="success">Success (Emerald Green)</option>
                    <option value="info">Info (Slate Neutral)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={announceActive}
                      onChange={(e) => setAnnounceActive(e.target.checked)}
                      className="h-4 w-4 rounded text-slate-900"
                    />
                    Active / Display Live
                  </label>
                </div>

                {/* Banner Live Preview Box */}
                <div className="sm:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Live Preview</p>
                  <div
                    className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-medium ${
                      announceType === "alert"
                        ? "border border-red-200 bg-red-50 text-red-800"
                        : announceType === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : announceType === "promo"
                        ? "border border-blue-200 bg-blue-50 text-blue-900"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {announceBadge || "Notice"}
                      </span>
                      <span>{announceTitle || "Announcement Headline Here"}</span>
                    </div>
                    {announceLink && (
                      <span className="inline-flex items-center gap-1 font-bold underline">
                        Explore <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  {editingAnnounceId && (
                    <Button type="button" variant="secondary" onClick={resetAnnounceForm}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={savingAnnounce} className="gap-2 px-6">
                    {savingAnnounce ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> {editingAnnounceId ? "Update Announcement" : "Create Announcement"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Announcements Table */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6 sm:p-7">
                <h2 className="text-xl font-bold text-slate-900">Configured Announcements ({announcements.length})</h2>
              </div>

              {announcements.length === 0 ? (
                <p className="p-8 text-sm text-slate-500">No announcements created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Title & Body</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Link</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {announcements.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {a.badge}
                              </span>
                              <p className="font-bold text-slate-900">{a.title}</p>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.message}</p>
                          </td>
                          <td className="px-6 py-4 capitalize text-xs font-semibold text-slate-700">{a.banner_type}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => void toggleAnnounceActive(a)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                                a.is_active
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {a.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-blue-600">{a.link_url || "—"}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditAnnounce(a)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteAnnouncementTarget(a)}
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-800"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FAQ KNOWLEDGE BASE */}
        {/* ========================================================================= */}
        {activeTab === "faqs" && (
          <div className="mt-8 space-y-10">
            {/* Create FAQ Form */}
            <form
              onSubmit={saveFaq}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingFaqId ? `Editing FAQ #${editingFaqId}` : "Add FAQ Question & Answer"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add clear answers to questions candidates ask about verification, offers, and projects.
                  </p>
                </div>
                {editingFaqId && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Editing Mode
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="e.g. How do I verify my project submissions?"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={faqCategory}
                    onChange={(e) =>
                      setFaqCategory(
                        e.target.value as "general" | "internships" | "payment" | "certificates"
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="internships">Internships & Projects</option>
                    <option value="payment">Payment & Verification</option>
                    <option value="certificates">Certificates & Offers</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Detailed Answer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Explain clearly step-by-step..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={faqOrder}
                    onChange={(e) => setFaqOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={faqPublished}
                      onChange={(e) => setFaqPublished(e.target.checked)}
                      className="h-4 w-4 rounded text-slate-900"
                    />
                    Published / Visible Live
                  </label>
                </div>

                <div className="sm:col-span-3 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  {editingFaqId && (
                    <Button type="button" variant="secondary" onClick={resetFaqForm}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={savingFaq} className="gap-2 px-6">
                    {savingFaq ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> {editingFaqId ? "Update FAQ" : "Add FAQ Question"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* FAQs List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Knowledge Base Articles ({faqs.length})</h2>
              {filteredFaqs.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No FAQs found.
                </p>
              ) : (
                filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            {faq.category}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">Order #{faq.order}</span>
                          {!faq.is_published && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Draft
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-base font-bold text-slate-900">{faq.question}</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditFaq(faq)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFaqTarget(faq)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50/50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COMPANY & CONTACT SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="mt-8">
            <form
              onSubmit={saveCompanySettings}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Company & Contact Information</h2>
                <p className="text-xs text-slate-500">
                  Update official communication channels displayed across footers, offer letters, and candidate portals.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Official Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.support_email || ""}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="support@vinexture.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Candidate Support Phone
                  </label>
                  <input
                    value={settings.support_phone || ""}
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    WhatsApp Helpline Number
                  </label>
                  <input
                    value={settings.whatsapp_number || ""}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">LinkedIn URL</label>
                  <input
                    value={settings.linkedin_url || ""}
                    onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/vinexture"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Official Headquarter Address
                  </label>
                  <input
                    value={settings.office_address || ""}
                    onChange={(e) => setSettings({ ...settings, office_address: e.target.value })}
                    placeholder="VINEXTURE HQ, Technology Park, Bengaluru, India"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end border-t border-slate-100 pt-4">
                  <Button type="submit" disabled={savingSettings} className="gap-2 px-6">
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Save Company Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PREVIEW PAGE MODAL */}
        {/* ========================================================================= */}
        {previewPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    /{previewPage.slug}
                  </span>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{previewPage.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPage(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {previewPage.content}
              </div>

              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                <Button variant="secondary" onClick={() => setPreviewPage(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DELETE CONFIRMATION MODALS */}
        {/* ========================================================================= */}
        {deletePageTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete CMS Page?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete{" "}
                <strong className="text-slate-800">{deletePageTarget.title}</strong> (/{deletePageTarget.slug})?
                This page will no longer be accessible to visitors.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeletePageTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void executeDeletePage(deletePageTarget)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteAnnouncementTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Announcement?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete this announcement banner?
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteAnnouncementTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void executeDeleteAnnouncement(deleteAnnouncementTarget)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteFaqTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete FAQ Question?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Are you sure you want to delete this FAQ:{" "}
                <strong className="text-slate-800">{deleteFaqTarget.question}</strong>?
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteFaqTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void executeDeleteFaq(deleteFaqTarget)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
