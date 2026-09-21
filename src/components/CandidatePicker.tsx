"use client";

import type { Candidate } from "@/lib/types";
import { partyDisplayLabel } from "@/lib/partyMeta";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayCandidateName } from "@/lib/i18n/displayNames";

type Props = {
  candidates: Candidate[];
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
};

export function CandidatePicker({
  candidates,
  value,
  onChange,
  disabled,
}: Props) {
  const { locale, t } = useLanguage();
  const sorted = [...candidates].sort((a, b) => b.evm_votes - a.evm_votes);

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
      {t("booth.candidate")}
      <select
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal text-zinc-900 shadow-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {sorted.map((c) => (
          <option key={c.key} value={c.key}>
            {displayCandidateName(locale, c.key, c.name)} (
            {partyDisplayLabel(c.party)}) — {c.evm_votes.toLocaleString()}
          </option>
        ))}
      </select>
    </label>
  );
}
