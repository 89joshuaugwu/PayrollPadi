# PayrollPadi — Test Cases

Use this to walk the whole app before your defense. Test as **Admin** and as **Employee** — create one test admin and 2-3 test employees first (see Setup).

Status legend: ☐ Not tested · ✅ Pass · ❌ Fail

---

## 0. Setup (do this first)

| # | Step | Expected Result | Status |
|---|---|---|---|
| 0.1 | Firebase Console → create bootstrap admin user (Auth) + matching `/users/{uid}` doc with `role: "admin"` (not `roll`), `employeeId: null` | Doc saves without error | ☐ |
| 0.2 | Log in as bootstrap admin | Lands on `/dashboard`, sidebar shows Employees / Payroll / Tax Settings / Reports / Settings | ☐ |
| 0.3 | Tax Settings page → Seed NTA 2025 Defaults | Toast confirms save; 6 bands appear (₦0–800k 0%, up to 25% above ₦50M) | ☐ |
| 0.4 | Add 3 test employees with complete salary structures via Employees → Add Employee | Each gets a Firebase Auth account + temp password email + Firestore employee doc | ☐ |

---

## 1. Authentication & RBAC

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 1.1 | Visit `/dashboard` while logged out | Redirected to `/auth/login` | ☐ |
| 1.2 | Login with wrong password | Toast: "Invalid email or password." Stays on login page | ☐ |
| 1.3 | Login with correct admin credentials | Redirected to `/dashboard`, admin nav shown | ☐ |
| 1.4 | Login with correct employee credentials | Redirected to `/dashboard`, employee nav shown (My Payslips / My Profile only) | ☐ |
| 1.5 | As employee, manually visit `/dashboard/employees` | Toast "Admins only.", redirected back to `/dashboard` | ☐ |
| 1.6 | As employee, manually visit `/dashboard/tax-settings` | Toast "Admins only.", redirected back to `/dashboard` | ☐ |
| 1.7 | As employee, manually visit `/dashboard/reports` | Toast "Admins only.", redirected back to `/dashboard` | ☐ |
| 1.8 | As employee, manually visit `/dashboard/payroll` | Toast "Admins only.", redirected back to `/dashboard` | ☐ |
| 1.9 | Click Logout (either role) | Session cookie cleared, redirected to `/auth/login`, `/dashboard` now inaccessible | ☐ |
| 1.10 | Try `/auth/login` while already logged in | Should still render (no forced redirect) — acceptable either way, just confirm no crash | ☐ |

---

## 2. Admin — Employee Management

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 2.1 | Employees list page loads | Table (desktop) / cards (mobile) show all employees, gross pay in ₦, status badge | ☐ |
| 2.2 | Search by name and by employee ID | List filters live | ☐ |
| 2.3 | Filter by department, filter by status | List narrows correctly | ☐ |
| 2.4 | Sort by clicking "Gross Pay" column header | List re-sorts ascending, click again → descending | ☐ |
| 2.5 | Add Employee → submit with all fields filled | Redirected to new employee detail page; temp password email sent | ☐ |
| 2.6 | Add Employee → leave Name blank, submit | Browser required-field validation blocks submit | ☐ |
| 2.7 | Employee detail page → edit salary structure, Save | Firestore `salaryStructure` updates; gross recalculates live while typing | ☐ |
| 2.8 | Employee detail page → Mark Inactive | Status badge flips to Inactive; employee excluded from next payroll run | ☐ |
| 2.9 | Mark the same employee Active again | Status flips back, employee included in payroll again | ☐ |

---

