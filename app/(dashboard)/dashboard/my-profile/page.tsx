"use client";

import { useEffect, useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToEmployee } from "@/lib/data/employees";
import { Employee, computeGross } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import { authedFetch } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function MyProfilePage() {
  const { profile } = useAuth();
  const [employee, setEmployee] = useState<Employee | null | undefined>(undefined);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!profile?.employeeId) return;
    const unsub = subscribeToEmployee(profile.employeeId, (e) => {
      setEmployee(e);
      if (e) {
        setAccountNumber(e.bankAccount.accountNumber);
        setBankName(e.bankAccount.bankName);
      }
    });
    return unsub;
  }, [profile]);

  async function handleBankSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/employees/bank-change-request", {
        method: "POST",
        body: JSON.stringify({ accountNumber, bankName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to submit bank change request.");
        return;
      }
      toast.success("Bank change submitted — pending admin approval.");
    } catch {
      toast.error("Network error submitting bank change.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setChanging(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success("Password updated.");
      setNewPassword("");
    } catch {
      toast.error("Failed to update password. You may need to log in again first.");
    } finally {
      setChanging(false);
    }
  }

  if (employee === undefined) return <Spinner />;
  if (employee === null) return <p className="text-text-secondary">Employee record not found.</p>;

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>

      <Card>
        <h2 className="font-semibold text-text-primary mb-3">Bio (read-only)</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Name" value={employee.name} />
          <Field label="Department" value={employee.department} />
          <Field label="Employee ID" value={employee.employeeIdNumber} />
          <Field label="TIN" value={employee.TIN} mono />
          <Field label="Pension RSA" value={employee.pensionRSA} mono />
          <Field label="Gross Pay" value={formatNaira(computeGross(employee.salaryStructure))} />
        </dl>
      </Card>

      {employee.bankAccountPending && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-warning">
          A bank change to {employee.bankAccountPending.bankName} ·{" "}
          {employee.bankAccountPending.accountNumber} is pending admin approval.
        </div>
      )}

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Bank Details</h2>
        <form onSubmit={handleBankSubmit} className="flex flex-col gap-4">
          <Input label="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <p className="text-xs text-text-secondary">
            Changes require admin approval before taking effect — your salary payment destination never updates
            silently.
          </p>
          <Button type="submit" loading={submitting} className="self-start">
            Submit Bank Change
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold text-text-primary mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" loading={changing} className="self-start">
            Update Password
          </Button>
        </form>
      </Card>
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
