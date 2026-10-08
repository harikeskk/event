"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Images,
  Store,
  ShieldCheck,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { getVendorDetail } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, Spinner } from "@/components/ui/skeleton";

// Dynamically load VendorMap to avoid SSR Leaflet issues
const VendorMap = dynamic(() => import("@/components/VendorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-surface shadow-hairline">
      <span className="inline-flex items-center gap-2 text-xs text-muted">
        <Spinner />
        Loading vendor location map…
      </span>
    </div>
  ),
});

interface PortfolioItem {
  id?: string;
  imageUrl?: string | null;
  title?: string | null;
  description?: string | null;
  caption?: string | null;
  sortOrder?: number | null;
}

interface VendorDetail {
  id: string;
  businessName?: string | null;
  category?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  description?: string | null;
  distanceKm?: number | null;
  ratingAvg?: number | null;
  reviewCount?: number | null;
  startingPrice?: number | string | null;
  priceUnit?: string | null;
  serviceRadiusKm?: number | null;
  isAvailable?: boolean | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  portfolioItems?: PortfolioItem[] | null;
}

type LoadStatus = "loading" | "ready" | "not-found" | "error";

const CATEGORY_EMOJIS: Record<string, string> = {
  DJ: "🎧",
  PHOTOGRAPHER: "📸",
  CATERER: "🍽️",
  DECORATOR: "💐",
  VENUE: "🏰",
  SOUND_LIGHTING: "🔊",
  MAKEUP_ARTIST: "💄",
  EMCEE: "🎤",
};

