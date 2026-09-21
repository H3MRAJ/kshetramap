"use client";

import { partyDisplayLabel } from "@/lib/partyMeta";

type Size = "xs" | "sm" | "md";

const sizeCls: Record<Size, string> = {
  xs: "text-[10px]",
  sm: "text-[11px]",
  md: "text-sm",
};

type Props = {
  party: string | null | undefined;
  size?: Size;
  className?: string;
  /** Kept for API compat — icons removed; no-op */
  logoOnly?: boolean;
  muted?: boolean;
};

/**
 * Party name only (icons removed — plain text).
 */
export function PartyLabel({
  party,
  size = "sm",
  className = "",
  logoOnly = false,
  muted = false,
}: Props) {
  const label = partyDisplayLabel(party);
  if (logoOnly) return null;

  return (
    <span
      className={`inline-flex max-w-full items-center font-medium ${sizeCls[size]} ${
        muted ? "text-zinc-400" : ""
      } ${className}`}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
