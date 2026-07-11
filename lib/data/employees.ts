import { collection, doc, onSnapshot, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee } from "@/types/employee";
import { toMillis } from "@/lib/utils";

function fromDoc(id: string, data: Record<string, unknown>): Employee {
  return {
    id,
    uid: data.uid as string,
    name: data.name as string,
    email: data.email as string,
    department: data.department as string,
    employeeIdNumber: data.employeeIdNumber as string,
    bankAccount: data.bankAccount as Employee["bankAccount"],
    bankAccountPending: (data.bankAccountPending as Employee["bankAccountPending"]) ?? null,
    TIN: data.TIN as string,
    pensionRSA: data.pensionRSA as string,
    salaryStructure: data.salaryStructure as Employee["salaryStructure"],
    voluntaryDeductions: (data.voluntaryDeductions as Employee["voluntaryDeductions"]) ?? [],
    status: data.status as Employee["status"],
    createdAt: toMillis(data.createdAt),
  };
}

export function subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
  const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => fromDoc(d.id, d.data())));
  });
}

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const snap = await getDoc(doc(db, "employees", employeeId));
  if (!snap.exists()) return null;
  return fromDoc(snap.id, snap.data());
}

export function subscribeToEmployee(employeeId: string, callback: (employee: Employee | null) => void): () => void {
  return onSnapshot(doc(db, "employees", employeeId), (snap) => {
    callback(snap.exists() ? fromDoc(snap.id, snap.data()) : null);
  });
}
