import { SalaryStructure } from "./employee";

export interface PayeBreakdownEntry {
  bandMin: number;
  bandMax: number | null;
  rate: number;
  taxOnBand: number;
}

export interface PayslipDeductions {
  pension: number;
  nhf: number;
  nhis: number;
  payeTax: number;
  voluntary: number;
  rentReliefApplied: number;
}

export interface PayslipResult {
  grossPay: number;
  earnings: SalaryStructure;
  deductions: PayslipDeductions;
  netPay: number;
  payeBreakdown: PayeBreakdownEntry[];
}

export interface Payslip extends PayslipResult {
  id: string; // employeeId
  runId: string;
  period: string;
  employeeId: string;
  employeeName: string;
  employeeIdNumber: string;
  taxSettingsVersionUsed: string;
  payslipUrl: string | null;
  emailSentAt: number | null;
}
