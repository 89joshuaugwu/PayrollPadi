export interface SalaryStructure {
  basic: number;
  housing: number;
  transport: number;
  otherAllowances: number;
}

export interface VoluntaryDeduction {
  label: string;
  amount: number;
}

export interface BankAccount {
  accountNumber: string;
  bankName: string;
}

export interface Employee {
  id: string;
  uid: string;
  name: string;
  email: string;
  department: string;
  employeeIdNumber: string;
  bankAccount: BankAccount;
  bankAccountPending: BankAccount | null;
  TIN: string;
  pensionRSA: string;
  salaryStructure: SalaryStructure;
  voluntaryDeductions: VoluntaryDeduction[];
  status: "active" | "inactive";
  createdAt: number;
}

export function isSalaryStructureComplete(s: Partial<SalaryStructure> | undefined | null): boolean {
  if (!s) return false;
  return (
    typeof s.basic === "number" &&
    s.basic > 0 &&
    typeof s.housing === "number" &&
    typeof s.transport === "number" &&
    typeof s.otherAllowances === "number"
  );
}

export function computeGross(s: SalaryStructure): number {
  return s.basic + s.housing + s.transport + s.otherAllowances;
}
