import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, requireAdmin } from "@/lib/firebase-admin";
import { generatePayslipPDF } from "@/lib/pdf";
import { sendPayslipEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    await requireAdmin(idToken);

    const { runId, employeeId } = await req.json();
    if (!runId || !employeeId) return NextResponse.json({ error: "Missing runId or employeeId." }, { status: 400 });

    const payslipSnap = await adminDb.collection("payrollRuns").doc(runId).collection("payslips").doc(employeeId).get();
    if (!payslipSnap.exists) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
    const payslip = payslipSnap.data()!;

    const employeeSnap = await adminDb.collection("employees").doc(employeeId).get();
    const employeeEmail: string | undefined = employeeSnap.data()?.email;
    if (!employeeEmail) return NextResponse.json({ error: "Employee email not found." }, { status: 404 });

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

    await sendPayslipEmail(employeeEmail, pdfBuffer, {
      employeeName: payslip.employeeName,
      period: payslip.period,
      netPay: payslip.netPay,
    });

    await payslipSnap.ref.update({ emailSentAt: Timestamp.now() });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to resend payslip email.";
    const status = message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
