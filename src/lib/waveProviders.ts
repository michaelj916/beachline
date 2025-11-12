import { getLatest, getRecent } from "./ndbc";
import type { NdbcObservation, Spot, SpotProviderOverrides } from "./types";

export type WaveObservation = NdbcObservation & {
  source: string;
  providerId?: string;
};

type WaveProvider = {
  id: string;
  label: string;
  supports: (spot: Spot) => boolean;
  getCurrent: (spot: Spot) => Promise<WaveObservation | null>;
};

const ndbcProvider: WaveProvider = {
  id: "ndbc",
  label: "NOAA NDBC",
  supports: (spot) => Boolean(spot.buoy_id),
  async getCurrent(spot) {
    const observation =
      (await getLatest(spot.buoy_id)) ??
      (await getRecent(spot.buoy_id, 1)).at(0) ??
      null;

    if (!observation) return null;
    return { ...observation, source: this.label, providerId: spot.buoy_id };
  },
};

const cdipProvider: WaveProvider = {
  id: "cdip",
  label: "CDIP",
  supports: (spot) => Boolean(spot.provider_overrides?.cdip?.stationId),
  async getCurrent(spot) {
    const overrides = spot.provider_overrides as SpotProviderOverrides | null;
    const stationId = overrides?.cdip?.stationId;
    if (!stationId) return null;

    try {
      const url = `https://cdip.ucsd.edu/data_access/latest.php?station=${stationId}&format=json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Surfwatch CDIP fetcher",
        },
      });
      if (!res.ok) {
        throw new Error(`CDIP request failed: ${res.status}`);
      }
      const text = await res.text();
      const data = JSON.parse(text);
      const record =
        data?.data?.[0] ??
        data?.latest?.[0] ??
        data?.latest ??
        null;
      if (!record) return null;

      const timestamp =
        record?.timestamp ??
        record?.time ??
        record?.Date ??
        record?.date ??
        "";

      const waveHeight =
        record?.waveHeight ??
        record?.wvht ??
        record?.Hsig ??
        record?.wave_height ??
        null;
      const dominantPeriod =
        record?.dominantPeriod ??
        record?.dpd ??
        record?.Tp ??
        null;
      const meanWaveDirection =
        record?.meanWaveDirection ??
        record?.mwd ??
        record?.Dp ??
        null;

      const windSpeed =
        record?.windSpeed ??
        record?.wspd ??
        record?.WindSp ??
        null;
      const windDirection =
        record?.windDirection ??
        record?.wdir ??
        record?.WindDir ??
        null;
      const windGust =
        record?.windGust ??
        record?.wgst ??
        record?.WindGust ??
        null;

      const waterTemperature =
        record?.waterTemperature ??
        record?.watertemp ??
        record?.wtp ??
        null;

      const airTemperature =
        record?.airTemperature ??
        record?.airt ??
        record?.atp ??
        null;

      const observation: WaveObservation = {
        timestamp: timestamp ?? "",
        waveHeight: waveHeight !== undefined ? Number(waveHeight) || null : null,
        dominantPeriod:
          dominantPeriod !== undefined ? Number(dominantPeriod) || null : null,
        averagePeriod: null,
        meanWaveDirection:
          meanWaveDirection !== undefined
            ? Number(meanWaveDirection) || null
            : null,
        windSpeed:
          windSpeed !== undefined ? Number(windSpeed) || null : null,
        windGust:
          windGust !== undefined ? Number(windGust) || null : null,
        windDirection:
          windDirection !== undefined
            ? Number(windDirection) || null
            : null,
        airTemperature:
          airTemperature !== undefined
            ? Number(airTemperature) || null
            : null,
        waterTemperature:
          waterTemperature !== undefined
            ? Number(waterTemperature) || null
            : null,
        source: this.label,
        providerId: stationId,
      };

      return observation;
    } catch (error) {
      console.warn("CDIP provider failed", stationId, error);
      return null;
    }
  },
};

const providers: WaveProvider[] = [cdipProvider, ndbcProvider];

export async function getCurrentWaveObservation(
  spot: Spot
): Promise<WaveObservation | null> {
  for (const provider of providers) {
    if (!provider.supports(spot)) continue;
    const result = await provider.getCurrent(spot);
    if (result) {
      return result;
    }
  }
  return null;
}


