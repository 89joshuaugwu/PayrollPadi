"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Employee, computeGross } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import DataTable, { Column } from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

export default function EmployeeManagementTable({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(employees.map((e) => e.department)))],
    [employees]
  );

  const filtered = employees.filter((e) => {
    if (department !== "all" && e.department !== department) return false;
    if (status !== "all" && e.status !== status) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.employeeIdNumber.includes(search)) return false;
    return true;
  });

  const columns: Column<Employee>[] = [
    { key: "name", header: "Name", render: (e) => e.name, sortValue: (e) => e.name },
    { key: "department", header: "Department", render: (e) => e.department, sortValue: (e) => e.department },
    { key: "employeeId", header: "Employee ID", render: (e) => e.employeeIdNumber },
    {
      key: "gross",
      header: "Gross Pay",
      numeric: true,
      render: (e) => formatNaira(computeGross(e.salaryStructure)),
      sortValue: (e) => computeGross(e.salaryStructure),
    },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-3">
        <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-64" />
        <Select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          options={departments.map((d) => ({ value: d, label: d === "all" ? "All Departments" : d }))}
          className="md:w-48"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          className="md:w-40"
        />
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.id}
        onRowClick={(e) => router.push(`/dashboard/employees/${e.id}`)}
        emptyMessage="No employees added yet."
      />
    </div>
  );
}
