import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendTempPasswordEmail } from "@/lib/email";
import { generateTempPassword } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    await requireAdmin(idToken);

    const body = await req.json();
    const { name, email, department, employeeIdNumber, bankAccount, TIN, pensionRSA, salaryStructure } = body;

    if (!name || !email || !department || !employeeIdNumber) {
      return NextResponse.json({ error: "Missing required employee fields." }, { status: 400 });
    }

    const tempPassword = generateTempPassword();

    // 1. Create the Firebase Auth account (temp password) — client never
    //    has admin SDK access for this, it must go through this route.
    const userRecord = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // 2. Create the /employees doc
    const employeeRef = adminDb.collection("employees").doc();
    await employeeRef.set({
      uid: userRecord.uid,
      name,
      email,
      department,
      employeeIdNumber,
      bankAccount: bankAccount ?? { accountNumber: "", bankName: "" },
      bankAccountPending: null,
      TIN: TIN ?? "",
      pensionRSA: pensionRSA ?? "",
      salaryStructure: salaryStructure ?? { basic: 0, housing: 0, transport: 0, otherAllowances: 0 },
      voluntaryDeductions: [],
      status: "active",
      createdAt: Timestamp.now(),
    });

    // 3. Create the /users/{uid} doc with role: "employee", employeeId set
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      displayName: name,
      role: "employee",
      employeeId: employeeRef.id,
      createdAt: Timestamp.now(),
    });

    // 4. Email the employee their temp credentials — best-effort, don't
    //    fail the whole request if SMTP has a hiccup.
    try {
      await sendTempPasswordEmail(email, name, tempPassword);
    } catch (err) {
      console.error("Temp password email failed (non-blocking):", err);
    }

    return NextResponse.json({ employeeId: employeeRef.id, uid: userRecord.uid });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to create employee.";
    const status = message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
