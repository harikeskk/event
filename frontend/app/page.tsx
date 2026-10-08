"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import MarketplaceView from "../components/MarketplaceView";

export default function RootHomePage() {
  const router = useRouter();
  const { isAuthenticated, isVendor, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isVendor) {
        router.replace("/vendor");
      } else {
        router.replace("/explore-vendors");
      }
    }
  }, [isLoading, isAuthenticated, isVendor, router]);

  return <MarketplaceView isCustomerPortal={isAuthenticated && !isVendor} />;
}
