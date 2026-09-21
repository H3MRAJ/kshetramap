import type { ConstituencyProfileDoc } from "@/lib/profile/profileRepo";

/** One compiled citation: a curated fact's `source` + the date granularity it was captured `as_of`. */
export type SourceEntry = { source: string; as_of: string };

function isPlainRecord(node: unknown): node is Record<string, unknown> {
  return typeof node === "object" && node !== null && !Array.isArray(node);
}

/**
 * A blank/whitespace-only `source` or `as_of` is treated the same as a
 * missing one — defense in depth alongside the server-side `.trim().min(1)`
 * zod validation in `@/lib/api/validation.ts`, so a record that somehow
 * reached storage with an empty-but-present `source`/`as_of` (e.g. data
 * seeded before that validation existed) still never gets compiled into the
 * Sources list as a citation nothing in the document actually points to.
 */
function hasSourceAndAsOf(node: Record<string, unknown>): node is Record<string, unknown> & SourceEntry {
  return (
    typeof node.source === "string" &&
    node.source.trim().length > 0 &&
    typeof node.as_of === "string" &&
    node.as_of.trim().length > 0
  );
}

/**
 * Depth-first walk of `node`'s own object/array structure. Every plain
 * object encountered that carries BOTH a string `source` and a string
 * `as_of` property (a `Fact`, or a `caste_notes`/`economic.schemes` entry —
 * both of which carry `source`/`as_of` directly without a `Fact` wrapper) is
 * appended to `out`. Arrays are walked index-by-index, objects via
 * `Object.entries()` in the object's own insertion-ordered key order — both
 * give "first-use order" for free, no section-order special-casing needed.
 * Walking continues into an object's own entries even after it matches (a
 * fact has never been observed to nest another fact, but nothing in the
 * shape guarantees that, so this stays generically correct rather than
 * assuming one level of nesting). Non-plain-object leaves (strings, numbers,
 * booleans, `Date`/`ObjectId` instances with no `source`/`as_of` of their
 * own) are inert — the walk just doesn't record anything for them.
 */
function walk(node: unknown, out: SourceEntry[]): void {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out);
    return;
  }
  if (!isPlainRecord(node)) return;

  if (hasSourceAndAsOf(node)) {
    out.push({ source: node.source, as_of: node.as_of });
  }

  for (const value of Object.values(node)) {
    walk(value, out);
  }
}

/**
 * Compiles the dossier's `sources[]` list from a constituency profile doc
 * (never `political` — `getPoliticalBlock()`'s shape has no `source`/`as_of`
 * anywhere, it's computed data, not curated facts). Generic recursive walk
 * (see `walk()`), then deduped by exact `source` string — first occurrence
 * wins (its `as_of` is the one kept), later duplicates dropped — preserving
 * first-encounter order throughout.
 */
export function compileSources(profile: ConstituencyProfileDoc): SourceEntry[] {
  const found: SourceEntry[] = [];
  walk(profile, found);

  const seen = new Set<string>();
  const deduped: SourceEntry[] = [];
  for (const entry of found) {
    if (seen.has(entry.source)) continue;
    seen.add(entry.source);
    deduped.push(entry);
  }
  return deduped;
}

/**
 * The dossier's shared source-numbering map: a compiled source's exact
 * `source` string -> its 1-based position in the `sources[]` list. Built
 * ONCE per dossier render (`compileSources(profile)` then
 * `buildSourceIndex(sources)`, both called a single time at the top of
 * `dossier/page.tsx`) and threaded down through every section component —
 * every section renders `<sup>{sourceIndex.get(fact.source)}</sup>` next to
 * a curated fact rather than computing its own local numbering, so the same
 * source is always cited with the same number everywhere in the document,
 * culminating in the numbered Sources page (B-Task 9).
 */
export type SourceIndex = Map<string, number>;

/**
 * Builds a `SourceIndex` from a `compileSources()` result. `compileSources`
 * already dedupes by exact `source` string, so this is a straight
 * `source -> (array index + 1)` mapping; the `index.has()` guard is a purely
 * defensive no-op against a hypothetical caller that passes an un-deduped
 * list (first occurrence would still win, matching `compileSources`'
 * own "first occurrence wins" rule).
 */
export function buildSourceIndex(sources: SourceEntry[]): SourceIndex {
  const index: SourceIndex = new Map();
  sources.forEach((entry, i) => {
    if (!index.has(entry.source)) index.set(entry.source, i + 1);
  });
  return index;
}
