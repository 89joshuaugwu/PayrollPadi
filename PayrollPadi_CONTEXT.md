# PayrollPadi — CONTEXT.md

Technical architecture reference. Pair with `DESIGN.md` when prompting Antigravity.

---

## 1. Tech Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) | |
| Language | TypeScript (strict mode) | Tax computation logic must be fully typed — this is money math |
| Styling | Tailwind CSS v4 | Light mode, Indigo/Gold palette per DESIGN.md |
| Motion | Framer Motion 11.x | Minimal, function over flourish |
| Auth | Firebase Auth (email/password only — no public signup) | Both admin and employee accounts are admin-provisioned |
| Database | Firestore | Spark plan free tier |
| File storage | Cloudinary | Payslip PDFs (or generate + email directly without persistent storage — see Section 7) |
| Email | Nodemailer + Gmail SMTP | Reinstated for this project specifically — payslip delivery is a genuine email use case, unlike your last three projects' notification-only needs |
| Notifications | Firestore-based in-app, supplementing email | |
| Hosting | Vercel | Free tier |

---

## 2. Firestore Data Model

```
/users/{uid}
  uid, email, displayName
  role: "admin" | "employee"
  employeeId: string | null          // links to /employees/{id} if role == "employee"
  createdAt

/employees/{employeeId}
  uid: string                        // matching Firebase Auth uid
  name, email, department, employeeIdNumber
  bankAccount: { accountNumber, bankName }
  bankAccountPending: { accountNumber, bankName } | null   // pending admin approval, see DESIGN.md Section 5
  TIN: string, pensionRSA: string
  salaryStructure: { basic, housing, transport, otherAllowances }
  voluntaryDeductions: [{ label: string, amount: number }]   // loans, union dues
  status: "active" | "inactive"
  createdAt

/taxSettings/{versionId}
  bands: [{ min: number, max: number | null, rate: number }]   // per CONTEXT.md Section 3
  pensionRate: number                 // default 0.08
  nhfRate: number                     // default 0.025
  rentReliefCapAnnual: number          // default 500000
  rentReliefPercent: number            // default 0.20
  effectiveFrom: timestamp
  createdBy: uid
  createdAt

/payrollRuns/{runId}
  period: string                      // "2026-07"
  status: "draft" | "processing" | "locked"
  taxSettingsVersionUsed: string       // reference to /taxSettings/{versionId} — LOCKED at run time,
                                       // never recomputed retroactively if tax settings change later
  totalCost: number
  employeeCount: number
  runBy: uid, runAt, lockedAt: timestamp | null

/payrollRuns/{runId}/payslips/{employeeId}
  employeeName, employeeIdNumber
  grossPay: number
  earnings: { basic, housing, transport, otherAllowances }
  deductions: { pension, nhf, nhis, payeTax, voluntary, rentReliefApplied }
  netPay: number
  payeBreakdown: [{ bandMin, bandMax, rate, taxOnBand }]   // for the itemized payslip view
  payslipUrl: string | null            // Cloudinary PDF, if persisted
  emailSentAt: timestamp | null

/notifications/{uid}/items/{notifId}
  type: "payslip_ready" | "payroll_locked" | "bank_change_pending"
  message, payslipId: string | null, read: boolean, createdAt
```

**Why `taxSettingsVersionUsed` is locked per run, never live-recomputed:** If an admin edits tax rates in August, every payslip generated before that edit must still reflect the rates that were actually in effect when it was computed — payslips are historical financial records, not live-recalculated views. This is the same immutability principle as PharmaLedger's `/sales` collection (`allow update, delete: if false`).

---

## 3. NTA 2025 Tax Computation Engine

**Current bands (effective January 1, 2026), stored as the default seed in `/taxSettings`:**

| Band (annual chargeable income) | Rate |
|---|---|
| ₦0 – ₦800,000 | 0% |
| ₦800,001 – ₦3,000,000 | 15% |
| ₦3,000,001 – ₦10,000,000 | 18% |
| ₦10,000,001 – ₦25,000,000 | 21% |
| ₦25,000,001 – ₦50,000,000 | 23% |
| Above ₦50,000,000 | 25% |

⚠️ **This is recent legislation (6 months old at time of writing) — the bands above are correct as of the Nigeria Tax Act 2025 taking effect January 1, 2026, replacing the old Personal Income Tax Act regime and abolishing the Consolidated Relief Allowance (CRA) in favor of Rent Relief. Verify against current FIRS/NRS guidance before final submission, since implementation guidance was still being clarified as of mid-2026. This is exactly why tax bands are admin-editable data, not hardcoded constants — state this explicitly in your defense.**

