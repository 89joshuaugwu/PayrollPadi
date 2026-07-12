"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calculator,
  ShieldCheck,
  FileText,
  Users,
  History,
  Mail,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import LogoIcon from "@/components/ui/LogoIcon";
import Button from "@/components/ui/Button";

const features = [
  {
    icon: Calculator,
    title: "NTA 2025 PAYE Engine",
    description: "Progressive tax bands, pension, NHF, and rent relief computed automatically — every time, the same way.",
  },
  {
    icon: History,
    title: "Versioned Tax Settings",
    description: "Change tax rates without ever touching old payslips. Every run locks in the rates that were live at the time.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Admins run payroll and manage staff. Employees see only their own payslips — nothing more, nothing less.",
  },
  {
    icon: Mail,
    title: "Automated Delivery",
    description: "Lock a payroll run and every employee gets a professional PDF payslip in their inbox, instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Approval-Gated Bank Changes",
    description: "Employees request bank detail updates. Nothing takes effect until an admin approves it.",
  },
  {
    icon: FileText,
    title: "Reports That Matter",
    description: "Payroll cost trends, department breakdowns, and tax remitted — exportable in one click.",
  },
];

const steps = [
  { number: "01", title: "Add your staff", description: "Salary structure, bank details, and tax IDs — set up once." },
  { number: "02", title: "Run payroll", description: "One click computes PAYE, pension, and NHF for every active employee." },
  { number: "03", title: "Lock & deliver", description: "PDF payslips generate and email themselves. Done." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-x-hidden">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
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

      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center flex flex-col items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-xs font-medium text-primary-dark"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nigeria Tax Act 2025 Compliant
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-text-primary leading-tight"
            >
              Payroll that keeps up with{" "}
              <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Nigeria&apos;s tax law
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-text-secondary text-lg max-w-2xl"
            >
              NTA 2025 compliant PAYE, pension, and NHF computation — with configurable tax bands, versioned tax
              settings, batch payroll runs, and automated payslip delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mt-2"
            >
              <Link href="/auth/login">
                <Button className="text-base px-6 h-12 w-full sm:w-auto">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Mock payslip preview card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 w-full max-w-md bg-white border border-border rounded-2xl shadow-lg p-6 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Sample Payslip</span>
                <span className="text-xs text-text-secondary">August 2026</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">Gross Pay</span>
                <span className="tabular-nums text-text-primary font-medium">₦360,000.00</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-text-secondary">Total Deductions</span>
                <span className="tabular-nums text-text-primary font-medium">₦65,548.00</span>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-5 py-4 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">NET PAY</span>
                <span className="text-white text-xl font-bold tabular-nums">₦294,452.00</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats row */}
        <section className="border-y border-border bg-white">
          <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">6</p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">NTA 2025 tax bands</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">₦0</p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">Infra cost to run</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-primary">100%</p>
              <p className="text-xs md:text-sm text-text-secondary mt-1">Automated delivery</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Everything payroll needs, built in</h2>
            <p className="text-text-secondary mt-3 max-w-xl mx-auto">
              From tax computation to payslip delivery, one dashboard handles it — for HR/Finance and for staff.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  className="bg-white border border-border rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
                  <p className="text-sm text-text-secondary">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white border-y border-border">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">From setup to payslip in three steps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((s, i) => (
                <motion.div
                  key={s.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-lg">
                    {s.number}
                  </div>
                  <h3 className="font-semibold text-text-primary">{s.title}</h3>
                  <p className="text-sm text-text-secondary max-w-xs">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-8 py-14 flex flex-col items-center gap-5"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to run payroll properly?</h2>
            <p className="text-indigo-100 max-w-lg">
              Log in to compute, lock, and deliver payslips for your whole team — the right way, every time.
            </p>
            <Link href="/auth/login">
              <Button variant="secondary" className="bg-white text-primary hover:bg-indigo-50 border-none px-6 h-12 text-base">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="text-center text-xs text-text-secondary py-6 border-t border-border bg-white">
        © {new Date().getFullYear()} PayrollPadi. Built for ESUT final-year defense.
      </footer>
    </div>
  );
}
