"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MapGL, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
  type MarkerDragEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import type {
  BasemapId,
  BoothCollection,
  BoothProps,
  Candidate,
  MapMode,
  MapSettings,
  Meta,
  PlaceCollection,
} from "@/lib/types";
import { DEFAULT_MAP_SETTINGS } from "@/lib/types";
import {
  BASEMAPS,
  heatColorExpression,
  marginColorExpression,
  radiusExpression,
  strengthColorExpression,
} from "@/lib/mapStyles";
import {
  aggregatePlaceStrength,
  classifyBoothStrength,
  type StrengthTier,
} from "@/lib/boothStrength";
import {
  appBasePath,
  isStaticHosting,
  loadOverrides,
  enqueueDragRequest,
  setOverride,
  type BoothOverride,
} from "@/lib/boothOverrides";
import { loadBoothMatches, loadElections } from "@/lib/historyLoad";
import type { BoothMatches, ElectionPackage } from "@/lib/historyTypes";
import {
  buildYearBoothIndex,
  candidatesFromPackage,
} from "@/lib/mapElectionOverlay";
import { isAcLevelOnlyYear } from "@/lib/yearJoinPolicy";
import { yearJoinBannerText } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayCandidateName,
  displayPlaceName,
} from "@/lib/i18n/displayNames";
import { buildQuery, parseMapShare } from "@/lib/shareUrl";
import { useIsMobile } from "@/lib/useIsMobile";
import { BoothDragControls } from "./BoothDragControls";
import { BoothPopup } from "./BoothPopup";
import { MapControlPanel } from "./MapControlPanel";
import { MobileBoothSheet } from "./MobileBoothSheet";
import { MyAreasOpenChip, MyAreasPanel } from "./MyAreasPanel";
import { ShareLinkButton } from "./ShareLinkButton";

type Props = {
  meta: Meta;
  booths: BoothCollection;
  places?: PlaceCollection;
  boundary?: GeoJSON.Feature | GeoJSON.FeatureCollection;
};

function parseBoothProps(p: Record<string, unknown>): BoothProps {
  let votes = p.votes;
  let pct = p.pct;
  if (typeof votes === "string") votes = JSON.parse(votes);
  if (typeof pct === "string") pct = JSON.parse(pct);
  return {
    ...(p as unknown as BoothProps),
    votes: votes as BoothProps["votes"],
    pct: pct as BoothProps["pct"],
  };
}

