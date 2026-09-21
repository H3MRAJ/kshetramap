"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { findUnsourcedFactKeys } from "@/lib/profile/factValidation";
import type { ProfileSnapshot } from "@/lib/profile/profileRepo";
import { FactInput } from "./FactInput";
import type { SaveResult } from "./types";

const FACT_KEYS = [
  "area_note",
  "hq_note",
  "blocks",
  "panchayats",
  "literacy_pct",
  "sex_ratio",
] as const;

export function SnapshotTab({
  initialSnapshot,
  saving,
  onSave,
  onDirtyChange,
}: {
  initialSnapshot: ProfileSnapshot;
  saving: boolean;
  onSave: (snapshot: ProfileSnapshot) => Promise<SaveResult>;
  /** Reports whether local state has diverged from the last successfully-saved state (finding 7). */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot>(initialSnapshot);
  // Baseline for dirty-tracking: the last value either loaded or successfully
  // saved — NOT `initialSnapshot` re-read on every render (which never
  // changes for this mounted instance anyway, since it's a `useState`
  // initializer), so dirty correctly clears right after a successful save.
  const [savedSnapshot, setSavedSnapshot] = useState<ProfileSnapshot>(initialSnapshot);
  const [error, setError] = useState<string | null>(null);

  const blockedKeys = useMemo(
    () => findUnsourcedFactKeys(snapshot, FACT_KEYS),
    [snapshot]
  );

  const isDirty = useMemo(
    () => JSON.stringify(snapshot) !== JSON.stringify(savedSnapshot),
    [snapshot, savedSnapshot]
  );
  useEffect(() => {
    onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  function update<K extends keyof ProfileSnapshot>(key: K, value: ProfileSnapshot[K]) {
    setSnapshot((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blockedKeys.length > 0) return; // defense in depth; button is already disabled
    const result = await onSave(snapshot);
    if (result.ok) setSavedSnapshot(snapshot);
    if (!result.ok) setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FactInput
        label={t("profile.snapshot.areaNote")}
        value={snapshot.area_note}
        onChange={(v) => update("area_note", v)}
      />
      <FactInput
        label={t("profile.snapshot.hqNote")}
        value={snapshot.hq_note}
        onChange={(v) => update("hq_note", v)}
      />
      <FactInput
        label={t("profile.snapshot.blocks")}
        value={snapshot.blocks}
        onChange={(v) => update("blocks", v)}
      />
      <FactInput
        label={t("profile.snapshot.panchayats")}
        value={snapshot.panchayats}
        onChange={(v) => update("panchayats", v)}
      />
      <FactInput
        label={t("profile.snapshot.literacyPct")}
        value={snapshot.literacy_pct}
        onChange={(v) => update("literacy_pct", v)}
        valueKind="number"
      />
      <FactInput
        label={t("profile.snapshot.sexRatio")}
        value={snapshot.sex_ratio}
        onChange={(v) => update("sex_ratio", v)}
        valueKind="number"
      />

      {blockedKeys.length > 0 && (
        <p className="text-sm font-medium text-red-500">{t("profile.saveBlocked")}</p>
      )}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || blockedKeys.length > 0}
        className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {saving ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}
