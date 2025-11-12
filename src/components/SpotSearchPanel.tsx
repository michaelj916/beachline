"use client";

import { useCallback, useEffect, useState } from "react";
import { FiClock, FiSearch, FiX } from "react-icons/fi";
import clsx from "clsx";
import type { Spot } from "@/lib/types";
import { useSearchHistory } from "@/hooks/useSearchHistory";

type Props = {
  onResults: (spots: Spot[]) => void;
  onSelectSpot?: (spot: Spot) => void;
  initialQuery?: string;
  userLocation?: [number, number] | null;
  maxResults?: number;
};

export default function SpotSearchPanel({
  onResults,
  onSelectSpot,
  initialQuery = "",
  userLocation = null,
  maxResults = 200,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Spot[]>([]);
  const [truncated, setTruncated] = useState(false);
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();

  const hasResults = results.length > 0;
  const showHistory = !hasResults && history.length > 0 && !query;

  const fetchResults = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setResults([]);
        onResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("q", trimmed || "*");
        params.set("limit", String(maxResults));
        if (userLocation) {
          params.set("lat", String(userLocation[0]));
          params.set("lng", String(userLocation[1]));
        }
        const response = await fetch(`/api/spots/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }
        const payload = (await response.json()) as {
          spots: Spot[];
          meta?: { truncated?: boolean };
        };
        setResults(payload.spots);
        setTruncated(Boolean(payload.meta?.truncated));
        onResults(payload.spots);
        addSearch(trimmed);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [addSearch, onResults, maxResults, userLocation]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      fetchResults(query);
    },
    [fetchResults, query]
  );

  const handleHistoryClick = useCallback(
    (term: string) => {
      setQuery(term);
      fetchResults(term);
    },
    [fetchResults]
  );

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    }
  }, [initialQuery, fetchResults]);

  return (
    <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/30 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Search surf spots</h3>
          <p className="text-xs uppercase tracking-wide text-white/40">
            Enter a buoy number or station name
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs font-semibold uppercase tracking-wide text-white/40 transition hover:text-white/80"
          >
            Clear history
          </button>
        )}
      </header>

      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
      >
        <FiSearch aria-hidden className="text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="E.g. 46012 or Half Moon Bay"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              onResults([]);
            }}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <FiX aria-hidden />
          </button>
        )}
        <button
          type="submit"
          className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-sky-400"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {showHistory && (
        <div className="grid gap-2">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
            <FiClock aria-hidden />
            Recent searches
          </span>
          <div className="flex flex-wrap gap-2">
            {history.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleHistoryClick(term)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                {term}
                <FiX
                  aria-hidden
                  className="text-white/30 hover:text-white/70"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeSearch(term);
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {hasResults && (
        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-wide text-white/40">
            {results.length} results
          </p>
          {truncated && (
            <p className="text-xs text-white/50">
              Showing first {results.length} matches. Refine your search to narrow results.
            </p>
          )}
          <div className="grid gap-2">
            {results.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => onSelectSpot?.(spot)}
                className={clsx(
                  "rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-sky-300/60 hover:text-sky-100",
                  !onSelectSpot && "cursor-default"
                )}
              >
                <div className="text-sm font-semibold text-white">
                  {spot.name}
                </div>
                <div className="text-xs text-white/60">Buoy {spot.buoy_id}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

