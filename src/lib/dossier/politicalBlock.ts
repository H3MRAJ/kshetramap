import { readFile } from "fs/promises";
import path from "path";

import { classifyBoothStrength } from "@/lib/boothStrength";
import type { BoothCollection, BoothProps, Meta } from "@/lib/types";

/** One candidate row inside a `history/ac-series.json` year entry. */
type AcSeriesCandidate = {
  key: string;
  name: string;
  party: string;
  color: string;
  evm_votes: number;
  booths_won: number;
};

/** One year's row in `history/ac-series.json`'s `years[]` array. */
type AcSeriesYear = {
  year: number;
  electors_total: number | null;
  total_valid: number;
  grand_total: number;
  booth_count: number;
  winner_key: string;
  winner_name: string;
  winner_party: string;
  winner_votes: number;
  winner_share_pct: number;
  runner_up_key: string;
  runner_up_name: string;
  runner_up_votes: number;
  margin: number;
  focus_key: string;
  focus_name: string;
  focus_votes: number;
  focus_share_pct: number;
  candidates: AcSeriesCandidate[];
};

/** Shape of `history/ac-series.json` (Module-1 output, per-AC). */
type AcSeries = {
  ac_no: number;
  ac_name: string;
  focus_key: string;
  focus_name: string;
  years: AcSeriesYear[];
  narrative: string[];
};

export type PoliticalBlockYear = {
  year: number;
  winner_name: string;
  winner_party: string;
  winner_votes: number;
  winner_share_pct: number;
  runner_up_name: string;
  margin: number;
  total_valid: number;
  electors_total?: number;
};

export type PoliticalBlockFocusYear = {
  year: number;
  votes: number;
  share: number;
  on_ballot: boolean;
};

export type PoliticalBlockBoothSummary = {
  total_booths: number;
  strong: number;
  average: number;
  weak: number;
  /**
   * Booths with no usable share/valid-vote data (`classifyBoothStrength`'s
   * "na" tier — e.g. `total_valid` is 0). Not part of the B2 spec's literal
   * return shape, but included so `strong + average + weak + na ===
   * total_booths` always holds and callers never have to wonder where the
   * rest of the booths went. See task-3-report.md for the rationale.
   */
  na: number;
};

export type PoliticalBlock = {
  years: PoliticalBlockYear[];
  focus: {
    key: string;
    name: string;
    series: PoliticalBlockFocusYear[];
  };
  booth_summary: PoliticalBlockBoothSummary;
  narrative_seed: string | null;
};

/** The subset of `BoothProps` `summarizeBoothStrength` needs. */
export type BoothStrengthInput = Pick<BoothProps, "pct" | "winner_key" | "total_valid">;

/**
 * Pure aggregation: tiers every booth for `focusKey` via `classifyBoothStrength`
 * (same thresholds/logic `BoothMap.tsx` uses for its live strength counts —
 * see its `classifyBoothStrength` calls) and tallies tier counts. Extracted
 * from `getPoliticalBlock()` so the counting logic is unit-testable without
 * touching the filesystem.
 */
export function summarizeBoothStrength(
  booths: BoothStrengthInput[],
  focusKey: string
): PoliticalBlockBoothSummary {
  const summary: PoliticalBlockBoothSummary = {
    total_booths: booths.length,
    strong: 0,
    average: 0,
    weak: 0,
    na: 0,
  };
  for (const b of booths) {
    const share = b.pct[focusKey] ?? 0;
    const won = b.winner_key === focusKey;
    const tier = classifyBoothStrength(share, won, b.total_valid);
    summary[tier]++;
  }
  return summary;
}

/** Reads and JSON-parses a file, returning `null` (never throwing) if it's missing or unparsable. */
async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Assembles the "political history" computed block for an AC's dossier —
 * pure server-side read of Module-1's existing static JSON under
 * `public/data/ac-<ac>/`, no MongoDB, no HTTP fetch (mirrors `loadAc()` in
 * `web/src/app/ac/[acNo]/page.tsx`: `fs/promises` + `path.join(process.cwd(),
 * "public", "data", ...)`, graceful-missing-file handling via `.catch`).
 *
 * `booth_summary` is computed from `booths.geojson` — NOT `elections/*.json`
 * as the original spec text says. The controller verified this against the
 * real data files: `booths.geojson` already carries per-booth Form-20
 * results for the AC's current default election year in exactly the shape
 * `classifyBoothStrength()` expects, and it's the same file Module-1's live
 * map (`BoothMap.tsx`) already uses for the identical computation.
 *
 * Returns `null` (never throws) if `meta.json` or `history/ac-series.json`
 * are missing — same graceful-missing-data philosophy as `loadAc()`. A
 * missing/unreadable `booths.geojson` does NOT null out the whole block
 * (meta.json/ac-series.json are the "does this AC exist" signal); instead
 * `booth_summary` falls back to all-zero counts.
 */
export async function getPoliticalBlock(acNo: number): Promise<PoliticalBlock | null> {
  const dir = path.join(process.cwd(), "public", "data", `ac-${acNo}`);

  const [meta, series] = await Promise.all([
    readJson<Meta>(path.join(dir, "meta.json")),
    readJson<AcSeries>(path.join(dir, "history", "ac-series.json")),
  ]);

  if (!meta || !series) return null;

  const years: PoliticalBlockYear[] = series.years.map((y) => ({
    year: y.year,
    winner_name: y.winner_name,
    winner_party: y.winner_party,
    winner_votes: y.winner_votes,
    winner_share_pct: y.winner_share_pct,
    runner_up_name: y.runner_up_name,
    margin: y.margin,
    total_valid: y.total_valid,
    ...(y.electors_total != null ? { electors_total: y.electors_total } : {}),
  }));

  const focusKey = series.focus_key;
  const focusName = series.focus_name;
  const focusSeries: PoliticalBlockFocusYear[] = series.years.map((y) => {
    const onBallot = y.candidates.some((c) => c.key === focusKey);
    // Not on ballot this year (never happens for AC-178 today, but keep the
    // function correct for a future AC where the focus candidate skips a
    // contest): no votes/share to report.
    return {
      year: y.year,
      votes: onBallot ? y.focus_votes : 0,
      share: onBallot ? y.focus_share_pct : 0,
      on_ballot: onBallot,
    };
  });

  // booths.geojson is expected to exist alongside meta.json/ac-series.json
  // for every real AC (it's Module-1's core map data file), but is read with
  // the same graceful-missing philosophy rather than failing the whole block.
  const booths = await readJson<BoothCollection>(path.join(dir, "booths.geojson"));
  const boothSummary = booths
    ? summarizeBoothStrength(
        booths.features.map((f) => f.properties),
        focusKey
      )
    : { total_booths: 0, strong: 0, average: 0, weak: 0, na: 0 };

  const narrativeSeed = series.narrative && series.narrative.length > 0 ? series.narrative.join(" ") : null;

  return {
    years,
    focus: { key: focusKey, name: focusName, series: focusSeries },
    booth_summary: boothSummary,
    narrative_seed: narrativeSeed,
  };
}
