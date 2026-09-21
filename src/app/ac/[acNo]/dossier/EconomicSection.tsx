import type { ReactNode } from "react";
import type { ProfileEconomic } from "@/lib/profile/profileRepo";
import type { Locale } from "@/lib/i18n/types";
import { resolveSourcedDisplay } from "@/lib/dossier/factDisplay";
import { sortIssuesByRank } from "@/lib/dossier/sortIssues";
import { FactStat } from "./FactStat";
import { DossierSection } from "./DossierSection";
import type { DossierSectionCommonProps } from "./types";

type Props = DossierSectionCommonProps & {
  economic: ProfileEconomic;
};

type ProjectStatus = ProfileEconomic["projects"][number]["status"];

/** Same locale + `_hi`-field-fallback pattern as `SocialSection.tsx`'s `pick()`. */
function pick(locale: Locale, en: string, hi?: string): string {
  return locale === "hi" && hi ? hi : en;
}

const STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  proposed:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ongoing:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
  done: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

/**
 * Economic profile section (B4 spec item 4): occupations, agriculture/
 * industry, schemes table, projects, ranked issues.
 */
export function EconomicSection({ economic, sourceIndex, t, locale }: Props) {
  const sortedIssues = sortIssuesByRank(economic.issues);

  return (
    <DossierSection aria-label={t("dossier.economic.title")} className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("dossier.economic.title")}
      </h2>

      {/* Occupations — genuinely Fact-shaped (label/label_hi + value/source/as_of intersection). */}
      <div>
        <SubHeading>{t("dossier.economic.occupations.title")}</SubHeading>
        {economic.occupations.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {economic.occupations.map((occ, i) => (
              <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">{pick(locale, occ.label, occ.label_hi)}</span>
                {": "}
                <FactStat fact={occ} sourceIndex={sourceIndex} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Agriculture / industry — real Facts, FactStat handles source/"—". */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("dossier.economic.agriculture")}
          </dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
            <FactStat fact={economic.agriculture} sourceIndex={sourceIndex} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("dossier.economic.industry")}
          </dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
            <FactStat fact={economic.industry} sourceIndex={sourceIndex} />
          </dd>
        </div>
      </dl>

      {/* Schemes — sourced (source/as_of direct, no Fact wrapper), rendered as an actual table. */}
      <div>
        <SubHeading>{t("dossier.economic.schemes.title")}</SubHeading>
        {economic.schemes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-1 pr-3 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("dossier.economic.schemes.colName")}
                  </th>
                  <th className="py-1 font-medium text-zinc-500 dark:text-zinc-400">
                    {t("dossier.economic.schemes.colCoverage")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {economic.schemes.map((s, i) => {
                  const { supNumber } = resolveSourcedDisplay(s, sourceIndex);
                  return (
                    <tr key={i} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                      <td className="py-1.5 pr-3 align-top font-medium text-zinc-900 dark:text-zinc-50">
                        {pick(locale, s.name, s.name_hi)}
                        {supNumber != null && (
                          <sup className="ml-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                            {supNumber}
                          </sup>
                        )}
                      </td>
                      <td className="py-1.5 align-top text-zinc-700 dark:text-zinc-300">
                        {s.coverage_note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Projects — plain display, no source; status as a visual badge. */}
      <div>
        <SubHeading>{t("dossier.economic.projects.title")}</SubHeading>
        {economic.projects.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {economic.projects.map((p, i) => (
              <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASSES[p.status]}`}
                  >
                    {t(`dossier.economic.projects.status.${p.status}`)}
                  </span>
                  <span className="font-medium">{pick(locale, p.title, p.title_hi)}</span>
                  {p.year != null && <span className="text-zinc-500 dark:text-zinc-400">({p.year})</span>}
                </div>
                {p.note ? (
                  <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{p.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Issues — plain display, no source; defensively re-sorted by rank at render time. */}
      <div>
        <SubHeading>{t("dossier.economic.issues.title")}</SubHeading>
        {sortedIssues.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
            {sortedIssues.map((issue, i) => (
              <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">{pick(locale, issue.title, issue.title_hi)}</span>
                {issue.note ? (
                  <span className="text-zinc-500 dark:text-zinc-400"> — {issue.note}</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </DossierSection>
  );
}
