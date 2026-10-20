/**
 * Map provider abstraction.
 * The UI only talks to this interface, so Google Maps / Mapbox / OSM can be
 * plugged in later by adding a provider here (keys stay server-side only).
 */
export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  position: LatLng;
  kind: "store" | "customer" | "driver";
  label: string;
};

export interface MapProvider {
  readonly name: string;
  staticUrl(params: { center: LatLng; zoom: number; markers: MapMarker[] }): string | null;
  isConfigured(): boolean;
}

/** Default provider: renders a schematic canvas, no external key required. */
export const schematicProvider: MapProvider = {
  name: "schematic",
  staticUrl: () => null,
  isConfigured: () => true,
};

export const osmProvider: MapProvider = {
  name: "openstreetmap",
  staticUrl: ({ center, zoom }) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.02}%2C${
      center.lat - 0.02
    }%2C${center.lng + 0.02}%2C${center.lat + 0.02}&layer=mapnik&marker=${center.lat}%2C${center.lng}&zoom=${zoom}`,
  isConfigured: () => true,
};

export function getMapProvider(): MapProvider {
  // Switching providers is a one-line change once an API key is provisioned
  // server-side (process.env.MAPS_PROVIDER).
  const provider = process.env.MAPS_PROVIDER ?? "osm";
  if (provider === "schematic") return schematicProvider;
  return osmProvider;
}

export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** Interpolated driver position for the tracking map. */
export function routePoint(from: LatLng, to: LatLng, progress: number): LatLng {
  const t = Math.min(1, Math.max(0, progress));
  return { lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t };
}
