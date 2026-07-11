import { cn } from "@/lib/utils";

type Status = "draft" | "locked" | "processing" | "active" | "inactive" | "pending";

const config: Record<Status, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-amber-50 text-warning border-amber-200" },
  locked: { label: "Locked", classes: "bg-green-50 text-success border-green-200" },
  processing: { label: "Processing", classes: "bg-indigo-50 text-primary border-indigo-200 animate-pulse" },
  active: { label: "Active", classes: "bg-green-50 text-success border-green-200" },
  inactive: { label: "Inactive", classes: "bg-slate-100 text-text-secondary border-slate-200" },
  pending: { label: "Pending", classes: "bg-amber-50 text-warning border-amber-200" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        c.classes
      )}
    >
      {c.label}
    </span>
  );
}
