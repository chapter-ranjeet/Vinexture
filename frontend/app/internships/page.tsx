"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { fetchJson } from "@/lib/api";

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
  status: string;
  is_open: boolean;
  application_fee: string;
  nepal_application_fee: string;
  currency: string;
  india_payment_qr_url: string | null;
  nepal_payment_qr_url: string | null;
};

export default function InternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchJson<{ results?: Internship[] } | Internship[]>("/internships/");
        setInternships(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load internships.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function getDeadlineNotice(deadlineStr: string | null, isOpen: boolean) {
    if (!isOpen) {
      return { text: "Applications Closed", closed: true, badge: "bg-red-50 text-red-700 border-red-200" };
    }
    if (!deadlineStr) {
      return { text: "Open for Enrollment", closed: false, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }

    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: "Deadline Passed", closed: true, badge: "bg-red-50 text-red-700 border-red-200" };
    }
    if (diffDays === 1) {
      return { text: "Closes today!", closed: false, badge: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
    }
    if (diffDays <= 5) {
      return { text: `${diffDays} days left`, closed: false, badge: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
    }
    return { text: `Closes in ${diffDays} days`, closed: false, badge: "bg-blue-50 text-blue-700 border-blue-200" };
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="container-shell py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            <Sparkles className="h-3.5 w-3.5" /> Career Acceleration Programs
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Real client projects. Industry mentorship. Measurable growth.
          </h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Join the VINEXTURE internship cohorts to work directly alongside senior engineers, designers, and digital strategists.
          </p>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            <p className="text-sm font-medium text-slate-500">Discovering active internship opportunities...</p>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Internships List */}
        {!loading && !error && (
          <div className="mt-12 space-y-8">
            {internships.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">No active cohorts right now.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Please check back soon or get in touch for upcoming opportunities.
                </p>
              </div>
            ) : (
              internships.map((internship) => {
                const deadlineInfo = getDeadlineNotice(internship.application_deadline, internship.is_open);

                return (
                  <article
                    key={internship.id}
                    id={internship.slug}
                    className="soft-card relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 transition hover:shadow-md md:p-8"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                            {internship.category || "Cohort"}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${deadlineInfo.badge}`}
                          >
                            {deadlineInfo.text}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                            {internship.internship_type || "Remote"}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            {internship.title}
                          </h2>
                          <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-slate-600">
                            {internship.description}
                          </p>
                        </div>

                        {/* Metadata Pills */}
                        <div className="grid gap-3 pt-2 text-xs text-slate-600 sm:grid-cols-2 md:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>
                              Duration: <strong>{internship.duration || "3 Months"}</strong>
                            </span>
                          </div>
                          {internship.available_seats ? (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span>
                                Available Seats: <strong>{internship.available_seats}</strong>
                              </span>
                            </div>
                          ) : null}
                          {internship.application_deadline ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>
                                Deadline: <strong>{new Date(internship.application_deadline).toLocaleDateString()}</strong>
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Eligibility & Skills Required */}
                        {(internship.skills_required || internship.eligibility) && (
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-700">
                            {internship.skills_required ? (
                              <p className="mb-1.5">
                                <strong className="text-slate-900">Key Skills:</strong> {internship.skills_required}
                              </p>
                            ) : null}
                            {internship.eligibility ? (
                              <p>
                                <strong className="text-slate-900">Eligibility:</strong> {internship.eligibility}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Right CTA column */}
                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 lg:w-64 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400">Application Fee</p>
                          <p className="mt-1 text-2xl font-black text-slate-950">
                            ₹{internship.application_fee || "99"}
                            <span className="text-xs font-normal text-slate-500"> / NPR {internship.nepal_application_fee || "99"}</span>
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">Verified via official UPI / eSewa QR</p>
                        </div>

                        {deadlineInfo.closed ? (
                          <div className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-medium text-slate-500">
                            Applications Closed
                          </div>
                        ) : (
                          <Link
                            href={`/apply?internship=${internship.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                          >
                            Apply Now <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* Value Proposition Highlights */}
        <div className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Why Intern at VINEXTURE?</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">The VINEXTURE Advantage</p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Live Production Systems",
                text: "No artificial sandbox assignments. You contribute code, design systems, or data pipelines that deploy to production.",
              },
              {
                title: "1-on-1 Senior Mentorship",
                text: "Receive weekly reviews, architecture walkthroughs, and personalized feedback from leads who build technology at scale.",
              },
              {
                title: "Direct Hiring Pathways",
                text: "Over 80% of our high-performing interns convert to full-time junior positions or receive client recommendation letters.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
