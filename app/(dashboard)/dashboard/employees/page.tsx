"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToEmployees } from "@/lib/data/employees";
import { Employee } from "@/types/employee";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import EmployeeManagementTable from "@/components/organisms/EmployeeManagementTable";

export default function EmployeesPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      toast.error("Admins only.");
      router.replace("/dashboard");
      return;
    }
    const unsub = subscribeToEmployees(setEmployees);
    return unsub;
  }, [profile, router]);

  if (!profile || profile.role !== "admin" || employees === null) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Employees</h1>
        <Link href="/dashboard/employees/new">
          <Button>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </Link>
      </div>
      <EmployeeManagementTable employees={employees} />
    </div>
  );
}
