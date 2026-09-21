"use client";

import { useMemo, useState } from "react";
import type { BoothProps, PlaceProps } from "@/lib/types";
import {
  locationSuggestions,
  resolveLocationFilter,
  type BoothSearchHit,
  type PlaceSearchHit,
} from "@/lib/boothSearch";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayPlaceName } from "@/lib/i18n/displayNames";

export type PlaceWithCoords = PlaceProps & { lat: number; lng: number };

type Props = {
  booths: BoothProps[];
  places?: PlaceWithCoords[];
  onSelectBooth: (boothNo: number) => void;
  onFilterChange?: (boothNos: number[] | null) => void;
  /** Fly map to real place center when a landmark matches */
  onSelectPlace?: (place: PlaceWithCoords) => void;
  dark?: boolean;
};

function boothSubtitle(b: BoothProps): string {
  const bits = [
    b.ps_name && b.ps_name.length > 6 ? b.ps_name : null,
    b.village || b.nearest_place,
    b.pin ? `PIN ${b.pin}` : null,
  ].filter(Boolean);
  return bits.join(" · ") || b.name;
}

export function LocationSearch({
  booths,
  places = [],
  onSelectBooth,
  onFilterChange,
  onSelectPlace,
  dark = true,
}: Props) {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);

  const suggestions = useMemo(
    () => locationSuggestions(booths, places, 24),
    [booths, places]
  );

  const resolved = useMemo(() => {
    if (!query.trim()) {
      return {
        boothNos: [] as number[],
        placeHits: [] as PlaceSearchHit[],
        boothHits: [] as BoothSearchHit[],
      };
    }
    return resolveLocationFilter(booths, places, query, 250);
  }, [booths, places, query]);

  const hits = resolved.boothHits.slice(0, 60);
  const placeHits = resolved.placeHits;

  // Group top booth hits by village / place for deeper browse
  const byVillage = useMemo(() => {
    const m = new Map<string, BoothSearchHit[]>();
    for (const h of hits) {
      const key =
        (h.booth.village || h.booth.nearest_place || "Other").trim() || "Other";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(h);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [hits]);

  const inputCls = dark
    ? "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
    : "w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500";

  function applyQuery(q: string) {
    setQuery(q);
    setActive(true);
    if (!q.trim()) {
      onFilterChange?.(null);
      return;
    }
    const r = resolveLocationFilter(booths, places, q, 250);
    onFilterChange?.(r.boothNos.length ? r.boothNos : []);
  }

  function clear() {
    setQuery("");
    setActive(false);
    onFilterChange?.(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex gap-1.5">
        <input
          type="search"
          value={query}
          onChange={(e) => applyQuery(e.target.value)}
          onFocus={() => setActive(true)}
          placeholder={t("search.placeholder")}
          className={inputCls}
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className={
              dark
                ? "shrink-0 rounded-lg border border-zinc-700 px-2.5 text-xs text-zinc-300 hover:bg-zinc-800"
                : "shrink-0 rounded-lg border border-zinc-300 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100"
            }
          >
            {t("search.clear")}
          </button>
        )}
      </div>

      {!query && (
        <div className="flex flex-wrap gap-1">
          {suggestions.slice(0, 14).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => applyQuery(s)}
              className={
                dark
                  ? "rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 hover:border-emerald-600 hover:text-emerald-300"
                  : "rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 hover:border-emerald-600 hover:text-emerald-700"
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {query.trim() && (
        <div className="text-[11px] text-zinc-400">
          {resolved.boothNos.length === 0
            ? t("search.noMatch")
            : resolved.boothNos.length === 1
              ? t("search.matchCountOne", { hits: hits.length })
              : t("search.matchCount", {
                  n: resolved.boothNos.length,
                  hits: hits.length,
                })}
        </div>
      )}

      {/* Real places first */}
      {active && placeHits.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400/90">
            {t("search.places")}
          </div>
          <ul className="max-h-36 space-y-0.5 overflow-y-auto rounded-lg border border-sky-900/50 bg-sky-950/40">
            {placeHits.slice(0, 8).map(({ place }) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace?.(place);
                    if (place.booth_nos?.length) {
                      onFilterChange?.(place.booth_nos);
                    }
                  }}
                  className="flex w-full flex-col gap-0.5 px-2.5 py-2 text-left hover:bg-sky-900/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-sky-100">
                      {displayPlaceName(locale, place.name)}
                    </span>
                    <span className="shrink-0 rounded bg-sky-900/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
                      {place.kind === "booth_place" ? "cluster" : place.kind}
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-300/80">
                    {place.lat.toFixed(4)}°N, {place.lng.toFixed(4)}°E
                    {place.booth_count != null
                      ? ` · ~${place.booth_count} booths nearby`
                      : ""}

                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && hits.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {t("search.booths")}
            </span>
            {byVillage.length > 1 && (
              <span className="text-[10px] text-zinc-500">
                {byVillage.length} {t("search.areas")}
              </span>
            )}
          </div>
          <ul
            className={
              dark
                ? "max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/80"
                : "max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-zinc-200 bg-white"
            }
          >
            {hits.map(({ booth, matchedOn, score, why }) => (
              <li key={booth.booth_no}>
                <button
                  type="button"
                  onClick={() => onSelectBooth(booth.booth_no)}
                  className={
                    dark
                      ? "flex w-full flex-col gap-0.5 px-2.5 py-2 text-left hover:bg-zinc-800/80"
                      : "flex w-full flex-col gap-0.5 px-2.5 py-2 text-left hover:bg-zinc-50"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={
                        dark
                          ? "text-sm font-medium text-white"
                          : "text-sm font-medium text-zinc-900"
                      }
                    >
                      {t("booth.booth", { n: booth.booth_no })}
                      {booth.pin ? (
                        <span className="ml-1.5 text-[10px] font-normal tabular-nums text-zinc-500">
                          · {booth.pin}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: booth.winner_color }}
                      title={booth.winner_name}
                    />
                  </div>
                  <span className="line-clamp-2 text-[11px] leading-snug text-zinc-400">
                    {boothSubtitle(booth)}
                  </span>
                  {(matchedOn.length > 0 || why) && (
                    <span className="text-[10px] text-emerald-600/80">
                      {why ||
                        (matchedOn.length
                          ? matchedOn.slice(0, 3).join(" · ")
                          : "")}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Deep browse: area clusters when many hits */}
          {byVillage.length > 1 && hits.length >= 8 && (
            <div className="mt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {t("search.filterByArea")}
              </div>
              <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                {byVillage.slice(0, 12).map(([name, list]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyQuery(name)}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-emerald-700 hover:text-emerald-300"
                    title={`${list.length} booths`}
                  >
                    {name.length > 22 ? name.slice(0, 20) + "…" : name}
                    <span className="ml-1 tabular-nums text-zinc-500">
                      {list.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] leading-snug text-zinc-500">{t("search.hint")}</p>
    </div>
  );
}
