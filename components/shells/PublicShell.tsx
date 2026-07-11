import { ReactNode } from "react";
import LogoIcon from "@/components/ui/LogoIcon";

export default function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <LogoIcon className="w-8 h-8" />
          <span className="font-bold text-text-primary text-lg">PayrollPadi</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">{children}</main>
      <footer className="text-center text-xs text-text-secondary py-6">
        © {new Date().getFullYear()} PayrollPadi. Built for ESUT final-year defense.
      </footer>
    </div>
  );
}
