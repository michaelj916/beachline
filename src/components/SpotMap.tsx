"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import type { Spot } from "@/lib/types";

type Props = {
  spot: Pick<Spot, "lat" | "lng" | "name">;
};

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function SpotMap({ spot }: Props) {
  const center = useMemo(
    () =>
      spot.lat && spot.lng
        ? ([spot.lat, spot.lng] as [number, number])
        : null,
    [spot.lat, spot.lng]
  );

  if (!center) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-white/60">
        Add latitude/longitude to unlock map previews.
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={11}
        scrollWheelZoom
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{
            color: "#38bdf8",
            weight: 2,
            fillColor: "#38bdf8",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -12]}
            opacity={1}
            permanent
            className="surfwatch-map-tooltip"
          >
            {spot.name}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

