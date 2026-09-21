"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { AreaListItem, StrengthThresholds } from "@/lib/boothStrength";
import type { MapSettings, StrengthFilter } from "@/lib/types";
import { useT } from "@/lib/i18n/LanguageProvider";
import { CandidateStrengthBrief } from "./CandidateStrengthBrief";

type Stats = { strong: number; average: number; weak: number; na: number };

type Props = {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  /** Desktop: filters rail width so we dock to its right */
  filtersOpen?: boolean;
  memberName: string;
  electionYear: number;
  stats: Stats;
  areas: AreaListItem[];
  settings: MapSettings;
  onSettingsChange: (patch: Partial<MapSettings>) => void;
  onSelectArea: (place: string, boothNos: number[]) => void;
  onGoBooth: (n: number) => void;
};

type Snap = "peek" | "full";

const PEEK_VH = 48;
const FULL_VH = 90;

function useSheetBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    html.classList.add("kshetra-sheet-open");
    body.classList.add("kshetra-sheet-open");
    body.style.top = `-${scrollY}px`;

    const blockRefresh = (e: TouchEvent) => {
      // Block pull-to-refresh outside sheet; sheet handles its own gestures
      const t = e.target as Node | null;
      if (!t) return;
      const sheet = document.getElementById("my-areas-sheet");
      if (sheet && sheet.contains(t)) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", blockRefresh, { passive: false });

    return () => {
      html.classList.remove("kshetra-sheet-open");
      body.classList.remove("kshetra-sheet-open");
      body.style.top = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", blockRefresh);
    };
  }, [active]);
}

