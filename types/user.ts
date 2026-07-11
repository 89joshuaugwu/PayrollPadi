export type Role = "admin" | "employee";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  employeeId: string | null;
  createdAt: number;
}

export interface Notification {
  id: string;
  type: "payslip_ready" | "payroll_locked" | "bank_change_pending";
  message: string;
  payslipId: string | null;
  read: boolean;
  createdAt: number;
}
