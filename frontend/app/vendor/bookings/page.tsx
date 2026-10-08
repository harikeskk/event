"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Inbox,
  Users,
} from "lucide-react";
import VendorNav from "@/components/VendorNav";
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
  const { token, isAuthenticated, isVendor, isLoading: authLoading } = useAuth();

  const [leads, setLeads] = useState<VendorInquiry[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const inbox = await getVendorInbox(token);
      setLeads(inbox || []);
    } catch (err: any) {
      setLoadError(
        err?.message || "We couldn't load your bookings. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isVendor)) {
      router.push("/login");
      return;
    }
    if (token) loadData();
  }, [authLoading, isAuthenticated, isVendor, token, router, loadData]);

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
    } catch (err: any) {
      setLeads(snapshot);
      setRowErrors((prev) => ({
        ...prev,
        [lead.id]:
          err?.message || "We couldn't update this booking. Refresh and try again.",
      }));
    } finally {
      setUpdatingKey(null);
    }
  };

  const counts: Record<StatusFilter, number> = {
    ALL: leads.length,
    PENDING: leads.filter((l) => l.status === "PENDING").length,
    ACCEPTED: leads.filter((l) => l.status === "ACCEPTED").length,
    DECLINED: leads.filter((l) => l.status === "DECLINED").length,
    COMPLETED: leads.filter((l) => l.status === "COMPLETED").length,
  };

  const visible =
    filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tighter">Bookings</h1>
            <p className="text-sm text-muted">Review and respond to customer booking requests</p>
          </div>
          <VendorNav />
        </header>

        {!isLoading && !loadError && leads.length > 0 && (
          <div
            role="group"
            aria-label="Filter bookings by status"
            className="inline-flex flex-wrap items-center gap-0.5 self-start rounded-full bg-surface p-0.5 shadow-hairline"
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
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-[background-color,color,box-shadow] duration-150",
                    active
                      ? "bg-white font-medium text-foreground shadow-card"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {option.label}
                  <span className="text-xs tabular-nums text-subtle">{counts[option.key]}</span>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <Card className="space-y-3 p-10 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" />
            <h2 className="text-base font-medium tracking-tight">Couldn&rsquo;t Load Your Bookings</h2>
            <p className="mx-auto max-w-md text-sm text-muted">{loadError}</p>
            <Button onClick={loadData} className="mt-2">
              Retry
            </Button>
          </Card>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex flex-col items-center gap-2">
              <Inbox className="h-6 w-6 text-muted" aria-hidden="true" />
              <h3 className="text-base font-medium tracking-tight">No Bookings Yet</h3>
              <p className="max-w-md text-sm text-muted">
                Booking requests from customers will appear here as soon as they come in.
              </p>
            </div>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto flex flex-col items-center gap-2">
              <Clock className="h-6 w-6 text-muted" aria-hidden="true" />
              <h3 className="text-base font-medium tracking-tight">
                No {FILTERS.find((f) => f.key === filter)?.label} Bookings
              </h3>
              <p className="max-w-md text-sm text-muted">
                Try a different filter to see your other booking requests.
              </p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => setFilter("ALL")}>
                Show All Bookings
              </Button>
            </div>
          </Card>
        ) : (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
            {visible.map((lead) => {
              const status = STATUS_MAP[lead.status] ?? {
                variant: "neutral" as BadgeVariant,
                label: lead.status,
              };
              const rowError = rowErrors[lead.id];
              const rowBusy =
                updatingKey !== null && updatingKey.startsWith(`${lead.id}:`);
              return (
                <div key={lead.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <Link
                      href={`/vendor/bookings/${lead.id}`}
                      className="min-w-0 flex-1 space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-medium leading-6 tracking-tight">
                          {lead.customerName}
                        </span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted tabular-nums">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {lead.eventType} · {formatEventDate(lead.eventDate)}
                        </span>
                        {lead.guestCount != null && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            {lead.guestCount} Guests
                          </span>
                        )}
                        {lead.budget != null && lead.budget !== "" && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />₹{Number(lead.budget).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 rounded-md bg-surface px-3 py-2 text-sm text-muted">
                        &ldquo;{lead.message}&rdquo;
                      </p>

                      <p className="text-xs text-subtle tabular-nums">
                        Received {formatCreatedAt(lead.createdAt)}
                      </p>
                    </Link>

                    {lead.status === "PENDING" && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:flex-col md:items-end md:self-center">
                        <Button
                          size="sm"
                          loading={updatingKey === `${lead.id}:ACCEPTED`}
                          disabled={rowBusy}
                          onClick={() => handleStatus(lead, "ACCEPTED")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:text-danger"
                          loading={updatingKey === `${lead.id}:DECLINED`}
                          disabled={rowBusy}
                          onClick={() => handleStatus(lead, "DECLINED")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>

                  {rowError && (
                    <p role="alert" className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-danger">
                      {rowError}
                      <button
                        type="button"
                        onClick={loadData}
                        className="font-medium underline underline-offset-2"
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
