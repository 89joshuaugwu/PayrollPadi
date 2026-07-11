import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase-admin";
import { runPayroll } from "@/lib/payroll";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    const uid = await requireAdmin(idToken);

    const { period } = await req.json();
    if (!period) return NextResponse.json({ error: "Missing period." }, { status: 400 });

    const result = await runPayroll(period, uid);

    if (result.blockedEmployees.length > 0) {
      return NextResponse.json(
        { error: "Some employees have incomplete salary structures.", blockedEmployees: result.blockedEmployees },
        { status: 422 }
      );
    }

    return NextResponse.json({ runId: result.runId });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to run payroll.";
    const status = message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