```typescript
interface TaxBand {
  min: number;
  max: number | null; // null = no upper bound (top band)
  rate: number; // decimal, e.g. 0.15 for 15%
}

interface PayeBreakdownEntry {
  bandMin: number;
  bandMax: number | null;
  rate: number;
  taxOnBand: number;
}

function computePAYE(
  chargeableIncome: number,
  bands: TaxBand[]
): { totalTax: number; breakdown: PayeBreakdownEntry[] } {
  let remaining = chargeableIncome;
  let totalTax = 0;
  const breakdown: PayeBreakdownEntry[] = [];

  for (const band of bands) {
    if (remaining <= 0) break;
    const bandWidth = band.max !== null ? band.max - band.min : Infinity;
    const taxableInBand = Math.min(remaining, bandWidth);
    const taxOnBand = taxableInBand * band.rate;

    if (taxableInBand > 0) {
      breakdown.push({ bandMin: band.min, bandMax: band.max, rate: band.rate, taxOnBand });
      totalTax += taxOnBand;
    }
    remaining -= taxableInBand;
  }

  return { totalTax, breakdown };
}

function computePayslip(
  employee: Employee,
  taxSettings: TaxSettingsVersion
): PayslipResult {
  const { basic, housing, transport, otherAllowances } = employee.salaryStructure;
  const grossPay = basic + housing + transport + otherAllowances;

  // Pension: 8% of Basic + Housing + Transport (NOT gross, NOT including
  // "other allowances" — matches the standard Nigerian pension computation base)
  const pensionBase = basic + housing + transport;
  const pension = pensionBase * taxSettings.pensionRate;

  // NHF: 2.5% — rate applied to basic salary per standard convention;
  // FLAG: some guidance applies this to gross instead — this is exactly
  // why nhfRate and its base should be configurable/documented per your
  // TaxSettingsPanel, don't hardcode an assumption silently
  const nhf = basic * taxSettings.nhfRate;

  const nhis = 0; // only if employee opts in — extend if needed

  // Rent relief: lower of (rentReliefPercent × annual rent paid) or the cap.
  // Simplification for FYP scope: without a rent-paid input field per employee,
  // apply the CAP directly as a standard relief unless you add a rent-paid
  // field to the employee record — document this explicitly as a scope choice.
  const rentRelief = taxSettings.rentReliefCapAnnual / 12; // monthly portion

  const monthlyDeductionsPreTax = pension + nhf + nhis + rentRelief;
  const chargeableIncomeMonthly = Math.max(0, grossPay - monthlyDeductionsPreTax);
  const chargeableIncomeAnnual = chargeableIncomeMonthly * 12;

  const { totalTax: annualPAYE, breakdown } = computePAYE(chargeableIncomeAnnual, taxSettings.bands);
  const monthlyPAYE = annualPAYE / 12;

  const voluntaryTotal = employee.voluntaryDeductions.reduce((sum, d) => sum + d.amount, 0);
  const totalDeductions = pension + nhf + nhis + monthlyPAYE + voluntaryTotal;
  const netPay = grossPay - totalDeductions;

  return {
    grossPay,
    earnings: { basic, housing, transport, otherAllowances },
    deductions: { pension, nhf, nhis, payeTax: monthlyPAYE, voluntary: voluntaryTotal, rentReliefApplied: rentRelief },
    netPay,
    payeBreakdown: breakdown,
  };
}
```

