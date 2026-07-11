# PayrollPadi — DESIGN.md

**Product:** Payroll Management System — automated salary computation with Nigeria Tax Act 2025 (NTA) compliant PAYE, statutory deductions, payslip generation, admin dashboard for HR/Finance + employee self-service.
**Target:** HR/Finance staff (primary), employees (self-service, secondary). Desktop-primary for admin work, mobile-capable for employee payslip checks.
**Status:** Production-ready spec for Next.js 16 + Tailwind CSS v4 + React 19.
**Cost:** $0 infra (Firebase Spark, Cloudinary free tier, Vercel free tier) + Gmail SMTP for payslip email delivery.

---

## 1. Brand Identity

### Name & Positioning
**PayrollPadi** — consistent with your Padi naming family (AccomPadi, SparePadi). "Padi" signals reliability for something as sensitive as salary and tax accuracy.

### Color Palette — Light Mode, Financial/Trust

**Why light mode:** Same reasoning as PharmaLedger and SparePadi — this is a numbers-dense tool (salary figures, tax breakdowns, deduction tables) that needs high-contrast, accurately-readable tabular data, not a dark theme.

| Role | Color | Hex | Use |
|---|---|---|---|
| Primary | Indigo | `#4F46E5` | Primary buttons, active nav, brand accents |
| Primary Dark | Deep Indigo | `#4338CA` | Hover states, headings |
| Accent | Gold | `#D4A017` | Payslip highlights, "Net Pay" emphasis, premium/finalized states |
| Success | Green | `#16A34A` | Payroll run completed, payment confirmed |
| Warning | Amber | `#D97706` | Draft/pending payroll run, incomplete employee records |
| Error | Red | `#DC2626` | Failed computation, missing required field |
| Background | Off-White | `#F8FAFC` | Main app background |
| Card BG | White | `#FFFFFF` | Cards, tables |
| Border | Slate 200 | `#E2E8F0` | Dividers, table borders |
| Text Primary | Slate 900 | `#0F172A` | Headings |
| Text Secondary | Slate 500 | `#64748B` | Labels, metadata |

### Typography
- **Headings:** Inter Bold 700
- **Body:** Inter Regular 400
- **Numeric/tabular:** Inter with `tabular-nums` — non-negotiable for salary/deduction columns, consistent with your PharmaLedger and SparePadi convention
- **Mono:** JetBrains Mono — payslip reference numbers, TIN/RSA numbers

### Animations (Framer Motion — minimal, function over flourish)
- Payroll run processing: progress bar fills as each employee is computed, live count "Processing 12 of 45 employees..."
- Payslip generated: checkmark + subtle Gold flash on the row
- Net pay reveal: number count-up animation on payslip view (0.4s ease-out)
- Page transition: fade, 0.15s
- Table row highlight on real-time update: brief Indigo flash

---

## 2. Page Map & Routing

```
/                                       # Public landing (marketing only)
  ├─ /auth/login                        # Shared login — NO public signup
  │
/dashboard                              # Authenticated root — content varies by role
  ├─ /dashboard                         # Home — role-specific
  │
  # Admin (HR/Finance) routes
  ├─ /dashboard/employees               # Employee list
  ├─ /dashboard/employees/new           # Add employee (creates Auth account + record)
  ├─ /dashboard/employees/[id]          # Employee detail — salary structure, history
  ├─ /dashboard/payroll                 # Payroll runs list
  ├─ /dashboard/payroll/new             # Start a new payroll run
  ├─ /dashboard/payroll/[runId]         # Run detail — per-employee computed payslips
  ├─ /dashboard/tax-settings            # Configurable tax bands, pension/NHF rates, rent relief cap
  ├─ /dashboard/reports                 # Payroll cost trends, tax remittance summary
  ├─ /dashboard/settings                # Admin profile, company info
  │
  # Employee self-service routes
  ├─ /dashboard/my-payslips             # List of own payslips, download PDF
  ├─ /dashboard/my-payslips/[payslipId] # Individual payslip detail view
  ├─ /dashboard/my-profile              # Read-only bio + salary structure, editable bank details
```

---

## 3. Component Architecture

