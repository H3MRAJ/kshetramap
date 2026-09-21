"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { factHasUnsourcedValue } from "@/lib/profile/factValidation";
import type { Fact } from "@/lib/profile/profileRepo";

const inputCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400";

type Draft = { value: string; source: string; as_of: string; note: string };

/**
 * Reusable single-`Fact` editor: value + source + as_of + note, plus the
 * inline "source required" warning (B-Task 5 brief decision 5). Used for
 * every single-fact field in Snapshot/Social this task, and every
 * single-fact field Economic/Political/Brief add in B-Task 6.
 *
 * `value`/`onChange` operate on the whole `Fact<T>` object (not the spec's
 * literal flattened `label value source asOf onChange` props) since
 * `Fact = {value, source, as_of, note?}` is already the cohesive unit the
 * repo/API work with — see `web/src/lib/profile/profileRepo.ts`.
 *
 * Editing an empty fact back down to nothing (value/source/as_of/note all
 * blank) calls `onChange(undefined)` — the field goes back to "unset"
 * rather than persisting a hollow `{value:"",source:"",as_of:""}` object.
 */
export function FactInput<T extends string | number>({
  label,
  value,
  onChange,
  valueKind = "text",
}: {
  label: string;
  value: Fact<T> | undefined;
  onChange: (next: Fact<T> | undefined) => void;
  valueKind?: "text" | "number";
}) {
  const { t } = useLanguage();
  const warn = factHasUnsourcedValue(value);

  const rawValue = value?.value;
  const draft: Draft = {
    value: rawValue === undefined || rawValue === null ? "" : String(rawValue),
    source: value?.source ?? "",
    as_of: value?.as_of ?? "",
    note: value?.note ?? "",
  };

  function emit(next: Draft) {
    const isEmpty =
      next.value.trim() === "" &&
      next.source.trim() === "" &&
      next.as_of.trim() === "" &&
      next.note.trim() === "";
    if (isEmpty) {
      onChange(undefined);
      return;
    }
    const note = next.note.trim() === "" ? undefined : next.note;
    if (valueKind === "number") {
      const parsed = next.value.trim() === "" ? NaN : Number(next.value);
      onChange({
        value: (Number.isFinite(parsed) ? parsed : NaN) as T,
        source: next.source,
        as_of: next.as_of,
        note,
      });
    } else {
      onChange({ value: next.value as T, source: next.source, as_of: next.as_of, note });
    }
  }

  return (
    <fieldset className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <legend className="px-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {label}
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className={labelCls}>
          {t("profile.fact.value")}
          <input
            type={valueKind === "number" ? "number" : "text"}
            step={valueKind === "number" ? "any" : undefined}
            value={draft.value}
            onChange={(e) => emit({ ...draft, value: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          {t("profile.fact.source")}
          <input
            type="text"
            value={draft.source}
            onChange={(e) => emit({ ...draft, source: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          {t("profile.fact.asOf")}
          <input
            type="text"
            placeholder="2023 / 2023-06 / 2023-06-15"
            value={draft.as_of}
            onChange={(e) => emit({ ...draft, as_of: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          {t("profile.fact.note")}
          <input
            type="text"
            value={draft.note}
            onChange={(e) => emit({ ...draft, note: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>
      {warn && (
        <p className="mt-2 text-xs font-medium text-red-500">{t("profile.fact.sourceRequired")}</p>
      )}
    </fieldset>
  );
}
