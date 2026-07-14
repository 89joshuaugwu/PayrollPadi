import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyRequestAuth, getCallerProfile } from "@/lib/firebase-admin";
import { generatePayslipPDF } from "@/lib/pdf";
import { getCompanyName } from "@/lib/settings";

export async function GET(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });

    const decoded = await verifyRequestAuth(idToken);
    const profile = await getCallerProfile(decoded.uid);

    const employeeId = req.nextUrl.searchParams.get("employeeId");
    if (!employeeId) return NextResponse.json({ error: "Missing employeeId." }, { status: 400 });

    // RBAC: admin can download any employee's payslip; an employee can
    // only download their own.
    if (profile.role !== "admin" && profile.employeeId !== employeeId) {
      return NextResponse.json({ error: "Forbidden: not your payslip." }, { status: 403 });
    }

    const payslipSnap = await adminDb.collection("payrollRuns").doc(runId).collection("payslips").doc(employeeId).get();
    if (!payslipSnap.exists) return NextResponse.json({ error: "Payslip not found." }, { status: 404 });
    const payslip = payslipSnap.data()!;

    const companyName = await getCompanyName();
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
      companyName,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payslip-${payslip.employeeIdNumber}-${payslip.period}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
