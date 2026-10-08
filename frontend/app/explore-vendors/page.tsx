"use client";

import MarketplaceView from "../../components/MarketplaceView";
import { useAuth } from "../../hooks/useAuth";

export default function ExploreVendorsPage() {
  const { isAuthenticated, isVendor } = useAuth();

  return <MarketplaceView isCustomerPortal={isAuthenticated && !isVendor} />;
}
