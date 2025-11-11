import Link from "next/link";
import { redirect } from "next/navigation";
import SpotCard from "@/components/SpotCard";
import NewSpotForm from "@/components/NewSpotForm";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getLatest } from "@/lib/ndbc";
import type { NdbcObservation, Spot } from "@/lib/types";

async function withObservations(spots: Spot[]): Promise<
  Array<{ spot: Spot; observation: NdbcObservation | null }>
> {
  return Promise.all(
    spots.map(async (spot) => {
      try {
        const observation = await getLatest(spot.buoy_id);
        return { spot, observation };
      } catch (error) {
        console.warn("Failed to load observation", spot.buoy_id, error);
        return { spot, observation: null };
      }
    })
  );
}

export default async function DashboardPage() {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    console.error("Supabase configuration missing for dashboard.", error);
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/70">
        Add <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        to load your dashboard.
      </div>
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const userId = session.user.id;

  const [{ data: mySpots }, { data: communitySpots }] = await Promise.all([
    supabase
      .from("spots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("spots")
      .select("*")
      .eq("is_public", true)
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const [mine, community] = await Promise.all([
    withObservations(mySpots ?? []),
    withObservations(communitySpots ?? []),
  ]);

  return (
    <div className="flex flex-col gap-10 pb-16">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              Welcome back, {session.user.email?.split("@")[0] ?? "surfer"}.
            </h1>
            <p className="text-sm text-white/60">
              Track buoy telemetry, set private alerts, and share your homebreak
              with the crew.
            </p>
          </div>
          <Link
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-300/60 hover:text-sky-100"
          >
            Documentation
          </Link>
        </div>
        <NewSpotForm />
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">My spots</h2>
          <span className="text-xs uppercase tracking-wide text-white/40">
            {mine.length} saved
          </span>
        </header>

        {mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/70">
            You haven’t added any spots yet. Use the form above to track your first
            buoy.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {mine.map(({ spot, observation }) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                observation={observation ?? undefined}
                href={`/dashboard/${spot.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Community lineup</h2>
          <span className="text-xs uppercase tracking-wide text-white/40">
            {community.length} public
          </span>
        </header>

        {community.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/70">
            No community spots yet. Once other users mark their spots public,
            they’ll appear here in real time.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {community.map(({ spot, observation }) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                observation={observation ?? undefined}
                href={`/dashboard/${spot.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

