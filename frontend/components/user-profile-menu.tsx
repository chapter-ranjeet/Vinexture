"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Code2,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Key,
  Laptop,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

import { clearAuthTokens, getAuthTokens } from "@/lib/auth";
import { fetchJson, postJson, uploadFormData } from "@/lib/api";

export type CandidateProfileData = {
  id?: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  phone?: string;
  qualification?: string;
  college_university?: string;
  course?: string;
  specialization?: string;
  age?: number | string | null;
  gender?: string;
  nationality?: string;
  technical_skills?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  preferred_mode?: string;
  availability?: string;
  headline?: string;
  bio?: string;
};

export function UserProfileMenu() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    qualification: "",
    college_university: "",
    course: "",
    specialization: "",
    age: "",
    gender: "",
    nationality: "",
    technical_skills: "",
    portfolio_url: "",
    github_url: "",
    linkedin_url: "",
    preferred_mode: "remote",
    availability: "Immediate",
    headline: "",
    bio: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = async () => {
    const tokens = getAuthTokens();
    if (!tokens?.access) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchJson<CandidateProfileData>("/candidates/me/");
      setProfile(data);
      setFormData({
        name: data.name || (data.first_name ? `${data.first_name} ${data.last_name || ""}`.trim() : ""),
        phone: data.phone || "",
        qualification: data.qualification || "",
        college_university: data.college_university || "",
        course: data.course || "",
        specialization: data.specialization || "",
        age: data.age !== null && data.age !== undefined ? String(data.age) : "",
        gender: data.gender || "",
        nationality: data.nationality || "",
        technical_skills: data.technical_skills || "",
        portfolio_url: data.portfolio_url || "",
        github_url: data.github_url || "",
        linkedin_url: data.linkedin_url || "",
        preferred_mode: data.preferred_mode || "remote",
        availability: data.availability || "Immediate",
        headline: data.headline || "",
        bio: data.bio || "",
      });
      if (data.avatar_url) {
        setPreviewUrl(data.avatar_url);
      }
    } catch {
      // Fallback silently if not available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    const handleProfileChange = () => {
      loadProfile();
    };

    const handleAuthChange = () => {
      loadProfile();
    };

    window.addEventListener("vinexture_profile_changed", handleProfileChange);
    window.addEventListener("vinexture_auth_changed", handleAuthChange);

    return () => {
      window.removeEventListener("vinexture_profile_changed", handleProfileChange);
      window.removeEventListener("vinexture_auth_changed", handleAuthChange);
    };
  }, []);

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Submit profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const form = new FormData();
      if (selectedFile) {
        form.append("avatar", selectedFile);
      }
      form.append("name", formData.name.trim());
      form.append("phone", formData.phone.trim());
      form.append("qualification", formData.qualification.trim());
      form.append("college_university", formData.college_university.trim());
      form.append("course", formData.course.trim());
      form.append("specialization", formData.specialization.trim());
      if (formData.age.trim()) {
        form.append("age", formData.age.trim());
      }
      form.append("gender", formData.gender.trim());
      form.append("nationality", formData.nationality.trim());
      form.append("technical_skills", formData.technical_skills.trim());
      form.append("portfolio_url", formData.portfolio_url.trim());
      form.append("github_url", formData.github_url.trim());
      form.append("linkedin_url", formData.linkedin_url.trim());
      form.append("preferred_mode", formData.preferred_mode.trim());
      form.append("availability", formData.availability.trim());
      form.append("headline", formData.headline.trim());
      form.append("bio", formData.bio.trim());

      const updated = await uploadFormData<CandidateProfileData>("/candidates/me/", form, "PATCH");
      setProfile(updated);
      if (updated.avatar_url) {
        setPreviewUrl(updated.avatar_url);
      }
      setProfileSuccess("Profile updated successfully!");
      setSelectedFile(null);
      window.dispatchEvent(new Event("vinexture_profile_changed"));

      setTimeout(() => {
        setProfileSuccess("");
      }, 4000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword || !newPassword) {
      setPasswordError("Please enter your current and new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await postJson("/auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setPasswordSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPasswordSuccess("");
      }, 4000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    setProfile(null);
    setMenuOpen(false);
    setModalOpen(false);
    router.push("/login");
  };

  const openProfileModal = (tab: "profile" | "password" = "profile") => {
    setActiveTab(tab);
    setProfileError("");
    setProfileSuccess("");
    setPasswordError("");
    setPasswordSuccess("");
    setMenuOpen(false);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />;
  }

  // Candidate Name & Initials
  const displayName = profile?.name || profile?.first_name || profile?.username || "Candidate";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentAvatarUrl = previewUrl || profile?.avatar_url;

  return (
    <>
      {/* Top Right Avatar Button */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="group flex items-center gap-2 rounded-full border border-slate-200/80 bg-white p-1 pr-2.5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-expanded={menuOpen}
          aria-label="User Account Menu"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-inner sm:h-10 sm:w-10">
            {currentAvatarUrl ? (
              <Image
                src={currentAvatarUrl}
                alt={displayName}
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="text-xs sm:text-sm tracking-tight">{initials || "U"}</span>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="hidden max-w-[110px] text-left md:block">
            <p className="truncate text-xs font-semibold text-slate-800 leading-tight">{displayName}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium capitalize">
              {profile?.qualification ? profile.qualification.split(" ")[0] : "Candidate"}
            </p>
          </div>

          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-xl transition-all z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header / User Card */}
            <div className="flex items-center gap-3 border-b border-slate-100 p-3 pb-3.5">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-sm">
                {currentAvatarUrl ? (
                  <Image
                    src={currentAvatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-base">{initials || "U"}</span>
                )}
                <button
                  type="button"
                  onClick={() => openProfileModal("profile")}
                  title="Update profile picture"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{profile?.email || "candidate@vinexture.com"}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    <Sparkles className="mr-1 h-2.5 w-2.5" /> Candidate
                  </span>
                  {profile?.nationality && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      • {profile.nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="py-1.5 text-xs font-medium text-slate-700">
              <Link
                href="/portal"
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new CustomEvent("vinexture_open_section", { detail: "none" }));
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
              >
                <Sparkles className="h-4 w-4 text-slate-400" />
                <span>Portal Overview</span>
              </Link>

              <Link
                href="/portal?tab=projects"
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new CustomEvent("vinexture_open_section", { detail: "projects" }));
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
              >
                <Briefcase className="h-4 w-4 text-slate-400" />
                <span>Internship Workspace</span>
              </Link>

              <Link
                href="/portal?tab=applications"
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new CustomEvent("vinexture_open_section", { detail: "applications" }));
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Internship Applications</span>
              </Link>

              <button
                type="button"
                onClick={() => openProfileModal("profile")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 text-left"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Edit Profile & Photo</span>
              </button>

              <button
                type="button"
                onClick={() => openProfileModal("password")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-blue-600 text-left"
              >
                <Key className="h-4 w-4 text-slate-400" />
                <span>Change Password</span>
              </button>
            </div>

            {/* Footer / Sign Out */}
            <div className="border-t border-slate-100 pt-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 text-left"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile & Security Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Account Management
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  Candidate Settings & Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition ${
                  activeTab === "profile"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <User className="h-4 w-4" />
                Profile Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition ${
                  activeTab === "password"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Lock className="h-4 w-4" />
                Change Password
              </button>
            </div>

            {/* TAB 1: Profile Details & Picture */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
                {profileSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {/* Profile Picture Upload Section */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-bold text-white shadow-md">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          width={96}
                          height={96}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold">{initials || "U"}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition"
                        >
                          <Upload className="h-3.5 w-3.5 text-blue-600" />
                          Upload New Photo
                        </button>

                        {selectedFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setPreviewUrl(profile?.avatar_url || null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Supports JPG, PNG, or WEBP (up to 5MB). Photo displays in the top right corner.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-100/80 py-2.5 pl-10 pr-3.5 text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Highest Qualification
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="e.g. B.Tech Computer Science, BCA, MCA"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      College / University
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.college_university}
                        onChange={(e) =>
                          setFormData({ ...formData, college_university: e.target.value })
                        }
                        placeholder="e.g. Delhi Technological University, Tribhuvan University"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        min="15"
                        max="80"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g. 21"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Non-Binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nationality
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        placeholder="e.g. Indian, Nepalese, American, etc."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Background */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" /> Academic & Degree Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Degree / Course
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        placeholder="e.g. B.Tech, BCA, MCA, BSCS"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Specialization / Stream
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g. Computer Science, AI, Web Dev"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills & Links */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-blue-600" /> Skills & Online Profiles
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Technical Skills
                      </label>
                      <input
                        type="text"
                        value={formData.technical_skills}
                        onChange={(e) => setFormData({ ...formData, technical_skills: e.target.value })}
                        placeholder="e.g. React, Next.js, Python, Django, Tailwind CSS, TypeScript"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        GitHub Profile URL
                      </label>
                      <div className="relative">
                        <FolderGit2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                          placeholder="https://github.com/username"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        LinkedIn Profile URL
                      </label>
                      <div className="relative">
                        <Link2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Portfolio / Website URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                          placeholder="https://yourportfolio.dev"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internship Preferences */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Laptop className="h-4 w-4 text-blue-600" /> Internship Preferences
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Preferred Mode
                      </label>
                      <select
                        value={formData.preferred_mode}
                        onChange={(e) => setFormData({ ...formData, preferred_mode: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 capitalize"
                      >
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Availability
                      </label>
                      <input
                        type="text"
                        value={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        placeholder="e.g. Immediate, 2 Weeks"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Save Profile Details
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Change Password */}
            {activeTab === "password" && (
              <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Security Recommendations
                  </div>
                  Choose a strong password with at least 8 characters, combining uppercase and
                  lowercase letters, numbers, and symbols.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* Save Password Button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating Password...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
