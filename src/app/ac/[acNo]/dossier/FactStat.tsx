import type { Fact } from "@/lib/profile/profileRepo";
import type { SourceIndex } from "@/lib/dossier/sources";
import { resolveFactDisplay } from "@/lib/dossier/factDisplay";

type Props<T> = {
  fact: Fact<T> | undefined;
  sourceIndex: SourceIndex;
  /** Defaults to `String(value)` — pass one to render e.g. `"61.5%"` from a `Fact<number>`. */
  format?: (value: T) => string;
};

/**
 * Renders one curated `Fact` value with its numbered superscript source
 * marker (`<sup>{n}</sup>`) — or "—" when the fact is missing/has no
 * `source` (never a naked value, never a broken superscript; brief decision
 * 6). All the actual decision logic lives in the pure, unit-tested
 * `resolveFactDisplay()` (`@/lib/dossier/factDisplay`); this component is
 * just its JSX shell so every dossier section renders facts identically.
 */
export function FactStat<T>({ fact, sourceIndex, format }: Props<T>) {
  const { text, supNumber } = resolveFactDisplay(fact, sourceIndex, format);
  return (
    <>
      {text}
      {supNumber != null && (
        <sup className="ml-0.5 font-medium text-emerald-700 dark:text-emerald-400">
          {supNumber}
        </sup>
      )}
    </>
  );
}
