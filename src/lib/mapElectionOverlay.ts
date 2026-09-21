import type { BoothProps, Candidate } from "./types";
import type {
  BoothMatches,
  ElectionPackage,
  HistoryCandidate,
  MatchConfidence,
} from "./historyTypes";
import { mergeBoothRows } from "./boothMatch";
import { isAcLevelOnlyYear } from "./yearJoinPolicy";

const UNMATCHED_COLOR = "#94a3b8";

export function candidatesFromPackage(
  pkg: ElectionPackage | null | undefined,
  fallback: Candidate[] = []
): Candidate[] {
  if (!pkg?.candidates?.length) return fallback;
  return pkg.candidates.map((c: HistoryCandidate) => ({
    key: c.key,
    name: c.name,
    party: c.party,
    color: c.color,
    evm_votes: c.evm_votes,
    booths_won: c.booths_won ?? 0,
  }));
}

/**
 * Overlay historical Form 20 votes onto a 2025 geometry booth pin.
 * Pins always keep 2025 lat/lng; votes/winner come from selected year.
 */
export function overlayBoothForYear(
  base: BoothProps,
  year: number,
  pkg: ElectionPackage | null | undefined,
  matches: BoothMatches | null | undefined
): BoothProps {
  // Native 2025 geojson is authoritative for latest year
  if (year === 2025 || !pkg) {
    return {
      ...base,
      election_year: 2025,
      match_confidence: "high" as MatchConfidence,
    };
  }

  // Strip 2025-only roll/showcase fields so historical years don't show
  // SIR electors/turnout mixed with another year's Form 20 votes.
  const geoOnly: BoothProps = {
    ...base,
    showcase: false,
    electors_total: null,
    electors_male: null,
    electors_female: null,
    electors_third_gender: null,
    turnout_pct: null,
    roll_year: null,
    revision_type: null,
    ps_name: null,
    ps_address: null,
    village: null,
    tehsil: null,
    pin: null,
    post_office: null,
    police_station_roll: null,
    police_station_note: null,
    special_status: null,
  };

  /**
   * G3: 2015 serial join is only low/unmatched — do not paint booth-level
   * winners from a guess. Keep geometry; clear Form 20 booth overlay.
   * AC-level 2015 still available in History overview.
   */
  if (isAcLevelOnlyYear(year)) {
    return {
      ...geoOnly,
      nearest_place: base.nearest_place,
      nearest_ps: base.nearest_ps,
      name: `Booth ${base.booth_no}`,
      votes: {},
      pct: {},
      nota: 0,
      rejected: 0,
      total_valid: 0,
      grand_total: 0,
      winner_key: "",
      winner_name: `${year}: totals only`,
      winner_party: "",
      winner_color: UNMATCHED_COLOR,
      winner_votes: 0,
      winner_pct: 0,
      margin: 0,
      election_year: year,
      match_confidence: "unmatched",
      accuracy_note: `${year}: booth-level result not shown — see History for constituency totals`,
    };
  }

  const entry = matches?.matches.find((m) => m.booth_no_2025 === base.booth_no);
  const ym = entry?.by_year[String(year)];

  if (!ym || ym.confidence === "unmatched" || !ym.keys?.length) {
    return {
      ...geoOnly,
      votes: {},
      pct: {},
      nota: 0,
      rejected: 0,
      total_valid: 0,
      grand_total: 0,
      winner_key: "",
      winner_name: "No match for this year",
      winner_party: "",
      winner_color: UNMATCHED_COLOR,
      winner_votes: 0,
      winner_pct: 0,
      margin: 0,
      election_year: year,
      match_confidence: "unmatched",
      accuracy_note: `${year}: no reliable booth match for this pin`,
    };
  }

  const row = mergeBoothRows(pkg, ym.keys);
  if (!row) {
    return {
      ...geoOnly,
      votes: {},
      pct: {},
      total_valid: 0,
      winner_key: "",
      winner_name: "No match for this year",
      winner_color: UNMATCHED_COLOR,
      winner_votes: 0,
      winner_pct: 0,
      margin: 0,
      election_year: year,
      match_confidence: "unmatched",
    };
  }

  const colorByKey = new Map(pkg.candidates.map((c) => [c.key, c.color]));
  const nameByKey = new Map(pkg.candidates.map((c) => [c.key, c.name]));
  const partyByKey = new Map(pkg.candidates.map((c) => [c.key, c.party]));

  const total = row.total_valid || 1;
  const pct: Record<string, number> = {};
  for (const [k, v] of Object.entries(row.votes)) {
    pct[k] = Math.round((10000 * v) / total) / 100;
  }

  const wColor = colorByKey.get(row.winner_key) || UNMATCHED_COLOR;
  const wParty = partyByKey.get(row.winner_key) || "";
  const wName =
    nameByKey.get(row.winner_key) || row.winner_name || row.winner_key;

  return {
    ...geoOnly,
    // Keep place names for map search (from 2025 placement sheet)
    nearest_place: base.nearest_place,
    nearest_ps: base.nearest_ps,
    name: `Booth ${base.booth_no}`,
    votes: row.votes,
    pct,
    nota: row.nota,
    rejected: row.rejected,
    total_valid: row.total_valid,
    grand_total: row.grand_total,
    winner_key: row.winner_key,
    winner_name: wName,
    winner_party: wParty,
    winner_color: wColor,
    winner_votes: row.winner_votes,
    winner_pct: pct[row.winner_key] ?? 0,
    margin: row.margin,
    election_year: year,
    match_confidence: ym.confidence,
    accuracy_note:
      ym.confidence === "low"
        ? `${year}: approximate booth match`
        : ym.confidence === "medium"
          ? `${year}: combined booth match`
          : `${year} results on current map location`,
  };
}

export function buildYearBoothIndex(
  bases: Iterable<BoothProps>,
  year: number,
  pkg: ElectionPackage | null | undefined,
  matches: BoothMatches | null | undefined
): Map<number, BoothProps> {
  const m = new Map<number, BoothProps>();
  for (const b of bases) {
    m.set(b.booth_no, overlayBoothForYear(b, year, pkg, matches));
  }
  return m;
}
