"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Store,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getCustomerInquiries } from "../../services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CustomerTopNav } from "@/components/CustomerNav";

type FilterTab = "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

interface CustomerInquiry {
  id: string;
  customerId: string;
  vendorId: string;
  vendorBusinessName: string;
  vendorCategory: string;
  vendorCoverImageUrl?: string | null;
  vendorCity?: string | null;
  vendorAddress?: string | null;
  vendorContactEmail?: string | null;
  vendorContactPhone?: string | null;
  eventType: string;
  eventDate: string;
  guestCount?: number | null;
  budget?: number | string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  message?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
  vendorNotes?: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    badgeVariant: BadgeVariant;
    label: string;
    description: string;
    Icon: LucideIcon;
  }
> = {
  PENDING: {
    badgeVariant: "warning",
    label: "Waiting for vendor",
    description: "The vendor has received your request and will respond shortly.",
    Icon: Clock,
  },
  ACCEPTED: {
    badgeVariant: "success",
    label: "Vendor accepted",
    description: "Vendor accepted your booking! Direct contact details are now unlocked.",
    Icon: CheckCircle,
  },
  DECLINED: {
    badgeVariant: "danger",
    label: "Vendor declined",
    description: "Vendor was unable to accept this booking request.",
    Icon: XCircle,
  },
  COMPLETED: {
    badgeVariant: "neutral",
    label: "Service completed",
    description: "Event service has been fulfilled successfully.",
    Icon: CheckCircle2,
  },
};

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Flexible Date";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function MyInquiriesPage() {
  const router = useRouter();
  const { token, isAuthenticated, isVendor, isLoading: authLoading } = useAuth();

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const loadInquiries = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCustomerInquiries(token);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to fetch customer inquiries:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your bookings. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/my-inquiries");
      return;
    }
    if (token) {
      void loadInquiries();
    }
  }, [token, isAuthenticated, authLoading, router, loadInquiries]);

  // Counts per tab
  const counts = useMemo(() => {
    const res = {
      ALL: inquiries.length,
      PENDING: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      COMPLETED: 0,
    };
    for (const inq of inquiries) {
      if (inq.status in res) {
        res[inq.status]++;
      }
    }
    return res;
  }, [inquiries]);

  // Filtered list
  const filteredInquiries = useMemo(() => {
    if (activeFilter === "ALL") return inquiries;
    return inquiries.filter((inq) => inq.status === activeFilter);
  }, [inquiries, activeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <CustomerTopNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 space-y-8 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Customer Dashboard
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              My Booking Requests
            </h1>
            <p className="mt-1 text-sm text-muted">
              Track the status of your inquiries, view vendor responses, and contact accepted vendors.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => void loadInquiries()}
              disabled={isLoading}
              title="Refresh list"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
            <Link
              href="/explore-vendors"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-inverse px-4 text-xs font-medium text-white shadow-button transition hover:bg-inverse-hover active:bg-[#003e99]"
            >
              <Store className="h-4 w-4" />
              Explore Vendors
            </Link>
          </div>
        </div>

        {/* Vendor Notice if user is also registered as vendor */}
        {isVendor && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs text-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
              You are logged in with a vendor-enabled account. To view incoming customer requests, visit your Vendor Inbox.
            </span>
            <Link
              href="/vendor/bookings"
              className="shrink-0 font-medium text-accent underline underline-offset-2 hover:opacity-80"
            >
              Vendor Inbox &rarr;
            </Link>
          </div>
        )}

        {/* Filters Tabs */}
        {!isLoading && !error && inquiries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
            {(
              [
                { key: "ALL", label: "All" },
                { key: "PENDING", label: "Pending" },
                { key: "ACCEPTED", label: "Accepted" },
                { key: "DECLINED", label: "Declined" },
                { key: "COMPLETED", label: "Completed" },
              ] as const
            ).map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    "inline-flex select-none items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-inverse text-white shadow-button"
                      : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-hairline text-subtle"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-hairline bg-surface p-5 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <Card className="p-8 text-center border-danger/20 bg-danger/5">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-danger" />
              <h3 className="text-base font-semibold text-danger">Failed to Load Bookings</h3>
              <p className="text-sm text-muted">{error}</p>
              <button
                onClick={() => void loadInquiries()}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-inverse px-4 text-xs font-medium text-white shadow-button hover:bg-inverse-hover"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          </Card>
        )}

        {/* Empty State: Zero Inquiries Overall */}
        {!isLoading && !error && inquiries.length === 0 && (
          <Card className="p-12 text-center border-dashed border-hairline">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-hairline">
                <Clock className="h-6 w-6 text-muted" />
              </div>
              <h3 className="text-base font-semibold">No Booking Requests Yet</h3>
              <p className="text-sm text-muted">
                You haven&apos;t sent any booking inquiries yet. Discover nearby DJs, photographers, caterers, and decorators to get started.
              </p>
              <Link
                href="/explore-vendors"
                className="mt-2 inline-flex h-9 select-none items-center gap-2 rounded-lg bg-inverse px-4 text-xs font-medium text-white shadow-button hover:bg-inverse-hover"
              >
                <Store className="h-4 w-4" />
                Discover Nearby Vendors
              </Link>
            </div>
          </Card>
        )}

        {/* Empty State: Zero Inquiries in Current Filter */}
        {!isLoading && !error && inquiries.length > 0 && filteredInquiries.length === 0 && (
          <Card className="p-10 text-center border-dashed border-hairline">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Clock className="h-5 w-5 text-muted" />
              </div>
              <h3 className="text-sm font-semibold">
                No {activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Bookings
              </h3>
              <p className="text-xs text-muted">
                There are no booking inquiries currently matching this filter status.
              </p>
              <button
                onClick={() => setActiveFilter("ALL")}
                className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 text-xs font-medium text-foreground hover:bg-surface-hover"
              >
                View All Bookings ({inquiries.length})
              </button>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        {!isLoading && !error && filteredInquiries.length > 0 && (
          <div className="space-y-4">
            {filteredInquiries.map((inq) => {
              const cfg = STATUS_CONFIG[inq.status] ?? STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.Icon;
              const locationStr =
                inq.vendorAddress || inq.vendorCity || "Location provided";

              const isAccepted = inq.status === "ACCEPTED";
              const isDeclined = inq.status === "DECLINED";
              const isCompleted = inq.status === "COMPLETED";
              const isPending = inq.status === "PENDING";

              return (
                <div
                  key={inq.id}
                  className="group rounded-xl border border-hairline bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Row: Vendor Info & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-hairline pb-4">
                      <div className="flex items-start gap-3.5">
                        {inq.vendorCoverImageUrl ? (
                          <img
                            src={inq.vendorCoverImageUrl}
                            alt={inq.vendorBusinessName}
                            className="h-14 w-14 shrink-0 rounded-lg object-cover shadow-hairline"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface text-base font-semibold text-muted shadow-hairline">
                            {inq.vendorBusinessName?.charAt(0) || "V"}
                          </div>
                        )}

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base tracking-tight text-foreground truncate">
                              {inq.vendorBusinessName}
                            </h3>
                            <Badge variant="neutral" className="text-[10px]">
                              {inq.vendorCategory}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="h-3.5 w-3.5 text-muted shrink-0" />
                              {locationStr}
                            </span>
                            <span className="text-subtle">&bull;</span>
                            <span className="tabular-nums">
                              Submitted on {formatRelativeTime(inq.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="self-start sm:self-auto shrink-0">
                        <Badge
                          variant={cfg.badgeVariant}
                          className="gap-1.5 px-3 py-1 text-xs font-medium"
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Event Snapshot Details Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-lg bg-surface/60 p-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                          Event Type
                        </span>
                        <p className="font-medium text-foreground truncate">
                          {inq.eventType || "Event"}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                          Event Date
                        </span>
                        <p className="font-medium text-foreground truncate tabular-nums flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted shrink-0" />
                          {formatDisplayDate(inq.eventDate)}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                          Guest Count
                        </span>
                        <p className="font-medium text-foreground tabular-nums flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted shrink-0" />
                          {inq.guestCount ? `${inq.guestCount} guests` : "Not specified"}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-subtle">
                          Estimated Budget
                        </span>
                        <p className="font-medium text-foreground tabular-nums flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted shrink-0" />
                          {inq.budget
                            ? `₹${Number(inq.budget).toLocaleString("en-IN")}`
                            : "Open to quote"}
                        </p>
                      </div>
                    </div>

                    {/* Customer Message Excerpt */}
                    {inq.message && (
                      <div className="rounded-lg bg-surface px-3 py-2 text-xs text-muted">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-subtle shrink-0 mt-0.5" />
                          <p className="line-clamp-2 italic">
                            &ldquo;{inq.message}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}

                    {/* STATUS SPECIFIC ACTION / CONTACT CALLOUT */}

                    {/* ACCEPTED: Contact Permitted Information */}
                    {isAccepted && (
                      <div className="rounded-lg border border-success/30 bg-success/5 p-3.5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Vendor Accepted! You can now contact them directly:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {inq.vendorContactPhone ? (
                            <a
                              href={`tel:${inq.vendorContactPhone}`}
                              className="inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-emerald-900 shadow-hairline transition hover:bg-emerald-50 active:bg-emerald-100"
                            >
                              <Phone className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Call {inq.vendorContactPhone}</span>
                            </a>
                          ) : null}

                          {inq.vendorContactEmail ? (
                            <a
                              href={`mailto:${inq.vendorContactEmail}?subject=Regarding Booking for ${encodeURIComponent(inq.eventType)} on ${inq.eventDate}`}
                              className="inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-emerald-900 shadow-hairline transition hover:bg-emerald-50 active:bg-emerald-100"
                            >
                              <Mail className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Email {inq.vendorContactEmail}</span>
                            </a>
                          ) : null}

                          {!inq.vendorContactPhone && !inq.vendorContactEmail && (
                            <span className="text-xs text-muted">
                              Vendor has accepted. Detailed contact instructions are in the booking details.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DECLINED: Display Vendor Response Note */}
                    {isDeclined && (
                      <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-danger shrink-0" />
                          <span>Vendor Response:</span>
                        </div>
                        {inq.vendorNotes ? (
                          <p className="text-rose-900 pl-5">
                            &ldquo;{inq.vendorNotes}&rdquo;
                          </p>
                        ) : (
                          <p className="text-muted pl-5">
                            The vendor was unavailable for this event date or capacity requirements.
                          </p>
                        )}
                      </div>
                    )}

                    {/* PENDING: Reassurance Notice */}
                    {isPending && (
                      <div className="flex items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-xs text-muted">
                        <Clock className="h-3.5 w-3.5 text-warning shrink-0" />
                        <span>
                          The vendor will review your inquiry. Contact details will be unlocked once accepted.
                        </span>
                      </div>
                    )}

                    {/* COMPLETED: Notice */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-xs text-muted">
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>This service has been marked as completed.</span>
                      </div>
                    )}

                    {/* Footer Row: Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-hairline">
                      <div className="text-[11px] text-subtle">
                        Booking Reference: <span className="font-mono text-muted">{inq.id.slice(0, 8)}...</span>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        {isDeclined && (
                          <Link
                            href="/explore-vendors"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-surface-hover"
                          >
                            Explore Alternatives
                          </Link>
                        )}

                        <Link
                          href={`/my-inquiries/${inq.id}`}
                          className={cn(
                            "inline-flex h-8 select-none items-center gap-1.5 rounded-md px-3.5 text-xs font-medium transition duration-150",
                            isAccepted
                              ? "bg-inverse text-white shadow-button hover:bg-inverse-hover active:bg-[#003e99]"
                              : "border border-hairline bg-white text-foreground shadow-hairline hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover"
                          )}
                        >
                          View Booking
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