function AdvancedThresholds({
  settings,
  onSettingsChange,
}: {
  settings: MapSettings;
  onSettingsChange: (patch: Partial<MapSettings>) => void;
}) {
  const t = useT();
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="kshetra-ui-hi flex w-full items-center justify-between py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <span>{t("strengthUi.thresholds")}</span>
        <span className="text-zinc-500">{showAdvanced ? "▴" : "▾"}</span>
      </button>
      {showAdvanced && (
        <div className="space-y-1 pb-1">
          <label className="flex flex-col gap-1 py-1">
            <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-200">
              <span className="kshetra-ui-hi">{t("strengthUi.strongIf")}</span>
              <span className="tabular-nums font-medium text-zinc-900 dark:text-white">
                {settings.strengthStrongMin}%
              </span>
            </div>
            <input
              type="range"
              min={40}
              max={70}
              step={5}
              value={settings.strengthStrongMin}
              onChange={(e) =>
                onSettingsChange({
                  strengthStrongMin: Number(e.target.value),
                })
              }
              className="h-1.5 w-full cursor-pointer accent-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 py-1">
            <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-200">
              <span className="kshetra-ui-hi">{t("strengthUi.weakIf")}</span>
              <span className="tabular-nums font-medium text-zinc-900 dark:text-white">
                {settings.strengthWeakMax}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={45}
              step={5}
              value={settings.strengthWeakMax}
              onChange={(e) =>
                onSettingsChange({
                  strengthWeakMax: Number(e.target.value),
                })
              }
              className="h-1.5 w-full cursor-pointer accent-emerald-500"
            />
          </label>
          <label className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
            <div className="min-w-0">
              <div className="kshetra-ui-hi text-sm text-zinc-900 dark:text-white">
                {t("strengthUi.colourPlaces")}
              </div>
              <div className="kshetra-ui-hi text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                {t("strengthUi.colourPlacesDesc")}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.showAreaStrength}
              onClick={() =>
                onSettingsChange({
                  showAreaStrength: !settings.showAreaStrength,
                })
              }
              className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
                settings.showAreaStrength ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  settings.showAreaStrength ? "translate-x-4" : ""
                }`}
              />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}

function BriefingBody({
  memberName,
  electionYear,
  stats,
  areas,
  settings,
  onSettingsChange,
  onSelectArea,
  onGoBooth,
}: {
  memberName: string;
  electionYear: number;
  stats: Stats;
  areas: AreaListItem[];
  settings: MapSettings;
  onSettingsChange: (patch: Partial<MapSettings>) => void;
  onSelectArea: (place: string, boothNos: number[]) => void;
  onGoBooth: (n: number) => void;
}) {
  const thresholds: StrengthThresholds = {
    strongMin: settings.strengthStrongMin,
    weakMax: settings.strengthWeakMax,
    strongRequiresWin: true,
  };
  return (
    <>
      <CandidateStrengthBrief
        memberName={memberName}
        electionYear={electionYear}
        stats={stats}
        areas={areas}
        thresholds={thresholds}
        strengthFilter={settings.strengthFilter}
        onFilterChange={(strengthFilter: StrengthFilter) =>
          onSettingsChange({ strengthFilter })
        }
        onSelectArea={onSelectArea}
        onGoBooth={onGoBooth}
      />
      <AdvancedThresholds
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}

/**
 * Mobile bottom sheet with fluid drag:
 * - Header / handle: always drags sheet (peek ↔ full ↔ close)
 * - Body: scroll content; pull-down at top resizes sheet
 */
function MyAreasMobileSheet({
  onClose,
  memberName,
  electionYear,
  children,
}: {
  onClose: () => void;
  memberName: string;
  electionYear: number;
  children: ReactNode;
}) {
  const t = useT();
  const [snap, setSnap] = useState<Snap>("peek");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startY = useRef(0);
  const startSnap = useRef<Snap>("peek");
  const draggingRef = useRef(false);
  const sheetGesture = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useSheetBodyLock(true);

  useEffect(() => {
    setSnap("peek");
    setDragY(0);
    setDragging(false);
    draggingRef.current = false;
    sheetGesture.current = false;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [memberName, electionYear]);

  const targetVh = snap === "full" ? FULL_VH : PEEK_VH;

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
      const threshold = Math.min(64, vh * 0.08);

      draggingRef.current = false;
      sheetGesture.current = false;
      setDragging(false);
      setDragY(0);

      if (startSnap.current === "peek") {
        if (dy < -threshold) setSnap("full");
        else if (dy > threshold) onClose();
      } else {
        // full
        if (dy > threshold * 2.4) onClose();
        else if (dy > threshold) setSnap("peek");
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
      /* ignore */
    }
    endSheetDrag(e.clientY);
  };

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

    // At top of scroll + pull down → resize / close sheet
    if (sc && sc.scrollTop <= 0 && dy > 8) {
      sheetGesture.current = true;
      draggingRef.current = true;
      setDragging(true);
      e.preventDefault();
      moveSheetDrag(y);
      return;
    }

    // At top of scroll + pull up from peek → expand to full
    if (sc && sc.scrollTop <= 0 && dy < -12 && snap === "peek") {
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
          Math.max(28, targetVh - (dragY / window.innerHeight) * 100)
        )
      : targetVh;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end">
      <div
        className={`pointer-events-auto absolute inset-0 transition-colors ${
          snap === "full" || (dragging && dragY < 0)
            ? "bg-black/50"
            : "bg-black/30"
        }`}
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden
      />

      <div
        id="my-areas-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("myAreas.briefingAria")}
        className={`pointer-events-auto relative z-10 flex w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-300 border-b-0 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950 ${
          dragging ? "" : "transition-[height] duration-300 ease-out"
        }`}
        style={{
          height: `${liveHeight}dvh`,
          maxHeight: "92dvh",
          overscrollBehavior: "none",
        }}
      >
        {/* Drag chrome — always resizes sheet */}
        <div
          className="shrink-0 select-none border-b border-zinc-200 dark:border-zinc-800"
          style={{ touchAction: "none" }}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          <div className="flex flex-col items-center px-3 pt-2.5 pb-1">
            <div className="mb-1 flex h-7 w-full items-center justify-center">
              <div className="h-1.5 w-14 rounded-full bg-zinc-500" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 px-3 pb-2.5">
            <div className="min-w-0">
              <div className="kshetra-ui-hi text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {t("myAreas.title")}
              </div>
              <div className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {memberName}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t("myAreas.dragHint", { year: electionYear })}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSnap((s) => (s === "peek" ? "full" : "peek"));
                }}
                className="flex h-9 items-center rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white active:bg-emerald-700"
              >
                {snap === "peek"
                  ? t("booth.fullExpand")
                  : t("booth.lessCollapse")}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-base text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                aria-label={t("common.close")}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content — pull at top resizes sheet */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          }}
          onTouchStart={onBodyTouchStart}
          onTouchMove={onBodyTouchMove}
          onTouchEnd={onBodyTouchEnd}
          onTouchCancel={onBodyTouchEnd}
        >
          {children}
          <div className="h-6 pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Candidate briefing panel — separate from Filters.
 * Desktop: docks to the right of the controls rail.
 * Mobile: draggable bottom sheet (peek / full / dismiss).
 */
export function MyAreasPanel({
  open,
  onClose,
  isMobile,
  filtersOpen = true,
  memberName,
  electionYear,
  stats,
  areas,
  settings,
  onSettingsChange,
  onSelectArea,
  onGoBooth,
}: Props) {
  const t = useT();
  const body = (
    <BriefingBody
      memberName={memberName}
      electionYear={electionYear}
      stats={stats}
      areas={areas}
      settings={settings}
      onSettingsChange={onSettingsChange}
      onSelectArea={onSelectArea}
      onGoBooth={onGoBooth}
    />
  );

  /* ---------- Mobile: draggable bottom sheet ---------- */
  if (isMobile) {
    if (!open) return null;
    return (
      <MyAreasMobileSheet
        onClose={onClose}
        memberName={memberName}
        electionYear={electionYear}
      >
        {body}
      </MyAreasMobileSheet>
    );
  }

  /* ---------- Desktop: dock right of filters ---------- */
  if (!open) return null;

  const leftClass = filtersOpen
    ? "left-[min(100vw-22rem,20.5rem)]"
    : "left-0";

  return (
    <aside
      className={`pointer-events-auto absolute top-0 bottom-0 z-[15] flex w-[min(100vw-22rem,21rem)] max-w-[21rem] flex-col border-r border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${leftClass} translate-x-0`}
      aria-label={t("myAreas.briefingAria")}
    >
      <header className="shrink-0 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="kshetra-ui-hi text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {t("myAreas.title")}
            </div>
            <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {memberName}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t("myAreas.subtitle", { year: electionYear })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            title={t("common.close")}
          >
            {t("common.close")}
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {body}
      </div>
    </aside>
  );
}

/**
 * Compact chip / bar to re-open My areas.
 * Desktop: sits BELOW the white Controls tab (not stacked on the same spot).
 * Only rendered when filters are closed (parent controls visibility).
 */
export function MyAreasOpenChip({
  visible,
  stats,
  onOpen,
  isMobile,
  filtersOpen,
}: {
  visible: boolean;
  stats: Stats;
  onOpen: () => void;
  isMobile: boolean;
  filtersOpen?: boolean;
}) {
  if (!visible) return null;

  const label = `${stats.strong}S · ${stats.average}C · ${stats.weak}W`;

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-600/50 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-xl active:scale-95 dark:border-emerald-700/70 dark:bg-zinc-950 dark:text-white"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        My areas
        <span className="tabular-nums text-xs text-emerald-700 dark:text-emerald-300/90">
          {label}
        </span>
      </button>
    );
  }

  // Desktop edge tab — below Controls (which is at top-1/2). Match light chrome.
  const left = filtersOpen
    ? "left-[min(100vw-22rem,20.5rem)]"
    : "left-0";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`pointer-events-auto absolute top-[calc(50%+3.25rem)] z-[15] flex flex-col items-center gap-1.5 rounded-r-xl border border-l-0 border-zinc-300 bg-white px-1.5 py-3 text-emerald-800 shadow-xl transition hover:bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/95 dark:text-emerald-100 dark:hover:bg-emerald-900 ${left}`}
      title="Open My areas briefing"
    >
      <span className="text-sm leading-none text-emerald-600 dark:text-emerald-200">
        ›
      </span>
      <span
        className="text-[10px] font-semibold tracking-widest text-emerald-700 dark:text-emerald-100"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        MY AREAS
      </span>
      <span
        className="text-[9px] tabular-nums text-emerald-600/80 dark:text-emerald-300/80"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {label}
      </span>
    </button>
  );
}
