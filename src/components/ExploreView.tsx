"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiMapPin } from "react-icons/fi";
import type { Spot } from "@/lib/types";
import StationsMap from "@/components/StationsMap";
import SpotSearchPanel from "@/components/SpotSearchPanel";
import SpotSaveButton from "@/components/SpotSaveButton";
import { useSavedSpots } from "@/hooks/useSavedSpots";

type EnrichedSpot = Spot & { distance?: number };

const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437]; // Los Angeles fallback

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const EARTH_RADIUS_MILES = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

async function fetchNearby(lat: number, lng: number, radius = 100) {
  const response = await fetch(
    `/api/spots/nearby?lat=${lat}&lng=${lng}&radiusMiles=${radius}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby spots with status ${response.status}`);
  }
  const payload = (await response.json()) as { spots: EnrichedSpot[] };
  return payload.spots;
}

export default function ExploreView() {
  const [spots, setSpots] = useState<EnrichedSpot[]>([]);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<
    "locating" | "success" | "prompt" | "error"
  >("locating");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { savedSpotIds, ensureSaved, session } = useSavedSpots();
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("prompt");
      setStatusMessage(
        "Location services are disabled. Search for a buoy or surf spot to get started."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(coords);
        setCenter(coords);
        setStatus("success");

        try {
          const nearby = await fetchNearby(coords[0], coords[1]);
          setSpots(nearby);
        } catch (error) {
          console.error(error);
          setStatus("error");
          setStatusMessage(
            "Unable to load nearby buoys. Try searching manually."
          );
        }
      },
      (error) => {
        console.warn("Geolocation error", error);
        setStatus("prompt");
        setStatusMessage(
          "We couldn't access your location. Search for a buoy or surf spot."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleSearchResults = useCallback(
    (results: Spot[]) => {
      if (results.length === 0) {
        setSpots([]);
        return;
      }
      if (userLocation) {
        const decorated = results.map((spot) => {
          if (spot.lat === null || spot.lng === null) return spot;
          return {
            ...spot,
            distance: haversineDistance(
              userLocation[0],
              userLocation[1],
              spot.lat,
              spot.lng
            ),
          };
        });
        setSpots(decorated);
      } else {
        setSpots(results);
      }
    },
    [userLocation]
  );

  const handleSelectSpot = useCallback((spot: Spot) => {
    if (spot.lat !== null && spot.lng !== null) {
      setCenter([spot.lat, spot.lng]);
    }
  }, []);

  const recommended = useMemo(() => {
    if (!userLocation) return spots.slice(0, 6);
    return [...spots]
      .filter((spot) => spot.lat !== null && spot.lng !== null)
      .sort((a, b) => {
        const distA =
          a.distance ??
          (a.lat !== null && a.lng !== null
            ? haversineDistance(userLocation[0], userLocation[1], a.lat, a.lng)
            : Number.POSITIVE_INFINITY);
        const distB =
          b.distance ??
          (b.lat !== null && b.lng !== null
            ? haversineDistance(userLocation[0], userLocation[1], b.lat, b.lng)
            : Number.POSITIVE_INFINITY);
        return distA - distB;
      })
      .slice(0, 6);
  }, [spots, userLocation]);

  useEffect(() => {
    if (
      !defaultsApplied &&
      session &&
      status === "success" &&
      userLocation &&
      savedSpotIds.length === 0 &&
      spots.length > 0
    ) {
      const defaults = spots
        .filter((spot) => spot.lat !== null && spot.lng !== null)
        .slice(0, 5)
        .map((spot) => spot.id);
      if (defaults.length > 0) {
        ensureSaved(defaults).catch((error) =>
          console.warn("Failed to auto-save defaults", error)
        );
        setDefaultsApplied(true);
      }
    }
  }, [
    defaultsApplied,
    ensureSaved,
    savedSpotIds.length,
    session,
    spots,
    status,
    userLocation,
  ]);

  return (
    <div className="grid gap-8 pb-20">
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-sky-900/30">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
          Explore the lineup
        </span>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Find the nearest buoys & surf intelligence around you.
        </h1>
        <p className="max-w-2xl text-sm text-white/70">
          Surfwatch pulls live conditions from every NOAA NDBC station worldwide.
          Enable location services to auto-load spots within 100 miles, or search
          by buoy ID and beach name. Your recent searches are cached locally so
          you can jump back in instantly.
        </p>
      </section>

      {status !== "success" && statusMessage && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <FiAlertCircle aria-hidden />
          {statusMessage}
        </div>
      )}

      <section className="relative rounded-3xl border border-white/10 bg-black/20 shadow-lg shadow-sky-900/40">
        <StationsMap
          spots={spots}
          center={center}
          userLocation={userLocation}
          zoom={userLocation ? 8 : 4}
          onMarkerClick={handleSelectSpot}
          className="h-[72vh] min-h-[500px]"
        />
        <div className="pointer-events-none absolute inset-0 flex justify-end p-4 sm:p-6">
          <div className="pointer-events-auto w-full max-w-sm">
            <SpotSearchPanel
              onResults={handleSearchResults}
              onSelectSpot={handleSelectSpot}
              userLocation={userLocation}
            />
          </div>
        </div>
      </section>

      {spots.length > 0 && (
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">
              Recommended spots nearby
            </h2>
            {userLocation && (
              <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
                <FiMapPin aria-hidden />
                Within 100 miles
              </span>
            )}
          </header>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((spot) => (
            <div
              key={spot.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-300/60"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {spot.name}
                  </div>
                  <div className="text-xs text-white/60">
                    Buoy {spot.buoy_id}
                  </div>
                </div>
                <SpotSaveButton
                  spotId={spot.id}
                  initialSaved={savedSpotIds.includes(spot.id)}
                  size="sm"
                />
              </div>
              {spot.distance !== undefined && (
                <div className="mt-2 text-xs text-white/50">
                  {spot.distance.toFixed(1)} miles away
                </div>
              )}
              <div className="mt-4">
                <Link
                  href={`/dashboard/${spot.id}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-sky-200 transition hover:text-sky-100"
                >
                  View details
                </Link>
              </div>
            </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

