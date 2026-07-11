"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToPayrollRuns } from "@/lib/data/payroll";
import { PayrollRun } from "@/types/payrollRun";
import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod } from "@/lib/utils";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function PayrollRunsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [runs, setRuns] = useState<PayrollRun[] | null>(null);

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      toast.error("Admins only.");
      router.replace("/dashboard");
      return;
    }
    const unsub = subscribeToPayrollRuns(setRuns);
    return unsub;
  }, [profile, router]);

  if (!profile || profile.role !== "admin" || runs === null) return <Spinner />;

  const columns: Column<PayrollRun>[] = [
    { key: "period", header: "Period", render: (r) => formatPeriod(r.period), sortValue: (r) => r.period },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "count", header: "Employees", numeric: true, render: (r) => r.employeeCount, sortValue: (r) => r.employeeCount },
    { key: "cost", header: "Total Cost", numeric: true, render: (r) => formatNaira(r.totalCost), sortValue: (r) => r.totalCost },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Payroll Runs</h1>
        <Link href="/dashboard/payroll/new">
          <Button>
            <Plus className="w-4 h-4" /> New Payroll Run
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        rows={runs}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/dashboard/payroll/${r.id}`)}
        emptyMessage="No payroll has been run yet."
      />
    </div>
  );
}
