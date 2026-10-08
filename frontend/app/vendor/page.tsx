"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Images,
  Inbox,
  Lock,
  LogOut,
  RefreshCw,
  User,
} from "lucide-react";
import { VendorTopNav, VendorTabs } from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import {
  getVendorInbox,
  getMyProfile,
  toggleVendorAvailability,
} from "@/services/api";
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
  id?: string;
  businessName: string;
  category: string;
  isAvailable: boolean;
  coverImageUrl?: string | null;
  city?: string | null;
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

function formatRelativeTime(isoStr?: string) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function VendorDashboardPage() {
  const { user, token, isAuthenticated, isVendor, isLoading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [leads, setLeads] = useState<VendorInquiry[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setLoadError("Unauthenticated");
      return;
    }
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
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

  const handleToggleAvailability = async () => {
    if (isToggling || !token) return;
    const previous = isAvailable;
    setToggleError("");
    setIsAvailable(!previous);
    setIsToggling(true);
    try {
      const updated = await toggleVendorAvailability(token);
      // API returns the new availability as a bare boolean; accept both shapes.
      const next =
        typeof updated === "boolean" ? updated : !!updated?.isAvailable;
      setIsAvailable(next);
      setProfile((prev) => (prev ? { ...prev, isAvailable: next } : null));
    } catch {
      setIsAvailable(previous);
      setToggleError("Availability didn't save. Try again.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleLogout = () => {
    logout("/login");
  };

  const handleReLogin = () => {
    logout("/login?redirect=/vendor");
  };

  const isUnauthenticated =
    loadError.toLowerCase().includes("unauthenticated") ||
    loadError.toLowerCase().includes("jwt") ||
    loadError.toLowerCase().includes("401") ||
    loadError.toLowerCase().includes("expired");

  const counts = {
    total: leads.length,
    pending: leads.filter((l) => l.status === "PENDING").length,
    accepted: leads.filter((l) => l.status === "ACCEPTED").length,
    declined: leads.filter((l) => l.status === "DECLINED").length,
  };

  const stats = [
    { label: "Pending Requests", value: counts.pending, note: "New — requires action" },
    { label: "Accepted Bookings", value: counts.accepted, note: "Confirmed gigs" },
    { label: "Declined Bookings", value: counts.declined, note: "Declined requests" },
    { label: "Total Bookings", value: counts.total, note: "All inquiries" },
  ];

  const recent = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const businessName =
    profile?.businessName || user?.fullName || "Vendor Dashboard";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Top Application Bar with Brand, Marketplace link, and Logout */}
      <VendorTopNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 space-y-8 flex-1">
        {/* Vendor Header & Portal Navigation */}
        <header className="space-y-5 border-b border-hairline pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              {profile?.coverImageUrl ? (
                <img
                  src={profile.coverImageUrl}
                  alt={businessName}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-hairline border border-hairline"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-inverse text-white font-bold text-lg shadow-hairline">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                    {businessName}
                  </h1>
                  {profile?.category && (
                    <Badge variant="neutral" className="text-xs">
                      {profile.category}
                    </Badge>
                  )}
                  <Badge
                    variant={isAvailable ? "success" : "danger"}
                    className="text-xs"
                  >
                    {isAvailable ? "Open for Bookings" : "Fully Booked"}
                  </Badge>
                  {profile?.city && (
                    <span className="text-xs text-muted">&bull; {profile.city}</span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Manage incoming client inquiries, portfolio showcase, and business settings.
                </p>
              </div>
            </div>

            {/* Availability Toggle and Quick Logout */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="secondary"
                aria-pressed={isAvailable}
                onClick={handleToggleAvailability}
                loading={isToggling}
                className="gap-2 text-xs"
                title="Toggle client booking availability"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    isAvailable ? "bg-success" : "bg-danger"
                  )}
                />
                <span>{isAvailable ? "Open for Bookings" : "Fully Booked"}</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs text-muted hover:text-danger hover:bg-danger/10"
                title="Sign out of vendor account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          </div>

          {toggleError && <p className="text-xs text-danger">{toggleError}</p>}

          {/* Tab Navigation */}
          <div className="pt-2">
            <VendorTabs />
          </div>
        </header>

        {/* Content Body */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5 space-y-2">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-4 w-28" />
                </Card>
              ))}
            </div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        ) : loadError ? (
          /* Graceful, actionable error handling */
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
                  : "Unable to Load Dashboard"}
              </h2>
              <p className="text-xs text-muted leading-relaxed max-w-md mx-auto">
                {isUnauthenticated
                  ? "Your vendor session has expired or you are not signed in. Log in to access your bookings, profile, and inquiries."
                  : loadError || "A network or server error occurred while loading your dashboard."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {isUnauthenticated ? (
                <>
                  <Button
                    onClick={handleReLogin}
                    className="w-full sm:w-auto gap-2 text-xs"
                  >
                    <span>Log In to Vendor Account</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleLogout}
                    className="w-full sm:w-auto gap-2 text-xs text-danger hover:bg-danger/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Clear &amp; Switch Account</span>
                  </Button>
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="ghost" className="w-full sm:w-auto text-xs">
                      Marketplace Home
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
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="ghost" className="w-full sm:w-auto text-xs">
                      Return to Home
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        ) : (
          /* Normal Loaded Dashboard */
          <div className="space-y-8">
            {/* 4 Metric Cards */}
            <section
              aria-label="Booking statistics"
              className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="p-5 shadow-card hover:shadow-hairline-strong transition-shadow"
                >
                  <p className="text-3xl font-semibold tracking-tighter tabular-nums text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground">
                    {stat.label}
                  </p>
                  <p className="text-[11px] text-muted">{stat.note}</p>
                </Card>
              ))}
            </section>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/vendor/bookings" className="group">
                <Card className="p-4 shadow-card hover:border-foreground/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground shadow-hairline group-hover:scale-105 transition-transform">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Customer Inquiries
                      </h3>
                      <p className="text-[11px] text-muted">
                        {counts.pending} awaiting response
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Card>
              </Link>

              <Link href="/vendor/profile" className="group">
                <Card className="p-4 shadow-card hover:border-foreground/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground shadow-hairline group-hover:scale-105 transition-transform">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Edit Profile
                      </h3>
                      <p className="text-[11px] text-muted">
                        Pricing, address &amp; bio
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Card>
              </Link>

              <Link href="/vendor/portfolio" className="group">
                <Card className="p-4 shadow-card hover:border-foreground/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground shadow-hairline group-hover:scale-105 transition-transform">
                      <Images className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Portfolio Gallery
                      </h3>
                      <p className="text-[11px] text-muted">
                        Photos &amp; showcase
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Card>
              </Link>

              <button
                type="button"
                onClick={handleToggleAvailability}
                disabled={isToggling}
                aria-pressed={isAvailable}
                className="group text-left"
                title="Toggle client booking availability"
              >
                <Card className="p-4 shadow-card hover:border-foreground/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground shadow-hairline group-hover:scale-105 transition-transform">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        {isAvailable ? "Pause Bookings" : "Reopen Bookings"}
                      </h3>
                      <p className="text-[11px] text-muted">
                        {isAvailable
                          ? "Currently open — tap to pause"
                          : "Currently paused — tap to reopen"}
                      </p>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      isAvailable ? "bg-success" : "bg-danger"
                    )}
                  />
                </Card>
              </button>
            </div>

            {/* Recent Inquiries List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Recent Customer Inquiries
                  </h2>
                  <p className="text-xs text-muted">
                    Latest booking inquiries received from customers
                  </p>
                </div>
                <Link
                  href="/vendor/bookings"
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                >
                  View All ({leads.length})
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {recent.length === 0 ? (
                <Card className="p-8 text-center shadow-card space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted shadow-hairline">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold">No Inquiries Yet</h3>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Your profile is live in the marketplace. When customers search in your category and submit booking requests, they will appear here.
                  </p>
                  {profile?.id && (
                    <div className="pt-2">
                      <Link
                        href={`/vendors/${profile.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview Public Profile
                      </Link>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="divide-y divide-hairline rounded-xl bg-white shadow-card border border-hairline overflow-hidden">
                  {recent.map((lead) => {
                    const statusMeta =
                      STATUS_MAP[lead.status] || {
                        variant: "neutral" as BadgeVariant,
                        label: lead.status,
                      };
                    return (
                      <Link
                        key={lead.id}
                        href={`/vendor/bookings/${lead.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-surface/60"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-foreground">
                              {lead.customerName || "Customer"}
                            </span>
                            <Badge variant={statusMeta.variant} className="text-[10px]">
                              {statusMeta.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted">
                            {lead.eventType} &bull; {formatEventDate(lead.eventDate)}
                            {lead.guestCount ? ` • ${lead.guestCount} guests` : ""}
                            {lead.budget ? ` • ₹${Number(lead.budget).toLocaleString("en-IN")}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted shrink-0">
                          <span className="tabular-nums">
                            {formatRelativeTime(lead.createdAt)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-subtle" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
