import Link from "next/link";
import LogoIcon from "@/components/ui/LogoIcon";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8" />
            <span className="font-bold text-text-primary text-lg">PayrollPadi</span>
          </div>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <LogoIcon className="w-20 h-20" />
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary">
            Payroll that keeps up with Nigeria&apos;s tax law
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            NTA 2025 compliant PAYE, pension, and NHF computation — with configurable tax bands, versioned tax
            settings, batch payroll runs, and automated payslip delivery.
          </p>
          <Link href="/auth/login">
            <Button className="text-base px-6 h-12">Go to Dashboard</Button>
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-text-secondary py-6 border-t border-border bg-white">
        © {new Date().getFullYear()} PayrollPadi. Built for ESUT final-year defense.
      </footer>
    </div>
  );
}
