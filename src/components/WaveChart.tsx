"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { FiAlertTriangle } from "react-icons/fi";
import type { NdbcObservation } from "@/lib/types";

let chartRegistered = false;
if (!chartRegistered) {
  ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler
  );
  chartRegistered = true;
}

type Props = {
  buoy: string;
  limit?: number;
  className?: string;
};

type ApiResponse = {
  data: Array<NdbcObservation & { timestamp: string }>;
};

async function fetchSeries(buoy: string, limit: number): Promise<ApiResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`/api/ndbc/${buoy}?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load NDBC history");
  }
  return res.json();
}

export default function WaveChart({ buoy, limit = 24, className }: Props) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["ndbc", buoy, limit],
    queryFn: () => fetchSeries(buoy, limit),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!data) return null;
    const labels = data.data.map((obs) => obs.timestamp);
    const heights = data.data.map((obs) => obs.waveHeight ?? null);
    const periods = data.data.map((obs) => obs.dominantPeriod ?? null);

    return {
      labels,
      datasets: [
        {
          label: "Wave height (m)",
          data: heights,
          borderColor: "rgba(56, 189, 248, 1)",
          backgroundColor: "rgba(56, 189, 248, 0.25)",
          fill: "origin",
          tension: 0.35,
          borderWidth: 2,
        },
        {
          label: "Dominant period (s)",
          data: periods,
          borderColor: "rgba(14, 165, 233, 1)",
          borderDash: [6, 6],
          tension: 0.25,
          borderWidth: 1.5,
          yAxisID: "period",
        },
      ],
    };
  }, [data]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
            usePointStyle: true,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          type: "time",
          ticks: {
            color: "rgba(255, 255, 255, 0.5)",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Meters",
            color: "rgba(255, 255, 255, 0.6)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.5)",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        period: {
          position: "right",
          title: {
            display: true,
            text: "Seconds",
            color: "rgba(255, 255, 255, 0.6)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.5)",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }),
    []
  );

  if (isPending) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm text-white/60">
        Loading buoy telemetry…
      </div>
    );
  }

  if (isError || !chartData) {
    return (
      <div className="flex h-64 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-sm text-rose-100">
        <FiAlertTriangle aria-hidden />
        Couldn’t load the latest buoy history.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative h-80 w-full rounded-2xl border border-white/10 bg-black/30 p-4",
        className
      )}
    >
      <Line data={chartData} options={options} />
    </div>
  );
}

