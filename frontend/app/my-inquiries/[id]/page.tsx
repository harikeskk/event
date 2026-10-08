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
  MapPin,
  Phone,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Users,
  XCircle,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getInquiryById } from "../../../services/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CustomerTopNav } from "@/components/CustomerNav";

interface Inquiry {
  id: string;
  customerId: string;
  vendorId: string;
  vendorBusinessName: string;
  vendorCategory: string;
  vendorCoverImageUrl?: string | null;
  vendorCity?: string | null;
  vendorAddress?: string | null;
  vendorIsAvailable?: boolean | null;
  vendorContactEmail?: string | null;
  vendorContactPhone?: string | null;
  eventType: string;
  eventDate: string;
  guestCount?: number | null;
  budget?: number | string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
  vendorNotes?: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    variant: BadgeVariant;
    label: string;
    headline: string;
    description: string;
    Icon: LucideIcon;
    bannerBg: string;
    bannerBorder: string;
    textColor: string;
  }
> = {
  PENDING: {
    variant: "warning",
    label: "Pending",
    headline: "Waiting for vendor response.",
    description:
      "The vendor has received your booking inquiry and is reviewing event availability and requirements. You will be notified once they respond.",
    Icon: Clock,
    bannerBg: "bg-warning/10",
    bannerBorder: "border-warning/30",
    textColor: "text-amber-800",
  },
  ACCEPTED: {
    variant: "success",
    label: "Accepted",
    headline: "Your booking request has been accepted.",
    description:
      "Great news! The vendor has approved your booking for this event. Permitted contact details are unlocked below. You can now contact the vendor directly to coordinate specifics.",
    Icon: CheckCircle,
    bannerBg: "bg-success/10",
    bannerBorder: "border-success/30",
    textColor: "text-emerald-800",
  },
  DECLINED: {
    variant: "danger",
    label: "Declined",
    headline: "Booking request declined.",
    description:
      "The vendor was unable to take on this booking request for the specified date or requirements.",
    Icon: XCircle,
    bannerBg: "bg-danger/10",
    bannerBorder: "border-danger/30",
    textColor: "text-rose-800",
  },
  COMPLETED: {
    variant: "neutral",
    label: "Completed",
    headline: "Service completed.",
    description:
      "This event booking has been successfully fulfilled by the vendor.",
    Icon: CheckCircle2,
    bannerBg: "bg-surface",
    bannerBorder: "border-hairline",
    textColor: "text-foreground",
  },
};

type StepState = "done" | "current" | "declined" | "future";

const STEP_CLASSES: Record<StepState, string> = {
  done: "bg-success/10 text-success",
  current: "bg-white text-foreground shadow-hairline-strong font-semibold",
  declined: "bg-danger/10 text-danger font-semibold",
  future: "bg-surface text-subtle",
};

