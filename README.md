## Surfwatch

Free, open-source Surfline alternative powered by Next.js 14, Supabase, NOAA NDBC data and community-generated spot metadata.

### Bootstrapping

```bash
npm install
npm run dev
```

Set the required environment variables (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The service role key is **only** used locally for seeding/updating buoy metadata; never expose it in the browser.

### Database

Run Supabase migrations:

```bash
supabase db push
```

This creates the `spots` table (seeded from NOAA), community extensions (`custom_spots`, `spot_reports`, `spot_reviews`, `spot_change_requests`, `spot_cams`) and a `provider_overrides` column that lets you wire non-NOAA providers such as CDIP, ECCC, or BOM on a per-spot basis.

### Seeding NOAA Stations

Download and upsert the full NOAA station catalog (falling back to `station_table.txt` when the JSON feed is offline):

```bash
npx tsx --env-file=.env.local scripts/seed-stations.ts
```

Re-run periodically (cron/GitHub Actions) to keep metadata fresh.

### Live Conditions Providers

Surfwatch pulls current observations from any free/open provider it knows about. Providers run in priority order until one returns data:

1. **CDIP (Coastal Data Information Program)** — supply a CDIP station ID via `spots.provider_overrides -> cdip.stationId`. Endpoint: `https://cdip.ucsd.edu/data_access/latest.php`.
2. **NOAA NDBC** — default for all US/territory buoys (latest observations + realtime archives).

The architecture is extensible. To add another free provider:

1. Extend `SpotProviderOverrides` in `src/lib/types.ts`.
2. Add a new provider in `src/lib/waveProviders.ts` that implements the `WaveProvider` interface (`supports`, `getCurrent`).
3. Populate overrides in Supabase (`update spots set provider_overrides = jsonb_build_object(...)`).

### Explore Map

The Explore view uses React-Leaflet (client only) with a global search powered by `/api/spots/search`. Searches accept `q`, `limit`, and optional `lat`/`lng` for distance sorting. Searching with `q=*` returns a worldwide list (capped at 500 results).

### Surf Spot Community Data

The Supabase schema supports:

- `custom_spots` for user-defined breaks (with moderation flags).
- `spot_reports` for daily condition posts.
- `spot_reviews` for ratings/comments.
- `spot_change_requests` for edit workflows.
- `spot_cams` for community-hosted streaming cameras.

All tables ship with RLS policies so authenticated users manage their own content while the public can browse approved data.

### Development Notes

- React Query Devtools is pre-configured (`npm run dev` → press `⌘`/`Ctrl` + `J`).
- Maps render only on the client to avoid SSR issues (`dynamic(() => import("./SpotMapClient"), { ssr: false })`).
- Wave/ wind cards use `getCurrentWaveObservation`, falling back to NOAA `realtime2`.

Happy building – contributions are welcome! 
