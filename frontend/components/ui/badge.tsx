import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-surface text-muted",
  success: "bg-[#ecfdf5] text-[#067647]",
  warning: "bg-[#fffaeb] text-[#b54708]",
  danger: "bg-[#fef3f2] text-[#b42318]",
  info: "bg-[#eff8ff] text-[#175cd3]",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
        />
      )}
      {children}
    </span>
  );
}
