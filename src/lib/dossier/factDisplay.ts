import type { Fact } from "@/lib/profile/profileRepo";
import type { SourceIndex } from "./sources";

/** What a dossier section actually renders for one curated `Fact`. */
export type FactDisplay = { text: string; supNumber: number | null };

/**
 * Shared core of `resolveFactDisplay()`/`resolveSourcedDisplay()`: given a
 * `source` string (possibly absent/empty), looks up its 1-based position in
 * `sourceIndex`. `null` covers both "no source at all" and the
 * (structurally unexpected) case where a non-empty `source` still isn't in
 * the index — e.g. a caller passing a `sourceIndex` built from a different
 * profile — so callers never have to special-case `undefined` themselves;
 * treat `supNumber === null` as "render with no superscript" either way.
 */
function resolveSupNumber(source: string | undefined, sourceIndex: SourceIndex): number | null {
  if (!source) return null;
  return sourceIndex.get(source) ?? null;
}

/**
 * Resolves how to render a single curated `Fact` in the dossier, given the
 * whole-dossier `sourceIndex` (see `buildSourceIndex()` in `./sources`).
 * Central place enforcing the "never render a fact whose source is missing"
 * guardrail (task-7 brief, decision 6): a fact that is absent, or present
 * but has an empty `source`, resolves to `{ text: "—", supNumber: null }` —
 * never a naked value, never a broken/undefined superscript. The same
 * fallback applies when `value` itself is blank/whitespace-only (string
 * `Fact`s only — a numeric `Fact`'s value is never "blank" in this sense,
 * `0` is a real value): a `Fact` needs BOTH a real value and a real source
 * to be worth citing, so a real-but-empty value with a real source must not
 * render as a citation-numbered empty string.
 *
 * When `fact.source` is a non-empty string it is expected to already be a
 * key in `sourceIndex`, because `sourceIndex` is built from
 * `compileSources()` walking the SAME profile doc the fact came from.
 *
 * `format` defaults to `String(value)`; pass one to render e.g. `"61.5%"`
 * from a `Fact<number>` instead of the bare number.
 */
export function resolveFactDisplay<T>(
  fact: Fact<T> | undefined,
  sourceIndex: SourceIndex,
  format: (value: T) => string = (v) => String(v)
): FactDisplay {
  if (!fact || !fact.source) return { text: "—", supNumber: null };
  if (typeof fact.value === "string" && fact.value.trim() === "") {
    return { text: "—", supNumber: null };
  }
  return { text: format(fact.value), supNumber: resolveSupNumber(fact.source, sourceIndex) };
}

/** What a dossier section renders for one item that carries `source`/`as_of` directly (no `Fact` wrapper). */
export type SourcedDisplay = { supNumber: number | null };

/**
 * Sibling to `resolveFactDisplay()` for the shape `caste_notes[]` and
 * `economic.schemes[]` use: items that carry `source`/`as_of` directly on
 * themselves rather than being `Fact`-wrapped (there's no generic `value`
 * field to fall back to "—" for — the item's own required fields, e.g.
 * `CasteNote.note`/`SchemeEntry.coverage_note`, are always rendered by the
 * caller regardless). This only resolves the numbered-superscript half of
 * the "never render a fact without a source" discipline: `supNumber` is
 * `null` when `source` is absent/empty or not found in `sourceIndex` — the
 * caller renders no `<sup>` in that case, same as `resolveFactDisplay`'s
 * `supNumber: null` case.
 */
export function resolveSourcedDisplay(
  item: { source?: string; as_of?: string } | undefined,
  sourceIndex: SourceIndex
): SourcedDisplay {
  return { supNumber: resolveSupNumber(item?.source, sourceIndex) };
}
