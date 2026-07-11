"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Download } from "lucide-react";
import { PayrollRun } from "@/types/payrollRun";
import { Employee } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  runs: PayrollRun[];
  employees: Employee[];
}

export default function ReportsDashboard({ runs, employees }: Props) {
  const [exporting, setExporting] = useState(false);

  const lockedRuns = useMemo(() => runs.filter((r) => r.status === "locked").sort((a, b) => a.period.localeCompare(b.period)), [runs]);

  const totalPayrollCost = lockedRuns.reduce((sum, r) => sum + r.totalCost, 0);
  const totalTaxRemitted = 0; // requires per-payslip PAYE aggregation — see note below
  const avgNetPay =
    lockedRuns.length > 0 ? lockedRuns.reduce((sum, r) => sum + r.totalCost, 0) / lockedRuns.reduce((s, r) => s + r.employeeCount, 0) : 0;

  const trendData = lockedRuns.map((r) => ({ period: formatPeriod(r.period), cost: r.totalCost }));

  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees) {
      const gross = e.salaryStructure.basic + e.salaryStructure.housing + e.salaryStructure.transport + e.salaryStructure.otherAllowances;
      map.set(e.department, (map.get(e.department) ?? 0) + gross);
    }
    return Array.from(map.entries()).map(([department, cost]) => ({ department, cost }));
  }, [employees]);

  function handleExportCsv() {
    setExporting(true);
    const rows = [
      ["Period", "Status", "Employee Count", "Total Cost"],
      ...runs.map((r) => [r.period, r.status, String(r.employeeCount), String(r.totalCost)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payrollpadi-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Total Payroll Cost (Locked Runs)</p>
          <p className="text-2xl font-bold tabular-nums text-text-primary mt-1">{formatNaira(totalPayrollCost)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Total Tax Remitted</p>
          <p className="text-2xl font-bold tabular-nums text-text-primary mt-1">{formatNaira(totalTaxRemitted)}</p>
          <p className="text-xs text-text-secondary mt-1">
            Aggregate PAYE per payslip — wire up a collectionGroup query over payslips for a precise figure.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Average Net Pay</p>
          <p className="text-2xl font-bold tabular-nums text-text-primary mt-1">
            {Number.isFinite(avgNetPay) ? formatNaira(avgNetPay) : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-text-primary mb-4">Payroll Cost Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="period" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatNaira(v)} />
            <Line type="monotone" dataKey="cost" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-primary mb-4">Department Cost Breakdown</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="department" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatNaira(v)} />
            <Bar dataKey="cost" fill="#D4A017" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportCsv} loading={exporting}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>
    </div>
  );
}
