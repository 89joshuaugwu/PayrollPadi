"use client";

import { useEffect, useState } from "react";
import { subscribeToEmployees } from "@/lib/data/employees";
import { Employee } from "@/types/employee";
import Spinner from "@/components/ui/Spinner";
import PayrollRunWizard from "@/components/organisms/PayrollRunWizard";

export default function NewPayrollRunPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    const unsub = subscribeToEmployees(setEmployees);
    return unsub;
  }, []);

  if (employees === null) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">New Payroll Run</h1>
      <PayrollRunWizard employees={employees} />
    </div>
  );
}
