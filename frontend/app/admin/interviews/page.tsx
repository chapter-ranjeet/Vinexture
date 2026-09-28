"use client";

import { FormEvent, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson, postJson } from "@/lib/api";

type Interview = {
  id: number;
  application: number;
  application_label: string;
  applicant_name: string;
  applicant_email: string;
  internship_title?: string | null;
  scheduled_at: string;
  meeting_link: string;
  location: string;
  status: string;
  notes: string;
};

type Application = { id: number; applicant_name?: string; applicant_email?: string; internship_title?: string };
const statuses = ["scheduled", "confirmed", "completed", "cancelled", "no_show"];

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [application, setApplication] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [interviewPayload, applicationPayload] = await Promise.all([
      fetchJson<{ results?: Interview[] } | Interview[]>("/admin/interviews/"),
      fetchJson<{ results?: Application[] } | Application[]>("/admin/applications/"),
    ]);
    setInterviews(Array.isArray(interviewPayload) ? interviewPayload : interviewPayload.results || []);
    setApplications(Array.isArray(applicationPayload) ? applicationPayload : applicationPayload.results || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load interviews.")).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await postJson("/admin/interviews/", { application: Number(application), scheduled_at: new Date(scheduledAt).toISOString(), meeting_link: meetingLink, location, notes });
      setApplication(""); setScheduledAt(""); setMeetingLink(""); setLocation(""); setNotes("");
      setMessage("Interview scheduled successfully.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to schedule interview.");
    } finally {
      setSaving(false);
    }
  }

  async function updateInterview(id: number, status: string) {
    setError("");
    try {
      await fetchJson(`/admin/interviews/${id}/`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update interview.");
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Hiring pipeline</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Interviews</h1>
        <p className="mt-3 text-slate-500">Schedule candidate conversations and keep interview outcomes up to date.</p>
        {error ? <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={createInterview} className="rounded-[1.8rem] border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-semibold text-slate-900">Schedule interview</h2>
            <div className="mt-6 space-y-4">
              <select required value={application} onChange={(event) => setApplication(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none">
                <option value="">Select application</option>
                {applications.map((item) => <option key={item.id} value={item.id}>{`APP-${String(item.id).padStart(5, "0")} · ${item.applicant_name || item.applicant_email || "Candidate"}`}</option>)}
              </select>
              <input required type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="Meeting link (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes (optional)" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <button disabled={saving} type="submit" className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Scheduling…" : "Schedule interview"}</button>
            </div>
            {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          </form>
          <section className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-7"><h2 className="text-xl font-semibold text-slate-900">Interview schedule</h2></div>
            {loading ? <p className="p-7 text-sm text-slate-500">Loading interviews…</p> : interviews.length === 0 ? <div className="p-12 text-center"><p className="font-medium text-slate-900">No interviews scheduled.</p><p className="mt-2 text-sm text-slate-500">Create an interview to start coordinating candidate conversations.</p></div> : <div className="divide-y divide-slate-100">{interviews.map((item) => <article key={item.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-medium text-slate-900">{item.applicant_name || item.applicant_email}</p><p className="mt-1 text-sm text-slate-500">{item.application_label} · {item.internship_title || "General application"}</p></div><select value={item.status} onChange={(event) => updateInterview(item.id, event.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs capitalize outline-none">{statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></div><p className="mt-4 text-sm text-slate-700">{new Date(item.scheduled_at).toLocaleString()}</p><p className="mt-1 text-sm text-slate-500">{item.location || item.meeting_link || "Details to be confirmed"}</p>{item.notes ? <p className="mt-3 text-sm text-slate-600">{item.notes}</p> : null}</article>)}</div>}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
