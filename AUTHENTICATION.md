# PayrollPadi — AUTHENTICATION.md

How logging in, staying logged in, logging out, and role-based access actually work, end to end.

---

## 1. There Is No Public Signup — On Purpose

Nobody can create their own account. Every account is **provisioned by someone else**:

- The very first Admin account is created **manually** in Firebase Console (a one-time bootstrap step — see `README.md`'s deploy checklist).
- Every Employee account after that is created by an Admin, through the **Add Employee** page in the app.

This is deliberate: a payroll system where anyone could sign themselves up would be a serious security problem. Every login on this system corresponds to a real staff member someone in charge explicitly added.

---

## 2. How An Employee Account Gets Created

This is where four different things happen in one action, all inside a single server API route (`app/api/employees/create/route.ts`) so they can't get out of sync with each other:

```
Admin fills the "Add Employee" form and submits
        ↓
1. A Firebase Authentication account is created
   (random temporary password, generated server-side)
        ↓
2. A /employees/{id} document is created
   (salary, bank details, tax IDs)
        ↓
2b. Custom claims are set on the new Auth account:
    { role: "employee", employeeId: <the new employee doc's ID> }
    — baked directly into their future login tokens
        ↓
3. A /users/{uid} document is created
   { role: "employee", employeeId: <same id> }
   — this is what the app reads after login to know who's who
        ↓
4. A welcome email is sent with their temporary password
```

**Why both custom claims (step 2b) and a Firestore `/users` document (step 3), when they hold almost the same information?** They're used for different jobs:

- The **`/users` document** is what the website's React code reads after login to decide what to show (sidebar links, dashboard content, etc.) — it's read live via a normal Firestore read, so it can change without the user needing to log out.
- The **custom claims** exist specifically so **Firestore security rules** can check `request.auth.token.employeeId` without needing an extra database lookup. This matters for one specific, non-obvious reason explained in Section 6.

---

## 3. Signing In

```
User enters email + password on /auth/login
        ↓
Firebase Auth client SDK verifies the credentials directly (signInWithEmailAndPassword)
        ↓
The browser now holds a Firebase ID token for this session
        ↓
That token is sent to POST /api/auth/session
        ↓
The server (using the Admin SDK) turns it into an httpOnly session cookie
        ↓
Browser redirects to /dashboard
```

**What that session cookie is actually for:** it's read by `middleware.ts`, which does one simple check — "is there a session cookie at all?" — before letting a request through to any `/dashboard/*` route. If there's no cookie, it redirects to `/auth/login` immediately, before the page even starts loading. This exists purely to avoid a flash of protected UI for someone who isn't logged in at all. **It does not check the user's role** — that happens elsewhere (Section 5).

Separately, on the client side, `lib/AuthContext.tsx` (`AuthProvider`) listens for Firebase's own `onAuthStateChanged` event. When a user is signed in, it fetches their `/users/{uid}` profile document and makes `{ firebaseUser, profile, loading }` available to every component in the dashboard via React Context. This is what `AppShell` uses to decide whether to show the Admin sidebar or the Employee sidebar.

---

## 4. Signing Out

```
User clicks Logout (sidebar on desktop, or the logout icon in the mobile top bar)
        ↓
Firebase Auth client SDK signs out (signOut())
        ↓
DELETE /api/auth/session clears the httpOnly cookie
        ↓
Redirect to /auth/login
```

Both steps matter — signing out of the Firebase client SDK alone would leave the session cookie in place, and middleware would still let requests through (it only checks for cookie *presence*).

---

## 5. The Four Layers of Access Control

No single layer is trusted alone. Every layer assumes the others might somehow be bypassed:

| Layer | What it checks | Where |
|---|---|---|
| **1. Middleware** | "Is there a session cookie at all?" (presence only, not validity or role) | `middleware.ts` |
| **2. Client-side role gate** | "Does this user's role match what this page expects?" — shows a toast and redirects if not | Every dashboard page component, e.g. `if (profile.role !== "admin") { toast...; router.replace("/dashboard") }` |
| **3. Firestore security rules** | The real enforcement — even if layers 1 and 2 were somehow bypassed, Firebase itself refuses to hand back data that violates `firestore.rules` | `firestore.rules`, lives in Firebase, not in the app's deployed code |
| **4. Server API route checks** | Every privileged action re-verifies the caller's identity and role from scratch, server-side, before doing anything | `requireAdmin()` / `getCallerProfile()` in `lib/firebase-admin.ts`, called at the top of every admin-only route |

**Layer 3 is the one that actually matters for security.** Layers 1, 2, and 4 exist mostly for good user experience (don't show someone a page they can't use) and defense-in-depth (catch mistakes before they even reach Firestore) — but a determined attacker bypassing the website's own JavaScript entirely and talking to Firestore directly would still be stopped by Layer 3 alone.

---

## 6. Custom Claims — Why They Exist (The Non-Obvious Part)

This is worth understanding properly if you ever touch `firestore.rules` again.

The "My Payslips" page needs to find every payslip belonging to one employee, **across every payroll run that's ever happened** — that's a `collectionGroup` query (it searches every `payslips` subcollection at once, regardless of which run it's nested under).

Firestore treats this kind of cross-collection search differently from a normal single-document read. Before it will even attempt the query, it has to mathematically prove — just from the rule text and the query's own filters, **without running anything yet** — that every possible document the query could return would be allowed. If a security rule needs to fetch a *separate* document to check ownership (e.g. "look up this user's employeeId from their `/users` doc"), Firestore can't complete that proof in advance, and it rejects the entire query outright with "Missing or insufficient permissions" — even when the data and the rule logic are both completely correct.

**The fix:** put the ownership value directly on the login token itself (`request.auth.token.employeeId`, a custom claim), instead of requiring a separate database lookup. Since the value is already sitting right there in the request with zero extra work needed, Firestore can prove the rule is safe instantly.

```javascript
// This required a separate lookup — broke collectionGroup queries:
allow read: if resource.data.employeeId == get(/databases/.../users/$(request.auth.uid)).data.employeeId;

// This is already part of the request — works fine:
allow read: if resource.data.employeeId == request.auth.token.employeeId;
```

**Practical consequence:** custom claims only take effect on a **freshly issued login token** — not an already-open browser session. If an employee's claims ever need to change (or, as happened once during development, an employee was created *before* this fix existed and simply never got claims set), an Admin has to visit that employee's detail page and click **"Sync Login Permissions"**, and the employee has to **log out and back in** before the new claims apply.

---

## 7. Password Changes

Both Admin (`/dashboard/settings`) and Employee (`/dashboard/my-profile`) can change their own password from within the app, using Firebase Auth's client-side `updatePassword()` function directly — no server route needed, since a user changing their *own* password while already authenticated is something Firebase Auth handles natively and securely on its own.

---

## 8. Summary Diagram

```
                     ┌─────────────────────────┐
                     │   Firebase Auth          │
                     │   (email + password)     │
                     └────────────┬─────────────┘
                                  │ issues
                                  ▼
                     ┌─────────────────────────┐
                     │   ID Token                │
                     │   includes custom claims: │
                     │   { role, employeeId }    │
                     └────────────┬─────────────┘
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        Sent to /api/auth/session      Used directly by the
        → becomes an httpOnly          client-side Firestore
        session cookie                 SDK for every read
        (middleware.ts checks          (firestore.rules checks
         only that it exists)           the actual claims)
```
