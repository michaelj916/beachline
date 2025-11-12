import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Spot } from "@/lib/types";

const DEFAULT_RADIUS_MILES = 100;
const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
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

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const radius = Number(
    url.searchParams.get("radiusMiles") ?? DEFAULT_RADIUS_MILES
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("spots")
    .select("id, buoy_id, name, lat, lng, is_public")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const spots = (data ?? []) as Spot[];

  const filtered = spots
    .map((spot) => {
      const distance = haversineDistance(
        lat,
        lng,
        spot.lat ?? 0,
        spot.lng ?? 0
      );
      return { ...spot, distance };
    })
    .filter((spot) => spot.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 100);

  return NextResponse.json({
    spots: filtered,
  });
}

