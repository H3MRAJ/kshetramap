"use client";

import dynamic from "next/dynamic";
import type { BoothCollection, Meta } from "@/lib/types";

const PlacementWorkspace = dynamic(
  () => import("./PlacementWorkspace").then((m) => m.PlacementWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        Loading placement workspace…
      </div>
    ),
  }
);

export default function PlacementLoader(props: {
  meta: Meta;
  booths: BoothCollection;
  manifest: Record<string, string[]>;
}) {
  return <PlacementWorkspace {...props} />;
}