## 3. Employee Self-Service — Bank Change Approval Flow

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 3.1 | As employee, go to My Profile → submit new bank account + bank name | Toast: "Bank change submitted — pending admin approval." | ☐ |
| 3.2 | Still as employee, reload My Profile | Yellow "pending admin approval" banner shows the submitted details; **bankAccount itself is unchanged** | ☐ |
| 3.3 | As admin, open that employee's detail page | Amber "Bank Change Pending Approval" card appears with the submitted details | ☐ |
| 3.4 | Admin clicks "Approve Bank Change" | `bankAccount` updates to the new details, `bankAccountPending` clears, card disappears | ☐ |
| 3.5 | As employee, reload My Profile | Pending banner gone, bank fields show the approved new details | ☐ |
| 3.6 | (Security) As employee, try calling `/api/employees/bank-change-request` for a **different** employeeId via browser devtools | Rejected — route only ever writes to the caller's own `employeeId` from their verified token, never a client-supplied one | ☐ |

---

## 4. Tax Settings (Admin only)

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 4.1 | Tax Settings page shows current NTA 2025 bands | 6 rows, rates 0/15/18/21/23/25%, last row "No limit" | ☐ |
| 4.2 | Edit a band's rate, Save as New Version | New `/taxSettings` doc created; Version History list grows by one; **old version still visible in history, unedited** | ☐ |
| 4.3 | Try saving bands with a gap (e.g. band 1 max ≠ band 2 min) | Red validation message shown, save blocked | ☐ |
| 4.4 | Try saving bands where the last band has a max value (not blank) | Validation error: "The last band must have no upper bound." | ☐ |
| 4.5 | Add a band via "+ Add Band", remove one via trash icon | Table updates live, contiguity re-validates | ☐ |
| 4.6 | Edit Pension Rate / NHF Rate / Rent Relief Cap, save | New version reflects new values in Version History row | ☐ |

---

## 5. Payroll Run — Compute (Admin only)

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 5.1 | Payroll → New Payroll Run → Step 1 select a period | "Next" enabled once a month/year is chosen | ☐ |
| 5.2 | Step 2 with all active employees having complete salary structures | No warning shown, "Next" enabled | ☐ |
| 5.3 | Step 2 with one active employee missing a salary field | Amber warning lists the blocked employee by name, "Next" disabled | ☐ |
| 5.4 | Fix that employee's salary structure (back to Employees), retry wizard | Warning clears, wizard proceeds | ☐ |
| 5.5 | Step 3 Confirm → Run Payroll | Progress bar animates "Processing X of Y…", then "View Results" appears | ☐ |
| 5.6 | Click View Results | Lands on run detail page, status badge = **Draft** | ☐ |
| 5.7 | Manually verify one employee's PAYE by hand using the NTA 2025 bands | Matches the app's computed `payeTax` for that employee (within rounding) | ☐ |
| 5.8 | Check `taxSettingsVersionUsed` on the run matches the tax settings version that was current **at run time** | Matches | ☐ |

---

## 6. Payroll Run — Lock, PDF, Email (Admin only)

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 6.1 | On a Draft run, click "Lock Payroll Run" | Confirm dialog appears warning it's irreversible | ☐ |
| 6.2 | Confirm | Toast: "Payroll run locked and payslips sent."; status badge flips to **Locked** | ☐ |
| 6.3 | Check each test employee's inbox | Email received, subject "Your Payslip is Ready", PDF attached | ☐ |
| 6.4 | Open the attached PDF | Matches on-screen layout: company header, Earnings/Deductions two columns, Gold Net Pay bar, PAYE band breakdown table, version footnote | ☐ |
| 6.5 | On a Locked run, click a payslip row → payslip detail | "Resend Email" button visible (admin only) | ☐ |
| 6.6 | Click Resend Email | Toast: "Payslip email resent."; employee gets a second email | ☐ |
| 6.7 | Click "Download PDF" on the same payslip | Browser downloads `payslip-<employeeId>-<period>.pdf` | ☐ |
| 6.8 | Try locking a run that's already Locked (e.g. by re-POSTing) | Server rejects with "Payroll run is already locked." | ☐ |

---

