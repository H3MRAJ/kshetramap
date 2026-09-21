"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { findUnsourcedFactKeys } from "@/lib/profile/factValidation";
import type { ProfilePolitical } from "@/lib/profile/profileRepo";
import { FactInput } from "./FactInput";
import { RepeatingListEditor } from "./RepeatingListEditor";
import type { SaveResult } from "./types";

const FACT_KEYS = ["history_note", "organisation_note", "alliances_note"] as const;

type KeyLeader = ProfilePolitical["key_leaders"][number];

function newKeyLeader(): KeyLeader {
  return { name: "", name_hi: undefined, role: "", note: undefined };
}

const inputCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400";

export function PoliticalTab({
  initialPolitical,
  saving,
  onSave,
  onDirtyChange,
}: {
  initialPolitical: ProfilePolitical;
  saving: boolean;
  onSave: (political: ProfilePolitical) => Promise<SaveResult>;
  /** Reports whether local state has diverged from the last successfully-saved state (finding 7). */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useLanguage();
  const [historyNote, setHistoryNote] = useState(initialPolitical.history_note);
  const [organisationNote, setOrganisationNote] = useState(initialPolitical.organisation_note);
  const [alliancesNote, setAlliancesNote] = useState(initialPolitical.alliances_note);
  const [keyLeaders, setKeyLeaders] = useState(initialPolitical.key_leaders);
  const [error, setError] = useState<string | null>(null);

  // Dirty-tracking baseline (finding 7).
  const [savedDraft, setSavedDraft] = useState({
    historyNote: initialPolitical.history_note,
    organisationNote: initialPolitical.organisation_note,
    alliancesNote: initialPolitical.alliances_note,
    keyLeaders: initialPolitical.key_leaders,
  });
  const currentDraft = { historyNote, organisationNote, alliancesNote, keyLeaders };
  const isDirty = useMemo(
    () => JSON.stringify(currentDraft) !== JSON.stringify(savedDraft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyNote, organisationNote, alliancesNote, keyLeaders, savedDraft]
  );
  useEffect(() => {
    onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const factSection = {
    history_note: historyNote,
    organisation_note: organisationNote,
    alliances_note: alliancesNote,
  };
  const blockedFactKeys = useMemo(
    () => findUnsourcedFactKeys(factSection, FACT_KEYS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [historyNote, organisationNote, alliancesNote]
  );
  const blocked = blockedFactKeys.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blocked) return; // defense in depth; button is already disabled

    const political: ProfilePolitical = {
      history_note: historyNote,
      key_leaders: keyLeaders,
      organisation_note: organisationNote,
      alliances_note: alliancesNote,
    };
    const result = await onSave(political);
    if (result.ok) setSavedDraft(currentDraft);
    if (!result.ok) setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FactInput
        label={t("profile.political.historyNote")}
        value={historyNote}
        onChange={setHistoryNote}
      />
      <FactInput
        label={t("profile.political.organisationNote")}
        value={organisationNote}
        onChange={setOrganisationNote}
      />
      <FactInput
        label={t("profile.political.alliancesNote")}
        value={alliancesNote}
        onChange={setAlliancesNote}
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.political.keyLeaders.title")}
        </h3>
        <RepeatingListEditor<KeyLeader>
          items={keyLeaders}
          onChange={setKeyLeaders}
          makeNewItem={newKeyLeader}
          addLabel={t("profile.political.keyLeaders.add")}
          emptyLabel={t("profile.political.keyLeaders.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.political.keyLeaders.name")}
                <input
                  required
                  value={item.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.political.keyLeaders.nameHi")}
                <input
                  value={item.name_hi ?? ""}
                  onChange={(e) => update({ name_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.political.keyLeaders.role")}
                <input
                  required
                  value={item.role}
                  onChange={(e) => update({ role: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.political.keyLeaders.note")}
                <input
                  value={item.note ?? ""}
                  onChange={(e) => update({ note: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
            </div>
          )}
        />
      </section>

      {blocked && <p className="text-sm font-medium text-red-500">{t("profile.saveBlocked")}</p>}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || blocked}
        className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {saving ? t("profile.saving") : t("profile.save")}
      </button>
    </form>
  );
}
