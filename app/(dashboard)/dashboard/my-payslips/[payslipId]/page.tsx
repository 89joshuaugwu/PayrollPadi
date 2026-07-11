"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getPayslip } from "@/lib/data/payroll";
import { Payslip } from "@/types/payslip";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import PayslipDetailView from "@/components/organisms/PayslipDetailView";

export default function PayslipDetailPage() {
  const { payslipId } = useParams<{ payslipId: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [payslip, setPayslip] = useState<Payslip | null | undefined>(undefined);

  useEffect(() => {
    const [runId, employeeId] = payslipId.split("_");
    if (!runId || !employeeId) {
      setPayslip(null);
      return;
    }
    getPayslip(runId, employeeId).then(setPayslip);
  }, [payslipId]);

  useEffect(() => {
    if (payslip === null) toast.error("Payslip not found.");
  }, [payslip]);

  if (!profile || payslip === undefined) return <Spinner />;
  if (payslip === null) {
    return (
      <div className="text-center py-10">
        <p className="text-text-secondary">Payslip not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-3">
          Go Back
        </Button>
      </div>
    );
  }

  // RBAC: employees may only view their own payslip.
  if (profile.role === "employee" && profile.employeeId !== payslip.employeeId) {
    return <p className="text-text-secondary">You don&apos;t have access to this payslip.</p>;
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <Button variant="ghost" onClick={() => router.back()} className="self-start">
        ← Back
      </Button>
      <PayslipDetailView payslip={payslip} isAdmin={profile.role === "admin"} />
    </div>
  );
}
