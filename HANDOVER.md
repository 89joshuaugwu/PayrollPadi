# PayrollPadi — HANDOVER.md

**If you are new to this project — whether you can code or not — start here.**

This document explains what PayrollPadi is, how it's built, how to run it, and the important lessons learned while building it. Read this before touching anything.

---

## 1. What Is This, In Plain English

PayrollPadi is a website that calculates salaries and taxes for a company's staff, following Nigeria's 2025 tax law (the Nigeria Tax Act / NTA 2025). Think of it as a digital HR/payroll office:

- A **manager (Admin)** logs in, adds staff members, sets their salaries, and clicks a button once a month to calculate everyone's pay and tax.
- The system **automatically works out** how much tax, pension, and housing fund deduction each person owes, based on Nigerian tax rules.
- Once the manager is happy with the numbers, they click **"Lock"**, and every staff member automatically gets a **PDF payslip emailed to them**.
- Each **staff member (Employee)** can log in separately and see only their own payslips — nothing about anyone else's pay.

It was built as a final-year university project (ESUT Computer Science) but designed to actually be usable by a real small business, not just a demo.

---

## 2. The Two Kinds of Users (Roles)

There are exactly two roles. No others exist.

| Role | Can do |
|---|---|
| **Admin** | Add/edit staff, set tax rules, run and lock payroll, view reports, approve staff bank-detail changes |
| **Employee** | View their own payslips, view their own profile, request a bank-detail change (needs Admin approval to take effect) |

An Employee can never see another employee's data. An Admin can see everything. This is enforced in three separate places (defense-in-depth): the website's own page logic, the server's API routes, and — most importantly — Firebase's own security rules, which is the real gatekeeper no matter what the website's code does.

---

## 3. How To Run It (Quick Version)

Full detail is in `README.md`. Short version:

```bash
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev
```

You need a Firebase project (Firestore + Authentication enabled) and a Gmail account with an "App Password" for sending payslip emails. `README.md` walks through getting each value.

**Every deploy also needs one manual step that cannot be automated:** pasting `firestore.rules` into Firebase Console → Firestore → Rules → **Publish**. If this step is skipped or the rules text is out of date, the whole app will behave as if permissions are broken (see Section 6 for exactly what this looks like and why).

---

## 4. Where Everything Lives (Folder Map)

```
app/                    → Every page and API route (Next.js "App Router")
  (public)/             → Pages anyone can see without logging in (landing page, login)
  (dashboard)/          → Pages that require login (role-gated inside)
  api/                  → Server-only routes (create employee, run payroll, send emails)

components/
  ui/                   → Small reusable pieces (buttons, inputs, modals, the logo)
  molecules/            → Slightly bigger pieces built from ui/ (salary form, tax band editor)
  organisms/            → Full features built from molecules/ (employee table, payroll wizard)
  shells/               → Page frames (the sidebar+topbar layout, the public page layout)

lib/                    → All the actual logic: tax calculations, Firebase setup, email sending
  tax-engine.ts         → THE most important file — every payroll number comes from here
  payroll.ts            → Runs and locks a payroll cycle
  email.ts / pdf.ts      → Payslip email + PDF generation
  data/                  → Functions that read data out of Firestore for the pages to display

types/                  → TypeScript definitions describing the shape of every piece of data

firestore.rules          → Firebase's security rules — who can read/write what. Lives in Firebase
                           Console, NOT deployed with the website code itself.
```

**If you only read one code file to understand this whole project, read `lib/tax-engine.ts`.** Every number the website ever shows a user traces back to that one file. See `CALCULATIONS.md` for the full plain-English walkthrough of the math itself.

---

## 5. Documents In This Handover Package

Read them in whichever order matches what you need — they're written to stand alone, but this is the suggested order for someone starting from zero:

| # | File | Read this if you want to... |
|---|---|---|
| 1 | `HANDOVER.md` (this file) | Understand the project as a whole, for the first time |
| 2 | `ARCHITECTURE.md` | Understand how the pieces fit together — tech stack, request flow, why things are split the way they are |
| 3 | `DATABASE.md` | Understand every piece of data stored, field by field, and how documents relate to each other |
| 4 | `AUTHENTICATION.md` | Understand exactly how login, logout, and role-based access work, step by step |
| 5 | `API_REFERENCE.md` | Understand every server-only route — what it needs, what it does, who can call it |
| 6 | `PAGES.md` | Understand every page in the app — who can see it, what it shows, what it does |
| 7 | `CALCULATIONS.md` | Understand exactly how every number is calculated, with a fully worked example |
| 8 | `README.md` | Set up your own copy, deploy it, follow the deploy checklist |
| — | `PayrollPadi_CONTEXT.md` | The original technical specification (data model, tax engine spec) |
| — | `PayrollPadi_DESIGN.md` | The original design specification (colors, pages, UX flows) |
| — | `PayrollPadi_PROMPT.md` | The original phase-by-phase build plan this project followed |

A non-technical reader can get a complete, accurate picture of the whole system from just this file plus `PAGES.md` — no code-reading required. A developer picking this up should read all seven numbered files above before making changes.

---

## 6. Hard-Won Lessons — Read This Before You Touch Firestore Rules

This section exists because a real, confusing bug happened during development, and future you (or whoever takes this over) should not have to rediscover it the hard way.

### The bug: "Missing or insufficient permissions"

Employees got a permanent loading spinner on their own payslips page, and the browser console showed `FirebaseError: Missing or insufficient permissions.` Every individual piece looked correct: the security rules text was right, the data matched, the required database index was built and enabled. It still failed.

### The real cause