## 7. Immutability Guarantee (the one a panel will ask about)

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 7.1 | Lock a payroll run for Period A | Run status = Locked | ☐ |
| 7.2 | Go to Tax Settings, change a band's rate, save as new version | New tax settings version created | ☐ |
| 7.3 | Go back to the **already-locked** Period A run's payslips | PAYE figures and `taxSettingsVersionUsed` are **unchanged** — still reference the old version | ☐ |
| 7.4 | Run a **new** payroll for Period B | New run's `taxSettingsVersionUsed` references the **new** version, and computed PAYE reflects the new rate | ☐ |
| 7.5 | Compare Period A vs Period B payslips for an employee with identical salary | Different PAYE amounts, proving the version lock works | ☐ |

---

## 8. Employee Self-Service — My Payslips

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 8.1 | As employee, go to My Payslips | Lists only **that employee's** payslips, newest period first | ☐ |
| 8.2 | Tap a payslip | Opens detail view (read-only, no Resend Email button) | ☐ |
| 8.3 | Click Download PDF | Downloads correctly | ☐ |
| 8.4 | (Security) As Employee A, manually change the URL to Employee B's `runId_employeeId` | Page shows "You don't have access to this payslip." | ☐ |
| 8.5 | (Security) As Employee A, call the PDF download API with Employee B's `employeeId` query param | API returns 403 Forbidden | ☐ |
| 8.6 | Dashboard Home as employee | Shows latest payslip net pay + "View full payslip" link, YTD gross/tax stats | ☐ |

---

## 9. Reports (Admin only)

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 9.1 | Reports page with at least one Locked run | Total Payroll Cost, Average Net Pay populate with real numbers | ☐ |
| 9.2 | Payroll Cost Trend chart | Line chart shows one point per locked period | ☐ |
| 9.3 | Department Cost Breakdown chart | Bar per department, height matches sum of that department's gross pay | ☐ |
| 9.4 | Export CSV | Downloads a `.csv` with Period, Status, Employee Count, Total Cost columns | ☐ |

---

## 10. Notifications

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 10.1 | As employee, after a run is locked, check the bell icon | Unread badge appears; dropdown shows "Your payslip for [period] is ready." | ☐ |
| 10.2 | Click the notification | Marks as read, badge count decreases | ☐ |
| 10.3 | As admin, after an employee submits a bank change | Notification appears in admin's bell | ☐ |

---

## 11. Mobile Responsiveness

Resize browser to ~375px width (or use devtools device toolbar) and repeat the key flows:

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 11.1 | Dashboard on mobile | Bottom tab bar replaces sidebar, top bar shows compact logo | ☐ |
| 11.2 | Employees list on mobile | Card-per-row layout instead of table | ☐ |
| 11.3 | Payroll Run Wizard on mobile | Steps stack full-screen, buttons remain reachable (44px+ tap targets) | ☐ |
| 11.4 | My Payslips / My Profile on mobile | Fully usable one-handed, no horizontal scroll | ☐ |

---

## 12. Edge Cases

| # | Steps | Expected Result | Status |
|---|---|---|---|
| 12.1 | Run payroll with zero active employees | Wizard proceeds but produces a run with `employeeCount: 0` — decide if you want to block this explicitly before defense | ☐ |
| 12.2 | Employee with all voluntary deductions exceeding gross pay | `netPay` goes negative — decide if you want to floor at 0 or flag it; currently unhandled | ☐ |
| 12.3 | Two admins editing the same employee's salary structure at the same time | Last write wins (no conflict warning) — acceptable for FYP scope, worth stating if asked | ☐ |
| 12.4 | Cloudinary env vars left blank | Lock still succeeds, `payslipUrl` stays `null`, email still sends (per CONTEXT.md — this is by design, not a bug) | ☐ |

---

## Known Gaps to State Proactively (not bugs — documented scope decisions)

- Rent relief uses a flat annual cap ÷ 12, not `min(20% of actual rent, cap)` — no `rentPaidAnnual` field in this build.
- "Total Tax Remitted" on Reports is a placeholder (₦0) — needs a `collectionGroup` aggregation over payslips, not yet wired.
- No direct bank disbursement — net pay is computed/reported only, actual payment is manual/off-platform.
- No overtime/bonus/13th-month pay computation.
- NTA 2025 bands should be verified against current FIRS/NRS guidance before final submission — flag this yourself if asked.
