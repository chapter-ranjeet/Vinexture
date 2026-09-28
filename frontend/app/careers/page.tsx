import { ArrowRight, Briefcase, CircleCheckBig } from "lucide-react";
import Link from "next/link";

const roles = [
  { title: "Senior Product Strategist", team: "Strategy & Growth" },
  { title: "Full Stack Engineer", team: "Engineering" },
  { title: "AI Solutions Consultant", team: "Client Delivery" },
  { title: "Talent Program Manager", team: "People & Learning" },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="container-shell py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Careers</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
            Build the future with a team that moves with purpose.
          </h1>
        </div>

        <div className="mt-12 space-y-6">
          {roles.map((role) => (
            <article key={role.title} className="soft-card flex flex-col justify-between gap-4 rounded-[1.8rem] p-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{role.title}</h2>
                  <p className="text-sm text-slate-500">{role.team}</p>
                </div>
              </div>

              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                Apply <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-16 soft-card rounded-[2rem] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Why VINEXTURE</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              "High-trust teams with ownership and pace.",
              "Meaningful work across product, strategy, and learning.",
              "A culture built around clarity, execution, and growth.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                <CircleCheckBig className="mt-0.5 h-5 w-5 text-blue-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
