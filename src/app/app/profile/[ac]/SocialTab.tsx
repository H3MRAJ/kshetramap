"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { findUnsourcedFactKeys } from "@/lib/profile/factValidation";
import type { CasteNote, ProfileSocial } from "@/lib/profile/profileRepo";
import { FactInput } from "./FactInput";
import { RepeatingListEditor } from "./RepeatingListEditor";
import type { SaveResult } from "./types";

const FACT_KEYS = ["religion_note", "migration_note"] as const;

/**
 * Editing draft for a `caste_notes[]` row. `granularity` is widened to
 * include `""` so a freshly-added row starts with NO granularity chosen
 * (a real, visible, un-preselected `<select>`, per the brief's decision 6
 * hard rule: "must be a required, visible selector — not a hidden
 * default") rather than silently defaulting to one of the four real values.
 * `""` is treated the same as an unsourced fact: it blocks save.
 */
type CasteNoteDraft = {
  group: string;
  group_hi: string;
  note: string;
  note_hi: string;
  source: string;
  as_of: string;
  granularity: CasteNote["granularity"] | "";
};

function toDraft(n: CasteNote): CasteNoteDraft {
  return {
    group: n.group,
    group_hi: n.group_hi ?? "",
    note: n.note,
    note_hi: n.note_hi ?? "",
    source: n.source,
    as_of: n.as_of,
    granularity: n.granularity,
  };
}

function emptyToUndefined(s: string): string | undefined {
  return s.trim() === "" ? undefined : s;
}

function fromDraft(d: CasteNoteDraft): CasteNote {
  return {
    group: d.group,
    group_hi: emptyToUndefined(d.group_hi),
    note: d.note,
    note_hi: emptyToUndefined(d.note_hi),
    source: d.source,
    as_of: d.as_of,
    // Only called after the granularityRequired gate confirms every draft's
    // granularity is one of the four real values, never "".
    granularity: d.granularity as CasteNote["granularity"],
  };
}

function newCasteNoteDraft(): CasteNoteDraft {
  return { group: "", group_hi: "", note: "", note_hi: "", source: "", as_of: "", granularity: "" };
}

function newCommunity(): ProfileSocial["communities"][number] {
  return { name: "", name_hi: "", note: "" };
}

function newInstitution(): ProfileSocial["institutions"][number] {
  return { name: "", type: "school", note: "" };
}

const inputCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400";

