"use client";

import React, { Suspense, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  User,
  Store,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  Compass,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Field, Textarea, Select, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { LocationPickerValue } from "@/components/LocationPicker";

// Dynamically load LocationPicker to avoid SSR window errors with MapLibre
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-xl bg-surface border border-hairline flex items-center justify-center text-xs text-muted">
      Loading interactive map…
    </div>
  ),
});

const VENDOR_CATEGORIES = [
  { id: "DJ", label: "DJ & Music (DJ)" },
  { id: "PHOTOGRAPHER", label: "Photographer & Videographer (PHOTOGRAPHER)" },
  { id: "CATERER", label: "Catering & Banquet Service (CATERER)" },
  { id: "DECORATOR", label: "Event Decorator & Florist (DECORATOR)" },
  { id: "VENUE", label: "Venue & Banquet Lawn (VENUE)" },
  { id: "SOUND_LIGHTING", label: "Sound & Stage Lighting (SOUND_LIGHTING)" },
  { id: "EMCEE", label: "Emcee & Stage Host (EMCEE)" },
  { id: "MAKEUP_ARTIST", label: "Bridal & Event Makeup (MAKEUP_ARTIST)" },
];

const PRICE_UNITS = [
  "per event",
  "per day",
  "per hour",
  "per plate",
  "per guest",
  "starting package",
];

