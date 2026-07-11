import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, verifyRequestAuth, getCallerProfile } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });

    const decoded = await verifyRequestAuth(idToken);
    const profile = await getCallerProfile(decoded.uid);
    if (profile.role !== "employee" || !profile.employeeId) {
      return NextResponse.json({ error: "Only employees may submit bank change requests." }, { status: 403 });
    }

    const { accountNumber, bankName } = await req.json();
    if (!accountNumber || !bankName) {
      return NextResponse.json({ error: "accountNumber and bankName are required." }, { status: 400 });
    }

    const employeeRef = adminDb.collection("employees").doc(profile.employeeId);
    await employeeRef.update({
      bankAccountPending: { accountNumber, bankName },
    });

    // Notify admins. Since there's no single "admin uid" guaranteed, this
    // pushes a notification to the acting employee's own record with a
    // type the admin employee-detail page also polls for via the
    // employee doc's bankAccountPending field directly — the
    // notification is a convenience nudge, the pending field is the
    // source of truth.
    const adminsSnap = await adminDb.collection("users").where("role", "==", "admin").get();
    const batch = adminDb.batch();
    for (const adminDoc of adminsSnap.docs) {
      const notifRef = adminDb.collection("notifications").doc(adminDoc.id).collection("items").doc();
      batch.set(notifRef, {
        type: "bank_change_pending",
        message: `${profile.employeeId} submitted a bank detail change awaiting approval.`,
        payslipId: null,
        read: false,
        createdAt: Timestamp.now(),
      });
    }
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to submit bank change request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
