"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50",
  secondary: "bg-white text-primary border border-primary hover:bg-primary/5",
  danger: "bg-error text-white hover:bg-red-700 disabled:bg-error/50",
  success: "bg-success text-white hover:bg-green-700 disabled:bg-success/50",
  ghost: "bg-transparent text-text-secondary hover:bg-slate-100",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 md:h-10 text-sm font-medium transition-colors disabled:cursor-not-allowed",
          "min-h-[44px] md:min-h-[40px]",
          variantClasses[variant],
          className
        )}
        {...rest}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
