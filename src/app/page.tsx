import Link from "next/link";
import { FiArrowRight, FiCompass, FiRadio, FiRefreshCw } from "react-icons/fi";
import SpotCard from "@/components/SpotCard";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getLatest } from "@/lib/ndbc";
import type { NdbcObservation, Spot } from "@/lib/types";

async function fetchFeaturedSpots(): Promise<
  Array<{ spot: Spot; observation: NdbcObservation | null }>
> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("spots")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error || !data) {
      console.warn("Failed to load public spots:", error?.message);
      return [];
    }

    const enriched = await Promise.all(
      data.map(async (spot) => {
        try {
          const observation = await getLatest(spot.buoy_id);
          return { spot, observation };
        } catch (err) {
          console.warn(
            `Failed to load observation for buoy ${spot.buoy_id}`,
            err
          );
          return { spot, observation: null };
        }
      })
    );

    return enriched;
  } catch (err) {
    console.warn("Supabase not configured yet, showing empty state.", err);
    return [];
  }
}

export default async function HomePage() {
  const featured = await fetchFeaturedSpots();

  return (
    <div className="flex flex-1 flex-col gap-12 pb-16">
      <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 px-8 py-14 shadow-lg shadow-sky-900/30 backdrop-blur">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
            Free & Open Source
          </span>
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl">
            Surfwatch is your open Surfline alternative.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Monitor NOAA buoys, share favorite spots, and collaborate on the
            highest-quality surf intelligence platform that runs entirely on free
            tiers. Built with Next.js 14, Supabase, Leaflet, and TanStack Query.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Launch dashboard <FiArrowRight aria-hidden />
          </Link>
          <Link
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 font-semibold transition hover:border-sky-300/60 hover:text-sky-100"
          >
            Star on GitHub
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
            <FiRadio aria-hidden className="text-sky-300" />
            Live NDBC feed
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
            <FiCompass aria-hidden className="text-sky-300" />
            OpenStreetMap overlays
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
            <FiRefreshCw aria-hidden className="text-sky-300" />
            Realtime Supabase
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Trending public spots</h2>
            <p className="text-sm text-white/60">
              Pulling directly from NOAA NDBC stations. Add your own spots after
              signing in.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-sky-200 transition hover:text-sky-100"
          >
            Manage my quiver <FiArrowRight aria-hidden />
          </Link>
        </header>

        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/60">
            No public spots yet. Once you connect Supabase and seed the{" "}
            <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-xs">
              spots
            </code>{" "}
            table, your list will appear automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featured.map(({ spot, observation }) => (
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

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur">
        <h2 className="text-2xl font-semibold">Powered by open infrastructure</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white">Supabase</h3>
            <p className="mt-2 text-sm text-white/70">
              Auth, Postgres, storage, and real-time channels. Add row-level
              policies and run scheduled edge functions for buoy sync jobs.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white">NOAA NDBC</h3>
            <p className="mt-2 text-sm text-white/70">
              Zero-cost marine observations. Use the built-in API route proxy to
              avoid CORS and keep responses cache-friendly.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <h3 className="text-lg font-semibold text-white">Next.js 14</h3>
            <p className="mt-2 text-sm text-white/70">
              App Router, Server Components, edge-friendly data fetching, and
              deploys with a single push to Vercel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
