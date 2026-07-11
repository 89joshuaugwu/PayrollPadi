import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { computePayslip } from "@/lib/tax-engine";
import { generatePayslipPDF } from "@/lib/pdf";
import { sendPayslipEmail } from "@/lib/email";
import { uploadPayslipPdf } from "@/lib/cloudinary";
import { Employee, isSalaryStructureComplete } from "@/types/employee";
import { TaxSettingsVersion } from "@/types/taxSettings";
import { PayslipResult } from "@/types/payslip";

export async function getCurrentTaxSettings(): Promise<TaxSettingsVersion> {
  const snap = await adminDb
    .collection("taxSettings")
    .orderBy("effectiveFrom", "desc")
    .limit(1)
    .get();
  if (snap.empty) {
    throw new Error("No tax settings configured. Seed /taxSettings before running payroll.");
  }
  const docSnap = snap.docs[0]!;
  return { id: docSnap.id, ...(docSnap.data() as Omit<TaxSettingsVersion, "id">) };
}

export interface RunPayrollResult {
  runId: string;
  blockedEmployees: { id: string; name: string }[];
}

/**
 * Computes and stores draft payslips for every active employee for a
 * given period. Does NOT send email or generate PDFs — that happens only
 * on lockPayrollRun(). taxSettingsVersionUsed is locked to whichever
 * version is current AT RUN TIME and is never recomputed if tax settings
 * change afterward.
 */
export async function runPayroll(period: string, adminUid: string): Promise<RunPayrollResult> {
  const taxSettings = await getCurrentTaxSettings();

  const employeesSnap = await adminDb.collection("employees").where("status", "==", "active").get();

  const employees = employeesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Employee, "id">) }));

  const blockedEmployees = employees
    .filter((e) => !isSalaryStructureComplete(e.salaryStructure))
    .map((e) => ({ id: e.id, name: e.name }));

  if (blockedEmployees.length > 0) {
    return { runId: "", blockedEmployees };
  }

  const runRef = adminDb.collection("payrollRuns").doc();

  await runRef.set({
    period,
    status: "processing",
    taxSettingsVersionUsed: taxSettings.id,
    runBy: adminUid,
    runAt: Timestamp.now(),
    totalCost: 0,
    employeeCount: 0,
    lockedAt: null,
  });

  const batch = adminDb.batch();
  let totalCost = 0;

  for (const employee of employees) {
    const payslip: PayslipResult = computePayslip(
      { salaryStructure: employee.salaryStructure, voluntaryDeductions: employee.voluntaryDeductions ?? [] },
      taxSettings
    );
    totalCost += payslip.grossPay;

    const payslipRef = runRef.collection("payslips").doc(employee.id);
    batch.set(payslipRef, {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeIdNumber: employee.employeeIdNumber,
      period,
      runId: runRef.id,
      taxSettingsVersionUsed: taxSettings.id,
      ...payslip,
      payslipUrl: null,
      emailSentAt: null,
    });
  }

  await batch.commit();
  await runRef.update({ totalCost, employeeCount: employees.length, status: "draft" });

  return { runId: runRef.id, blockedEmployees: [] };
}

/**
 * Locks a payroll run: generates a PDF per payslip, emails it, writes a
 * notification, and marks the run "locked". Payslips are immutable after
 * this point (enforced by Firestore rules — admin write only, and in
 * practice the app never edits a locked run's payslips).
 */
export async function lockPayrollRun(runId: string): Promise<void> {
  const runRef = adminDb.collection("payrollRuns").doc(runId);
  const runSnap = await runRef.get();
  if (!runSnap.exists) throw new Error("Payroll run not found.");
  const run = runSnap.data()!;
  if (run.status === "locked") throw new Error("Payroll run is already locked.");

  const payslipsSnap = await runRef.collection("payslips").get();

  for (const payslipDoc of payslipsSnap.docs) {
    const payslip = payslipDoc.data();

    const employeeSnap = await adminDb.collection("employees").doc(payslipDoc.id).get();
    const employeeEmail: string | undefined = employeeSnap.data()?.email;
    if (!employeeEmail) continue;

    const pdfBuffer = generatePayslipPDF({
      employeeName: payslip.employeeName,
      employeeIdNumber: payslip.employeeIdNumber,
      period: payslip.period,
      earnings: payslip.earnings,
      deductions: payslip.deductions,
      grossPay: payslip.grossPay,
      netPay: payslip.netPay,
      payeBreakdown: payslip.payeBreakdown,
      taxSettingsVersionUsed: payslip.taxSettingsVersionUsed,
    });

    // Cloudinary upload is optional/best-effort — never blocks the lock
    // operation. Email delivery is the primary requirement.
    let payslipUrl: string | null = null;
    try {
      if (process.env.CLOUDINARY_API_KEY) {
        payslipUrl = await uploadPayslipPdf(pdfBuffer, `${runId}_${payslipDoc.id}`);
      }
    } catch (err) {
      console.error("Cloudinary upload failed (non-blocking):", err);
    }

    await sendPayslipEmail(employeeEmail, pdfBuffer, {
      grossPay: payslip.grossPay,
      earnings: payslip.earnings,
      deductions: payslip.deductions,
      netPay: payslip.netPay,
      payeBreakdown: payslip.payeBreakdown,
    });

    await adminDb
      .collection("notifications")
      .doc(payslipDoc.id)
      .collection("items")
      .add({
        type: "payslip_ready",
        message: `Your payslip for ${payslip.period} is ready.`,
        payslipId: payslipDoc.id,
        read: false,
        createdAt: Timestamp.now(),
      });

    await payslipDoc.ref.update({
      emailSentAt: Timestamp.now(),
      ...(payslipUrl ? { payslipUrl } : {}),
    });
  }

  await runRef.update({ status: "locked", lockedAt: Timestamp.now() });
}
