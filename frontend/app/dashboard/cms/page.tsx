"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { ProtectedRoute } from "@/components/protected-route";
import { fetchJson, postJson } from "@/lib/api";

type CMSPage = {
  id: number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
};

export default function CMSAdminPage() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPages() {
    const payload = await fetchJson<{ results?: CMSPage[] } | CMSPage[]>("/");
    setPages(Array.isArray(payload) ? payload : payload.results || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPages().catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load CMS pages.");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await postJson("/", { title, content, is_published: isPublished });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create CMS page.");
      return;
    }

    setTitle("");
    setContent("");
    setMessage("Page created successfully.");
    await loadPages();
  }

  return (
    <ProtectedRoute adminOnly>
    <main className="container-shell py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-blue-600">← Back to dashboard</Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-blue-600">Content management</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">CMS pages</h1>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={createPage} className="soft-card rounded-[2rem] p-8">
          <h2 className="text-xl font-semibold text-slate-900">Create page</h2>
          <div className="mt-6 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="Page title"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              placeholder="Page content"
              rows={8}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
            />
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
              Publish immediately
            </label>
            <button type="submit" className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
              Create page
            </button>
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 break-words text-sm text-red-600">{error}</p> : null}
        </form>

        <section className="soft-card rounded-[2rem] p-8">
          <h2 className="text-xl font-semibold text-slate-900">Published content</h2>
          <div className="mt-6 space-y-4">
            {pages.length === 0 ? (
              <p className="text-sm text-slate-500">No CMS pages available yet.</p>
            ) : pages.map((page) => (
              <article key={page.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900">{page.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">/{page.slug}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${page.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{page.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
    </ProtectedRoute>
  );
}
