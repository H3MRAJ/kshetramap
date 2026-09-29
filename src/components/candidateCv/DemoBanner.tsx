import React from "react";
import type { CandidateCvMeta } from "@/lib/candidateCv/types";

interface DemoBannerProps {
  meta: CandidateCvMeta;
  showBanner?: boolean;
}

export function DemoBanner({ meta, showBanner = true }: DemoBannerProps) {
  if (!showBanner && meta.demoLabel !== "DEMO/FAKE") {
    return null;
  }

  const message =
    meta.banner ||
    `DEMO/FAKE SHOWCASE — works, agenda & plan synthetic where noted; elections SOURCED. asOf ${meta.asOf} · ${meta.constituency}`;

  return (
    <header
      role="status"
      aria-live="polite"
      className="km-demo-banner sticky top-0 z-50 w-full shadow-sm px-4 select-none text-center"
    >
      <p className="truncate text-xs md:text-sm font-medium tracking-wide">
        {message}
      </p>
    </header>
  );
}
