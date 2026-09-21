# Module 2 Build Notes

Running log of choices/deviations from `SONNET5_MODULE2_BUILD_SPEC.md`,
per the spec's own instruction: "where something is genuinely ambiguous,
choose the smallest option consistent with this spec and note it here."

## Phase A

1. **No `@auth/mongodb-adapter`.** Custom `authorize()` queries our own
   `users` collection directly. The adapter's schema (`users`/`accounts`/
   `sessions`/`verification_tokens`) doesn't match spec §4's custom `users`
   shape, and credentials-provider sessions are JWT-based regardless of
   adapter presence, so the adapter would add unused collections for no
   benefit.
2. **`web/scripts/seed-admin.ts` is TypeScript**, run via `tsx`, not Python.
   It reuses the app's own `hashPassword()` (bcryptjs) directly instead of
   re-implementing bcrypt hashing in a second language. Module-1's Python
   scripts under `scripts/mongo/` are the data pipeline; this is an app-auth
   concern that lives naturally inside `web/`.
3. **Bare `GITHUB_PAGES=1 npm run build` already failed before any Module-2
   code existed** (`api/acs` missing `dynamic = "force-static"`,
   `api/ac/[acNo]/booth-position` missing `generateStaticParams()`) — this
   is pre-existing Module-1 state, out of scope to fix per the "don't modify
   Module-1 components" guardrail. The real, working static-export path is
   `npm run build:static` (see `RUNBOOK.md`), which parks all server-only
   route/page directories before building. **Use `npm run build:static` as
   the acceptance-test command for "static build still passes" in every
   phase from here on** — extend its `$ParkList` in `web/scripts/build-static.ps1`
   whenever a phase adds a new top-level server-only directory under `src/app`.
4. **`mongodb` driver pinned to `^6.21.0`** (not `7.x`) for stability with
   the wider Auth.js/Mongo ecosystem; fully compatible with MongoDB Server 7/8.
5. **Role checks are allow-list based** (`roleAllowed(role, ["admin"])`),
   not a numeric rank ladder — the five roles in spec §3 aren't a strict
   superset chain (worker/candidate/viewer have disjoint capabilities).
   `super_admin` implicitly passes every check; that's the only "ladder"
   that actually exists.
6. **No `proxy.ts`** (Next.js 16 renamed `middleware.ts` → `proxy.ts` and
   its own docs now recommend against relying on it for auth). Enforcement
   is per-route/per-layout: API routes call `requireApiSession()`, server
   pages call `auth()` directly and `redirect()`. This is exactly what spec
   §3 already mandates ("Server-side enforcement in every API route...
   UI hiding is not security"), so nothing is lost.
7. **`next-auth@5.0.0-beta.32`** — the latest v5 beta at build time; verified
   it declares `next: ^16.0.0` as a compatible peer (the `next-auth@4.x`
   stable line also supports Next 16, but the spec asks for v5/Auth.js).

## Phase B

Constituency profile data layer + editor (5 tabs), the computed political
block, profile/dossier API routes, and the full dossier page (6 sections,
print CSS, PDF download, map handling). B-Task 11 (this entry) is the final
acceptance walkthrough; see `.superpowers/sdd/SONNET5_MODULE2_PHASE_B_C/
task-11-report.md` for the full real-system test run this section summarizes.

1. **Vote-share chart hidden entirely in print, not just "kept visible in
   color."** Spec acceptance test #4 says "charts visible in color" for the
   dossier print/PDF output. `VoteShareChart.tsx`'s wrapper carries
   `.dossier-chart-no-print`, and `globals.css`'s `@media print` block forces
   `display: none` on it — the chart never appears in print at all. Same
   reasoning the spec itself already applies to the live MapLibre map:
   Recharts' SVG output does not print reliably (with the current library
   version and print pipeline). **This deviation was surfaced to and
   explicitly approved by the human partner before B-Task 11 started.**
   Resolution: "clean, non-broken print output" satisfies test #4's intent;
   the literal "chart visible" wording is a documented, approved exception,
   not a failure. Re-verified directly in B-Task 11 (real Chromium print-media
   emulation): A4 page size, one section per printed page (`break-after: page`
   on all 6 `.dossier-page` sections), nav and Download-PDF button both
   hidden, Sources rendered last — every other part of test #4 passes for
   real; only the chart-visibility clause is the accepted exception.
