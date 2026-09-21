"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  loadAcSeries,
  loadBoothMatches,
  loadElections,
  loadPlaceSeries,
} from "@/lib/historyLoad";
import {
  buildFocusOptions,
  type FocusOption,
} from "@/lib/historyFocus";
import type {
  AcSeries,
  BoothMatches,
  ElectionPackage,
  PlaceSeries,
} from "@/lib/historyTypes";
import { buildQuery, parseHistoryShare } from "@/lib/shareUrl";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayAcName,
  displayCandidateName,
} from "@/lib/i18n/displayNames";
import { BoothHistoryPanel } from "./BoothHistoryPanel";
import { HistoryOverview } from "./HistoryOverview";
import { PlaceSwingPanel } from "./PlaceSwingPanel";

type Tab = "overview" | "booth" | "place";

type Props = {
  acNo: number;
  acName: string;
  electionsAvailable: number[];
};

export function HistoryWorkspace({
  acNo,
  acName,
  electionsAvailable,
}: Props) {
  const { locale, t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const parsed = useMemo(
    () => parseHistoryShare(searchParams),
    [searchParams]
  );

  const [tab, setTab] = useState<Tab>(
    parsed.tab || (parsed.booth ? "booth" : parsed.place ? "place" : "overview")
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<AcSeries | null>(null);
  const [matches, setMatches] = useState<BoothMatches | null>(null);
  const [placeSeries, setPlaceSeries] = useState<PlaceSeries | null>(null);
  const [elections, setElections] = useState<Record<number, ElectionPackage>>(
    {}
  );
  const [focusKey, setFocusKey] = useState(
    parsed.focus || "anant_kumar_singh"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, m, p] = await Promise.all([
          loadAcSeries(acNo),
          loadBoothMatches(acNo),
          loadPlaceSeries(acNo),
        ]);
        if (cancelled) return;
        if (!s) {
          setError("history.error");
          setLoading(false);
          return;
        }
        setSeries(s);
        setMatches(m);
        setPlaceSeries(p);
        if (!parsed.focus) {
          setFocusKey(s.focus_key || "anant_kumar_singh");
        }

        const years = s.years.map((y) => y.year);
        const pkgs = await loadElections(acNo, years);
        if (!cancelled) setElections(pkgs);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "history.failed"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acNo]);

  // URL → state
  useEffect(() => {
    const p = parseHistoryShare(searchParams);
    if (p.tab) setTab(p.tab);
    else if (p.booth) setTab("booth");
    else if (p.place) setTab("place");
    if (p.focus) setFocusKey(p.focus);
  }, [searchParams]);

  const focusOptions = useMemo(
    () => buildFocusOptions(elections),
    [elections]
  );

  const focus: FocusOption | null = useMemo(() => {
    if (!focusOptions.length) return null;
    return (
      focusOptions.find((c) => c.key === focusKey) || focusOptions[0] || null
    );
  }, [focusOptions, focusKey]);

  useEffect(() => {
    if (!focusOptions.length) return;
    if (!focusOptions.some((c) => c.key === focusKey)) {
      setFocusKey(focusOptions[0].key);
    }
  }, [focusOptions, focusKey]);

  // State → URL (shareable)
  useEffect(() => {
    if (loading) return;
    const boothRaw = searchParams.get("booth");
    const placeRaw = searchParams.get("place");
    const next = buildQuery({
      tab,
      focus: focusKey,
      booth: tab === "booth" && boothRaw ? boothRaw : null,
      place: tab === "place" && placeRaw ? placeRaw : null,
    });
    const cur = searchParams.toString();
    const nextBare = next.startsWith("?") ? next.slice(1) : next;
    if (cur === nextBare) return;
    router.replace(`${pathname}${next}`, { scroll: false });
  }, [tab, focusKey, loading, pathname, router, searchParams]);

  const tabCls = (t: Tab) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      tab === t
        ? "bg-emerald-600 text-white"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const shareParams = {
    tab,
    focus: focusKey,
    booth: tab === "booth" ? searchParams.get("booth") : null,
    place: tab === "place" ? searchParams.get("place") : null,
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              {t("history.title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              AC {acNo} {displayAcName(locale, acName)} ·{" "}
              {electionsAvailable.join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {focusOptions.length > 0 && focus && (
              <label className="flex w-full max-w-xs flex-col gap-1 text-xs font-medium text-zinc-500 sm:w-56">
                {t("history.focus")}
                <select
                  value={focus.key}
                  onChange={(e) => setFocusKey(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  {focusOptions.map((c) => (
                    <option key={c.key} value={c.key}>
                      {displayCandidateName(locale, c.key, c.name)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <ShareLinkButton params={shareParams} compact />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            className={tabCls("overview")}
            onClick={() => setTab("overview")}
          >
            {t("history.overview")}
          </button>
          <button
            type="button"
            className={tabCls("booth")}
            onClick={() => setTab("booth")}
          >
            {t("history.booth")}
          </button>
          <button
            type="button"
            className={tabCls("place")}
            onClick={() => setTab("place")}
          >
            {t("history.place")}
          </button>
        </div>

        {loading && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            {t("history.loading")}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
            {error.startsWith("history.") ? t(error) : error}
          </div>
        )}

        {!loading && !error && series && focus && tab === "overview" && (
          <HistoryOverview
            series={series}
            elections={elections}
            focus={focus}
          />
        )}

        {!loading && !error && tab === "booth" && matches && focus && (
          <BoothHistoryPanel
            acNo={acNo}
            matches={matches}
            elections={elections}
            focus={focus}
            initialBooth={
              parsed.booth && !Number.isNaN(parsed.booth) ? parsed.booth : null
            }
          />
        )}

        {!loading &&
          !error &&
          tab === "place" &&
          placeSeries &&
          matches &&
          focus && (
            <PlaceSwingPanel
              acNo={acNo}
              placeSeries={placeSeries}
              matches={matches}
              elections={elections}
              focus={focus}
              initialPlace={parsed.place}
            />
          )}

        <p className="mt-8 text-[11px] leading-relaxed text-zinc-500">
          {t("history.footer")}
        </p>
      </div>
    </div>
  );
}