export function SocialTab({
  initialSocial,
  saving,
  onSave,
  onDirtyChange,
}: {
  initialSocial: ProfileSocial;
  saving: boolean;
  onSave: (social: ProfileSocial) => Promise<SaveResult>;
  /** Reports whether local state has diverged from the last successfully-saved state (finding 7). */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useLanguage();
  const [religionNote, setReligionNote] = useState(initialSocial.religion_note);
  const [migrationNote, setMigrationNote] = useState(initialSocial.migration_note);
  const [casteNotes, setCasteNotes] = useState<CasteNoteDraft[]>(
    initialSocial.caste_notes.map(toDraft)
  );
  const [communities, setCommunities] = useState(initialSocial.communities);
  const [institutions, setInstitutions] = useState(initialSocial.institutions);
  const [error, setError] = useState<string | null>(null);

  // Dirty-tracking baseline (finding 7): the draft-shaped snapshot of the
  // last-loaded-or-saved state, compared against the live draft fields below.
  const [savedDraft, setSavedDraft] = useState({
    religionNote: initialSocial.religion_note,
    migrationNote: initialSocial.migration_note,
    casteNotes: initialSocial.caste_notes.map(toDraft),
    communities: initialSocial.communities,
    institutions: initialSocial.institutions,
  });
  const currentDraft = { religionNote, migrationNote, casteNotes, communities, institutions };
  const isDirty = useMemo(
    () => JSON.stringify(currentDraft) !== JSON.stringify(savedDraft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [religionNote, migrationNote, casteNotes, communities, institutions, savedDraft]
  );
  useEffect(() => {
    onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const factSection = { religion_note: religionNote, migration_note: migrationNote };
  const blockedFactKeys = useMemo(
    () => findUnsourcedFactKeys(factSection, FACT_KEYS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [religionNote, migrationNote]
  );
  const missingGranularity = useMemo(
    () => casteNotes.some((c) => c.granularity === ""),
    [casteNotes]
  );
  const blocked = blockedFactKeys.length > 0 || missingGranularity;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blocked) return; // defense in depth; button is already disabled

    const social: ProfileSocial = {
      caste_notes: casteNotes.map(fromDraft),
      religion_note: religionNote,
      migration_note: migrationNote,
      communities,
      institutions,
    };
    const result = await onSave(social);
    if (result.ok) setSavedDraft(currentDraft);
    if (!result.ok) setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FactInput
        label={t("profile.social.religionNote")}
        value={religionNote}
        onChange={setReligionNote}
      />
      <FactInput
        label={t("profile.social.migrationNote")}
        value={migrationNote}
        onChange={setMigrationNote}
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.social.casteNotes.title")}
        </h3>
        <RepeatingListEditor<CasteNoteDraft>
          items={casteNotes}
          onChange={setCasteNotes}
          makeNewItem={newCasteNoteDraft}
          addLabel={t("profile.social.casteNotes.add")}
          emptyLabel={t("profile.social.casteNotes.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.social.casteNotes.group")}
                <input
                  required
                  value={item.group}
                  onChange={(e) => update({ group: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.casteNotes.groupHi")}
                <input
                  value={item.group_hi}
                  onChange={(e) => update({ group_hi: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.social.casteNotes.note")}
                <textarea
                  required
                  value={item.note}
                  onChange={(e) => update({ note: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.social.casteNotes.noteHi")}
                <textarea
                  value={item.note_hi}
                  onChange={(e) => update({ note_hi: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.casteNotes.source")}
                <input
                  required
                  value={item.source}
                  onChange={(e) => update({ source: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.casteNotes.asOf")}
                <input
                  required
                  value={item.as_of}
                  onChange={(e) => update({ as_of: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.casteNotes.granularity")}
                <select
                  required
                  value={item.granularity}
                  onChange={(e) =>
                    update({ granularity: e.target.value as CasteNoteDraft["granularity"] })
                  }
                  className={inputCls}
                >
                  <option value="" disabled>
                    {t("profile.social.casteNotes.granularityPlaceholder")}
                  </option>
                  <option value="district">
                    {t("profile.social.casteNotes.granularityDistrict")}
                  </option>
                  <option value="block">{t("profile.social.casteNotes.granularityBlock")}</option>
                  <option value="ac">{t("profile.social.casteNotes.granularityAc")}</option>
                  <option value="qualitative">
                    {t("profile.social.casteNotes.granularityQualitative")}
                  </option>
                </select>
                {item.granularity === "" && (
                  <span className="text-red-500">
                    {t("profile.social.casteNotes.granularityRequired")}
                  </span>
                )}
              </label>
            </div>
          )}
        />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.social.communities.title")}
        </h3>
        <RepeatingListEditor<ProfileSocial["communities"][number]>
          items={communities}
          onChange={setCommunities}
          makeNewItem={newCommunity}
          addLabel={t("profile.social.communities.add")}
          emptyLabel={t("profile.social.communities.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.social.communities.name")}
                <input
                  required
                  value={item.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.communities.nameHi")}
                <input
                  value={item.name_hi ?? ""}
                  onChange={(e) => update({ name_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.social.communities.note")}
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

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.social.institutions.title")}
        </h3>
        <RepeatingListEditor<ProfileSocial["institutions"][number]>
          items={institutions}
          onChange={setInstitutions}
          makeNewItem={newInstitution}
          addLabel={t("profile.social.institutions.add")}
          emptyLabel={t("profile.social.institutions.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.social.institutions.name")}
                <input
                  required
                  value={item.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.social.institutions.type")}
                <select
                  value={item.type}
                  onChange={(e) =>
                    update({
                      type: e.target.value as ProfileSocial["institutions"][number]["type"],
                    })
                  }
                  className={inputCls}
                >
                  <option value="school">{t("profile.social.institutions.typeSchool")}</option>
                  <option value="college">{t("profile.social.institutions.typeCollege")}</option>
                  <option value="hospital">{t("profile.social.institutions.typeHospital")}</option>
                  <option value="other">{t("profile.social.institutions.typeOther")}</option>
                </select>
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.social.institutions.note")}
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

      {blocked && (
        <p className="text-sm font-medium text-red-500">{t("profile.saveBlocked")}</p>
      )}
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
