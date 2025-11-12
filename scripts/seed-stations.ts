type ExistingSpotRow = {
  id: string;
  buoy_id: string;
};
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { SpotInsert, Database } from "../src/lib/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NDBC_JSON_ENDPOINTS = [
  "https://www.ndbc.noaa.gov/assets/stations.json",
  "http://www.ndbc.noaa.gov/assets/stations.json",
];
const NDBC_TABLE_ENDPOINT =
  "https://www.ndbc.noaa.gov/data/stations/station_table.txt";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

function parseLocation(location: string) {
  const match = location.match(
    /(-?\d+(?:\.\d+)?)\s*([NS])\s+(-?\d+(?:\.\d+)?)\s*([EW])/i
  );
  if (!match) {
    return null;
  }
  let lat = Number(match[1]);
  let lon = Number(match[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  const latDir = match[2].toUpperCase();
  const lonDir = match[4].toUpperCase();
  if (latDir === "S") lat *= -1;
  if (lonDir === "W") lon *= -1;
  return { lat, lon };
}

async function fetchStations() {
  for (const url of NDBC_JSON_ENDPOINTS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Surfwatch seed script (https://github.com/michaelj916/beachline)",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to load ${url}: ${response.status}`);
        continue;
      }

      const json = (await response.json()) as Array<{
        id: string;
        name: string;
        lat: number;
        lon: number;
      }>;

      const stations = json
        .filter(
          (station) =>
            Number.isFinite(station.lat) && Number.isFinite(station.lon)
        )
        .map<SpotInsert>((station) => ({
          buoy_id: station.id,
          name: station.name || station.id,
          lat: station.lat,
          lng: station.lon,
          is_public: true,
          provider_overrides: {},
        }));

      if (stations.length > 0) {
        console.log(`Loaded ${stations.length} stations from ${url}`);
        return stations;
      }
    } catch (error) {
      console.warn(`Error fetching ${url}:`, error);
    }
  }

  console.log("Falling back to station_table.txt feed");
  const response = await fetch(NDBC_TABLE_ENDPOINT, {
    headers: {
      "User-Agent": "Surfwatch seed script (https://github.com/michaelj916/beachline)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download NDBC station table: ${response.status}`
    );
  }

  const text = await response.text();
  const stations: SpotInsert[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("|");
    if (parts.length < 7) continue;
    const id = parts[0]?.trim();
    const name = parts[4]?.trim() || id;
    const location = parts[6] ?? "";
    if (!id || !location) continue;
    const coords = parseLocation(location);
    if (!coords) continue;
    stations.push({
      buoy_id: id,
      name,
      lat: coords.lat,
      lng: coords.lon,
      is_public: true,
      provider_overrides: {},
    });
  }

  if (stations.length === 0) {
    throw new Error("Parsed station table but found no valid coordinates");
  }

  console.log(`Loaded ${stations.length} stations from ${NDBC_TABLE_ENDPOINT}`);
  return stations;
}

async function main() {
  const supabase = createClient<Database>(
    SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY as string
  );
  const stations = await fetchStations();

  if (stations.length === 0) {
    console.warn("No stations found in catalog. Nothing to upsert.");
    return;
  }

  const existing = await supabase
    .from("spots")
    .select("id, buoy_id")
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }
      return (data as ExistingSpotRow[]) ?? [];
    });

  const idByBuoy = new Map<string, string>();
  for (const row of existing) {
    if (row.buoy_id && row.id) {
      idByBuoy.set(row.buoy_id, row.id);
    }
  }

  const updates: Array<SpotInsert & { id: string }> = [];
  const inserts: SpotInsert[] = [];

  for (const station of stations) {
    const existingId = idByBuoy.get(station.buoy_id);
    if (existingId) {
      updates.push({ ...station, id: existingId });
    } else {
      inserts.push(station);
    }
  }

  const batchSize = 500;

  for (let i = 0; i < updates.length; i += batchSize) {
    const chunk = updates.slice(i, i + batchSize);
    const { error } = await supabase.from("spots").upsert(chunk, {
      onConflict: "id",
    });
    if (error) throw error;
    console.log(`Updated ${Math.min(i + chunk.length, updates.length)} / ${updates.length}`);
  }

  for (let i = 0; i < inserts.length; i += batchSize) {
    const chunk = inserts.slice(i, i + batchSize);
    const { error } = await supabase.from("spots").insert(chunk);
    if (error) throw error;
    console.log(`Inserted ${Math.min(i + chunk.length, inserts.length)} / ${inserts.length}`);
  }

  console.log(
    `Completed sync. ${updates.length} updated, ${inserts.length} inserted (${stations.length} total)`
  );

  await fs.writeFile(
    path.join(process.cwd(), "stations-cache.json"),
    JSON.stringify(stations, null, 2)
  );
  console.log(
    `Cached station payload to stations-cache.json and updated Supabase.`  
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

