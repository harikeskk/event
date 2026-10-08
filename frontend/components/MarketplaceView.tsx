"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Search,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  X,
  Store,
  Map as MapIcon,
  List as ListIcon,
  CalendarCheck,
  ChevronRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import { searchVendors, countNearby, getCustomerInquiries } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, Spinner } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CustomerTopNav } from "./CustomerNav";

// Dynamically load VendorMap to avoid SSR Leaflet window errors
const VendorMap = dynamic(() => import("./VendorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[440px] w-full items-center justify-center rounded-xl bg-surface shadow-hairline">
      <span className="inline-flex items-center gap-2.5 text-sm text-muted">
        <Spinner />
        Loading interactive map…
      </span>
    </div>
  ),
});

interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: "ALL", label: "All Categories", emoji: "✨" },
  { id: "DJ", label: "DJs & Music", emoji: "🎧" },
  { id: "PHOTOGRAPHER", label: "Photographers", emoji: "📸" },
  { id: "CATERER", label: "Catering & Chefs", emoji: "🍽️" },
  { id: "DECORATOR", label: "Event Decorators", emoji: "💐" },
  { id: "VENUE", label: "Venues & Lawns", emoji: "🏰" },
  { id: "SOUND_LIGHTING", label: "Sound & Lighting", emoji: "🔊" },
  { id: "MAKEUP_ARTIST", label: "Makeup Artists", emoji: "💄" },
  { id: "EMCEE", label: "Emcees & Anchors", emoji: "🎤" },
];

