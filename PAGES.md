# PayrollPadi — PAGES.md

Every page in the app, what it's for, who can see it, and what happens on it. Routes are grouped the way they appear in the URL.

Legend: 🌍 Public · 🔐 Any logged-in user · 👔 Admin only · 🧑 Employee only

---

## Public Pages

### `/` — Landing Page 🌍
**File:** `app/(public)/page.tsx`

The marketing homepage. No login required, no data loaded. A hero section, a live-looking sample payslip card, a features grid, a "how it works" 3-step section, and a call-to-action — all leading to the Login button. Purely presentational; nothing here reads or writes any data.

### `/auth/login` — Login 🌍
**File:** `app/(public)/auth/login/page.tsx`

The only way into the app. Email + password form, no signup link (there isn't one — see `AUTHENTICATION.md` Section 1). On success, redirects to `/dashboard`, which then shows different content depending on the logged-in user's role.

---

## Dashboard — Shared

Every page below lives under `/dashboard/*` and is wrapped by `app/(dashboard)/layout.tsx`, which provides:
- `AuthProvider` — makes the current user's login state and role available everywhere
- `AppShell` — the sidebar (desktop) / bottom tab bar (mobile) + top bar with notification bell and logout

If you're not logged in at all, `middleware.ts` redirects you to `/auth/login` before any of these pages even start loading.

### `/dashboard` — Dashboard Home 🔐 (role-adaptive)
**File:** `app/(dashboard)/dashboard/page.tsx`

Shows **completely different content** depending on role, both handled inside the same file:

- **Admin view:** active employee count, the most recent payroll run (period, status, cost), quick-action buttons (New Payroll Run, Add Employee), and a list of the 5 most recent payroll runs.
- **Employee view:** their latest payslip's net pay with a link to view it in full, plus year-to-date gross earned and year-to-date tax paid, computed by summing every payslip that belongs to them from the current calendar year.

---

## Dashboard — Admin Pages

### `/dashboard/employees` — Employees List 👔
**File:** `app/(dashboard)/dashboard/employees/page.tsx`

Every staff member, searchable by name/ID, filterable by department and status, sortable by clicking column headers. Desktop shows a real table; mobile shows one card per employee. Clicking a row opens that employee's detail page.

### `/dashboard/employees/new` — Add Employee 👔
**File:** `app/(dashboard)/dashboard/employees/new/page.tsx`

The form that creates a brand-new staff member — bio, bank details, tax IDs, salary structure (with a live-updating gross-pay total as you type). Submitting calls `POST /api/employees/create` (see `API_REFERENCE.md`), which does the heavy lifting of creating their login, record, and welcome email in one atomic-feeling action.

### `/dashboard/employees/[id]` — Employee Detail 👔
**File:** `app/(dashboard)/dashboard/employees/[id]/page.tsx`

Everything about one employee: bio/tax IDs (read-only display), an editable salary structure form with a Save button, an Active/Inactive toggle, and — if that employee has requested one — a pending bank-change approval card with an Approve button. Also has the **"Sync Login Permissions"** button, which re-issues that employee's custom claims (needed if they were created before that mechanism existed, or if claims ever drift — see `AUTHENTICATION.md` Section 6).

### `/dashboard/payroll` — Payroll Runs List 👔
**File:** `app/(dashboard)/dashboard/payroll/page.tsx`

Every payroll run ever created, sortable, with period/status/employee-count/total-cost columns. Clicking a row opens that run's detail page.

### `/dashboard/payroll/new` — New Payroll Run 👔
**File:** `app/(dashboard)/dashboard/payroll/new/page.tsx`

A multi-step wizard (`PayrollRunWizard`): pick a period → review the active employee list (blocked if anyone has an incomplete salary structure) → confirm → watch a short progress animation while `POST /api/payroll/run` computes everything → jump straight to the results.

### `/dashboard/payroll/[runId]` — Payroll Run Detail 👔
**File:** `app/(dashboard)/dashboard/payroll/[runId]/page.tsx`

A table of every computed payslip in this run (employee, gross, deductions, net pay). If the run is still `draft`, a **Lock Payroll Run** button appears — clicking it opens a branded confirmation dialog (not a browser popup) before calling `POST /api/payroll/lock`, which is irreversible. Clicking any row jumps into that employee's individual payslip view.

### `/dashboard/tax-settings` — Tax Settings 👔
**File:** `app/(dashboard)/dashboard/tax-settings/page.tsx`

If no tax settings exist yet, shows a **Seed NTA 2025 Defaults** button first. Otherwise: an editable tax-band table (mobile shows one labeled card per band; desktop shows a compact grid), pension/NHF rate inputs, a rent-relief-cap input, and a **Save as New Version** button that always creates a fresh, separate version rather than editing the current one — plus a version history list showing every past version. A visible warning reminds the admin to verify the NTA 2025 bands against current FIRS/NRS guidance before relying on them for a real payroll.

### `/dashboard/reports` — Reports 👔
**File:** `app/(dashboard)/dashboard/reports/page.tsx`

Three summary metric cards (Total Payroll Cost, Total Tax Remitted, Average Net Pay — all computed from **locked runs only**), a payroll-cost-over-time line chart, a department-cost bar chart, and a CSV export button. See `CALCULATIONS.md` Section 11 for exactly how each figure is derived.

### `/dashboard/settings` — Admin Settings 👔
**File:** `app/(dashboard)/dashboard/settings/page.tsx`

Admin's own profile display, a company-name field that persists to `/settings/company` and feeds the payslip PDF header on every subsequently generated PDF (locked runs already emailed keep whatever name was in effect at the time — same immutability principle as everything else on a locked payslip), and a change-password form.

---

## Dashboard — Employee Pages

### `/dashboard/my-payslips` — My Payslips 🧑
**File:** `app/(dashboard)/dashboard/my-payslips/page.tsx`

Every payslip belonging to the logged-in employee, newest first, fetched via a `collectionGroup` query across every payroll run (see `DATABASE.md` Section 5a and `AUTHENTICATION.md` Section 6 for why this specific query needed a non-obvious security-rules fix). Tapping one opens the detail view.

### `/dashboard/my-payslips/[payslipId]` — Payslip Detail 🔐 (shared page, RBAC inside)
**File:** `app/(dashboard)/dashboard/my-payslips/[payslipId]/page.tsx`

This single page is used by **both** roles — an employee viewing their own payslip, and an admin drilling into any employee's payslip from the payroll run detail page. The URL parameter `payslipId` is actually `{runId}_{employeeId}` combined. Inside, the page checks: if the viewer is an employee and this isn't *their* payslip, it refuses to show it (`"You don't have access to this payslip."`) — this is a client-side courtesy check; the real enforcement is still the Firestore rule underneath. Shows the full breakdown (`PayslipBreakdown`), a Download PDF button, and — admin only — a Resend Email button.

### `/dashboard/my-profile` — My Profile 🧑
**File:** `app/(dashboard)/dashboard/my-profile/page.tsx`

Read-only bio and salary info, plus an editable bank-details form. Submitting **never** changes the real bank account directly — it calls `POST /api/employees/bank-change-request`, which writes only to a pending field awaiting admin approval (explained fully in `DATABASE.md` Section 3 and `API_REFERENCE.md`). Also has its own change-password form.

---

## What Happens If You Visit The Wrong Page For Your Role

Every admin-only page starts with the same pattern:

```tsx
if (profile && profile.role !== "admin") {
  toast.error("Admins only.");
  router.replace("/dashboard");
  return;
}
```

So an employee who somehow ends up on, say, `/dashboard/employees` gets an on-screen toast and is bounced straight back to their own dashboard. This is a **user-experience safeguard**, not the actual security boundary — even if this check were somehow skipped entirely, the Firestore reads on that page would still fail against `firestore.rules`, which is the layer that genuinely can't be bypassed. See `AUTHENTICATION.md` Section 5 for the full breakdown of all four protection layers.
