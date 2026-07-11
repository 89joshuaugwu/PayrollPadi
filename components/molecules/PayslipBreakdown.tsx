"use client";

import { motion } from "framer-motion";
import { PayslipResult } from "@/types/payslip";
import { formatNaira } from "@/lib/tax-engine";

export default function PayslipBreakdown({ payslip, taxSettingsVersionUsed }: { payslip: PayslipResult; taxSettingsVersionUsed?: string }) {
  const totalDeductions =
    payslip.deductions.pension +
    payslip.deductions.nhf +
    payslip.deductions.nhis +
    payslip.deductions.payeTax +
    payslip.deductions.voluntary;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-2">EARNINGS</h4>
          <dl className="flex flex-col gap-1.5 text-sm">
            <Row label="Basic Salary" value={payslip.earnings.basic} />
            <Row label="Housing Allowance" value={payslip.earnings.housing} />
            <Row label="Transport Allowance" value={payslip.earnings.transport} />
            <Row label="Other Allowances" value={payslip.earnings.otherAllowances} />
            <Row label="Gross Pay" value={payslip.grossPay} bold />
          </dl>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-2">DEDUCTIONS</h4>
          <dl className="flex flex-col gap-1.5 text-sm">
            <Row label="Pension (employer-configured %)" value={payslip.deductions.pension} />
            <Row label="NHF" value={payslip.deductions.nhf} />
            <Row label="NHIS" value={payslip.deductions.nhis} />
            <Row label="PAYE Tax" value={payslip.deductions.payeTax} />
            <Row label="Rent Relief Applied" value={payslip.deductions.rentReliefApplied} />
            <Row label="Voluntary Deductions" value={payslip.deductions.voluntary} />
            <Row label="Total Deductions" value={totalDeductions} bold />
          </dl>
        </div>
      </div>

      {payslip.payeBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-secondary mb-2">PAYE Band Breakdown (Annualized)</h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary">Band Min</th>
                  <th className="text-left px-3 py-2 font-semibold text-text-secondary">Band Max</th>
                  <th className="text-right px-3 py-2 font-semibold text-text-secondary">Rate</th>
                  <th className="text-right px-3 py-2 font-semibold text-text-secondary">Tax on Band</th>
                </tr>
              </thead>
              <tbody>
                {payslip.payeBreakdown.map((b, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums">{formatNaira(b.bandMin)}</td>
                    <td className="px-3 py-2 tabular-nums">{b.bandMax !== null ? formatNaira(b.bandMax) : "No limit"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNaira(b.taxOnBand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-5 flex items-center justify-between"
      >
        <span className="text-white font-semibold">NET PAY</span>
        <span className="text-white text-2xl font-bold tabular-nums">{formatNaira(payslip.netPay)}</span>
      </motion.div>

      {taxSettingsVersionUsed && (
        <p className="text-xs text-text-secondary italic">
          Tax computed using NTA 2025 bands (version {taxSettingsVersionUsed})
        </p>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-text-primary border-t border-border pt-1.5 mt-0.5" : "text-text-primary"}`}>
      <dt className={bold ? "" : "text-text-secondary"}>{label}</dt>
      <dd className="tabular-nums">{formatNaira(value)}</dd>
    </div>
  );
}
