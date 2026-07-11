import { Employee, computeGross } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import StatusBadge from "@/components/ui/StatusBadge";

export default function EmployeeRow({ employee, onClick }: { employee: Employee; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between border border-border rounded-xl p-4 bg-white hover:bg-indigo-50/40 cursor-pointer transition-colors"
    >
      <div>
        <p className="font-medium text-text-primary">{employee.name}</p>
        <p className="text-xs text-text-secondary">
          {employee.department} · {employee.employeeIdNumber}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular-nums font-medium text-text-primary">{formatNaira(computeGross(employee.salaryStructure))}</p>
        <StatusBadge status={employee.status} />
      </div>
    </div>
  );
}
