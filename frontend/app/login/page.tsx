"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearAuthTokens, saveAuthTokens } from "@/lib/auth";
import { postJson } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    clearAuthTokens();
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await postJson<{ access: string; refresh: string }>("/token/", {
        email: values.email.trim(),
        password: values.password,
      });

      saveAuthTokens({ access: tokens.access, refresh: tokens.refresh });
      window.dispatchEvent(new Event("vinexture_auth_changed"));
      window.dispatchEvent(new Event("vinexture_profile_changed"));

      const nextUrl = new URLSearchParams(window.location.search).get("next") || "/portal";
      router.push(nextUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please verify your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container-shell flex min-h-[85vh] items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-8 sm:p-10 shadow-xl backdrop-blur-xl transition">
          {/* Logo & Header */}
          <div className="text-center sm:text-left">
            <Link href="/" className="mb-6 inline-flex items-center gap-3 group">
              <Image
                src="/logo.png"
                alt="VINEXTURE Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain transition-transform group-hover:scale-105"
              />
              <div className="text-left">
                <span className="block text-xl font-extrabold tracking-tight text-slate-950 leading-none">
                  VINE<span className="text-red-600">X</span>TURE
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-semibold mt-1">
                  Candidate & Intern Portal
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
              <Sparkles className="h-3 w-3" /> Secure Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Welcome back
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Sign in to manage your internship applications and projects.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-800 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  {...form.register("email")}
                  className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                    form.formState.errors.email ? "border-red-300 bg-red-50/30" : "border-slate-200"
                  }`}
                  placeholder="name@example.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  href="/contact"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Need help?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...form.register("password")}
                  className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                    form.formState.errors.password
                      ? "border-red-300 bg-red-50/30"
                      : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="font-bold text-slate-950 underline decoration-slate-300 hover:text-blue-600 hover:decoration-blue-600 transition"
              >
                Create candidate account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-bit Secure
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Verified Credentials
          </div>
        </div>
      </div>
    </main>
  );
}
