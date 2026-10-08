"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/bookings", label: "Bookings" },
  { href: "/vendor/profile", label: "Profile" },
  { href: "/vendor/portfolio", label: "Portfolio" },
];

export default function VendorNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-0.5 rounded-md bg-surface p-0.5 shadow-hairline"
      aria-label="Vendor portal"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] transition-[background-color,color,box-shadow] duration-150",
              active
                ? "bg-white font-medium text-foreground shadow-card"
                : "text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
