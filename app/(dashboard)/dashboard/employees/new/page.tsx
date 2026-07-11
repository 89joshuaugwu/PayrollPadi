"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SalaryStructure } from "@/types/employee";
import { authedFetch } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SalaryStructureForm from "@/components/molecules/SalaryStructureForm";

export default function NewEmployeePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeIdNumber, setEmployeeIdNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [TIN, setTIN] = useState("");
  const [pensionRSA, setPensionRSA] = useState("");
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure>({
    basic: 0,
    housing: 0,
    transport: 0,
    otherAllowances: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authedFetch("/api/employees/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          department,
          employeeIdNumber,
          bankAccount: { accountNumber, bankName },
          TIN,
          pensionRSA,
          salaryStructure,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add employee.");
        return;
      }
      toast.success("Employee added. Temp login credentials emailed to them.");
      router.push(`/dashboard/employees/${data.employeeId}`);
    } catch {
      toast.error("Network error adding employee.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-primary">Add Employee</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Bio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Department" required value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Input
              label="Employee ID Number"
              required
              value={employeeIdNumber}
              onChange={(e) => setEmployeeIdNumber(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            <Input label="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Tax IDs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="TIN" value={TIN} onChange={(e) => setTIN(e.target.value)} />
            <Input label="Pension RSA Number" value={pensionRSA} onChange={(e) => setPensionRSA(e.target.value)} />
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Salary Structure</h2>
          <SalaryStructureForm value={salaryStructure} onChange={setSalaryStructure} />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Create Employee
          </Button>
        </div>
      </form>
    </div>
  );
}
