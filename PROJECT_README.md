# KshetraMap

Booth-wise election result maps on real-world coordinates (MapLibre + OSM tiles).

**Pilot:** Mokama AC-178, Bihar Vidhan Sabha (Form 20: **2015 · 2020 · 2025**, map geometry 2025).

**Git:** private client repo `karmacodemeta/KshetraMap`, nested under `karmacodemeta/client-websites` (see `D:\KarmaCodeMeta\master\SUBMODULES.md`). The Next app is `web/`. Roll PDFs, OCR dumps, and booth WebPs stay on disk — they are not git.

See **`HANDOFF.md`** for current status and next steps; **`FUTURE.md`** for product vision.

## Quick start

```bash
# 1. Build data (Python)
pip install pandas openpyxl pymupdf numpy scipy
python scripts/extract_booth_labels.py
python scripts/georeference.py
python scripts/build_data.py
# copy data into the Next app
cp -r public/data web/public/

# 2. Run web app
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Mokama map.

## Data pipeline

| Script | Output |
|--------|--------|
| `scripts/load_booth_locations_excel.py` | Curated Map X/Y from `Mokama_Map_Booth_Locations.xlsx` → `booth_labels_pdf.json` + place metadata |
| `scripts/extract_booth_labels.py` | Fallback raw PDF text extract (legacy) |
| `scripts/georeference.py` | `data/booth_coords.json` — lat/lng via RBF/TPS GCPs |
| `scripts/snap_water_booths.py` | Snap points inside OSM water to nearest shore |
| `scripts/build_data.py` | `public/data/ac-178/{booths.geojson,meta.json,boundary.geojson}` |

See also **`FUTURE.md`** for product vision and roadmap.

Votes source: `Mokama_Booth_Wise_Votes_CORRECTED.xlsx` (verified against Form 20 totals).

Map source: `17604285459425.pdf` (NIC Mokameh 178 AC sheet, RF 1:77,000).

## Map features

- **Election year** — 2015 / 2020 / 2025 (default 2025); pins = 2025 locations
- **Winner / heat / margin** modes + member selector for that year
- **Location search** + place labels (stations, villages)
- **History workspace** — multi-year charts (AC / booth / place)
- **Basemaps** — streets / light / dark / satellite
- Drag booth (localStorage on static hosting)

## Accuracy note

Coordinates are georeferenced from the NIC PDF (not ECI portal pins). Typical error is on the order of hundreds of metres (see LOO stats in `data/booth_coords.json`). Fine for AC-scale zone visualization; not door-level navigation. Flag: `location_source` per booth (`pdf_tps` | `manual_interp` | `outlier_clamped` | `water_snapped`).

### Booths in water (Ganga)

Some points appeared mid-channel on OSM basemaps (see `in water.png`). Causes:

1. **PDF label offset** — booth numbers sit next to the symbol; along the river they often sit in the blue river fill on the NIC sheet.
2. **Georeference residual** — LOO median ~1 km; local warps can push bank booths north/east into the channel.
3. **OSM vs NIC** — OSM draws permanent water; some diyara/floodplain on the sheet is water in OSM.

**Mitigation in pipeline:** `scripts/snap_water_booths.py` detects points inside OSM water polygons and snaps each to the nearest land (~30–1200 m). Snapped booths are tagged `location_source=water_snapped`. This is a shore correction, not an ECI-pin fix — validate important riverside booths manually later.

## Project layout

```
KshetraMap/
  plan.txt
  scripts/           # Python data pipeline
  data/              # intermediate JSON (labels, coords, GCPs)
  public/data/       # built GeoJSON (source of truth)
  web/               # Next.js App Router + MapLibre
    public/data/     # served static copy
    src/components/  # BoothMap, Legend, popups, toggles
    src/app/ac/[acNo]
```

## Deploy

Do **not** `deploy:gh` to a standalone `kshetramap` Pages repo. Push `web/` to `karmacodemeta/KshetraMap`, then bump the `client-websites` submodule pointer (innermost first).

```bash
cd web && npm run build
```

## Roadmap (from plan.txt)

1. ✅ Coordinates (automated first pass; refine GCPs + ECI spot-check)
2. ✅ Data pipeline Excel → GeoJSON
3. ✅ Map MVP MapLibre winner + heat modes
4. ⬜ Voronoi zone layer, real DataMeet AC boundary, mobile polish
5. ⬜ Scale-out to 243 ACs + Supabase
