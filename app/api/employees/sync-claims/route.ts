import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, requireAdmin } from "@/lib/firebase-admin";

/**
 * Sets/refreshes { role: "employee", employeeId } custom claims on an
 * employee's Firebase Auth account, sourced from their /employees/{id} doc.
 * Needed for:
 *  - Backfilling employees created before custom claims were added to the
 *    employee-creation flow.
 *  - Recovering if claims ever drift out of sync for any reason.
 * The employee must log out and back in (or force-refresh their ID token)
 * after this runs before the new claims take effect client-side.
 */
export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    await requireAdmin(idToken);

    const { employeeId } = await req.json();
    if (!employeeId) return NextResponse.json({ error: "Missing employeeId." }, { status: 400 });

    const employeeSnap = await adminDb.collection("employees").doc(employeeId).get();
    if (!employeeSnap.exists) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

    const uid: string | undefined = employeeSnap.data()?.uid;
    if (!uid) return NextResponse.json({ error: "Employee record has no linked auth uid." }, { status: 400 });

    await adminAuth.setCustomUserClaims(uid, { role: "employee", employeeId });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to sync claims.";
    const status = message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
