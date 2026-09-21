import { Suspense } from "react";
import { notFound } from "next/navigation";
import { readFile, stat } from "fs/promises";
import path from "path";

import { requirePageSession } from "@/lib/api/session";
import { getProfile, emptyProfileSkeleton } from "@/lib/profile/profileRepo";
import { getPoliticalBlock } from "@/lib/dossier/politicalBlock";
import { buildSourceIndex, compileSources } from "@/lib/dossier/sources";
import { translate } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import type { Meta } from "@/lib/types";
import { CoverSection } from "./CoverSection";
import { SnapshotSection } from "./SnapshotSection";
import { SocialSection } from "./SocialSection";
import { EconomicSection } from "./EconomicSection";
import { PoliticalSection } from "./PoliticalSection";
import { SourcesSection } from "./SourcesSection";
import { DownloadPdfButton } from "./DownloadPdfButton";
import type { DossierT } from "./types";

/**
 * The dossier ("leadership briefing") — B4 spec, `/ac/[acNo]/dossier`.
 *
 * ARCHITECTURE (read before touching this file, and before briefing
 * B-Tasks 8/9/10 against it): this whole route tree is a plain server
 * component. It never renders `LanguageProvider`/`useLanguage()`/`"use
 * client"` anywhere — see `resolveLocale()` below. Two spec requirements
 * force this: (1) "Hindi default; `?lang=en` switch" inverts the app-wide
 * default (English unless `?lang=hi`, remembered via `localStorage`) — the
 * dossier's language must be a pure function of the URL alone, so two
 * different people opening the same URL see the same language; (2) it's
 * explicitly a "server component" in the spec, and needs to be genuinely
 * print/PDF-friendly for B-Task 10 (`window.print()` needs content already
 * fully rendered, not client-JS-painted). This also means there is no
 * hydration-mismatch risk to defend against for anything rendered here.
 */

async function loadMeta(acNo: string): Promise<Meta | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "data", `ac-${acNo}`, "meta.json"),
      "utf-8"
    );
    return JSON.parse(raw) as Meta;
  } catch {
    return null;
  }
}

/** `Number(ac)` on a non-numeric segment yields `NaN`, not a throw — must be checked explicitly. */
function parseAcParam(ac: string): number | null {
  const acNo = Number(ac);
  return Number.isNaN(acNo) ? null : acNo;
}

/**
 * B-Task 10 (print/PDF): `public/data/ac-<ac>/dossier-map.png`, checked via
 * `fs/promises` `stat()` in a try/catch — same pattern `loadMeta()` above
 * already uses for reading this AC's JSON data. There is no real
 * `dossier-map.png` in this repo today (the optional
 * `scripts/render_dossier_map.py` generator was left for a later pass — see
 * task-10-report.md), so this resolves to `null` for every AC currently,
 * exercising the "map absent" path this function exists to make safe:
 * `PoliticalSection` must render nothing (no broken `<img>`, no empty gap)
 * when this is `null`, never throw.
 */
async function dossierMapUrl(acNo: string): Promise<string | null> {
  const abs = path.join(process.cwd(), "public", "data", `ac-${acNo}`, "dossier-map.png");
  try {
    await stat(abs);
    return `/data/ac-${acNo}/dossier-map.png`;
  } catch {
    return null;
  }
}

/**
 * Resolves the dossier's locale directly from `?lang=`, server-side, using
 * the pure `translate()`/`messagesFor()` functions from `@/lib/i18n`
 * instead of `useLanguage()`/`LanguageProvider` (which reads `localStorage`
 * + the URL and defaults to English). Default is `"hi"` — the inverse of
 * the app-wide default — whenever `lang` is absent, an array (repeated
 * `?lang=`), or anything other than exactly `"en"`. This is the single
 * source of truth for locale on this page tree; every section receives the
 * resulting `t`/`locale` as props rather than resolving it themselves.
 */
function resolveLocale(searchParams: Record<string, string | string[] | undefined>): Locale {
  const raw = searchParams.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "en" ? "en" : "hi";
}

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ acNo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ acNo: acNoParam }, sp] = await Promise.all([params, searchParams]);
  const acNo = parseAcParam(acNoParam);
  if (acNo === null) notFound();

  const meta = await loadMeta(acNoParam);
  if (!meta) notFound();

  // Viewer+ (any authenticated role) gated by AC scope only — any role
  // passes the role check, `acNo` is the only gate that matters,
  // `super_admin` bypasses it (brief decision 1; mirrors
  // GET /api/v1/acs/[ac]/profile's exact pattern).
  const session = await requirePageSession(undefined, acNo);

  const locale = resolveLocale(sp);
  const t: DossierT = (key, vars) => translate(locale, key, vars);

  const [profileDoc, politicalBlock, mapImageUrl] = await Promise.all([
    getProfile(acNo),
    getPoliticalBlock(acNo),
    dossierMapUrl(acNoParam),
  ]);
  const profile = profileDoc ?? emptyProfileSkeleton(acNo);

  // Shared source-numbering infrastructure (brief decision 4): compiled and
  // indexed ONCE here, then threaded down through every section via props —
  // never recomputed locally by a section. See task-7-report.md for the
  // exact shape B-Task 8/9 must consume and `@/lib/dossier/sources`'s
  // `SourceIndex`/`buildSourceIndex()` doc comments for the contract.
  const sources = compileSources(profile);
  const sourceIndex = buildSourceIndex(sources);

  return (
    <main className="h-full overflow-y-auto bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        {/*
          Download PDF — the dossier's second and final client-boundary
          exception (see DownloadPdfButton.tsx's doc comment). Wrapped in
          Suspense because it calls useSearchParams(), same requirement
          AcWorkspaceNav.tsx's own useSearchParams() usage already has in
          layout.tsx. Hidden from the print/PDF output itself via
          `dossier-print-hide` (globals.css's @media print block).
        */}
        <div className="flex justify-end">
          <Suspense fallback={null}>
            <DownloadPdfButton label={t("dossier.downloadPdf")} />
          </Suspense>
        </div>
        <CoverSection
          acNo={acNo}
          acNameEnglish={meta.constituency.name}
          locale={locale}
          t={t}
          sourceIndex={sourceIndex}
          preparedByName={session.user.name}
          generatedAt={new Date()}
        />
        <SnapshotSection
          snapshot={profile.snapshot}
          politicalBlock={politicalBlock}
          locale={locale}
          t={t}
          sourceIndex={sourceIndex}
        />
        <SocialSection social={profile.social} locale={locale} t={t} sourceIndex={sourceIndex} />
        <EconomicSection economic={profile.economic} locale={locale} t={t} sourceIndex={sourceIndex} />
        <PoliticalSection
          political={profile.political}
          briefEn={profile.brief_en}
          briefHi={profile.brief_hi}
          politicalBlock={politicalBlock}
          mapImageUrl={mapImageUrl}
          locale={locale}
          t={t}
          sourceIndex={sourceIndex}
        />
        <SourcesSection sources={sources} locale={locale} t={t} sourceIndex={sourceIndex} />
      </div>
    </main>
  );
}
