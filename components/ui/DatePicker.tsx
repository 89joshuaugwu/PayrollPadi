import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Month/period picker — used for selecting a payroll run period (YYYY-MM). */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="month"
          className={cn(
            "h-11 md:h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary tabular-nums",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-error focus:ring-error focus:border-error",
            className
          )}
          {...rest}
        />
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export default DatePicker;
