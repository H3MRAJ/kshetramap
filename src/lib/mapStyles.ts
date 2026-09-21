import type { BasemapId, HeatBin } from "./types";

export const BASEMAPS: Record<
  BasemapId,
  { label: string; style: string | object; attribution?: string }
> = {
  streets: {
    label: "Streets",
    // OpenFreeMap — free, no key
    style: "https://tiles.openfreemap.org/styles/liberty",
  },
  light: {
    label: "Light",
    style: {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        },
      },
      layers: [{ id: "carto", type: "raster", source: "carto" }],
    },
  },
  dark: {
    label: "Dark",
    style: {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        },
      },
      layers: [{ id: "carto", type: "raster", source: "carto" }],
    },
  },
  satellite: {
    label: "Satellite",
    style: {
      version: 8,
      // Esri only has high-res imagery up to a local max LOD. Beyond that it
      // returns grey tiles: "Map data not yet available" (common in rural Bihar).
      // maxzoom forces MapLibre to overscale the last good level instead.
      sources: {
        esri: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          // Native coverage is often ≤16–17 outside major cities; keep ≤16 for Mokama diyara
          minzoom: 0,
          maxzoom: 16,
          attribution:
            "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
      },
      layers: [
        {
          id: "esri",
          type: "raster",
          source: "esri",
          // Allow display while overscaling past maxzoom
          maxzoom: 22,
        },
      ],
    },
  },
};

export const HEAT_BINS: HeatBin[] = [
  { label: "Stronghold ≥50%", min: 50, color: "#14532d" },
  { label: "Strong 40–50%", min: 40, max: 50, color: "#16a34a" },
  { label: "Contested 30–40%", min: 30, max: 40, color: "#eab308" },
  { label: "Weak 20–30%", min: 20, max: 30, color: "#f97316" },
  { label: "Very weak <20%", max: 20, color: "#dc2626" },
];

/** MapLibre step expression for heat coloring from a property path. */
export function heatColorExpression(pctProp: string): unknown[] {
  // step on property: default (very weak), then breakpoints
  return [
    "step",
    ["coalesce", ["get", pctProp], 0],
    "#dc2626", // <20
    20,
    "#f97316",
    30,
    "#eab308",
    40,
    "#16a34a",
    50,
    "#14532d",
  ];
}

export function radiusExpression(scale = 1, pad = 0): unknown[] {
  // scale by total_valid: ~4–16 px, then * scale + pad
  return [
    "+",
    pad,
    [
      "*",
      scale,
      [
        "interpolate",
        ["linear"],
        ["sqrt", ["coalesce", ["get", "total_valid"], 0]],
        10,
        4,
        25,
        8,
        40,
        14,
      ],
    ],
  ];
}

/** Strong / average / weak from strength_tier property */
export function strengthColorExpression(): unknown[] {
  return [
    "match",
    ["get", "strength_tier"],
    "strong",
    "#16a34a",
    "average",
    "#eab308",
    "weak",
    "#dc2626",
    /* na / default */ "#94a3b8",
  ];
}

/** Win margin heat: low margin = contested (yellow), high = blowout (dark green) */
export function marginColorExpression(): unknown[] {
  return [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "margin"], 0],
    0,
    "#dc2626",
    25,
    "#f97316",
    50,
    "#eab308",
    100,
    "#84cc16",
    200,
    "#16a34a",
    400,
    "#14532d",
  ];
}
