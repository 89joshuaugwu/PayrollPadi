# PayrollPadi — PROMPT.md

Feed to Antigravity **one phase at a time**, attaching DESIGN.md + CONTEXT.md as context files. Verify each phase runs before moving to the next.

---

## PHASE 0 — Project Bootstrap

```
Using DESIGN.md and CONTEXT.md as reference, bootstrap a new Next.js 16 project named
"payrollpadi" with:

- App Router, TypeScript (strict mode), Tailwind CSS v4, React 19
- Folder structure:
  /app
    /(public)/page.tsx
    /(public)/auth/login/page.tsx
    /(dashboard)/dashboard/page.tsx
    /(dashboard)/dashboard/employees/page.tsx
    /(dashboard)/dashboard/employees/new/page.tsx
    /(dashboard)/dashboard/employees/[id]/page.tsx
    /(dashboard)/dashboard/payroll/page.tsx
    /(dashboard)/dashboard/payroll/new/page.tsx
    /(dashboard)/dashboard/payroll/[runId]/page.tsx
    /(dashboard)/dashboard/tax-settings/page.tsx
    /(dashboard)/dashboard/reports/page.tsx
    /(dashboard)/dashboard/settings/page.tsx
    /(dashboard)/dashboard/my-payslips/page.tsx
    /(dashboard)/dashboard/my-payslips/[payslipId]/page.tsx
    /(dashboard)/dashboard/my-profile/page.tsx
    /api/employees/create/route.ts
    /api/payroll/run/route.ts
    /api/payroll/lock/route.ts
    /api/employees/bank-change-request/route.ts
  /components
    /ui         → Button, Input, Select, DatePicker, StatusBadge, DataTable, Card, Spinner, Toast, Modal
    /molecules  → EmployeeRow, SalaryStructureForm, TaxBandEditor, PayslipBreakdown, PayrollRunProgress, NotificationBell
    /organisms  → EmployeeManagementTable, PayrollRunWizard, PayslipDetailView, TaxSettingsPanel, ReportsDashboard, MyPayslipsList
    /shells     → AppShell, PublicShell
  /lib
    /firebase.ts, /firebase-admin.ts
    /tax-engine.ts        → computePAYE(), computePayslip() exactly per CONTEXT.md Section 3
    /payroll.ts           → runPayroll(), lockPayrollRun() per CONTEXT.md Section 4
    /email.ts             → sendPayslipEmail() per CONTEXT.md Section 7
    /pdf.ts               → generatePayslipPDF() matching DESIGN.md Section 6 layout
  /types
    /employee.ts, /taxSettings.ts, /payrollRun.ts, /payslip.ts, /user.ts

Install: firebase, firebase-admin, nodemailer, jspdf, jspdf-autotable, cloudinary,
framer-motion, lucide-react, react-hot-toast, date-fns, recharts.

Set up Tailwind CSS v4 theme using exact Indigo/Gold palette from DESIGN.md Section 1
(#4F46E5 primary, Off-White #F8FAFC background, light mode only). Enable
`tabular-nums` utility for all salary/deduction display per DESIGN.md typography notes.

Do not scaffold page content yet — folder structure, typed empty components,
Firebase + Cloudinary + Gmail SMTP config with placeholder env vars, working `npm run dev`.

Output .env.local.example with all keys from CONTEXT.md Section 8.
```

---

## PHASE 1 — Auth (Login Only, Admin + Employee Provisioning)

```
Using DESIGN.md "Login" section and CONTEXT.md Sections 2 and 5 (RBAC), build:

1. /app/(public)/auth/login/page.tsx
2. /lib/auth.ts — loginWithEmail, logout
3. /components/shells/PublicShell.tsx
4. middleware.ts protecting /dashboard/* with role-based sub-route guards
   (employee-only routes reject admin viewing as themselves and vice versa
   where it doesn't make sense — admin should still be able to view any
   employee's payslip via the admin payroll views, just not via
   /dashboard/my-payslips which is employee-self-only)

Requirements:
- Email/password login only, no signup page, no Google OAuth
- On login: read /users/{uid}.role, redirect admin and employee to the same
  /dashboard entry point which then renders differently per DESIGN.md's
  role-adaptive dashboard home
- Centered form per DESIGN.md, Indigo focus ring
- react-hot-toast for errors

Complete, deployable files.
```

---

## PHASE 2 — App Shell, Dashboard Home, Employee Management

