import type { SourceEntry } from "@/lib/dossier/sources";
import { DossierSection } from "./DossierSection";
import type { DossierSectionCommonProps } from "./types";

type Props = DossierSectionCommonProps & {
  /** The exact `compileSources(profile)` result computed once in `page.tsx` — never recomputed here. */
  sources: SourceEntry[];
};

/**
 * Sources section (B4 spec item 6): numbered list of every source + `as_of`.
 * Deliberately the simplest section in the dossier — it just renders the
 * already-computed `sources[]` array (`page.tsx`'s single `compileSources(profile)`
 * call, threaded down like `sourceIndex`) as an `<ol>`, whose browser-rendered
 * numbering matches `sourceIndex`'s 1-based positions by construction
 * (`buildSourceIndex()` assigns `array index + 1`, the same order `sources[]`
 * is already in) — so list position === every superscript number seen
 * throughout Cover/Snapshot/Social/Economic/Political.
 */
export function SourcesSection({ sources, t }: Props) {
  return (
    <DossierSection aria-label={t("dossier.sources.title")} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("dossier.sources.title")}
      </h2>
      {sources.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("dossier.noEntries")}</p>
      ) : (
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          {sources.map((s) => (
            <li key={s.source} className="text-sm text-zinc-800 dark:text-zinc-200">
              <span>{s.source}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {" — "}
                {t("dossier.sources.asOf", { date: s.as_of })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </DossierSection>
  );
}
