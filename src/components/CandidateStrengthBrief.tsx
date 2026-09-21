"use client";

import type { AreaListItem, StrengthTier } from "@/lib/boothStrength";
import {
  STRENGTH_COLORS,
  placePlainLabel,
  strengthRulesPlain,
  type StrengthThresholds,
} from "@/lib/boothStrength";
import type { StrengthFilter } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayPlaceName } from "@/lib/i18n/displayNames";

type Props = {
  memberName: string;
  electionYear: number;
  stats: { strong: number; average: number; weak: number; na: number };
  areas: AreaListItem[];
  thresholds: StrengthThresholds;
  strengthFilter: StrengthFilter;
  onFilterChange: (f: StrengthFilter) => void;
  onSelectArea: (place: string, boothNos: number[]) => void;
  onGoBooth: (n: number) => void;
};

function TierCard({
  tier,
  count,
  total,
  active,
  onClick,
  hint,
  label,
  boothsOfMap,
}: {
  tier: StrengthTier;
  count: number;
  total: number;
  active: boolean;
  onClick: () => void;
  hint: string;
  label: string;
  boothsOfMap: string;
}) {
  if (tier === "na") return null;
  const pct = total > 0 ? Math.round((100 * count) / total) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col rounded-xl border px-2.5 py-2 text-left transition ${
        active
          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 dark:border-emerald-400/50 dark:bg-zinc-800 dark:ring-white/20"
          : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-500"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: STRENGTH_COLORS[tier] }}
        />
        <span className="kshetra-ui-hi text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
          {label}
        </span>
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
        {count}
      </div>
      <div className="kshetra-ui-hi text-[10px] text-zinc-500 dark:text-zinc-400">
        {boothsOfMap.replace("{pct}", String(pct))}
      </div>
      <div className="kshetra-ui-hi mt-1 text-[10px] leading-snug text-zinc-500">
        {hint}
      </div>
    </button>
  );
}

function formatBooths(nos: number[], max = 8): string {
  if (!nos.length) return "—";
  if (nos.length <= max) return nos.map((n) => `#${n}`).join(" ");
  return (
    nos
      .slice(0, max)
      .map((n) => `#${n}`)
      .join(" ") + ` +${nos.length - max}`
  );
}

function formatVotes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Candidate-facing briefing: strong / contest / weak areas + booth combinations.
 */