**Documented scope simplification (state this in your defense, don't let it surface as a gap):** Rent relief technically requires the employee's actual rent paid to compute "lower of 20% of rent or ₦500,000." Without a rent-paid input, this implementation applies the cap as a flat monthly relief. A more complete build would add a `rentPaidAnnual` field to the employee record and compute `min(0.20 × rentPaidAnnual, cap)` properly — flag this as a stated next-iteration improvement rather than an oversight.

---

## 4. Batch Payroll Run Logic

```typescript
async function runPayroll(period: string, adminUid: string): Promise<string> {
  const runRef = db.collection("payrollRuns").doc();
  const taxSettings = await getCurrentTaxSettings(); // latest by effectiveFrom

  await runRef.set({
    period, status: "processing",
    taxSettingsVersionUsed: taxSettings.id,
    runBy: adminUid, runAt: Timestamp.now(),
    totalCost: 0, employeeCount: 0, lockedAt: null,
  });

  const employeesSnap = await db.collection("employees").where("status", "==", "active").get();
  const batch = db.batch();
  let totalCost = 0;

  for (const empDoc of employeesSnap.docs) {
    const employee = empDoc.data();
    const payslip = computePayslip(employee, taxSettings);
    totalCost += payslip.grossPay;

    const payslipRef = runRef.collection("payslips").doc(empDoc.id);
    batch.set(payslipRef, {
      employeeName: employee.name,
      employeeIdNumber: employee.employeeIdNumber,
      ...payslip,
      payslipUrl: null,
      emailSentAt: null,
    });
  }

  await batch.commit();
  await runRef.update({ totalCost, employeeCount: employeesSnap.size, status: "draft" });
  return runRef.id;
}

async function lockPayrollRun(runId: string): Promise<void> {
  const runRef = db.collection("payrollRuns").doc(runId);
  const payslipsSnap = await runRef.collection("payslips").get();

  for (const payslipDoc of payslipsSnap.docs) {
    const payslip = payslipDoc.data();
    const pdfBuffer = await generatePayslipPDF(payslip); // jsPDF, per DESIGN.md Section 6 layout
    const employeeEmail = await getEmployeeEmail(payslipDoc.id);

    await sendPayslipEmail(employeeEmail, pdfBuffer, payslip);
    await db.collection("notifications").doc(payslipDoc.id).collection("items").add({
      type: "payslip_ready",
      message: `Your payslip for ${payslip.period ?? runId} is ready.`,
      payslipId: payslipDoc.id,
      read: false,
      createdAt: Timestamp.now(),
    });
    await payslipDoc.ref.update({ emailSentAt: Timestamp.now() });
  }

  await runRef.update({ status: "locked", lockedAt: Timestamp.now() });
}
```

---

## 5. RBAC

| Action | Admin | Employee |
|---|---|---|
| Manage employee records | ✅ | ❌ |
| Configure tax settings | ✅ | ❌ |
| Run/lock payroll | ✅ | ❌ |
| View own payslips | ✅ (as any employee's) | ✅ (own only) |
| View reports | ✅ | ❌ |
| Update own bank details (pending approval) | N/A | ✅ (submits, doesn't take effect until admin approves) |
| Approve bank detail changes | ✅ | ❌ |

---

## 6. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function myEmployeeId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.employeeId;
    }

    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && getRole() == "admin";
    }

    match /employees/{employeeId} {
      allow read: if request.auth != null && (
        getRole() == "admin" || myEmployeeId() == employeeId
      );
      allow write: if request.auth != null && getRole() == "admin";
      // Employees CANNOT write directly, even to their own doc — bank detail
      // change requests go through a server action that writes to
      // bankAccountPending only, never directly to bankAccount.
    }

    match /taxSettings/{versionId} {
      allow read: if request.auth != null && getRole() == "admin";
      allow create: if request.auth != null && getRole() == "admin";
      allow update, delete: if false; // versions are immutable once created
    }

    match /payrollRuns/{runId} {
      allow read: if request.auth != null && getRole() == "admin";
      allow write: if request.auth != null && getRole() == "admin";

      match /payslips/{employeeId} {
        allow read: if request.auth != null && (
          getRole() == "admin" || myEmployeeId() == employeeId
        );
        allow write: if request.auth != null && getRole() == "admin";
      }
    }

    match /notifications/{uid}/items/{notifId} {
      allow read, update: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null;
    }
  }
}
```

⚠️ **Manual publish required in Firebase Console every time these rules change.**

---

## 7. Payslip Email Delivery

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_SMTP_USER,
    pass: process.env.GMAIL_SMTP_APP_PASSWORD, // 16-digit app password
  },
});

async function sendPayslipEmail(
  toEmail: string,
  pdfBuffer: Buffer,
  payslip: PayslipResult
): Promise<void> {
  await transporter.sendMail({
    from: `"PayrollPadi" <${process.env.GMAIL_SMTP_USER}>`,
    to: toEmail,
    subject: `Your Payslip is Ready`,
    text: `Hi, your payslip for this period is attached. Net pay: ₦${payslip.netPay.toLocaleString()}`,
    attachments: [{ filename: "payslip.pdf", content: pdfBuffer }],
  });
}
```

Generate PDF client-side-equivalent logic server-side using `jsPDF` (or `@react-pdf/renderer` for more layout control) inside the lock-payroll-run server action — no need to persist to Cloudinary unless you want a permanent download link; email attachment alone satisfies the core requirement, Cloudinary storage is an enhancement for the "download later" UX in `/dashboard/my-payslips`.

---

## 8. Environment Variables

```
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Cloudinary (optional — persistent payslip PDF storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Gmail SMTP
GMAIL_SMTP_USER=
GMAIL_SMTP_APP_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=https://payrollpadi.vercel.app
```

---

## 9. Non-Goals (out of scope for defense build)

- No direct bank transfer/disbursement integration — net pay is computed and reported, actual salary payment to employee bank accounts is manual/off-platform (same pattern as PharmaLedger and SparePadi's payout scope decisions)
- No multi-currency support — Naira only
- No full rent-relief-by-actual-rent computation — flat cap applied, documented simplification per Section 3
- No integration with actual FIRS/NRS remittance filing systems — reports summarize what's owed, filing itself is manual
- No overtime/bonus/13th-month-pay computation — base salary structure only, statable future enhancement
