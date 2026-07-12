"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings2,
  BarChart3,
  Settings,
  FileText,
  UserCircle,
  LogOut,
} from "lucide-react";
import LogoIcon from "@/components/ui/LogoIcon";
import NotificationBell from "@/components/molecules/NotificationBell";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/lib/AuthContext";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/payroll", label: "Payroll", icon: Wallet },
  { href: "/dashboard/tax-settings", label: "Tax Settings", icon: Settings2 },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const employeeNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-payslips", label: "My Payslips", icon: FileText },
  { href: "/dashboard/my-profile", label: "My Profile", icon: UserCircle },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading || !profile || !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  const nav = profile.role === "admin" ? adminNav : employeeNav;

  // The Dashboard link ("/dashboard") would otherwise startsWith-match every
  // sub-route too (e.g. "/dashboard/employees"), staying lit up everywhere.
  // Only that one link needs an exact match; the rest are fine with prefix.
  function isActive(href: string): boolean {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-white shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <LogoIcon className="w-8 h-8" />
          <span className="font-bold text-text-primary">PayrollPadi</span>
        </Link>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-primary text-white" : "text-text-secondary hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 border-t border-border text-sm text-text-secondary hover:text-error"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <LogoIcon className="w-7 h-7" />
            <span className="font-bold text-text-primary text-sm">PayrollPadi</span>
          </Link>
          <div className="hidden md:block text-sm text-text-secondary">
            {profile.role === "admin" ? "Admin" : "Employee"} · {profile.displayName}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell uid={firebaseUser.uid} />
            <div className="hidden md:flex w-8 h-8 rounded-full bg-primary text-white items-center justify-center text-xs font-bold">
              {profile.displayName?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-center justify-around h-16 z-40">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] flex-1 h-full",
                active ? "text-primary" : "text-text-secondary"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
