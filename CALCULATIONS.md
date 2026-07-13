# PayrollPadi — CALCULATIONS.md

Every number PayrollPadi shows — on screen, in a PDF, or in an email — comes from one of the calculations documented below. This file exists so that a developer, an accountant, or a panel member can check the math by hand and get the same answer the app gives.

**Where the code lives:** all payslip math is in `lib/tax-engine.ts`, in two functions: `computePAYE()` and `computePayslip()`. Both are pure functions — no database calls, no side effects — so they can be tested in isolation and reasoned about without touching Firebase at all.

---

## 1. The Inputs

Every payslip calculation starts from three things, all stored in Firestore:

| Input | Where it's stored | Example |
|---|---|---|
| Employee's salary structure | `/employees/{id}.salaryStructure` | Basic ₦200,000, Housing ₦80,000, Transport ₦50,000, Other ₦30,000 (all **monthly**) |
| Employee's voluntary deductions | `/employees/{id}.voluntaryDeductions` | e.g. a loan repayment or union due — none in the example below |
| The tax settings in effect | `/taxSettings/{versionId}` — whichever version was current **at the moment payroll was run** | NTA 2025 default bands, pension 8%, NHF 2.5%, rent relief cap ₦500,000/year |

Everything below is computed **per employee, per payroll run**, using these three inputs.

---

## 2. Gross Pay

```
Gross Pay = Basic + Housing + Transport + Other Allowances
```

**Worked example** (real figures from a test payslip in this system):
```
Gross Pay = 200,000 + 80,000 + 50,000 + 30,000 = ₦360,000.00
```

---

## 3. Pension

Pension is 8% (configurable) of **Basic + Housing + Transport only** — "Other Allowances" is deliberately excluded, matching standard Nigerian pension computation practice.

```
Pension Base = Basic + Housing + Transport
Pension = Pension Base × Pension Rate
```

**Worked example:**
```
Pension Base = 200,000 + 80,000 + 50,000 = 330,000
Pension = 330,000 × 8% = ₦26,400.00
```

---

## 4. NHF (National Housing Fund)

NHF is 2.5% (configurable) of **Basic Salary only**.

```
NHF = Basic × NHF Rate
```

**Worked example:**
```
NHF = 200,000 × 2.5% = ₦5,000.00
```

**⚠️ Documented ambiguity — read before your defense:** some official guidance applies NHF to *gross pay* instead of just basic salary. This app deliberately makes the NHF rate (and its base) admin-configurable in Tax Settings rather than silently hardcoding one assumption. If challenged on this, the correct answer is: *"NHF's exact base varies by source, so we made it a configurable setting rather than guessing — here's where an admin would adjust it if guidance is clarified."*

---

## 5. NHIS (National Health Insurance Scheme)

```
NHIS = 0, unless the employee has explicitly opted in
```

Not implemented beyond a placeholder in this build — stated scope limitation, not a bug. Extend `computePayslip()` if opt-in NHIS is needed later.

---

## 6. Rent Relief

This is the most important **documented simplification** in the whole system.

**What the law actually intends:** rent relief should be the *lower of* 20% of the employee's actual annual rent paid, or a ₦500,000 annual cap.

```
Correct formula (NOT implemented — see below):
Rent Relief = min(20% × Actual Annual Rent Paid, ₦500,000)
```

**What this build actually does**, because there is no `rentPaidAnnual` field on the employee record:

```
Rent Relief (monthly) = Rent Relief Cap Annual ÷ 12
```

**Worked example:**
```
Rent Relief = 500,000 ÷ 12 = ₦41,666.67 per month
```

**State this explicitly in your defense** as a stated next-iteration improvement: *"A complete implementation would add a rentPaidAnnual field to the employee record and compute min(20% × rent, cap) properly. This build applies the cap as a flat relief for every employee, documented as a scope decision, not an oversight."*

---

## 7. Chargeable Income

This is what's left of gross pay after pension, NHF, NHIS, and rent relief are subtracted — the portion that PAYE tax actually applies to.

```
Monthly Pre-Tax Deductions = Pension + NHF + NHIS + Rent Relief
Chargeable Income (Monthly) = max(0, Gross Pay − Monthly Pre-Tax Deductions)
Chargeable Income (Annual) = Chargeable Income (Monthly) × 12
```

The `max(0, ...)` guards against a theoretical negative number if deductions ever exceeded gross pay for a very low earner — chargeable income can never go below zero.

**Worked example:**
```
Monthly Pre-Tax Deductions = 26,400 + 5,000 + 0 + 41,666.67 = 73,066.67
Chargeable Income (Monthly) = 360,000 − 73,066.67 = 286,933.33
Chargeable Income (Annual) = 286,933.33 × 12 = ₦3,443,200.00
```

**Why it's annualized:** Nigeria's PAYE bands (below) are defined as *annual* income thresholds. The system converts the monthly chargeable income to an annual figure, runs it through the bands, then divides the resulting tax back down to a monthly amount. This is standard practice and avoids the bands "resetting" every month in a way that would distort real annual tax liability.

---

## 8. PAYE Tax — The Band Calculation

This is a **progressive** tax: each slice (band) of income is taxed at its own rate, not the whole income at one flat rate. Nobody's whole salary is taxed at the top rate they reach — only the portion that falls inside that top band.

