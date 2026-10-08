"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerHomePage() {
  const router = useRouter();
  const { isAuthenticated, isVendor, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isVendor) {
        router.replace("/vendor");
      } else if (!isAuthenticated) {
        router.replace("/login?redirect=/explore-vendors");
      } else {
        router.replace("/explore-vendors");
      }
    }
  }, [isLoading, isAuthenticated, isVendor, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </main>
    </div>
  );
}