The "My Payslips" feature uses a **`collectionGroup` query** — it searches across every payroll run's `payslips` subcollection at once, rather than one specific folder. Firestore treats these differently from normal single-document reads:

1. For a normal read (`get()`), Firestore can check the rule against the actual document being read — simple.
2. For a **query/list** operation (like collectionGroup), Firestore has to prove, **before running the query at all**, that *every possible document it could return* would pass the security rule — without actually looking at the data yet. If it can't mathematically prove that in advance, it refuses to even attempt the query.

Our original rule compared a document's data to a value looked up from a *separate* document (`get(/users/{uid}).data.employeeId`). Even though that lookup would have produced the correct value at runtime, Firestore's advance-proof system couldn't verify it was safe ahead of time for a list query — so it rejected the whole request.

### The fix

Switch from "look up the value in another document" to **Firebase Auth custom claims** — extra information baked directly into the user's login token itself (`request.auth.token.employeeId`), rather than requiring an extra database lookup. Since the value is already part of the request with no lookup needed, Firestore can prove the rule is safe instantly, every time.

**Practical implication for anyone extending this app:** if you ever add a new feature that queries (not just reads one document) a collection based on "does this belong to me," and your rule needs an extra `get()` call to check ownership, expect this exact same failure. Use a custom claim instead, following the pattern in `app/api/employees/create/route.ts` (`adminAuth.setCustomUserClaims(...)`) and `firestore.rules` (`request.auth.token.employeeId`).

### If an employee was created before this fix existed

Their login token won't have the custom claim yet. Fix: as Admin, open their Employee detail page and click **"Sync Login Permissions"** — then have that employee log out and back in (custom claims only apply on a freshly issued login token, not an already-open session).

---

## 7. Post-Launch Polish Pass (What Changed After The Initial Build)

The original phase-by-phase build (`PayrollPadi_PROMPT.md`) got the system fully working end to end. A follow-up polish pass then addressed real issues found during hands-on testing:

- **Email templates** rebuilt from plain text to proper branded HTML (Indigo/Gold, matching the rest of the app) — `lib/email-templates.ts`.
- **Mobile navigation** fixed — there was no way back to the dashboard home once you navigated away (no nav item pointed at `/dashboard` itself), and the logo was invisible on some mobile browsers due to two SVG instances on the same page reusing identical gradient IDs (`components/ui/LogoIcon.tsx` now generates unique IDs per instance via `useId()`).
- **Mobile logout** added — previously only reachable from the desktop sidebar, not visible at all on a phone.
- **Tax Settings mobile layout** rebuilt — the band editor used to cram four fields into a 2-column grid with labels hidden below desktop width, making it unusable on a phone. Now shows one labeled card per band on mobile.
- **Native browser `confirm()` replaced** with a branded confirmation dialog (`components/ui/ConfirmDialog.tsx`) for the "Lock Payroll Run" action — matches the design system instead of an ugly native browser popup.
- **Landing page redesigned** — animated hero, a live-looking sample payslip preview, a features grid, and a "how it works" section, replacing an earlier bare-bones version.
- **Reports → Total Tax Remitted wired up for real** — previously a placeholder `₦0`, now a genuine sum of PAYE across every payslip in every locked run (`lib/data/payroll.ts`'s `getAllPayslips()`).
- **Company name fully wired into payslip PDFs** — previously a local-only input on the Settings page that didn't persist anywhere. Now saved to `/settings/company` and read fresh by every PDF-generating route (`lib/settings.ts`'s `getCompanyName()`), with the same "already-locked payslips don't retroactively change" principle as everything else in the system.

## 8. Known Scope Decisions (Not Bugs)

State these proactively in any review or defense — they're deliberate, documented choices, not oversights:

- **Rent relief** uses a flat annual cap ÷ 12, not the legally precise `min(20% of actual rent paid, cap)` — there's no `rentPaidAnnual` field on the employee record in this build. See `CALCULATIONS.md` Section 6.
- **NHF's base** (basic salary vs. gross pay) varies by official source — made configurable in Tax Settings rather than silently guessing.
- **No direct bank disbursement** — the system computes and reports net pay; actually paying staff is manual/off-platform.
- **No overtime/bonus/13th-month pay** — base salary structure only.
- **NTA 2025 tax bands** are recent legislation (effective January 2026) — verify against current FIRS/NRS guidance before relying on this for a real payroll, not just a demo.

---

## 9. Common Tasks, Step By Step

**Add a new staff member:** Employees → Add Employee → fill the form → Create Employee. This creates their login, their staff record, and emails them a temporary password automatically.

**Run payroll for a month:** Payroll → New Payroll Run → pick the month → review the employee list (fix anyone flagged with an incomplete salary) → confirm → wait for the progress bar → review the computed numbers.

**Actually pay staff and send payslips:** Open the payroll run you just created (still shows "Draft") → click **Lock Payroll Run** → confirm. This generates every PDF and emails every employee in one action. This step cannot be undone.

**Change a tax rate:** Tax Settings → edit the band/rate → Save as New Version. This does **not** affect any payslip already generated — only future payroll runs use the new rate.

**Approve a bank detail change:** An employee submits a change from their My Profile page. It shows up as a yellow "pending approval" banner on that employee's detail page (Admin view) — click **Approve Bank Change** there.

---

## 10. Who To Contact / Ownership

Built by Joshua Chimaobi Ugwu (Joshuazaza), final-year Computer Science student, Enugu State University of Science and Technology (ESUT). This system is attributed to Joshuazaza per his standing convention for all his platforms (see the "Padi" naming family: AccomPadi, PayrollPadi, and others).
