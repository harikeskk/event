"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, User, Store, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Field, Textarea, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const VENDOR_CATEGORIES = [
  { id: "DJ", label: "DJ & Music" },
  { id: "PHOTOGRAPHER", label: "Photographer & Videographer" },
  { id: "CATERER", label: "Catering & Banquet Service" },
  { id: "DECORATOR", label: "Event Decorator & Florist" },
  { id: "VENUE", label: "Venue & Banquet Lawn" },
  { id: "SOUND_LIGHTING", label: "Sound & Stage Lighting" },
  { id: "EMCEE", label: "Emcee & Stage Host" },
  { id: "MAKEUP_ARTIST", label: "Bridal & Event Makeup" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [accountType, setAccountType] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    // Vendor specific
    businessName: "",
    category: "DJ",
    city: "Bangalore",
    addressLine: "",
    startingPrice: 20000,
    serviceRadiusKm: 25,
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: accountType,
      };

      if (accountType === "VENDOR") {
        payload.businessName = formData.businessName || `${formData.fullName} Services`;
        payload.category = formData.category;
        payload.city = formData.city;
        payload.addressLine = formData.addressLine || formData.city;
        payload.startingPrice = Number(formData.startingPrice);
        payload.serviceRadiusKm = Number(formData.serviceRadiusKm);
        payload.description = formData.description;
        // Default coordinates for Bangalore if not provided
        payload.latitude = 12.9716;
        payload.longitude = 77.5946;
      }

      const session = await register(payload);
      if (session.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl space-y-6">
          {/* Back link */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Marketplace
            </Link>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex w-12 h-12 rounded-md bg-inverse items-center justify-center shadow-hairline hover:scale-105 transition-transform"
              title="EventPulse Home"
            >
              <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tighter">
              Join EventPulse
            </h1>
            <p className="text-sm text-muted">
              Create an account to book verified event vendors or register as a service provider
            </p>
          </div>

          {/* Account Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-0.5 rounded-md bg-surface p-0.5 shadow-hairline">
            <button
              type="button"
              onClick={() => setAccountType("CUSTOMER")}
              className={`py-2.5 rounded-[5px] text-sm font-medium flex items-center justify-center gap-2 transition-[background-color,box-shadow,color] duration-150 ease-out ${
                accountType === "CUSTOMER"
                  ? "bg-white shadow-card text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span>I am a Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("VENDOR")}
              className={`py-2.5 rounded-[5px] text-sm font-medium flex items-center justify-center gap-2 transition-[background-color,box-shadow,color] duration-150 ease-out ${
                accountType === "VENDOR"
                  ? "bg-white shadow-card text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Store className="w-4 h-4" aria-hidden="true" />
              <span>I am an Event Vendor</span>
            </button>
          </div>

          {/* Registration Form Card */}
          <Card className="p-6 sm:p-8 shadow-card space-y-5">
            {errorMsg && (
              <div
                className="p-3.5 rounded-md bg-[#fef3f2] text-[#b42318] text-sm flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" htmlFor="fullName">
                  <Input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Sarah Jenkins…"
                    required
                  />
                </Field>

                <Field label="Phone Number" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210…"
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email Address" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com…"
                    required
                  />
                </Field>

                <Field label="Create Password" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters…"
                    minLength={6}
                    required
                  />
                </Field>
              </div>

              {/* Vendor Specific Business Profile Fields */}
              {accountType === "VENDOR" && (
                <div className="rounded-md bg-surface p-4 space-y-4 shadow-hairline">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Store className="w-4 h-4" aria-hidden="true" />
                    Business Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Business Name" htmlFor="businessName">
                      <Input
                        id="businessName"
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Sonic Waves DJ & Sound…"
                        required
                      />
                    </Field>

                    <Field label="Service Category" htmlFor="category">
                      <Select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="City" htmlFor="city">
                      <Input
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Bangalore…"
                      />
                    </Field>

                    <Field label="Starting Price (₹)" htmlFor="startingPrice">
                      <Input
                        id="startingPrice"
                        type="number"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleChange}
                      />
                    </Field>

                    <Field label="Service Radius (km)" htmlFor="serviceRadiusKm">
                      <Input
                        id="serviceRadiusKm"
                        type="number"
                        name="serviceRadiusKm"
                        value={formData.serviceRadiusKm}
                        onChange={handleChange}
                      />
                    </Field>
                  </div>

                  <Field label="Description / Services Offered" htmlFor="description">
                    <Textarea
                      id="description"
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Specializing in wedding receptions, corporate sound, and custom playlists…"
                    />
                  </Field>
                </div>
              )}

              <Button type="submit" loading={isLoading} className="w-full">
                {accountType === "CUSTOMER"
                  ? "Create Customer Account"
                  : "Register Business Listing"}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-hairline text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-blue hover:underline">
                Log in here
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
