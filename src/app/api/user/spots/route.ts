import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabaseServerClient";

export async function GET(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteHandlerSupabaseClient(request, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { spotIds: [] },
      {
        status: 401,
        headers: res.headers,
      }
    );
  }

  const { data, error } = await supabase
    .from("user_saved_spots")
    .select("spot_id")
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 400,
        headers: res.headers,
      }
    );
  }

  return NextResponse.json(
    { spotIds: (data ?? []).map((row) => row.spot_id) },
    {
      headers: res.headers,
    }
  );
}

export async function POST(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteHandlerSupabaseClient(request, res);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: res.headers,
      }
    );
  }

  const body = await request.json().catch(() => null);
  const spotIds = Array.isArray(body?.spotIds)
    ? body.spotIds.filter((value: unknown) => typeof value === "string")
    : [];

  if (spotIds.length === 0) {
    return NextResponse.json(
      { error: "No spot IDs provided" },
      {
        status: 400,
        headers: res.headers,
      }
    );
  }

  const payload = spotIds.map((spotId: string) => ({
    user_id: session.user.id,
    spot_id: spotId,
  }));

  const { error } = await supabase
    .from("user_saved_spots")
    .upsert(payload, { onConflict: "user_id,spot_id" });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 400,
        headers: res.headers,
      }
    );
  }

  return NextResponse.json(
    { success: true },
    {
      headers: res.headers,
    }
  );
}


