import type { ReactNode } from "react";
import type { ProfilePolitical } from "@/lib/profile/profileRepo";
import type { PoliticalBlock, PoliticalBlockYear } from "@/lib/dossier/politicalBlock";
import type { Locale } from "@/lib/i18n/types";
import { FactStat } from "./FactStat";
import { DossierSection } from "./DossierSection";
import { VoteShareChart } from "./VoteShareChart";
import type { DossierSectionCommonProps, DossierT } from "./types";

type Props = DossierSectionCommonProps & {
  political: ProfilePolitical;
  /** `profile.brief_en`/`brief_hi` — top-level doc fields, not part of `political`. */
  briefEn?: string;
  briefHi?: string;
  politicalBlock: PoliticalBlock | null;
  /**
   * `/data/ac-<ac>/dossier-map.png`'s public URL, or `null` when the file
   * doesn't exist — resolved server-side in `page.tsx`'s `dossierMapUrl()`
   * via `fs/promises` `stat()`. `null` is the normal case today (no real
   * `dossier-map.png` ships with this repo yet); this section must render
   * nothing for the map block in that case, not a broken `<img>`.
   */
  mapImageUrl: string | null;
};

/** Same locale + `_hi`-field-fallback pattern as `SocialSection.tsx`/`EconomicSection.tsx`'s `pick()`. */
function pick(locale: Locale, en: string, hi?: string): string {
  return locale === "hi" && hi ? hi : en;
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

/**
 * Defensive ascending-by-year sort (same reasoning as `SnapshotSection.tsx`'s
 * `latestYear()`: `getPoliticalBlock()`'s contract doesn't promise ordering,
 * even though today's real `ac-series.json` data happens to already be
 * ascending).
 */
function sortedYears(politicalBlock: PoliticalBlock | null): PoliticalBlockYear[] {
  if (!politicalBlock) return [];
  return [...politicalBlock.years].sort((a, b) => a.year - b.year);
}

function YearCard({ year, t }: { year: PoliticalBlockYear; t: DossierT }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {year.year}
      </p>
      <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{year.winner_name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{year.winner_party}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">{t("dossier.political.years.winnerSharePct")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{year.winner_share_pct}%</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">{t("dossier.political.years.runnerUp")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{year.runner_up_name}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">{t("dossier.political.years.margin")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{year.margin.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">{t("dossier.political.years.totalValid")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">{year.total_valid.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">{t("dossier.political.years.electors")}</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">
            {year.electors_total != null ? year.electors_total.toLocaleString() : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

/**
 * Political landscape section (B4 spec item 5, Phase-B/C version): year
 * result cards (2015/2020/2025), the focus-candidate vote-share trend chart
 * (the dossier's one client-island exception — see `VoteShareChart.tsx`'s
 * doc comment), booth strength summary, key leaders, brief paragraph.
 *
 * `political.history_note`/`organisation_note`/`alliances_note` (curated
 * `Fact`s on `ProfilePolitical`) ARE rendered, via `FactStat`, in a small
 * "History & organisation" subsection near Key leaders — added in a fix
 * round after B-Task 9's initial review. `compileSources(profile)` walks
 * the ENTIRE profile doc (not section-scoped), so these three facts'
 * `source`/`as_of` were already being compiled into the numbered Sources
 * list even when nothing on the visible page carried their superscript;
 * leaving them unrendered (the original, spec-literal-only reading of B4
 * section 5) would silently produce orphaned Sources entries the moment a
 * curator gives any of the three a citation distinct from every other
 * fact's (invisible with today's demo data, which happens to reuse one
 * `source` string everywhere). See task-9-report.md's "fix round" entry.
 *
 * Degrades gracefully when `politicalBlock` is `null` (missing
 * `meta.json`/`history/ac-series.json` for this AC — see
 * `getPoliticalBlock()`'s doc comment): no year cards, no chart, and the
 * booth summary already defaults to all-zero counts via `SnapshotSection`'s
 * same `politicalBlock ? ... : "—"`-style pattern.
 */
export function PoliticalSection({
  political,
  briefEn,
  briefHi,
  politicalBlock,
  mapImageUrl,
  sourceIndex,
  t,
  locale,
}: Props) {
  const years = sortedYears(politicalBlock);
  const boothSummary = politicalBlock?.booth_summary ?? null;
  const briefText = pick(locale, briefEn ?? "", briefHi);

  return (
    <DossierSection aria-label={t("dossier.political.title")} className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("dossier.political.title")}
      </h2>

      {/* Year result cards — computed data (getPoliticalBlock()), no source/superscript
          (political data is excluded from compileSources()'s walk — same provenance
          rule SnapshotSection's electors/booths stats follow). */}
      <div>
        <SubHeading>{t("dossier.political.years.title")}</SubHeading>
        {years.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {years.map((y) => (
              <YearCard key={y.year} year={y} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Focus-candidate vote-share trend — the dossier's one client-island
          exception; see VoteShareChart.tsx's doc comment. */}
      <div>
        <SubHeading>{t("dossier.political.chart.title")}</SubHeading>
        {politicalBlock && politicalBlock.focus.series.length > 0 ? (
          <div className="mt-2">
            <VoteShareChart series={politicalBlock.focus.series} candidateName={politicalBlock.focus.name} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("dossier.political.chart.empty")}
          </p>
        )}
      </div>

      {/* Booth strength summary — computed from booths.geojson, no source. */}
      <div>
        <SubHeading>{t("dossier.political.boothSummary.title")}</SubHeading>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryStat
            label={t("dossier.political.boothSummary.total")}
            value={boothSummary ? boothSummary.total_booths.toLocaleString() : "—"}
          />
          <SummaryStat
            label={t("dossier.political.boothSummary.strong")}
            value={boothSummary ? boothSummary.strong.toLocaleString() : "—"}
          />
          <SummaryStat
            label={t("dossier.political.boothSummary.average")}
            value={boothSummary ? boothSummary.average.toLocaleString() : "—"}
          />
          <SummaryStat
            label={t("dossier.political.boothSummary.weak")}
            value={boothSummary ? boothSummary.weak.toLocaleString() : "—"}
          />
          <SummaryStat
            label={t("dossier.political.boothSummary.na")}
            value={boothSummary ? boothSummary.na.toLocaleString() : "—"}
          />
        </div>
      </div>

      {/*
        Constituency map — B-Task 10, print-safe. No live MapLibre is ever
        embedded here (spec: don't embed live MapLibre in print — Recharts
        and MapLibre share the same "doesn't print reliably" problem, see
        VoteShareChart.tsx's doc comment). Instead this renders the
        pre-rendered `dossier-map.png` as a plain `<img>` if present, and
        omits the whole block cleanly (no broken image, no empty gap) when
        it's absent — the actual case for every AC in this repo today, since
        no real `dossier-map.png` ships yet (see page.tsx's
        `dossierMapUrl()` doc comment).
      */}
      {mapImageUrl && (
        <div>
          <SubHeading>{t("dossier.political.map.title")}</SubHeading>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapImageUrl}
            alt={t("dossier.political.map.alt")}
            className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
        </div>
      )}

      {/* Key leaders — plain display, no source (ProfilePolitical.key_leaders
          carries no source/as_of per the schema). */}
      <div>
        <SubHeading>{t("dossier.political.keyLeaders.title")}</SubHeading>
        {political.key_leaders.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {political.key_leaders.map((leader, i) => (
              <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">{pick(locale, leader.name, leader.name_hi)}</span>
                {" — "}
                <span className="text-zinc-600 dark:text-zinc-400">{leader.role}</span>
                {leader.note ? (
                  <span className="text-zinc-500 dark:text-zinc-400"> ({leader.note})</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History / organisation / alliances — real Facts (FactStat handles
          source/"—"). These carry `source`/`as_of` and ARE compiled into
          the Sources list by compileSources()'s whole-profile walk, so they
          must render a superscript here or the Sources page would show
          orphaned entries — see the section doc comment above. */}
      <div>
        <SubHeading>{t("dossier.political.notes.title")}</SubHeading>
        <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("dossier.political.notes.history")}
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              <FactStat fact={political.history_note} sourceIndex={sourceIndex} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("dossier.political.notes.organisation")}
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              <FactStat fact={political.organisation_note} sourceIndex={sourceIndex} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("dossier.political.notes.alliances")}
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              <FactStat fact={political.alliances_note} sourceIndex={sourceIndex} />
            </dd>
          </div>
        </dl>
      </div>

      {/* Brief paragraph — profile.brief_en/brief_hi, bilingual via the same
          pick() pattern as everywhere else in this route. */}
      <div>
        <SubHeading>{t("dossier.political.brief.title")}</SubHeading>
        <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
          {briefText.trim().length > 0 ? briefText : t("dossier.political.brief.empty")}
        </p>
      </div>
    </DossierSection>
  );
}
