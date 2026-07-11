"use client";

import { useRouter } from "next/navigation";
import { Payslip } from "@/types/payslip";
import { formatPeriod } from "@/lib/utils";
import { formatNaira } from "@/lib/tax-engine";
import Card from "@/components/ui/Card";
import { ChevronRight } from "lucide-react";

export default function MyPayslipsList({ payslips }: { payslips: Payslip[] }) {
  const router = useRouter();
  const sorted = [...payslips].sort((a, b) => b.period.localeCompare(a.period));

  if (sorted.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-text-secondary text-sm">Your payslips will appear here once payroll is run.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/dashboard/my-payslips/${p.runId}_${p.employeeId}`)}
          className="w-full text-left"
        >
          <Card className="flex items-center justify-between hover:bg-indigo-50/40 transition-colors">
            <div>
              <p className="font-medium text-text-primary">{formatPeriod(p.period)}</p>
              <p className="text-xs text-text-secondary">Net Pay</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold tabular-nums text-text-primary">{formatNaira(p.netPay)}</span>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
