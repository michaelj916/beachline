import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FiArrowLeft, FiDownloadCloud } from "react-icons/fi";
import LiveBadge from "@/components/LiveBadge";
import TideGauge from "@/components/TideGauge";
import WaveChart from "@/components/WaveChart";
import SpotMap from "@/components/SpotMap";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { getRecent } from "@/lib/ndbc";
import { getCurrentWaveObservation } from "@/lib/waveProviders";
import type { NdbcObservation, Spot } from "@/lib/types";

type Props = {
  params: { id: string };
};

async function getSpot(id: string): Promise<Spot | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/dashboard/${id}`);
  }

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.warn("Failed to load spot", error.message);
    return null;
  }

  return (data as Spot | null) ?? null;
}

export default async function SpotPage({ params }: Props) {
  let spot: Spot | null = null;
  let observation: NdbcObservation | null = null;

  try {
    spot = await getSpot(params.id);
  } catch (error) {
    console.error("Supabase not configured for spot page.", error);
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-sm text-white/70">
        Configure Supabase environment variables to view spot details.
      </div>
    );
  }

  if (!spot) {
    notFound();
  }

  try {
    observation =
      (await getCurrentWaveObservation(spot)) ??
      (await getRecent(spot.buoy_id, 1)).at(0) ??
      null;
  } catch (error) {
    console.warn("No latest observation found.", error);
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-wide text-white/40 transition hover:text-sky-100"
          >
            <FiArrowLeft aria-hidden />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">{spot.name}</h1>
            <LiveBadge buoy={spot.buoy_id} />
          </div>
          <p className="text-sm text-white/60">
            Buoy #{spot.buoy_id} •{" "}
            {spot.is_public ? "Public lineup" : "Private lineup"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
            Buoy ID {spot.buoy_id}
          </span>
          <a
            href={`https://www.ndbc.noaa.gov/station_page.php?station=${spot.buoy_id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-sky-300/60 hover:text-sky-100"
          >
            <FiDownloadCloud aria-hidden />
            Open NDBC
          </a>
        </div>
      </div>

      <TideGauge observation={observation} />

      <WaveChart buoy={spot.buoy_id} />

      <SpotMap spot={spot} />
    </div>
  );
}

