"use client";

import { useEffect, useState } from "react";
import { FiActivity } from "react-icons/fi";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Props = {
  buoy: string;
};

export default function LiveBadge({ buoy }: Props) {
  const { client } = useSupabase();
  const [live, setLive] = useState(false);

  useEffect(() => {
    const channel = client
      .channel(`buoy:${buoy}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "latest_obs",
          filter: `buoy_id=eq.${buoy}`,
        },
        () => setLive(true)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setLive(true);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [client, buoy]);

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
      <FiActivity aria-hidden className={live ? "animate-pulse" : undefined} />
      Live
    </span>
  );
}