```
Using DESIGN.md "Navigation", "Dashboard Home", and "Employees" sections and
CONTEXT.md Section 2, build:

1. /components/shells/AppShell.tsx
2. /app/(dashboard)/dashboard/page.tsx
3. /app/(dashboard)/dashboard/employees/page.tsx
4. /app/(dashboard)/dashboard/employees/new/page.tsx
5. /app/(dashboard)/dashboard/employees/[id]/page.tsx
6. /components/organisms/EmployeeManagementTable.tsx
7. /components/molecules/SalaryStructureForm.tsx
8. /app/api/employees/create/route.ts
9. /lib/notifications.ts — basic bell wiring

Requirements:
- AppShell: role-adaptive sidebar (admin: Employees/Payroll/Tax
  Settings/Reports/Settings, employee: My Payslips/My Profile), bottom tab
  bar mobile
- Dashboard home: role-adaptive per DESIGN.md — admin sees stats + quick
  actions, employee sees latest payslip summary card
- Employee Management: full CRUD (admin only — route-guard employees away
  with a toast), SalaryStructureForm computes gross live as fields are entered
- /api/employees/create: server route using firebase-admin creates the
  Firebase Auth account (temp password) AND the /employees doc AND the
  /users/{uid} doc with role: "employee", employeeId set — client never
  has admin SDK access for this
- NotificationBell: badge + dropdown, real-time via onSnapshot

Complete, deployable files.
```

---

## PHASE 3 — Tax Settings Engine (NTA 2025 Bands, Configurable)

```
Using DESIGN.md "Tax Settings" section and CONTEXT.md Sections 3 and 6, build:

1. /app/(dashboard)/dashboard/tax-settings/page.tsx
2. /components/organisms/TaxSettingsPanel.tsx
3. /components/molecules/TaxBandEditor.tsx
4. /lib/tax-engine.ts — computePAYE() exactly per CONTEXT.md Section 3, fully typed

Requirements:
- Seed the FIRST /taxSettings/{versionId} doc on initial setup with the
  exact NTA 2025 bands from CONTEXT.md Section 3 (0% to ₦800k, 15% to ₦3M,
  18% to ₦10M, 21% to ₦25M, 23% to ₦50M, 25% above), default pensionRate
  0.08, nhfRate 0.025, rentReliefCapAnnual 500000
- TaxBandEditor: editable table, add/remove bands, live validation that
  bands are contiguous (each band's min == previous band's max) and the
  last band has max: null
- Saving creates a NEW versioned doc (per CONTEXT.md's immutability note) —
  never overwrites the previous version, shows a version history list with
  effectiveFrom dates
- computePAYE(): implement exactly per CONTEXT.md Section 3's function,
  return both totalTax and the itemized breakdown array (needed for the
  payslip's per-band display in Phase 5)
- Route guard: admin only

Complete, deployable files. This is a foundational phase — Phase 4's payroll
run depends entirely on this tax engine being correct.
```

---

## PHASE 4 — Payroll Run (Batch Computation)

```
Using DESIGN.md "Payroll Runs" and "New Payroll Run" sections and CONTEXT.md
Section 4, build:

1. /app/(dashboard)/dashboard/payroll/page.tsx
2. /app/(dashboard)/dashboard/payroll/new/page.tsx
3. /app/(dashboard)/dashboard/payroll/[runId]/page.tsx
4. /components/organisms/PayrollRunWizard.tsx
5. /components/molecules/PayrollRunProgress.tsx
6. /app/api/payroll/run/route.ts
7. /lib/payroll.ts — runPayroll() exactly per CONTEXT.md Section 4

Requirements:
- PayrollRunWizard: step 1 select period, step 2 review active employee
  list (flag and block on any employee with an incomplete salary structure
  — missing basic/housing/transport values), step 3 confirm, triggers
  /api/payroll/run
- /api/payroll/run: server-side, uses firebase-admin, calls
  computePayslip() (from Phase 3's tax-engine.ts, extended per CONTEXT.md
  Section 3's full computePayslip function) for every active employee,
  batch-writes all /payrollRuns/{runId}/payslips/{employeeId} docs,
  locks in taxSettingsVersionUsed to the CURRENT tax settings version at
  run time (never a version that gets superseded later)
- PayrollRunProgress: shows live "Processing X of Y employees..." — since
  Firestore batch writes are near-instant at FYP scale, this can be a
  short simulated progress animation rather than true incremental server
  progress, but should feel responsive per DESIGN.md
- Run detail page: table of computed payslips (employee, gross, deductions,
  net pay), status badge, "Lock Payroll Run" button only shown if status
  is "draft"

Complete, deployable files. Do NOT implement lockPayrollRun() (email +
PDF generation) yet — that's Phase 5. This phase only computes and stores
draft payslip data.
```

---

## PHASE 5 — Lock Payroll Run: PDF Generation + Email Delivery

```
Using DESIGN.md "Payslip PDF Layout" section and CONTEXT.md Sections 4 and 7, build:

1. /app/api/payroll/lock/route.ts
2. /lib/pdf.ts — generatePayslipPDF() matching the exact layout in
   DESIGN.md Section 6 (company header, Earnings/Deductions two-column,
   Net Pay prominently highlighted, tax band version footer note)
3. /lib/email.ts — sendPayslipEmail() exactly per CONTEXT.md Section 7
4. /components/organisms/PayslipDetailView.tsx (used both in admin payroll
   run detail and employee my-payslips views)

Requirements:
- /api/payroll/lock: server-side, iterates every payslip in the run,
  generates a PDF per employee, sends via Gmail SMTP, writes a
  "payslip_ready" notification to each employee, updates
  payslip.emailSentAt, finally updates the run's status to "locked"
- If Cloudinary env vars are present, also upload each PDF and store the
  URL in payslip.payslipUrl for later re-download from
  /dashboard/my-payslips — treat this as optional/best-effort, don't block
  the lock operation if the upload fails, email delivery is the primary
  requirement
- PayslipDetailView: renders the same breakdown as the PDF on-screen,
  including the per-band PAYE breakdown table (from computePAYE's
  breakdown array), Gold-highlighted net pay figure, [Download PDF] and
  [Resend Email] buttons (resend only visible to admin)

Complete, deployable files. This is the highest-stakes phase alongside
Phase 3 — the payslip must be immutable once generated (matches the
Firestore rule "allow write: if getRole() == admin" only, no further
edits once locked).
```

