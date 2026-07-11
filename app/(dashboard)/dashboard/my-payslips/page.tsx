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

  useEffect(() => {
    if (!profile?.employeeId) return;
    getMyPayslips(profile.employeeId).then(setPayslips);
  }, [profile]);

  if (!profile || payslips === null) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">My Payslips</h1>
      <MyPayslipsList payslips={payslips} />
    </div>
  );
}
