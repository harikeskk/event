"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, ChevronRight, Mail } from "lucide-react";
import VendorNav from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import { getVendorInbox, getMyProfile, toggleVendorAvailability } from "@/services/api";
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
  createdAt: string;
}

interface VendorProfile {
  businessName: string;
  category: string;
  isAvailable: boolean;
}

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  ACCEPTED: { variant: "success", label: "Accepted" },
  DECLINED: { variant: "danger", label: "Declined" },
  COMPLETED: { variant: "success", label: "Completed" },
};

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

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isVendor, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [leads, setLeads] = useState<VendorInquiry[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const [profileData, inbox] = await Promise.all([
        getMyProfile(token),
        getVendorInbox(token),
      ]);
      setProfile(profileData);
      setLeads(inbox || []);
      setIsAvailable(!!profileData?.isAvailable);
    } catch (err: any) {
      setLoadError(
        err?.message || "We couldn't load your dashboard. Check your connection and try again."
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

  const handleToggleAvailability = async () => {
    if (isToggling || !token) return;
    const previous = isAvailable;
    setToggleError("");
    setIsAvailable(!previous);
    setIsToggling(true);
    try {
      const result = await toggleVendorAvailability(token);
      if (typeof result === "boolean") setIsAvailable(result);
    } catch {
      setIsAvailable(previous);
      setToggleError("Availability didn't save. Try again.");
    } finally {
      setIsToggling(false);
    }
  };

  const counts = {
    total: leads.length,
    pending: leads.filter((l) => l.status === "PENDING").length,
    accepted: leads.filter((l) => l.status === "ACCEPTED").length,
    completed: leads.filter((l) => l.status === "COMPLETED").length,
  };

  const stats = [
    { label: "Total Leads", value: counts.total },
    { label: "Awaiting Response", value: counts.pending },
    { label: "Accepted", value: counts.accepted },
    { label: "Completed", value: counts.completed },
  ];

  const recent = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const businessName = profile?.businessName || user?.fullName || "Vendor Dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {isLoading ? (
                <Skeleton className="h-7 w-56" />
              ) : (
                <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tighter">
                  {businessName}
                </h1>
              )}
              {!isLoading && profile?.category && (
                <Badge variant="neutral">{profile.category}</Badge>
              )}
            </div>
            <VendorNav />
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
            {isLoading ? (
              <Skeleton className="h-10 w-48" />
            ) : (
              <Button
                variant="secondary"
                aria-pressed={isAvailable}
                onClick={handleToggleAvailability}
                loading={isToggling}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isAvailable ? "bg-success" : "bg-warning"
                  )}
                />
                {isAvailable ? "Open for Bookings" : "Paused — Fully Booked"}
              </Button>
            )}
            {toggleError && <p className="text-xs text-danger">{toggleError}</p>}
          </div>
        </header>

        {isLoading ? (
          <>
            <section aria-label="Booking statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="space-y-2.5 p-5">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-4 w-24" />
                </Card>
              ))}
            </section>

            <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </>
        ) : loadError ? (
          <Card className="space-y-3 p-10 text-center">
            <AlertCircle className="mx-auto h-6 w-6 text-danger" aria-hidden="true" />
            <h2 className="text-base font-medium tracking-tight">Couldn&rsquo;t Load Your Dashboard</h2>
            <p className="mx-auto max-w-md text-sm text-muted">{loadError}</p>
            <Button onClick={loadData} className="mt-2">
              Retry
            </Button>
          </Card>
        ) : (
          <>
            <section aria-label="Booking statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-5">
                  <p className="text-3xl font-semibold tracking-tighter tabular-nums">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </Card>
              ))}
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
                {leads.length > 0 && (
                  <Link
                    href="/vendor/bookings"
                    className="inline-flex h-8 select-none items-center gap-1.5 rounded-md bg-white px-3 text-[13px] font-medium text-foreground shadow-hairline transition-[background-color,box-shadow,color] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover"
                  >
                    View All Bookings
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {leads.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="mx-auto flex flex-col items-center gap-2">
                    <Mail className="h-6 w-6 text-muted" aria-hidden="true" />
                    <h3 className="text-base font-medium tracking-tight">No Bookings Yet</h3>
                    <p className="max-w-md text-sm text-muted">
                      When customers send booking requests, they&rsquo;ll appear here so you can respond in one place.
                    </p>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
                    {recent.map((lead) => {
                      const status = STATUS_MAP[lead.status] ?? {
                        variant: "neutral" as BadgeVariant,
                        label: lead.status,
                      };
                      return (
                        <Link
                          key={lead.id}
                          href={`/vendor/bookings/${lead.id}`}
                          className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-hover"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium tracking-tight">
                              {lead.customerName}
                            </p>
                            <p className="truncate text-xs text-muted">{lead.eventType}</p>
                          </div>
                          <span className="hidden shrink-0 items-center gap-1 text-xs text-muted tabular-nums sm:flex">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatEventDate(lead.eventDate)}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <ChevronRight className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted tabular-nums">
                    Showing {recent.length} of {counts.total} leads
                  </p>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
