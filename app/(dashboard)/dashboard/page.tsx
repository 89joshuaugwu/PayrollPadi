"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Wallet, Plus, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToEmployees } from "@/lib/data/employees";
import { subscribeToPayrollRuns } from "@/lib/data/payroll";
import { getMyPayslips } from "@/lib/data/payroll";
import { Employee } from "@/types/employee";
import { PayrollRun } from "@/types/payrollRun";
import { Payslip } from "@/types/payslip";
import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";

export default function DashboardHome() {
  const { profile } = useAuth();

  if (!profile) return <Spinner />;
  return profile.role === "admin" ? <AdminHome /> : <EmployeeHome employeeId={profile.employeeId} />;
}

function AdminHome() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    const unsub1 = subscribeToEmployees(setEmployees);
    const unsub2 = subscribeToPayrollRuns(setRuns);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const activeCount = employees.filter((e) => e.status === "active").length;
  const lastRun = runs[0];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Active Employees</p>
          <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Last Payroll Run</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-bold text-text-primary">{lastRun ? formatPeriod(lastRun.period) : "—"}</p>
            {lastRun && <StatusBadge status={lastRun.status} />}
          </div>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Payroll Cost (Last Run)</p>
          <p className="text-2xl font-bold text-text-primary tabular-nums mt-1">
            {lastRun ? formatNaira(lastRun.totalCost) : "—"}
          </p>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard/payroll/new">
          <Button>
            <Plus className="w-4 h-4" /> New Payroll Run
          </Button>
        </Link>
        <Link href="/dashboard/employees/new">
          <Button variant="secondary">
            <UserPlus className="w-4 h-4" /> Add Employee
          </Button>
        </Link>
      </div>

      <Card>
        <h2 className="font-semibold text-text-primary mb-3">Recent Payroll Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-text-secondary">No payroll has been run yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {runs.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/payroll/${r.id}`}
                className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0 hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-text-secondary" /> {formatPeriod(r.period)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-text-secondary">{formatNaira(r.totalCost)}</span>
                  <StatusBadge status={r.status} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function EmployeeHome({ employeeId }: { employeeId: string | null }) {
  const [payslips, setPayslips] = useState<Payslip[] | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    getMyPayslips(employeeId).then((p) => setPayslips(p.sort((a, b) => b.period.localeCompare(a.period))));
  }, [employeeId]);

  if (payslips === null) return <Spinner />;

  const latest = payslips[0];
  const ytdGross = payslips
    .filter((p) => p.period.startsWith(String(new Date().getFullYear())))
    .reduce((sum, p) => sum + p.grossPay, 0);
  const ytdTax = payslips
    .filter((p) => p.period.startsWith(String(new Date().getFullYear())))
    .reduce((sum, p) => sum + p.deductions.payeTax, 0);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>

      {latest ? (
        <Card>
          <p className="text-sm text-text-secondary mb-1">Latest Payslip — {formatPeriod(latest.period)}</p>
          <p className="text-3xl font-bold text-text-primary tabular-nums mb-3">{formatNaira(latest.netPay)}</p>
          <Link href={`/dashboard/my-payslips/${latest.runId}_${latest.employeeId}`}>
            <Button variant="secondary">View full payslip</Button>
          </Link>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-text-secondary flex items-center gap-2">
            <Users className="w-4 h-4" /> Your payslips will appear here once payroll is run.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">YTD Gross Earned</p>
          <p className="text-xl font-bold text-text-primary tabular-nums mt-1">{formatNaira(ytdGross)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">YTD Tax Paid</p>
          <p className="text-xl font-bold text-text-primary tabular-nums mt-1">{formatNaira(ytdTax)}</p>
        </Card>
      </div>
    </div>
  );
}
