"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { BoothProps, Candidate } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayCandidateName,
  displayPlaceName,
  displayPsName,
  displayVillageName,
} from "@/lib/i18n/displayNames";
import { BoothAssets } from "./BoothAssets";
import { BoothIntelligence } from "./BoothIntelligence";
import { PartyLabel } from "./PartyLabel";

type Props = {
  booth: BoothProps;
  candidates: Candidate[];
  acGrandTotal: number;
  acNo: number;
  electionYear?: number;
  onClose: () => void;
  onMoveBooth?: () => void;
};

type Snap = "peek" | "full";

const PEEK_VH = 52;
const FULL_VH = 92;

/**
 * Mobile bottom sheet:
 * - Thin drag chrome only (handle + title + actions)
 * - ALL content (PS info, electors, candidates) scrolls
 * - Blocks pull-to-refresh while open
 */
export function MobileBoothSheet({
  booth,
  candidates,
  acGrandTotal,
  acNo,
  electionYear,
  onClose,
  onMoveBooth,
}: Props) {
  const { locale, t } = useLanguage();
  const [snap, setSnap] = useState<Snap>("peek");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startY = useRef(0);
  const startSnap = useRef<Snap>("peek");
  const draggingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetGesture = useRef(false);

  useEffect(() => {
    setSnap("peek");
    setDragY(0);
    setDragging(false);
    draggingRef.current = false;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [booth.booth_no]);

  // Lock page overscroll / pull-to-refresh while sheet is open
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    html.classList.add("kshetra-sheet-open");
    body.classList.add("kshetra-sheet-open");
    body.style.top = `-${scrollY}px`;

    const blockRefresh = (e: TouchEvent) => {
      if (!sheetRef.current) return;
      if (sheetRef.current.contains(e.target as Node)) {
        if (sheetGesture.current || draggingRef.current) {
          e.preventDefault();
          return;
        }
        // Allow scroll inside content; block only overscroll-at-top pull
        const sc = scrollRef.current;
        if (sc && sc.scrollTop <= 0) {
          // only prevent if gesture is downward (refresh direction)
          // handled in onBodyTouchMove with preventDefault when resizing
        }
      } else {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", blockRefresh, { passive: false });

    return () => {
      html.classList.remove("kshetra-sheet-open");
      body.classList.remove("kshetra-sheet-open");
      body.style.top = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", blockRefresh);
    };
  }, []);

  const rows = candidates
    .map((c) => ({
      ...c,
      name: displayCandidateName(locale, c.key, c.name),
      votes: booth.votes[c.key] ?? 0,
      pct: booth.pct[c.key] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const top = rows[0];
  const targetVh = snap === "full" ? FULL_VH : PEEK_VH;
  const placeLine =
    displayPsName(locale, booth.ps_name, booth.booth_no) ||
    displayVillageName(locale, booth.village, booth.booth_no) ||
    displayPlaceName(locale, booth.nearest_place) ||
    t("booth.pollingStation");

  const beginSheetDrag = useCallback(
    (clientY: number) => {
      startY.current = clientY;
      startSnap.current = snap;
      sheetGesture.current = true;
      draggingRef.current = true;
      setDragging(true);
      setDragY(0);
    },
    [snap]
  );

  const moveSheetDrag = useCallback((clientY: number) => {
    if (!draggingRef.current || !sheetGesture.current) return;
    setDragY(clientY - startY.current);
  }, []);

  const endSheetDrag = useCallback(
    (clientY: number) => {
      if (!draggingRef.current) return;
      const dy = clientY - startY.current;
      const vh = window.innerHeight || 800;
      const threshold = Math.min(72, vh * 0.09);

      draggingRef.current = false;
      sheetGesture.current = false;
      setDragging(false);
      setDragY(0);

      if (startSnap.current === "peek") {
        if (dy < -threshold) setSnap("full");
        else if (dy > threshold) onClose();
      } else {
        if (dy > threshold * 1.3) setSnap("peek");
        else if (dy > threshold * 2.6) onClose();
      }
    },
    [onClose]
  );

  const onHeaderPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a,input")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    beginSheetDrag(e.clientY);
  };

  const onHeaderPointerMove = (e: ReactPointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    moveSheetDrag(e.clientY);
  };

  const onHeaderPointerUp = (e: ReactPointerEvent) => {
    if (!draggingRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
    endSheetDrag(e.clientY);
  };

  // Content: scroll freely; only start sheet-drag when at top + pulling down
  const onBodyTouchStart = (e: ReactTouchEvent) => {
    const y = e.touches[0]?.clientY;
    if (y == null) return;
    startY.current = y;
    startSnap.current = snap;
    sheetGesture.current = false;
    draggingRef.current = false;
  };

  const onBodyTouchMove = (e: ReactTouchEvent) => {
    const y = e.touches[0]?.clientY;
    if (y == null) return;
    const sc = scrollRef.current;
    const dy = y - startY.current;

    if (sheetGesture.current) {
      e.preventDefault();
      moveSheetDrag(y);
      return;
    }

    // At top of scroll + pull down → resize/close sheet (not page refresh)
    if (sc && sc.scrollTop <= 0 && dy > 10) {
      sheetGesture.current = true;
      draggingRef.current = true;
      setDragging(true);
      e.preventDefault();
      moveSheetDrag(y);
    }
  };

  const onBodyTouchEnd = (e: ReactTouchEvent) => {
    const y = e.changedTouches[0]?.clientY ?? startY.current;
    if (sheetGesture.current || draggingRef.current) {
      endSheetDrag(y);
    }
  };

  const liveHeight =
    dragging && typeof window !== "undefined"
      ? Math.min(
          FULL_VH,
          Math.max(32, targetVh - (dragY / window.innerHeight) * 100)
        )
      : targetVh;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
      <div
        className={`pointer-events-auto absolute inset-0 transition-colors ${
          snap === "full" || (dragging && dragY < 0)
            ? "bg-black/45"
            : "bg-black/25"
        }`}
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("booth.detailsAria", { n: booth.booth_no })}
        className={`pointer-events-auto relative z-10 flex w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950 ${
          dragging ? "" : "transition-[height] duration-300 ease-out"
        }`}
        style={{
          height: `${liveHeight}dvh`,
          maxHeight: "92dvh",
          overscrollBehavior: "none",
        }}
      >
        {/* ===== Compact drag chrome only (not the intelligence blocks) ===== */}
        <div
          className="shrink-0 select-none border-b border-zinc-100 dark:border-zinc-800"
          style={{ touchAction: "none" }}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          <div className="flex flex-col items-center px-4 pt-2.5 pb-1">
            <div className="mb-1 flex h-7 w-full items-center justify-center">
              <div className="h-1.5 w-14 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 px-4 pb-2.5">
            <div className="min-w-0">
              <div className="kshetra-ui-hi text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                {t("booth.booth", { n: booth.booth_no })}
                {electionYear != null && (
                  <span className="ml-2 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    · {electionYear}
                  </span>
                )}
              </div>
              <div className="kshetra-ui-hi truncate text-sm text-zinc-500">
                {placeLine}
                {booth.match_confidence &&
                  booth.match_confidence !== "high" && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}
                      ·{" "}
                      {booth.match_confidence === "unmatched"
                        ? t("booth.noMatch")
                        : t("booth.approx")}
                    </span>
                  )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/ac/${acNo}/history?booth=${booth.booth_no}`}
                onClick={(e) => e.stopPropagation()}
                className="flex h-9 items-center rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 text-xs font-semibold text-emerald-300"
              >
                {t("booth.historyShort")}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSnap((s) => (s === "peek" ? "full" : "peek"));
                }}
                className="flex h-9 items-center rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white active:bg-emerald-700"
              >
                {snap === "peek" ? t("booth.fullExpand") : t("booth.lessCollapse")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ===== Everything below scrolls ===== */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          }}
          onTouchStart={onBodyTouchStart}
          onTouchMove={onBodyTouchMove}
          onTouchEnd={onBodyTouchEnd}
          onTouchCancel={onBodyTouchEnd}
        >
          <div className="px-4 pt-3 pb-2">
            {top && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 dark:bg-zinc-900">
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-800"
                  style={{ backgroundColor: booth.winner_color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="kshetra-ui-hi truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {displayCandidateName(
                      locale,
                      booth.winner_key,
                      booth.winner_name
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    <PartyLabel party={booth.winner_party} size="xs" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold tabular-nums text-zinc-900 dark:text-white">
                    {booth.winner_votes.toLocaleString()}
                  </div>
                  <div className="text-xs tabular-nums text-zinc-500">
                    {booth.winner_pct}%
                  </div>
                </div>
              </div>
            )}

            <BoothIntelligence
              booth={booth}
              acGrandTotal={acGrandTotal}
              variant="full"
            />
          </div>

          <BoothAssets
            acNo={acNo}
            boothNo={booth.booth_no}
            className="mx-4 mb-3"
          />

          <div className="mx-4 mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-zinc-50 py-2.5 dark:bg-zinc-900">
              <div className="kshetra-ui-hi text-[10px] font-medium text-zinc-400">
                {t("booth.totalValid")}
              </div>
              <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                {booth.total_valid.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 py-2.5 dark:bg-zinc-900">
              <div className="kshetra-ui-hi text-[10px] font-medium text-zinc-400">
                {t("booth.nota")}
              </div>
              <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                {booth.nota.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 py-2.5 dark:bg-zinc-900">
              <div className="kshetra-ui-hi text-[10px] font-medium text-zinc-400">
                {t("booth.margin")}
              </div>
              <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                {booth.margin.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <div className="kshetra-ui-hi mb-2 text-[10px] font-semibold text-zinc-400">
              {t("booth.candidates")}
            </div>
            <ul className="space-y-2.5 pb-2">
              {rows.map((r, i) => (
                <li key={r.key} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-center text-[11px] tabular-nums text-zinc-400">
                    {i + 1}
                  </span>
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="kshetra-ui-hi block truncate text-zinc-800 dark:text-zinc-100">
                      {r.name}
                    </span>
                    <PartyLabel
                      party={r.party}
                      size="xs"
                      className="mt-0.5 text-zinc-500"
                    />
                  </span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                    {r.votes.toLocaleString()}
                  </span>
                  <span className="w-10 text-right tabular-nums text-zinc-400">
                    {r.pct.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {booth.accuracy_note && (
            <div className="px-4 pb-3 text-[10px] text-zinc-400">
              {booth.accuracy_note}
            </div>
          )}

          {/* Spacer so last content clears the sticky footer */}
          <div className="h-4" />
        </div>

        {onMoveBooth && (
          <div className="shrink-0 border-t border-zinc-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={onMoveBooth}
              className="kshetra-ui-hi w-full rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              {t("booth.moveBooth")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
