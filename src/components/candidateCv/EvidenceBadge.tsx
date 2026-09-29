import React from "react";
import type { EvidenceGrade } from "@/lib/candidateCv/types";

interface EvidenceBadgeProps {
  grade?: EvidenceGrade;
  demoLabel?: string;
  isNameplate?: boolean;
  className?: string;
}

export function EvidenceBadge({
  grade,
  demoLabel,
  isNameplate = false,
  className = "",
}: EvidenceBadgeProps) {
  // Nameplate law: strictly DEMO/FAKE or LIVE only — never MIXED
  if (isNameplate) {
    const isLive = demoLabel === "LIVE" || grade === "SOURCED";
    if (isLive) {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-sourced ${className}`}
        >
          LIVE
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-demo ${className}`}
      >
        DEMO/FAKE
      </span>
    );
  }

  // Row / record badges
  if (demoLabel === "DEMO/FAKE" || grade === "DEMO") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-demo ${className}`}
      >
        DEMO/FAKE
      </span>
    );
  }

  if (grade === "SOURCED-cited") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-sourced ${className}`}
      >
        SOURCED · cited
      </span>
    );
  }

  if (grade === "SOURCED-claim") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-sourced ${className}`}
      >
        SOURCED · claim
      </span>
    );
  }

  if (grade === "SOURCED") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-sourced ${className}`}
      >
        SOURCED
      </span>
    );
  }

  // Fallback if demoLabel is provided and not empty
  if (demoLabel) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium km-badge-demo ${className}`}
      >
        {demoLabel}
      </span>
    );
  }

  return null;
}
