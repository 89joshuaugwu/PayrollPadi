"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TaxBand, TaxSettingsVersion, validateBands } from "@/types/taxSettings";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TaxBandEditor from "@/components/molecules/TaxBandEditor";
import { formatNaira } from "@/lib/tax-engine";

interface Props {
  current: TaxSettingsVersion;
  history: TaxSettingsVersion[];
  adminUid: string;
}

export default function TaxSettingsPanel({ current, history, adminUid }: Props) {
  const [bands, setBands] = useState<TaxBand[]>(current.bands);
  const [pensionRate, setPensionRate] = useState(current.pensionRate * 100);
  const [nhfRate, setNhfRate] = useState(current.nhfRate * 100);
  const [rentReliefCap, setRentReliefCap] = useState(current.rentReliefCapAnnual);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const error = validateBands(bands);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      // Saving always creates a NEW versioned doc — never overwrites the
      // previous version. Historical payslips reference the version that
      // was current when they were computed, per CONTEXT.md's
      // immutability requirement.
      await addDoc(collection(db, "taxSettings"), {
        bands,
        pensionRate: pensionRate / 100,
        nhfRate: nhfRate / 100,
        rentReliefCapAnnual: rentReliefCap,
        rentReliefPercent: current.rentReliefPercent,
        effectiveFrom: Timestamp.now(),
        createdBy: adminUid,
        createdAt: Timestamp.now(),
      });
      toast.success("New tax settings version saved.");
    } catch {
      toast.error("Failed to save tax settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="font-bold text-lg text-text-primary mb-4">Tax Bands (NTA 2025)</h2>
        <TaxBandEditor bands={bands} onChange={setBands} />
      </Card>

      <Card>
        <h2 className="font-bold text-lg text-text-primary mb-4">Statutory Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Pension Rate (%)"
            type="number"
            step="0.1"
            value={pensionRate}
            onChange={(e) => setPensionRate(Number(e.target.value))}
          />
          <Input
            label="NHF Rate (%)"
            type="number"
            step="0.1"
            value={nhfRate}
            onChange={(e) => setNhfRate(Number(e.target.value))}
          />
          <Input
            label="Rent Relief Cap (₦/year)"
            type="number"
            value={rentReliefCap}
            onChange={(e) => setRentReliefCap(Number(e.target.value))}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          Save as New Version
        </Button>
      </div>

      <Card>
        <h2 className="font-bold text-lg text-text-primary mb-4">Version History</h2>
        <div className="flex flex-col gap-3 md:gap-2">
          {[current, ...history].map((v) => (
            <div
              key={v.id}
              className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-3 text-sm border-b border-border last:border-0 py-2"
            >
              <span className="font-mono text-xs text-text-secondary truncate">{v.id}</span>
              <span className="text-text-primary">
                Pension {(v.pensionRate * 100).toFixed(1)}% · NHF {(v.nhfRate * 100).toFixed(1)}% · Rent cap{" "}
                {formatNaira(v.rentReliefCapAnnual)}
              </span>
              <span className="text-text-secondary tabular-nums text-xs md:text-sm">
                {new Date(v.effectiveFrom).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