function parseCoord(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPrice(value: number | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString("en-IN");
}

function VendorDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 space-y-8">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-64 w-full rounded-xl sm:h-80" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function VendorDetailContent() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const sp = useSearchParams();

  // Coordinates from URL or fallback
  const urlLat = parseCoord(sp.get("lat"));
  const urlLng = parseCoord(sp.get("lng"));

  const [customerLat, setCustomerLat] = useState<number | undefined>(urlLat);
  const [customerLng, setCustomerLng] = useState<number | undefined>(urlLng);

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lightbox Modal state for portfolio gallery
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Read cached customer location from localStorage if missing in URL query
  useEffect(() => {
    if (customerLat == null || customerLng == null) {
      try {
        const stored = localStorage.getItem("eventpulse_customer_loc");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
            setCustomerLat(parsed.lat);
            setCustomerLng(parsed.lng);
          }
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }, [customerLat, customerLng]);

  // Fetch vendor detail using GET /api/vendors/{id}?lat={lat}&lng={lng}
  const loadVendor = useCallback(async () => {
    if (!vendorId) return;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const data = await getVendorDetail(vendorId, customerLat, customerLng);
      if (data) {
        setVendor(data as VendorDetail);
        setStatus("ready");
      } else {
        setVendor(null);
        setStatus("not-found");
      }
    } catch (err: any) {
      console.error("Error fetching vendor detail:", err);
      const msg = err?.message || "Failed to load vendor details";
      if (msg.includes("not found") || msg.includes("404")) {
        setStatus("not-found");
      } else {
        setStatus("error");
        setErrorMessage(msg);
      }
    }
  }, [vendorId, customerLat, customerLng]);

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  // Portfolio items with sorting
  const portfolio = useMemo(() => {
    if (!vendor?.portfolioItems) return [];
    return [...vendor.portfolioItems].sort(
      (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
    );
  }, [vendor?.portfolioItems]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;
      if (e.key === "Escape") setActiveImageIndex(null);
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : portfolio.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          prev !== null && prev < portfolio.length - 1 ? prev + 1 : 0
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, portfolio.length]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <VendorDetailSkeleton />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
        <Card className="w-full max-w-md space-y-4 p-8 text-center shadow-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-hairline">
            <Store className="h-6 w-6 text-muted" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Vendor Not Found</h1>
          <p className="text-sm text-muted">
            This vendor profile does not exist or is no longer listed in our marketplace.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button variant="secondary" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "error" || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 text-foreground">
        <Card className="w-full max-w-md space-y-4 p-8 text-center shadow-card border-danger/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Unable to Load Vendor</h1>
          <p className="text-sm text-muted">
            {errorMessage || "An unexpected error occurred while loading this vendor profile."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={loadVendor}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="ghost">Browse Vendors</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Treat missing availability as unavailable: the backend rejects bookings
  // unless isAvailable is explicitly true (409 otherwise).
  const isAvailable = vendor.isAvailable === true;
  const startingPriceFormatted = formatPrice(vendor.startingPrice);
  const fullAddress = [vendor.addressLine, vendor.city, vendor.state].filter(Boolean).join(", ");
  const categoryEmoji = (vendor.category && CATEGORY_EMOJIS[vendor.category]) || "✨";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* IN-PAGE BACK NAVIGATION HEADER */}
      <header className="border-b border-hairline bg-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-inverse text-white">
              <Sparkles className="h-3 w-3" />
            </span>
            <span>EventPulse</span>
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8 space-y-8">
        {/* HERO BANNER & COVER IMAGE */}
        <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-surface sm:h-80 lg:h-96 shadow-card">
          {vendor.coverImageUrl ? (
            <img
              src={vendor.coverImageUrl}
              alt={vendor.businessName || "Vendor showcase cover"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-background">
              <Store className="h-16 w-16 text-muted/40" />
            </div>
          )}

          {/* Badges on cover */}
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            {vendor.category && (
              <span className="rounded-full bg-white/95 backdrop-blur px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                {categoryEmoji} {vendor.category}
              </span>
            )}
            <Badge
              variant={isAvailable ? "success" : "warning"}
              dot
              className="bg-white/95 backdrop-blur text-xs font-semibold shadow-sm"
            >
              {isAvailable ? "Open for Bookings" : "Currently Unavailable"}
            </Badge>
          </div>

          {/* Bottom gradient overlay for readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl drop-shadow-sm">
                {vendor.businessName}
              </h1>
              {vendor.city && (
                <p className="text-xs text-white/90 drop-shadow-sm flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {vendor.city}{vendor.state ? `, ${vendor.state}` : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT: MAIN INFO (LEFT) & BOOKING CARD (RIGHT) */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {/* LEFT COLUMN: VENDOR DETAILS, PORTFOLIO, LOCATION */}
          <div className="space-y-8 min-w-0">
            {/* Quick Metadata Stats Strip */}
            <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-hairline">
              <div className="p-2 space-y-1">
                <span className="text-xs text-muted block">Rating</span>
                <span className="flex items-center justify-center gap-1 text-base font-bold tabular-nums text-foreground">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {vendor.ratingAvg ? Number(vendor.ratingAvg).toFixed(1) : "5.0"}
                </span>
                <span className="text-[11px] text-muted">
                  ({vendor.reviewCount || 0} reviews)
                </span>
              </div>

              <div className="p-2 space-y-1">
                <span className="text-xs text-muted block">Distance</span>
                <span className="text-base font-bold tabular-nums text-foreground block">
                  {vendor.distanceKm != null ? `${vendor.distanceKm} km` : "Nearby"}
                </span>
                <span className="text-[11px] text-muted">from your location</span>
              </div>

              <div className="p-2 space-y-1">
                <span className="text-xs text-muted block">Service Radius</span>
                <span className="text-base font-bold tabular-nums text-foreground block">
                  {vendor.serviceRadiusKm ? `${vendor.serviceRadiusKm} km` : "Citywide"}
                </span>
                <span className="text-[11px] text-muted">coverage area</span>
              </div>

              <div className="p-2 space-y-1">
                <span className="text-xs text-muted block">Starting At</span>
                <span className="text-base font-bold tabular-nums text-foreground block">
                  {startingPriceFormatted ? `₹${startingPriceFormatted}` : "Custom"}
                </span>
                <span className="text-[11px] text-muted">
                  {vendor.priceUnit || "per event"}
                </span>
              </div>
            </Card>

            {/* Business Description */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                About the Business
              </h2>
              <Card className="p-6 leading-relaxed text-sm text-foreground space-y-4">
                <p className="whitespace-pre-line">
                  {vendor.description ||
                    "Professional event vendor dedicated to delivering top-tier service, tailored experiences, and unforgettable moments for your special celebration."}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-hairline text-xs text-muted">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Verified EventPulse Talent</span>
                  <span>•</span>
                  <span>Direct Inquiry Support</span>
                  <span>•</span>
                  <span>PostGIS Verified Location</span>
                </div>
              </Card>
            </section>

            {/* PORTFOLIO SHOWCASE GALLERY (Requirement 2) */}
            <section className="space-y-4" aria-label="Portfolio showcase">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Images className="h-5 w-5 text-muted" />
                    Portfolio &amp; Work Showcase
                  </h2>
                  <p className="text-xs text-muted">
                    Photos of past events, stage setups, and completed bookings
                  </p>
                </div>
                <Badge variant="neutral">
                  {portfolio.length} {portfolio.length === 1 ? "Item" : "Items"}
                </Badge>
              </div>

              {portfolio.length === 0 ? (
                /* Requirement 6: Missing portfolio fallback */
                <Card className="flex flex-col items-center justify-center p-10 text-center text-muted">
                  <Images className="h-10 w-10 text-muted/40 mb-2" />
                  <p className="text-sm font-medium text-foreground">No portfolio images uploaded yet</p>
                  <p className="text-xs text-muted mt-1 max-w-sm">
                    This vendor has not added showcase photos yet. You can still send a booking inquiry with your event details.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((item, index) => (
                    <div
                      key={item.id || item.imageUrl || index}
                      onClick={() => setActiveImageIndex(index)}
                      className="group relative cursor-pointer overflow-hidden rounded-xl bg-surface shadow-hairline transition-all duration-200 hover:-translate-y-1 hover:shadow-card"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title || item.caption || `Portfolio item ${index + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <Images className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                      </div>
                      <div className="p-3 bg-white space-y-1">
                        <h3 className="truncate text-xs font-semibold text-foreground">
                          {item.title || item.caption || `Showcase photo #${index + 1}`}
                        </h3>
                        {(item.description || item.caption) && (
                          <p className="line-clamp-1 text-[11px] text-muted">
                            {item.description || item.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* LOCATION MAP (Requirement 3) */}
            <section className="space-y-4" aria-label="Vendor location map">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted" />
                  Location &amp; Service Radius
                </h2>
                <p className="text-xs text-muted">
                  Interactive map with verified business location and active service perimeter
                </p>
              </div>

              <Card className="overflow-hidden p-0 shadow-card">
                <div className="h-72 w-full">
                  {vendor.latitude && vendor.longitude ? (
                    <VendorMap
                      vendors={[vendor]}
                      customerLocation={{
                        lat: vendor.latitude,
                        lng: vendor.longitude,
                      }}
                      radiusKm={vendor.serviceRadiusKm || 25}
                      selectedVendorId={vendor.id}
                      onSelectVendor={() => {}}
                      originLabel="Business Location"
                      showCountBadge={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface text-xs text-muted">
                      Exact GPS location not published by vendor
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border-t border-hairline text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted" />
                      {fullAddress || vendor.city || "Bangalore, India"}
                    </span>
                    {vendor.postalCode && (
                      <span className="text-muted block">Postal Code: {vendor.postalCode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">
                      Coverage: {vendor.serviceRadiusKm || 25} km radius
                    </Badge>
                  </div>
                </div>
              </Card>
            </section>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING ACTION SIDEBAR (Requirement 4 & 5) */}
          <aside className="lg:sticky lg:top-8 space-y-4">
            <Card className="p-6 space-y-6 shadow-card border-hairline">
              {/* Pricing Header */}
              <div className="space-y-1 border-b border-hairline pb-4">
                <span className="text-xs text-muted block font-medium">Starting Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {startingPriceFormatted ? `₹${startingPriceFormatted}` : "Price on Request"}
                  </span>
                  {vendor.priceUnit && startingPriceFormatted && (
                    <span className="text-xs font-medium text-muted">
                      {vendor.priceUnit}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted pt-1">
                  Final budget is confirmed based on your event date and specific requirements.
                </p>
              </div>

              {/* Service Details List */}
              <div className="space-y-3 text-xs divide-y divide-hairline">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted">Service Category</span>
                  <span className="font-semibold text-foreground">
                    {vendor.category || "General Event"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted">Availability</span>
                  <Badge variant={isAvailable ? "success" : "warning"} dot>
                    {isAvailable ? "Open for Bookings" : "Currently Unavailable"}
                  </Badge>
                </div>

                {vendor.distanceKm != null && (
                  <div className="flex items-center justify-between pt-2 tabular-nums">
                    <span className="text-muted">Proximity</span>
                    <span className="font-semibold text-foreground">
                      {vendor.distanceKm} km from you
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 tabular-nums">
                  <span className="text-muted">Operating Radius</span>
                  <span className="font-semibold text-foreground">
                    Up to {vendor.serviceRadiusKm || 25} km
                  </span>
                </div>
              </div>

              {/* Requirement 4: BOOKING CTA BUTTON */}
              <div className="space-y-3 pt-2">
                {isAvailable ? (
                  <Link href={`/book/${vendorId}`} className="block w-full">
                    <Button size="lg" className="w-full gap-2 text-sm font-semibold shadow-button">
                      <Calendar className="h-4 w-4" />
                      Book Service
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Button size="lg" disabled variant="secondary" className="w-full text-sm">
                      Currently Unavailable
                    </Button>
                    <p className="text-center text-[11px] text-muted">
                      This vendor is fully booked and not accepting new service inquiries at this time.
                    </p>
                  </div>
                )}
              </div>

              {/* Requirement 5: CONTACT INFORMATION PRIVACY POLICY */}
              <div className="rounded-lg bg-surface p-3.5 text-xs text-muted space-y-2 border border-hairline">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span>Privacy &amp; Contact Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  To protect both parties, vendor phone numbers and direct emails are released as soon as your booking inquiry is submitted and accepted.
                </p>
                <div className="flex items-center gap-1 text-[10px] text-subtle pt-1">
                  <Lock className="h-3 w-3" />
                  <span>Zero spam guaranteed • 100% verified event marketplace</span>
                </div>
              </div>
            </Card>

            {/* Quick Support Card */}
            <Card className="p-4 bg-surface/50 border-hairline text-center text-xs text-muted space-y-1.5">
              <p className="font-medium text-foreground">Need help planning your event?</p>
              <p className="text-[11px]">
                Explore other categories or contact multiple event vendors in your area.
              </p>
              <Link href="/explore-vendors" className="inline-block pt-1 text-xs font-semibold text-foreground hover:underline">
                Explore More Vendors &rarr;
              </Link>
            </Card>
          </aside>
        </div>
      </main>

      {/* PORTFOLIO LIGHTBOX MODAL */}
      {activeImageIndex !== null && portfolio[activeImageIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button & Counter */}
            <div className="flex w-full items-center justify-between pb-3 text-white text-xs">
              <span className="font-medium">
                Photo {activeImageIndex + 1} of {portfolio.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveImageIndex(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                aria-label="Close photo preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
              {portfolio[activeImageIndex].imageUrl && (
                <img
                  src={portfolio[activeImageIndex].imageUrl!}
                  alt={portfolio[activeImageIndex].title || "Portfolio showcase"}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg"
                />
              )}

              {/* Previous Photo Button */}
              {portfolio.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : portfolio.length - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next Photo Button */}
              {portfolio.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      prev !== null && prev < portfolio.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Caption & Title Bar */}
            <div className="w-full text-center pt-3 text-white">
              <p className="text-sm font-semibold">
                {portfolio[activeImageIndex].title || portfolio[activeImageIndex].caption || vendor.businessName}
              </p>
              {portfolio[activeImageIndex].description && (
                <p className="text-xs text-white/70 max-w-lg mx-auto mt-0.5">
                  {portfolio[activeImageIndex].description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-hairline px-4 py-6 text-center text-xs text-muted lg:px-8">
        <p>
          © 2026 EventPulse Marketplace — Verified Event Services &amp; Vendors
        </p>
      </footer>
    </div>
  );
}

export default function VendorProfilePage() {
  return (
    <Suspense fallback={<VendorDetailSkeleton />}>
      <VendorDetailContent />
    </Suspense>
  );
}
