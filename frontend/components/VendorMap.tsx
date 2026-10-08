"use client";

import React, { useEffect, useRef } from "react";

export interface VendorMapProps {
  vendors: any[];
  customerLocation: { lat: number; lng: number };
  radiusKm: number;
  selectedVendorId: string | null;
  onSelectVendor: (vendor: any) => void;
}

export default function VendorMap({
  vendors,
  customerLocation,
  radiusKm,
  selectedVendorId,
  onSelectVendor,
}: VendorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const vendorMarkersMapRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet in browser
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([customerLocation.lat, customerLocation.lng], 12);

        // Fast OpenStreetMap tiles (100% Free, NO API KEY, NO WATERMARK)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
        }).addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;

      // Update user location marker & radius circle
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
      }

      // Radius circle with subtle accent stroke
      radiusCircleRef.current = L.circle([customerLocation.lat, customerLocation.lng], {
        radius: radiusKm * 1000,
        color: "#0070f3",
        fillColor: "#0070f3",
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "6, 8",
      }).addTo(map);

      // Customer marker
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="
            background: #171717;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.18);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      L.marker([customerLocation.lat, customerLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(markersLayerRef.current)
        .bindPopup(`<div style="font-weight:600;font-size:12px;color:#171717;">Search Origin</div>`);

      // Clear previous vendor markers
      markersLayerRef.current.clearLayers();
      vendorMarkersMapRef.current.clear();

      // Category icon emojis
      const getCategoryBadge = (cat: string) => {
        switch (cat) {
          case "DJ": return "🎧";
          case "PHOTOGRAPHER": return "📸";
          case "CATERER": return "🍽️";
          case "DECORATOR": return "✨";
          case "VENUE": return "🏰";
          case "SOUND_LIGHTING": return "🔊";
          case "EMCEE": return "🎤";
          case "MAKEUP_ARTIST": return "💄";
          default: return "🎉";
        }
      };

      // Add clean pin markers
      vendors.forEach((vendor) => {
        if (!vendor.latitude || !vendor.longitude) return;

        const isSelected = selectedVendorId === vendor.id;
        const emoji = getCategoryBadge(vendor.category);
        const priceFormatted = vendor.startingPrice ? `₹${Number(vendor.startingPrice).toLocaleString("en-IN")}` : "";

        const markerHtml = `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: transform 0.2s ease;
          ">
            <!-- Pin Badge -->
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${isSelected ? "#171717" : "#ffffff"};
              border: ${isSelected ? "2px solid #ffffff" : "1px solid rgba(0, 0, 0, 0.1)"};
              box-shadow: ${isSelected
                ? "0 0 0 1px rgba(0, 0, 0, 0.16), 0 4px 10px rgba(0, 0, 0, 0.18)"
                : "0 2px 6px rgba(0, 0, 0, 0.14)"};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              line-height: 1;
            ">
              ${emoji}
            </div>

            ${priceFormatted ? `
            <!-- Price Tag Pill -->
            <div style="
              margin-top: 4px;
              background: #ffffff;
              color: #171717;
              border: 1px solid rgba(0, 0, 0, 0.08);
              border-radius: 9999px;
              padding: 1px 7px;
              font-size: 10px;
              font-weight: 600;
              white-space: nowrap;
              font-variant-numeric: tabular-nums;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
            ">
              ${priceFormatted}
            </div>` : ""}
          </div>
        `;

        const vendorIcon = L.divIcon({
          className: "clean-vendor-marker",
          html: markerHtml,
          iconSize: [60, 65],
          iconAnchor: [30, 35],
        });

        const marker = L.marker([vendor.latitude, vendor.longitude], { icon: vendorIcon })
          .addTo(markersLayerRef.current);

        vendorMarkersMapRef.current.set(vendor.id, marker);

        marker.on("click", () => {
          onSelectVendor(vendor);
        });

        const availabilityBadge = vendor.isAvailable !== false
          ? `<span style="font-size:10px; font-weight:600; background:#ecfdf5; color:#047857; padding:2px 6px; border-radius:9999px;">● Open for Bookings</span>`
          : `<span style="font-size:10px; font-weight:600; background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:9999px;">● Fully Booked</span>`;

        // Rich Popup Window with navigation actions (safe info only, no private phone/email)
        const popupContent = `
          <div style="min-width: 210px; font-family: inherit; color: #171717; padding: 2px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:10px; font-weight:600; text-transform:uppercase; color:#666666; letter-spacing:0.02em;">${emoji} ${vendor.category || "Event Pro"}</span>
              ${availabilityBadge}
            </div>
            <div style="font-weight:600; font-size:14px; letter-spacing:-0.01em; line-height:1.25; margin-bottom:4px; color:#171717;">
              ${vendor.businessName}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:11px; color:#666666; font-variant-numeric:tabular-nums;">
              <span>📍 ${vendor.distanceKm != null ? `${vendor.distanceKm} km away` : (vendor.city || "Nearby")}</span>
              <span>★ ${vendor.ratingAvg ? Number(vendor.ratingAvg).toFixed(1) : "5.0"}</span>
            </div>
            <div style="border-top:1px solid #f0f0f0; padding-top:6px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11px; color:#666666;">Starting from</span>
              <span style="font-size:13px; font-weight:700; color:#171717; font-variant-numeric:tabular-nums;">${priceFormatted || "Price on request"}</span>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="/vendors/${vendor.id}" style="flex:1; text-align:center; padding:6px 8px; background:#f4f4f5; color:#171717; border-radius:6px; text-decoration:none; font-size:11px; font-weight:600; border:1px solid #e4e4e7;">
                View Details
              </a>
              ${vendor.isAvailable !== false ? `
              <a href="/book/${vendor.id}" style="flex:1; text-align:center; padding:6px 8px; background:#171717; color:#ffffff; border-radius:6px; text-decoration:none; font-size:11px; font-weight:600;">
                Book Service
              </a>` : ""}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      // If a vendor is selected, open its popup & center map
      if (selectedVendorId && vendorMarkersMapRef.current.has(selectedVendorId)) {
        const selectedMarker = vendorMarkersMapRef.current.get(selectedVendorId);
        selectedMarker.openPopup();
      }

      // Fit map bounds to encompass all vendors & user if no vendor specifically selected
      if (!selectedVendorId && vendors.length > 0) {
        const bounds = L.latLngBounds(
          vendors.map((v) => [v.latitude, v.longitude] as [number, number])
        );
        bounds.extend([customerLocation.lat, customerLocation.lng]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [vendors, customerLocation, radiusKm, selectedVendorId, onSelectVendor]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-xl bg-surface shadow-hairline">
      <div ref={mapContainerRef} className="relative z-0 h-full w-full" />
      <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 text-xs text-muted shadow-card border border-hairline">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-success"
        />
        <span className="tabular-nums font-medium text-foreground">
          {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
        </span>
        <span className="text-muted">within {radiusKm} km</span>
      </div>
    </div>
  );
}
