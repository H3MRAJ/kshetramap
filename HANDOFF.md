# KshetraMap — session handoff (2026-08-06)

## Module 2 — Leader's Dossier (Phase B: Constituency Profile + Dossier + PDF) — 2026-08-06

**Status:** Phase B complete, reviewed (11 tasks, each per-task + a final whole-branch review with one fix wave), merged to `master` locally. Not pushed to GitHub. Full spec: `SONNET5_MODULE2_PHASE_B_C.md` (hand-briefed task-by-task, no separate plan doc — see `web/BUILD_NOTES.md`'s "Phase B" section for the full deviation log). Phase C (candidates + field logging) is documented in the same spec file but **not started**.

**What it adds on top of Phase A:** a MongoDB-backed, deep-merge, audit-diffable constituency profile (`/app/profile/[ac]`, 5 tabs: Snapshot/Social/Economic/Political/Brief) with source-required fact validation, and — the centerpiece — the dossier itself (`/ac/[acNo]/dossier`): a genuinely server-rendered, Hindi-default, six-section leadership-briefing document with a consistent numbered source-citation system, print CSS, one-click "Download PDF", and graceful map handling. Reachable from `/app`'s new "Your constituencies" dashboard section and from a "Dossier" tab in the existing Map/History nav (hidden on the public static site, where it doesn't exist).

```powershell
cd web
npm install
npm run seed:admin                 # idempotent — first super_admin from web/.env.local
npx tsx --env-file=.env.local scripts/seed-demo-profile.ts   # demo:true AC-178 profile content
npm run dev                        # → http://localhost:3000/login
```

**New screens:**
| Route | Who | What |
|---|---|---|
| `/app/profile/[ac]` | admin+ (AC-scoped) | 5-tab profile editor, per-section save, source-required gate |
| `/ac/[ac]/dossier` | viewer+ (AC-scoped) | The dossier — Cover/Snapshot/Social/Economic/Political/Sources, print-ready |

