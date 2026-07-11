import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TaxSettingsVersion } from "@/types/taxSettings";
import { toMillis } from "@/lib/utils";

function fromDoc(id: string, data: Record<string, unknown>): TaxSettingsVersion {
  return {
    id,
    bands: data.bands as TaxSettingsVersion["bands"],
    pensionRate: data.pensionRate as number,
    nhfRate: data.nhfRate as number,
    rentReliefCapAnnual: data.rentReliefCapAnnual as number,
    rentReliefPercent: data.rentReliefPercent as number,
    effectiveFrom: toMillis(data.effectiveFrom),
    createdBy: data.createdBy as string,
    createdAt: toMillis(data.createdAt),
  };
}

export async function getTaxSettingsVersions(): Promise<TaxSettingsVersion[]> {
  const q = query(collection(db, "taxSettings"), orderBy("effectiveFrom", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}
