import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabaseServerClient";

export async function POST(
  req: NextRequest,
  { params }: { params: { spotId: string } }
) {
  const res = NextResponse.next();
  const supabase = createRouteHandlerSupabaseClient(req, res);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_saved_spots")
    .upsert(
      {
        user_id: session.user.id,
        spot_id: params.spotId,
      },
      { onConflict: "user_id,spot_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { success: true },
    {
      headers: res.headers,
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { spotId: string } }
) {
  const res = NextResponse.next();
  const supabase = createRouteHandlerSupabaseClient(req, res);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_saved_spots")
    .delete()
    .eq("user_id", session.user.id)
    .eq("spot_id", params.spotId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { success: true },
    {
      headers: res.headers,
    }
  );
}


