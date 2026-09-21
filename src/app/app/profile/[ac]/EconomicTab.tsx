"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { findUnsourcedFactKeys } from "@/lib/profile/factValidation";
import type { ProfileEconomic } from "@/lib/profile/profileRepo";
import { FactInput } from "./FactInput";
import { RepeatingListEditor } from "./RepeatingListEditor";
import { normalizeIssues, type Issue } from "./normalizeIssues";
import type { SaveResult } from "./types";

const FACT_KEYS = ["agriculture", "industry"] as const;

type Occupation = ProfileEconomic["occupations"][number];
type Scheme = ProfileEconomic["schemes"][number];
type Project = ProfileEconomic["projects"][number];

function newOccupation(): Occupation {
  return { label: "", label_hi: undefined, value: "", source: "", as_of: "", note: undefined };
}

function newScheme(): Scheme {
  return { name: "", name_hi: undefined, coverage_note: "", source: "", as_of: "" };
}

function newProject(): Project {
  return { title: "", title_hi: undefined, status: "proposed", year: undefined, note: undefined };
}

function newIssue(): Issue {
  // `rank` is a placeholder here — `normalizeIssues` recomputes it to match
  // display position immediately after every add/remove/reorder, so the
  // array's own order stays the single source of truth (per the brief).
  return { title: "", title_hi: undefined, rank: 0, note: undefined };
}

const inputCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400";

