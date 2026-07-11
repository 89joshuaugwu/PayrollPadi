"use client";

import { Plus, Trash2 } from "lucide-react";
import { TaxBand, validateBands } from "@/types/taxSettings";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface Props {
  bands: TaxBand[];
  onChange: (bands: TaxBand[]) => void;
}

export default function TaxBandEditor({ bands, onChange }: Props) {
  const error = validateBands(bands);

  function updateBand(index: number, patch: Partial<TaxBand>) {
    const next = bands.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange(next);
  }

  function addBand() {
    const last = bands[bands.length - 1];
    const newMin = last?.max ?? 0;
    const next = [...bands];
    if (last) next[next.length - 1] = { ...last, max: newMin };
    next.push({ min: newMin, max: null, rate: 0 });
    onChange(next);
  }

  function removeBand(index: number) {
    onChange(bands.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-semibold text-text-secondary px-1">
        <span>Min (₦, annual)</span>
        <span>Max (₦, annual — blank = no limit)</span>
        <span>Rate (%)</span>
        <span></span>
      </div>
      {bands.map((band, i) => (
        <div key={i} className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <Input
            type="number"
            value={band.min}
            onChange={(e) => updateBand(i, { min: Number(e.target.value) })}
            aria-label={`Band ${i + 1} minimum`}
          />
          <Input
            type="number"
            value={band.max ?? ""}
            placeholder="No limit"
            onChange={(e) => updateBand(i, { max: e.target.value === "" ? null : Number(e.target.value) })}
            aria-label={`Band ${i + 1} maximum`}
          />
          <Input
            type="number"
            step="0.01"
            value={band.rate * 100}
            onChange={(e) => updateBand(i, { rate: Number(e.target.value) / 100 })}
            aria-label={`Band ${i + 1} rate`}
          />
          <Button variant="ghost" onClick={() => removeBand(i)} aria-label="Remove band">
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={addBand} className="self-start">
        <Plus className="w-4 h-4" /> Add Band
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
      {!error && <p className="text-xs text-success">Bands are contiguous and valid.</p>}
    </div>
  );
}
