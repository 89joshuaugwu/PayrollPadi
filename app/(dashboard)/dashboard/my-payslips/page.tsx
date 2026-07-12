"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getMyPayslips } from "@/lib/data/payroll";
import { Payslip } from "@/types/payslip";
import Spinner from "@/components/ui/Spinner";
import MyPayslipsList from "@/components/organisms/MyPayslipsList";

export default function MyPayslipsPage() {
  const { profile } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.employeeId) return;
    getMyPayslips(profile.employeeId)
      .then(setPayslips)
      .catch((err) => {
        console.error("Failed to load payslips:", err);
        setError(err?.message ?? "Failed to load your payslips.");
      });
  }, [profile]);

  if (!profile) return <Spinner />;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">My Payslips</h1>
        <p className="text-error text-sm bg-red-50 border border-red-200 rounded-lg p-4">
          Couldn&apos;t load your payslips: {error}
        </p>
      </div>
    );
  }

  if (payslips === null) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">My Payslips</h1>
      <MyPayslipsList payslips={payslips} />
    </div>
  );
}
