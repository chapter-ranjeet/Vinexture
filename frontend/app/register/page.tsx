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
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearAuthTokens, saveAuthTokens } from "@/lib/auth";
import { postJson } from "@/lib/api";

const registerSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().optional(),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(7, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError("");
    setIsSubmitting(true);

    try {
      // 1. Register candidate in Django
      await postJson("/auth/register/", {
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: (values.last_name || "").trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: "candidate",
      });

      // 2. Automatically log the candidate in
      try {
        clearAuthTokens();
        const tokens = await postJson<{ access: string; refresh: string }>("/token/", {
          email: values.email.trim(),
          password: values.password,
        });
        saveAuthTokens({ access: tokens.access, refresh: tokens.refresh });
        window.dispatchEvent(new Event("vinexture_auth_changed"));
        window.dispatchEvent(new Event("vinexture_profile_changed"));
        router.push("/portal");
        return;
      } catch {
        // If auto-login fails, redirect to login page
        router.push("/login?registered=1");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. An account with this email may already exist."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container-shell flex min-h-[85vh] items-center justify-center py-16 px-4">
      <div className="w-full max-w-xl">
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
                  Candidate Registration
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
              <Sparkles className="h-3 w-3" /> Join VINEXTURE
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Create Candidate Account
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Apply for internships, access verified deliverables, and fast-track your tech career.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-800 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    {...form.register("first_name")}
                    className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                      form.formState.errors.first_name ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="e.g. Alex"
                  />
                </div>
                {form.formState.errors.first_name && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    {...form.register("last_name")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="e.g. Morgan"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    {...form.register("email")}
                    className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                      form.formState.errors.email ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="alex@example.com"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    {...form.register("phone")}
                    className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                      form.formState.errors.phone ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="+91 9876543210"
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...form.register("password")}
                    className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                      form.formState.errors.password ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...form.register("confirm_password")}
                    className={`w-full rounded-2xl border bg-slate-50/60 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                      form.formState.errors.confirm_password
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-500">
                    {form.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-slate-950 underline decoration-slate-300 hover:text-blue-600 hover:decoration-blue-600 transition"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Security / Verification Note */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure Data Protection
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Instant Access
          </div>
        </div>
      </div>
    </main>
  );
}
