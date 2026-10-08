"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CloudOff,
  MapPin,
  SearchX,
  Store,
  Calendar,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getVendorDetail, submitInquiry } from "../../../services/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Birthday Party",
  "Corporate Event",
  "Concert / Live Gig",
  "Anniversary",
  "House Party",
  "Reception & Banquet",
  "Other Celebration",
];

interface FormState {
  eventType: string;
  eventDate: string;
  guestCount: string;
  budget: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
}

type FieldKey = keyof FormState;

interface VendorDetail {
  id: string;
  businessName: string;
  category?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  startingPrice?: number | string;
  priceUnit?: string;
  coverImageUrl?: string | null;
  distanceKm?: number | null;
  serviceRadiusKm?: number | null;
  isAvailable?: boolean | null;
}

interface InquiryPayload {
  vendorId: string;
  eventType: string;
  eventDate: string;
  guestCount?: number;
  budget?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
}

function formatLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseCoord(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-danger text-xs mt-1">
      {message}
    </p>
  );
}

function BookPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-8 space-y-6" aria-busy="true">
        <Skeleton className="h-6 w-36" />
        <Card className="overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-32 w-full sm:w-44 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
        <Card className="p-6 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-10 w-40" />
        </Card>
      </main>
    </div>
  );
}

function BookVendorContent() {
  const { user, token, isAuthenticated, isVendor, logout, isLoading: authLoading } = useAuth();
  const { vendorId } = useParams<{ vendorId: string }>();
  const searchParams = useSearchParams();

  const lat = parseCoord(searchParams.get("lat") ?? undefined);
  const lng = parseCoord(searchParams.get("lng") ?? undefined);

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [vendorStatus, setVendorStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  const today = formatLocalDate(new Date());

  const [form, setForm] = useState<FormState>({
    eventType: "",
    eventDate: "",
    guestCount: "",
    budget: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: "",
  });

  // Prefill authenticated customer details
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || "",
        customerEmail: prev.customerEmail || user.email || "",
      }));
    }
  }, [user]);

  // Fetch selected vendor summary
  const fetchVendor = useCallback(() => {
    if (!vendorId) return;
    setVendorStatus("loading");
    getVendorDetail(vendorId, lat, lng)
      .then((data) => {
        if (data) {
          setVendor(data as VendorDetail);
          setVendorStatus("ready");
        } else {
          setVendorStatus("not-found");
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "";
        setVendorStatus(message.includes("404") || message.includes("not found") ? "not-found" : "error");
      });
  }, [vendorId, lat, lng]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  // Client Validation Rules
  const errors: Partial<Record<FieldKey, string>> = {};

  if (!form.eventType.trim()) {
    errors.eventType = "Event type is required.";
  }

  if (!form.eventDate) {
    errors.eventDate = "Event date is required.";
  } else if (form.eventDate < today) {
    errors.eventDate = "Event date must be today or in the future.";
  }

  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required.";
  }

  if (!form.customerEmail.trim()) {
    errors.customerEmail = "Customer email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Please enter a valid email address.";
  }

  if (form.customerPhone.trim() && !/^\+?[0-9\s\-()]{7,20}$/.test(form.customerPhone.trim())) {
    errors.customerPhone = "Please enter a valid phone number (7-20 digits).";
  }

  if (form.guestCount !== "") {
    const guests = Number(form.guestCount);
    if (!Number.isInteger(guests) || guests <= 0) {
      errors.guestCount = "Guest count must be a positive whole number.";
    }
  }

  if (form.budget !== "") {
    const b = Number(form.budget);
    if (!Number.isFinite(b) || b < 0) {
      errors.budget = "Budget must be 0 or greater.";
    }
  }

  if (!form.message.trim()) {
    errors.message = "Message and event requirements are required.";
  } else if (form.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters long.";
  } else if (form.message.trim().length > 2000) {
    errors.message = "Message cannot exceed 2000 characters.";
  }

  const isValid = Object.keys(errors).length === 0;
  // Treat missing availability as unavailable: the backend rejects bookings
  // unless isAvailable is explicitly true (409 otherwise).
  const isAvailable = vendor ? vendor.isAvailable === true : true;
  const show = (key: FieldKey) => (touched[key] ? errors[key] : undefined);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (key: FieldKey) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all touched to trigger error display
    const allTouched: Partial<Record<FieldKey, boolean>> = {
      eventType: true,
      eventDate: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      guestCount: true,
      budget: true,
      message: true,
    };
    setTouched(allTouched);

    if (!isValid) return;

    if (!isAvailable) {
      setSubmitError("This vendor is currently not accepting bookings.");
      return;
    }

    if (!isAuthenticated || !token) {
      setSubmitError("You must be logged in as a customer to submit a booking request.");
      return;
    }

    if (isVendor) {
      setSubmitError("Vendor accounts cannot submit customer booking inquiries. Please switch to a customer account.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: InquiryPayload = {
        vendorId,
        eventType: form.eventType,
        eventDate: form.eventDate,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        message: form.message.trim(),
      };

      if (form.guestCount !== "") payload.guestCount = Number(form.guestCount);
      if (form.budget !== "") payload.budget = Number(form.budget);
      if (form.customerPhone.trim()) payload.customerPhone = form.customerPhone.trim();

      await submitInquiry(payload, token);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Booking error:", err);
      setSubmitError(err.message || "Failed to submit booking request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || vendorStatus === "loading") {
    return <BookPageSkeleton />;
  }

  // Error loading vendor
  if (vendorStatus === "not-found" || vendorStatus === "error") {
    const isError = vendorStatus === "error";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
        <Card className="w-full max-w-md p-8 text-center space-y-4 shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-hairline">
            {isError ? (
              <CloudOff className="h-6 w-6 text-muted" aria-hidden="true" />
            ) : (
              <SearchX className="h-6 w-6 text-muted" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            {isError ? "Unable to Load Vendor" : "Vendor Not Found"}
          </h1>
          <p className="text-sm text-muted">
            {isError
              ? "We couldn't connect to the server to fetch this vendor's details."
              : "This vendor does not exist or may have been unlisted."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {isError && (
              <Button variant="secondary" onClick={fetchVendor}>
                Try Again
              </Button>
            )}
            <Link href="/">
              <Button>Browse Vendors</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const vendorLocation = [vendor?.addressLine, vendor?.city].filter(Boolean).join(", ");
  const startingPriceFormatted = vendor?.startingPrice
    ? `₹${Number(vendor.startingPrice).toLocaleString("en-IN")}`
    : "Price on request";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* IN-PAGE BACK HEADER */}
      <header className="border-b border-hairline bg-surface/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 lg:px-8">
          <Link
            href={`/vendors/${vendorId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vendor Details
          </Link>

          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-inverse text-white">
              <Sparkles className="h-3 w-3" />
            </span>
            <span>EventPulse</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-8 space-y-6">
        {/* 1. SELECTED VENDOR SUMMARY (Requirement 1) */}
        <Card className="overflow-hidden shadow-card border-hairline p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Cover image or fallback store icon */}
            <div className="relative h-28 w-full sm:w-36 shrink-0 overflow-hidden rounded-lg bg-surface">
              {vendor?.coverImageUrl ? (
                <img
                  src={vendor.coverImageUrl}
                  alt={vendor.businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Store className="h-8 w-8 text-muted/40" />
                </div>
              )}
            </div>

            {/* Vendor metadata */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {vendor?.businessName}
                </h1>
                {vendor?.category && <Badge variant="neutral">{vendor.category}</Badge>}
                <Badge variant={isAvailable ? "success" : "warning"} dot>
                  {isAvailable ? "Open for Bookings" : "Currently Unavailable"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                {vendorLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {vendorLocation}
                  </span>
                )}
                {vendor?.distanceKm != null && (
                  <span className="tabular-nums">
                    • {vendor.distanceKm} km from you
                  </span>
                )}
                <span className="font-semibold text-foreground tabular-nums">
                  Starting: {startingPriceFormatted}
                  {vendor?.priceUnit ? ` ${vendor.priceUnit}` : ""}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* AUTHENTICATION GATE CHECK */}
        {!isAuthenticated ? (
          <Card className="p-8 text-center space-y-4 shadow-card border-amber-200 bg-amber-50/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-amber-950">
              Customer Sign-in Required
            </h2>
            <p className="text-xs text-amber-800 max-w-md mx-auto">
              You must be logged in as a verified customer to send booking inquiries and protect vendor communication.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href={`/login?redirect=/book/${vendorId}`}>
                <Button className="gap-2">
                  Log In to Continue
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary">Create Customer Account</Button>
              </Link>
            </div>
          </Card>
        ) : isVendor ? (
          /* Role Check: Vendors cannot book other vendors */
          <Card className="p-8 text-center space-y-4 shadow-card border-amber-200 bg-amber-50/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-amber-950">
              Vendor Account Detected
            </h2>
            <p className="text-xs text-amber-800 max-w-md mx-auto">
              You are currently signed in with a Vendor account ({user?.fullName}). Customer service requests must be submitted with a Customer account.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => logout("/login")}>
                Log Out &amp; Switch Account
              </Button>
              <Link href="/vendor">
                <Button>Go to Vendor Portal</Button>
              </Link>
            </div>
          </Card>
        ) : submitted ? (
          /* 5. SUCCESS STATE (Requirement 5) */
          <Card className="p-8 sm:p-12 text-center space-y-5 shadow-card border-success/30 bg-emerald-50/40">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-success">
              <CheckCircle className="h-8 w-8" />
            </div>
            <Badge variant="success" dot className="mx-auto">
              Request Sent
            </Badge>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Booking request sent successfully.
              </h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                Your booking request is now <span className="font-semibold text-foreground">PENDING</span>. The vendor has been notified and will review your event details shortly.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/my-inquiries">
                <Button size="lg" className="w-full sm:w-auto font-semibold gap-2">
                  <Calendar className="h-4 w-4" />
                  View My Bookings
                </Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Browse More Vendors
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* 2. BOOKING FORM */
          <Card className="p-6 sm:p-8 shadow-card border-hairline space-y-6">
            <div className="space-y-1 border-b border-hairline pb-4">
              <CardTitle className="text-xl">Request Service Booking</CardTitle>
              <CardDescription>
                Provide your event date and details. The vendor will reply with their confirmation or availability.
              </CardDescription>
            </div>

            {/* Unavailability notice */}
            {!isAvailable && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  This vendor is currently fully booked and not accepting new service requests.
                </span>
              </div>
            )}

            {/* Submit error display (Requirement 6) */}
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-red-50 p-4 text-xs text-danger" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Event Details Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Event Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="eventType">
                    Event Type <span className="text-danger">*</span>
                  </Label>
                  <Select
                    id="eventType"
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    onBlur={handleBlur("eventType")}
                    disabled={!isAvailable || isSubmitting}
                    className="w-full text-sm"
                  >
                    <option value="">Select event category…</option>
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                  <FieldError id="eventType" message={show("eventType")} />
                </div>

                {/* Event Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">
                    Event Date <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    min={today}
                    value={form.eventDate}
                    onChange={handleChange}
                    onBlur={handleBlur("eventDate")}
                    disabled={!isAvailable || isSubmitting}
                    className="w-full text-sm"
                  />
                  <FieldError id="eventDate" message={show("eventDate")} />
                </div>

                {/* Guest Count */}
                <div className="space-y-1.5">
                  <Label htmlFor="guestCount">Expected Guest Count</Label>
                  <Input
                    id="guestCount"
                    name="guestCount"
                    type="number"
                    min={1}
                    placeholder="e.g. 150"
                    value={form.guestCount}
                    onChange={handleChange}
                    onBlur={handleBlur("guestCount")}
                    disabled={!isAvailable || isSubmitting}
                    className="w-full text-sm"
                  />
                  <FieldError id="guestCount" message={show("guestCount")} />
                </div>

                {/* Estimated Budget */}
                <div className="space-y-1.5">
                  <Label htmlFor="budget">Estimated Budget (₹)</Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    min={0}
                    placeholder="e.g. 25000"
                    value={form.budget}
                    onChange={handleChange}
                    onBlur={handleBlur("budget")}
                    disabled={!isAvailable || isSubmitting}
                    className="w-full text-sm"
                  />
                  <FieldError id="budget" message={show("budget")} />
                </div>
              </div>

              {/* Customer Contact Information Strip */}
              <div className="border-t border-hairline pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Your Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName">
                      Your Name <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      placeholder="Full Name"
                      value={form.customerName}
                      onChange={handleChange}
                      onBlur={handleBlur("customerName")}
                      disabled={!isAvailable || isSubmitting}
                      className="w-full text-sm"
                    />
                    <FieldError id="customerName" message={show("customerName")} />
                  </div>

                  {/* Customer Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="customerEmail">
                      Email Address <span className="text-danger">*</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      placeholder="name@example.com"
                      value={form.customerEmail}
                      onChange={handleChange}
                      onBlur={handleBlur("customerEmail")}
                      disabled={!isAvailable || isSubmitting}
                      className="w-full text-sm"
                    />
                    <FieldError id="customerEmail" message={show("customerEmail")} />
                  </div>

                  {/* Customer Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.customerPhone}
                      onChange={handleChange}
                      onBlur={handleBlur("customerPhone")}
                      disabled={!isAvailable || isSubmitting}
                      className="w-full text-sm"
                    />
                    <FieldError id="customerPhone" message={show("customerPhone")} />
                  </div>
                </div>
              </div>

              {/* Message / Requirements */}
              <div className="border-t border-hairline pt-5 space-y-1.5">
                <Label htmlFor="message">
                  Message &amp; Requirements <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Describe your event needs (e.g. music genre preferences, timing, venue dimensions, special requests)…"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur("message")}
                  disabled={!isAvailable || isSubmitting}
                  className="w-full text-sm"
                />
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <FieldError id="message" message={show("message")} />
                  <span className="ml-auto">{form.message.length}/2000</span>
                </div>
              </div>

              {/* Privacy Notice Strip */}
              <div className="flex items-center gap-2 rounded-lg bg-surface p-3 text-xs text-muted border border-hairline">
                <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                <span>
                  Your booking request is securely handled. Direct contact is released after vendor accepts.
                </span>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  disabled={!isAvailable || isSubmitting}
                  className="w-full sm:w-auto min-w-[200px] text-sm font-semibold"
                >
                  {isSubmitting ? "Sending Request…" : "Send Booking Request"}
                </Button>

                <Link href={`/vendors/${vendorId}`}>
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto text-sm">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-hairline px-4 py-6 text-center text-xs text-muted lg:px-8">
        <p>© 2026 EventPulse Marketplace — Verified Booking &amp; Vendor Management</p>
      </footer>
    </div>
  );
}

export default function BookVendorPage() {
  return (
    <Suspense fallback={<BookPageSkeleton />}>
      <BookVendorContent />
    </Suspense>
  );
}
