"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  total: number;
  active: boolean;
  onComplete?: () => void;
}

/**
 * Firestore batch writes are near-instant at FYP scale, so this is a
 * short simulated progress animation rather than true incremental server
 * progress — it should still feel responsive per DESIGN.md.
 */
export default function PayrollRunProgress({ total, active, onComplete }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active || total === 0) return;
    setCount(0);
    const stepMs = Math.max(15, Math.min(60, 800 / total));
    const interval = setInterval(() => {
      setCount((c) => {
        const next = c + 1;
        if (next >= total) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 250);
          return total;
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, total]);

  const pct = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeOut", duration: 0.2 }}
        />
      </div>
      <p className="text-sm text-text-secondary tabular-nums">
        Processing {count} of {total} employees...
      </p>
    </div>
  );
}
