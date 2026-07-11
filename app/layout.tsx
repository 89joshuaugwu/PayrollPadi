import type { Metadata } from "next";
import Toast from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayrollPadi — NTA 2025 Compliant Payroll",
  description: "Automated salary computation with Nigeria Tax Act 2025 compliant PAYE, statutory deductions, and payslip delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toast />
      </body>
    </html>
  );
}
