# PayrollPadi — API_REFERENCE.md

Every server-only route in the app, what it needs, and what it does. All of these live under `app/api/` and are only ever called by the app's own frontend (via `lib/apiClient.ts`'s `authedFetch()` helper, which automatically attaches the caller's Firebase login token) — there's no separate public API for third parties.

**How authentication works on these routes:** every route (except session creation itself) expects an `Authorization: Bearer <firebase-id-token>` header. The route verifies that token is genuine using the Firebase Admin SDK, looks up the caller's role, and only proceeds if allowed. This check happens **fresh, on every single request** — nothing is cached or trusted from a previous request.

---

## `POST /api/auth/session`

**Purpose:** turns a Firebase ID token into an httpOnly session cookie, used only by `middleware.ts` for a lightweight "are they logged in" check.

**Auth required:** none (this route *creates* the session, called right after a successful client-side login).

**Request body:**
```json
{ "idToken": "<firebase id token>" }
```

**Response:** `{ "ok": true }`, plus a `Set-Cookie` header with the session cookie (5-day expiry, httpOnly, secure in production).

**Errors:** `400` if `idToken` missing, `401` if the token can't be turned into a session cookie.

---

## `DELETE /api/auth/session`

**Purpose:** clears the session cookie on logout.

**Auth required:** none.

**Response:** `{ "ok": true }`, cookie cleared.

---

## `POST /api/employees/create`

**Purpose:** the entire "Add Employee" action — creates a login, a staff record, and sends a welcome email, all in one place so they can't drift out of sync.

**Auth required:** Admin only.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "department": "string",
  "employeeIdNumber": "string",
  "bankAccount": { "accountNumber": "string", "bankName": "string" },
  "TIN": "string",
  "pensionRSA": "string",
  "salaryStructure": { "basic": 0, "housing": 0, "transport": 0, "otherAllowances": 0 }
}
```

**What it does internally, in order:**
1. Verifies the caller is an admin.
2. Creates a Firebase Auth account with a randomly generated temporary password (`generateTempPassword()` in `lib/utils.ts`).
3. Creates the `/employees/{id}` document.
4. Sets custom claims (`role: "employee"`, `employeeId`) on the new Auth account — see `AUTHENTICATION.md` Section 6 for why this matters.
5. Creates the matching `/users/{uid}` document.
6. Emails the new employee their login and temporary password (best-effort — if the email fails to send, the account is still created; it doesn't roll back).

**Response:** `{ "employeeId": "...", "uid": "..." }`

**Errors:** `400` missing fields, `403` caller isn't admin, `500` any other failure.

---

## `POST /api/employees/bank-change-request`

**Purpose:** lets an employee submit a bank-detail change **without** it taking effect immediately.

**Auth required:** Employee only (an admin calling this route would be rejected — this action only makes sense for someone updating their own record).

**Request body:**
```json
{ "accountNumber": "string", "bankName": "string" }
```

**What it does:** writes only to `employee.bankAccountPending` — never touches the real `bankAccount` field. Also creates a notification for every admin, nudging them to review it. The caller's own `employeeId` is taken from their verified token, not from anything the client sends, so there's no way to submit a change for someone else's record by tampering with the request.

**Response:** `{ "ok": true }`

---

## `POST /api/employees/sync-claims`

**Purpose:** (re)sets an employee's custom claims from their current `/employees/{id}` record. Needed for employees created before custom claims existed, or if claims ever drift out of sync for any reason.

**Auth required:** Admin only.

**Request body:**
```json
{ "employeeId": "string" }
```

**What it does:** looks up the employee's linked Auth `uid`, sets `{ role: "employee", employeeId }` as custom claims on that account.

**Response:** `{ "ok": true }`

**Important:** the affected employee must log out and back in before the new claims apply — a custom claim only attaches to a freshly issued login token, not an already-open session.

---

## `POST /api/payroll/run`

**Purpose:** computes (but does not yet send) payslips for every active employee, for one period.

**Auth required:** Admin only.

**Request body:**
```json
{ "period": "2026-07" }
```

**What it does internally:**
1. Fetches the current tax settings (most recent `/taxSettings` version by `effectiveFrom`).
2. Fetches every `active` employee.
3. If any employee has an incomplete salary structure, the whole run is **blocked** and returns which employees are the problem — nothing is written.
4. Otherwise, creates a `/payrollRuns/{runId}` document (`status: "draft"`) and, in one atomic batch write, a `/payslips/{employeeId}` document for every employee, using `computePayslip()` from `lib/tax-engine.ts` (see `CALCULATIONS.md` for the full math).

**Response (success):** `{ "runId": "..." }`

**Response (blocked):**
```json
{ "error": "Some employees have incomplete salary structures.", "blockedEmployees": [{ "id": "...", "name": "..." }] }
```
(HTTP `422`)

---

## `POST /api/payroll/lock`

**Purpose:** finalizes a draft run — generates every PDF, sends every email, and marks the run `locked`. This is the point of no return.

**Auth required:** Admin only.

**Request body:**
```json
{ "runId": "string" }
```

**What it does internally, per employee in the run:**
1. Generates the payslip PDF (`generatePayslipPDF()` in `lib/pdf.ts`).
2. If Cloudinary is configured, uploads the PDF there — **best-effort only**; a failure here does not block the rest of the process.
3. Sends the payslip email (`sendPayslipEmail()` in `lib/email.ts`, using the HTML template in `lib/email-templates.ts`).
4. Writes a `payslip_ready` notification for that employee.
5. Updates the payslip's `emailSentAt` (and `payslipUrl` if the Cloudinary upload succeeded).

Finally, marks the run `status: "locked"` and sets `lockedAt`.

**Response:** `{ "ok": true }`

**Errors:** `400` missing `runId`, `403` not admin, `500` if the run doesn't exist or is already locked.

---

## `POST /api/payroll/resend`

**Purpose:** resends a single employee's payslip email (e.g. they say they never got it).

**Auth required:** Admin only.

**Request body:**
```json
{ "runId": "string", "employeeId": "string" }
```

**What it does:** regenerates the PDF fresh from the stored payslip data (doesn't reuse a cached file) and sends it again, updating `emailSentAt`.

**Response:** `{ "ok": true }`

---

## `GET /api/payroll/[runId]/payslip-pdf?employeeId=...`

**Purpose:** generates a payslip PDF on demand for browser download (the "Download PDF" button).

**Auth required:** Admin (can download **any** employee's payslip) **or** the employee themselves (only their **own** — enforced by comparing the caller's own `employeeId` against the one requested, returning `403` on mismatch).

**Response:** the raw PDF file, `Content-Type: application/pdf`, with a `Content-Disposition` header that names the download `payslip-<employeeIdNumber>-<period>.pdf`.

---

## Quick Reference Table

| Route | Method | Who can call it |
|---|---|---|
| `/api/auth/session` | POST / DELETE | Anyone (session lifecycle only) |
| `/api/employees/create` | POST | Admin |
| `/api/employees/bank-change-request` | POST | Employee (own record only) |
| `/api/employees/sync-claims` | POST | Admin |
| `/api/payroll/run` | POST | Admin |
| `/api/payroll/lock` | POST | Admin |
| `/api/payroll/resend` | POST | Admin |
| `/api/payroll/[runId]/payslip-pdf` | GET | Admin (any), Employee (own only) |
