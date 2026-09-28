import { Mail, MapPin, MessageSquareText, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="container-shell py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">Contact</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-slate-950">
            Let’s build your next important technology move.
          </h1>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="soft-card rounded-[2rem] p-8">
            <div className="space-y-5 text-slate-700">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-blue-700" />
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Email</p>
                  <p className="mt-1">hello@vinexture.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-blue-700" />
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Phone</p>
                  <p className="mt-1">+234 (0) 800 000 0000</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-blue-700" />
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Office</p>
                  <p className="mt-1">Lagos, Abuja, and remote engagements across Africa</p>
                </div>
              </div>
            </div>
          </div>

          <div className="soft-card rounded-[2rem] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Send a message</p>
            </div>

            <form action="mailto:hello@vinexture.com" method="post" encType="text/plain" className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <input name="name" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 placeholder:text-slate-400" placeholder="Full name" />
                <input name="email" type="email" required className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 placeholder:text-slate-400" placeholder="Email address" />
              </div>
              <input name="company" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 placeholder:text-slate-400" placeholder="Company or organization" />
              <textarea name="message" required className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 placeholder:text-slate-400" placeholder="How can we help?" />
              <button type="submit" className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                Send inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
