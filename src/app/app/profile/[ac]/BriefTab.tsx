"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SaveResult } from "./types";

const textareaCls =
  "w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400";

/**
 * Brief tab: `brief_en`/`brief_hi` free-text narrative fields, plus a
 * "Seed from data" button (English only) that inserts `narrativeSeed` —
 * `getPoliticalBlock(acNo)`'s already-computed joined paragraph from
 * `ac-series.json`'s `narrative[]` array — as a plain template insertion,
 * never an LLM call, per the brief's explicit constraint.
 *
 * There is no Hindi equivalent of `narrative_seed` (`ac-series.json`'s
 * narrative is English-only, and machine-translating it would cross into
 * "not a template string" territory the brief explicitly rules out). Rather
 * than leaving `brief_hi` with no seed affordance at all, its button is
 * present but copies the exact same English `narrativeSeed` text in
 * unmodified — labeled distinctly ("Insert English text (needs
 * translation)") so it reads as an obviously-untranslated starting point
 * the editor must rewrite, not a fabricated Hindi paragraph.
 */
export function BriefTab({
  initialBriefEn,
  initialBriefHi,
  narrativeSeed,
  saving,
  onSave,
  onDirtyChange,
}: {
  initialBriefEn?: string;
  initialBriefHi?: string;
  narrativeSeed: string | null;
  saving: boolean;
  onSave: (patch: { brief_en?: string; brief_hi?: string }) => Promise<SaveResult>;
  /** Reports whether local state has diverged from the last successfully-saved state (finding 7). */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useLanguage();
  const [briefEn, setBriefEn] = useState(initialBriefEn ?? "");
  const [briefHi, setBriefHi] = useState(initialBriefHi ?? "");
  const [error, setError] = useState<string | null>(null);

  // Dirty-tracking baseline (finding 7).
  const [savedDraft, setSavedDraft] = useState({
    briefEn: initialBriefEn ?? "",
    briefHi: initialBriefHi ?? "",
  });
  const currentDraft = { briefEn, briefHi };
  const isDirty = useMemo(
    () => JSON.stringify(currentDraft) !== JSON.stringify(savedDraft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [briefEn, briefHi, savedDraft]
  );
  useEffect(() => {
    onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await onSave({ brief_en: briefEn, brief_hi: briefHi });
    if (result.ok) setSavedDraft(currentDraft);
    if (!result.ok) setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("profile.brief.briefEn")}
          </h3>
          <button
            type="button"
            onClick={() => narrativeSeed && setBriefEn(narrativeSeed)}
            disabled={!narrativeSeed}
            title={narrativeSeed ? undefined : t("profile.brief.seedUnavailable")}
            className="rounded-lg border border-dashed border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("profile.brief.seedFromData")}
          </button>
        </div>
        <label className={labelCls}>
          <textarea
            value={briefEn}
            onChange={(e) => setBriefEn(e.target.value)}
            className={textareaCls}
            rows={6}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("profile.brief.briefHi")}
          </h3>
          <button
            type="button"
            onClick={() => narrativeSeed && setBriefHi(narrativeSeed)}
            disabled={!narrativeSeed}
            title={narrativeSeed ? undefined : t("profile.brief.seedUnavailable")}
            className="rounded-lg border border-dashed border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("profile.brief.seedFromDataHi")}
          </button>
        </div>
        <label className={labelCls}>
          <textarea
            value={briefHi}
            onChange={(e) => setBriefHi(e.target.value)}
            className={textareaCls}
            rows={6}
          />
        </label>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {saving ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}
