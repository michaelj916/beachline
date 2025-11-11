import { NextResponse } from "next/server";
import { getRecent } from "@/lib/ndbc";

type Params = {
  params: { buoy: string };
};

export async function GET(request: Request, { params }: Params) {
  const { buoy } = params;
  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "24", 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 6), 72) : 24;

  try {
    const data = await getRecent(buoy, safeLimit);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch NDBC history", buoy, error);
    return NextResponse.json(
      { error: "Unable to fetch buoy observations" },
      { status: 502 }
    );
  }
}

