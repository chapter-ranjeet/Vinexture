"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, Bell, BriefcaseBusiness, ClipboardList, CreditCard, FileBadge, FolderGit2, LayoutDashboard, LogOut, Menu, Newspaper, PanelLeftClose, PanelLeftOpen, Settings, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { clearAuthTokens } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cms", label: "CMS & Content", icon: Newspaper },
  { href: "/admin/candidates", label: "Candidates", icon: Users },

  { href: "/admin/internships", label: "Internships", icon: BriefcaseBusiness },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/projects", label: "Assigned Projects", icon: FolderGit2 },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/offers", label: "Offer Letters", icon: FileBadge },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/interviews", label: "Interviews", icon: ClipboardList },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50">
        <div className="flex min-h-[calc(100vh-5rem)]">
          {mobileOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" onClick={() => setMobileOpen(false)} /> : null}
          <aside className={`fixed inset-y-0 left-0 z-50 mt-20 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform md:static md:mt-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${collapsed ? "md:w-20" : "md:w-64"}`}>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              {!collapsed ? (
                <div className="flex items-center gap-2.5">
                  <Image src="/logo.png" alt="VINEXTURE" width={36} height={36} className="h-8 w-8 object-contain" />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-900 leading-tight">
                      VINE<span className="text-red-600">X</span>TURE
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                      Admin Workspace
                    </span>
                  </div>
                </div>
              ) : (
                <Image src="/logo.png" alt="VINEXTURE" width={32} height={32} className="mx-auto h-7 w-7 object-contain" />
              )}
              <button type="button" aria-label="Close navigation" className="md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" || pathname === "/dashboard" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? label : null}
                  </Link>
                );
              })}
              {!collapsed ? <div className="mt-6 border-t border-slate-200 pt-5"><p className="px-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">Coming next</p><p className="px-3 pt-3 text-xs leading-5 text-slate-500">Candidates, internships, applications, payments, interviews, reports, staff and settings will appear here as each module is completed.</p></div> : null}
            </nav>
            <div className="border-t border-slate-200 p-3">
              <button type="button" onClick={() => { clearAuthTokens(); router.push("/login"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <LogOut className="h-4 w-4" />{!collapsed ? "Sign out" : null}
              </button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="sticky top-20 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Open navigation" className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
                <button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className="hidden rounded-lg p-2 hover:bg-slate-100 md:block" onClick={() => setCollapsed((value) => !value)}>
                  {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2.5">
                  <Image src="/logo.png" alt="VINEXTURE" width={32} height={32} className="h-8 w-8 object-contain" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      VINE<span className="text-red-600">X</span>TURE Admin
                    </p>
                    <p className="hidden text-xs text-slate-500 sm:block">Operations workspace</p>
                  </div>
                </div>
              </div>
              <Link href="/dashboard/cms" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><Settings className="h-3.5 w-3.5" /> Content</Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
