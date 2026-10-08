"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getCustomerInquiries } from "../../services/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string; Icon: LucideIcon }> = {
  PENDING: { variant: "warning", label: "Pending Vendor Response", Icon: Clock },
  ACCEPTED: { variant: "success", label: "Accepted by Vendor", Icon: CheckCircle },
  DECLINED: { variant: "danger", label: "Declined", Icon: XCircle },
  COMPLETED: { variant: "success", label: "Completed", Icon: CheckCircle2 },
};

export default function MyInquiriesPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (token) {
      getCustomerInquiries(token)
        .then((data) => setInquiries(data))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [token, isAuthenticated, authLoading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tighter">My Booking Inquiries</h1>
            <p className="text-sm text-muted">Track and manage your requests sent to event vendors</p>
          </div>

          <Link
            href="/"
            className="inline-flex h-8 select-none items-center justify-center gap-2 rounded-md bg-white px-3 text-[13px] font-medium text-foreground shadow-hairline transition-[background-color,box-shadow,color] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover self-start"
          >
            Browse Vendors
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-20 shrink-0" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-3 w-40" />
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : inquiries.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex flex-col items-center gap-3">
              <Clock className="h-6 w-6 text-muted" aria-hidden="true" />
              <h3 className="text-base font-medium tracking-tight">No Inquiries Sent Yet</h3>
              <p className="text-sm text-muted max-w-md">
                Find DJs, photographers, caterers, and decorators near you and contact them directly.
              </p>
              <Link href="/" className="inline-flex h-8 select-none items-center gap-2 rounded-md bg-inverse px-4 text-[13px] font-medium text-white shadow-button transition-[background-color,box-shadow] duration-150 ease-out hover:bg-inverse-hover mt-2">
                Browse Nearest Vendors
              </Link>
            </div>
          </Card>
        ) : (
          <div className="divide-y divide-hairline rounded-xl bg-white shadow-card">
            {inquiries.map((inq) => {
              const status = STATUS_MAP[inq.status] ?? {
                variant: "neutral" as BadgeVariant,
                label: inq.status,
                Icon: Clock,
              };
              const StatusIcon = status.Icon;
              const canCall =
                (inq.status === "ACCEPTED" || inq.status === "COMPLETED") && !!inq.vendorContactPhone;
              return (
                <div key={inq.id} className="flex flex-col gap-4 p-5 hover:bg-surface-hover md:flex-row md:justify-between">
                  <div className="flex gap-4 min-w-0">
                    {inq.vendorCoverImageUrl && (
                      <img
                        src={inq.vendorCoverImageUrl}
                        alt={inq.vendorBusinessName}
                        width={80}
                        height={80}
                        className="h-20 w-20 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[15px] leading-6 tracking-tight truncate">{inq.vendorBusinessName}</h3>
                        <Badge variant="neutral">{inq.vendorCategory}</Badge>
                      </div>

                      <p className="text-sm text-muted">{inq.eventType}</p>

                      <div className="flex flex-wrap gap-3 text-xs text-muted tabular-nums">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {inq.eventDate}
                        </span>
                        {inq.guestCount && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" /> {inq.guestCount} Guests
                          </span>
                        )}
                        {inq.budget && (
                          <span className="flex items-center gap-1 tabular-nums">
                            <DollarSign className="h-3.5 w-3.5" aria-hidden="true" /> ₹{Number(inq.budget).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <p className="rounded-md bg-surface px-3 py-2 text-sm text-muted">
                        &ldquo;{inq.message}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Status Column */}
                  <div className="flex shrink-0 flex-col items-start justify-between gap-3 border-t border-hairline pt-3 md:items-end md:border-t-0 md:pt-0">
                    <Badge variant={status.variant}>
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {status.label}
                    </Badge>

                    {canCall ? (
                      <a
                        href={`tel:${inq.vendorContactPhone}`}
                        aria-label={`Call ${inq.vendorContactPhone}`}
                        className="inline-flex h-8 select-none items-center gap-2 rounded-md bg-white px-3 text-[13px] font-medium text-foreground shadow-hairline transition-[background-color,box-shadow] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover tabular-nums"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        Call {inq.vendorContactPhone}
                      </a>
                    ) : (
                      <p className="max-w-[16rem] text-xs text-subtle md:text-right">
                        Contact details appear once the vendor accepts your request.
                      </p>
                    )}

                    <Link
                      href={`/my-inquiries/${inq.id}`}
                      className="inline-flex h-8 select-none items-center gap-1.5 rounded-md bg-white px-3 text-[13px] font-medium text-foreground shadow-hairline transition-[background-color,box-shadow,color] duration-150 ease-out hover:bg-surface hover:shadow-hairline-strong active:bg-surface-hover"
                    >
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
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
