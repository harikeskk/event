"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Inbox,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import { VendorTopNav, VendorTabs } from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import { getVendorInbox, updateInquiryStatus } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VendorInquiry {
  id: string;
  eventType: string;
  eventDate: string;
  guestCount: number | null;
  budget: number | string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  message: string;
  status: string;
  vendorNotes: string | null;
  createdAt: string;
}

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  ACCEPTED: { variant: "success", label: "Accepted" },
  DECLINED: { variant: "danger", label: "Declined" },
  COMPLETED: { variant: "success", label: "Completed" },
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "DECLINED", label: "Declined" },
  { key: "COMPLETED", label: "Completed" },
];

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function VendorBookingsPage() {
  const router = useRouter();
  const { token, isAuthenticated, isVendor, isLoading: authLoading, logout } = useAuth();

  const [leads, setLeads] = useState<VendorInquiry[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setLoadError("Unauthenticated");
      return;
    }
    setIsLoading(true);
    setLoadError("");
    try {
      const inbox = await getVendorInbox(token);
      setLeads(inbox || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load bookings";
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isVendor)) {
      setLoadError("Unauthenticated");
      setIsLoading(false);
      return;
    }
    if (token) {
      loadData();
    }
  }, [authLoading, isAuthenticated, isVendor, token, loadData]);

  const handleStatus = async (lead: VendorInquiry, next: "ACCEPTED" | "DECLINED") => {
    if (!token || updatingKey) return;
    const actionKey = `${lead.id}:${next}`;
    const snapshot = leads;
    const note = next === "ACCEPTED" ? "Accepted via dashboard" : "Declined — unavailable";
    setRowErrors((prev) => ({ ...prev, [lead.id]: "" }));
    setUpdatingKey(actionKey);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
    try {
      const updated = await updateInquiryStatus(lead.id, next, note, token);
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, ...(updated || {}), status: next } : l))
      );
    } catch (err: unknown) {
      setLeads(snapshot);
      const msg = err instanceof Error ? err.message : "Failed to update booking";
      setRowErrors((prev) => ({
        ...prev,
        [lead.id]: msg,
      }));
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleLogout = () => {
    logout("/login");
  };

  const handleReLogin = () => {
    logout("/login?redirect=/vendor/bookings");
  };

  const isUnauthenticated =
    loadError.toLowerCase().includes("unauthenticated") ||
    loadError.toLowerCase().includes("jwt") ||
    loadError.toLowerCase().includes("401") ||
    loadError.toLowerCase().includes("expired");

  const counts: Record<StatusFilter, number> = {
    ALL: leads.length,
    PENDING: leads.filter((l) => l.status === "PENDING").length,
    ACCEPTED: leads.filter((l) => l.status === "ACCEPTED").length,
    DECLINED: leads.filter((l) => l.status === "DECLINED").length,
    COMPLETED: leads.filter((l) => l.status === "COMPLETED").length,
  };

  // Newest requests first (mirrors backend OrderByCreatedAtDesc; re-sorted
  // client-side so optimistic updates and any unsorted payloads stay ordered).
  const visible = [...leads]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .filter((l) => filter === "ALL" || l.status === filter);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Top Application Bar with Brand, Marketplace link, and Logout */}
      <VendorTopNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 space-y-8 flex-1">
        {/* Header */}
        <header className="space-y-5 border-b border-hairline pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Customer Bookings
              </h1>
              <p className="text-xs text-muted">
                Review and respond to client booking inquiries and manage fulfillment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs text-muted hover:text-danger hover:bg-danger/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <VendorTabs />
          </div>
        </header>

        {/* Status Filter Tabs */}
        {!isLoading && !loadError && leads.length > 0 && (
          <div
            role="group"
            aria-label="Filter bookings by status"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-hairline bg-surface/80 p-1 shadow-hairline"
          >
            {FILTERS.map((option) => {
              const active = filter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-[background-color,color,box-shadow] duration-150",
                    active
                      ? "bg-white text-foreground shadow-card"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  )}
                >
                  <span>{option.label}</span>
                  <span className="text-[10px] tabular-nums text-subtle font-normal">
                    {counts[option.key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card border border-hairline">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <Card className="mx-auto max-w-lg p-8 sm:p-10 text-center shadow-card border-hairline space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-hairline">
              {isUnauthenticated ? (
                <Lock className="h-7 w-7" />
              ) : (
                <AlertCircle className="h-7 w-7" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {isUnauthenticated
                  ? "Vendor Authentication Required"
                  : "Unable to Load Bookings"}
              </h2>
              <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                {isUnauthenticated
                  ? "Your vendor session has expired. Please log in to view and respond to bookings."
                  : loadError || "A network or server error occurred."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {isUnauthenticated ? (
                <>
                  <Button
                    onClick={handleReLogin}
                    className="w-full sm:w-auto gap-2 text-xs"
                  >
                    Log In to Vendor Account
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleLogout}
                    className="w-full sm:w-auto gap-2 text-xs text-danger hover:bg-danger/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Switch Account
                  </Button>
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="ghost" className="w-full sm:w-auto text-xs">
                      Marketplace
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button onClick={loadData} className="w-full sm:w-auto gap-2 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleReLogin}
                    className="w-full sm:w-auto text-xs"
                  >
                    Log In Again
                  </Button>
                </>
              )}
            </div>
          </Card>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center shadow-card">
            <div className="mx-auto flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8 text-muted" aria-hidden="true" />
              <h3 className="text-sm font-semibold tracking-tight">No Bookings Yet</h3>
              <p className="max-w-md text-xs text-muted">
                Booking requests from customers will appear here as soon as they are submitted.
              </p>
            </div>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="p-10 text-center shadow-card">
            <div className="mx-auto flex flex-col items-center gap-2">
              <Clock className="h-8 w-8 text-muted" aria-hidden="true" />
              <h3 className="text-sm font-semibold tracking-tight">
                No {FILTERS.find((f) => f.key === filter)?.label} Bookings
              </h3>
              <p className="max-w-md text-xs text-muted">
                Try a different status filter to view your other inquiries.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setFilter("ALL")}
              >
                Show All Bookings
              </Button>
            </div>
          </Card>
        ) : (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card border border-hairline overflow-hidden">
            {visible.map((lead) => {
              const status = STATUS_MAP[lead.status] ?? {
                variant: "neutral" as BadgeVariant,
                label: lead.status,
              };
              const rowError = rowErrors[lead.id];
              const rowBusy =
                updatingKey !== null && updatingKey.startsWith(`${lead.id}:`);
              const openDetail = () => {
                // Don't hijack text selection inside the message.
                if (
                  typeof window !== "undefined" &&
                  window.getSelection()?.toString()
                ) {
                  return;
                }
                router.push(`/vendor/bookings/${lead.id}`);
              };
              return (
                <div
                  key={lead.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`View booking from ${lead.customerName || "customer"}`}
                  onClick={openDetail}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/vendor/bookings/${lead.id}`);
                    }
                  }}
                  className="p-5 cursor-pointer transition-colors hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {lead.customerName}
                        </span>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>

                      {(lead.customerEmail || lead.customerPhone) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          {lead.customerEmail && (
                            <span className="flex items-center gap-1 break-all">
                              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              {lead.customerEmail}
                            </span>
                          )}
                          {lead.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              {lead.customerPhone}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted tabular-nums">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {lead.eventType} &bull; {formatEventDate(lead.eventDate)}
                        </span>
                        {lead.guestCount != null && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            {lead.guestCount} Guests
                          </span>
                        )}
                        {lead.budget != null && lead.budget !== "" && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                            ₹{Number(lead.budget).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 rounded-lg bg-surface/70 border border-hairline px-3 py-2 text-xs text-foreground/80 italic">
                        &ldquo;{lead.message}&rdquo;
                      </p>

                      <p className="text-[11px] text-subtle tabular-nums">
                        Received {formatCreatedAt(lead.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:flex-col md:items-end md:self-center">
                      {lead.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            loading={updatingKey === `${lead.id}:ACCEPTED`}
                            disabled={rowBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatus(lead, "ACCEPTED");
                            }}
                            className="w-24 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-24 text-xs text-danger hover:text-danger hover:bg-danger/10"
                            loading={updatingKey === `${lead.id}:DECLINED`}
                            disabled={rowBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatus(lead, "DECLINED");
                            }}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                        Details
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  {rowError && (
                    <p role="alert" className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-danger">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {rowError}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadData();
                        }}
                        className="font-medium underline underline-offset-2 ml-1"
                      >
                        Refresh
                      </button>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
