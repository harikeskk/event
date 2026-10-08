"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Mail,
  Phone,
  Sparkles,
  User,
  Users,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getInquiryById } from "../../../services/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Inquiry {
  id: string;
  vendorBusinessName: string;
  vendorCategory: string;
  vendorContactEmail: string | null;
  vendorContactPhone: string | null;
  eventType: string;
  eventDate: string;
  guestCount: number | null;
  budget: number | string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  status: string;
  vendorNotes: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string; Icon: LucideIcon }> = {
  PENDING: { variant: "warning", label: "Pending Vendor Response", Icon: Clock },
  ACCEPTED: { variant: "success", label: "Accepted by Vendor", Icon: CheckCircle },
  DECLINED: { variant: "danger", label: "Declined", Icon: XCircle },
  COMPLETED: { variant: "success", label: "Completed", Icon: CheckCircle2 },
};

const STATUS_CONTEXT: Record<string, string> = {
  PENDING: "Awaiting vendor response",
  ACCEPTED: "The vendor accepted your request",
  DECLINED: "This vendor declined the request",
  COMPLETED: "This request is completed",
};

type StepState = "done" | "current" | "declined" | "future";

const STEP_CLASSES: Record<StepState, string> = {
  done: "bg-success/10 text-success",
  current: "bg-white text-foreground shadow-hairline-strong",
  declined: "bg-danger/10 text-danger",
  future: "bg-surface text-subtle",
};

const PRIMARY_LINK =
  "inline-flex h-10 w-full select-none items-center justify-center gap-2 rounded-md bg-inverse px-4 text-sm font-medium text-white shadow-button transition-[background-color,box-shadow] duration-150 ease-out hover:bg-inverse-hover active:bg-black";

const SECONDARY_LINK =
  "inline-flex h-10 w-full select-none items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-foreground shadow-hairline transition-[background-color,box-shadow] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover";

function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card className="p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="divide-y divide-hairline">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-16 w-full" />
              <div className="divide-y divide-hairline">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-28" />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function InquiryDetailContent() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (token && id) {
      getInquiryById(id, token)
        .then((data) => setInquiry(data))
        .catch((err) => setError(err?.message || "Failed to load this booking request"))
        .finally(() => setIsLoading(false));
    }
  }, [token, isAuthenticated, authLoading, id, router]);

  const copyPhone = async () => {
    if (!inquiry?.vendorContactPhone) return;
    try {
      await navigator.clipboard.writeText(inquiry.vendorContactPhone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" />
            <h1 className="text-base font-medium tracking-tight">Unable to Load Booking Request</h1>
            <p className="text-sm text-muted">{error}</p>
            <Link
              href="/my-inquiries"
              className={cn(SECONDARY_LINK, "mx-auto mt-2 w-auto px-4")}
            >
              Back to My Inquiries
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  if (!inquiry) return <DetailSkeleton />;

  const status = STATUS_MAP[inquiry.status] ?? {
    variant: "neutral" as BadgeVariant,
    label: inquiry.status,
    Icon: Clock,
  };
  const StatusIcon = status.Icon;

  const eventDateLabel = new Date(inquiry.eventDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const createdAtLabel = new Date(inquiry.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const hasContact = Boolean(inquiry.vendorContactPhone || inquiry.vendorContactEmail);

  const steps: { label: string; state: StepState }[] = [
    { label: "Submitted", state: "done" },
    inquiry.status === "PENDING"
      ? { label: "Awaiting Response", state: "current" }
      : inquiry.status === "DECLINED"
        ? { label: "Declined", state: "declined" }
        : { label: "Accepted", state: "done" },
    inquiry.status === "COMPLETED"
      ? { label: "Completed", state: "done" }
      : inquiry.status === "ACCEPTED"
        ? { label: "Completed", state: "current" }
        : { label: "Completed", state: "future" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-4">
          <Link
            href="/my-inquiries"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            My Inquiries
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight">
              {inquiry.vendorBusinessName}
            </h1>
            <Badge variant="neutral">{inquiry.vendorCategory}</Badge>
            <Badge variant={status.variant}>
              <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {status.label}
            </Badge>
          </div>

          <p className="text-sm text-muted tabular-nums">
            Submitted {createdAtLabel}
          </p>

          <ol className="flex flex-wrap items-center gap-2" aria-label="Request progress">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-5 bg-hairline" aria-hidden="true" />}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                    STEP_CLASSES[step.state],
                  )}
                >
                  {step.state === "done" && <Check className="h-3 w-3" aria-hidden="true" />}
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card className="p-5">
              <CardTitle className="mb-2">Event Details</CardTitle>
              <div className="divide-y divide-hairline">
                <DetailRow icon={Sparkles} label="Event Type" value={inquiry.eventType} />
                <DetailRow icon={Calendar} label="Event Date" value={eventDateLabel} />
                {inquiry.guestCount != null && (
                  <DetailRow
                    icon={Users}
                    label="Guests"
                    value={`${inquiry.guestCount} Guests`}
                  />
                )}
                {inquiry.budget != null && inquiry.budget !== "" && (
                  <DetailRow
                    icon={DollarSign}
                    label="Budget"
                    value={`₹${Number(inquiry.budget).toLocaleString()}`}
                  />
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <CardTitle>Your Request</CardTitle>
              <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
                &ldquo;{inquiry.message}&rdquo;
              </p>
              <div className="divide-y divide-hairline">
                <DetailRow icon={User} label="Name" value={inquiry.customerName} />
                <DetailRow icon={Mail} label="Email" value={inquiry.customerEmail} />
                <DetailRow icon={Phone} label="Phone" value={inquiry.customerPhone} />
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <CardTitle>Vendor Response</CardTitle>
              {inquiry.vendorNotes ? (
                <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
                  &ldquo;{inquiry.vendorNotes}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-muted">No response notes yet</p>
              )}
            </Card>
          </div>

          <aside className="min-w-0 space-y-6">
            <Card className="p-5 space-y-4">
              <CardTitle>Vendor Contact</CardTitle>

              {hasContact ? (
                <div className="space-y-3">
                  {inquiry.vendorContactPhone && (
                    <a
                      href={`tel:${inquiry.vendorContactPhone}`}
                      aria-label={`Call ${inquiry.vendorContactPhone}`}
                      className={cn(PRIMARY_LINK, "tabular-nums")}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Call {inquiry.vendorContactPhone}
                    </a>
                  )}

                  {inquiry.vendorContactEmail && (
                    <a href={`mailto:${inquiry.vendorContactEmail}`} className={SECONDARY_LINK}>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Email Vendor
                    </a>
                  )}

                  {inquiry.vendorContactPhone && (
                    <button
                      type="button"
                      onClick={copyPhone}
                      className="inline-flex h-8 select-none items-center gap-1.5 rounded-md px-0 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-foreground"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {copied ? "Copied" : "Copy Number"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Contact details appear once the vendor accepts your request.
                  </p>
                  <div className="rounded-md bg-surface px-3 py-2 text-xs text-muted">
                    {STATUS_CONTEXT[inquiry.status] ?? status.label}
                  </div>
                </div>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function InquiryDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <InquiryDetailContent />
    </Suspense>
  );
}
