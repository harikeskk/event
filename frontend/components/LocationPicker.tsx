"use client";

import React, { useEffect } from "react";
import type { MapMouseEvent } from "maplibre-gl";
import { Map, MapMarker, useMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationPickerValue {
  lat: number | null;
  lng: number | null;
}

export interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (v: LocationPickerValue) => void;
  className?: string;
}

function MapInteractions({
  value,
  onChange,
}: {
  value: LocationPickerValue;
  onChange: (v: LocationPickerValue) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const handleClick = (e: MapMouseEvent) => {
      onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, onChange]);

  if (value.lat == null || value.lng == null) return null;

  return (
    <MapMarker longitude={value.lng} latitude={value.lat}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-inverse text-white shadow-card">
        <MapPin className="h-4 w-4" aria-hidden="true" />
      </span>
    </MapMarker>
  );
}

export default function LocationPicker({ value, onChange, className }: LocationPickerProps) {
  const isSet = value.lat != null && value.lng != null;

  return (
    <div className={cn("space-y-3", className)}>
      <Map
        center={[value.lng ?? 77.5946, value.lat ?? 12.9716]}
        zoom={value.lat != null ? 14 : 11}
        className="h-80 w-full"
      >
        <MapInteractions value={value} onChange={onChange} />
      </Map>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm tabular-nums", isSet ? "text-foreground" : "text-muted")}>
          {isSet ? (
            <>
              Lat {value.lat?.toFixed(4)} · Lng {value.lng?.toFixed(4)}
            </>
          ) : (
            "Click the map to set your location"
          )}
        </p>

        {isSet && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ lat: null, lng: null })}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
