export type HistoryCandidate = {
  key: string;
  name: string;
  party: string;
  color: string;
  evm_votes: number;
  /** Grand total including postal when available */
  grand_votes?: number;
  booths_won?: number;
};

export type HistoryBoothRow = {
  booth_key: string;
  booth_no: number;
  suffix: string | null;
  votes: Record<string, number>;
  nota: number;
  rejected: number;
  total_valid: number;
  grand_total: number;
  winner_key: string;
  winner_name: string;
  winner_votes: number;
  margin: number;
};

export type ElectionPackage = {
  year: number;
  election_id: string;
  name: string;
  ac_no: number;
  ac_name: string;
  source: { file: string; url?: string | null };
  electors_total: number | null;
  candidates: HistoryCandidate[];
  booths: HistoryBoothRow[];
  totals: {
    candidates: Record<string, number>;
    nota: number;
    rejected: number;
    total_valid: number;
    grand_total: number;
  };
  booth_count: number;
  verification?: Record<string, unknown>;
};

export type AcSeriesYear = {
  year: number;
  election_id: string;
  name: string;
  electors_total: number | null;
  total_valid: number;
  grand_total: number;
  nota: number;
  booth_count: number;
  winner_key: string;
  winner_name: string;
  winner_party: string;
  winner_votes: number;
  winner_share_pct: number;
  runner_up_key: string | null;
  runner_up_name: string | null;
  runner_up_votes: number;
  margin: number;
  /** Continuous focus candidate (Anant) when present */
  focus_key: string;
  focus_name: string;
  focus_votes: number;
  focus_share_pct: number;
  candidates: HistoryCandidate[];
};

export type AcSeries = {
  ac_no: number;
  ac_name: string;
  focus_key: string;
  focus_name: string;
  years: AcSeriesYear[];
  narrative: string[];
};

export type MatchConfidence = "high" | "medium" | "low" | "unmatched";

export type BoothYearMatch = {
  keys: string[];
  rule: string;
  confidence: MatchConfidence;
};

export type BoothMatchEntry = {
  booth_no_2025: number;
  nearest_place?: string | null;
  nearest_ps?: string | null;
  by_year: Record<string, BoothYearMatch>;
};

export type BoothMatches = {
  geometry_year: number;
  notes: string;
  matches: BoothMatchEntry[];
};

export type PlaceYearStats = {
  year: number;
  total_valid: number;
  focus_votes: number;
  focus_share_pct: number;
  booth_count: number;
  matched_booth_count: number;
};

export type PlaceSeriesEntry = {
  place: string;
  booth_nos_2025: number[];
  years: PlaceYearStats[];
  swing_2020_2025_pp: number | null;
  swing_2015_2025_pp: number | null;
};

export type PlaceSeries = {
  ac_no: number;
  focus_key: string;
  places: PlaceSeriesEntry[];
};
