import type { Locale } from "@/lib/i18n/types";
import type { SourceIndex } from "@/lib/dossier/sources";

/**
 * The `t()` shape every dossier section receives. Bound to a single
 * request-resolved `Locale` via a closure in `page.tsx`
 * (`(key, vars) => translate(locale, key, vars)`) — never
 * `useLanguage()`/`LanguageProvider`. See `page.tsx`'s `resolveLocale()` and
 * task-7-report.md's "Architecture" section for why this whole page tree
 * resolves locale server-side instead.
 */
export type DossierT = (
  key: string,
  vars?: Record<string, string | number>
) => string;

/**
 * Props every dossier section shares, regardless of which slice of
 * profile/political data it additionally needs. `sourceIndex` is computed
 * ONCE in `page.tsx` (`compileSources(profile)` -> `buildSourceIndex(...)`)
 * and passed down unchanged to every section — see `@/lib/dossier/sources`'s
 * `SourceIndex` doc comment and task-7-report.md for the full rationale.
 * Sections 3-6 (B-Tasks 8/9) should extend this type with their own
 * additional data props, the same way `CoverSection`/`SnapshotSection` do
 * in this file's sibling components.
 */
export type DossierSectionCommonProps = {
  locale: Locale;
  t: DossierT;
  sourceIndex: SourceIndex;
};
