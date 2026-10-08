import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  );
}

export function Spinner({
  className,
  label = "Loading…",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "size-4 animate-spin rounded-full border-2 border-black/10 border-t-[#171717]",
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
