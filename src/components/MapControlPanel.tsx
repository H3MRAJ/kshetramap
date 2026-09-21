"use client";

import type { ReactNode } from "react";
import type {
  BasemapId,
  BoothProps,
  Candidate,
  MapMode,
  MapSettings,
  Meta,
  PlaceProps,
} from "@/lib/types";
import { BASEMAPS, HEAT_BINS } from "@/lib/mapStyles";
import { STRENGTH_COLORS } from "@/lib/boothStrength";
import { useLanguage, useT } from "@/lib/i18n/LanguageProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  displayAcName,
  displayCandidateName,
  displayElectionName,
} from "@/lib/i18n/displayNames";
import { BoothGoto } from "./BoothGoto";
import { LocationSearch } from "./LocationSearch";
import { MemberSelector } from "./MemberSelector";
import { ModeToggle } from "./ModeToggle";
import { PartyLabel } from "./PartyLabel";

type PlaceWithCoords = PlaceProps & { lat: number; lng: number };

type Props = {
  open: boolean;
  onToggle: () => void;
  meta: Meta;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  basemap: BasemapId;
  onBasemapChange: (id: BasemapId) => void;
  candidateKey: string;
  onCandidateChange: (key: string) => void;
  /** Candidates for the active election year (member selector + legend) */
  candidates?: Candidate[];
  settings: MapSettings;
  onSettingsChange: (patch: Partial<MapSettings>) => void;
  onResetSettings: () => void;
  boothCount: number;
  onGoBooth: (n: number) => void;
  gotoError: string | null;
  onClearGotoError: () => void;
  /** Election year shown on map (default 2025) */
  electionYear: number;
  onElectionYearChange: (year: number) => void;
  electionsAvailable?: number[];
  /** All booth props for location search */
  boothsForSearch?: BoothProps[];
  /** Real places for search + map */
  placesForSearch?: PlaceWithCoords[];
  /** Filter map to matching booth numbers (null = clear) */
  onLocationFilterChange?: (boothNos: number[] | null) => void;
  onSelectPlace?: (place: PlaceWithCoords) => void;
  /** Remount search when filter cleared from outside */
  locationSearchKey?: number;
  /** Strength mode counts for legend + slim My areas strip */
  strengthStats?: { strong: number; average: number; weak: number; na: number };
  /** Open dedicated My Areas briefing (side panel / mobile sheet) */
  myAreasOpen?: boolean;
  onOpenMyAreas?: () => void;
  dragControls?: ReactNode;
  /** Mobile: filters drawer + FAB; desktop: side rail */
  isMobile?: boolean;
  /** Hide open FAB when booth sheet is showing (clean map) */
  hideFab?: boolean;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-zinc-200 px-3 py-3 last:border-b-0 dark:border-zinc-800">
      <h3 className="kshetra-ui-hi mb-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-300">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 py-1">
      <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-200">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-zinc-900 dark:text-white">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-emerald-500"
      />
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <div className="text-sm text-zinc-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-[11px] leading-snug text-zinc-400">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}

