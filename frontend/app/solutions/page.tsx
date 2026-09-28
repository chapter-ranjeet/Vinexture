import { ArrowRight, Bot, Briefcase, Database, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Bot,
    title: "AI-first operating systems",
    text: "Automate workflows, improve decision-making, and convert data into practical traction for growth teams.",
  },
  {
    icon: Database,
    title: "Digital platform architecture",
    text: "We design resilient tech infrastructures that connect product, data, and customer experience with clarity.",
  },
  {
    icon: Briefcase,
    title: "Business transformation",
    text: "Align technology investments with operational priorities, revenue growth, and measurable service outcomes.",
  },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="container-shell py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Solutions</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
            Strategy, systems, and execution built for digital growth.
          </h1>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <article key={title} className="soft-card rounded-[1.8rem] p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                Explore service <ArrowRight className="h-4 w-4" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 soft-card rounded-[2rem] p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Delivery model</p>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Discover", "Diagnostic workshops and business mapping to uncover friction and opportunities."],
              ["Design", "Roadmaps, workflows, and product architecture aligned with the next stage of growth."],
              ["Deploy", "Implementation support that simplifies delivery and keeps teams focused on outcomes."],
            ].map(([step, text]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{step}</p>
                <p className="mt-3 text-base leading-7 text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
