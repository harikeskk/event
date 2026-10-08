import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-md border-0 bg-white px-3 text-base text-foreground " +
  "shadow-hairline placeholder:text-subtle " +
  "transition-[box-shadow] duration-150 ease-out " +
  "focus-visible:outline-none focus:shadow-focus-ring " +
  "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClasses, "min-h-24 resize-y py-2.5 leading-6", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClasses, "h-10 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[13px] leading-5 font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
