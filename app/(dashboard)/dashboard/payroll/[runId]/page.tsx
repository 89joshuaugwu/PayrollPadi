"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { subscribeToPayrollRun, subscribeToPayslips } from "@/lib/data/payroll";
import { PayrollRun } from "@/types/payrollRun";
import { Payslip } from "@/types/payslip";
import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod } from "@/lib/utils";
import { authedFetch } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import DataTable, { Column } from "@/components/ui/DataTable";

export default function PayrollRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [run, setRun] = useState<PayrollRun | null | undefined>(undefined);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToPayrollRun(runId, setRun);
    const unsub2 = subscribeToPayslips(runId, setPayslips);
    return () => {
      unsub1();
      unsub2();
    };
  }, [runId]);

  async function handleLock() {
    if (!confirm("Lock this payroll run? This will generate PDFs and email every employee — this cannot be undone.")) return;
    setLocking(true);
    try {
      const res = await authedFetch("/api/payroll/lock", {
        method: "POST",
        body: JSON.stringify({ runId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to lock payroll run.");
        return;
      }
      toast.success("Payroll run locked and payslips sent.");
    } catch {
      toast.error("Network error locking payroll run.");
    } finally {
      setLocking(false);
    }
  }

  if (run === undefined) return <Spinner />;
  if (run === null) return <p className="text-text-secondary">Payroll run not found.</p>;

  const totalDeductions = (p: Payslip) =>
    p.deductions.pension + p.deductions.nhf + p.deductions.nhis + p.deductions.payeTax + p.deductions.voluntary;

  const columns: Column<Payslip>[] = [
    { key: "employee", header: "Employee", render: (p) => p.employeeName, sortValue: (p) => p.employeeName },
    { key: "gross", header: "Gross", numeric: true, render: (p) => formatNaira(p.grossPay), sortValue: (p) => p.grossPay },
    {
      key: "deductions",
      header: "Deductions",
      numeric: true,
      render: (p) => formatNaira(totalDeductions(p)),
      sortValue: totalDeductions,
    },
    { key: "net", header: "Net Pay", numeric: true, render: (p) => formatNaira(p.netPay), sortValue: (p) => p.netPay },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{formatPeriod(run.period)}</h1>
          <div className="mt-1">
            <StatusBadge status={run.status} />
          </div>
        </div>
        {run.status === "draft" && (
          <Button onClick={handleLock} loading={locking}>
            <Lock className="w-4 h-4" /> Lock Payroll Run
          </Button>
        )}
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={payslips}
          rowKey={(p) => p.employeeId}
          onRowClick={(p) => router.push(`/dashboard/my-payslips/${p.runId}_${p.employeeId}`)}
          emptyMessage="No payslips computed yet."
        />
      </Card>
    </div>
  );
}
