"use client";

import dynamic from "next/dynamic";
import type { BoothCollection, Meta, PlaceCollection } from "@/lib/types";

const BoothMap = dynamic(() => import("@/components/BoothMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-950">
      Loading map…
    </div>
  ),
});

type Props = {
  meta: Meta;
  booths: BoothCollection;
  places?: PlaceCollection | null;
  boundary?: GeoJSON.Feature | GeoJSON.FeatureCollection | null;
};

export default function BoothMapLoader({
  meta,
  booths,
  places,
  boundary,
}: Props) {
  return (
    <BoothMap
      meta={meta}
      booths={booths}
      places={places ?? undefined}
      boundary={boundary ?? undefined}
    />
  );
}
