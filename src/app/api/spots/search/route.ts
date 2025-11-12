import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import type { Spot } from "@/lib/types";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;
const EARTH_RADIUS_MILES = 3958.8;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number | null | undefined,
  lon2: number | null | undefined
) {
  if (
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return Number.POSITIVE_INFINITY;
  }
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
  const rawQuery = url.searchParams.get("q") ?? "";
  const query = rawQuery.trim();
  const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  const limit = Math.min(Math.max(isNaN(limitParam) ? DEFAULT_LIMIT : limitParam, 10), MAX_LIMIT);

  let builder = supabase
    .from("spots")
    .select("id, buoy_id, name, lat, lng, is_public")
    .limit(limit);

  if (query && query !== "*") {
    builder = builder.or(`name.ilike.%${query}%,buoy_id.ilike.%${query}%`);
  } else {
    builder = builder.order("name", { ascending: true });
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const spots = (data ?? []) as Spot[];

  const enriched = hasLocation
    ? spots
        .map((spot) => ({
          ...spot,
          distance: haversineDistance(lat, lng, spot.lat, spot.lng),
        }))
        .sort((a, b) => a.distance - b.distance)
    : spots;

  return NextResponse.json({
    spots: enriched,
    meta: {
      truncated: spots.length === limit,
      total: spots.length,
    },
  });
}

