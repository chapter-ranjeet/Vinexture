import {
  ArrowRight,
  BriefcaseBusiness,
  BrainCircuit,
  Building2,
  ChevronRight,
  GraduationCap,
  LineChart,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const metrics = [
  { value: "250+", label: "digital products launched" },
  { value: "12K+", label: "talent profiles supported" },
  { value: "94%", label: "client retention in growth programs" },
];

const services = [
  {
    icon: BrainCircuit,
    title: "AI-powered business systems",
    text: "Build digital operating layers that automate operations, improve customer journeys, and turn insights into action.",
  },
  {
    icon: Building2,
    title: "Technology consulting",
    text: "Strategy, product thinking, and technical execution for founders, SMEs, and enterprise teams ready to scale.",
  },
  {
    icon: LineChart,
    title: "Growth & analytics",
    text: "Track performance, forecast demand, and align your tech roadmap with measurable commercial outcomes.",
  },
];

const talentTracks = [
  "Career acceleration coaching",
  "Internship-to-job pipelines",
  "Training for emerging talent",
  "Recruitment readiness programs",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
          <div className="absolute inset-0 grid-glow opacity-60" />
          <div className="container-shell relative grid gap-12 py-16 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Built for digital growth
              </div>

              <div className="space-y-6">
                <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 md:text-6xl">
                  Technology that moves careers, businesses, and ideas forward.
                </h1>
                <p className="max-w-lg text-lg leading-8 text-slate-600">
                  VINEXTURE blends digital product design, AI enablement, business technology, and talent development to help brands and professionals perform at a higher level.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/solutions" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white">
                  Explore solutions <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#solutions" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-900">
                  <PlayCircle className="h-4 w-4" /> View capabilities
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                    <div className="text-2xl font-semibold tracking-tight text-slate-900">{item.value}</div>
                    <div className="mt-2 text-sm text-slate-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="soft-card relative overflow-hidden rounded-[2rem] p-5">
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Portfolio pulse</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Q3 execution</h2>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      +28.4%
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-900 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Pipeline</p>
                        <div className="mt-3 text-3xl font-semibold">$2.4M</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI automations</p>
                        <div className="mt-3 text-3xl font-semibold text-slate-900">18</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                        <span>Delivery velocity</span>
                        <span className="font-semibold text-slate-900">82%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[82%] rounded-full bg-slate-900" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Product strategy", value: "9.4/10" },
                        { label: "Talent readiness", value: "8.8/10" },
                        { label: "Business transformation", value: "9.1/10" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <span className="text-sm text-slate-600">{item.label}</span>
                          <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="py-20">
          <div className="container-shell">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">What we do</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                Revenue-ready strategy and execution for modern teams.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {services.map(({ icon: Icon, title, text }) => (
                <article key={title} className="soft-card rounded-[1.8rem] p-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    Learn more <ChevronRight className="h-4 w-4" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="talent" className="bg-slate-950 py-20 text-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Talent systems</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
                We build the bridge between learning, opportunity, and performance.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
                Our programs support candidates, learners, and employers with structured pathways to skill, hire, and grow with confidence.
              </p>
              <div className="mt-8 space-y-4">
                {talentTracks.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                    <Target className="h-4 w-4 text-blue-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-slate-700 bg-slate-900 p-6">
                <BriefcaseBusiness className="h-8 w-8 text-blue-300" />
                <h3 className="mt-4 text-xl font-semibold">Career pipeline</h3>
                <p className="mt-3 text-slate-300">Structured hiring support that reduces friction between talent readiness and employer demand.</p>
              </div>
              <div className="rounded-[1.8rem] border border-slate-700 bg-slate-900 p-6">
                <GraduationCap className="h-8 w-8 text-blue-300" />
                <h3 className="mt-4 text-xl font-semibold">Learning labs</h3>
                <p className="mt-3 text-slate-300">Practical training programs designed to build job-ready capability and long-term confidence.</p>
              </div>
              <div className="rounded-[1.8rem] border border-slate-700 bg-slate-900 p-6 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Program readiness</p>
                    <h3 className="mt-2 text-2xl font-semibold">96%</h3>
                  </div>
                  <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Strong outcome index
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="internships" className="py-20">
          <div className="container-shell">
            <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Opportunity engine</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                  Internships, training, and practical pathways that deliver momentum.
                </h2>
              </div>
              <Link href="/talent" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900">Discover programs</Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {[
                ["Product & Design", "UX research, product strategy, design systems, and digital experiences."],
                ["Data & AI", "Hands-on projects for analytics, automation, AI workflows, and decision support."],
                ["Business Operations", "Build operational excellence, process design, and communication skills for growth."],
              ].map(([title, text]) => (
                <article key={title} className="soft-card rounded-[1.8rem] p-6">
                  <div className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-600">
                    Program
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-sm text-slate-500">6-12 weeks</span>
                    <ArrowRight className="h-4 w-4 text-slate-900" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="border-y border-slate-200 bg-white py-20">
          <div className="container-shell grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Built for growth</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                We help organizations turn ambition into measurable systems.
              </h2>
            </div>
            <div className="soft-card rounded-[1.8rem] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Transformation focus</p>
              <ul className="mt-5 space-y-4 text-sm text-slate-700">
                <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /> Product strategy and digital roadmaps</li>
                <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /> AI adoption with practical business value</li>
                <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" /> Talent and workforce readiness programs</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-slate-950 py-12 text-slate-300 border-t border-slate-900">
        <div className="container-shell flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="VINEXTURE Logo"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-2xl bg-white p-1.5 object-contain shadow-sm"
            />
            <div>
              <div className="text-xl font-extrabold text-white flex items-center leading-none">
                VINE<span className="text-red-500">X</span>TURE
              </div>
              <p className="mt-1 max-w-md text-xs text-slate-400">
                Technology • Digital Solutions • Talent. Empowering businesses and future leaders.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 border border-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">Partner with us</Link>
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100">Talk to sales</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
