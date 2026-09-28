import { ArrowRight, BriefcaseBusiness, GraduationCap, Rocket, Users } from "lucide-react";

const talentAreas = [
  {
    icon: Rocket,
    title: "Career acceleration",
    text: "Build confident professionals through coaching, digital readiness, and market positioning.",
  },
  {
    icon: GraduationCap,
    title: "Training programs",
    text: "Practical learning arcs designed around real business tasks, not theory alone.",
  },
  {
    icon: Users,
    title: "Talent placement",
    text: "Match emerging talent with employers who value problem-solving, initiative, and discovery.",
  },
];

export default function TalentPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="container-shell py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Talent</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
            Human capability is the engine behind great technology.
          </h1>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {talentAreas.map(({ icon: Icon, title, text }) => (
            <article key={title} className="soft-card rounded-[1.8rem] p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="soft-card rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Program impact</p>
            <div className="mt-5 space-y-6">
              {[
                ["Readiness score", "96%"],
                ["Employer satisfaction", "4.9/5"],
                ["Career placement support", "12-week accelerator"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                  <span className="text-slate-600">{label}</span>
                  <span className="text-xl font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white">
            <BriefcaseBusiness className="h-8 w-8 text-blue-300" />
            <h3 className="mt-5 text-2xl font-semibold">Talent support that feels personal and practical.</h3>
            <p className="mt-4 text-slate-300">We combine structured learning, role-specific support, and feedback loops so individuals can turn ambition into momentum.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
              Talk to our talent team <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