export function EconomicTab({
  initialEconomic,
  saving,
  onSave,
  onDirtyChange,
}: {
  initialEconomic: ProfileEconomic;
  saving: boolean;
  onSave: (economic: ProfileEconomic) => Promise<SaveResult>;
  /** Reports whether local state has diverged from the last successfully-saved state (finding 7). */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useLanguage();
  const [agriculture, setAgriculture] = useState(initialEconomic.agriculture);
  const [industry, setIndustry] = useState(initialEconomic.industry);
  const [occupations, setOccupations] = useState(initialEconomic.occupations);
  const [schemes, setSchemes] = useState(initialEconomic.schemes);
  const [projects, setProjects] = useState(initialEconomic.projects);
  const [issues, setIssues] = useState(initialEconomic.issues);
  const [error, setError] = useState<string | null>(null);

  // Dirty-tracking baseline (finding 7).
  const [savedDraft, setSavedDraft] = useState({
    agriculture: initialEconomic.agriculture,
    industry: initialEconomic.industry,
    occupations: initialEconomic.occupations,
    schemes: initialEconomic.schemes,
    projects: initialEconomic.projects,
    issues: initialEconomic.issues,
  });
  const currentDraft = { agriculture, industry, occupations, schemes, projects, issues };
  const isDirty = useMemo(
    () => JSON.stringify(currentDraft) !== JSON.stringify(savedDraft),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agriculture, industry, occupations, schemes, projects, issues, savedDraft]
  );
  useEffect(() => {
    onDirtyChange(isDirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const factSection = { agriculture, industry };
  const blockedFactKeys = useMemo(
    () => findUnsourcedFactKeys(factSection, FACT_KEYS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agriculture, industry]
  );
  const blocked = blockedFactKeys.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (blocked) return; // defense in depth; button is already disabled

    const economic: ProfileEconomic = {
      occupations,
      agriculture,
      industry,
      schemes,
      projects,
      issues,
    };
    const result = await onSave(economic);
    if (result.ok) setSavedDraft(currentDraft);
    if (!result.ok) setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FactInput
        label={t("profile.economic.agriculture")}
        value={agriculture}
        onChange={setAgriculture}
      />
      <FactInput
        label={t("profile.economic.industry")}
        value={industry}
        onChange={setIndustry}
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.economic.occupations.title")}
        </h3>
        <RepeatingListEditor<Occupation>
          items={occupations}
          onChange={setOccupations}
          makeNewItem={newOccupation}
          addLabel={t("profile.economic.occupations.add")}
          emptyLabel={t("profile.economic.occupations.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.economic.occupations.label")}
                <input
                  required
                  value={item.label}
                  onChange={(e) => update({ label: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.occupations.labelHi")}
                <input
                  value={item.label_hi ?? ""}
                  onChange={(e) => update({ label_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.occupations.value")}
                <input
                  required
                  value={item.value}
                  onChange={(e) => update({ value: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.occupations.source")}
                <input
                  required
                  value={item.source}
                  onChange={(e) => update({ source: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.occupations.asOf")}
                <input
                  required
                  value={item.as_of}
                  onChange={(e) => update({ as_of: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.occupations.note")}
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
          {t("profile.economic.schemes.title")}
        </h3>
        <RepeatingListEditor<Scheme>
          items={schemes}
          onChange={setSchemes}
          makeNewItem={newScheme}
          addLabel={t("profile.economic.schemes.add")}
          emptyLabel={t("profile.economic.schemes.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.economic.schemes.name")}
                <input
                  required
                  value={item.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.schemes.nameHi")}
                <input
                  value={item.name_hi ?? ""}
                  onChange={(e) => update({ name_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.economic.schemes.coverageNote")}
                <textarea
                  required
                  value={item.coverage_note}
                  onChange={(e) => update({ coverage_note: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.schemes.source")}
                <input
                  required
                  value={item.source}
                  onChange={(e) => update({ source: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.schemes.asOf")}
                <input
                  required
                  value={item.as_of}
                  onChange={(e) => update({ as_of: e.target.value })}
                  className={inputCls}
                />
              </label>
            </div>
          )}
        />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("profile.economic.projects.heading")}
        </h3>
        <RepeatingListEditor<Project>
          items={projects}
          onChange={setProjects}
          makeNewItem={newProject}
          addLabel={t("profile.economic.projects.add")}
          emptyLabel={t("profile.economic.projects.empty")}
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.economic.projects.title")}
                <input
                  required
                  value={item.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.projects.titleHi")}
                <input
                  value={item.title_hi ?? ""}
                  onChange={(e) => update({ title_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.projects.status")}
                <select
                  value={item.status}
                  onChange={(e) => update({ status: e.target.value as Project["status"] })}
                  className={inputCls}
                >
                  <option value="proposed">{t("profile.economic.projects.statusProposed")}</option>
                  <option value="ongoing">{t("profile.economic.projects.statusOngoing")}</option>
                  <option value="done">{t("profile.economic.projects.statusDone")}</option>
                </select>
              </label>
              <label className={labelCls}>
                {t("profile.economic.projects.year")}
                <input
                  type="number"
                  step="1"
                  value={item.year ?? ""}
                  onChange={(e) =>
                    update({
                      year: e.target.value.trim() === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className={inputCls}
                />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.economic.projects.note")}
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
          {t("profile.economic.issues.heading")}
        </h3>
        <RepeatingListEditor<Issue>
          items={issues}
          onChange={setIssues}
          makeNewItem={newIssue}
          addLabel={t("profile.economic.issues.add")}
          emptyLabel={t("profile.economic.issues.empty")}
          normalizeItems={normalizeIssues}
          renderItem={(item, index, update) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={labelCls}>
                {t("profile.economic.issues.title")}
                <input
                  required
                  value={item.title}
                  onChange={(e) => update({ title: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {t("profile.economic.issues.titleHi")}
                <input
                  value={item.title_hi ?? ""}
                  onChange={(e) => update({ title_hi: e.target.value || undefined })}
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                {/* `rank` is derived automatically from display order (see
                    `normalizeIssues`) — shown read-only, never a direct input,
                    so the array's order stays the one source of truth. */}
                {t("profile.economic.issues.rank")}
                <input value={`#${index + 1}`} disabled readOnly className={inputCls} />
              </label>
              <label className={`${labelCls} sm:col-span-2`}>
                {t("profile.economic.issues.note")}
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
