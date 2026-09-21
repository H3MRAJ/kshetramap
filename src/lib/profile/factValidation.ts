import type { Fact } from "./profileRepo";

/** Whether a `Fact.value` is meaningfully set (non-blank string / finite number). */
function hasMeaningfulValue<T>(value: T): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return true;
}

/**
 * True when `fact` has a real `value` but no `source` — the exact condition
 * the profile editor's client-side save gate (B-Task 5 brief, decision 5)
 * must block on: "a fact is only savable with a source ... a fact with
 * neither value nor source is fine to leave empty/unset." `undefined`
 * (the field was never touched) and a fact with neither value nor source
 * both return `false` here.
 */
export function factHasUnsourcedValue<T>(fact: Fact<T> | undefined): boolean {
  if (!fact) return false;
  return hasMeaningfulValue(fact.value) && fact.source.trim().length === 0;
}

/**
 * Scans an object of optional `Fact` fields (e.g. a `ProfileSnapshot`) and
 * returns the keys of any fact that fails `factHasUnsourcedValue`. Each
 * profile tab's save handler uses this as its client-side source-required
 * gate before PUTting a section patch.
 */
export function findUnsourcedFactKeys<S extends Record<string, unknown>>(
  section: S,
  factKeys: readonly (keyof S)[]
): (keyof S)[] {
  return factKeys.filter((key) =>
    factHasUnsourcedValue(section[key] as Fact<unknown> | undefined)
  );
}
