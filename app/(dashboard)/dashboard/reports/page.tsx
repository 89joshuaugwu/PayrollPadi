"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToPayrollRuns } from "@/lib/data/payroll";
import { subscribeToEmployees } from "@/lib/data/employees";
import { PayrollRun } from "@/types/payrollRun";
import { Employee } from "@/types/employee";
import Spinner from "@/components/ui/Spinner";
import ReportsDashboard from "@/components/organisms/ReportsDashboard";

export default function ReportsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [runs, setRuns] = useState<PayrollRun[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      toast.error("Admins only.");
      router.replace("/dashboard");
      return;
    }
    const unsub1 = subscribeToPayrollRuns(setRuns);
    const unsub2 = subscribeToEmployees(setEmployees);
    return () => {
      unsub1();
      unsub2();
    };
  }, [profile, router]);

  if (!profile || profile.role !== "admin" || runs === null || employees === null) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
      <ReportsDashboard runs={runs} employees={employees} />
    </div>
  );
}
