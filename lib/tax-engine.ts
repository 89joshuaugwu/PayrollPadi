import { Employee, SalaryStructure } from "@/types/employee";
import { TaxBand, TaxSettingsVersion } from "@/types/taxSettings";
import { PayeBreakdownEntry, PayslipResult } from "@/types/payslip";

/**
 * Computes PAYE tax across progressive bands.
 *
 * IMPORTANT: `bands` is always a runtime parameter sourced from
 * /taxSettings/{versionId} — never hardcoded here. If Nigeria Tax Act
 * bands change again, only the Firestore data changes; this function
 * does not need to be touched or redeployed.
 */
export function computePAYE(
  chargeableIncome: number,
  bands: TaxBand[]
): { totalTax: number; breakdown: PayeBreakdownEntry[] } {
  let remaining = chargeableIncome;
  let totalTax = 0;
  const breakdown: PayeBreakdownEntry[] = [];

  const sortedBands = [...bands].sort((a, b) => a.min - b.min);

  for (const band of sortedBands) {
    if (remaining <= 0) break;
    const bandWidth = band.max !== null ? band.max - band.min : Infinity;
    const taxableInBand = Math.min(remaining, bandWidth);
    const taxOnBand = taxableInBand * band.rate;

    if (taxableInBand > 0) {
      breakdown.push({
        bandMin: band.min,
        bandMax: band.max,
        rate: band.rate,
        taxOnBand,
      });
      totalTax += taxOnBand;
    }
    remaining -= taxableInBand;
  }

  return { totalTax, breakdown };
}

export interface PayslipComputationInput {
  salaryStructure: SalaryStructure;
  voluntaryDeductions: { label: string; amount: number }[];
}

/**
 * Computes a full payslip for one employee against a specific (locked)
 * tax settings version. Pure function — no I/O, fully typed, this is
 * money math and must be deterministic and testable in isolation.
 */
export function computePayslip(
  input: PayslipComputationInput,
  taxSettings: TaxSettingsVersion
): PayslipResult {
  const { basic, housing, transport, otherAllowances } = input.salaryStructure;
  const grossPay = basic + housing + transport + otherAllowances;

  // Pension: 8% of Basic + Housing + Transport (NOT gross, NOT including
  // "other allowances") — standard Nigerian pension computation base.
  const pensionBase = basic + housing + transport;
  const pension = pensionBase * taxSettings.pensionRate;

  // NHF: applied to basic salary per standard convention.
  // FLAG (documented, not a silent assumption): some guidance applies
  // this to gross instead — nhfRate and its base are configurable via
  // TaxSettingsPanel precisely because this varies by source.
  const nhf = basic * taxSettings.nhfRate;

  const nhis = 0; // only if employee opts in — not implemented in this FYP scope

  // Rent relief: documented scope simplification. Without a rentPaidAnnual
  // field on the employee record, the CAP is applied directly as a flat
  // monthly relief rather than min(20% of rent paid, cap). Flag this
  // explicitly in the defense as a stated next-iteration improvement.
  const rentRelief = taxSettings.rentReliefCapAnnual / 12;

  const monthlyDeductionsPreTax = pension + nhf + nhis + rentRelief;
  const chargeableIncomeMonthly = Math.max(0, grossPay - monthlyDeductionsPreTax);
  const chargeableIncomeAnnual = chargeableIncomeMonthly * 12;

  const { totalTax: annualPAYE, breakdown } = computePAYE(chargeableIncomeAnnual, taxSettings.bands);
  const monthlyPAYE = annualPAYE / 12;

  const voluntaryTotal = input.voluntaryDeductions.reduce((sum, d) => sum + d.amount, 0);
  const totalDeductions = pension + nhf + nhis + monthlyPAYE + voluntaryTotal;
  const netPay = grossPay - totalDeductions;

  return {
    grossPay,
    earnings: { basic, housing, transport, otherAllowances },
    deductions: {
      pension,
      nhf,
      nhis,
      payeTax: monthlyPAYE,
      voluntary: voluntaryTotal,
      rentReliefApplied: rentRelief,
    },
    netPay,
    payeBreakdown: breakdown,
  };
}

export function computePayslipForEmployee(
  employee: Pick<Employee, "salaryStructure" | "voluntaryDeductions">,
  taxSettings: TaxSettingsVersion
): PayslipResult {
  return computePayslip(
    {
      salaryStructure: employee.salaryStructure,
      voluntaryDeductions: employee.voluntaryDeductions,
    },
    taxSettings
  );
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
