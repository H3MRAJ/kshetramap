"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MapGL, {
  Marker,
  NavigationControl,
  type MapRef,
  type MarkerDragEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import type { BoothCollection, BoothProps, Meta } from "@/lib/types";
import { BASEMAPS } from "@/lib/mapStyles";
import { appBasePath } from "@/lib/boothOverrides";
import {
  exportPlacements,
  loadPlacements,
  loadSuggestions,
  savePlacement,
  type MapplsSuggestion,
  type Placement,
} from "@/lib/placements";
import { PasswordDialog } from "@/components/PasswordDialog";
import { geocodeMappls } from "@/lib/mapplsSdk";

const PLACE_PASS = process.env.NEXT_PUBLIC_PLACE_PASS || "kshetra";
const MAPPLS_KEY = process.env.NEXT_PUBLIC_MAPPLS_KEY || "";

type Props = {
  meta: Meta;
  booths: BoothCollection;
  manifest: Record<string, string[]>;
};

export function PlacementWorkspace({ meta, booths, manifest }: Props) {
  const acNo = meta.constituency.ac_no;
  const rows = useMemo(
    () =>
      booths.features
        .map((f) => f.properties)
        .sort((a, b) => a.booth_no - b.booth_no),
    [booths]
  );

  const [unlocked, setUnlocked] = useState(false);
  const [idx, setIdx] = useState(0);
  const [placements, setPlacements] = useState<Record<number, Placement>>({});
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite");
  const [suggestions, setSuggestions] = useState<Record<string, MapplsSuggestion>>({});
  const [suggesting, setSuggesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const booth: BoothProps | undefined = rows[idx];

  useEffect(() => {
    setPlacements(loadPlacements(acNo));
    loadSuggestions(acNo, appBasePath()).then(setSuggestions);
  }, [acNo]);

  // When the booth changes, seed the pin: saved placement > Mappls suggestion > NIC pin
  useEffect(() => {
    if (!booth) return;
    const p = placements[booth.booth_no];
    const s = suggestions[String(booth.booth_no)];
    const start = p
      ? { lat: p.lat, lng: p.lng }
      : s && s.in_envelope && s.lat != null && s.lng != null
        ? { lat: s.lat, lng: s.lng }
        : { lat: booth.lat, lng: booth.lng };
    setPos(start);
    setMsg(null);
    mapRef?.flyTo({ center: [start.lng, start.lat], zoom: 16, duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, booth?.booth_no, mapRef, suggestions]);

  const placedCount = Object.keys(placements).length;

  const go = useCallback(
    (d: number) => setIdx((i) => Math.min(rows.length - 1, Math.max(0, i + d))),
    [rows.length]
  );

  const nextUnplaced = useCallback(() => {
    for (let k = 1; k <= rows.length; k++) {
      const j = (idx + k) % rows.length;
      if (!placements[rows[j].booth_no]) {
        setIdx(j);
        return;
      }
    }
    setMsg("All booths placed 🎉");
  }, [idx, rows, placements]);

  const save = useCallback(() => {
    if (!booth || !pos) return;
    const next = savePlacement(acNo, {
      booth_no: booth.booth_no,
      lat: pos.lat,
      lng: pos.lng,
      source: "eci_annex",
      confidence: "high",
      updated_at: new Date().toISOString(),
    });
    setPlacements(next);
    setMsg(`Saved booth ${booth.booth_no}`);
    setTimeout(nextUnplaced, 250);
  }, [booth, pos, acNo, nextUnplaced]);

  const useMappls = useCallback(() => {
    if (!booth) return;
    const s = suggestions[String(booth.booth_no)];
    if (s && s.lat != null && s.lng != null) {
      setPos({ lat: s.lat, lng: s.lng });
      mapRef?.flyTo({ center: [s.lng, s.lat], zoom: 16, duration: 700 });
      setMsg(
        `Mappls: ${s.geocode_level ?? "match"}${s.in_envelope === false ? " (outside AC — verify)" : ""}`
      );
    } else {
      setMsg("No saved suggestion — try the live lookup");
    }
  }, [booth, suggestions, mapRef]);

  // Live in-browser geocode via the Mappls Web SDK (works with the static key).
  const liveSuggest = useCallback(async () => {
    if (!booth) return;
    if (!MAPPLS_KEY) {
      setMsg("Add NEXT_PUBLIC_MAPPLS_KEY to web/.env.local");
      return;
    }
    setSuggesting(true);
    setMsg("Asking Mappls…");
    const addr = [booth.ps_name, booth.village, booth.tehsil, "Bihar", booth.pin]
      .filter(Boolean)
      .join(", ");
    const res = await geocodeMappls(MAPPLS_KEY, addr);
    setSuggesting(false);
    if ("lat" in res) {
      setPos(res);
      mapRef?.flyTo({ center: [res.lng, res.lat], zoom: 16, duration: 700 });
      setMsg("Mappls placed — verify against the annex, then Save");
    } else {
      setMsg(`Mappls: ${res.error}`);
    }
  }, [booth, mapRef]);

  const onDragEnd = useCallback((e: MarkerDragEvent) => {
    setPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }, []);

  const boothPanels = booth ? manifest[String(booth.booth_no)] ?? [] : [];
  const imgUrl = (panel: string) =>
    `${appBasePath()}/booth_assets/ac-${acNo}/booth-number-${booth!.booth_no}/${panel}.webp`;
  const hasMap = boothPanels.includes("google_map");

  if (!unlocked) {
    return (
      <PasswordDialog
        open
        title="Placement mode"
        message="Enter the placement password to edit authoritative booth locations."
        onConfirm={(pw) => {
          if (pw === PLACE_PASS) setUnlocked(true);
          else setMsg("Wrong password");
        }}
        onCancel={() => history.back()}
        error={msg}
      />
    );
  }

  if (!booth) return null;
  const placed = !!placements[booth.booth_no];

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-3 py-2 text-sm">
        <span className="font-semibold">
          {meta.constituency.name} · Placement
        </span>
        <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-xs text-emerald-200">
          {placedCount}/{rows.length} placed
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setBasemap((b) => (b === "satellite" ? "streets" : "satellite"))}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
          >
            {basemap === "satellite" ? "Satellite" : "Streets"}
          </button>
          <button
            onClick={() => exportPlacements(acNo)}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Export ({placedCount})
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Reference pane */}
        <div className="flex w-full shrink-0 flex-col gap-2 overflow-auto border-b border-zinc-800 p-3 md:w-80 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <button onClick={() => go(-1)} className="rounded px-2 py-1 text-lg hover:bg-zinc-800">‹</button>
            <div className="text-center">
              <div className="text-lg font-bold">Booth {booth.booth_no}</div>
              <div className="text-xs text-zinc-400">{idx + 1} / {rows.length}</div>
            </div>
            <button onClick={() => go(1)} className="rounded px-2 py-1 text-lg hover:bg-zinc-800">›</button>
          </div>

          <div className="rounded-lg bg-zinc-900 px-2.5 py-2 text-xs">
            <div className="font-medium text-zinc-100">{booth.ps_name || booth.name}</div>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-zinc-400">
              {booth.village && <span className="rounded bg-zinc-800 px-1.5 py-0.5">{booth.village}</span>}
              {booth.tehsil && <span className="rounded bg-zinc-800 px-1.5 py-0.5">{booth.tehsil}</span>}
              {booth.pin && <span className="rounded bg-zinc-800 px-1.5 py-0.5">PIN {booth.pin}</span>}
            </div>
          </div>

          {/* ECI annex reference: the Google-map pin + the building photo */}
          {hasMap ? (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                ECI map (place pin to match)
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl("google_map")} alt="ECI Google map" className="w-full rounded-lg border border-zinc-800" />
            </div>
          ) : (
            <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-2.5 py-2 text-[11px] text-amber-200">
              No ECI map for this booth — use the building photo + village and place your best estimate.
            </div>
          )}
          {boothPanels.includes("ps_building_front") && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Building</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl("ps_building_front")} alt="Building" className="w-full rounded-lg border border-zinc-800" />
            </div>
          )}

          <div className="rounded-md border border-sky-800 bg-sky-950/40 px-2 py-1.5 text-[11px]">
            {(() => {
              const s = suggestions[String(booth.booth_no)];
              return s && s.lat != null ? (
                <div className="mb-1 flex items-center justify-between text-sky-200">
                  <span>
                    Saved: {s.geocode_level ?? "match"}
                    {s.in_envelope === false ? " · outside AC" : ""}
                  </span>
                  <button
                    onClick={useMappls}
                    className="rounded bg-sky-800 px-1.5 py-0.5 text-white hover:bg-sky-700"
                  >
                    use
                  </button>
                </div>
              ) : null;
            })()}
            <button
              onClick={liveSuggest}
              disabled={suggesting}
              className="w-full rounded bg-sky-700 px-2 py-1 font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {suggesting ? "Asking Mappls…" : "Suggest via Mappls"}
            </button>
          </div>
        </div>

        {/* Map pane */}
        <div className="relative min-h-0 flex-1">
          <MapGL
            ref={setMapRef}
            initialViewState={{ longitude: booth.lng, latitude: booth.lat, zoom: 15 }}
            mapStyle={BASEMAPS[basemap].style as string}
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="bottom-right" showCompass={false} />
            {pos && (
              <Marker longitude={pos.lng} latitude={pos.lat} draggable onDragEnd={onDragEnd} anchor="bottom">
                <div className="flex flex-col items-center">
                  <div className="rounded-full border-2 border-white bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                    {booth.booth_no}
                  </div>
                  <div className="h-3 w-0.5 bg-white" />
                </div>
              </Marker>
            )}
          </MapGL>

          {/* Action bar */}
          <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-black/85 px-2 py-1.5 shadow-xl">
            <button onClick={() => go(-1)} className="rounded-full px-3 py-1 text-sm hover:bg-zinc-800">Prev</button>
            <button
              onClick={save}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              {placed ? "Update pin" : "Save pin"}
            </button>
            <button onClick={nextUnplaced} className="rounded-full px-3 py-1 text-sm hover:bg-zinc-800">Skip</button>
          </div>

          {msg && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/85 px-3 py-1 text-xs text-emerald-200 shadow-lg">
              {msg}
            </div>
          )}
          {placed && (
            <div className="absolute right-3 top-3 rounded-full bg-emerald-900/80 px-2.5 py-1 text-xs text-emerald-100">
              ✓ placed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
