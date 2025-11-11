import Link from "next/link";
import { FiArrowRight, FiMapPin, FiUsers } from "react-icons/fi";
import type { Spot } from "@/lib/types";
import type { NdbcObservation } from "@/lib/types";

type Props = {
  spot: Spot;
  observation?: NdbcObservation | null;
  href?: string;
};

export default function SpotCard({ spot, observation, href }: Props) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-black/30 dark:bg-black/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{spot.name}</h3>
          <p className="mt-1 text-sm text-white/70">
            Buoy #{spot.buoy_id}
          </p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          {spot.is_public ? (
            <span className="inline-flex items-center gap-1">
              <FiUsers aria-hidden /> Public
            </span>
          ) : (
            "Private"
          )}
        </span>
      </div>

      {observation ? (
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/80">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">
              Wave Height
            </dt>
            <dd className="text-lg font-semibold">
              {observation.waveHeight !== null
                ? `${observation.waveHeight.toFixed(1)} m`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">
              Wind
            </dt>
            <dd className="text-lg font-semibold">
              {observation.windSpeed !== null
                ? `${observation.windSpeed.toFixed(0)} kt`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">
              Period
            </dt>
            <dd className="text-lg font-semibold">
              {observation.dominantPeriod !== null
                ? `${observation.dominantPeriod.toFixed(0)} s`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">
              Water Temp
            </dt>
            <dd className="text-lg font-semibold">
              {observation.waterTemperature !== null
                ? `${observation.waterTemperature.toFixed(0)} °C`
                : "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-white/70">
          Live data will appear once the buoy reports a fresh observation.
        </p>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-white/70">
        <span className="inline-flex items-center gap-2">
          <FiMapPin aria-hidden />
          {spot.lat && spot.lng
            ? `${spot.lat.toFixed(2)}, ${spot.lng.toFixed(2)}`
            : "No coordinates"}
        </span>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/40"
          >
            View Detail
            <FiArrowRight aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}