function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-20 w-full" />
            </Card>

            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-16 w-full" />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-hairline last:border-b-0">
      <span className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="h-4 w-4 shrink-0 text-subtle" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs font-semibold tabular-nums text-foreground">
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
  const [errorType, setErrorType] = useState<"403" | "404" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/my-inquiries/${id}`);
      return;
    }

    if (token && id) {
      setIsLoading(true);
      setErrorType(null);
      getInquiryById(id, token)
        .then((data) => {
          setInquiry(data);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to load booking";
          if (msg.includes("access") || msg.includes("forbidden") || msg.includes("403")) {
            setErrorType("403");
            setErrorMessage("You do not have access to this booking. You can only view bookings you submitted.");
          } else if (msg.includes("not found") || msg.includes("404")) {
            setErrorType("404");
            setErrorMessage("This booking request does not exist or may have been removed.");
          } else {
            setErrorType("error");
            setErrorMessage(msg);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [token, isAuthenticated, authLoading, id, router]);

  const copyPhone = async () => {
    if (!inquiry?.vendorContactPhone) return;
    try {
      await navigator.clipboard.writeText(inquiry.vendorContactPhone);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(false);
    }
  };

  const copyEmail = async () => {
    if (!inquiry?.vendorContactEmail) return;
    try {
      await navigator.clipboard.writeText(inquiry.vendorContactEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  // Error States (403 Forbidden, 404 Not Found, Generic Error)
  if (errorType || !inquiry) {
    const is403 = errorType === "403";
    const is404 = errorType === "404";
    const Icon = is403 ? ShieldAlert : is404 ? SearchX : AlertCircle;
    const title = is403
      ? "Access Restricted"
      : is404
      ? "Booking Request Not Found"
      : "Unable to Load Booking Request";

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <CustomerTopNav />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <Card className="w-full max-w-md space-y-4 p-8 text-center shadow-card border-hairline">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-hairline">
              <Icon className={cn("h-6 w-6", is403 ? "text-danger" : "text-muted")} />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-muted leading-relaxed">
              {errorMessage || "We could not find or load the requested booking."}
            </p>
            <div className="pt-2">
              <Link
                href="/my-inquiries"
                className="inline-flex h-9 select-none items-center justify-center gap-2 rounded-lg bg-inverse px-4 text-xs font-medium text-white shadow-button transition hover:bg-inverse-hover active:bg-[#003e99]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to My Bookings
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[inquiry.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.Icon;

  const isAccepted = inquiry.status === "ACCEPTED";
  const isDeclined = inquiry.status === "DECLINED";
  const isPending = inquiry.status === "PENDING";
  const isCompleted = inquiry.status === "COMPLETED";

  const eventDateFormatted = new Date(inquiry.eventDate).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const createdAtFormatted = new Date(inquiry.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const vendorLocation =
    inquiry.vendorAddress || inquiry.vendorCity || "Location provided";

  // Progress steps
  const steps: { label: string; state: StepState }[] = [
    { label: "Request Submitted", state: "done" },
    isPending
      ? { label: "Vendor Review", state: "current" }
      : isDeclined
      ? { label: "Declined", state: "declined" }
      : { label: "Vendor Accepted", state: "done" },
    isCompleted
      ? { label: "Service Completed", state: "done" }
      : isAccepted
      ? { label: "Service Fulfillment", state: "current" }
      : { label: "Completed", state: "future" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <CustomerTopNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 space-y-8 flex-1">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/my-inquiries"
            className="inline-flex select-none items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-hover hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to My Bookings
          </Link>

          <span className="font-mono text-[11px] text-subtle">
            Ref: {inquiry.id}
          </span>
        </div>

        {/* Vendor & Booking Header */}
        <header className="space-y-4 border-b border-hairline pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {inquiry.vendorCoverImageUrl ? (
                <img
                  src={inquiry.vendorCoverImageUrl}
                  alt={inquiry.vendorBusinessName}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-hairline"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface text-xl font-bold text-muted shadow-hairline">
                  {inquiry.vendorBusinessName.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                    {inquiry.vendorBusinessName}
                  </h1>
                  <Badge variant="neutral" className="text-xs">
                    {inquiry.vendorCategory}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                    {vendorLocation}
                  </span>
                  <span className="text-subtle">&bull;</span>
                  {inquiry.vendorIsAvailable != null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        inquiry.vendorIsAvailable ? "text-success" : "text-subtle"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          inquiry.vendorIsAvailable ? "bg-success" : "bg-muted"
                        )}
                      />
                      {inquiry.vendorIsAvailable ? "Accepting Bookings" : "Currently Unavailable"}
                    </span>
                  )}
                  <span className="text-subtle">&bull;</span>
                  <span className="tabular-nums">Submitted {createdAtFormatted}</span>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="self-start sm:self-auto shrink-0">
              <Badge variant={cfg.variant} className="gap-1.5 px-3 py-1.5 text-xs font-semibold">
                <StatusIcon className="h-3.5 w-3.5" />
                {cfg.label}
              </Badge>
            </div>
          </div>

          {/* Progress Tracker Steps */}
          <ol className="flex flex-wrap items-center gap-2 pt-2" aria-label="Booking lifecycle">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-4 sm:w-6 bg-hairline" />}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap",
                    STEP_CLASSES[step.state]
                  )}
                >
                  {step.state === "done" && <Check className="h-3 w-3" />}
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </header>

        {/* STATUS BANNER (Exact requirement states) */}
        <section
          className={cn(
            "rounded-xl border p-4 sm:p-5 transition-colors",
            cfg.bannerBg,
            cfg.bannerBorder
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("h-4 w-4 shrink-0", cfg.textColor)} />
                <h2 className={cn("text-sm sm:text-base font-semibold", cfg.textColor)}>
                  {cfg.headline}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-2xl pl-6">
                {cfg.description}
              </p>
            </div>

            {/* Quick action buttons right inside the banner for accepted */}
            {isAccepted && (inquiry.vendorContactPhone || inquiry.vendorContactEmail) && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 pl-6 sm:pl-0">
                {inquiry.vendorContactPhone && (
                  <a
                    href={`tel:${inquiry.vendorContactPhone}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 text-xs font-medium text-white shadow-button transition hover:bg-emerald-800"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Vendor
                  </a>
                )}
                {inquiry.vendorContactEmail && (
                  <a
                    href={`mailto:${inquiry.vendorContactEmail}?subject=Regarding Booking for ${encodeURIComponent(inquiry.eventType)}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-white px-3.5 text-xs font-medium text-emerald-900 shadow-hairline transition hover:bg-emerald-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email Vendor
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* DECLINED: Vendor Note Callout */}
        {isDeclined && (
          <section className="rounded-xl border border-danger/30 bg-danger/5 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
              <XCircle className="h-4 w-4 text-danger" />
              <span>Vendor Response Note</span>
            </div>
            {inquiry.vendorNotes ? (
              <p className="text-xs sm:text-sm text-rose-950 italic pl-6 bg-white/60 p-3 rounded-lg border border-danger/10">
                &ldquo;{inquiry.vendorNotes}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-muted pl-6">
                The vendor did not leave an optional explanation note. You can check alternative available vendors in this category.
              </p>
            )}
            <div className="pt-2 pl-6">
              <Link
                href="/explore-vendors"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-white px-3 text-xs font-medium text-foreground shadow-hairline hover:bg-surface"
              >
                <Store className="h-3.5 w-3.5" />
                Explore Other Available Vendors
              </Link>
            </div>
          </section>
        )}

        {/* MAIN DETAILS & SIDEBAR GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column (2 spans) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Event Details Card */}
            <Card className="p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between border-b border-hairline pb-3 mb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Event Specifications
                </CardTitle>
                <Badge variant="neutral" className="text-[10px]">
                  Confirmed Requirements
                </Badge>
              </div>

              <div className="divide-y divide-hairline">
                <DetailRow
                  icon={Sparkles}
                  label="Event Type"
                  value={inquiry.eventType || "Event Celebration"}
                />
                <DetailRow
                  icon={Calendar}
                  label="Event Date"
                  value={eventDateFormatted}
                />
                <DetailRow
                  icon={Users}
                  label="Guest Count"
                  value={
                    inquiry.guestCount
                      ? `${inquiry.guestCount.toLocaleString()} guests`
                      : "Not specified"
                  }
                />
                <DetailRow
                  icon={DollarSign}
                  label="Estimated Budget"
                  value={
                    inquiry.budget
                      ? `₹${Number(inquiry.budget).toLocaleString("en-IN")}`
                      : "Open to quote"
                  }
                />
              </div>
            </Card>

            {/* Customer Details Card */}
            <Card className="p-5 sm:p-6 shadow-card">
              <div className="border-b border-hairline pb-3 mb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Customer Information
                </CardTitle>
              </div>

              <div className="divide-y divide-hairline">
                <DetailRow
                  icon={User}
                  label="Primary Contact Name"
                  value={inquiry.customerName || "Customer"}
                />
                <DetailRow
                  icon={Mail}
                  label="Registered Email"
                  value={inquiry.customerEmail || "Not provided"}
                />
                <DetailRow
                  icon={Phone}
                  label="Contact Phone"
                  value={inquiry.customerPhone || "Not provided"}
                />
              </div>
            </Card>

            {/* Requirements & Message Card */}
            <Card className="p-5 sm:p-6 shadow-card space-y-3">
              <div className="border-b border-hairline pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  Booking Requirements &amp; Message
                </CardTitle>
              </div>

              <div className="rounded-lg bg-surface/70 p-4 border border-hairline">
                <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed italic">
                  &ldquo;{inquiry.message || "No custom message provided."}&rdquo;
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar Column (1 span) */}
          <aside className="space-y-6">
            {/* Vendor Contact Information Card */}
            <Card className="p-5 sm:p-6 shadow-card space-y-4">
              <div className="border-b border-hairline pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent" />
                  Vendor Contact Information
                </CardTitle>
              </div>

              {isAccepted || isCompleted ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted leading-relaxed">
                    The vendor has verified this booking. You can reach out directly via phone or email:
                  </p>

                  {inquiry.vendorContactPhone ? (
                    <div className="space-y-1.5 rounded-lg border border-hairline bg-surface/50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          Phone Number
                        </span>
                        <button
                          type="button"
                          onClick={copyPhone}
                          className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                        >
                          {copiedPhone ? (
                            <>
                              <Check className="h-3 w-3 text-success" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {inquiry.vendorContactPhone}
                      </p>
                      <a
                        href={`tel:${inquiry.vendorContactPhone}`}
                        className="mt-2 inline-flex h-8 w-full select-none items-center justify-center gap-2 rounded-md bg-inverse px-3 text-xs font-medium text-white shadow-button transition hover:bg-inverse-hover active:bg-[#003e99]"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call Vendor
                      </a>
                    </div>
                  ) : null}

                  {inquiry.vendorContactEmail ? (
                    <div className="space-y-1.5 rounded-lg border border-hairline bg-surface/50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Mail className="h-3 w-3 text-emerald-600" />
                          Email Address
                        </span>
                        <button
                          type="button"
                          onClick={copyEmail}
                          className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                        >
                          {copiedEmail ? (
                            <>
                              <Check className="h-3 w-3 text-success" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {inquiry.vendorContactEmail}
                      </p>
                      <a
                        href={`mailto:${inquiry.vendorContactEmail}?subject=Regarding Booking for ${encodeURIComponent(inquiry.eventType)}`}
                        className="mt-2 inline-flex h-8 w-full select-none items-center justify-center gap-2 rounded-md border border-hairline bg-white px-3 text-xs font-medium text-foreground shadow-hairline transition hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email Vendor
                      </a>
                    </div>
                  ) : null}

                  {!inquiry.vendorContactPhone && !inquiry.vendorContactEmail && (
                    <p className="text-xs text-muted">
                      No direct contact details provided by this vendor.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-lg bg-surface/80 p-3.5 border border-hairline text-xs text-muted">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-muted" />
                    <span>Privacy Protected</span>
                  </div>
                  <p className="leading-relaxed">
                    {isPending
                      ? "Vendor contact details remain protected while the inquiry is pending review. Once accepted, you will be able to call or email them directly."
                      : isDeclined
                      ? "Contact details are withheld because this inquiry was declined."
                      : "Contact information is only unlocked for accepted bookings."}
                  </p>
                </div>
              )}
            </Card>

            {/* Vendor Profile Link Card */}
            <Card className="p-5 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-accent shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {inquiry.vendorBusinessName}
                  </h4>
                  <p className="text-[11px] text-muted">
                    {inquiry.vendorCategory} &bull; {vendorLocation}
                  </p>
                </div>
              </div>

              {inquiry.vendorId && (
                <Link
                  href={`/vendors/${inquiry.vendorId}`}
                  className="inline-flex h-8 w-full select-none items-center justify-center gap-2 rounded-md border border-hairline bg-white px-3 text-xs font-medium text-foreground shadow-hairline transition hover:bg-surface hover:shadow-hairline-strong"
                >
                  View Public Vendor Page
                </Link>
              )}
            </Card>

            {/* Booking Metadata Card */}
            <Card className="p-5 shadow-card space-y-2 text-xs text-muted">
              <div className="flex justify-between py-1 border-b border-hairline">
                <span>Inquiry ID</span>
                <span className="font-mono text-foreground">{inquiry.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-1 border-b border-hairline">
                <span>Created</span>
                <span className="text-foreground">{createdAtFormatted}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Status</span>
                <span className="font-semibold text-foreground">{cfg.label}</span>
              </div>
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
