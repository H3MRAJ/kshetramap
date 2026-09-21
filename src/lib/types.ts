export type Candidate = {
  key: string;
  name: string;
  party: string;
  color: string;
  evm_votes: number;
  booths_won: number;
};

export type HeatBin = {
  label: string;
  min?: number;
  max?: number;
  color: string;
};

export type Meta = {
  election: { id: string; name: string; year: number };
  constituency: {
    ac_no: number;
    name: string;
    district: string;
    state: string;
    booth_count: number;
    pc_no?: number;
    pc_name?: string;
    bbox: {
      min_lng: number;
      min_lat: number;
      max_lng: number;
      max_lat: number;
    };
  };
  candidates: Candidate[];
  totals: {
    evm: {
      candidates: Record<string, number>;
      nota: number;
      total_valid: number;
      grand_total: number;
    };
    grand_including_postal: Record<string, number>;
  };
  modes: {
    winner: string;
    heat: { bins: HeatBin[] };
  };
  attribution: Record<string, string>;
  georef?: {
    method?: string;
    residuals_m?: { median_m?: number; mean_m?: number; rmse_m?: number };
    interpolated_booths?: number[];
  };
  /** Booth 1 intelligence demo (English roll + Form 20) */
  showcase?: {
    booth_no: number;
    title: string;
    subtitle: string;
    hint: string;
  };
  roll?: {
    title?: string;
    revision_type?: string;
    qualifying_date?: string;
    publication_date?: string;
    year?: number;
  };
  /** Years with Form 20 packages under elections/ */
  elections_available?: number[];
  history?: {
    ac_series?: string;
    booth_matches?: string;
    place_series?: string;
  };
};

export type BoothProps = {
  booth_no: number;
  name: string;
  nearest_place?: string | null;
  nearest_ps?: string | null;
  lat: number;
  lng: number;
  location_source: string;
  accuracy_note?: string | null;
  placement_note?: string | null;
  votes: Record<string, number>;
  pct: Record<string, number>;
  nota: number;
  rejected: number;
  total_valid: number;
  grand_total: number;
  tendered: number;
  winner_key: string;
  winner_name: string;
  winner_party: string;
  winner_color: string;
  winner_votes: number;
  winner_pct: number;
  margin: number;
  /** SIR / roll enrichment (English; Hindi locale later) */
  showcase?: boolean;
  ps_name?: string | null;
  ps_address?: string | null;
  village?: string | null;
  tehsil?: string | null;
  district?: string | null;
  pin?: string | null;
  post_office?: string | null;
  police_station_roll?: string | null;
  /** OCR parse confidence 0–100 when roll-enriched */
  roll_parse_confidence?: number | null;
  /** Geocode QA status without moving pin */
  location_qa?: string | null;
  geocode_shift_m?: number | null;
  police_station_note?: string | null;
  special_status?: string | null;
  electors_total?: number | null;
  electors_male?: number | null;
  electors_female?: number | null;
  electors_third_gender?: number | null;
  turnout_pct?: number | null;
  roll_year?: number | null;
  revision_type?: string | null;
  pc_no?: number | null;
  pc_name?: string | null;
  /** Active map election year (when historical overlay is applied) */
  election_year?: number | null;
  /** Join confidence for historical overlay */
  match_confidence?: "high" | "medium" | "low" | "unmatched" | null;
};

export type BoothFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: BoothProps;
};

export type BoothCollection = {
  type: "FeatureCollection";
  features: BoothFeature[];
};

/** Real landmark or place centroid for map labels / location search */
export type PlaceProps = {
  id: string;
  name: string;
  kind: "railway" | "town" | "village" | "place" | "booth_place" | string;
  source: string;
  booth_count?: number | null;
  nearest_ps?: string | null;
  booth_nos?: number[] | null;
};

export type PlaceFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: PlaceProps;
};

export type PlaceCollection = {
  type: "FeatureCollection";
  name?: string;
  description?: string;
  features: PlaceFeature[];
};

export type MapMode = "winner" | "heat" | "margin" | "strength";
export type BasemapId = "streets" | "light" | "dark" | "satellite";
export type StrengthFilter = "all" | "strong" | "average" | "weak";

export type MapSettings = {
  /** Multiplier for marker radius (0.5–2.5) */
  markerScale: number;
  /** Circle fill opacity 0.2–1 */
  markerOpacity: number;
  /** Show booth number labels on map */
  showLabels: boolean;
  /** Dim booths not won by selected member (winner mode) */
  highlightMemberWins: boolean;
  /** Only show booths where selected member won */
  onlyMemberWins: boolean;
  /** Min total_valid to show (0 = all) */
  minVotes: number;
  /** Fly-to zoom when jumping to booth */
  flyZoom: number;
  /** Show white halo under markers */
  showHalo: boolean;
  /** Color unverified/interp coords differently */
  flagUnverified: boolean;
  /** Show real place / landmark labels on map */
  showPlaces: boolean;
  /** When viewing historical year, hide booths with no Form 20 join */
  hideUnmatchedYear: boolean;
  /** Strength mode: share % ≥ this = strong (default 50) */
  strengthStrongMin: number;
  /** Strength mode: share % < this = weak (default 35) */
  strengthWeakMax: number;
  /** Strength mode: filter which tiers to show */
  strengthFilter: StrengthFilter;
  /** Colour place pins by area strength (mean booth share) */
  showAreaStrength: boolean;
};

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  markerScale: 1,
  markerOpacity: 0.92,
  showLabels: false,
  highlightMemberWins: false,
  onlyMemberWins: false,
  minVotes: 0,
  flyZoom: 14,
  showHalo: true,
  flagUnverified: false,
  showPlaces: true,
  hideUnmatchedYear: false,
  strengthStrongMin: 50,
  strengthWeakMax: 35,
  strengthFilter: "all",
  showAreaStrength: true,
};