**Known gaps (intentionally deferred, tracked for Phase C):**
- 2026-08-08: found + fixed a real gap — the `/app` dashboard's "Your constituencies" section only listed `ac_scope`, so `super_admin` (whose seeded account has an empty `ac_scope: []`, since super_admin bypasses scope checks everywhere else) saw no constituency links at all — the only way in was hand-typing `/app/profile/178`. Fixed in `web/src/app/app/page.tsx`: `super_admin` now sees every AC that actually exists (discovered from `public/data/ac-*`, same source `/api/acs` uses) instead of an empty scope list; `admin` still sees only their real `ac_scope`. Fixed, pending your confirmation before commit.
- JWT sessions still aren't re-validated after login (Phase A gap, unaddressed in Phase B — **must fix before Phase C** gives field workers real accounts needing real offboarding).
- `/app`'s original layout/dashboard header text is still English-only even in Hindi mode (Phase A gap; the *new* Phase B dashboard section and the whole dossier ARE properly bilingual, this is only the pre-existing shell chrome).
- Vote-share trend chart is deliberately hidden in print/PDF (Recharts doesn't print reliably) — human-approved deviation from the spec's literal "charts visible in color" acceptance wording.
- Hand-maintained (not automated) dark-mode print-override class list in `web/src/app/globals.css` — a new `dark:` class added to any dossier section later needs a matching print override or it'll silently stay dark-styled in print.
- `dossier-map.png` generation script (`scripts/render_dossier_map.py`) was explicitly left unbuilt — spec marks it optional; the graceful "no map" path is what's actually live today.
- A handful of English-only sub-fields (`institutions[].note`, `projects[].note`, `key_leaders[].role`, etc.) have no `_hi` counterpart in the schema — a schema limitation, not a bug, worth revisiting before heavy real-world curation.

## Git / live

| | |
|--|--|
| **Client repo** | `karmacodemeta/KshetraMap` (private) — the Next app in `web/` |
| **Index** | submodule of `karmacodemeta/client-websites` → `karmacodemeta/master` |
| **Do not** | recreate `karmacodemeta/kshetramap` or force-push `gh-pages` with booth WebPs / PDFs |

Local: `cd web && npm run dev` → http://localhost:3000

Old GitHub Pages URLs (`karmacodemeta.github.io/kshetramap`) died when the lowercase repo was deleted. Hosting is local / Vercel under Karma Code Meta, not that Pages site.

---

## Do we have coordinates?

### Short answer

| What | Have it? | Source |
|------|----------|--------|
| **Map pin lat/lng for every booth** | **Yes (342)** | NIC PDF georef + corridor / water / manual / drag |
| **PS name / village / PIN from electoral roll** | **Yes (342 parsed)** | SIR 2025 page-1 EasyOCR (CPU+CUDA) |
| **New GPS from OCR alone** | **No** | OCR is identity, not GPS |
| **Geocode-improved pins applied to map** | **No (by design)** | Snap review off; `apply_coords=false` |
| **MongoDB authentic store** | **Yes (local)** | DB `kshetramap` · coords ≠ OCR |

### Trusted stores (split)

| Need | Store |
|------|--------|
| **GPS / lat-lng** | **Map geometry pipeline** → Mongo `booths.location` (tiers 1–4) |
| **Names / PIN** | **SIR roll OCR** → Mongo `booths.identity` |
| **Votes** | **Form 20** → Mongo `booths.form20` |
| **Not trusted as GPS** | Blind OSM Nominatim batch, OCR text |

```powershell
python scripts/mongo/seed_authentic_booths.py --ac 178
python scripts/mongo/verify_mongo.py --ac 178
# DB: mongodb://127.0.0.1:27017 / kshetramap
# Docs: docs/MONGODB_AUTHENTIC_DATA.md
```

**Location sources on map (unchanged after roll run):**

| source | count |
|--------|------:|
| pdf_tps | 236 |
| local_corridor_affine | 53 |
| nh33_rd_anchor | 21 |
| water_snapped | 11 |
| manual_interp | 9 |
| outlier_clamped | 7 |
| user_drag | 5 |

**Honesty for clients / Bihar scale:**  
“We plot booths at **map-derived coordinates** and attach **roll names + PIN**. We do **not** auto-claim ECI building GPS until snap/ECI/manual.”

See: `docs/ROLL_TO_LATLNG_FLOW.md`, `docs/BIHAR_AC_PIPELINE_LOG.md`

---

## Product state (Mokama AC-178 pilot)

### Map (`/ac/178/`)
- MapLibre pins · modes winner / heat / margin / **My areas (strength)**
- Year switcher 2015 | 2020 | 2025 (geometry stays 2025; votes overlay)
- **Deep location search** — school (roll), village, PIN, tehsil, police, booth #, landmarks
- My areas panel (desktop side / mobile sheet) · shareable URLs
- **Drag booth** → personal preview only (`localStorage`); never authentic geojson/Mongo. Server may queue `pending_review` for future admin · no party logos

### History (`/ac/178/history/`)
- Overview | Booth | Place · multi-year charts · deep links

### Multi-year join (honest)
| Year | Form 20 | Join to 2025 pin |
|------|---------|------------------|
| 2025 | 1–342 | Identity |
| 2020 | ~408 (`1(A)`…) | base+A merge · medium |
| 2015 | ~244 | serial · **low** |

Booth numbers are **not** stable across years.

### Parties (curated; not on Form 20)
| Year | Anant |
|------|--------|
| 2015 | Independent |
| 2020 | RJD |
| 2025 | JD(U) |

---

## Roll pipeline status (AC-178) — 2026-07-18

### Completed
- [x] Page-1 OCR **all 342** SIR parts  
  - CPU ~1–110 · CUDA (RTX 3080, `.venv-cuda`) 111–342  
- [x] English fields applied to **booth-master** + geojson **text only**  
- [x] Pin fingerprint verify: **0 moves**  
- [x] Votes still present on all 342 features  

### Quality (approx.)
| Metric | Value |
|--------|------:|
| Parse files | 342/342 |
| Usable PS name (not bare “School”) | ~82% |
| PIN present | 100% |
| Village / tehsil in parse | 100% |
| Electors male/female/total from OCR | **0%** (parser gap) |
| Geocode snaps applied | **0** |

### Safe commands
```powershell
# CUDA OCR (isolated venv — do not replace system torch)
.\.venv-cuda\Scripts\python.exe -u scripts/roll_location_flow.py --parts 201-342 --skip-geocode --no-apply

# Text enrich only (default: pins locked)
.\.venv-cuda\Scripts\python.exe -u scripts/roll_location_flow.py --apply-only

# NEVER without reviewing snaps:
# ... --apply-coords
```

### Outputs
| Path | Role |
|------|------|
| `data/roll_parse/part-*.json` | Per-booth OCR + English |
| `data/roll_page1_png/` | Page-1 renders |
| `data/backups/*` | Pre-apply geojson/master |
| `data/_coord_fingerprint_before.json` | Pin audit baseline |
| `web/public/data/ac-178/booth-master.json` | 342 English master |
| `web/public/data/ac-178/booths.geojson` | Map + roll text fields |
| `docs/BIHAR_AC_PIPELINE_LOG.md` | **Multi-AC run log SOP** |

---

## Bihar-wide discipline (read before next AC)

1. **One `run.json` per AC** — schema in `docs/BIHAR_AC_PIPELINE_LOG.md`  
2. **Backup before any geojson write**  
3. **Default `apply_coords=false`** for all automated runs  
4. Protect `user_drag` / `eci_verified` / `manual_fix`  
5. CUDA work in **`.venv-cuda`** so CPU tooling stays stable  
6. Log: parts_ok, weak_ps_name_pct, pins_moved, device (cpu|cuda)  
7. Search QA sample: PIN, school keyword, village, booth number  

---

## Key paths

```
KshetraMap/
  HANDOFF.md
  docs/
    ROLL_TO_LATLNG_FLOW.md
    BIHAR_AC_PIPELINE_LOG.md
    SOURCES_BOOTH_LOCATIONS.md
  scripts/
    roll_location_flow.py
    roll_loc/                 # ocr_extract, parse, translit, geocode_snap, apply_results
  .venv-cuda/                 # torch cu124 + easyocr (optional GPU)
  data/roll_parse/
  web/src/lib/boothSearch.ts  # deep location search
  web/src/components/LocationSearch.tsx
```

---

## Feature checklist
| # | Feature | Status |
|---|---------|--------|
| 1 | Historical 2015/2020 | Done |
| 2 | Search by location | Done · **deepened 2026-07-18** |
| 3 | Booth colour modes | Done |
| 4–5 | Strong/weak booth + area | Done (My areas) |
| 6 | Election + booth graphs | Done (History) |
| 7 | Roll page-1 OCR 342 | Done (text) |
| 8 | Auto geocode pins | **Not applied** (safe) |

## Next
- [x] **G5** AC boundary expanded (DataMeet ∪ booth hull buffer ≥2 km edge clearance) — Darwe/Karakayana inside  
- [x] **G3** 2015 honesty: map shows low-confidence serial joins + banner; booth History skips 2015 chart; **PS list** at `data/ps_lists/` (JSON+CSV; 2015 Form20 = serials only)  
- [ ] Fix electors table OCR (page-1 lower crop)  
- [ ] Re-OCR / repair ~18% weak “School” PS names  
- [ ] Reviewed geocode pass + optional `--apply-coords`  
- [x] Redeploy GH Pages (boundary + 2015 soft low-conf + PS list) — 2026-07-18  
- [ ] Template pipeline for next Bihar AC  

---

## Client talking points
1. Map pins = **trusted map geometry**; names = **SIR roll**.  
2. Search: school, village, **PIN**, tehsil, police, booth #.  
3. Year chip: same pins, different Form 20.  
4. **2015 map** uses serial joins (low confidence colours + banner). Prefer History Overview for AC totals; booth History charts skip 2015.  
5. **Green AC outline** = DataMeet Mokama ∪ booth hull buffer (Darwe Bhadaur, Karakayana inside). Not a box.  
6. Grey pins on historical years = unmatched join, not zero votes. Soft colours on 2015 = low-confidence serial.  
7. Bihar scale: every AC gets a logged, pin-safe pipeline run.  
8. **PS list** (2025 OCR + CSV): `data/ps_lists/`.  
