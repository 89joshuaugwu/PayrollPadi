import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl shadow-sm p-4 md:p-6", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
