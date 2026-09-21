import type { ReactNode } from "react";
import type { CasteNote, ProfileSocial } from "@/lib/profile/profileRepo";
import type { Locale } from "@/lib/i18n/types";
import { resolveSourcedDisplay } from "@/lib/dossier/factDisplay";
import { FactStat } from "./FactStat";
import { DossierSection } from "./DossierSection";
import type { DossierSectionCommonProps, DossierT } from "./types";

type Props = DossierSectionCommonProps & {
  social: ProfileSocial;
};

/**
 * Picks the Hindi field when `locale === "hi"` and a translation actually
 * exists, else falls back to the English field — same fallback shape
 * `@/lib/i18n/displayNames.ts`'s `displayAcName()`/`displayPlaceName()` etc.
 * use for their locale + fallback pattern, just operating on the profile
 * doc's own `_hi` sibling fields directly instead of a names dictionary
 * (`communities[]`/`caste_notes[]` etc. have no dictionary — the bilingual
 * text sits right on the object).
 */
function pick(locale: Locale, en: string, hi?: string): string {
  return locale === "hi" && hi ? hi : en;
}

/**
 * Granularity honesty (task-8 brief, "granularity chip"): a caste note's
 * `granularity` must never read as more precise than its source actually
 * supports — district-level survey rows are common and must never look
 * AC-specific. Colour-codes by how coarse the granularity is (amber/orange
 * = coarser than AC, emerald = AC-level, zinc = qualitative/non-spatial) so
 * the chip is visually unmissable, not a tiny footnote.
 */
const GRANULARITY_CHIP_CLASSES: Record<CasteNote["granularity"], string> = {
  district:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
  block:
    "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ac: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  qualitative:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function GranularityChip({ granularity, t }: { granularity: CasteNote["granularity"]; t: DossierT }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${GRANULARITY_CHIP_CLASSES[granularity]}`}
    >
      {t(`dossier.social.casteNotes.granularity.${granularity}`)}
    </span>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </h3>
  );
}

const INSTITUTION_TYPES = ["school", "college", "hospital", "other"] as const;

/**
 * Social profile section (B4 spec item 3): communities, caste notes (with
 * granularity chips), religion/migration notes, institutions.
 */
export function SocialSection({ social, sourceIndex, t, locale }: Props) {
  return (
    <DossierSection aria-label={t("dossier.social.title")} className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("dossier.social.title")}
      </h2>

      {/* Communities — plain display, no source (task-8 brief). */}
      <div>
        <SubHeading>{t("dossier.social.communities.title")}</SubHeading>
        {social.communities.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {social.communities.map((c, i) => (
              <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">{pick(locale, c.name, c.name_hi)}</span>
                {c.note ? <span className="text-zinc-500 dark:text-zinc-400"> — {c.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Caste notes — sourced (numbered superscript) + mandatory granularity chip. */}
      <div>
        <SubHeading>{t("dossier.social.casteNotes.title")}</SubHeading>
        {social.caste_notes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {social.caste_notes.map((cn, i) => {
              const { supNumber } = resolveSourcedDisplay(cn, sourceIndex);
              return (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {pick(locale, cn.group, cn.group_hi)}
                    </span>
                    <GranularityChip granularity={cn.granularity} t={t} />
                    {supNumber != null && (
                      <sup className="font-medium text-emerald-700 dark:text-emerald-400">
                        {supNumber}
                      </sup>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {pick(locale, cn.note, cn.note_hi)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Religion / migration — real Facts, FactStat handles source/"—". */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("dossier.social.religionNote")}
          </dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
            <FactStat fact={social.religion_note} sourceIndex={sourceIndex} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("dossier.social.migrationNote")}
          </dt>
          <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
            <FactStat fact={social.migration_note} sourceIndex={sourceIndex} />
          </dd>
        </div>
      </dl>

      {/* Institutions — grouped by type, plain display, no source. */}
      <div>
        <SubHeading>{t("dossier.social.institutions.title")}</SubHeading>
        {social.institutions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            {INSTITUTION_TYPES.map((type) => {
              const items = social.institutions.filter((inst) => inst.type === type);
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {t(`dossier.social.institutions.type${type[0].toUpperCase()}${type.slice(1)}`)}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {items.map((inst, i) => (
                      <li key={i} className="text-sm text-zinc-800 dark:text-zinc-200">
                        <span className="font-medium">{inst.name}</span>
                        {inst.note ? (
                          <span className="text-zinc-500 dark:text-zinc-400"> — {inst.note}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DossierSection>
  );
}
