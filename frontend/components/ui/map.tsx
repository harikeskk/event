"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// 1. Context for Map instance
interface MapContextType {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}

const MapContext = createContext<MapContextType>({
  map: null,
  isLoaded: false,
});

export const useMap = () => useContext(MapContext);

// Context for individual Marker
interface MarkerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  marker: maplibregl.Marker | null;
}

const MarkerContext = createContext<MarkerContextType>({
  isOpen: false,
  setIsOpen: () => {},
  marker: null,
});

export const useMarker = () => useContext(MarkerContext);

// Default clean tile style using OpenStreetMap
const DEFAULT_MAP_STYLE = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// 2. Map Component
export interface MapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  pitch?: number;
  bearing?: number;
  mapStyle?: string | object;
  className?: string;
  children?: React.ReactNode;
  interactive?: boolean;
}

export function Map({
  center = [-73.98, 40.76],
  zoom = 12,
  pitch = 0,
  bearing = 0,
  mapStyle = DEFAULT_MAP_STYLE,
  className = "w-full h-full min-h-[350px]",
  children,
  interactive = true,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle as any,
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      interactive: interactive,
      attributionControl: false,
    });

    mapInstance.on("load", () => {
      setIsLoaded(true);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update center when props change smoothly
  useEffect(() => {
    if (!map || !isLoaded) return;
    map.flyTo({
      center: center,
      zoom: zoom,
      essential: true,
      duration: 1000,
    });
  }, [center[0], center[1], zoom, map, isLoaded]);

  return (
    <MapContext.Provider value={{ map, isLoaded }}>
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  );
}

// 3. MapMarker Component
export interface MapMarkerProps {
  longitude: number;
  latitude: number;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function MapMarker({
  longitude,
  latitude,
  onClick,
  className = "",
  children,
}: MapMarkerProps) {
  const { map } = useMap();
  const [containerEl] = useState(() => {
    const el = document.createElement("div");
    el.className = "group relative inline-flex items-center justify-center";
    return el;
  });
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!map) return;

    const m = new maplibregl.Marker({
      element: containerEl,
      anchor: "center",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    setMarker(m);

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
      if (onClick) onClick();
    };

    containerEl.addEventListener("click", handleClick);

    return () => {
      containerEl.removeEventListener("click", handleClick);
      m.remove();
    };
  }, [map]);

  useEffect(() => {
    if (marker) {
      marker.setLngLat([longitude, latitude]);
    }
  }, [longitude, latitude, marker]);

  if (!map) return null;

  return (
    <MarkerContext.Provider value={{ isOpen, setIsOpen, marker }}>
      {createPortal(
        <div className={`group relative cursor-pointer ${className}`}>{children}</div>,
        containerEl
      )}
    </MarkerContext.Provider>
  );
}

// 4. MarkerContent Component
export interface MarkerContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MarkerContent({ children, className = "" }: MarkerContentProps) {
  return (
    <div className={`relative z-10 transition-transform duration-200 group-hover:scale-115 ${className}`}>
      {children}
    </div>
  );
}

// 5. MarkerTooltip Component
export interface MarkerTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function MarkerTooltip({ children, className = "" }: MarkerTooltipProps) {
  const { isOpen } = useMarker();

  // Hide tooltip if popup is open
  if (isOpen) return null;

  return (
    <div
      className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-top-10 bg-slate-900/95 text-slate-100 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap z-30 border border-slate-700/70 ${className}`}
    >
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
    </div>
  );
}

// 6. MarkerPopup Component
export interface MarkerPopupProps {
  children: React.ReactNode;
  className?: string;
}

export function MarkerPopup({ children, className = "" }: MarkerPopupProps) {
  const { isOpen, setIsOpen } = useMarker();

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 min-w-[200px] bg-slate-900/95 text-slate-100 p-3.5 rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
        className="absolute top-2 right-2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition text-xs"
        aria-label="Close popup"
      >
        ✕
      </button>
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-900/95" />
    </div>
  );
}