2. **`booth_summary` sourced from `booths.geojson`, not `elections/*.json`.**
   One version of the spec text literally named `elections/*.json` as the
   source for booth-strength counts. `politicalBlock.ts`'s
   `summarizeBoothStrength()` reads `booths.geojson` instead (via the same
   `classifyBoothStrength()` Module-1's own `BoothMap.tsx` already uses) —
   `booths.geojson` is the file that actually carries per-booth Form-20
   share/valid-vote data in the shape `classifyBoothStrength()` expects;
   `elections/*.json` does not. B-Task 3's controller-made correction,
   documented in-line in `politicalBlock.ts` itself (see its doc comment
   above `summarizeBoothStrength`). `na`-tier booths are tallied as an
   explicit 4th bucket so `strong + average + weak + na` always equals
   `total_booths` — no silent undercount.
3. **Dossier locale resolution is server-rendered and `?lang=`-only,
   bypassing the app-wide `LanguageProvider`/`localStorage` default —
   default Hindi, not English.** Deliberate, route-scoped architectural
   choice (B-Task 7): the dossier tree is a plain server component (no
   `"use client"`/`useLanguage()` anywhere in its render path, the two
   exceptions below aside), so its locale must be a pure function of the URL
   alone — two people opening the identical dossier link must see the same
   language, and `window.print()`/PDF export need fully server-rendered
   content, not client-JS-painted text. `resolveLocale()` in
   `src/app/ac/[acNo]/dossier/page.tsx` defaults to `"hi"` whenever `?lang`
   is absent, an array, or anything other than exactly `"en"` — the inverse
   of the rest of the app's English-unless-`?lang=hi`,
   remembered-in-`localStorage` default. Every dossier section receives the
   resolved `t`/`locale` as props; none resolve it themselves.
4. **AC-scope extension mechanism for `requirePageSession`/
   `requireApiSession`.** The spec requires "must pass `hasAcScope`" but does
   not specify the concrete plumbing. B-Task 4/5 added an optional third
   (`requireApiSession`) / second (`requirePageSession`) `acNo?: number`
   parameter (`src/lib/api/session.ts`): when given, a session must be
   `super_admin` *or* have `acNo` in its `ac_scope` in addition to passing the
   existing role check, else `403 forbidden` (API) / redirect to `/app`
   (page). The scope check only runs when `acNo !== undefined`, so every
   pre-existing call site (Phase A's `me`, `admin/users`, `admin/audit`
   routes/pages) is unaffected. This is the pattern Phase C should reuse for
   candidates/activities routes rather than inventing a second mechanism.
   Re-verified end-to-end for real in B-Task 11 (test #7): a `viewer`-role
   session in-scope for AC 178 reads the dossier/profile (`200`) but gets
   `403 forbidden` on `PUT /profile`; an `admin`-role session scoped only to
   AC 999 gets `403` on both `GET /dossier` and `PUT /profile` for AC 178.
5. **Brief tab's Hindi "seed from data" button inserts the same English text,
   explicitly labeled, rather than fabricating a Hindi paragraph.**
   `ac-series.json`'s `narrative[]` (the source for the seed paragraph) is
   English-only; machine-translating it would cross into "not a template
   string" territory the brief explicitly ruled out for this feature. Rather
   than omitting the Hindi seed affordance entirely, `BriefTab.tsx`'s Hindi
   button inserts the identical English `narrativeSeed` text but is labeled
   "Insert English text (needs translation)" — an unmistakable placeholder
   the curator must rewrite, never presented as a real Hindi narrative. Ties
   directly to the project's standing "no fabricated data" guardrail.
6. **`caste_notes`/`communities`/`institutions`/`economic.occupations`
   repeating-list scope correction.** The spec's own "repeating lists" bullet
   listed `schemes`/`issues`/`key_leaders`/`projects` but did not call out
   `social.caste_notes`/`social.communities`/`social.institutions` or
   `economic.occupations` as also being repeating lists needing the same
   add/remove/reorder editor chrome. B-Tasks 5/6 caught this gap (Task 5
   moved `caste_notes`/`communities`/`institutions` into its own scope since
   the Social tab needs them; Task 6 did the same for `occupations`) and
   built all seven repeating-list fields on one shared, generic
   `RepeatingListEditor` component (`src/app/app/profile/[ac]/
   RepeatingListEditor.tsx`) rather than a narrower one that would have
   needed reworking later.
7. **Two deliberate, narrowly-scoped client-component exceptions in an
   otherwise fully server-rendered dossier.** `VoteShareChart.tsx` (B-Task 9)
   and `DownloadPdfButton.tsx` (B-Task 10) are the only `"use client"`
   modules anywhere under `src/app/ac/[acNo]/dossier/`. Both exist because
   their behavior is fundamentally client-only (Recharts needs a DOM to
   render into; `window.print()` and reading the live `?print=1` query param
   both need a browser), and both are deliberately thin — `VoteShareChart`
   only calls a pure adapter (`toFocusYearPoints()`) and renders Module-1's
   unmodified `VoteShareLine`; `DownloadPdfButton` takes a single
   server-resolved `label` string prop and never calls `useLanguage()`
   itself. Anyone extending the dossier later should keep this ratio —
   default to server components, reach for a client boundary only when the
   browser API genuinely requires it, and keep the client surface itself as
   thin as these two.
8. **Hand-maintained (not automatically enforced) dark-mode print-override
   class list in `globals.css`.** Print output must always render light
   regardless of the viewer's active theme (Chromium print always ignores
   `prefers-color-scheme`-driven expectations here in a way that needed
   explicit handling), but CSS cannot "strip" the compiled `.dark\:*`
   Tailwind classes already on the page — so B-Task 10 grepped every `dark:`
   color utility actually used across the six dossier section files +
   `FactStat.tsx` (24 distinct classes at the time) and wrote one
   `body:has(.dossier-page) .dark\:X { ... !important }` override per class,
   each restating that utility's own paired light-mode value. **This is a
   closed, hand-maintained enumeration, not a generic mechanism**: a future
   dossier section that introduces a new `dark:` color class not already in
   that list will silently keep its dark-mode color in print (no broken
   layout, just a degraded "always light in print" guarantee for that one
   element). Anyone adding a new `dark:` utility to a dossier section file
   must add a matching override to the `@media print` block in
   `globals.css` in the same change.
