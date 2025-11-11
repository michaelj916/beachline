import { cache } from "react";
import type { NdbcObservation, NdbcRawObservation } from "./types";

const NDBC_BASE_URL = "https://www.ndbc.noaa.gov/data";

function parseTable(response: string): {
  header: string[];
  rows: string[][];
} {
  const lines = response
    .trim()
    .split("\n")
    .map((line) => line.replace(/^#\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("NDBC response missing data");
  }

  const header = lines[0].split(/\s+/);
  const rows = lines.slice(1).map((row) => row.split(/\s+/));

  return { header, rows };
}

function toNumber(value: string | undefined): number | null {
  if (!value || value === "MM") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function pad(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.toString().padStart(2, "0");
}

function assembleObservation(row: NdbcRawObservation): NdbcObservation {
  const dateParts = [
    row.YY ?? row.YR,
    row.MM ?? row.MN,
    row.DD ?? row.DY,
    row.hh ?? row.HR,
    row.mm ?? row.MT,
  ].filter(Boolean);
  const timestamp =
    dateParts.length >= 4
      ? `${pad(row.YY ?? row.YR)}-${pad(row.MM ?? row.MN)}-${pad(
          row.DD ?? row.DY
        )}T${pad(row.hh ?? row.HR) ?? "00"}:${pad(row.mm ?? row.MT) ?? "00"}:00Z`
      : "";

  return {
    timestamp,
    waveHeight: toNumber(row.WVHT),
    dominantPeriod: toNumber(row.DPD),
    averagePeriod: toNumber(row.AP ?? row.APD),
    meanWaveDirection: toNumber(row.MWD),
    windSpeed: toNumber(row.WSPD),
    windGust: toNumber(row.GST ?? row.WGST),
    windDirection: toNumber(row.WDIR),
    airTemperature: toNumber(row.ATMP),
    waterTemperature: toNumber(row.WTMP),
  };
}

export const getLatest = cache(async (buoy: string) => {
  const res = await fetch(`${NDBC_BASE_URL}/latestobs/${buoy}.txt`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch latest observation for buoy ${buoy}`);
  }

  const text = await res.text();
  const { header, rows } = parseTable(text);
  const row = rows[0];

  const entry = Object.fromEntries(
    header.map((key, index) => [key, row[index]])
  ) satisfies NdbcRawObservation;

  return assembleObservation(entry);
});

export const getRecent = cache(async (buoy: string, limit = 24) => {
  const res = await fetch(`${NDBC_BASE_URL}/realtime2/${buoy}.txt`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch recent observations for buoy ${buoy}`);
  }

  const text = await res.text();
  const { header, rows } = parseTable(text);
  const observations = rows.slice(0, limit).map((row) => {
    const entry = Object.fromEntries(
      header.map((key, index) => [key, row[index]])
    ) satisfies NdbcRawObservation;
    return assembleObservation(entry);
  });

  return observations.reverse();
});


