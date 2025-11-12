import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ExploreView = dynamic(() => import("@/components/ExploreView"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Explore — Surfwatch",
  description:
    "Browse the entire NOAA buoy network, find surf spots near you, and save recent searches in Surfwatch.",
};

export default function ExplorePage() {
  return <ExploreView />;
}

