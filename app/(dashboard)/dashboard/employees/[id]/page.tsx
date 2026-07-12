"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { authedFetch } from "@/lib/apiClient";
import { subscribeToEmployee } from "@/lib/data/employees";
import { Employee, SalaryStructure } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Spinner from "@/components/ui/Spinner";
import SalaryStructureForm from "@/components/molecules/SalaryStructureForm";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null | undefined>(undefined);
  const [salaryDraft, setSalaryDraft] = useState<SalaryStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEmployee(id, (e) => {
      setEmployee(e);
      if (e) setSalaryDraft(e.salaryStructure);
    });
    return unsub;
  }, [id]);

  async function handleSaveSalary() {
    if (!employee || !salaryDraft) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "employees", employee.id), { salaryStructure: salaryDraft });
      toast.success("Salary structure updated.");
    } catch {
      toast.error("Failed to update salary structure.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!employee) return;
    try {
      await updateDoc(doc(db, "employees", employee.id), {
        status: employee.status === "active" ? "inactive" : "active",
      });
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleApproveBankChange() {
    if (!employee?.bankAccountPending) return;
    setApproving(true);
    try {
      await updateDoc(doc(db, "employees", employee.id), {
        bankAccount: employee.bankAccountPending,
        bankAccountPending: null,
      });
      toast.success("Bank change approved.");
    } catch {
      toast.error("Failed to approve bank change.");
    } finally {
      setApproving(false);
    }
  }

  async function handleSyncClaims() {
    if (!employee) return;
    setSyncing(true);
    try {
      const res = await authedFetch("/api/employees/sync-claims", {
        method: "POST",
        body: JSON.stringify({ employeeId: employee.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to sync login permissions.");
        return;
      }
      toast.success("Login permissions synced. Ask the employee to log out and back in.");
    } catch {
      toast.error("Network error syncing login permissions.");
    } finally {
      setSyncing(false);
    }
  }

  if (employee === undefined) return <Spinner />;
  if (employee === null) {
    return (
      <div className="text-center py-10">
        <p className="text-text-secondary">Employee not found.</p>
        <Button variant="ghost" onClick={() => router.push("/dashboard/employees")} className="mt-3">
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{employee.name}</h1>
          <p className="text-sm text-text-secondary">
            {employee.department} · {employee.employeeIdNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={employee.status} />
          <Button variant="secondary" onClick={handleToggleStatus}>
            {employee.status === "active" ? "Mark Inactive" : "Mark Active"}
          </Button>
          <Button variant="ghost" onClick={handleSyncClaims} loading={syncing}>
            Sync Login Permissions
          </Button>
        </div>
      </div>

      {employee.bankAccountPending && (
        <Card className="border-warning bg-amber-50">
          <p className="text-sm font-medium text-warning mb-2">Bank Change Pending Approval</p>
          <p className="text-sm text-text-primary">
            {employee.bankAccountPending.bankName} · {employee.bankAccountPending.accountNumber}
          </p>
          <Button variant="secondary" onClick={handleApproveBankChange} loading={approving} className="mt-3">
            Approve Bank Change
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-text-primary mb-3">Bio &amp; Tax IDs</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Email" value={employee.email} />
          <Field label="Bank" value={`${employee.bankAccount.bankName} · ${employee.bankAccount.accountNumber}`} />
          <Field label="TIN" value={employee.TIN} mono />
          <Field label="Pension RSA" value={employee.pensionRSA} mono />
        </dl>
      </Card>

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Salary Structure</h2>
        {salaryDraft && <SalaryStructureForm value={salaryDraft} onChange={setSalaryDraft} />}
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveSalary} loading={saving}>
            Save Salary Structure
          </Button>
        </div>
      </Card>

      {employee.voluntaryDeductions.length > 0 && (
        <Card>
          <h2 className="font-semibold text-text-primary mb-3">Voluntary Deductions</h2>
          <div className="flex flex-col gap-2 text-sm">
            {employee.voluntaryDeductions.map((d, i) => (
              <div key={i} className="flex justify-between border-b border-border last:border-0 py-1.5">
                <span className="text-text-secondary">{d.label}</span>
                <span className="tabular-nums text-text-primary">{formatNaira(d.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-text-secondary text-xs">{label}</dt>
      <dd className={`text-text-primary ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
