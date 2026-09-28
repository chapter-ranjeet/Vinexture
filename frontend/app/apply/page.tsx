"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { fetchJson, postJson, uploadFormData } from "@/lib/api";

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
  payment_instructions: string;
};

type ApplicationData = {
  id?: number;
  application_number?: string;
  internship?: number;
  internship_title?: string;
  internship_data?: Internship;
  status?: string;
  current_step?: number;
  is_draft?: boolean;
  // Step 1: Personal
  full_name: string;
  email: string;
  phone: string;
  country: string;
  dob: string;
  gender: string;
  // Step 2: Education
  qualification: string;
  college_university: string;
  course: string;
  specialization: string;
  semester_year: string;
  graduation_year: string;
  cgpa: string;
  // Step 3: Skills
  technical_skills: string;
  other_skills: string;
  projects: string;
  experience: string;
  certifications: string;
  // Step 4: Documents
  resume_url?: string | null;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  // Step 5: Preferences
  preferred_mode: string;
  availability: string;
  expected_start_date: string;
  why_join: string;
  learning_expectations: string;
  // Payment
  latest_payment?: {
    id: number;
    amount: string;
    currency: string;
    reference: string;
    phone_number: string;
    status: string;
    rejection_reason?: string;
    created_at: string;
  } | null;
};

const initialFormData: ApplicationData = {
  full_name: "",
  email: "",
  phone: "",
  country: "India",
  dob: "",
  gender: "",
  qualification: "",
  college_university: "",
  course: "",
  specialization: "",
  semester_year: "",
  graduation_year: "",
  cgpa: "",
  technical_skills: "",
  other_skills: "",
  projects: "",
  experience: "",
  certifications: "",
  github_url: "",
  linkedin_url: "",
  portfolio_url: "",
  preferred_mode: "remote",
  availability: "Immediate",
  expected_start_date: "",
  why_join: "",
  learning_expectations: "",
};

const steps = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Education", icon: GraduationCap },
  { id: 3, name: "Skills & Exp", icon: Briefcase },
  { id: 4, name: "Documents", icon: FileText },
  { id: 5, name: "Preferences", icon: Sparkles },
  { id: 6, name: "Review", icon: FileCheck },
  { id: 7, name: "Payment", icon: QrCode },
];

function ApplyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryInternshipId = searchParams.get("internship");
  const queryAppId = searchParams.get("applicationId");

  const [currentStep, setCurrentStep] = useState(1);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [formData, setFormData] = useState<ApplicationData>(initialFormData);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Payment inputs
  const [paymentCountry, setPaymentCountry] = useState<"India" | "Nepal">("India");
  const [transactionId, setTransactionId] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Autosave timer ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load available internships & resume existing application if available
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Fetch open internships
        const internshipsRes = await fetchJson<{ results?: Internship[] } | Internship[]>("/internships/");
        const available = Array.isArray(internshipsRes) ? internshipsRes : internshipsRes.results || [];
        setInternships(available);

        let activeApp: (ApplicationData & { is_auto_filled?: boolean; has_draft?: boolean }) | null = null;

        // If resuming by application ID
        if (queryAppId) {
          activeApp = await fetchJson<ApplicationData>(`/applications/${queryAppId}/`);
        } else {
          // Pre-fill matching details from candidate profile and past records
          const targetInternship = queryInternshipId || (available.length > 0 ? String(available[0].id) : "");
          try {
            const prefillUrl = targetInternship
              ? `/applications/prefill/?internship=${targetInternship}`
              : `/applications/prefill/`;
            const prefill = await fetchJson<ApplicationData & { is_auto_filled?: boolean; has_draft?: boolean }>(prefillUrl);
            if (prefill) {
              activeApp = prefill;
              if (prefill.is_auto_filled) {
                setIsAutoFilled(true);
              }
            }
          } catch {
            // Fallback to draft endpoint if prefill query has any issue
            if (queryInternshipId) {
              try {
                const draft = await fetchJson<ApplicationData>(`/applications/draft/?internship=${queryInternshipId}`);
                if (draft && draft.id) {
                  activeApp = draft;
                }
              } catch {
                // No draft found
              }
            }
          }
        }

        if (activeApp) {
          setFormData((prev) => ({
            ...prev,
            ...activeApp,
            full_name: activeApp?.full_name || prev.full_name,
            email: activeApp?.email || prev.email,
            phone: activeApp?.phone || prev.phone,
            country: activeApp?.country || prev.country,
          }));

          // Pick the matching internship
          const matchingInt = available.find((i) => i.id === activeApp?.internship) || (activeApp?.internship_data as Internship | undefined);
          if (matchingInt) {
            setSelectedInternship(matchingInt);
            if (activeApp.country?.toLowerCase() === "nepal") {
              setPaymentCountry("Nepal");
            }
          } else if (queryInternshipId) {
            const chosen = available.find((i) => String(i.id) === queryInternshipId);
            if (chosen) setSelectedInternship(chosen);
          } else if (available.length > 0) {
            setSelectedInternship(available[0]);
          }

          if (activeApp.status === "payment_pending" || activeApp.status === "submitted" || activeApp.status === "accepted") {
            setPaymentSubmitted(true);
            setCurrentStep(7);
          } else if (activeApp.current_step && activeApp.current_step >= 1 && activeApp.current_step <= 7) {
            setCurrentStep(activeApp.current_step);
          }
        } else if (queryInternshipId) {
          const chosen = available.find((i) => String(i.id) === queryInternshipId);
          if (chosen) {
            setSelectedInternship(chosen);
          }
        } else if (available.length > 0) {
          setSelectedInternship(available[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize application.");
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [queryAppId, queryInternshipId]);

  // Sync payment country with personal info country if user changes it
  useEffect(() => {
    if (formData.country?.toLowerCase() === "nepal") {
      setPaymentCountry("Nepal");
    } else {
      setPaymentCountry("India");
    }
  }, [formData.country]);

  // Save / Autosave application to backend
  const saveApplication = useCallback(
    async (silent = false, stepToSave?: number) => {
      if (!selectedInternship) return;
      if (!silent) setSavingDraft(true);

      try {
        setError(null);
        const dataToSave = {
          ...formData,
          internship: selectedInternship.id,
          current_step: stepToSave !== undefined ? stepToSave : currentStep,
          is_draft: true,
        };

        let saved: ApplicationData;

        // If resume file is newly chosen, upload as multipart
        if (resumeFile) {
          const dataForm = new FormData();
          Object.entries(dataToSave).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
              dataForm.append(k, String(v));
            }
          });
          dataForm.append("resume", resumeFile);

          if (formData.id) {
            saved = await uploadFormData<ApplicationData>(`/applications/${formData.id}/`, dataForm, "PATCH");
          } else {
            saved = await uploadFormData<ApplicationData>("/applications/", dataForm, "POST");
          }
          setResumeFile(null);
        } else {
          // Regular JSON request
          if (formData.id) {
            saved = await fetchJson<ApplicationData>(`/applications/${formData.id}/`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataToSave),
            });
          } else {
            saved = await postJson<ApplicationData>("/applications/", dataToSave);
          }
        }

        setFormData((prev) => ({
          ...prev,
          ...saved,
        }));
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : "Unable to save draft.");
        }
      } finally {
        if (!silent) setSavingDraft(false);
      }
    },
    [currentStep, formData, resumeFile, selectedInternship]
  );

  // Debounced auto-save on field changes
  const handleFieldChange = (field: keyof ApplicationData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void saveApplication(true);
    }, 2500);
  };

  // Step navigation
  const nextStep = async () => {
    // Basic step validation
    if (currentStep === 1) {
      if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError("Please enter your Full Name, Email, and Phone Number.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.qualification.trim() || !formData.college_university.trim() || !formData.course.trim()) {
        setError("Please provide your Qualification, College/University, and Course.");
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.resume_url && !resumeFile) {
        setError("Please upload your Resume / CV in PDF format.");
        return;
      }
    }

    setError(null);
    const targetStep = Math.min(currentStep + 1, 7);
    await saveApplication(false, targetStep);
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToStep = (stepNumber: number) => {
    setError(null);
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      setError("Please ensure your application draft is saved first.");
      return;
    }
    if (!transactionId.trim() || !paymentPhone.trim()) {
      setError("Please enter both Transaction ID and Payment Phone Number.");
      return;
    }
    if (!receiptFile) {
      setError("Please upload your payment receipt or screenshot to proceed.");
      return;
    }

    try {
      setSubmittingPayment(true);
      setError(null);

      // Verify that deadline hasn't passed
      if (selectedInternship && !selectedInternship.is_open) {
        throw new Error("The application deadline for this internship has passed.");
      }

      const formPayload = new FormData();
      formPayload.append("application", String(formData.id));
      formPayload.append("reference", transactionId.trim());
      formPayload.append("phone_number", paymentPhone.trim());
      formPayload.append("country", paymentCountry);
      formPayload.append("payment_method", paymentCountry === "Nepal" ? "esewa_qr" : "upi_qr");
      if (receiptFile) {
        formPayload.append("receipt", receiptFile);
      }

      await uploadFormData("/payments/submit/", formPayload, "POST");

      // Refresh application record
      const refreshed = await fetchJson<ApplicationData>(`/applications/${formData.id}/`);
      setFormData(refreshed);
      setPaymentSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit payment details.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        <p className="text-sm font-medium text-slate-600">Loading internship application...</p>
      </div>
    );
  }

  // Selected fee and QR based on country
  const currentFee =
    paymentCountry === "Nepal"
      ? `NPR ${selectedInternship?.nepal_application_fee || "99"}`
      : `₹${selectedInternship?.application_fee || "99"}`;

  const currentQrUrl =
    paymentCountry === "Nepal"
      ? selectedInternship?.nepal_payment_qr_url
      : selectedInternship?.india_payment_qr_url;

  return (
    <div className="min-h-screen bg-[var(--background)] py-10">
      <div className="container-shell max-w-4xl">
        {/* Header Navigation & Internship Info */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/internships"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to internships
          </Link>
          <div className="flex items-center gap-3">
            {lastSaved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Autosaved {lastSaved}
              </span>
            ) : null}
            <Button
              variant="secondary"
              size="default"
              onClick={() => void saveApplication(false)}
              disabled={savingDraft || paymentSubmitted}
              className="gap-2 text-xs"
            >
              {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save as Draft
            </Button>
          </div>
        </div>

        {/* Internship Banner */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Briefcase className="h-3.5 w-3.5" />
                {selectedInternship?.category || "Internship Program"}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {selectedInternship?.title || "Internship Application"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="capitalize">{selectedInternship?.internship_type || "Remote"}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedInternship?.duration || "3 Months"}
                </span>
                {selectedInternship?.application_deadline ? (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <Calendar className="h-3.5 w-3.5" />
                    Deadline: {new Date(selectedInternship.application_deadline).toLocaleDateString()}
                  </span>
                ) : null}
                <span className="font-semibold text-slate-900">
                  Fee: ₹{selectedInternship?.application_fee || "99"} (India) / NPR {selectedInternship?.nepal_application_fee || "99"} (Nepal)
                </span>
              </div>
            </div>

            {/* Internship Selector if multiple */}
            {internships.length > 1 && !formData.id ? (
              <div className="min-w-[200px]">
                <label className="mb-1 block text-xs font-medium text-slate-500">Change Internship</label>
                <select
                  value={selectedInternship?.id || ""}
                  onChange={async (e) => {
                    const found = internships.find((i) => String(i.id) === e.target.value);
                    if (found) {
                      setSelectedInternship(found);
                      if (!formData.id) {
                        try {
                          const prefill = await fetchJson<ApplicationData & { is_auto_filled?: boolean }>(
                            `/applications/prefill/?internship=${found.id}`
                          );
                          if (prefill) {
                            setFormData((prev) => ({
                              ...prev,
                              ...prefill,
                            }));
                            if (prefill.is_auto_filled) setIsAutoFilled(true);
                          }
                        } catch {
                          // Ignore
                        }
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium outline-none"
                >
                  {internships.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Deadline Passed Alert */}
          {selectedInternship && !selectedInternship.is_open ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                <strong>Applications are closed:</strong> The deadline for this internship has passed. Existing drafts can still be reviewed, but new submissions are not accepted.
              </span>
            </div>
          ) : null}
        </div>

        {/* Multi-Step Stepper Header */}
        <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex min-w-[620px] items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.id && step.id < currentStep) jumpToStep(step.id);
                    }}
                    disabled={!formData.id || step.id > currentStep}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-slate-900 text-white shadow-sm"
                        : isPassed
                        ? "cursor-pointer text-emerald-700 hover:bg-emerald-50"
                        : "cursor-not-allowed text-slate-400"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isCurrent
                          ? "bg-white text-slate-900"
                          : isPassed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPassed ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </div>
                    <span>{step.name}</span>
                  </button>
                  {idx < steps.length - 1 ? (
                    <div
                      className={`mx-2 h-[2px] flex-1 ${
                        isPassed ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {error ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Profile Auto-fill Notification */}
        {isAutoFilled && !paymentSubmitted && (
          <div className="mb-6 flex items-start justify-between rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/80 p-4 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  Profile Details Automatically Filled
                </p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  Your personal info, education, skills, documents, and preferred internship modes have been automatically pre-populated from your candidate profile and past records. Review or update any field as needed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAutoFilled(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition"
              title="Dismiss note"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP CONTENT CONTAINER */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {/* STEP 1: PERSONAL INFORMATION */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 1 of 7</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Personal Information</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Provide your primary contact and personal background details.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleFieldChange("full_name", e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleFieldChange("country", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="India">India (₹99 via UPI)</option>
                    <option value="Nepal">Nepal (NPR 99 via eSewa)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                  <select
                    value={formData.gender || ""}
                    onChange={(e) => handleFieldChange("gender", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 2 of 7</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Academic Background</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell us about your current university, course, and educational degree.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Highest Qualification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => handleFieldChange("qualification", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Qualification</option>
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="MBA / BBA">MBA / BBA</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    College / University <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.college_university}
                    onChange={(e) => handleFieldChange("college_university", e.target.value)}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Degree / Course <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.course}
                    onChange={(e) => handleFieldChange("course", e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Specialization / Stream</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => handleFieldChange("specialization", e.target.value)}
                    placeholder="e.g. AI & Data Science / Full Stack"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Semester / Current Year</label>
                  <input
                    type="text"
                    value={formData.semester_year}
                    onChange={(e) => handleFieldChange("semester_year", e.target.value)}
                    placeholder="e.g. 6th Semester / 3rd Year"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Graduation Year</label>
                  <input
                    type="text"
                    value={formData.graduation_year}
                    onChange={(e) => handleFieldChange("graduation_year", e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">CGPA / Percentage</label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    onChange={(e) => handleFieldChange("cgpa", e.target.value)}
                    placeholder="e.g. 8.4 CGPA or 82%"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS & EXPERIENCE */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 3 of 7</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Skills & Experience</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Highlight your technical proficiencies, portfolio projects, and work history.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Technical Skills <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.technical_skills}
                    onChange={(e) => handleFieldChange("technical_skills", e.target.value)}
                    placeholder="e.g. Python, React, Next.js, Django, TypeScript, Tailwind CSS, PostgreSQL, Git"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Other Skills & Strengths</label>
                  <input
                    type="text"
                    value={formData.other_skills}
                    onChange={(e) => handleFieldChange("other_skills", e.target.value)}
                    placeholder="e.g. Agile teamwork, Technical writing, Figma design, Problem solving"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Notable Projects</label>
                  <textarea
                    rows={3}
                    value={formData.projects}
                    onChange={(e) => handleFieldChange("projects", e.target.value)}
                    placeholder="List 1-3 key projects you have built, technologies used, and brief outcomes."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Prior Experience</label>
                  <textarea
                    rows={3}
                    value={formData.experience}
                    onChange={(e) => handleFieldChange("experience", e.target.value)}
                    placeholder="Any prior internships, open-source work, or campus leadership (optional for freshers)."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Certifications & Courses</label>
                  <input
                    type="text"
                    value={formData.certifications}
                    onChange={(e) => handleFieldChange("certifications", e.target.value)}
                    placeholder="e.g. AWS Certified Cloud Practitioner, Coursera Deep Learning Specialization"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DOCUMENTS */}
          {currentStep === 4 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 4 of 7</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Documents & Profiles</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload your Resume in PDF format and link your online profiles.
                </p>
              </div>

              {/* PDF Resume Upload */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Resume / CV (PDF Only, Max 10MB) <span className="text-red-500">*</span>
                </label>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-slate-400 hover:bg-slate-100/50">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.name.toLowerCase().endsWith(".pdf")) {
                        setError("Only PDF files are supported for resume upload.");
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        setError("Resume PDF size must be under 10MB.");
                        return;
                      }
                      setResumeFile(file);
                      setError(null);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Upload className="h-6 w-6" />
                    </div>
                    {resumeFile ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-900">{resumeFile.name}</p>
                        <p className="text-xs text-slate-500">
                          {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to save
                        </p>
                        <label
                          htmlFor="resume-upload"
                          className="mt-3 inline-block cursor-pointer text-xs font-semibold text-blue-600 underline"
                        >
                          Change PDF file
                        </label>
                      </div>
                    ) : formData.resume_url ? (
                      <div className="mt-3">
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Resume already uploaded
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-4">
                          <a
                            href={formData.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View current PDF
                          </a>
                          <label
                            htmlFor="resume-upload"
                            className="cursor-pointer text-xs font-semibold text-slate-600 underline"
                          >
                            Replace file
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer text-sm font-semibold text-blue-600 underline hover:text-blue-800"
                        >
                          Click to browse and upload Resume
                        </label>
                        <p className="mt-1 text-xs text-slate-500">PDF documents only (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profiles */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">GitHub Profile URL</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => handleFieldChange("github_url", e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleFieldChange("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Portfolio / Personal Website</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => handleFieldChange("portfolio_url", e.target.value)}
                    placeholder="https://yourname.dev"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: INTERNSHIP PREFERENCES */}
          {currentStep === 5 && (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 5 of 7</span>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Internship Preferences</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Align your working style, start availability, and personal motivations.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Preferred Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.preferred_mode}
                      onChange={(e) => handleFieldChange("preferred_mode", e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Availability</label>
                    <input
                      type="text"
                      value={formData.availability}
                      onChange={(e) => handleFieldChange("availability", e.target.value)}
                      placeholder="e.g. Immediate / Full-time / Part-time"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Expected Start Date</label>
                  <input
                    type="date"
                    value={formData.expected_start_date || ""}
                    onChange={(e) => handleFieldChange("expected_start_date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white sm:max-w-xs"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Why do you want to join VINEXTURE? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.why_join}
                    onChange={(e) => handleFieldChange("why_join", e.target.value)}
                    placeholder="Share what excites you about VINEXTURE's mission, team, and projects."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Learning Expectations</label>
                  <textarea
                    rows={3}
                    value={formData.learning_expectations}
                    onChange={(e) => handleFieldChange("learning_expectations", e.target.value)}
                    placeholder="What specific skills or milestones do you hope to accomplish during this internship?"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW */}
          {currentStep === 6 && (
            <div>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 6 of 7</span>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Review Application</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review your complete application. Click any &quot;Edit&quot; button to make changes before proceeding to payment.
                  </p>
                </div>
                {formData.application_number ? (
                  <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-800">
                    App Ref: {formData.application_number}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                {/* 1. Personal */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <User className="h-4 w-4 text-blue-600" /> Personal Information
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="text-xs font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <strong className="text-slate-500">Name:</strong> {formData.full_name || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Email:</strong> {formData.email || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Phone:</strong> {formData.phone || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Country:</strong> {formData.country || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">DOB:</strong> {formData.dob || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Gender:</strong>{" "}
                      <span className="capitalize">{formData.gender || "—"}</span>
                    </p>
                  </div>
                </div>

                {/* 2. Education */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <GraduationCap className="h-4 w-4 text-blue-600" /> Education
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(2)}
                      className="text-xs font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <strong className="text-slate-500">Qualification:</strong> {formData.qualification || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">College:</strong> {formData.college_university || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Course:</strong> {formData.course || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Specialization:</strong> {formData.specialization || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Semester/Year:</strong> {formData.semester_year || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Graduation Year:</strong> {formData.graduation_year || "—"}
                    </p>
                    <p className="sm:col-span-2">
                      <strong className="text-slate-500">CGPA / Score:</strong> {formData.cgpa || "—"}
                    </p>
                  </div>
                </div>

                {/* 3. Skills */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <Briefcase className="h-4 w-4 text-blue-600" /> Skills & Experience
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(3)}
                      className="text-xs font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong className="text-slate-500">Technical Skills:</strong> {formData.technical_skills || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Other Skills:</strong> {formData.other_skills || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Projects:</strong> {formData.projects || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Experience:</strong> {formData.experience || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Certifications:</strong> {formData.certifications || "—"}
                    </p>
                  </div>
                </div>

                {/* 4. Documents */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <FileText className="h-4 w-4 text-blue-600" /> Documents & Links
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="text-xs font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <strong className="text-slate-500">Resume:</strong>{" "}
                      {resumeFile ? (
                        <span className="font-medium text-emerald-600">{resumeFile.name} (Ready to upload)</span>
                      ) : formData.resume_url ? (
                        <a
                          href={formData.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 underline"
                        >
                          View uploaded PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      <strong className="text-slate-500">GitHub:</strong>{" "}
                      {formData.github_url ? (
                        <a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {formData.github_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      <strong className="text-slate-500">LinkedIn:</strong>{" "}
                      {formData.linkedin_url ? (
                        <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {formData.linkedin_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      <strong className="text-slate-500">Portfolio:</strong>{" "}
                      {formData.portfolio_url ? (
                        <a href={formData.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {formData.portfolio_url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                </div>

                {/* 5. Preferences */}
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <Sparkles className="h-4 w-4 text-blue-600" /> Preferences & Motivation
                    </h3>
                    <button
                      type="button"
                      onClick={() => jumpToStep(5)}
                      className="text-xs font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong className="text-slate-500">Mode:</strong>{" "}
                      <span className="capitalize">{formData.preferred_mode || "—"}</span>
                    </p>
                    <p>
                      <strong className="text-slate-500">Availability:</strong> {formData.availability || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Expected Start:</strong> {formData.expected_start_date || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Why Join:</strong> {formData.why_join || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-500">Expectations:</strong> {formData.learning_expectations || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: PAYMENT */}
          {currentStep === 7 && (
            <div>
              {paymentSubmitted ? (
                /* Payment Success / Confirmation State */
                <div className="text-center py-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="mt-4 text-3xl font-bold text-slate-950">Payment Reference Submitted!</h2>
                  <p className="mt-2 text-base text-slate-600">
                    Your application fee has been registered and is awaiting manual verification by the admissions team.
                  </p>

                  <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left shadow-sm">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Application Number:</span>
                        <span className="font-bold text-slate-900">{formData.application_number}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Internship:</span>
                        <span className="font-medium text-slate-900">{selectedInternship?.title}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Payment Pending Verification
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Next Step:</span>
                        <span className="text-right text-xs text-slate-600">
                          Admin verifies payment → status updates to <strong>SUBMITTED</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      href="/portal"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Go to Candidate Portal
                    </Link>
                    <Link
                      href="/internships"
                      className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                    >
                      View More Internships
                    </Link>
                  </div>
                </div>
              ) : (
                /* Payment Submission Form */
                <div>
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Step 7 of 7</span>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">Application Fee Payment</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Complete the application verification fee of {currentFee} via official QR payment.
                    </p>
                  </div>

                  {/* Country Switcher */}
                  <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Region</p>
                      <p className="text-base font-bold text-slate-900">
                        {paymentCountry === "India" ? "India (₹99 via UPI QR)" : "Nepal (NPR 99 via eSewa QR)"}
                      </p>
                    </div>
                    <div className="flex rounded-full border border-slate-300 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setPaymentCountry("India")}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          paymentCountry === "India" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        India (₹99)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentCountry("Nepal")}
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          paymentCountry === "Nepal" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Nepal (NPR 99)
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
                    {/* QR Code Presentation */}
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {paymentCountry === "India" ? "UPI QR Code" : "eSewa QR Code"}
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{currentFee}</p>

                      <div className="relative mt-4 flex h-60 w-60 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
                        {currentQrUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentQrUrl}
                            alt={`${paymentCountry} Payment QR`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <QrCode className="h-16 w-16 text-slate-400" />
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Official QR code will display here. Contact admissions if unavailable.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-xs text-slate-500">
                        {paymentCountry === "India"
                          ? "Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI App"
                          : "Scan using eSewa or FonePay mobile wallet app"}
                      </div>
                    </div>

                    {/* Payment Reference Form */}
                    <form onSubmit={handlePaymentSubmit} className="space-y-5">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          <div>
                            <p className="font-semibold">Manual Verification Protocol</p>
                            <p className="mt-1 leading-relaxed text-blue-800">
                              {selectedInternship?.payment_instructions ||
                                "After scanning the QR code, enter your payment UTR / Transaction ID and the phone number used. Our team will verify your transfer and immediately activate your application."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Transaction ID / UTR / Reference <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder={paymentCountry === "India" ? "e.g. 12-digit UPI Ref / 428198274912" : "e.g. eSewa Txn Ref 9948271"}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono outline-none transition focus:border-slate-400 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Payment Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="tel"
                          value={paymentPhone}
                          onChange={(e) => setPaymentPhone(e.target.value)}
                          placeholder="Phone number associated with payment"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Payment Receipt or Screenshot <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                          Upload a screenshot or PDF receipt showing your successful transaction.
                        </p>

                        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4 text-center transition hover:border-slate-400">
                          {receiptPreview ? (
                            <div className="flex flex-col items-center gap-3">
                              {receiptFile?.type === "application/pdf" ? (
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                  <FileText className="h-6 w-6 text-blue-600" />
                                  <span>{receiptFile.name} (PDF Receipt)</span>
                                </div>
                              ) : (
                                <div className="relative h-44 w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={receiptPreview}
                                    alt="Payment Screenshot Preview"
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm">
                                  Change Image
                                  <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setReceiptFile(file);
                                        setReceiptPreview(URL.createObjectURL(file));
                                      }
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                  }}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 shadow-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-blue-600">
                                <Upload className="h-5 w-5" />
                              </div>
                              <span className="text-xs font-semibold text-slate-800">
                                Click or drag to upload payment receipt / screenshot
                              </span>
                              <span className="text-[11px] text-slate-400">
                                PNG, JPG, WEBP, or PDF (up to 10MB)
                              </span>
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setReceiptFile(file);
                                    setReceiptPreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Note:</span> Your application will remain in{" "}
                        <span className="font-semibold text-amber-700">Payment Pending Verification</span> status until our team approves the transfer.
                      </div>

                      <Button
                        type="submit"
                        disabled={submittingPayment}
                        className="w-full gap-2 py-3 text-sm"
                      >
                        {submittingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Verifying submission...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Submit Payment for Verification
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stepper Footer Controls */}
          {!paymentSubmitted && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
              {currentStep > 1 ? (
                <Button variant="secondary" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 7 ? (
                <Button onClick={nextStep} className="gap-2">
                  {currentStep === 6 ? "Proceed to Payment" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          </div>
        }
      >
        <ApplyFormContent />
      </Suspense>
    </ProtectedRoute>
  );
}
