"use client";

import type { MapMode } from "@/lib/types";
import { useT } from "@/lib/i18n/LanguageProvider";

type Props = {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
};

const MODE_IDS: MapMode[] = ["winner", "heat", "margin", "strength"];

export function ModeToggle({ mode, onChange }: Props) {
  const t = useT();
  const options = MODE_IDS.map((id) => ({
    id,
    label: t(`mode.${id}`),
    title: t(`mode.${id}Title`),
  }));

  return (
    <div className="grid w-full grid-cols-2 gap-0.5 rounded-lg border border-zinc-300 bg-zinc-100 p-0.5 sm:grid-cols-4 dark:border-zinc-700 dark:bg-zinc-900">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          title={opt.title}
          onClick={() => onChange(opt.id)}
          className={`rounded-md px-2 py-1.5 text-xs font-medium transition sm:text-sm ${
            mode === opt.id
              ? "bg-emerald-600 text-white shadow-sm dark:bg-white dark:text-black"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
