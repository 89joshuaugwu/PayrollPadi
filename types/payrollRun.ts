export type PayrollRunStatus = "draft" | "processing" | "locked";

export interface PayrollRun {
  id: string;
  period: string; // "2026-07"
  status: PayrollRunStatus;
  taxSettingsVersionUsed: string;
  totalCost: number;
  employeeCount: number;
  runBy: string;
  runAt: number;
  lockedAt: number | null;
}
