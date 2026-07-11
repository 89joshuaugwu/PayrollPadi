"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Employee, computeGross, isSalaryStructureComplete } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import { formatPeriod, currentPeriod } from "@/lib/utils";
import { authedFetch } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import PayrollRunProgress from "@/components/molecules/PayrollRunProgress";

export default function PayrollRunWizard({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState(currentPeriod());
  const [running, setRunning] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const blocked = activeEmployees.filter((e) => !isSalaryStructureComplete(e.salaryStructure));
  const totalCost = activeEmployees.reduce((sum, e) => sum + computeGross(e.salaryStructure), 0);

  async function handleConfirm() {
    if (blocked.length > 0) {
      toast.error("Fix incomplete salary structures before running payroll.");
      return;
    }
    setSubmitting(true);
    setRunning(true);
    try {
      const res = await authedFetch("/api/payroll/run", {
        method: "POST",
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to run payroll.");
        setRunning(false);
        setSubmitting(false);
        return;
      }
      setRunId(data.runId);
    } catch {
      toast.error("Network error running payroll.");
      setRunning(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h2 className="font-bold text-lg text-text-primary">Step 1 — Select Period</h2>
          <DatePicker label="Payroll Period" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h2 className="font-bold text-lg text-text-primary">Step 2 — Review Active Employees</h2>
          <p className="text-sm text-text-secondary">
            {activeEmployees.length} active employee(s) for {formatPeriod(period)}. Total estimated gross:{" "}
            <span className="font-semibold tabular-nums">{formatNaira(totalCost)}</span>
          </p>
          {blocked.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">
                  {blocked.length} employee(s) have an incomplete salary structure and are blocking this run:
                </p>
                <ul className="text-sm text-text-secondary list-disc list-inside mt-1">
                  {blocked.map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={blocked.length > 0}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && !running && (
        <div className="flex flex-col gap-5">
          <h2 className="font-bold text-lg text-text-primary">Step 3 — Confirm</h2>
          <p className="text-sm text-text-secondary">
            Run payroll for <span className="font-semibold text-text-primary">{formatPeriod(period)}</span> (
            {activeEmployees.length} employees)?
          </p>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={handleConfirm} loading={submitting}>
              Run Payroll
            </Button>
          </div>
        </div>
      )}

      {running && (
        <div className="flex flex-col gap-5">
          <h2 className="font-bold text-lg text-text-primary">Processing Payroll Run</h2>
          <PayrollRunProgress total={activeEmployees.length} active={!!runId} onComplete={() => setProgressDone(true)} />
          {progressDone && runId && (
            <div className="flex justify-end">
              <Button onClick={() => router.push(`/dashboard/payroll/${runId}`)}>
                View Results <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
