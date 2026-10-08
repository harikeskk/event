"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import VendorNav from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import { getInquiryById, updateInquiryStatus } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface VendorInquiry {
  id: string;
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

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  ACCEPTED: { variant: "success", label: "Accepted" },
  DECLINED: { variant: "danger", label: "Declined" },
  COMPLETED: { variant: "success", label: "Completed" },
};

function DetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-9 w-72 rounded-md" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card className="space-y-4 p-5">
              <Skeleton className="h-5 w-28" />
              <div className="divide-y divide-hairline">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-16 w-full" />
            </Card>

            <Card className="space-y-4 p-5">
              <Skeleton className="h-5 w-32" />
              <div className="divide-y divide-hairline">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-28" />
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="space-y-4 p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
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

function BookingDetailContent() {
  const router = useRouter();
  const { token, isAuthenticated, isVendor, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [inquiry, setInquiry] = useState<VendorInquiry | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesFeedback, setNotesFeedback] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadData = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await getInquiryById(id, token);
      setInquiry(data);
      setNotes(data?.vendorNotes || "");
    } catch (err: any) {
      setError(err?.message || "We couldn't load this booking request. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isVendor)) {
      router.push("/login");
      return;
    }
    if (token && id) loadData();
  }, [authLoading, isAuthenticated, isVendor, token, id, router, loadData]);

  const handleSaveNotes = async () => {
    if (!token || !inquiry || isSavingNotes) return;
    setIsSavingNotes(true);
    setNotesFeedback(null);
    try {
      const updated = await updateInquiryStatus(inquiry.id, inquiry.status, notes, token);
      setInquiry((prev) =>
        prev ? { ...prev, ...(updated || {}), vendorNotes: notes } : prev
      );
      setNotesFeedback({ type: "success", text: "Notes saved" });
    } catch (err: any) {
      setNotesFeedback({
        type: "error",
        text: err?.message || "We couldn't save your notes. Try again.",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAction = async (
    status: "ACCEPTED" | "DECLINED" | "COMPLETED",
    defaultNote: string
  ) => {
    if (!token || !inquiry || actionPending) return;
    setActionPending(true);
    setActionError("");
    const note = notes.trim() || defaultNote;
    try {
      const updated = await updateInquiryStatus(inquiry.id, status, note, token);
      setInquiry((prev) =>
        prev ? { ...prev, ...(updated || {}), status, vendorNotes: note } : prev
      );
      setNotes(note);
      setNotesFeedback(null);
    } catch (err: any) {
      setActionError(err?.message || "We couldn't update this booking. Try again.");
    } finally {
      setActionPending(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" />
            <h1 className="text-base font-medium tracking-tight">Unable to Load This Booking</h1>
            <p className="text-sm text-muted">{error}</p>
            <Link
              href="/vendor/bookings"
              className="mx-auto mt-2 inline-flex h-10 w-auto select-none items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-foreground shadow-hairline transition-[background-color,box-shadow] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Bookings
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
  };

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
  const notesDirty = notes !== (inquiry.vendorNotes || "");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/vendor/bookings"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Bookings
            </Link>
            <VendorNav />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight">
              {inquiry.customerName}
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <p className="text-sm text-muted tabular-nums">
            {inquiry.eventType} · Received {createdAtLabel}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card className="p-5">
              <CardTitle className="mb-2">Customer</CardTitle>
              <div className="divide-y divide-hairline">
                <DetailRow icon={User} label="Name" value={inquiry.customerName} />
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${inquiry.customerEmail}`}
                      className="text-blue transition-colors duration-150 hover:underline"
                    >
                      {inquiry.customerEmail}
                    </a>
                  }
                />
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${inquiry.customerPhone}`}
                      className="transition-colors duration-150 hover:text-blue"
                    >
                      {inquiry.customerPhone}
                    </a>
                  }
                />
              </div>
              <p className="mt-4 rounded-md bg-surface px-3 py-2 text-sm leading-6 text-muted">
                &ldquo;{inquiry.message}&rdquo;
              </p>
            </Card>

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
                <DetailRow icon={Clock} label="Received" value={createdAtLabel} />
              </div>
            </Card>

            <Card className="space-y-3 p-5">
              <CardTitle>Vendor Notes</CardTitle>
              <p className="text-xs text-muted">
                Shared with the customer when they view this request.
              </p>
              <Textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesFeedback(null);
                }}
                placeholder="Add a note for this booking…"
                aria-label="Vendor notes"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  loading={isSavingNotes}
                  disabled={!notesDirty}
                >
                  Save Notes
                </Button>
                {notesFeedback && (
                  <p
                    role="status"
                    className={
                      notesFeedback.type === "success" ? "text-xs text-success" : "text-xs text-danger"
                    }
                  >
                    {notesFeedback.text}
                  </p>
                )}
              </div>
            </Card>
          </div>

          <aside className="min-w-0 space-y-6">
            <Card className="space-y-4 p-5">
              <CardTitle>Status</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <span className="text-xs text-muted tabular-nums">{createdAtLabel}</span>
              </div>

              {inquiry.status === "PENDING" && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    loading={actionPending}
                    onClick={() => handleAction("ACCEPTED", "Accepted via dashboard")}
                  >
                    Accept Request
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-danger hover:text-danger"
                    loading={actionPending}
                    onClick={() => handleAction("DECLINED", "Declined — unavailable")}
                  >
                    Decline Request
                  </Button>
                </div>
              )}

              {inquiry.status === "ACCEPTED" && (
                <Button
                  className="w-full"
                  loading={actionPending}
                  onClick={() => handleAction("COMPLETED", "Completed via dashboard")}
                >
                  Mark Completed
                </Button>
              )}

              {inquiry.status === "DECLINED" && (
                <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
                  You declined this request. No further action is needed.
                </p>
              )}

              {inquiry.status === "COMPLETED" && (
                <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
                  This request is completed. No further action is available.
                </p>
              )}

              {actionError && (
                <p role="alert" className="text-xs text-danger">
                  {actionError}
                </p>
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function VendorBookingDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <BookingDetailContent />
    </Suspense>
  );
}