const CITY_PRESETS = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, state: "Delhi" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { register } = useAuth();

  const [accountType, setAccountType] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Common Account Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Vendor Business Fields
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("DJ");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("20000");
  const [priceUnit, setPriceUnit] = useState("per event");

  // Vendor Address Fields
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [postalCode, setPostalCode] = useState("");

  // Vendor Service Area
  const [serviceRadiusKm, setServiceRadiusKm] = useState("25");

  // Vendor Location Coordinates (Default: Central Bangalore)
  const [locationValue, setLocationValue] = useState<LocationPickerValue>({
    lat: 12.9716,
    lng: 77.5946,
  });

  const handleLocationChange = useCallback((v: LocationPickerValue) => {
    setLocationValue(v);
  }, []);

  const handleApplyPreset = (preset: typeof CITY_PRESETS[0]) => {
    setCity(preset.name);
    setState(preset.state);
    setLocationValue({ lat: preset.lat, lng: preset.lng });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser. Please click on the map.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationValue({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        setErrorMsg("Could not detect location. Please select your location on the map.");
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Basic Validation
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please enter a contact phone number.");
      return;
    }

    if (accountType === "VENDOR") {
      if (!businessName.trim()) {
        setErrorMsg("Business name is required for vendor registration.");
        return;
      }
      if (!category) {
        setErrorMsg("Please select a vendor category.");
        return;
      }
      const priceNum = Number(startingPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        setErrorMsg("Starting price must be a positive number.");
        return;
      }
      const radiusNum = Number(serviceRadiusKm);
      if (isNaN(radiusNum) || radiusNum <= 0 || radiusNum > 500) {
        setErrorMsg("Service radius must be between 1 and 500 km.");
        return;
      }
      if (!city.trim()) {
        setErrorMsg("City is required.");
        return;
      }
      if (
        locationValue.lat == null ||
        locationValue.lng == null ||
        locationValue.lat < -90 ||
        locationValue.lat > 90 ||
        locationValue.lng < -180 ||
        locationValue.lng > 180
      ) {
        setErrorMsg("Please select a valid business location on the map.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
        role: accountType,
      };

      if (accountType === "VENDOR") {
        payload.businessName = businessName.trim();
        payload.category = category;
        payload.description = description.trim();
        payload.startingPrice = Number(startingPrice);
        payload.priceUnit = priceUnit.trim() || "per event";
        payload.addressLine = addressLine.trim();
        payload.city = city.trim();
        payload.state = state.trim();
        payload.postalCode = postalCode.trim();
        payload.serviceRadiusKm = Number(serviceRadiusKm);
        payload.latitude = locationValue.lat;
        payload.longitude = locationValue.lng;
      }

      const session = await register(payload);

      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        router.push(redirectParam);
      } else if (session.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/explore-vendors");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please check your details.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background text-foreground antialiased">
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl space-y-6">
          {/* Back link */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Marketplace
            </Link>

            <span className="text-xs text-muted">
              Step 1 of 1 &bull; Instant Activation
            </span>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex w-12 h-12 rounded-xl bg-inverse items-center justify-center shadow-hairline hover:scale-105 transition-transform"
              title="EventPulse Home"
            >
              <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tighter">
              Join EventPulse
            </h1>
            <p className="text-sm text-muted max-w-md mx-auto">
              Create an account to book event talent or register your business as a verified service provider.
            </p>
          </div>

          {/* Account Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-hairline bg-surface/80 p-1 shadow-hairline">
            <button
              type="button"
              onClick={() => {
                setAccountType("CUSTOMER");
                setErrorMsg("");
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-[background-color,box-shadow,color] duration-150 cursor-pointer ${
                accountType === "CUSTOMER"
                  ? "bg-white shadow-card text-foreground font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span>Customer Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("VENDOR");
                setErrorMsg("");
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-[background-color,box-shadow,color] duration-150 cursor-pointer ${
                accountType === "VENDOR"
                  ? "bg-white shadow-card text-foreground font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Vendor Business Listing</span>
            </button>
          </div>

          {/* Registration Form Card */}
          <Card className="p-6 sm:p-8 shadow-card space-y-6">
            {errorMsg && (
              <div
                className="p-3.5 rounded-lg bg-danger/10 text-danger text-xs font-medium flex items-center gap-2 border border-danger/20"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* SECTION 1: ACCOUNT CREDENTIALS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-hairline">
                  <User className="h-4 w-4 text-accent" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Account Credentials
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" htmlFor="fullName">
                    <Input
                      id="fullName"
                      type="text"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Karan Nair"
                      required
                      maxLength={100}
                    />
                  </Field>

                  <Field label="Contact Phone" htmlFor="phone">
                    <Input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      maxLength={20}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email Address" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      maxLength={254}
                      autoComplete="email"
                    />
                  </Field>

                  <Field label="Password" htmlFor="password">
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        minLength={6}
                        maxLength={72}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              {/* SECTION 2: VENDOR BUSINESS PROFILE */}
              {accountType === "VENDOR" && (
                <>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-hairline">
                      <Store className="h-4 w-4 text-emerald-600" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Business Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Business Name" htmlFor="businessName">
                        <Input
                          id="businessName"
                          type="text"
                          name="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Acoustic Pro Concert Sound"
                          required
                        />
                      </Field>

                      <Field label="Primary Category" htmlFor="category">
                        <Select
                          id="category"
                          name="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="cursor-pointer"
                        >
                          {VENDOR_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Starting Price (₹)" htmlFor="startingPrice">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                          <Input
                            id="startingPrice"
                            type="number"
                            min="1"
                            step="100"
                            name="startingPrice"
                            value={startingPrice}
                            onChange={(e) => setStartingPrice(e.target.value)}
                            placeholder="20000"
                            className="pl-8"
                            required
                          />
                        </div>
                      </Field>

                      <Field label="Pricing Unit" htmlFor="priceUnit">
                        <Select
                          id="priceUnit"
                          name="priceUnit"
                          value={priceUnit}
                          onChange={(e) => setPriceUnit(e.target.value)}
                        >
                          {PRICE_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <Field label="Services Offered & Description" htmlFor="description">
                      <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your equipment, team experience, past events, and specialties…"
                      />
                    </Field>
                  </div>

                  {/* SECTION 3: ADDRESS & SERVICE AREA */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-hairline">
                      <Compass className="h-4 w-4 text-accent" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Address &amp; Coverage Radius
                      </h2>
                    </div>

                    <Field label="Address Line" htmlFor="addressLine">
                      <Input
                        id="addressLine"
                        type="text"
                        name="addressLine"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Street address, studio suite, or building name"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="City" htmlFor="city">
                        <Input
                          id="city"
                          type="text"
                          name="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Bangalore"
                          required
                        />
                      </Field>

                      <Field label="State / Region" htmlFor="state">
                        <Input
                          id="state"
                          type="text"
                          name="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="Karnataka"
                        />
                      </Field>

                      <Field label="Postal / PIN Code" htmlFor="postalCode">
                        <Input
                          id="postalCode"
                          type="text"
                          name="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="560001"
                        />
                      </Field>
                    </div>

                    <Field label="Service Radius (km)" htmlFor="serviceRadiusKm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <Input
                            id="serviceRadiusKm"
                            type="number"
                            min="1"
                            max="500"
                            name="serviceRadiusKm"
                            value={serviceRadiusKm}
                            onChange={(e) => setServiceRadiusKm(e.target.value)}
                            className="w-32"
                            required
                          />
                          <span className="text-xs text-muted">
                            Customers within this radius can discover and book your services.
                          </span>
                        </div>
                      </div>
                    </Field>
                  </div>

                  {/* SECTION 4: MAP LOCATION PIN */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-hairline">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Business Location on Map
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className="text-[11px] h-7 gap-1"
                        >
                          <Compass className="h-3 w-3" />
                          <span>{isDetectingLocation ? "Detecting…" : "Use My Location"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Quick City Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span className="text-[11px]">Quick Jump:</span>
                      {CITY_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className={`rounded px-2 py-0.5 text-[11px] border border-hairline transition-colors ${
                            city.toLowerCase() === p.name.toLowerCase()
                              ? "bg-inverse text-white font-medium"
                              : "bg-surface hover:bg-surface-hover text-foreground"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Map Picker */}
                    <div className="rounded-xl border border-hairline overflow-hidden shadow-hairline">
                      <LocationPicker
                        value={locationValue}
                        onChange={handleLocationChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latDisplay" className="text-[11px]">Latitude</Label>
                        <Input
                          id="latDisplay"
                          type="number"
                          step="0.0001"
                          value={locationValue.lat ?? ""}
                          onChange={(e) =>
                            setLocationValue((prev) => ({
                              ...prev,
                              lat: e.target.value ? parseFloat(e.target.value) : null,
                            }))
                          }
                          className="text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lngDisplay" className="text-[11px]">Longitude</Label>
                        <Input
                          id="lngDisplay"
                          type="number"
                          step="0.0001"
                          value={locationValue.lng ?? ""}
                          onChange={(e) =>
                            setLocationValue((prev) => ({
                              ...prev,
                              lng: e.target.value ? parseFloat(e.target.value) : null,
                            }))
                          }
                          className="text-xs tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <Button type="submit" loading={isLoading} className="w-full text-xs sm:text-sm h-11">
                  {accountType === "CUSTOMER"
                    ? "Complete Customer Registration"
                    : "Complete Vendor Business Registration"}
                </Button>
              </div>
            </form>

            <div className="text-center pt-3 border-t border-hairline text-xs text-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                Log in here
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted text-xs">
          Loading registration...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