const PRESET_LOCATIONS = [
  { name: "Central Bangalore (MG Rd)", lat: 12.9716, lng: 77.5946 },
  { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { name: "Jayanagar", lat: 12.9250, lng: 77.5938 },
  { name: "Malleshwaram", lat: 13.0031, lng: 77.5643 },
  { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
  { name: "Mumbai (Bandra)", lat: 19.0596, lng: 72.8295 },
  { name: "Delhi NCR (Connaught Place)", lat: 28.6304, lng: 77.2177 },
  { name: "Hyderabad (Hitec City)", lat: 17.4435, lng: 78.3772 },
  { name: "Chennai (T. Nagar)", lat: 13.0418, lng: 80.2341 },
  { name: "Madurai (Meenakshi Temple)", lat: 9.9195, lng: 78.1193 },
  { name: "Trichy (Main Guard Gate)", lat: 10.7905, lng: 78.7047 },
  { name: "Dindigul", lat: 10.3673, lng: 77.9803 },
  { name: "Coimbatore (RS Puram)", lat: 11.0168, lng: 77.9558 },
  { name: "Salem (Fairlands)", lat: 11.67, lng: 78.13 },
  { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
];

export interface MarketplaceViewProps {
  isCustomerPortal?: boolean;
}

export default function MarketplaceView({
  isCustomerPortal = false,
}: MarketplaceViewProps) {
  const { token, isVendor } = useAuth();

  // Location & Radius filters
  const [customerLoc, setCustomerLoc] = useState({ lat: 12.9716, lng: 77.5946 });
  const [locationName, setLocationName] = useState("Central Bangalore (MG Rd)");
  const [radiusKm, setRadiusKm] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Custom coordinate input state
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const [customLat, setCustomLat] = useState("12.9716");
  const [customLng, setCustomLng] = useState("77.5946");

  // Mobile layout view toggle: "list" | "map"
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // Geolocation detection state
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Selected vendor on map
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Data states
  const [vendors, setVendors] = useState<any[]>([]);
  const [nearbyCounts, setNearbyCounts] = useState<{
    total: number;
    byCategory: Record<string, number>;
  }>({
    total: 0,
    byCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Customer inquiries summary strip (for customer portal mode)
  const [inquirySummary, setInquirySummary] = useState<{
    total: number;
    pending: number;
    accepted: number;
  } | null>(null);

  // Fetch customer inquiries summary if in customer portal mode
  useEffect(() => {
    let active = true;
    if (isCustomerPortal && token && !isVendor) {
      getCustomerInquiries(token)
        .then((data) => {
          if (!active || !Array.isArray(data)) return;
          const pending = data.filter((q) => q.status === "PENDING").length;
          const accepted = data.filter((q) => q.status === "ACCEPTED").length;
          setInquirySummary({
            total: data.length,
            pending,
            accepted,
          });
        })
        .catch(() => {
          // Non-blocking for inquiries summary
        });
    }
    return () => {
      active = false;
    };
  }, [isCustomerPortal, token, isVendor]);

  // Primary fetch: uses existing GET /api/vendors/search and GET /api/vendors/count-nearby
  const fetchVendorsData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [vendorList, countData] = await Promise.all([
        searchVendors(customerLoc.lat, customerLoc.lng, radiusKm, selectedCategory),
        countNearby(customerLoc.lat, customerLoc.lng, radiusKm),
      ]);
      setVendors(vendorList);
      setNearbyCounts(countData);
    } catch (err: any) {
      console.error("Error loading vendors:", err);
      setApiError(err.message || "Failed to load vendors from server");
    } finally {
      setIsLoading(false);
    }
  }, [customerLoc, radiusKm, selectedCategory]);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      if (!isCancelled) {
        try {
          localStorage.setItem("eventpulse_customer_loc", JSON.stringify(customerLoc));
        } catch {}
        await fetchVendorsData();
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [fetchVendorsData, customerLoc]);

  // Handle GPS detection with graceful fallback
  const handleDetectLocation = () => {
    setGeoNotice(null);
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoNotice(
        "Browser geolocation is not supported on this device. Please select your city manually."
      );
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        setCustomerLoc({ lat, lng });
        setCustomLat(lat.toString());
        setCustomLng(lng.toString());
        setLocationName(`Detected GPS (${lat}, ${lng})`);
        setGeoNotice(null);
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = "Unable to retrieve your current GPS coordinates.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied. Please select your location from the dropdown.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please select your location from the dropdown.";
        }
        setGeoNotice(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Apply custom lat/lng coordinates manually
  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      setCustomerLoc({ lat, lng });
      setLocationName(`Custom (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
      setShowCustomCoords(false);
      setGeoNotice(null);
    } else {
      setGeoNotice("Please enter valid latitude (-90 to 90) and longitude (-180 to 180).");
    }
  };

  // The primary vendor list remains nearest-to-farthest using the backend's distanceKm result.
  const filteredVendors = useMemo(() => {
    let result = vendors;

    if (availableOnly) {
      result = result.filter((v) => v.isAvailable !== false);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.businessName?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q) ||
          v.addressLine?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [vendors, availableOnly, searchQuery]);

  const handleSelectVendorOnMap = useCallback((vendor: any) => {
    setSelectedVendorId(vendor.id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      {/* 1. TOP NAVIGATION */}
      {isCustomerPortal ? (
        <CustomerTopNav />
      ) : (
        <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 pt-6 pb-2 lg:px-8 lg:pt-8">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link href="/explore-vendors" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-inverse text-white shadow-hairline transition-transform group-hover:scale-105">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground group-hover:opacity-85 transition-opacity">
                EventPulse
              </span>
            </Link>
            <span className="text-muted hidden sm:inline">•</span>
            <span className="text-sm font-semibold tracking-tight text-muted">
              Marketplace
            </span>
            <Badge variant="neutral">PostGIS Spatial Engine</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login?redirect=/explore-vendors">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5 text-xs">
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </Button>
            </Link>
          </div>
        </header>
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
        {/* Customer Portal Top Banner / Inquiries Strip */}
        {isCustomerPortal && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Find Nearest Event Vendors
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Browse verified event pros, calculate distances with PostGIS, and book instantly.
              </p>
            </div>

            {inquirySummary && inquirySummary.total > 0 && (
              <Link
                href="/my-inquiries"
                className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface/80 hover:bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors shadow-hairline shrink-0"
              >
                <CalendarCheck className="h-4 w-4 text-foreground" />
                <span>
                  {inquirySummary.total} Booking Request{inquirySummary.total > 1 ? "s" : ""}{" "}
                  <span className="text-muted">
                    ({inquirySummary.pending} pending, {inquirySummary.accepted} accepted)
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
              </Link>
            )}
          </div>
        )}

        {/* Geolocation Notice Banner */}
        {geoNotice && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{geoNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoNotice(null)}
              className="text-amber-700 hover:text-amber-950 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SEARCH, LOCATION, AND RADIUS FILTER CONTROLS */}
        <Card className="flex flex-col gap-4 p-4 lg:p-5 shadow-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-center">
            {/* Location Selector */}
            <div className="lg:col-span-4">
              <label
                htmlFor="location-select"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Location Center
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <Select
                    id="location-select"
                    value={locationName}
                    aria-label="Search location"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__CUSTOM__") {
                        setShowCustomCoords(true);
                        return;
                      }
                      const preset = PRESET_LOCATIONS.find((p) => p.name === val);
                      if (preset) {
                        setCustomerLoc({ lat: preset.lat, lng: preset.lng });
                        setLocationName(preset.name);
                        setCustomLat(preset.lat.toString());
                        setCustomLng(preset.lng.toString());
                        setGeoNotice(null);
                      }
                    }}
                    className="w-full pl-9 text-sm"
                  >
                    {PRESET_LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                    <option value="__CUSTOM__">📍 Custom Coordinates…</option>
                  </Select>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleDetectLocation}
                  disabled={isDetectingGps}
                  title="Detect GPS coordinates using browser"
                  className="shrink-0"
                >
                  {isDetectingGps ? (
                    <Spinner />
                  ) : (
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">Detect GPS</span>
                </Button>
              </div>
            </div>

            {/* Radius Range Slider (5 km to 50 km) */}
            <div className="lg:col-span-4">
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                <label htmlFor="radius-slider" className="text-muted">
                  Search Radius (5 km – 50 km)
                </label>
                <span className="font-semibold text-foreground tabular-nums bg-surface px-2 py-0.5 rounded shadow-hairline">
                  {radiusKm} km
                </span>
              </div>
              <div className="flex h-10 items-center gap-3 rounded-md bg-surface px-3 shadow-hairline">
                <span className="text-[11px] text-muted tabular-nums">5km</span>
                <input
                  id="radius-slider"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="flex-1 cursor-pointer accent-foreground"
                />
                <span className="text-[11px] text-muted tabular-nums">50km</span>
              </div>
            </div>

            {/* Instant Text Search Input */}
            <div className="lg:col-span-4">
              <label
                htmlFor="search-input"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Search Event Services
              </label>
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="Search DJ, caterer, photographer…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search vendors"
                  className="pl-9 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Coordinates Sub-panel if requested */}
          {showCustomCoords && (
            <form
              onSubmit={handleApplyCustomCoords}
              className="flex flex-wrap items-center gap-3 border-t border-hairline pt-3 text-xs"
            >
              <span className="font-medium text-foreground">Custom Lat/Lng:</span>
              <Input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-28 h-8 text-xs"
              />
              <Input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="w-28 h-8 text-xs"
              />
              <Button size="sm" type="submit" className="h-8 text-xs">
                Apply Coordinates
              </Button>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => setShowCustomCoords(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </form>
          )}

          {/* Secondary Filter Row: Availability Toggle & Location Coordinates Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3 text-xs text-muted">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-hairline text-foreground focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-foreground">
                  Available for Bookings Only
                </span>
              </label>

              {availableOnly && (
                <Badge variant="success" dot>
                  Filtering open vendors
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 tabular-nums">
              <span>Center:</span>
              <span className="font-medium text-foreground">
                {customerLoc.lat.toFixed(4)}° N, {customerLoc.lng.toFixed(4)}° E
              </span>
            </div>
          </div>
        </Card>

        {/* 3. CATEGORY FILTER TABS WITH COUNTERS */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count =
              cat.id === "ALL"
                ? nearbyCounts.total
                : nearbyCounts.byCategory[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-[background-color,color,box-shadow] duration-150 cursor-pointer",
                  isSelected
                    ? "bg-foreground font-medium text-background shadow-hairline"
                    : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-xs font-semibold tabular-nums",
                    isSelected
                      ? "bg-background/20 text-background"
                      : "bg-black/5 text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results context lives in the floating panel header below. */}

        {/* API Error State */}
        {apiError && (
          <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-danger/30 bg-red-50/50">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-danger">Connection Error</h4>
                <p className="text-xs text-muted">{apiError}</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchVendorsData}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Search
            </Button>
          </Card>
        )}

        {/* 5. FULLSCREEN MAP STAGE with floating results panel (Google-Maps style) */}
        <div className="relative left-1/2 h-[calc(100vh-120px)] min-h-[560px] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-surface">
          {/* FLOATING RESULTS PANEL: bottom sheet on mobile, left rail on desktop */}
          <div
            className={cn(
              "absolute bottom-3 left-3 right-3 z-[1000] flex max-h-[48%] flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-elevated",
              "lg:bottom-5 lg:left-5 lg:right-auto lg:top-5 lg:max-h-none lg:w-[400px]",
              mobileView === "map" ? "hidden lg:flex" : "flex"
            )}
          >
            {/* Panel header: result context + verified + mobile toggle */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-hairline px-4 py-3">
              <p className="min-w-0 truncate text-sm tabular-nums">
                <span className="font-semibold text-foreground">
                  {filteredVendors.length}{" "}
                  {filteredVendors.length === 1 ? "Vendor" : "Vendors"}
                </span>{" "}
                <span className="text-muted">near {locationName}</span>
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="success" className="hidden text-[10px] sm:inline-flex">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  Verified
                </Badge>
                <div className="flex items-center rounded-md bg-surface p-0.5 shadow-hairline lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className={cn(
                      "flex items-center gap-1 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      mobileView === "list"
                        ? "bg-white text-foreground shadow-card"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    <ListIcon className="h-3.5 w-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("map")}
                    className={cn(
                      "flex items-center gap-1 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      mobileView === "map"
                        ? "bg-white text-foreground shadow-card"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Map
                  </button>
                </div>
              </div>
            </div>
            {isLoading ? (
              <>
                <p
                  role="status"
                  className="px-4 pt-4 text-xs text-muted flex items-center gap-2"
                >
                  <Spinner />
                  Querying PostGIS spatial engine within {radiusKm} km…
                </p>
                <div className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto pb-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3.5 p-4">
                      <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : filteredVendors.length === 0 ? (
              <Card className="m-4 flex flex-col items-center justify-center p-8 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-hairline">
                  <MapPin className="h-6 w-6 text-muted" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  No vendors found within this radius.
                </h3>
                <p className="mb-6 mt-2 max-w-md text-sm text-muted">
                  There are currently no verified event professionals within {radiusKm} km
                  of{" "}
                  <span className="font-medium text-foreground">{locationName}</span>
                  {selectedCategory !== "ALL" ? ` under ${selectedCategory}` : ""}.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button variant="secondary" onClick={() => setRadiusKm(50)}>
                    Expand to 50 km Radius
                  </Button>
                  {(selectedCategory !== "ALL" || availableOnly || searchQuery) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedCategory("ALL");
                        setAvailableOnly(false);
                        setSearchQuery("");
                      }}
                    >
                      Reset All Filters
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
              {filteredVendors.map((vendor) => {
                const categoryDef = CATEGORIES.find(
                  (cat) => cat.id === vendor.category
                );
                const categoryLabel = categoryDef?.label ?? vendor.category;
                const isSelected = selectedVendorId === vendor.id;
                const isAvailable = vendor.isAvailable !== false;

                const priceFormatted = vendor.startingPrice
                  ? `₹${Number(vendor.startingPrice).toLocaleString("en-IN")}`
                  : null;

                return (
                  <article
                    key={vendor.id}
                    onMouseEnter={() => setSelectedVendorId(vendor.id)}
                    className={cn(
                      "group flex cursor-pointer gap-3.5 p-4 transition-colors hover:bg-surface/70",
                      isSelected && "bg-[#e6f0ff]/70"
                    )}
                  >
                    <div className="flex gap-3.5">
                      {/* Thumb */}
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface">
                        {vendor.coverImageUrl ? (
                          <img
                            src={vendor.coverImageUrl}
                            alt={vendor.businessName}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-7 w-7 text-subtle" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">
                              {categoryDef?.emoji} {categoryLabel}
                            </span>
                            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-foreground">
                              <Star
                                className="h-3 w-3 fill-warning text-warning"
                                aria-hidden="true"
                              />
                              {vendor.ratingAvg
                                ? Number(vendor.ratingAvg).toFixed(1)
                                : "5.0"}
                              <span className="font-normal text-muted">
                                ({vendor.reviewCount || 0})
                              </span>
                            </span>
                          </div>
                          <Link
                            href={`/vendors/${vendor.id}?lat=${customerLoc.lat}&lng=${customerLoc.lng}`}
                            className="mt-0.5 block truncate text-[15px] font-semibold tracking-tight text-foreground hover:underline"
                          >
                            {vendor.businessName}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-muted">
                            <MapPin
                              className="h-3 w-3 shrink-0"
                              aria-hidden="true"
                            />
                            {vendor.distanceKm != null
                              ? `${vendor.distanceKm} km away`
                              : "Nearby"}
                            {vendor.city ? ` • ${vendor.city}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                isAvailable ? "bg-success" : "bg-warning"
                              )}
                            />
                            <span
                              className={
                                isAvailable ? "text-success" : "text-muted"
                              }
                            >
                              {isAvailable
                                ? "Open for Bookings"
                                : "Fully Booked"}
                            </span>
                          </span>
                          <span className="truncate text-sm font-bold tabular-nums text-foreground">
                            {priceFormatted || "Price on request"}
                            {vendor.priceUnit && (
                              <span className="ml-1 text-[11px] font-normal text-muted">
                                {vendor.priceUnit}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <Link
                            href={`/vendors/${vendor.id}?lat=${customerLoc.lat}&lng=${customerLoc.lng}`}
                          >
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 px-2.5 text-[11px]"
                            >
                              View Details
                            </Button>
                          </Link>

                          {isAvailable ? (
                            <Link href={`/book/${vendor.id}`}>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-[11px]"
                              >
                                Book Service
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              disabled
                              variant="secondary"
                              className="h-7 px-2.5 text-[11px]"
                              title="Vendor is fully booked"
                            >
                              Unavailable
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              </div>
            )}
          </div>

          {/* FULL-BLEED MAP */}
          <div
            className={cn(
              "absolute inset-0",
              mobileView === "list" ? "hidden lg:block" : "block"
            )}
          >
            <VendorMap
              vendors={filteredVendors}
              customerLocation={customerLoc}
              radiusKm={radiusKm}
              selectedVendorId={selectedVendorId}
              onSelectVendor={handleSelectVendorOnMap}
              square
            />
          </div>
        </div>
      </main>

      {/* 6. FOOTER */}
      <footer className="mt-auto border-t border-hairline px-4 py-6 text-center text-xs text-muted lg:px-8">
        <p>
          © 2026 EventPulse Marketplace — Spring Boot 3 + PostgreSQL (PostGIS Engine) +
          React &amp; Next.js
        </p>
      </footer>
    </div>
  );
}
