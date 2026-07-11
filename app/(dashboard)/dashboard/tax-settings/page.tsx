"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getTaxSettingsVersions } from "@/lib/data/taxSettings";
import {
  TaxSettingsVersion,
  NTA_2025_DEFAULT_BANDS,
  DEFAULT_PENSION_RATE,
  DEFAULT_NHF_RATE,
  DEFAULT_RENT_RELIEF_CAP_ANNUAL,
  DEFAULT_RENT_RELIEF_PERCENT,
} from "@/types/taxSettings";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TaxSettingsPanel from "@/components/organisms/TaxSettingsPanel";

export default function TaxSettingsPage() {
  const { profile, firebaseUser } = useAuth();
  const router = useRouter();
  const [versions, setVersions] = useState<TaxSettingsVersion[] | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    const v = await getTaxSettingsVersions();
    setVersions(v);
  }

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      toast.error("Admins only.");
      router.replace("/dashboard");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, router]);

  async function handleSeed() {
    if (!firebaseUser) return;
    setSeeding(true);
    try {
      await addDoc(collection(db, "taxSettings"), {
        bands: NTA_2025_DEFAULT_BANDS,
        pensionRate: DEFAULT_PENSION_RATE,
        nhfRate: DEFAULT_NHF_RATE,
        rentReliefCapAnnual: DEFAULT_RENT_RELIEF_CAP_ANNUAL,
        rentReliefPercent: DEFAULT_RENT_RELIEF_PERCENT,
        effectiveFrom: Timestamp.now(),
        createdBy: firebaseUser.uid,
        createdAt: Timestamp.now(),
      });
      toast.success("NTA 2025 default tax settings seeded.");
      await load();
    } catch {
      toast.error("Failed to seed tax settings.");
    } finally {
      setSeeding(false);
    }
  }

  if (!profile || profile.role !== "admin" || versions === null || !firebaseUser) return <Spinner />;

  if (versions.length === 0) {
    return (
      <Card className="max-w-md">
        <h2 className="font-bold text-text-primary mb-2">No tax settings configured yet</h2>
        <p className="text-sm text-text-secondary mb-4">
          Seed the initial NTA 2025 default bands (0% to ₦800k, 15% to ₦3M, 18% to ₦10M, 21% to ₦25M, 23% to ₦50M,
          25% above) before running your first payroll.
        </p>
        <Button onClick={handleSeed} loading={seeding}>
          Seed NTA 2025 Defaults
        </Button>
      </Card>
    );
  }

  const [current, ...history] = versions;
  if (!current) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Tax Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          ⚠️ Verify these bands against current FIRS/NRS guidance before final submission — the Nigeria Tax Act 2025
          is recent legislation and implementation guidance was still being clarified as of mid-2026.
        </p>
      </div>
      <TaxSettingsPanel current={current} history={history} adminUid={firebaseUser.uid} />
    </div>
  );
}
