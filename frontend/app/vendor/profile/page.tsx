"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Navigation, RefreshCw, LogOut } from "lucide-react";
import { VendorTopNav, VendorTabs } from "@/components/VendorNav";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile, updateMyProfile } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full" />,
});

const CATEGORIES = [
  { value: "DJ", label: "DJ" },
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "CATERER", label: "Caterer" },
  { value: "DECORATOR", label: "Decorator" },
  { value: "VENUE", label: "Venue" },
  { value: "SOUND_LIGHTING", label: "Sound & Lighting" },
  { value: "MAKEUP_ARTIST", label: "Makeup Artist" },
  { value: "EMCEE", label: "Emcee" },
];

interface VendorProfile {
  id?: string;
  businessName?: string | null;
  category?: string | null;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startingPrice?: number | string | null;
  priceUnit?: string | null;
  serviceRadiusKm?: number | null;
  coverImageUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isAvailable?: boolean | null;
}

interface ProfileForm {
  businessName: string;
  category: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  startingPrice: string;
  priceUnit: string;
  serviceRadiusKm: string;
  contactPhone: string;
  contactEmail: string;
  coverImageUrl: string;
  latitude: number | null;
  longitude: number | null;
}

type TextKey = Exclude<keyof ProfileForm, "latitude" | "longitude">;

interface LocationValue {
  lat: number | null;
  lng: number | null;
}

const EMPTY_FORM: ProfileForm = {
  businessName: "",
  category: "",
  description: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  startingPrice: "",
  priceUnit: "",
  serviceRadiusKm: "",
  contactPhone: "",
  contactEmail: "",
  coverImageUrl: "",
  latitude: null,
  longitude: null,
};

const toText = (v: number | string | null | undefined) =>
  v === null || v === undefined ? "" : String(v);