function LegendInline({
  mode,
  candidates,
  selectedKey,
  settings,
  strengthStats,
}: {
  mode: MapMode;
  candidates: Candidate[];
  selectedKey: string | null;
  settings: MapSettings;
  strengthStats?: {
    strong: number;
    average: number;
    weak: number;
    na: number;
  };
}) {
  const { locale, t } = useLanguage();
  const selected = candidates.find((c) => c.key === selectedKey);
  const selectedName = selected
    ? displayCandidateName(locale, selected.key, selected.name)
    : "";
  const strengthLabels = {
    strong: t("strength.strong"),
    average: t("strength.average"),
    weak: t("strength.weak"),
    na: t("strength.na"),
  };
  const MARGIN_STOPS = [
    { label: "Tight (0)", color: "#dc2626" },
    { label: "~50", color: "#eab308" },
    { label: "~200+", color: "#16a34a" },
    { label: "Blowout 400+", color: "#14532d" },
  ];

  if (mode === "winner") {
    return (
      <ul className="space-y-1.5">
        {candidates
          .filter((c) => c.booths_won > 0)
          .sort((a, b) => b.booths_won - a.booths_won)
          .map((c) => (
            <li key={c.key} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-100">
                {displayCandidateName(locale, c.key, c.name)}
              </span>
              <PartyLabel
                party={c.party}
                size="xs"
                className="shrink-0 text-zinc-300"
              />
              <span className="ml-0.5 tabular-nums text-zinc-400">
                {c.booths_won}
              </span>
            </li>
          ))}
      </ul>
    );
  }

  if (mode === "margin") {
    return (
      <ul className="space-y-1.5">
        {MARGIN_STOPS.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-zinc-800 dark:text-zinc-100">{s.label}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (mode === "strength") {
    const rows: { tier: "strong" | "average" | "weak" | "na"; n: number }[] = [
      { tier: "strong", n: strengthStats?.strong ?? 0 },
      { tier: "average", n: strengthStats?.average ?? 0 },
      { tier: "weak", n: strengthStats?.weak ?? 0 },
      { tier: "na", n: strengthStats?.na ?? 0 },
    ];
    return (
      <div>
        {selected && (
          <p className="mb-2 text-xs text-zinc-300">
            {t("mode.strength")} ·{" "}
            <span className="font-medium" style={{ color: selected.color }}>
              {selectedName}
            </span>
          </p>
        )}
        <ul className="space-y-1.5">
          {rows.map(({ tier, n }) => (
            <li key={tier} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STRENGTH_COLORS[tier] }}
              />
              <span className="text-zinc-800 dark:text-zinc-100">
                {strengthLabels[tier]}
              </span>
              <span className="ml-auto tabular-nums text-zinc-400">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {selected && (
        <p className="mb-2 text-xs text-zinc-300">
          {t("mode.heat")} ·{" "}
          <span className="font-medium" style={{ color: selected.color }}>
            {selectedName}
          </span>
        </p>
      )}
      <ul className="space-y-1.5">
        {HEAT_BINS.map((bin) => (
          <li key={bin.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: bin.color }}
            />
            <span className="text-zinc-800 dark:text-zinc-100">{bin.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelBody(props: Props) {
  const {
    meta,
    mode,
    onModeChange,
    basemap,
    onBasemapChange,
    candidateKey,
    onCandidateChange,
    candidates,
    settings,
    onSettingsChange,
    onResetSettings,
    boothCount,
    onGoBooth,
    gotoError,
    onClearGotoError,
    electionYear,
    onElectionYearChange,
    electionsAvailable,
    boothsForSearch,
    placesForSearch,
    onLocationFilterChange,
    onSelectPlace,
    locationSearchKey = 0,
    strengthStats,
    myAreasOpen = false,
    onOpenMyAreas,
    dragControls,
  } = props;
  const t = useT();
  const { resolved } = useTheme();
  const panelDark = resolved === "dark";
  const yearList =
    electionsAvailable && electionsAvailable.length > 0
      ? [...electionsAvailable].sort((a, b) => b - a)
      : [2025];
  const { locale: panelLocale } = useLanguage();
  const memberCandidates = candidates?.length ? candidates : meta.candidates;
  const member = memberCandidates.find((c) => c.key === candidateKey);
  const memberDisplay = member
    ? displayCandidateName(panelLocale, member.key, member.name)
    : "";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <Section title={t("panel.electionYear")}>
        <div className="grid grid-cols-3 gap-1.5">
          {yearList.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onElectionYearChange(y)}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold tabular-nums transition ${
                electionYear === y
                  ? "border-emerald-500 bg-emerald-900/50 text-emerald-100"
                  : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-snug text-zinc-500">
          {t("panel.pinLocations")}
          {electionYear === 2025 && t("panel.year2025")}
          {electionYear === 2020 && t("panel.year2020")}
          {electionYear === 2015 && t("panel.year2015")}
        </p>
        {electionYear === 2015 && (
          <p className="mt-1.5 rounded-lg border border-amber-800/50 bg-amber-950/40 px-2 py-1.5 text-[10px] leading-snug text-amber-200/90">
            {t("panel.year2015Extra")}
          </p>
        )}
      </Section>

      <Section title={t("panel.member")}>
        <MemberSelector
          candidates={memberCandidates}
          value={candidateKey}
          onChange={onCandidateChange}
          dark={panelDark}
        />
        <p className="mt-1.5 text-[10px] text-zinc-500">
          {t("panel.memberHint")}
        </p>
      </Section>

      <Section title={t("panel.mode")}>
        <ModeToggle mode={mode} onChange={onModeChange} />
        {mode === "strength" && strengthStats && (
          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="kshetra-ui-hi text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {t("panel.myAreas")}
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {strengthStats.strong}
                  </span>
                  {` ${t("panel.strong")} · `}
                  <span className="text-amber-600 dark:text-amber-400">
                    {strengthStats.average}
                  </span>
                  {` ${t("panel.contest")} · `}
                  <span className="text-red-600 dark:text-red-400">
                    {strengthStats.weak}
                  </span>
                  {` ${t("panel.weak")}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenMyAreas?.()}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  myAreasOpen
                    ? "border border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-600/50 dark:bg-emerald-900/40 dark:text-emerald-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {myAreasOpen ? t("panel.shown") : t("panel.open")}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-zinc-500">
              {t("panel.myAreasHint")}
            </p>
          </div>
        )}
      </Section>

      {boothsForSearch && boothsForSearch.length > 0 && (
        <Section title={t("panel.searchLocation")}>
          <LocationSearch
            key={locationSearchKey}
            booths={boothsForSearch}
            places={placesForSearch}
            onSelectBooth={onGoBooth}
            onFilterChange={onLocationFilterChange}
            onSelectPlace={onSelectPlace}
            dark={panelDark}
          />
        </Section>
      )}

      <Section title={t("panel.goToBooth")}>
        <BoothGoto
          boothCount={boothCount}
          onGo={onGoBooth}
          error={gotoError}
          onClearError={onClearGotoError}
          dark={panelDark}
        />
      </Section>

      {dragControls ? (
        <Section title={t("panel.moveBooth")}>{dragControls}</Section>
      ) : null}

      <Section title={t("panel.basemap")}>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onBasemapChange(id)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                basemap === id
                  ? "border-emerald-500 bg-emerald-900/50 text-emerald-100"
                  : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
              }`}
            >
              {t(`basemap.${id}`)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("panel.markers")}>
        <SliderRow
          label={t("panel.size")}
          value={settings.markerScale}
          min={0.5}
          max={2.5}
          step={0.1}
          display={`${settings.markerScale.toFixed(1)}×`}
          onChange={(markerScale) => onSettingsChange({ markerScale })}
        />
        <SliderRow
          label={t("panel.opacity")}
          value={settings.markerOpacity}
          min={0.25}
          max={1}
          step={0.05}
          display={`${Math.round(settings.markerOpacity * 100)}%`}
          onChange={(markerOpacity) => onSettingsChange({ markerOpacity })}
        />
        <SliderRow
          label={t("panel.minVotes")}
          value={settings.minVotes}
          min={0}
          max={1200}
          step={25}
          display={
            settings.minVotes === 0
              ? t("panel.all")
              : `≥ ${settings.minVotes}`
          }
          onChange={(minVotes) => onSettingsChange({ minVotes })}
        />
        <SliderRow
          label={t("panel.flyZoom")}
          value={settings.flyZoom}
          min={11}
          max={17}
          step={0.5}
          display={String(settings.flyZoom)}
          onChange={(flyZoom) => onSettingsChange({ flyZoom })}
        />
      </Section>

      <Section title={t("panel.filtersDisplay")}>
        <ToggleRow
          label={t("panel.placeLabels")}
          description={t("panel.placeLabelsDesc")}
          checked={settings.showPlaces}
          onChange={(showPlaces) => onSettingsChange({ showPlaces })}
        />
        <ToggleRow
          label={t("panel.boothLabels")}
          description={t("panel.boothLabelsDesc")}
          checked={settings.showLabels}
          onChange={(showLabels) => onSettingsChange({ showLabels })}
        />
        <ToggleRow
          label={t("panel.markerHalo")}
          description={t("panel.markerHaloDesc")}
          checked={settings.showHalo}
          onChange={(showHalo) => onSettingsChange({ showHalo })}
        />
        <ToggleRow
          label={t("panel.flagUncertain")}
          description={t("panel.flagUncertainDesc")}
          checked={settings.flagUnverified}
          onChange={(flagUnverified) => onSettingsChange({ flagUnverified })}
        />
        {electionYear !== 2025 && (
          <ToggleRow
            label={t("panel.hideUnmatched")}
            description={t("panel.hideUnmatchedDesc", { year: electionYear })}
            checked={settings.hideUnmatchedYear}
            onChange={(hideUnmatchedYear) =>
              onSettingsChange({ hideUnmatchedYear })
            }
          />
        )}
        <ToggleRow
          label={t("panel.highlightWins")}
          description={
            member
              ? t("panel.highlightWinsDesc", { name: memberDisplay })
              : t("panel.highlightWinsDescGeneric")
          }
          checked={settings.highlightMemberWins}
          onChange={(highlightMemberWins) =>
            onSettingsChange({ highlightMemberWins })
          }
        />
        <ToggleRow
          label={t("panel.onlyWins")}
          description={t("panel.onlyWinsDesc")}
          checked={settings.onlyMemberWins}
          onChange={(onlyMemberWins) => onSettingsChange({ onlyMemberWins })}
        />
      </Section>

      <Section title={t("panel.legend")}>
        <LegendInline
          mode={mode}
          candidates={memberCandidates}
          selectedKey={candidateKey}
          settings={settings}
          strengthStats={strengthStats}
        />
        <p className="mt-2 text-[10px] leading-snug text-zinc-400">
          {t("panel.legendSize", { year: electionYear })}
          {electionYear !== 2025 ? t("panel.legendGrey") : ""}
          {mode === "strength" ? t("panel.legendStrength") : ""}
        </p>
      </Section>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={onResetSettings}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-100 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {t("panel.reset")}
        </button>
      </div>
    </div>
  );
}

export function MapControlPanel(props: Props) {
  const {
    open,
    onToggle,
    meta,
    isMobile = false,
    hideFab = false,
    myAreasOpen = false,
  } = props;
  const { locale, t } = useLanguage();

  /* ---------- Mobile: FAB + bottom/side drawer ---------- */
  if (isMobile) {
    return (
      <>
        {/* Open filters — hidden when booth sheet / my areas is up */}
        {!open && !hideFab && (
          <button
            type="button"
            onClick={onToggle}
            className="pointer-events-auto absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-xl dark:border-zinc-700 dark:bg-zinc-950 dark:text-white active:scale-95"
          >
            <span className="text-base leading-none">☰</span>
            {t("panel.openFilters")}
          </button>
        )}

        {/* Backdrop */}
        {open && (
          <button
            type="button"
            aria-label={t("panel.close")}
            className="pointer-events-auto absolute inset-0 z-30 bg-black/50"
            onClick={onToggle}
          />
        )}

        {/* Drawer */}
        <aside
          className={`pointer-events-auto absolute inset-y-0 left-0 z-40 flex w-[min(100vw,20rem)] flex-col border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
            <div className="min-w-0">
              <div className="kshetra-ui-hi text-[10px] font-semibold text-emerald-400">
                {t("panel.brand")}
              </div>
              <h1 className="kshetra-ui-hi truncate text-base font-semibold leading-snug text-zinc-900 dark:text-white">
                {meta.constituency.ac_no} —{" "}
                {displayAcName(locale, meta.constituency.name)}
              </h1>
              <p className="kshetra-ui-hi truncate text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                {t("panel.boothsFilters", {
                  n: meta.constituency.booth_count,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {t("panel.close")}
            </button>
          </header>
          <PanelBody {...props} />
        </aside>
      </>
    );
  }

  /* Collapse tab: right edge of filters, or My areas-only, or both stacked */
  const collapseLeft = open
    ? myAreasOpen
      ? "left-[min(100vw-1rem,calc(20.5rem+21rem))]"
      : "left-[min(100vw-1rem,20.5rem)]"
    : myAreasOpen
      ? "left-[min(100vw-22rem,21rem)]"
      : "left-0";

  /* ---------- Desktop: filters rail; My areas is a sibling panel ---------- */
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? t("panel.collapse") : t("panel.expand")}
        className={`pointer-events-auto absolute top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-xl border border-l-0 border-zinc-300 bg-white px-1.5 py-3 text-zinc-800 shadow-xl transition-all duration-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 ${collapseLeft}`}
      >
        <span className="text-sm leading-none">{open ? "‹" : "›"}</span>
        {!open && (
          <span
            className="kshetra-ui-hi text-[10px] font-semibold text-zinc-600 dark:text-zinc-200"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {t("panel.controls")}
          </span>
        )}
      </button>

      <aside
        className={`pointer-events-auto absolute top-0 bottom-0 left-0 z-20 flex w-[min(100vw-1rem,20.5rem)] flex-col border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="shrink-0 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="kshetra-ui-hi text-[10px] font-semibold text-emerald-400">
                {t("panel.brand")}
              </div>
              <h1 className="kshetra-ui-hi truncate text-base font-semibold leading-snug text-zinc-900 dark:text-white">
                {meta.constituency.ac_no} —{" "}
                {displayAcName(locale, meta.constituency.name)}
              </h1>
              <p className="kshetra-ui-hi truncate text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                {t("panel.electionLine", {
                  election: displayElectionName(
                    locale,
                    meta.election.year,
                    meta.election.name
                  ),
                  n: meta.constituency.booth_count,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              title={t("panel.collapse")}
            >
              {t("panel.hide")}
            </button>
          </div>
        </header>
        <PanelBody {...props} />
      </aside>
    </>
  );
}
