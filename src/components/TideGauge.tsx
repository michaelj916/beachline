import clsx from "clsx";
import type { NdbcObservation } from "@/lib/types";

type Props = {
  observation: NdbcObservation | null;
};

export default function TideGauge({ observation }: Props) {
  const waveHeight = observation?.waveHeight ?? null;
  const dominantPeriod = observation?.dominantPeriod ?? null;
  const windSpeed = observation?.windSpeed ?? null;
  const windDirection = observation?.windDirection ?? null;
  const waterTemp = observation?.waterTemperature ?? null;

  const normalized =
    waveHeight !== null ? Math.min(Math.max(waveHeight / 6, 0), 1) : null;
  const indicatorAngle = normalized !== null ? normalized * 180 - 90 : null;

  return (
    <div className="grid gap-6 rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Conditions</h3>
          <p className="text-xs uppercase tracking-wide text-white/40">
            Live buoy snapshot
          </p>
        </div>
        <div className="text-xs text-white/50">
          Updated{" "}
          {observation?.timestamp
            ? new Date(observation.timestamp).toLocaleString()
            : "–"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
        <dl className="grid grid-cols-2 gap-4 text-sm text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase text-white/40">Wave Height</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {waveHeight !== null ? `${waveHeight.toFixed(1)} m` : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase text-white/40">Dominant Period</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {dominantPeriod !== null ? `${dominantPeriod.toFixed(0)} s` : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase text-white/40">Wind</dt>
            <dd className="mt-2 text-xl font-semibold text-white">
              {windSpeed !== null ? `${windSpeed.toFixed(0)} kt` : "—"}
            </dd>
            <p className="text-xs text-white/60">
              {windDirection !== null ? `${windDirection.toFixed(0)}°` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <dt className="text-xs uppercase text-white/40">Water Temp</dt>
            <dd className="mt-2 text-2xl font-semibold text-white">
              {waterTemp !== null ? `${waterTemp.toFixed(0)} °C` : "—"}
            </dd>
          </div>
        </dl>

        <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-sky-500/20 to-indigo-500/30">
          <div className="relative h-36 w-36 rounded-full border border-white/20 bg-black/40 shadow-inner shadow-sky-900/50">
            <span className="absolute inset-6 rounded-full border border-dashed border-white/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <span className="text-xs uppercase tracking-wide text-white/40">
                Surf Score
              </span>
              <span className="text-3xl font-semibold text-white">
                {normalized !== null ? Math.round(normalized * 100) : "–"}
              </span>
              <span className="text-xs text-white/60">
                {waveHeight !== null ? `${waveHeight.toFixed(1)} m seas` : "No data"}
              </span>
            </div>
            {indicatorAngle !== null && (
              <span
                className={clsx(
                  "absolute left-1/2 top-1/2 h-1/2 w-1 origin-bottom rounded-full",
                  "bg-gradient-to-b from-sky-300 to-sky-500"
                )}
                style={{
                  transform: `rotate(${indicatorAngle}deg) translate(-50%, -100%)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

