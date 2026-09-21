import type { FocusYearPoint } from "@/lib/historyFocus";
import type { PoliticalBlockFocusYear } from "./politicalBlock";

/**
 * Adapts `PoliticalBlock.focus.series[]` (`{year, votes, share, on_ballot}`,
 * B-Task 3's curated shape) into `VoteShareLine`'s `points` prop shape
 * (`FocusYearPoint[]`, `@/lib/historyFocus` — Module-1's richer History-tab
 * data model). `VoteShareLine.tsx` only ever reads `year`/`on_ballot`/
 * `share`/`votes` off each point (verified by reading its source directly —
 * task-9 brief); `total_valid`/`electors_total`/`nota` are declared on
 * `FocusYearPoint` but never read there. `PoliticalBlock` doesn't carry
 * those three fields, so they're filled with inert placeholders here purely
 * to satisfy the prop type — `total_valid: 0`, `electors_total: null`,
 * `nota: 0` are NOT real data and must never be read back out of the
 * result; this adapter exists so the dossier can reuse the real Module-1
 * chart component without loosening or modifying `VoteShareLine.tsx`'s
 * actual type.
 */
export function toFocusYearPoints(series: PoliticalBlockFocusYear[]): FocusYearPoint[] {
  return series.map((y) => ({
    year: y.year,
    votes: y.votes,
    share: y.share,
    on_ballot: y.on_ballot,
    // Inert placeholders — see doc comment above.
    total_valid: 0,
    electors_total: null,
    nota: 0,
  }));
}
