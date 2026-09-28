"use client";

import { FormEvent, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { fetchJson, postJson } from "@/lib/api";

type Notification = { id: number; recipient: number; recipient_email: string; title: string; message: string; is_read: boolean; created_at: string };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recipient, setRecipient] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadNotifications() {
    const payload = await fetchJson<{ results?: Notification[] } | Notification[]>("/admin/notifications/");
    setNotifications(Array.isArray(payload) ? payload : payload.results || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotifications().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load notifications."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await postJson("/admin/notifications/", { recipient: Number(recipient), title, message });
      setRecipient("");
      setTitle("");
      setMessage("");
      setSuccess("Notification sent.");
      await loadNotifications();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to send notification.");
    }
  }

  return (
    <AdminShell>
      <main className="container-shell py-10 md:py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Communication</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Notifications</h1>
        <p className="mt-3 text-slate-500">Send operational updates to candidates and review delivery history.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <form onSubmit={createNotification} className="rounded-[1.8rem] border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-semibold text-slate-900">Send notification</h2>
            <div className="mt-6 space-y-4">
              <input required type="number" min="1" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient user ID" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" rows={5} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none" />
              <button type="submit" className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">Send notification</button>
            </div>
            {success ? <p className="mt-4 text-sm text-emerald-700">{success}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          </form>
          <section className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-7"><h2 className="text-xl font-semibold text-slate-900">Recent notifications</h2></div>
            {notifications.length === 0 ? <p className="p-7 text-sm text-slate-500">No notifications have been sent.</p> : <div className="divide-y divide-slate-100">{notifications.map((notification) => <div key={notification.id} className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-slate-900">{notification.title}</p><p className="mt-1 text-sm text-slate-500">{notification.recipient_email}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${notification.is_read ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{notification.is_read ? "Read" : "Unread"}</span></div><p className="mt-3 text-sm text-slate-600">{notification.message}</p></div>)}</div>}
          </section>
        </div>
      </main>
    </AdminShell>
  );
}
