"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiBookmark, FiCheck } from "react-icons/fi";
import clsx from "clsx";
import { useSavedSpots } from "@/hooks/useSavedSpots";

type Props = {
  spotId: string;
  initialSaved?: boolean;
  size?: "sm" | "md";
};

export default function SpotSaveButton({
  spotId,
  initialSaved = false,
  size = "md",
}: Props) {
  const [optimisticSaved, setOptimisticSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const { savedSpotIds, toggleSpot, session } = useSavedSpots();
  const router = useRouter();
  const pathname = usePathname();

  const derivedSaved = useMemo(() => {
    if (!session) return initialSaved;
    return savedSpotIds.includes(spotId);
  }, [initialSaved, savedSpotIds, session, spotId]);

  useEffect(() => {
    setOptimisticSaved(derivedSaved);
  }, [derivedSaved]);

  const handleClick = async () => {
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const nextValue = !optimisticSaved;
    setOptimisticSaved(nextValue);
    setPending(true);
    try {
      await toggleSpot(spotId, nextValue);
    } catch (error) {
      console.error(error);
      setOptimisticSaved(!nextValue);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
        optimisticSaved
          ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
          : "border-white/10 bg-white/5 text-white/70 hover:border-sky-300/60 hover:text-sky-100",
        pending && "opacity-70",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1"
      )}
    >
      {optimisticSaved ? (
        <>
          <FiCheck aria-hidden />
          Saved
        </>
      ) : (
        <>
          <FiBookmark aria-hidden />
          Save spot
        </>
      )}
    </button>
  );
}


