import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// Lazy singletons: Next.js collects route metadata at build time by
// briefly loading every API route module, without env vars necessarily
// present (e.g. a fresh clone before .env.local is filled in). Eagerly
// calling getAdminApp() at module scope would throw during that build
// step. Deferring initialization until first actual use means the build
// always succeeds, and the clear env-var error only surfaces at request
// time on a real deployment, which is where it's actionable.
let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function ensureApp(): App {
  if (!_adminApp) _adminApp = getAdminApp();
  return _adminApp;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(ensureApp());
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(ensureApp());
  return _adminDb;
}

/** Proxy objects so existing call sites (adminAuth.foo(), adminDb.collection(...)) keep working unchanged. */
function bindIfFunction(instance: object, prop: PropertyKey) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = (instance as any)[prop];
  return typeof value === "function" ? value.bind(instance) : value;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return bindIfFunction(getAdminAuth(), prop);
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    return bindIfFunction(getAdminDb(), prop);
  },
});

/** Verifies a Firebase session cookie / ID token from an API route and returns the decoded claims. */
export async function verifyRequestAuth(idToken: string) {
  return getAdminAuth().verifyIdToken(idToken);
}

/** Fetches the caller's role + employeeId from /users/{uid}. Throws if the user doc is missing. */
export async function getCallerProfile(uid: string): Promise<{ role: "admin" | "employee"; employeeId: string | null }> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  if (!snap.exists) throw new Error("User profile not found.");
  const data = snap.data()!;
  return { role: data.role, employeeId: data.employeeId ?? null };
}

/** Throws unless the caller's role is admin. Use at the top of every admin-only API route. */
export async function requireAdmin(idToken: string): Promise<string> {
  const decoded = await verifyRequestAuth(idToken);
  const profile = await getCallerProfile(decoded.uid);
  if (profile.role !== "admin") {
    throw new Error("Forbidden: admin role required.");
  }
  return decoded.uid;
}