export function CandidateStrengthBrief({
  memberName,
  electionYear,
  stats,
  areas,
  thresholds,
  strengthFilter,
  onFilterChange,
  onSelectArea,
  onGoBooth,
}: Props) {
  const { locale, t } = useLanguage();
  const total = stats.strong + stats.average + stats.weak;
  const first = memberName.split(" ")[0] || memberName;
  const strengthLabel = (tier: StrengthTier) =>
    tier === "strong"
      ? t("strength.strong")
      : tier === "average"
        ? t("strength.average")
        : tier === "weak"
          ? t("strength.weak")
          : t("strength.na");

  const strongAreas = areas
    .filter((a) => a.tier === "strong")
    .sort((a, b) => b.meanShare - a.meanShare);
  const averageAreas = areas
    .filter((a) => a.tier === "average")
    .sort((a, b) => b.meanShare - a.meanShare);
  const weakAreas = areas
    .filter((a) => a.tier === "weak")
    .sort((a, b) => a.meanShare - b.meanShare);

  const votesStrong = strongAreas.reduce((s, a) => s + a.totalFocusVotes, 0);
  const votesWeak = weakAreas.reduce((s, a) => s + a.totalFocusVotes, 0);
  const boothsInStrongAreas = strongAreas.reduce((s, a) => s + a.n, 0);
  const boothsInWeakAreas = weakAreas.reduce((s, a) => s + a.n, 0);

  const headline =
    total === 0
      ? t("strengthUi.noBoothData")
      : t("strengthUi.headline", {
          name: first,
          strong: stats.strong,
          contest: stats.average,
          weak: stats.weak,
          year: electionYear,
        });

  function AreaBlock({
    title,
    color,
    items,
    empty,
    actionHint,
  }: {
    title: string;
    color: string;
    items: AreaListItem[];
    empty: string;
    actionHint: string;
  }) {
    return (
      <div className="mt-3">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="kshetra-ui-hi text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            {title}
          </h4>
          <span className="kshetra-ui-hi text-[10px] tabular-nums text-zinc-500">
            {items.length === 1
              ? t("strengthUi.placeN", { n: items.length })
              : t("strengthUi.placesN", { n: items.length })}
          </span>
        </div>
        <p className="kshetra-ui-hi mb-1.5 text-[10px] text-zinc-500">
          {actionHint}
        </p>
        {items.length === 0 ? (
          <p className="text-[11px] text-zinc-500">{empty}</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto">
            {items.slice(0, 14).map((a) => (
              <li key={a.place}>
                <button
                  type="button"
                  onClick={() => onSelectArea(a.place, a.boothNos)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-left hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="kshetra-ui-hi min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {displayPlaceName(locale, a.place)}
                    </span>
                    <span
                      className="shrink-0 text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {a.meanShare}%
                    </span>
                  </div>
                  <div className="kshetra-ui-hi mt-0.5 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
                    {placePlainLabel(a.tier, a.meanShare, t)}
                  </div>
                  <div className="kshetra-ui-hi mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
                    <span>
                      <span className="text-emerald-600 dark:text-emerald-500/90">
                        {a.strong}
                      </span>
                      {` ${t("strengthUi.strongWord")} · `}
                      <span className="text-amber-600 dark:text-amber-400/90">
                        {a.average}
                      </span>
                      {` ${t("strengthUi.contestWord")} · `}
                      <span className="text-red-600 dark:text-red-400/90">
                        {a.weak}
                      </span>
                      {` ${t("strengthUi.weakWord")}`}
                    </span>
                    <span className="tabular-nums">
                      {t("strengthUi.boothsVotes", {
                        booths: a.n,
                        votes: formatVotes(a.totalFocusVotes),
                      })}
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="kshetra-ui-hi text-[9px] font-semibold text-zinc-500 dark:text-zinc-600">
                      {t("strengthUi.boothCombo")}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {formatBooths(a.boothNos, 12)}
                    </div>
                  </div>
                  {a.strongBooths.length > 0 && a.tier !== "strong" && (
                    <div className="kshetra-ui-hi mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-600/80">
                      {t("strengthUi.strongInside", {
                        list: formatBooths(a.strongBooths, 6),
                      })}
                    </div>
                  )}
                  {a.weakBooths.length > 0 && a.tier !== "weak" && (
                    <div className="kshetra-ui-hi mt-0.5 text-[10px] text-red-600 dark:text-red-400/80">
                      {t("strengthUi.weakInside", {
                        list: formatBooths(a.weakBooths, 6),
                      })}
                    </div>
                  )}
                  <div className="kshetra-ui-hi mt-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-500/70">
                    {t("strengthUi.showOnMap")}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-zinc-50 px-3 py-2.5 dark:border-emerald-800/50 dark:from-emerald-950/50 dark:to-zinc-950">
        <div className="kshetra-ui-hi text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
          {t("strengthUi.territory", { year: electionYear })}
        </div>
        <p className="kshetra-ui-hi mt-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
          {headline}
        </p>
        {areas.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2 py-1.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="kshetra-ui-hi font-semibold text-emerald-700 dark:text-emerald-400">
                {t("strengthUi.strongAreasN", { n: strongAreas.length })}
              </div>
              <div className="kshetra-ui-hi mt-0.5 text-zinc-600 dark:text-zinc-400">
                {t("strengthUi.boothsVotesShort", {
                  booths: boothsInStrongAreas,
                  votes: formatVotes(votesStrong),
                })}
              </div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/80 px-2 py-1.5 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="kshetra-ui-hi font-semibold text-red-700 dark:text-red-400">
                {t("strengthUi.weakAreasN", { n: weakAreas.length })}
              </div>
              <div className="kshetra-ui-hi mt-0.5 text-zinc-600 dark:text-zinc-400">
                {t("strengthUi.boothsVotesShort", {
                  booths: boothsInWeakAreas,
                  votes: formatVotes(votesWeak),
                })}
              </div>
            </div>
          </div>
        )}
        <p className="kshetra-ui-hi mt-1.5 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
          {strengthRulesPlain(thresholds, t)}
        </p>
      </div>

      <div>
        <div className="kshetra-ui-hi mb-1.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
          {t("strengthUi.atAGlance")}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <TierCard
            tier="strong"
            count={stats.strong}
            total={total}
            active={strengthFilter === "strong"}
            onClick={() =>
              onFilterChange(strengthFilter === "strong" ? "all" : "strong")
            }
            hint={t("strengthUi.hold")}
            label={strengthLabel("strong")}
            boothsOfMap={t("strengthUi.boothsOfMap")}
          />
          <TierCard
            tier="average"
            count={stats.average}
            total={total}
            active={strengthFilter === "average"}
            onClick={() =>
              onFilterChange(strengthFilter === "average" ? "all" : "average")
            }
            hint={t("strengthUi.fight")}
            label={strengthLabel("average")}
            boothsOfMap={t("strengthUi.boothsOfMap")}
          />
          <TierCard
            tier="weak"
            count={stats.weak}
            total={total}
            active={strengthFilter === "weak"}
            onClick={() =>
              onFilterChange(strengthFilter === "weak" ? "all" : "weak")
            }
            hint={t("strengthUi.fix")}
            label={strengthLabel("weak")}
            boothsOfMap={t("strengthUi.boothsOfMap")}
          />
        </div>
        <p className="kshetra-ui-hi mt-1.5 text-[10px] text-zinc-500">
          {t("strengthUi.tapCard")}
        </p>
      </div>

      <AreaBlock
        title={t("strengthUi.strongAreas")}
        color={STRENGTH_COLORS.strong}
        items={strongAreas}
        empty="—"
        actionHint={t("strengthUi.hold")}
      />
      <AreaBlock
        title={t("strengthUi.contestAreas")}
        color={STRENGTH_COLORS.average}
        items={averageAreas}
        empty="—"
        actionHint={t("strengthUi.fight")}
      />
      <AreaBlock
        title={t("strengthUi.weakAreas")}
        color={STRENGTH_COLORS.weak}
        items={weakAreas}
        empty="—"
        actionHint={t("strengthUi.fix")}
      />

      {/* Quick booth jumps from weakest/strongest sample */}
      {areas.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="kshetra-ui-hi text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            {t("strengthUi.showOnMap")}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {strongAreas[0]?.strongBooths.slice(0, 4).map((n) => (
              <button
                key={`s${n}`}
                type="button"
                onClick={() => onGoBooth(n)}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {t("strength.strong")} #{n}
              </button>
            ))}
            {weakAreas[0]?.weakBooths.slice(0, 4).map((n) => (
              <button
                key={`w${n}`}
                type="button"
                onClick={() => onGoBooth(n)}
                className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
              >
                {t("strength.weak")} #{n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
