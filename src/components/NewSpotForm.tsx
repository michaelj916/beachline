"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FiGlobe, FiPlus, FiShield } from "react-icons/fi";
import clsx from "clsx";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type FormState = {
  name: string;
  buoyId: string;
  lat: string;
  lng: string;
  isPublic: boolean;
};

const initialState: FormState = {
  name: "",
  buoyId: "",
  lat: "",
  lng: "",
  isPublic: true,
};

export default function NewSpotForm() {
  const { client, session } = useSupabase();
  const router = useRouter();
  const [state, setState] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const lat = state.lat ? Number(state.lat) : null;
      const lng = state.lng ? Number(state.lng) : null;

      const { error: insertError } = await client.from("spots").insert({
        name: state.name,
        buoy_id: state.buoyId.trim(),
        lat,
        lng,
        is_public: state.isPublic,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setState(initialState);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-sky-900/20"
    >
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <label className="grid gap-1 text-xs uppercase tracking-wide text-white/60">
          Spot name
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="Mavericks"
            required
            value={state.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs uppercase tracking-wide text-white/60">
          NDBC buoy ID
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="46012"
            required
            value={state.buoyId}
            onChange={(event) => update("buoyId", event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <label className="grid gap-1 text-xs uppercase tracking-wide text-white/60">
          Latitude (optional)
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="37.50"
            value={state.lat}
            onChange={(event) => update("lat", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs uppercase tracking-wide text-white/60">
          Longitude (optional)
          <input
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            placeholder="-122.50"
            value={state.lng}
            onChange={(event) => update("lng", event.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">
            {state.isPublic ? "Public spot" : "Private spot"}
          </p>
          <p className="text-xs text-white/60">
            {state.isPublic
              ? "Shared on the global feed."
              : "Only visible to you."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => update("isPublic", !state.isPublic)}
          className={clsx(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
            state.isPublic
              ? "bg-sky-500/20 text-sky-100 hover:bg-sky-500/30"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          {state.isPublic ? <FiGlobe aria-hidden /> : <FiShield aria-hidden />}
          Toggle
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FiPlus aria-hidden />
        {loading ? "Adding…" : "Add spot"}
      </button>
    </form>
  );
}

