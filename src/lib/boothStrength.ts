/**
 * Strong / average / weak classification for a focus candidate.
 * Used for booth colour coding and place (area) aggregates.
 */

export type StrengthTier = "strong" | "average" | "weak" | "na";

export type StrengthThresholds = {
  /** Share % ≥ this → strong (if also won, or always if win required) */
  strongMin: number;
  /** Share % < this → weak */
  weakMax: number;
  /** Strong requires winning the booth (default true) */
  strongRequiresWin: boolean;
};

export const DEFAULT_STRENGTH_THRESHOLDS: StrengthThresholds = {
  strongMin: 50,
  weakMax: 35,
  strongRequiresWin: true,
};

export const STRENGTH_COLORS: Record<StrengthTier, string> = {
  strong: "#16a34a",
  average: "#eab308",
  weak: "#dc2626",
  na: "#94a3b8",
};

export const STRENGTH_LABELS: Record<StrengthTier, string> = {
  strong: "Strong",
  average: "Contest",
  weak: "Weak",
  na: "N/A",
};

/**
 * Classify a booth for the focus candidate.
 * - Strong: share ≥ strongMin (and win if required)
 * - Weak: share < weakMax OR lost when share is middling
 * - Average: between weakMax and strongMin
 * - N/A: no valid votes / unmatched historical
 */
export function classifyBoothStrength(
  focusSharePct: number,
  focusWon: boolean,
  totalValid: number,
  thresholds: StrengthThresholds = DEFAULT_STRENGTH_THRESHOLDS
): StrengthTier {
  if (!totalValid || totalValid <= 0 || Number.isNaN(focusSharePct)) {
    return "na";
  }

  const { strongMin, weakMax, strongRequiresWin } = thresholds;

  if (focusSharePct >= strongMin && (!strongRequiresWin || focusWon)) {
    return "strong";
  }

  // Lost with low share, or any share below weak floor
  if (focusSharePct < weakMax) {
    return "weak";
  }

  // Lost but above weak floor → still weak (not a stronghold)
  if (!focusWon && focusSharePct < strongMin) {
    return "weak";
  }

  return "average";
}

export function strengthColor(tier: StrengthTier): string {
  return STRENGTH_COLORS[tier];
}

/** Mean focus share → place/area tier (same thresholds; win not required). */
export function classifyAreaStrength(
  meanSharePct: number,
  boothCount: number,
  thresholds: StrengthThresholds = DEFAULT_STRENGTH_THRESHOLDS
): StrengthTier {
  if (!boothCount || Number.isNaN(meanSharePct)) return "na";
  if (meanSharePct >= thresholds.strongMin) return "strong";
  if (meanSharePct < thresholds.weakMax) return "weak";
  return "average";
}

export type PlaceBoothInput = {
  boothNo: number;
  focusShare: number;
  focusVotes: number;
  totalValid: number;
  focusWon: boolean;
};

export type PlaceStrengthResult = {
  tier: StrengthTier;
  meanShare: number;
  totalFocusVotes: number;
  totalValid: number;
  strong: number;
  average: number;
  weak: number;
  na: number;
  n: number;
  /** Booth numbers in this place (for “combination” lists) */
  boothNos: number[];
  strongBooths: number[];
  averageBooths: number[];
  weakBooths: number[];
  /** Plain-language one-liner for candidates */
  plainLabel: string;
};

/**
 * Aggregate booths in a place: mean focus share among booths with data.
 */
export function aggregatePlaceStrength(
  booths: PlaceBoothInput[],
  thresholds: StrengthThresholds = DEFAULT_STRENGTH_THRESHOLDS
): PlaceStrengthResult {
  let strong = 0;
  let average = 0;
  let weak = 0;
  let na = 0;
  let shareSum = 0;
  let nShare = 0;
  let totalFocusVotes = 0;
  let totalValid = 0;
  const boothNos: number[] = [];
  const strongBooths: number[] = [];
  const averageBooths: number[] = [];
  const weakBooths: number[] = [];

  for (const b of booths) {
    boothNos.push(b.boothNo);
    totalFocusVotes += b.focusVotes || 0;
    totalValid += b.totalValid || 0;
    const t = classifyBoothStrength(
      b.focusShare,
      b.focusWon,
      b.totalValid,
      thresholds
    );
    if (t === "strong") {
      strong++;
      strongBooths.push(b.boothNo);
    } else if (t === "average") {
      average++;
      averageBooths.push(b.boothNo);
    } else if (t === "weak") {
      weak++;
      weakBooths.push(b.boothNo);
    } else na++;
    if (t !== "na" && b.totalValid > 0) {
      shareSum += b.focusShare;
      nShare++;
    }
  }

  const meanShare = nShare ? shareSum / nShare : 0;
  const tier = classifyAreaStrength(meanShare, nShare, thresholds);
  const meanR = Math.round(meanShare * 10) / 10;

  // English fallback only; UI should call placePlainLabel() with t() for i18n
  let plainLabel = "Not enough data";
  if (tier === "strong") {
    plainLabel = `Your strong area · ~${meanR}% share · hold & expand`;
  } else if (tier === "average") {
    plainLabel = `Contest area · ~${meanR}% share · can go either way`;
  } else if (tier === "weak") {
    plainLabel = `Your weak area · ~${meanR}% share · needs work`;
  }

  return {
    tier,
    meanShare: meanR,
    totalFocusVotes,
    totalValid,
    strong,
    average,
    weak,
    na,
    n: booths.length,
    boothNos: boothNos.sort((a, b) => a - b),
    strongBooths: strongBooths.sort((a, b) => a - b),
    averageBooths: averageBooths.sort((a, b) => a - b),
    weakBooths: weakBooths.sort((a, b) => a - b),
    plainLabel,
  };
}

type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>
) => string;

/** Localised one-line strength rules for candidates */
export function strengthRulesPlain(
  thresholds: StrengthThresholds,
  t?: TranslateFn
): string {
  if (t) {
    return t("strengthUi.rules", {
      strongMin: thresholds.strongMin,
      weakMax: thresholds.weakMax,
    });
  }
  return `Strong booth = you won with ≥${thresholds.strongMin}% share. Weak = under ${thresholds.weakMax}% or you lost. Average = in between. Area = average of its booths.`;
}

/** Localised place strength one-liner */
export function placePlainLabel(
  tier: StrengthTier,
  meanShare: number,
  t: TranslateFn
): string {
  if (tier === "strong") {
    return t("strengthUi.areaStrong", { pct: meanShare });
  }
  if (tier === "average") {
    return t("strengthUi.areaContest", { pct: meanShare });
  }
  if (tier === "weak") {
    return t("strengthUi.areaWeak", { pct: meanShare });
  }
  return t("strengthUi.areaNoData");
}

export type AreaListItem = PlaceStrengthResult & { place: string };
