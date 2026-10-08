"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SHOW_DEMO_LOGINS =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGINS === "true" ||
  process.env.NODE_ENV !== "production";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const {
    login,
    logout,
    user,
    isAuthenticated,
    isVendor,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getDestination = (role: string) => {
    // Only allow same-origin relative paths; reject protocol-relative "//evil" targets.
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      return redirectParam;
    }
    return role === "VENDOR" ? "/vendor" : "/explore-vendors";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const session = await login(email, password);
      router.push(getDestination(session.role));
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Invalid email or password"
      );
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
      router.push(getDestination(session.role));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    logout();
    setEmail("");
    setPassword("");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background text-foreground">
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {isAuthenticated && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="inline-flex items-center gap-1 text-xs text-danger hover:underline cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </button>
            </div>
          )}

          {/* Card Header */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex w-12 h-12 rounded-xl bg-inverse items-center justify-center shadow-hairline hover:scale-105 transition-transform"
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

          {/* Existing Session Notice - Prevents Infinite Redirect Traps */}
          {isAuthenticated && (
            <Card className="p-4 bg-surface/70 border-hairline shadow-card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted">Already signed in as:</p>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
                <Badge variant="neutral" className="text-[10px]">
                  {user?.role}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-hairline">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => router.push(getDestination(user?.role || ""))}
                >
                  <span>Continue to {isVendor ? "Vendor Portal" : "Customer Dashboard"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/20"
                  onClick={handleSwitchAccount}
                >
                  <LogOut className="h-3 w-3" />
                  Switch Account
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Demo Login Helpers */}
          {SHOW_DEMO_LOGINS && (
            <div className="rounded-xl border border-hairline bg-surface/50 p-4 shadow-hairline space-y-2">
              <span className="text-xs font-medium text-muted block">
                Quick 1-click demo logins
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs justify-start gap-2"
                  onClick={() =>
                    handleQuickLogin("customer@example.com", "password123")
                  }
                >
                  <UserCheck className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                  <span className="truncate">Demo Customer</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs justify-start gap-2"
                  onClick={() =>
                    handleQuickLogin("sound.karan@example.com", "password123")
                  }
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
                  <span className="truncate">Demo Vendor</span>
                </Button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <Card className="p-6 sm:p-8 shadow-card space-y-5">
            {errorMsg && (
              <div
                className="p-3.5 rounded-lg bg-danger/10 text-danger text-xs font-medium flex items-center gap-2 border border-danger/20"
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

            <div className="text-center pt-2 border-t border-hairline text-xs text-muted">
              Don’t have an account yet?{" "}
              <Link href="/register" className="text-foreground font-semibold hover:underline">
                Create an account
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted text-xs">
          Loading login...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
