"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LogOut,
  Store,
  LayoutDashboard,
  CalendarCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/explore-vendors", label: "Explore Vendors", icon: Store },
  { href: "/my-inquiries", label: "My Inquiries", icon: CalendarCheck },
];

export interface CustomerNavProps {
  subtitle?: string;
}

/**
 * Top application bar for Customer Portal pages (/explore-vendors, /my-inquiries, etc.).
 * Displays EventPulse brand, quick portal links, active user profile pill,
 * and a functional Log Out button.
 */
export function CustomerTopNav({ subtitle }: CustomerNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isVendor, logout } = useAuth();

  const handleLogout = () => {
    logout("/login");
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "C";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Portal Badge */}
        <div className="flex items-center gap-3">
          <Link
            href={isAuthenticated ? (isVendor ? "/vendor" : "/explore-vendors") : "/explore-vendors"}
            className="flex items-center gap-2 group transition-opacity hover:opacity-85"
            title="EventPulse Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-inverse text-white shadow-hairline transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              EventPulse
            </span>
          </Link>

          <span className="text-subtle text-xs" aria-hidden="true">
            /
          </span>

          <Badge variant="neutral" className="text-[11px] font-medium tracking-wide">
            Customer Portal
          </Badge>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-3" aria-label="Customer portal">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active =
                tab.href === "/explore-vendors"
                  ? pathname === "/explore-vendors"
                  : pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md transition-colors",
                    active
                      ? "bg-surface font-semibold text-foreground shadow-hairline"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account & Auth Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* User Identity Pill */}
              <Link
                href="/explore-vendors"
                className="flex items-center gap-2 rounded-lg border border-hairline bg-surface/70 px-2.5 py-1 text-xs shadow-hairline hover:bg-surface transition-colors"
                title="Customer Portal"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inverse text-[10px] font-bold text-white">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-foreground leading-tight truncate max-w-[130px]">
                    {user?.fullName || "Customer"}
                  </p>
                  <p className="text-[10px] text-muted leading-none">Customer</p>
                </div>
              </Link>

              {/* Log Out Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-colors cursor-pointer"
                title="Log out of your customer account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </Button>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </header>
  );
}

export default function CustomerNav(props: CustomerNavProps) {
  return <CustomerTopNav {...props} />;
}
