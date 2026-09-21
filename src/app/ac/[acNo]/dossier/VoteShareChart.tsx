"use client";

import { VoteShareLine } from "@/components/history/charts/VoteShareLine";
import { toFocusYearPoints } from "@/lib/dossier/focusYearAdapter";
import type { PoliticalBlockFocusYear } from "@/lib/dossier/politicalBlock";

type Props = {
  series: PoliticalBlockFocusYear[];
  candidateName: string;
};

/**
 * Fixed emerald accent used throughout Phase A/B's UI. `PoliticalBlock`
 * deliberately doesn't surface the focus candidate's real brand color
 * (that lives in `ac-series.json`'s per-year `candidates[].color`, which
 * `getPoliticalBlock()` doesn't expose — task-9 brief decision: not worth
 * extending `PoliticalBlock`'s schema just for this cosmetic detail).
 */
const CHART_COLOR = "#10b981";

/**
 * The dossier's ONE deliberate, narrowly-scoped exception to the "no
 * `useLanguage()`/`\"use client\"` anywhere in this route tree" rule
 * established by B-Task 7 (see `page.tsx`'s ARCHITECTURE comment).
 *
 * `VoteShareLine` (Module-1, `@/components/history/charts/VoteShareLine.tsx`)
 * is itself a `"use client"` component built on Recharts, whose
 * `ResponsiveContainer` genuinely needs a real browser to measure/render —
 * there is no server-HTML equivalent. This component is the ONLY client
 * boundary in the whole dossier route: a plain Server Component
 * (`PoliticalSection`) renders it as a child and passes plain serializable
 * props (numbers/strings/booleans), same as any standard Next.js App Router
 * Server→Client composition. It does not read `useLanguage()`, does not
 * touch `localStorage`, and introduces no hydration-mismatch risk for the
 * rest of the page, which stays fully server-rendered.
 *
 * `VoteShareLine.tsx` itself is NOT modified (Module-1 component — see
 * AGENTS.md guardrail: don't touch Module-1 components except the one
 * nav-link addition already made in B-Task 7). The `points` prop's richer
 * `FocusYearPoint[]` shape is adapted from `PoliticalBlock.focus.series[]`
 * here via `toFocusYearPoints()` (`@/lib/dossier/focusYearAdapter`) — see
 * that function's doc comment for exactly which fields are real vs. inert
 * placeholders.
 *
 * `dossier-chart-no-print` is a bare CSS hook — no rules defined yet — for
 * B-Task 10's print stylesheet to hide this chart when printing/exporting
 * to PDF: Recharts SVG output doesn't print reliably, the same reason the
 * spec forbids embedding live MapLibre in the print view. This component
 * does not define any print CSS itself.
 */
export function VoteShareChart({ series, candidateName }: Props) {
  const points = toFocusYearPoints(series);
  return (
    <div className="dossier-chart-no-print">
      <VoteShareLine points={points} candidateName={candidateName} color={CHART_COLOR} />
    </div>
  );
}