---

## PHASE 6 — Employee Self-Service (My Payslips, My Profile)

```
Using DESIGN.md "My Payslips" and "My Profile" sections and CONTEXT.md
Section 5 RBAC, build:

1. /app/(dashboard)/dashboard/my-payslips/page.tsx
2. /app/(dashboard)/dashboard/my-payslips/[payslipId]/page.tsx
3. /app/(dashboard)/dashboard/my-profile/page.tsx
4. /components/organisms/MyPayslipsList.tsx
5. /app/api/employees/bank-change-request/route.ts

Requirements:
- My Payslips: query all /payrollRuns/*/payslips/{myEmployeeId} across
  runs (use a collectionGroup query on "payslips" filtered by matching
  the doc ID or an embedded employeeId field — add an employeeId field to
  each payslip doc if not already present, to make this collectionGroup
  query clean), list newest first, tap → detail (reuses PayslipDetailView
  from Phase 5 in read-only mode)
- My Profile: read-only bio/salary structure fields, editable bank account
  fields that submit to /api/employees/bank-change-request instead of
  writing directly — this route writes to employee.bankAccountPending
  only, per CONTEXT.md Section 6's security rule intent, and notifies
  admin ("bank_change_pending" notification type)
- Admin needs a small approval action added to the employee detail page
  (from Phase 2) — if bankAccountPending is set, show an "Approve bank
  change" button that copies pending → bankAccount and clears the pending field

Complete, deployable files.
```

---

## PHASE 7 — Reports & Final Polish

```
Using DESIGN.md "Reports" section, build:

1. /app/(dashboard)/dashboard/reports/page.tsx
2. /components/organisms/ReportsDashboard.tsx
3. /app/(dashboard)/dashboard/settings/page.tsx

Requirements:
- Reports (admin only): date range picker, metrics cards (total payroll
  cost, total tax remitted, average net pay across active employees),
  payroll cost trend line chart (Recharts, Indigo stroke), department cost
  breakdown bar chart, CSV/PDF export
- Settings: admin profile, company name/logo (used in payslip PDF header
  from Phase 5 — wire this in if not already), password change
- Final polish pass: verify tabular-nums applied consistently across every
  salary/deduction display, verify all payslip PDFs correctly reference
  their locked taxSettingsVersionUsed (test by changing tax settings
  AFTER a run is locked and confirming the old payslip is unaffected),
  mobile viewport audit for My Payslips / My Profile (employee-facing
  pages get real mobile traffic per DESIGN.md)

Complete, deployable files. Final phase before deploy.
```

---

## Deploy Checklist

```
1. Push to GitHub (89joshuaugwu/payrollpadi or similar)
2. Connect to Vercel, set all env vars from CONTEXT.md Section 8
3. ⚠️ MANUAL STEP — Firebase Console → Firestore Rules → paste from
   CONTEXT.md Section 6 → click Publish.
4. Firebase Console → Authentication → enable Email/Password provider only
5. ⚠️ BOOTSTRAP STEP — no public signup exists. Create the first admin
   manually: add a user in Firebase Console → Authentication, then create
   the matching /users/{uid} doc in Firestore Console with role: "admin".
   Every employee account after that goes through
   /dashboard/employees/new (Phase 2), which uses this first admin's session.
6. Gmail SMTP — confirm the 16-digit app password is set correctly
   (regular Gmail password will fail silently or reject)
7. Seed the initial /taxSettings/{versionId} doc with NTA 2025 defaults
   per Phase 3, either via a one-time admin UI action or a manual Firestore
   Console entry before running your first payroll
8. Test full flow: add 2-3 test employees with complete salary structures →
   run payroll for a test period → verify computed PAYE matches a manual
   calculation using the NTA 2025 bands → lock the run → confirm payslip
   emails arrive with correct PDF attachments → log in as one of the test
   employees → confirm they see only their own payslip in /my-payslips,
   not others' → submit a bank detail change as employee → confirm it
   shows as pending, not immediately applied → approve as admin → confirm
   it updates
9. Test the immutability guarantee: after locking a run, change a tax band
   in /dashboard/tax-settings, run a NEW payroll period, confirm the OLD
   locked run's payslips still show the OLD tax settings version, not the
   new one
```

---

Run in order, verify each phase (`npm run dev`, click through) before starting the next.
