"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Send } from "lucide-react";
import { Payslip } from "@/types/payslip";
import { formatPeriod } from "@/lib/utils";
import { authedFetch } from "@/lib/apiClient";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PayslipBreakdown from "@/components/molecules/PayslipBreakdown";

interface Props {
  payslip: Payslip;
  isAdmin?: boolean;
}

export default function PayslipDetailView({ payslip, isAdmin }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await authedFetch(`/api/payroll/${payslip.runId}/payslip-pdf?employeeId=${payslip.employeeId}`);
      if (!res.ok) {
        toast.error("Could not generate PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${payslip.employeeIdNumber}-${payslip.period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Network error downloading PDF.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const res = await authedFetch("/api/payroll/resend", {
        method: "POST",
        body: JSON.stringify({ runId: payslip.runId, employeeId: payslip.employeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to resend email.");
        return;
      }
      toast.success("Payslip email resent.");
    } catch {
      toast.error("Network error resending email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-lg text-text-primary">{payslip.employeeName}</h2>
          <p className="text-sm text-text-secondary">
            {payslip.employeeIdNumber} · {formatPeriod(payslip.period)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownload} loading={downloading}>
            <Download className="w-4 h-4" /> Download PDF
          </Button>
          {isAdmin && (
            <Button variant="secondary" onClick={handleResend} loading={resending}>
              <Send className="w-4 h-4" /> Resend Email
            </Button>
          )}
        </div>
      </div>
      <PayslipBreakdown payslip={payslip} taxSettingsVersionUsed={payslip.taxSettingsVersionUsed} />
      {payslip.emailSentAt && (
        <p className="text-xs text-text-secondary mt-4">Emailed on {new Date(payslip.emailSentAt).toLocaleString()}</p>
      )}
    </Card>
  );
}
