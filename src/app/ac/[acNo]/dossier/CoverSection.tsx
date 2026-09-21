import { displayAcName } from "@/lib/i18n/displayNames";
import { DossierSection } from "./DossierSection";
import type { DossierSectionCommonProps } from "./types";

type Props = DossierSectionCommonProps & {
  acNo: number;
  /** English AC name straight from `meta.json` — localized here via `displayAcName()`. */
  acNameEnglish: string;
  /** `session.user.name` from `requirePageSession()` — never a placeholder (brief decision 8). */
  preparedByName: string;
  generatedAt: Date;
};

/**
 * Fixed, locale-neutral date format ("05 Aug 2026") rather than
 * `Intl`/`toLocaleString` with a `hi`/`en` locale tag. This page is
 * server-only (no hydration to protect against, per the architecture note in
 * task-7-brief.md), so that's not the reason — it's that official
 * bilingual documents conventionally keep the date itself script-neutral so
 * it stays legible regardless of which language the rest of the page is in.
 * `Asia/Kolkata` pinned explicitly so the date doesn't drift a day depending
 * on the server process's own timezone.
 */
function formatDossierDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Cover section (B4 spec item 1): AC no + name, date, "prepared by". The
 * candidate block (name/photo/party) is always omitted — `CandidateDoc`
 * doesn't exist until Phase C (brief decision 7) — so this degrades
 * gracefully to AC/date/prepared-by only, never a broken/empty-looking gap.
 */
export function CoverSection({
  acNo,
  acNameEnglish,
  locale,
  t,
  preparedByName,
  generatedAt,
}: Props) {
  const acName = displayAcName(locale, acNameEnglish);

  return (
    <DossierSection
      aria-label={t("dossier.title")}
      className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          {t("dossier.subtitle")}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("dossier.cover.acLine", { ac: String(acNo), name: acName })}
        </h1>
      </div>

      {/*
        Candidate block (name/photo/party) intentionally omitted — see
        function doc comment above. Nothing renders here at all, rather than
        an empty placeholder card, so the cover reads as complete on its own.
      */}

      <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          {t("dossier.cover.date")}: {formatDossierDate(generatedAt)}
        </p>
        <p>{t("dossier.cover.preparedBy", { name: preparedByName })}</p>
      </div>
    </DossierSection>
  );
}
