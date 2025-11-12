"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import clsx from "clsx";
import type { Spot } from "@/lib/types";

type Props = {
  spots: Array<Spot & { distance?: number }>;
  center: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  onMarkerClick?: (spot: Spot) => void;
  className?: string;
};

export default function StationsMap({
  spots,
  center,
  zoom = 6,
  userLocation,
  onMarkerClick,
  className,
}: Props) {
  const mapKey = useMemo(() => `${center[0]}-${center[1]}-${zoom}`, [center, zoom]);

  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden rounded-3xl border border-white/10",
        className ?? "h-[520px]"
      )}
    >
      <MapContainer
        key={mapKey}
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />

        {userLocation && (
          <CircleMarker
            center={userLocation}
            radius={8}
            pathOptions={{
              color: "#38bdf8",
              weight: 2,
              fillColor: "#38bdf8",
              fillOpacity: 0.7,
            }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={1}>
              You are here
            </Tooltip>
          </CircleMarker>
        )}

        {spots.map((spot) => {
          if (spot.lat === null || spot.lng === null) return null;
          return (
            <CircleMarker
              key={spot.id}
              center={[spot.lat, spot.lng]}
              radius={spot.distance && spot.distance < 30 ? 7 : 5}
              pathOptions={{
                color: spot.distance && spot.distance < 50 ? "#22d3ee" : "#60a5fa",
                weight: 1,
                fillColor: "#0ea5e9",
                fillOpacity: 0.8,
              }}
              eventHandlers={
                onMarkerClick
                  ? {
                      click: () => onMarkerClick(spot),
                    }
                  : undefined
              }
            >
              <Tooltip
                direction="top"
                offset={[0, -12]}
                opacity={1}
                className="surfwatch-map-tooltip"
              >
                <div className="text-slate-900">
                  <div className="font-semibold">{spot.name}</div>
                  <div className="text-xs">Buoy {spot.buoy_id}</div>
                  {spot.distance !== undefined && (
                    <div className="text-xs">
                      {spot.distance.toFixed(1)} mi away
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

