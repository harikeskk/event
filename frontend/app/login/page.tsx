"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldCheck, UserCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// Demo quick-logins are a development convenience (seed accounts). They render
// in dev only and stay hidden in production builds unless explicitly enabled
// via NEXT_PUBLIC_ENABLE_DEMO_LOGINS=true. Never enable in production with
// real user data.
const SHOW_DEMO_LOGINS =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGINS === "true" ||
  process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, isVendor } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(isVendor ? "/vendor" : "/");
    }
  }, [authLoading, isAuthenticated, isVendor, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const session = await login(email, password);
      if (session.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
    setIsLoading(true);

    try {
      const session = await login(demoEmail, demoPass);
      if (session.role === "VENDOR") {
        router.push("/vendor");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-6">
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

          {/* Card Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex w-12 h-12 rounded-md bg-inverse items-center justify-center shadow-hairline hover:scale-105 transition-transform"
              title="EventPulse Home"
            >
              <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tighter">
              Log In to EventPulse
            </h1>
            <p className="text-sm text-muted">
              Access your event inquiries or manage your vendor business
            </p>
          </div>

          {/* Quick Demo Login Helpers (dev only, hidden in production) */}
          {SHOW_DEMO_LOGINS && (
            <div className="rounded-md bg-surface p-4 shadow-hairline space-y-2">
              <span className="text-xs font-medium text-muted block">
                Quick 1-click demo logins
              </span>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleQuickLogin("customer@example.com", "password123")}
              >
                <UserCheck className="w-4 h-4" aria-hidden="true" />
                Sign In as Demo Customer
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleQuickLogin("dj.alex@example.com", "password123")}
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Sign In as Demo Vendor
              </Button>
            </div>
          )}

          {/* Login Form */}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Email Address" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com…"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    maxLength={72}
                    autoComplete="current-password"
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

              <Button type="submit" loading={isLoading} className="w-full">
                Log In
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-hairline text-sm text-muted">
              Don’t have an account yet?{" "}
              <Link href="/register" className="text-blue hover:underline">
                Create an account
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
