export interface TaxBand {
  min: number;
  max: number | null; // null = no upper bound (top band)
  rate: number; // decimal, e.g. 0.15 for 15%
}

export interface TaxSettingsVersion {
  id: string;
  bands: TaxBand[];
  pensionRate: number; // default 0.08
  nhfRate: number; // default 0.025
  rentReliefCapAnnual: number; // default 500000
  rentReliefPercent: number; // default 0.20
  effectiveFrom: number;
  createdBy: string;
  createdAt: number;
}

// NTA 2025 default bands, effective January 1, 2026.
// Verify against current FIRS/NRS guidance before final submission —
// this is recent legislation and implementation guidance was still
// being clarified as of mid-2026.
export const NTA_2025_DEFAULT_BANDS: TaxBand[] = [
  { min: 0, max: 800_000, rate: 0 },
  { min: 800_000, max: 3_000_000, rate: 0.15 },
  { min: 3_000_000, max: 10_000_000, rate: 0.18 },
  { min: 10_000_000, max: 25_000_000, rate: 0.21 },
  { min: 25_000_000, max: 50_000_000, rate: 0.23 },
  { min: 50_000_000, max: null, rate: 0.25 },
];

export const DEFAULT_PENSION_RATE = 0.08;
export const DEFAULT_NHF_RATE = 0.025;
export const DEFAULT_RENT_RELIEF_CAP_ANNUAL = 500_000;
export const DEFAULT_RENT_RELIEF_PERCENT = 0.2;

/** Validates that bands are contiguous (each min === previous max) and the last band is open-ended. */
export function validateBands(bands: TaxBand[]): string | null {
  if (bands.length === 0) return "At least one band is required.";
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  const first = sorted[0];
  if (!first || first.min !== 0) return "The first band must start at ₦0.";
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (!current || !next) continue;
    if (current.max === null) return "Only the last band may have no upper bound.";
    if (current.max !== next.min) {
      return `Band gap/overlap detected: band ending at ${current.max} does not match next band starting at ${next.min}.`;
    }
  }
  const last = sorted[sorted.length - 1];
  if (!last || last.max !== null) return "The last band must have no upper bound (max: null).";
  for (const b of sorted) {
    if (b.rate < 0 || b.rate > 1) return "Rates must be between 0 and 1 (decimal).";
  }
  return null;
}