### The NTA 2025 default bands (seeded, not hardcoded)

| Band (annual chargeable income) | Rate |
|---|---|
| ₦0 – ₦800,000 | 0% |
| ₦800,001 – ₦3,000,000 | 15% |
| ₦3,000,001 – ₦10,000,000 | 18% |
| ₦10,000,001 – ₦25,000,000 | 21% |
| ₦25,000,001 – ₦50,000,000 | 23% |
| Above ₦50,000,000 | 25% |

**Critically: these bands are data stored in `/taxSettings`, not numbers written into the code.** `computePAYE()` takes `bands` as a parameter and loops over whatever it's given. If the Nigeria Tax Act changes again, an admin edits Tax Settings — the calculation function itself never needs to change.

### The algorithm, in plain terms

1. Start with the full annual chargeable income as "remaining."
2. Sort the bands from lowest to highest.
3. For each band, take whichever is smaller: the width of that band, or however much income is still "remaining." That's the amount taxed at this band's rate.
4. Multiply that amount by the band's rate, add it to the running total tax.
5. Subtract what was just taxed from "remaining."
6. Stop once "remaining" hits zero (or you run out of bands).

### Worked example (annual chargeable income: ₦3,443,200)

| Band | Band width | Taxable in this band | Rate | Tax on this band |
|---|---|---|---|---|
| ₦0 – ₦800,000 | 800,000 | min(3,443,200, 800,000) = 800,000 | 0% | ₦0.00 |
| ₦800,000 – ₦3,000,000 | 2,200,000 | min(2,643,200, 2,200,000) = 2,200,000 | 15% | ₦330,000.00 |
| ₦3,000,000 – ₦10,000,000 | 7,000,000 | min(443,200, 7,000,000) = 443,200 | 18% | ₦79,776.00 |

```
Total Annual PAYE = 0 + 330,000 + 79,776 = ₦409,776.00
Monthly PAYE = 409,776 ÷ 12 = ₦34,148.00
```

This exact breakdown is what appears in the "PAYE Band Breakdown" table on every payslip — nothing is hidden or approximated for display purposes; the on-screen table *is* the actual calculation trace.

---

## 9. Total Deductions & Net Pay

```
Total Deductions = Pension + NHF + NHIS + Monthly PAYE + Voluntary Deductions
Net Pay = Gross Pay − Total Deductions
```

**Worked example:**
```
Total Deductions = 26,400 + 5,000 + 0 + 34,148 + 0 = ₦65,548.00
Net Pay = 360,000 − 65,548 = ₦294,452.00
```

This is the number shown in Gold on every payslip — the amount the employee actually takes home.

---

## 10. Payroll Run Totals

When an admin runs payroll for a period, one additional aggregate is computed:

```
Total Cost (of the run) = sum of every active employee's Gross Pay
Employee Count = number of active employees included
```

Stored on the `/payrollRuns/{runId}` document as `totalCost` and `employeeCount`.

---

## 11. Reports Page Aggregates

All Reports figures are computed **only from locked payroll runs** — draft runs (not yet finalized) are excluded, since their numbers could still change before locking.

| Metric | Formula |
|---|---|
| Total Payroll Cost | Sum of `totalCost` across every locked run |
| Total Tax Remitted | Sum of `payeTax` across every payslip belonging to a locked run (fetched via a `collectionGroup` query across all runs' `payslips` subcollections) |
| Average Net Pay | Sum of `netPay` across every payslip in locked runs, divided by the number of such payslips |
| Department Cost Breakdown | Sum of each active employee's Gross Pay, grouped by `department` |
| Payroll Cost Trend | Each locked run's `totalCost`, plotted by `period` |

---

## 12. Why a Locked Payslip Never Changes Retroactively

Every payslip document stores `taxSettingsVersionUsed` — the exact ID of the `/taxSettings/{versionId}` document that was current **at the moment that specific payroll run was executed**. Tax Settings versions are immutable once created (Firestore rule: `allow update, delete: if false`), and a new "Save" always creates a brand-new version rather than editing the old one.

This means: if an admin changes a tax rate today, every payslip generated *before* that change keeps showing the old rate's results forever — because the calculation was already run and stored, and the version it referenced never changes underneath it. Only *new* payroll runs pick up the new rate.

This is the single most important architectural fact to state clearly in a defense: **the tax engine is a pure function of whatever `bands`/`rates` it's handed — it has no memory of "current" rates, so historical accuracy is a natural consequence of the data model, not a special case the code has to handle.**

---

## Summary: One Employee, Start to Finish

```
Basic 200,000 + Housing 80,000 + Transport 50,000 + Other 30,000
                    ↓
              Gross Pay: ₦360,000.00
                    ↓
  Pension (8% of 330,000) ─── ₦26,400.00
  NHF (2.5% of 200,000)   ─── ₦5,000.00
  Rent Relief (500,000/12)─── ₦41,666.67
                    ↓
      Chargeable Income (annualized): ₦3,443,200.00
                    ↓
         PAYE via NTA 2025 bands: ₦409,776.00/year
                    ↓
              Monthly PAYE: ₦34,148.00
                    ↓
   Total Deductions: 26,400 + 5,000 + 34,148 = ₦65,548.00
                    ↓
        NET PAY: 360,000 − 65,548 = ₦294,452.00
```
