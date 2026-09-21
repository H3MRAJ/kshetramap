import type { ReactNode } from "react";
import type { ProfileSnapshot } from "@/lib/profile/profileRepo";
import type { PoliticalBlock, PoliticalBlockYear } from "@/lib/dossier/politicalBlock";
import { FactStat } from "./FactStat";
import { DossierSection } from "./DossierSection";
import type { DossierSectionCommonProps } from "./types";

type Props = DossierSectionCommonProps & {
  snapshot: ProfileSnapshot;
  politicalBlock: PoliticalBlock | null;
};

/**
 * Picks the highest-`year` entry from `politicalBlock.years[]` — "latest
 * year" per the brief — computed defensively (max-by-year, not
 * `years[years.length - 1]`) since `getPoliticalBlock()`'s own contract
 * doesn't promise ascending order, even though today's real data happens to
 * already be ascending.
 */
function latestYear(politicalBlock: PoliticalBlock | null): PoliticalBlockYear | null {
  if (!politicalBlock || politicalBlock.years.length === 0) return null;
  return politicalBlock.years.reduce((max, y) => (y.year > max.year ? y : max));
}

function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</dd>
      {caption ? (
        <p className="mt-0.5 text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/**
 * AC Snapshot section (B4 spec item 2, Phase-B/C version, per task-7-brief:
 * "stat grid: electors, booths, blocks, literacy, sex ratio"). Provenance
 * differs by stat (brief decision 5):
 * - `electors`/`booths`: COMPUTED from `getPoliticalBlock()`, not curated
 *   `Fact`s — no numbered footnote (political data is excluded from
 *   `compileSources()`'s walk). `electors` comes from the latest
 *   `years[]` entry's own `electors_total` (absent when the source
 *   ac-series.json has it `null` — e.g. AC-178's 2025 entry, SIR roll not
 *   yet finalized when Module-1's data was built — renders "—", not a
 *   fabricated number). `booths` comes from `booth_summary.total_booths`
 *   (NOT a `booth_count` field on `PoliticalBlockYear` — that field exists
 *   on the underlying `ac-series.json` row but is deliberately dropped by
 *   `getPoliticalBlock()`'s own mapping, so it isn't available to read off
 *   `years[]`; `booth_summary` is the only booths count the block actually
 *   exposes, computed from `booths.geojson` for the AC's current default
 *   election year — the same year the latest `years[]` entry represents).
 * - `blocks`/`literacy_pct`/`sex_ratio`: CURATED `Fact`s from
 *   `profile.snapshot` — numbered superscript via `sourceIndex`, or "—" if
 *   not yet curated (`FactStat` / `resolveFactDisplay()` handles this).
 */
export function SnapshotSection({ snapshot, politicalBlock, sourceIndex, t }: Props) {
  const latest = latestYear(politicalBlock);
  const electorsText =
    latest?.electors_total != null ? latest.electors_total.toLocaleString() : "—";
  const boothsText = politicalBlock
    ? politicalBlock.booth_summary.total_booths.toLocaleString()
    : "—";
  const computedCaption = t("dossier.snapshot.computedCaption");

  return (
    <DossierSection aria-label={t("dossier.snapshot.title")}>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("dossier.snapshot.title")}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label={t("dossier.snapshot.electors")} value={electorsText} caption={computedCaption} />
        <StatCard label={t("dossier.snapshot.booths")} value={boothsText} caption={computedCaption} />
        <StatCard
          label={t("dossier.snapshot.blocks")}
          value={<FactStat fact={snapshot.blocks} sourceIndex={sourceIndex} />}
        />
        <StatCard
          label={t("dossier.snapshot.literacyPct")}
          value={
            <FactStat
              fact={snapshot.literacy_pct}
              sourceIndex={sourceIndex}
              format={(v) => `${v}%`}
            />
          }
        />
        <StatCard
          label={t("dossier.snapshot.sexRatio")}
          value={<FactStat fact={snapshot.sex_ratio} sourceIndex={sourceIndex} />}
        />
      </dl>
    </DossierSection>
  );
}