function toForm(profile: VendorProfile | null): ProfileForm {
  return {
    businessName: profile?.businessName ?? "",
    category: profile?.category ?? "",
    description: profile?.description ?? "",
    addressLine: profile?.addressLine ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    postalCode: profile?.postalCode ?? "",
    startingPrice: toText(profile?.startingPrice),
    priceUnit: profile?.priceUnit ?? "",
    serviceRadiusKm: toText(profile?.serviceRadiusKm),
    contactPhone: profile?.contactPhone ?? "",
    contactEmail: profile?.contactEmail ?? "",
    coverImageUrl: profile?.coverImageUrl ?? "",
    latitude: typeof profile?.latitude === "number" ? profile.latitude : null,
    longitude: typeof profile?.longitude === "number" ? profile.longitude : null,
  };
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function VendorProfilePage() {
  const router = useRouter();
  const { token, isAuthenticated, isVendor, isLoading: authLoading, logout } = useAuth();

  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isVendor)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isVendor, router]);

  const loadProfile = useCallback(() => {
    if (!token) return;
    getMyProfile(token)
      .then((data: VendorProfile) => {
        setProfile(data);
        setForm(toForm(data));
        setLoadError(null);
      })
      .catch((err: unknown) =>
        setLoadError(errorMessage(err, "We couldn't load your profile. Try again in a moment.")),
      )
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (authLoading || !token || !isAuthenticated || !isVendor) return;
    loadProfile();
  }, [authLoading, token, isAuthenticated, isVendor, loadProfile]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    loadProfile();
  };

  const setField = (key: TextKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleLocationChange = useCallback((v: LocationValue) => {
    setForm((prev) => ({ ...prev, latitude: v.lat, longitude: v.lng }));
    setSaveSuccess(null);
    setSaveError(null);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported by your browser — click the map instead.");
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setSaveSuccess(null);
      },
      () => {
        setGeoError("We couldn't access your location — click the map to set it manually.");
      },
    );
  };

  const emailValid =
    form.contactEmail.trim() === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim());
  const phoneValid =
    form.contactPhone.trim() === "" ||
    /^\+?[0-9\s\-()]{7,20}$/.test(form.contactPhone.trim());
  const coverValid =
    form.coverImageUrl.trim() === "" || /^https?:\/\/\S+$/i.test(form.coverImageUrl.trim());
  const priceNum = Number(form.startingPrice.trim());
  const priceValid =
    form.startingPrice.trim() === "" ||
    (Number.isFinite(priceNum) && priceNum > 0);
  const radiusNum = Number(form.serviceRadiusKm.trim());
  const radiusValid =
    form.serviceRadiusKm.trim() === "" ||
    (Number.isInteger(radiusNum) && radiusNum >= 1 && radiusNum <= 500);
  const coordsValid =
    (form.latitude === null || (form.latitude >= -90 && form.latitude <= 90)) &&
    (form.longitude === null || (form.longitude >= -180 && form.longitude <= 180));
  const isValid =
    form.businessName.trim() !== "" &&
    form.category !== "" &&
    emailValid &&
    phoneValid &&
    coverValid &&
    priceValid &&
    radiusValid &&
    coordsValid;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving || !token) return;
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);
    try {
      const updated = await updateMyProfile(
        {
          businessName: form.businessName.trim(),
          category: form.category,
          description: form.description.trim(),
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
          serviceRadiusKm: form.serviceRadiusKm.trim() === "" ? null : Number(form.serviceRadiusKm),
          startingPrice: form.startingPrice.trim() === "" ? null : Number(form.startingPrice),
          priceUnit: form.priceUnit.trim(),
          coverImageUrl: form.coverImageUrl.trim(),
          contactPhone: form.contactPhone.trim(),
          contactEmail: form.contactEmail.trim(),
        },
        token,
      );
      if (updated) {
        setProfile(updated as VendorProfile);
        setForm(toForm(updated as VendorProfile));
      }
      setSaveSuccess("Profile saved. Customers see these details right away.");
    } catch (err: unknown) {
      setSaveError(
        errorMessage(err, "We couldn't save your profile. Check the fields and try again."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const field = (
    id: TextKey,
    label: string,
    options: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      span?: boolean;
      error?: string | null;
      inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
    } = {},
  ) => (
    <div className={options.span ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label htmlFor={id}>
        {label}
        {options.required && (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        type={options.type ?? "text"}
        inputMode={options.inputMode}
        placeholder={options.placeholder}
        value={form[id]}
        onChange={(e) => setField(id, e.target.value)}
        aria-required={options.required || undefined}
        aria-invalid={options.error ? true : undefined}
      />
      {options.error && <p className="text-xs text-danger">{options.error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <VendorTopNav />
      <main className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10 space-y-8 flex-1">
        <header className="space-y-5 border-b border-hairline pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Business Profile</h1>
              <p className="text-xs text-muted">
                Manage how customers find, discover, and contact your business in the marketplace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {profile && (
                <Badge variant={profile.isAvailable ? "success" : "danger"} dot>
                  {profile.isAvailable ? "Open for Bookings" : "Fully Booked"}
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout("/login");
                }}
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

        {isLoading ? (
          <Card className="space-y-6 p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="space-y-2 sm:col-span-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <Skeleton className="h-80 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-36" />
            </div>
          </Card>
        ) : loadError ? (
          <Card className="mx-auto max-w-lg p-8 sm:p-10 text-center shadow-card border-hairline space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-hairline">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">Profile Unavailable</h3>
              <p className="max-w-md text-xs text-muted leading-relaxed mx-auto">{loadError}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button onClick={handleRetry} className="w-full sm:w-auto text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  logout("/login?redirect=/vendor/profile");
                }}
                className="w-full sm:w-auto text-xs"
              >
                Log In Again
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSave} noValidate className="space-y-6">
            <Card className="space-y-6 p-6">
              <div>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  This is what customers see before they send an inquiry.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {field("businessName", "Business Name", {
                  required: true,
                  placeholder: "Sunrise Sounds & Events",
                })}

                <div className="space-y-1.5">
                  <Label htmlFor="category">
                    Category
                    <span className="text-danger" aria-hidden="true">
                      {" *"}
                    </span>
                  </Label>
                  <Select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    aria-required
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell customers about your services, experience, and packages…"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>

                {field("addressLine", "Address Line", {
                  span: true,
                  placeholder: "12, 4th Cross, Indiranagar",
                })}
                {field("city", "City", { placeholder: "Bengaluru" })}
                {field("state", "State", { placeholder: "Karnataka" })}
                {field("postalCode", "Postal Code", { placeholder: "560038" })}
                {field("startingPrice", "Starting Price (₹)", {
                  type: "number",
                  inputMode: "decimal",
                  placeholder: "15000",
                  error: priceValid ? null : "Starting price must be greater than 0.",
                })}
                {field("priceUnit", "Price Unit", { placeholder: "per event" })}
                {field("serviceRadiusKm", "Service Radius (km)", {
                  type: "number",
                  inputMode: "numeric",
                  placeholder: "25",
                  error: radiusValid ? null : "Service radius must be a whole number between 1 and 500 km.",
                })}
                {field("contactPhone", "Contact Phone", {
                  type: "tel",
                  inputMode: "tel",
                  placeholder: "+91 98765 43210",
                  error: phoneValid ? null : "Enter a valid phone number (7–20 digits).",
                })}
                {field("contactEmail", "Contact Email", {
                  type: "email",
                  inputMode: "email",
                  placeholder: "hello@yourservice.com",
                  error: emailValid ? null : "Enter a valid email, like name@company.com.",
                })}
                {field("coverImageUrl", "Cover Image URL", {
                  span: true,
                  type: "url",
                  inputMode: "url",
                  placeholder: "https://…/cover.jpg",
                  error: coverValid ? null : "Enter a full URL starting with http:// or https://.",
                })}
              </div>

              <div className="space-y-4 border-t border-hairline pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-medium tracking-tight">Location</h2>
                    <p className="text-xs text-muted">
                      Click the map to set the coordinates customers search from.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleUseMyLocation}>
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    Use my location
                  </Button>
                </div>

                <LocationPicker
                  value={{ lat: form.latitude, lng: form.longitude }}
                  onChange={handleLocationChange}
                />

                {geoError && <p className="text-xs text-danger">{geoError}</p>}
                {!coordsValid && (
                  <p className="text-xs text-danger">
                    Coordinates must be valid: latitude −90 to 90, longitude −180 to 180.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
                <div aria-live="polite" className="min-w-0">
                  {saveSuccess && (
                    <p className="flex items-start gap-1.5 text-sm text-success">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {saveSuccess}
                    </p>
                  )}
                  {saveError && (
                    <p className="flex items-start gap-1.5 text-sm text-danger">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {saveError}
                    </p>
                  )}
                  {!saveSuccess && !saveError && (
                    <p className="text-xs text-muted">
                      Availability is managed from the Dashboard tab.
                    </p>
                  )}
                </div>
                <Button type="submit" loading={isSaving} disabled={!isValid}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
