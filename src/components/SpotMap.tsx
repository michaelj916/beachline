import dynamic from "next/dynamic";
import type { Spot } from "@/lib/types";

const SpotMapClient = dynamic(() => import("./SpotMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-white/60">
      Loading map…
    </div>
  ),
});

type Props = {
  spot: Pick<Spot, "lat" | "lng" | "name">;
};

export default function SpotMap(props: Props) {
  return <SpotMapClient {...props} />;
}