export default function BoothMap({ meta, booths, places, boundary }: Props) {
  const acNo = meta.constituency.ac_no;
  const { bbox } = meta.constituency;
  const isMobile = useIsMobile();
  const { locale, t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const electionsAvailable = useMemo(
    () =>
      (meta.elections_available?.length
        ? meta.elections_available
        : [2025]
      )
        .slice()
        .sort((a, b) => b - a),
    [meta.elections_available]
  );
  const urlShare = useMemo(
    () => parseMapShare(searchParams, { years: electionsAvailable }),
    [searchParams, electionsAvailable]
  );
  const [electionYear, setElectionYear] = useState(
    () =>
      urlShare.year ??
      (meta.elections_available?.includes(2025)
        ? 2025
        : meta.elections_available?.[0] ?? 2025)
  );
  const [elections, setElections] = useState<Record<number, ElectionPackage>>(
    {}
  );
  const [boothMatches, setBoothMatches] = useState<BoothMatches | null>(null);
  const [mode, setMode] = useState<MapMode>(() => urlShare.mode ?? "winner");
  const [basemap, setBasemap] = useState<BasemapId>("streets");
  const [candidateKey, setCandidateKey] = useState(
    () => urlShare.member ?? meta.candidates[0]?.key ?? ""
  );
  const [selected, setSelected] = useState<BoothProps | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  // Desktop: panel open; mobile: closed until Filters tapped
  const [panelOpen, setPanelOpen] = useState(false);
  /** Dedicated My areas briefing (not inside Filters) */
  const [myAreasOpen, setMyAreasOpen] = useState(false);
  const [gotoError, setGotoError] = useState<string | null>(null);
  /** Tracks last applied ?booth / ?place so we re-apply on new links only */
  const appliedDeepLink = useRef<string>("");
  /** null = no location filter; else only show these booth numbers */
  const [locationFilter, setLocationFilter] = useState<number[] | null>(null);
  /** When filter came from area briefing, show place name on map chip */
  const [areaFilterLabel, setAreaFilterLabel] = useState<string | null>(null);
  /** Bump to remount LocationSearch when filter cleared from map badge */
  const [locationSearchKey, setLocationSearchKey] = useState(0);

  const clearLocationFilter = useCallback(() => {
    setLocationFilter(null);
    setAreaFilterLabel(null);
    setLocationSearchKey((k) => k + 1);
  }, []);

  const onLocationFilterChange = useCallback((boothNos: number[] | null) => {
    setAreaFilterLabel(null);
    setLocationFilter(boothNos);
  }, []);

  useEffect(() => {
    // Desktop defaults to open rail; mobile stays closed
    setPanelOpen(!isMobile);
    if (isMobile) setMyAreasOpen(false);
  }, [isMobile]);

  /** Left chrome width for map flyTo padding (desktop only) */
  const leftChromePx = useMemo(() => {
    if (isMobile) return 0;
    let w = 0;
    if (panelOpen) w += 328; // filters ~20.5rem
    if (myAreasOpen && mode === "strength") w += 336; // briefing ~21rem
    return w;
  }, [isMobile, panelOpen, myAreasOpen, mode]);

  // Open briefing when entering My areas; close when leaving
  useEffect(() => {
    if (mode === "strength") {
      setMyAreasOpen(true);
      // Mobile: sheet replaces filters drawer so map stays usable
      if (isMobile) setPanelOpen(false);
    } else {
      setMyAreasOpen(false);
    }
  }, [mode, isMobile]);

  // Load historical Form 20 packages for year switcher
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [pkgs, matches] = await Promise.all([
        loadElections(acNo, electionsAvailable),
        loadBoothMatches(acNo),
      ]);
      if (cancelled) return;
      setElections(pkgs);
      setBoothMatches(matches);
    })();
    return () => {
      cancelled = true;
    };
  }, [acNo, electionsAvailable]);

  // Position overrides (localStorage + server)
  const [overrides, setOverrides] = useState<Record<number, BoothOverride>>(
    {}
  );
  useEffect(() => {
    setOverrides(loadOverrides(acNo));
  }, [acNo]);

  // Drag edit state
  const [dragEnabled, setDragEnabled] = useState(false);
  const [dragBoothNo, setDragBoothNo] = useState<number | null>(null);
  /** Position before this drag session (for reset) */
  const [dragOrigin, setDragOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** Live pin position while dragging / pending confirm */
  const [dragPos, setDragPos] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [hasPending, setHasPending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const baseIndex = useMemo(() => {
    const m = new Map<number, BoothProps>();
    for (const f of booths.features) {
      m.set(f.properties.booth_no, f.properties);
    }
    return m;
  }, [booths]);

  /** Geometry + drag overrides (always 2025 pin positions) */
  const resolveGeometry = useCallback(
    (p: BoothProps): BoothProps => {
      const o = overrides[p.booth_no];
      if (!o) return p;
      return {
        ...p,
        lat: o.lat,
        lng: o.lng,
        location_source: "personal_preview",
        accuracy_note: `Personal pin preview · this device only`,
      };
    },
    [overrides]
  );

  const geometryIndex = useMemo(() => {
    const m = new Map<number, BoothProps>();
    for (const f of booths.features) {
      m.set(f.properties.booth_no, resolveGeometry(f.properties));
    }
    return m;
  }, [booths, resolveGeometry]);

  /** Active-year candidates (member selector / heat / popup) */
  const activeCandidates: Candidate[] = useMemo(() => {
    return candidatesFromPackage(
      elections[electionYear],
      meta.candidates
    );
  }, [elections, electionYear, meta.candidates]);

  /** Booth props for selected Form 20 year on 2025 pins */
  const boothIndex = useMemo(() => {
    const bases = [...geometryIndex.values()];
    return buildYearBoothIndex(
      bases,
      electionYear,
      elections[electionYear],
      boothMatches
    );
  }, [geometryIndex, electionYear, elections, boothMatches]);

  /** Keep geometry-only resolve for drag/search place names */
  const resolveBooth = useCallback(
    (p: BoothProps): BoothProps => {
      const geo = resolveGeometry(p);
      return (
        boothIndex.get(geo.booth_no) ?? {
          ...geo,
          election_year: electionYear,
        }
      );
    },
    [resolveGeometry, boothIndex, electionYear]
  );

  // When year changes, remount member if needed + refresh selected booth
  useEffect(() => {
    if (!activeCandidates.some((c) => c.key === candidateKey)) {
      setCandidateKey(activeCandidates[0]?.key ?? "");
    }
  }, [activeCandidates, candidateKey]);

  useEffect(() => {
    if (selected) {
      const next = boothIndex.get(selected.booth_no);
      if (next) setSelected(next);
    }
    // only when year / overlay index changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothIndex]);

  const locationFilterSet = useMemo(() => {
    // null = no filter; Set (even empty) = restrict to these booths
    if (locationFilter === null) return null;
    return new Set(locationFilter);
  }, [locationFilter]);

  const boothsForSearch = useMemo(
    () => [...boothIndex.values()],
    [boothIndex]
  );

  const activePkg = elections[electionYear];
  const acGrandTotal =
    activePkg?.totals.grand_total ??
    activePkg?.totals.total_valid ??
    meta.totals.evm.grand_total;

  /** Real landmarks + place centroids for map labels and location search */
  const placesForSearch = useMemo(() => {
    if (!places?.features?.length) return [];
    return places.features.map((f) => ({
      ...f.properties,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }));
  }, [places]);

  const strengthThresholds = useMemo(
    () => ({
      strongMin: settings.strengthStrongMin,
      weakMax: settings.strengthWeakMax,
      strongRequiresWin: true as const,
    }),
    [settings.strengthStrongMin, settings.strengthWeakMax]
  );

  /** Booth strength counts for legend */
  const strengthStats = useMemo(() => {
    const counts = { strong: 0, average: 0, weak: 0, na: 0 };
    for (const p of boothIndex.values()) {
      if (p.match_confidence === "unmatched" && electionYear !== 2025) {
        counts.na++;
        continue;
      }
      const share = p.pct[candidateKey] ?? 0;
      const won = p.winner_key === candidateKey;
      const t = classifyBoothStrength(
        share,
        won,
        p.total_valid,
        strengthThresholds
      );
      counts[t]++;
    }
    return counts;
  }, [boothIndex, candidateKey, electionYear, strengthThresholds]);

  /** Place/area strength from mean focus share of booths in that place */
  const placeStrengthIndex = useMemo(() => {
    const byPlace = new Map<
      string,
      {
        boothNo: number;
        focusShare: number;
        focusVotes: number;
        totalValid: number;
        focusWon: boolean;
      }[]
    >();
    for (const p of boothIndex.values()) {
      const name = (p.nearest_place || "").trim();
      if (!name) continue;
      if (p.match_confidence === "unmatched" && electionYear !== 2025) continue;
      if (!byPlace.has(name)) byPlace.set(name, []);
      byPlace.get(name)!.push({
        boothNo: p.booth_no,
        focusShare: p.pct[candidateKey] ?? 0,
        focusVotes: p.votes[candidateKey] ?? 0,
        totalValid: p.total_valid,
        focusWon: p.winner_key === candidateKey,
      });
    }
    const out = new Map<
      string,
      ReturnType<typeof aggregatePlaceStrength>
    >();
    for (const [name, list] of byPlace) {
      out.set(name, aggregatePlaceStrength(list, strengthThresholds));
    }
    return out;
  }, [boothIndex, candidateKey, electionYear, strengthThresholds]);

  /** Area ranking for panel (places with ≥2 booths) */
  const areaStrengthList = useMemo(() => {
    return [...placeStrengthIndex.entries()]
      .filter(([, v]) => v.n >= 2 && v.tier !== "na")
      .map(([place, v]) => ({ place, ...v }))
      .sort((a, b) => b.meanShare - a.meanShare);
  }, [placeStrengthIndex]);

  /** Only real anchors + larger place clusters for map labels (not every tiny cluster) */
  const placesMapGeojson = useMemo(() => {
    if (!places?.features?.length) {
      return { type: "FeatureCollection" as const, features: [] };
    }
    const features = places.features
      .filter((f) => {
        const k = f.properties.kind;
        if (
          k === "railway" ||
          k === "town" ||
          k === "village" ||
          k === "place"
        ) {
          return true;
        }
        if (k === "booth_place" && (f.properties.booth_count ?? 0) >= 5) {
          return true;
        }
        return false;
      })
      .map((f) => {
        const name = f.properties.name;
        // Match place name to nearest_place clusters (strip railway suffix etc.)
        const plain = name
          .replace(/\s*\(MKA\)|\s*\(HTZ\)/gi, "")
          .replace(/\s+Junction.*$/i, "")
          .replace(/\s+Halt.*$/i, "")
          .replace(/\s+station.*$/i, "")
          .replace(/\s+town$/i, "")
          .trim();
        const agg =
          placeStrengthIndex.get(name) ||
          placeStrengthIndex.get(plain) ||
          // fuzzy: first word
          [...placeStrengthIndex.entries()].find(
            ([k]) =>
              k.toLowerCase() === plain.toLowerCase() ||
              plain.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(plain.toLowerCase())
          )?.[1];
        const tier: StrengthTier = agg?.tier ?? "na";
        return {
          ...f,
          properties: {
            ...f.properties,
            name_en: name,
            name: displayPlaceName(locale, name),
            strength_tier: tier,
            strength_mean: agg?.meanShare ?? null,
            strength_color:
              tier === "strong"
                ? "#16a34a"
                : tier === "average"
                  ? "#eab308"
                  : tier === "weak"
                    ? "#dc2626"
                    : "#64748b",
          },
        };
      });
    return { type: "FeatureCollection" as const, features };
  }, [places, placeStrengthIndex, locale]);

  const flyToPlace = useCallback(
    (place: { lat: number; lng: number; name?: string }) => {
      mapRef?.flyTo({
        center: [place.lng, place.lat],
        zoom: Math.min(settings.flyZoom, 13.5),
        duration: 1000,
        padding: {
          top: 40,
          bottom: isMobile ? 80 : 40,
          left: Math.max(40, leftChromePx + 12),
          right: 40,
        },
      });
    },
    [mapRef, settings.flyZoom, isMobile, leftChromePx]
  );

  const filteredGeojson = useMemo(() => {
    const features = [...boothIndex.values()]
      .filter((p) => {
        // Hide the booth being dragged from circle layer (shown as Marker)
        if (dragEnabled && dragBoothNo === p.booth_no) return false;
        if (
          electionYear !== 2025 &&
          settings.hideUnmatchedYear &&
          p.match_confidence === "unmatched"
        ) {
          return false;
        }
        if (settings.minVotes > 0 && p.total_valid < settings.minVotes) {
          return false;
        }
        if (settings.onlyMemberWins && p.winner_key !== candidateKey) {
          return false;
        }
        if (locationFilterSet && !locationFilterSet.has(p.booth_no)) {
          return false;
        }
        // Strength filter (mode-aware: only when strength mode or filter set)
        if (settings.strengthFilter !== "all") {
          const share = p.pct[candidateKey] ?? 0;
          const won = p.winner_key === candidateKey;
          const tier = classifyBoothStrength(
            share,
            won,
            p.total_valid,
            strengthThresholds
          );
          if (tier !== settings.strengthFilter) return false;
        }
        return true;
      })
      .map((p) => {
        const isMemberWin = p.winner_key === candidateKey;
        const unmatched = p.match_confidence === "unmatched" ? 1 : 0;
        const lowConf = p.match_confidence === "low" ? 1 : 0;
        const heatPct = p.pct[candidateKey] ?? 0;
        const tier = classifyBoothStrength(
          heatPct,
          isMemberWin,
          p.total_valid,
          strengthThresholds
        );
        const unverified =
          p.location_source === "manual_interp" ||
          p.location_source === "outlier_clamped" ||
          p.location_source === "manual_edge_fix" ||
          p.location_source === "water_snapped";
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [p.lng, p.lat] as [number, number],
          },
          properties: {
            ...p,
            heat_pct: heatPct,
            heat_votes: p.votes[candidateKey] ?? 0,
            is_member_win: isMemberWin ? 1 : 0,
            strength_tier: tier,
            unmatched,
            low_conf: lowConf,
            unverified: unverified ? 1 : 0,
            label: String(p.booth_no),
          },
        };
      });

    return { type: "FeatureCollection" as const, features };
  }, [
    boothIndex,
    candidateKey,
    settings.minVotes,
    settings.onlyMemberWins,
    settings.hideUnmatchedYear,
    settings.strengthFilter,
    strengthThresholds,
    electionYear,
    dragEnabled,
    dragBoothNo,
    locationFilterSet,
  ]);

  /** Zoom map to matching booths when location search filters */
  useEffect(() => {
    if (!mapRef || !locationFilterSet || locationFilterSet.size === 0) return;
    // Deep-link booth selection owns the camera; don't override with place fitBounds
    if (searchParams.get("booth")) return;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    let n = 0;
    for (const no of locationFilterSet) {
      const b = boothIndex.get(no);
      if (!b) continue;
      n++;
      minLng = Math.min(minLng, b.lng);
      maxLng = Math.max(maxLng, b.lng);
      minLat = Math.min(minLat, b.lat);
      maxLat = Math.max(maxLat, b.lat);
    }
    if (n === 0) return;
    if (n === 1) {
      mapRef.flyTo({
        center: [minLng, minLat],
        zoom: settings.flyZoom,
        duration: 900,
        padding: {
          top: 40,
          bottom: isMobile ? 80 : 40,
          left: Math.max(40, leftChromePx + 12),
          right: 40,
        },
      });
      return;
    }
    // Pad tiny clusters so fitBounds doesn't over-zoom
    const pad = 0.004;
    mapRef.fitBounds(
      [
        [minLng - pad, minLat - pad],
        [maxLng + pad, maxLat + pad],
      ],
      {
        padding: {
          top: 48,
          bottom: isMobile ? 80 : 48,
          left: Math.max(48, leftChromePx + 16),
          right: 48,
        },
        maxZoom: 14,
        duration: 900,
      }
    );
  }, [
    locationFilterSet,
    mapRef,
    boothIndex,
    settings.flyZoom,
    isMobile,
    leftChromePx,
    searchParams,
  ]);

  const fillColor = useMemo(() => {
    if (mode === "heat") return heatColorExpression("heat_pct");
    if (mode === "margin") return marginColorExpression();
    if (mode === "strength") return strengthColorExpression();
    return ["coalesce", ["get", "winner_color"], "#6b7280"] as unknown[];
  }, [mode]);

  const circleOpacity = useMemo(() => {
    // Unmatched = very faded; low-confidence (e.g. 2015 serial) = softer but still party-coloured
    const unmatchedDim = [
      "case",
      ["==", ["get", "unmatched"], 1],
      settings.markerOpacity * 0.22,
      ["==", ["get", "low_conf"], 1],
      settings.markerOpacity * 0.72,
      settings.markerOpacity,
    ];
    if (settings.highlightMemberWins) {
      return [
        "case",
        ["==", ["get", "unmatched"], 1],
        settings.markerOpacity * 0.15,
        ["==", ["get", "is_member_win"], 1],
        settings.markerOpacity,
        settings.markerOpacity * 0.18,
      ];
    }
    return unmatchedDim;
  }, [settings.highlightMemberWins, settings.markerOpacity]);

  const initialView = useMemo(
    () => ({
      bounds: [
        [bbox.min_lng, bbox.min_lat],
        [bbox.max_lng, bbox.max_lat],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: {
        padding: {
          top: 40,
          bottom: isMobile ? 40 : 40,
          left: !isMobile && panelOpen ? 340 : 40,
          right: 40,
        },
        maxZoom: 12,
      },
    }),
    [bbox, panelOpen, isMobile]
  );

  const flyToBooth = useCallback(
    (booth: BoothProps) => {
      const resolved = resolveBooth(booth);
      setSelected(resolved);
      setDragBoothNo(resolved.booth_no);
      if (isMobile) {
        setPanelOpen(false);
        setMyAreasOpen(false);
      }
      mapRef?.flyTo({
        center: [resolved.lng, resolved.lat],
        zoom: settings.flyZoom,
        duration: 1200,
        essential: true,
        padding: {
          top: 0,
          bottom: isMobile ? 220 : 0,
          left: leftChromePx,
          right: 0,
        },
      });
    },
    [mapRef, settings.flyZoom, leftChromePx, resolveBooth, isMobile]
  );

  const goToBoothNo = useCallback(
    (n: number) => {
      const booth = boothIndex.get(n);
      if (!booth) {
        setGotoError(
          t("booth.notFound", {
            n,
            max: meta.constituency.booth_count,
          })
        );
        return;
      }
      setGotoError(null);
      // Exit previous drag session when jumping
      setDragEnabled(false);
      setHasPending(false);
      setDragPos(null);
      setDragOrigin(null);
      flyToBooth(booth);
    },
    [boothIndex, flyToBooth, meta.constituency.booth_count, t]
  );

  const onElectionYearChange = useCallback((year: number) => {
    setElectionYear(year);
    // G3: 2015 booth joins demoted — keep map honest (no fake booth winners)
    if (isAcLevelOnlyYear(year)) {
      setSettings((s) => ({ ...s, hideUnmatchedYear: true }));
    }
  }, []);

  /** Candidate taps an area → map shows that booth combination */
  const onSelectArea = useCallback((place: string, boothNos: number[]) => {
    if (!boothNos.length) return;
    setAreaFilterLabel(place);
    setLocationFilter(boothNos);
    setLocationSearchKey((k) => k + 1);
    setMode("strength");
    if (isMobile) {
      setPanelOpen(false);
      setMyAreasOpen(false); // free map view; re-open via chip
    }
  }, [isMobile]);

  const openMyAreas = useCallback(() => {
    setMode("strength");
    setMyAreasOpen(true);
    if (isMobile) setPanelOpen(false); // sheet instead of filters
  }, [isMobile]);

  const closeMyAreas = useCallback(() => {
    setMyAreasOpen(false);
  }, []);

  /** Hide filters also closes My areas — one clear action to free the map. */
  const toggleFilters = useCallback(() => {
    setPanelOpen((open) => {
      if (open) setMyAreasOpen(false);
      return !open;
    });
  }, []);

  // Apply year / mode / member from URL when params change
  useEffect(() => {
    const s = parseMapShare(searchParams, { years: electionsAvailable });
    if (s.year != null && s.year !== electionYear) setElectionYear(s.year);
    if (s.mode && s.mode !== mode) setMode(s.mode);
    if (s.member && s.member !== candidateKey) setCandidateKey(s.member);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync shareable state → URL (address bar + Share button)
  useEffect(() => {
    const nextFull = buildQuery({
      year: electionYear,
      mode,
      member: candidateKey || null,
      booth: selected?.booth_no ?? null,
      place: searchParams.get("place"),
    });
    const bare = nextFull.startsWith("?") ? nextFull.slice(1) : nextFull;
    if (searchParams.toString() === bare) return;
    router.replace(`${pathname}${nextFull}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionYear, mode, candidateKey, selected?.booth_no]);

  // Deep link from History: ?booth=N and/or ?place=Mokama
  useEffect(() => {
    if (!mapRef) return;
    const boothRaw = searchParams.get("booth");
    const placeRaw = searchParams.get("place");
    if (!boothRaw && !placeRaw) return;

    const qKey = `b=${boothRaw ?? ""}|p=${placeRaw ?? ""}`;
    if (appliedDeepLink.current === qKey) return;

    const apply = () => {
      // Avoid double-apply if effect re-ran successfully
      if (appliedDeepLink.current === qKey) return;

      let applied = false;

      if (placeRaw) {
        const name = decodeURIComponent(placeRaw).trim().toLowerCase();
        const nos: number[] = [];
        for (const f of booths.features) {
          const p = f.properties;
          const np = (p.nearest_place || "").trim().toLowerCase();
          const vill = (p.village || "").trim().toLowerCase();
          const ps = (p.nearest_ps || "").trim().toLowerCase();
          if (np === name || vill === name || ps === name || np.includes(name)) {
            nos.push(p.booth_no);
          }
        }
        if (nos.length > 0) {
          setLocationFilter(nos);
          setLocationSearchKey((k) => k + 1);
          applied = true;
        }
      }

      if (boothRaw) {
        const n = Number(boothRaw);
        if (Number.isFinite(n) && n >= 1 && boothIndex.has(n)) {
          // Clear filter conflict only if place didn't set one; keep both:
          // booth select + optional place filter is OK
          goToBoothNo(n);
          applied = true;
        }
      }

      if (applied) {
        appliedDeepLink.current = qKey;
      }
    };

    const map = mapRef.getMap();
    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      if (cancelled) return;
      // Wait for style + one frame so flyTo/fitBounds stick
      timer = window.setTimeout(() => {
        if (!cancelled) apply();
      }, 250);
    };

    if (map.isStyleLoaded()) {
      schedule();
    } else {
      map.once("load", schedule);
      map.once("idle", schedule);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      map.off("load", schedule);
      map.off("idle", schedule);
    };
  }, [mapRef, searchParams, boothIndex, booths.features, goToBoothNo]);

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (dragEnabled) return; // don't change selection while dragging
      const f = e.features?.[0];
      if (!f?.properties) {
        setSelected(null);
        return;
      }
      const props = parseBoothProps(f.properties as Record<string, unknown>);
      const resolved = resolveBooth(props);
      setSelected(resolved);
      setDragBoothNo(resolved.booth_no);
      // Clean mobile map: close filters when inspecting a booth
      if (isMobile) setPanelOpen(false);
    },
    [dragEnabled, resolveBooth, isMobile]
  );

  const onMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (dragEnabled) {
        if (mapRef) mapRef.getCanvas().style.cursor = "grab";
        return;
      }
      const f = e.features?.[0];
      const id = f?.properties?.booth_no as number | undefined;
      setHoverId(id ?? null);
      if (mapRef) {
        mapRef.getCanvas().style.cursor = f ? "pointer" : "";
      }
    },
    [mapRef, dragEnabled]
  );

  const enableDrag = useCallback(() => {
    const n = dragBoothNo ?? selected?.booth_no;
    if (n == null) return;
    const booth = boothIndex.get(n);
    if (!booth) return;
    setDragBoothNo(n);
    setDragOrigin({ lat: booth.lat, lng: booth.lng });
    setDragPos({ lat: booth.lat, lng: booth.lng });
    setHasPending(false);
    setDragEnabled(true);
    setSelected(booth);
    setSaveError(null);
    mapRef?.flyTo({
      center: [booth.lng, booth.lat],
      zoom: Math.max(settings.flyZoom, 14),
      duration: 800,
    });
  }, [dragBoothNo, selected, boothIndex, mapRef, settings.flyZoom]);

  const disableDrag = useCallback(() => {
    setDragEnabled(false);
    setHasPending(false);
    setDragPos(null);
    setDragOrigin(null);
    setSaving(false);
  }, []);

  const onMarkerDrag = useCallback((e: MarkerDragEvent) => {
    setDragPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    setHasPending(true);
  }, []);

  const onMarkerDragEnd = useCallback((e: MarkerDragEvent) => {
    setDragPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    setHasPending(true);
  }, []);

  const resetDrag = useCallback(() => {
    if (!dragOrigin || dragBoothNo == null) return;
    // Snap pin back to position at start of this drag session
    setDragPos({ ...dragOrigin });
    setHasPending(false);
    const base = baseIndex.get(dragBoothNo);
    if (base) {
      setSelected({
        ...base,
        lat: dragOrigin.lat,
        lng: dragOrigin.lng,
      });
    }
  }, [dragOrigin, dragBoothNo, baseIndex]);

  /**
   * Confirm drag — personal preview only (localStorage + this map session).
   * Does NOT change authentic geojson / Mongo. Optional: queue request for admin.
   */
  const confirmDrag = useCallback(async () => {
    if (!hasPending || !dragPos || dragBoothNo == null || saving) return;
    setSaving(true);
    setSaveError(null);

    const baseBooth = baseIndex.get(dragBoothNo);
    const fromLat = dragOrigin?.lat ?? baseBooth?.lat;
    const fromLng = dragOrigin?.lng ?? baseBooth?.lng;

    // 1) This browser only — map pin for current user
    enqueueDragRequest(acNo, {
      booth_no: dragBoothNo,
      from_lat: fromLat ?? dragPos.lat,
      from_lng: fromLng ?? dragPos.lng,
      to_lat: dragPos.lat,
      to_lng: dragPos.lng,
    });

    const next = setOverride(acNo, dragBoothNo, dragPos.lat, dragPos.lng, {
      original_lat: fromLat,
      original_lng: fromLng,
      status: "personal_only",
    });
    setOverrides(next);
    if (baseBooth) {
      setSelected({
        ...baseBooth,
        lat: dragPos.lat,
        lng: dragPos.lng,
        location_source: "personal_preview",
        accuracy_note: "Personal preview · this device only",
      });
    }
    setDragOrigin({ ...dragPos });
    setHasPending(false);

    // 2) Optional: queue for future admin (never patches authentic data)
    if (!isStaticHosting()) {
      try {
        const base = appBasePath();
        const res = await fetch(`${base}/api/ac/${acNo}/booth-position`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booth_no: dragBoothNo,
            lat: dragPos.lat,
            lng: dragPos.lng,
            from_lat: fromLat,
            from_lng: fromLng,
          }),
        });
        if (res.ok) {
          // Mark local override as also queued server-side for admin
          setOverrides(
            setOverride(acNo, dragBoothNo, dragPos.lat, dragPos.lng, {
              original_lat: fromLat,
              original_lng: fromLng,
              status: "request_queued",
            })
          );
        }
        // Ignore failures — personal preview already applied
      } catch {
        /* personal preview is enough */
      }
    }

    setSaving(false);
  }, [
    hasPending,
    dragPos,
    dragBoothNo,
    saving,
    acNo,
    baseIndex,
    dragOrigin,
  ]);

  const patchSettings = useCallback((patch: Partial<MapSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const onCandidateChange = useCallback(
    (key: string) => {
      setCandidateKey(key);
      // Switching member: show heat or keep strength for that person
      if (mode === "winner" && !settings.highlightMemberWins) {
        setMode("heat");
      }
    },
    [mode, settings.highlightMemberWins]
  );

  const style = BASEMAPS[basemap].style;
  const scale = settings.markerScale;
  const markerLat = dragPos?.lat ?? selected?.lat;
  const markerLng = dragPos?.lng ?? selected?.lng;

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <MapGL
        ref={setMapRef}
        initialViewState={{
          longitude: (bbox.min_lng + bbox.max_lng) / 2,
          latitude: (bbox.min_lat + bbox.max_lat) / 2,
          zoom: 11,
        }}
        onLoad={(e) => {
          e.target.fitBounds(initialView.bounds, initialView.fitBoundsOptions);
        }}
        mapStyle={style as string}
        interactiveLayerIds={dragEnabled ? [] : ["booths-circle"]}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseLeave={() => {
          setHoverId(null);
          if (mapRef && !dragEnabled) mapRef.getCanvas().style.cursor = "";
        }}
        dragPan={!dragEnabled || !hasPending ? true : true}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {!isMobile && (
          <NavigationControl position="bottom-right" showCompass={false} />
        )}
        {isMobile && !selected && !dragEnabled && (
          <NavigationControl position="bottom-right" showCompass={false} />
        )}

        {boundary && (
          <Source
            id="ac-boundary"
            type="geojson"
            data={
              boundary.type === "FeatureCollection"
                ? boundary
                : { type: "FeatureCollection", features: [boundary] }
            }
          >
            <Layer
              id="ac-boundary-fill"
              type="fill"
              paint={{
                "fill-color": "#059669",
                "fill-opacity": 0.07,
              }}
            />
            <Layer
              id="ac-boundary-line"
              type="line"
              paint={{
                "line-color": "#10b981",
                "line-width": 2.5,
                "line-opacity": 0.95,
              }}
            />
          </Source>
        )}

        <Source id="booths" type="geojson" data={filteredGeojson}>
          {settings.showHalo && (
            <Layer
              id="booths-halo"
              type="circle"
              paint={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                "circle-radius": radiusExpression(scale, 2) as any,
                "circle-color": "#ffffff",
                "circle-opacity": 0.85,
              }}
            />
          )}
          <Layer
            id="booths-circle"
            type="circle"
            paint={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              "circle-radius": radiusExpression(scale) as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              "circle-color": fillColor as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              "circle-opacity": circleOpacity as any,
              "circle-stroke-width": [
                "case",
                ["==", ["get", "booth_no"], hoverId ?? -1],
                2.5,
                settings.flagUnverified
                  ? (["case", ["==", ["get", "unverified"], 1], 2, 0.8] as unknown as number)
                  : 0.8,
              ] as unknown as number,
              "circle-stroke-color": [
                "case",
                ["==", ["get", "booth_no"], hoverId ?? -1],
                "#0f172a",
                settings.flagUnverified
                  ? ([
                      "case",
                      ["==", ["get", "unverified"], 1],
                      "#f59e0b",
                      "rgba(15,23,42,0.35)",
                    ] as unknown as string)
                  : "rgba(15,23,42,0.35)",
              ] as unknown as string,
            }}
          />
          {settings.showLabels && (
            <Layer
              id="booths-labels"
              type="symbol"
              layout={{
                "text-field": ["get", "label"],
                "text-size": 10,
                "text-offset": [0, 1.2],
                "text-anchor": "top",
                "text-allow-overlap": false,
                "text-ignore-placement": false,
              }}
              paint={{
                "text-color": "#0f172a",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.2,
              }}
            />
          )}
        </Source>

        {/* Real geographic places (stations, towns, villages) */}
        {settings.showPlaces && placesMapGeojson.features.length > 0 && (
          <Source id="places" type="geojson" data={placesMapGeojson}>
            <Layer
              id="places-pin"
              type="circle"
              paint={{
                "circle-radius":
                  mode === "strength" && settings.showAreaStrength
                    ? 8
                    : ([
                        "case",
                        ["==", ["get", "kind"], "railway"],
                        6,
                        ["==", ["get", "kind"], "town"],
                        7,
                        ["==", ["get", "kind"], "village"],
                        5,
                        4,
                      ] as unknown as number),
                "circle-color":
                  mode === "strength" && settings.showAreaStrength
                    ? (["coalesce", ["get", "strength_color"], "#64748b"] as unknown as string)
                    : ([
                        "case",
                        ["==", ["get", "kind"], "railway"],
                        "#0ea5e9",
                        ["==", ["get", "kind"], "town"],
                        "#f59e0b",
                        ["==", ["get", "kind"], "village"],
                        "#14b8a6",
                        ["==", ["get", "kind"], "place"],
                        "#a78bfa",
                        "#64748b",
                      ] as unknown as string),
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#ffffff",
                "circle-opacity": 0.95,
              }}
            />
            {/* English glyphs only when no booth sheet/popup (labels otherwise stack over it) */}
            {locale !== "hi" && !selected && !dragEnabled && (
              <Layer
                id="places-labels"
                type="symbol"
                layout={{
                  "text-field": ["get", "name"],
                  "text-size": 11,
                  "text-offset": [0, 1.15],
                  "text-anchor": "top",
                  "text-max-width": 10,
                  "text-allow-overlap": false,
                  "text-optional": true,
                }}
                paint={{
                  "text-color": "#0f172a",
                  "text-halo-color": "#ffffff",
                  "text-halo-width": 1.4,
                }}
              />
            )}
          </Source>
        )}

        {/* Hindi place chips: hide while booth selected so they don't cover the popup/sheet */}
        {settings.showPlaces &&
          locale === "hi" &&
          !selected &&
          !dragEnabled &&
          placesMapGeojson.features.map((f) => {
            const [lng, lat] = f.geometry.coordinates;
            const label = String(f.properties.name || "");
            if (!label || lng == null || lat == null) return null;
            return (
              <Marker
                key={`hi-place-${f.properties.id || label}`}
                longitude={lng}
                latitude={lat}
                anchor="top"
                style={{ zIndex: 1 }}
              >
                <div className="kshetra-place-label-hi" title={label}>
                  {label}
                </div>
              </Marker>
            );
          })}

        {/* Draggable pin */}
        {dragEnabled &&
          dragBoothNo != null &&
          markerLat != null &&
          markerLng != null && (
            <Marker
              longitude={markerLng}
              latitude={markerLat}
              draggable
              onDrag={onMarkerDrag}
              onDragEnd={onMarkerDragEnd}
              anchor="center"
            >
              <div className="relative flex flex-col items-center">
                <div className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full border-2 border-white bg-amber-400 text-xs font-bold text-zinc-900 shadow-lg active:cursor-grabbing">
                  {dragBoothNo}
                </div>
                {hasPending && (
                  <div className="mt-1 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDrag();
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
                      title="Confirm"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetDrag();
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-md hover:bg-red-500"
                      title="Reset"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </Marker>
          )}

        {/* Desktop: map popup. Mobile: bottom sheet (cleaner). */}
        {selected && !dragEnabled && !isMobile && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            offset={14}
            closeButton={false}
            closeOnClick={false}
            maxWidth="360px"
            className="kshetra-popup"
          >
            <BoothPopup
              booth={selected}
              candidates={activeCandidates}
              acGrandTotal={acGrandTotal}
              acNo={acNo}
              electionYear={electionYear}
              onClose={() => setSelected(null)}
            />
          </Popup>
        )}
      </MapGL>

      {yearJoinBannerText(locale, electionYear) && !dragEnabled && (
        <div
          className={`pointer-events-none absolute z-20 max-w-[min(92vw,22rem)] rounded-xl border border-amber-700/60 bg-black/90 px-3 py-2 text-[11px] leading-snug text-amber-100 shadow-lg ${
            isMobile ? "top-14 left-3 right-3" : "top-14 left-[min(100vw-1rem,21rem)]"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
            {t("yearBanner.note", { year: electionYear })}
          </div>
          <p className="mt-0.5">{yearJoinBannerText(locale, electionYear)}</p>
        </div>
      )}

      {saveError && (
        <div
          className={`pointer-events-auto absolute z-20 rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-200 ${
            isMobile ? "bottom-28 left-3 right-3" : "bottom-20 right-3"
          }`}
        >
          {saveError}
        </div>
      )}

      {/* Mobile booth detail — clean sheet, map stays readable */}
      {isMobile && selected && !dragEnabled && (
        <MobileBoothSheet
          booth={selected}
          candidates={activeCandidates}
          acGrandTotal={acGrandTotal}
          acNo={acNo}
          electionYear={electionYear}
          onClose={() => setSelected(null)}
          onMoveBooth={() => {
            enableDrag();
          }}
        />
      )}

      {/*
        Top-right map chrome — single stack so year / share / filter /
        drag / spotlight never sit on the same absolute coordinates.
      */}
      <div
        className={`pointer-events-auto absolute top-3 z-20 flex max-w-[min(100vw-1.5rem,20rem)] flex-col items-end gap-1.5 ${
          isMobile ? "right-3 left-3 max-w-none" : "right-3"
        }`}
      >
        <div className="flex w-full flex-wrap items-center justify-end gap-1.5">
          <div className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white/95 px-1.5 py-1 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-950/95">
            <span className="kshetra-ui-hi hidden px-1.5 text-[10px] font-semibold text-zinc-500 sm:inline dark:text-zinc-400">
              {t("panel.electionYear")}
            </span>
            {electionsAvailable.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onElectionYearChange(y)}
                className={`rounded-full px-2.5 py-1 font-semibold tabular-nums transition ${
                  electionYear === y
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <ShareLinkButton
            compact
            label={t("map.shareView")}
            params={{
              year: electionYear,
              mode,
              member: candidateKey,
              booth: selected?.booth_no ?? null,
              place: searchParams.get("place"),
            }}
          />
        </div>

        {locationFilter !== null && (
          <div className="flex w-full max-w-full items-center gap-2 rounded-full border border-emerald-600/50 bg-white/95 px-3 py-1.5 text-xs text-zinc-800 shadow-lg dark:border-emerald-700/60 dark:bg-zinc-950/95 dark:text-emerald-100">
            <span className="min-w-0 flex-1 truncate">
              {areaFilterLabel ? (
                <>
                  <span className="kshetra-ui-hi font-semibold text-zinc-900 dark:text-white">
                    {displayPlaceName(locale, areaFilterLabel)}
                  </span>
                  <span className="text-emerald-700/90 dark:text-emerald-200/80">
                    {" "}
                    ·{" "}
                    {t("search.matchCount", {
                      n: locationFilter.length,
                      hits: locationFilter.length,
                    })}
                  </span>
                </>
              ) : (
                <span className="kshetra-ui-hi tabular-nums">
                  {t("search.matchCount", {
                    n: locationFilter.length,
                    hits: locationFilter.length,
                  })}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={clearLocationFilter}
              className="shrink-0 rounded-full bg-emerald-700 px-2 py-0.5 font-medium text-white hover:bg-emerald-600"
            >
              {t("map.clearFilter")}
            </button>
          </div>
        )}

        {dragEnabled && (
          <div
            className={`kshetra-ui-hi w-full rounded-lg border border-amber-500/50 bg-amber-50 px-3 py-2 text-xs text-amber-950 shadow-lg dark:border-amber-600/50 dark:bg-black/90 dark:text-amber-100 ${
              isMobile ? "text-center" : "text-right"
            }`}
          >
            {t("booth.dragMode", { n: dragBoothNo ?? "" })}
            {hasPending
              ? ` · ${t("drag.saveHint")}`
              : ` · ${t("drag.dragHint")}`}
          </div>
        )}

        {meta.showcase &&
          !selected &&
          !dragEnabled &&
          !panelOpen &&
          electionYear === 2025 && (
            <button
              type="button"
              onClick={() => goToBoothNo(meta.showcase!.booth_no)}
              className="w-full max-w-full rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-50 to-emerald-50 px-3 py-2.5 text-left shadow-xl dark:border-amber-600/50 dark:from-amber-950 dark:to-emerald-950"
            >
              <div className="kshetra-ui-hi text-[10px] font-bold text-amber-800 dark:text-amber-200">
                {t("home.spotlight")}
              </div>
              <div className="kshetra-ui-hi text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {meta.showcase.title}
              </div>
              <div className="kshetra-ui-hi mt-0.5 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                {meta.showcase.hint}
              </div>
              <div className="kshetra-ui-hi mt-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t("booth.openShowcase", { n: meta.showcase.booth_no })}
              </div>
            </button>
          )}
      </div>

      <MapControlPanel
        open={panelOpen}
        onToggle={toggleFilters}
        meta={meta}
        mode={mode}
        onModeChange={setMode}
        basemap={basemap}
        onBasemapChange={setBasemap}
        candidateKey={candidateKey}
        onCandidateChange={onCandidateChange}
        candidates={activeCandidates}
        settings={settings}
        onSettingsChange={patchSettings}
        onResetSettings={() => setSettings(DEFAULT_MAP_SETTINGS)}
        boothCount={meta.constituency.booth_count}
        onGoBooth={(n) => {
          goToBoothNo(n);
          if (isMobile) setPanelOpen(false);
        }}
        gotoError={gotoError}
        onClearGotoError={() => setGotoError(null)}
        electionYear={electionYear}
        onElectionYearChange={onElectionYearChange}
        electionsAvailable={electionsAvailable}
        boothsForSearch={boothsForSearch}
        placesForSearch={placesForSearch}
        onLocationFilterChange={onLocationFilterChange}
        onSelectPlace={flyToPlace}
        locationSearchKey={locationSearchKey}
        strengthStats={strengthStats}
        myAreasOpen={myAreasOpen && mode === "strength"}
        onOpenMyAreas={openMyAreas}
        isMobile={isMobile}
        hideFab={
          isMobile &&
          (!!selected || dragEnabled || (myAreasOpen && mode === "strength"))
        }
        dragControls={
          <BoothDragControls
            boothNo={dragBoothNo ?? selected?.booth_no ?? null}
            dragEnabled={dragEnabled}
            hasPending={hasPending}
            pendingLat={dragPos?.lat}
            pendingLng={dragPos?.lng}
            onEnableDrag={enableDrag}
            onDisableDrag={disableDrag}
            onConfirm={confirmDrag}
            onReset={resetDrag}
          />
        }
      />

      {/* My areas: side panel (desktop) / bottom sheet (mobile) — not in Filters */}
      {mode === "strength" && strengthStats && (
        <>
          <MyAreasPanel
            open={myAreasOpen}
            onClose={closeMyAreas}
            isMobile={isMobile}
            filtersOpen={panelOpen}
            memberName={(() => {
              const c = activeCandidates.find((x) => x.key === candidateKey);
              return c
                ? displayCandidateName(locale, c.key, c.name)
                : candidateKey;
            })()}
            electionYear={electionYear}
            stats={strengthStats}
            areas={areaStrengthList}
            settings={settings}
            onSettingsChange={patchSettings}
            onSelectArea={onSelectArea}
            onGoBooth={(n) => {
              goToBoothNo(n);
              if (isMobile) setMyAreasOpen(false);
            }}
          />
          <MyAreasOpenChip
            visible={
              !myAreasOpen &&
              !selected &&
              !dragEnabled &&
              !(isMobile && panelOpen) &&
              // Desktop: only show the green edge tab when filters are closed,
              // so it does not stack on top of the white Controls tab.
              (isMobile || !panelOpen)
            }
            stats={strengthStats}
            onOpen={openMyAreas}
            isMobile={isMobile}
            filtersOpen={panelOpen}
          />
        </>
      )}
    </div>
  );
}