### Shells
- **AppShell** — top bar (logo, notification bell, user menu), sidebar nav desktop (role-adaptive: admin sees Employees/Payroll/Tax Settings/Reports, employee sees only My Payslips/My Profile), bottom tab bar mobile

### Atoms
- **Button** — primary (Indigo), secondary (outline), danger (Red), success (Green)
- **Input / Select / DatePicker** — 44px mobile / 40px desktop, Slate border, Indigo focus ring
- **StatusBadge** — Draft (amber) / Locked (green) / Processing (indigo, pulsing) / Active (green) / Inactive (gray)
- **DataTable** — sortable, `tabular-nums` for all salary/deduction columns, sticky header
- **Card**, **Spinner**, **Toast**, **Modal**

### Molecules
- **EmployeeRow** — name, employee ID, department, gross pay, status badge
- **SalaryStructureForm** — basic, housing, transport, other allowances → auto-computed gross
- **TaxBandEditor** — editable table of bands (min, max, rate) with add/remove row, live validation that bands are contiguous and non-overlapping
- **PayslipBreakdown** — itemized: Gross → deductions (pension, NHF, NHIS, rent relief) → chargeable income → PAYE (per band, shown as a mini-breakdown) → net pay, Gold-highlighted net pay figure
- **PayrollRunProgress** — live progress bar during batch computation
- **NotificationBell** — badge, dropdown, real-time via `onSnapshot`

### Organisms
- **EmployeeManagementTable** — full CRUD, filter by department/status
- **PayrollRunWizard** — select period → review active employee list → confirm → trigger batch computation → review results → lock
- **PayslipDetailView** — full payslip render (PDF-matching layout), download/email buttons
- **TaxSettingsPanel** — TaxBandEditor + pension/NHF rate inputs + rent relief cap input, versioned (see CONTEXT.md — old rates must remain attached to historical payslips)
- **ReportsDashboard** — payroll cost trend chart (Recharts), department cost breakdown, tax remittance summary
- **MyPayslipsList** — employee's own payslip history, tap → detail

---

## 4. Mobile-First / Responsive Spec

Desktop-primary for admin (payroll runs, tax settings are detailed data-entry work), fully responsive for employee self-service (staff will check payslips on mobile).

### Breakpoints
- Mobile: 320–767px
- Desktop: 1025px+ (primary for admin flows)

### Mobile Patterns
- Admin DataTables: card-per-row on mobile
- Employee "My Payslips": clean card list, tap → full payslip view, sticky "Download PDF" button
- Payroll Run Wizard: step-by-step full-screen flow on mobile rather than a single dense form

---

## 5. Page-by-Page UX Flow

### Login (/auth/login) — only auth entry point
```
[Centered form]
[Email] [Password]
[Login button]
[No signup link]
```

### Dashboard Home — role-adaptive

**Admin view:**
```
[Stats row: Active employees: 45 | Last payroll run: June 2026 (Locked) |
 Total payroll cost (last run): ₦12,400,000]
[Quick actions: New Payroll Run | Add Employee]
[Recent activity: "Payroll run for July 2026 started" / "3 employees added"]
```

**Employee view:**
```
[Latest payslip summary card: Net pay for [Month], "View full payslip" link]
[Quick stats: YTD gross earned, YTD tax paid]
```

### Employees (/dashboard/employees) — admin only
```
[EmployeeManagementTable: name, department, gross pay, status]
[+ Add Employee button]
[Tap row → employee detail]
```

### Add Employee (/dashboard/employees/new)
```
[Bio: name, email, department, employeeIdNumber]
[Bank details: account number, bank name]
[Tax IDs: TIN, pension RSA number]
[SalaryStructureForm: basic, housing, transport, other allowances → gross auto-computed]
[Submit] → creates Firebase Auth account (temp password) + /employees doc,
  employee receives login email with temp credentials
```

### Payroll Runs (/dashboard/payroll) — admin only
```
[List of past runs: period, status badge, total cost, employees processed]
[+ New Payroll Run button]
```

### New Payroll Run (/dashboard/payroll/new) — PayrollRunWizard
```
[Step 1: Select period (month/year)]
[Step 2: Review active employee list — confirm all salary structures are complete]
  [If any employee has an incomplete salary structure: flag it, block until fixed]
[Step 3: Confirm — "Run payroll for July 2026 (45 employees)"]
[PayrollRunProgress: "Processing 12 of 45..."]
[Step 4: Results review — per-employee computed net pay, any computation errors flagged]
[Lock Payroll Run button] → status becomes "locked", triggers payslip PDF generation
  + email delivery to each employee
```

