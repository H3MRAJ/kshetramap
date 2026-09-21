"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Reusable repeating-list editing chrome: add / remove / reorder a list of
 * structured items. This task applies it to `social.caste_notes[]`,
 * `social.communities[]`, and `social.institutions[]`; B-Task 6 reuses the
 * exact same component for Economic's `occupations`/`schemes`/`projects`/
 * `issues` and Political's `key_leaders`.
 *
 * The component owns list-level mechanics only (add/remove/move-up/
 * move-down + the empty-state message) and delegates each item's own field
 * layout to `renderItem` — it has no idea what an item's fields are.
 *
 * `normalizeItems`, if given, runs on the array after every mutation
 * (add/remove/reorder/per-item update) before `onChange` is called — e.g.
 * B-Task 6's `economic.issues[]` can pass a normalizer that recomputes
 * `rank = index + 1` after every reorder, so the array's own order stays
 * the single source of truth for rank rather than a separate field the UI
 * has to keep in sync by hand.
 *
 * Items have no natural stable id in the schema, so `index` is used as the
 * React key — acceptable for this add/remove/reorder-by-swap usage.
 */
export function RepeatingListEditor<T>({
  items,
  onChange,
  renderItem,
  makeNewItem,
  addLabel,
  emptyLabel,
  normalizeItems,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  makeNewItem: () => T;
  addLabel: string;
  emptyLabel: string;
  normalizeItems?: (items: T[]) => T[];
}) {
  const { t } = useLanguage();

  function apply(next: T[]) {
    onChange(normalizeItems ? normalizeItems(next) : next);
  }

  function handleAdd() {
    apply([...items, makeNewItem()]);
  }

  function handleRemove(index: number) {
    apply(items.filter((_, i) => i !== index));
  }

  function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    apply(next);
  }

  function handleUpdate(index: number, patch: Partial<T>) {
    apply(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
      )}
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
        >
          <div className="min-w-0 flex-1">
            {renderItem(item, index, (patch) => handleUpdate(index, patch))}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => handleMove(index, -1)}
              disabled={index === 0}
              aria-label={t("profile.list.moveUp")}
              title={t("profile.list.moveUp")}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleMove(index, 1)}
              disabled={index === items.length - 1}
              aria-label={t("profile.list.moveDown")}
              title={t("profile.list.moveDown")}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={t("profile.list.remove")}
              title={t("profile.list.remove")}
              className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="self-start rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {addLabel}
      </button>
    </div>
  );
}
