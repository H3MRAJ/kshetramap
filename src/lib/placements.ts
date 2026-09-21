/**
 * Authoritative booth placements (the "one location task").
 *
 * Operators place/confirm each booth's pin against the ECI page-2 Google-map
 * annex. Confirmed placements are the source of truth (location_source =
 * "eci_annex"). Stored in localStorage here; `Export` downloads a JSON that
 * `scripts/apply_placements.py` merges into booths.geojson.
 *
 * This is separate from `boothOverrides` (personal, non-authoritative previews).
 */

export type PlacementSource = "eci_annex" | "mappls_suggest" | "manual";

export type Placement = {
  booth_no: number;
  lat: number;
  lng: number;
  source: PlacementSource;
  confidence: "high" | "medium" | "low";
  note?: string;
  updated_at: string;
};

const key = (acNo: number) => `kshetramap-placements-${acNo}`;

export function loadPlacements(acNo: number): Record<number, Placement> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key(acNo)) || "{}");
  } catch {
    return {};
  }
}

export function savePlacement(acNo: number, p: Placement): Record<number, Placement> {
  const all = loadPlacements(acNo);
  all[p.booth_no] = { ...p, updated_at: new Date().toISOString() };
  window.localStorage.setItem(key(acNo), JSON.stringify(all));
  return all;
}

export function removePlacement(acNo: number, boothNo: number): Record<number, Placement> {
  const all = loadPlacements(acNo);
  delete all[boothNo];
  window.localStorage.setItem(key(acNo), JSON.stringify(all));
  return all;
}

/** Download all confirmed placements as JSON for scripts/apply_placements.py. */
export function exportPlacements(acNo: number): void {
  const all = loadPlacements(acNo);
  const payload = {
    ac_no: acNo,
    exported_at: new Date().toISOString(),
    count: Object.keys(all).length,
    placements: all,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booth_placements_ac-${acNo}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Mappls suggestions produced offline by scripts/geocode_mappls.py.
 * The workspace pre-positions each booth's pin from this file; the operator then
 * verifies against the ECI annex and saves. (Live browser calls to Mappls are
 * blocked by CORS and its geocode returns an eLoc, not lat/lng — so we geocode
 * server-side in bulk instead.)
 */
export type MapplsSuggestion = {
  lat: number | null;
  lng: number | null;
  confidence?: number | null;
  geocode_level?: string | null;
  formatted?: string | null;
  in_envelope?: boolean;
};

const suggestionCache: Record<number, Promise<Record<string, MapplsSuggestion>>> = {};

export function loadSuggestions(
  acNo: number,
  basePath: string
): Promise<Record<string, MapplsSuggestion>> {
  if (!suggestionCache[acNo]) {
    const url = `${basePath}/booth_assets/ac-${acNo}/mappls_suggestions.json`;
    suggestionCache[acNo] = fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return suggestionCache[acNo];
}
