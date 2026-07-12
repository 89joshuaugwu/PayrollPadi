"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Branded replacement for window.confirm() — matches the Indigo/Gold design system instead of a native browser dialog. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div
            className={
              variant === "danger"
                ? "shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"
                : "shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center"
            }
          >
            <AlertTriangle className={variant === "danger" ? "w-5 h-5 text-error" : "w-5 h-5 text-primary"} />
          </div>
          <p className="text-sm text-text-secondary pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
