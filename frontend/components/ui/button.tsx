import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-inverse text-white shadow-button hover:bg-inverse-hover active:bg-[#003e99]",
  secondary:
    "bg-white text-foreground shadow-hairline hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover",
  ghost:
    "bg-transparent text-muted hover:bg-surface-hover hover:text-foreground",
  danger:
    "bg-danger text-white shadow-button hover:bg-[#b61230] active:bg-[#880e24]",
  link: "bg-transparent text-blue px-0 h-auto underline-offset-4 hover:underline shadow-none",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap",
        "transition-[background-color,box-shadow,color] duration-150 ease-out",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        variant !== "link" && sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
