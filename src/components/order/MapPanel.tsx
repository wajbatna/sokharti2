"use client";

import { Bike, Home, Store } from "lucide-react";
import type { LatLng } from "@/lib/maps";

/**
 * Presentation layer for the map abstraction.
 * When a provider embed URL is supplied (OSM / Google / Mapbox) it is rendered
 * in an iframe; otherwise a schematic route view is drawn locally.
 */
export function MapPanel({
  storePos,
  customerPos,
  driverPos,
  embedUrl,
  progress = 0.5,
}: {
  storePos: LatLng;
  customerPos: LatLng;
  driverPos?: LatLng | null;
  embedUrl?: string | null;
  progress?: number;
}) {
  if (embedUrl) {
    return (
      <div className="overflow-hidden rounded-3xl border border-gray-100">
        <iframe title="خريطة التتبع" src={embedUrl} className="h-64 w-full" loading="lazy" />
      </div>
    );
  }

  const pct = Math.min(0.92, Math.max(0.08, progress));

  return (
    <div className="relative h-64 overflow-hidden rounded-3xl border border-gray-100 bg-[#eef1f5] map-grid">
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
        <path d="M40 150 C 140 150, 160 60, 250 60 S 350 90, 360 50" fill="none" stroke="#FF6B35" strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" opacity="0.75" />
      </svg>

      <Marker className="bottom-6 right-6" tone="dark" icon={<Store className="h-4 w-4" />} label="المحل" />
      <Marker className="left-6 top-6" tone="green" icon={<Home className="h-4 w-4" />} label="عنوانك" />
      <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000" style={{ right: `${pct * 100}%` }}>
        <span className="pulse-ring flex h-11 w-11 items-center justify-center rounded-full bg-[#FF6B35] text-white shadow-lg">
          <Bike className="h-5 w-5" />
        </span>
      </div>

      <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 px-3 py-1.5 text-[10px] font-bold text-gray-600 backdrop-blur">
        {driverPos ? `موقع السائق ${driverPos.lat.toFixed(3)}, ${driverPos.lng.toFixed(3)}` : `${storePos.lat.toFixed(3)}, ${customerPos.lng.toFixed(3)}`}
      </div>
    </div>
  );
}

function Marker({ className, icon, label, tone }: { className: string; icon: React.ReactNode; label: string; tone: "dark" | "green" }) {
  return (
    <div className={`absolute flex items-center gap-2 ${className}`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow ${tone === "dark" ? "bg-[#111827]" : "bg-[#22C55E]"}`}>{icon}</span>
      <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold text-gray-700 backdrop-blur">{label}</span>
    </div>
  );
}