### Payroll Run Detail (/dashboard/payroll/[runId])
```
[Header: Period | StatusBadge]
[Table: employee, gross, deductions total, net pay]
[Tap row → PayslipDetailView for that employee]
[If status is "draft": edit/re-run option]
[If "locked": read-only, "Resend payslip email" per row]
```

### Tax Settings (/dashboard/tax-settings) — admin only
```
[TaxBandEditor — current bands per NTA 2025:
  ₦0–800,000: 0% | ₦800,001–3,000,000: 15% | ₦3,000,001–10,000,000: 18%
  ₦10,000,001–25,000,000: 21% | ₦25,000,001–50,000,000: 23% | Above ₦50,000,000: 25%]
[Pension rate input] [NHF rate input] [Rent relief cap input]
[Save button — creates a NEW versioned settings doc, does not overwrite the
 old one, per CONTEXT.md's payslip-immutability requirement]
[History: previous rate versions with effective dates]
```

### Reports (/dashboard/reports) — admin only
```
[Date range picker]
[Metrics: total payroll cost, total tax remitted, average net pay]
[Trend chart: payroll cost by month]
[Department cost breakdown — bar chart]
[Export CSV/PDF]
```

### My Payslips (/dashboard/my-payslips) — employee
```
[List: period, net pay, [View] [Download PDF]]
[Tap → PayslipDetailView (read-only)]
```

### Payslip Detail (/dashboard/my-payslips/[payslipId] or admin equivalent)
```
[Company header, employee name, period]
[Earnings: Basic, Housing, Transport, Other Allowances → Gross]
[Deductions: Pension, NHF, NHIS, PAYE (with band breakdown shown) → Total Deductions]
[Net Pay — large, Gold-highlighted]
[Download PDF] [Email to me] buttons
```

### My Profile (/dashboard/my-profile) — employee
```
[Read-only: name, department, employeeIdNumber, TIN, RSA number, salary structure]
[Editable: bank account details — changes require admin approval before taking effect,
 don't let employees silently redirect their own salary payment]
[Password change]
```

---

## 6. Payslip PDF Layout (matches on-screen PayslipDetailView)

```
[Company name/logo placeholder]
Payslip for: [Employee Name] | [Employee ID] | Period: [Month Year]

EARNINGS                          DEDUCTIONS
Basic Salary        ₦XXX,XXX      Pension (8%)         ₦XX,XXX
Housing Allowance    ₦XX,XXX      NHF (2.5%)            ₦X,XXX
Transport Allowance  ₦XX,XXX      NHIS                  ₦X,XXX
Other Allowances     ₦XX,XXX      PAYE                  ₦XX,XXX
                                  Voluntary Deductions   ₦X,XXX
GROSS PAY           ₦XXX,XXX     TOTAL DEDUCTIONS      ₦XX,XXX

                    NET PAY: ₦XXX,XXX

Tax computed using NTA 2025 bands (v[version], effective [date])
```

---

## 7. Notification UX (in-app + email — email reinstated for this project specifically)

```
[Bell icon — admin]: "Payroll run for July 2026 locked and payslips sent"
[Bell icon — employee]: "Your payslip for July 2026 is ready"
[Email — employee]: PDF payslip attached, sent on payroll run lock
```

---

## 8. Accessibility

- Contrast: Slate 900 on Off-White = 15.8:1 (WCAG AAA)
- Status never color-alone — text labels on every StatusBadge
- Salary figures use proper table semantics for screen readers
- Tap targets 48px mobile

---

## 9. Empty & Loading States

```
No employees yet: [Illustration] "No employees added yet" [Add Employee button]
No payroll runs yet: "No payroll has been run yet" [Start your first payroll run]
Employee with no payslips yet: "Your payslips will appear here once payroll is run"
Loading: skeleton table rows, Slate 200 pulse
```

This DESIGN.md pairs with CONTEXT.md for full phase-by-phase scaffolding in Antigravity.
