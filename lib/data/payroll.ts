import { collection, collectionGroup, doc, onSnapshot, getDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PayrollRun } from "@/types/payrollRun";
import { Payslip } from "@/types/payslip";
import { toMillis } from "@/lib/utils";

function runFromDoc(id: string, data: Record<string, unknown>): PayrollRun {
  return {
    id,
    period: data.period as string,
    status: data.status as PayrollRun["status"],
    taxSettingsVersionUsed: data.taxSettingsVersionUsed as string,
    totalCost: data.totalCost as number,
    employeeCount: data.employeeCount as number,
    runBy: data.runBy as string,
    runAt: toMillis(data.runAt),
    lockedAt: data.lockedAt ? toMillis(data.lockedAt) : null,
  };
}

function payslipFromDoc(id: string, runId: string, data: Record<string, unknown>): Payslip {
  return {
    id,
    runId,
    employeeId: (data.employeeId as string) ?? id,
    employeeName: data.employeeName as string,
    employeeIdNumber: data.employeeIdNumber as string,
    period: data.period as string,
    taxSettingsVersionUsed: data.taxSettingsVersionUsed as string,
    grossPay: data.grossPay as number,
    earnings: data.earnings as Payslip["earnings"],
    deductions: data.deductions as Payslip["deductions"],
    netPay: data.netPay as number,
    payeBreakdown: (data.payeBreakdown as Payslip["payeBreakdown"]) ?? [],
    payslipUrl: (data.payslipUrl as string) ?? null,
    emailSentAt: data.emailSentAt ? toMillis(data.emailSentAt) : null,
  };
}

export function subscribeToPayrollRuns(callback: (runs: PayrollRun[]) => void): () => void {
  const q = query(collection(db, "payrollRuns"), orderBy("runAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => runFromDoc(d.id, d.data()))));
}

export function subscribeToPayrollRun(runId: string, callback: (run: PayrollRun | null) => void): () => void {
  return onSnapshot(doc(db, "payrollRuns", runId), (snap) => {
    callback(snap.exists() ? runFromDoc(snap.id, snap.data()) : null);
  });
}

export function subscribeToPayslips(runId: string, callback: (payslips: Payslip[]) => void): () => void {
  const q = collection(db, "payrollRuns", runId, "payslips");
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => payslipFromDoc(d.id, runId, d.data()))));
}

export async function getPayslip(runId: string, employeeId: string): Promise<Payslip | null> {
  const snap = await getDoc(doc(db, "payrollRuns", runId, "payslips", employeeId));
  if (!snap.exists()) return null;
  return payslipFromDoc(snap.id, runId, snap.data());
}

/** collectionGroup query across all runs' payslips subcollections, filtered by employeeId field. */
export async function getMyPayslips(employeeId: string): Promise<Payslip[]> {
  const q = query(collectionGroup(db, "payslips"), where("employeeId", "==", employeeId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const runId = d.ref.parent.parent!.id;
    return payslipFromDoc(d.id, runId, d.data());
  });
}

/**
 * Admin-only: fetches every payslip across every run, for Reports
 * aggregation (e.g. total tax remitted). Allowed by the payslips rule's
 * `getRole() == "admin"` branch, which — unlike the employee-ownership
 * branch — doesn't depend on resource.data, so it's trivially provable for
 * a collectionGroup list query regardless of filters.
 */
export async function getAllPayslips(): Promise<Payslip[]> {
  const snap = await getDocs(collectionGroup(db, "payslips"));
  return snap.docs.map((d) => {
    const runId = d.ref.parent.parent!.id;
    return payslipFromDoc(d.id, runId, d.data());
  });
}
