import { adminDb } from "@/lib/firebase-admin";

const DEFAULT_COMPANY_NAME = "PayrollPadi";

/**
 * Fetches the admin-configured company name from /settings/company for use
 * in the payslip PDF header. Falls back to the default if never set —
 * never blocks payroll locking / PDF generation if this read fails or the
 * doc doesn't exist yet.
 */
export async function getCompanyName(): Promise<string> {
  try {
    const snap = await adminDb.collection("settings").doc("company").get();
    const name = snap.exists ? (snap.data()?.companyName as string | undefined) : undefined;
    return name?.trim() || DEFAULT_COMPANY_NAME;
  } catch (err) {
    console.error("Failed to fetch company name, using default:", err);
    return DEFAULT_COMPANY_NAME;
  }
}
