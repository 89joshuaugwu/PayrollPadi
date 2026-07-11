"use client";

import { SalaryStructure, computeGross } from "@/types/employee";
import { formatNaira } from "@/lib/tax-engine";
import Input from "@/components/ui/Input";

interface Props {
  value: SalaryStructure;
  onChange: (next: SalaryStructure) => void;
}

export default function SalaryStructureForm({ value, onChange }: Props) {
  function update(field: keyof SalaryStructure, raw: string) {
    const num = raw === "" ? 0 : Number(raw);
    onChange({ ...value, [field]: Number.isFinite(num) ? num : 0 });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Basic Salary (₦/month)"
          type="number"
          min={0}
          value={value.basic || ""}
          onChange={(e) => update("basic", e.target.value)}
        />
        <Input
          label="Housing Allowance (₦/month)"
          type="number"
          min={0}
          value={value.housing || ""}
          onChange={(e) => update("housing", e.target.value)}
        />
        <Input
          label="Transport Allowance (₦/month)"
          type="number"
          min={0}
          value={value.transport || ""}
          onChange={(e) => update("transport", e.target.value)}
        />
        <Input
          label="Other Allowances (₦/month)"
          type="number"
          min={0}
          value={value.otherAllowances || ""}
          onChange={(e) => update("otherAllowances", e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
        <span className="text-sm font-medium text-primary-dark">Gross Pay (auto-computed)</span>
        <span className="tabular-nums font-bold text-primary-dark">{formatNaira(computeGross(value))}</span>
      </div>
    </div>
  );
}
