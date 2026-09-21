"use client";

import { FormEvent, useState } from "react";
import { useT } from "@/lib/i18n/LanguageProvider";

type Props = {
  boothCount: number;
  onGo: (boothNo: number) => void;
  error?: string | null;
  onClearError?: () => void;
  dark?: boolean;
};

export function BoothGoto({
  boothCount,
  onGo,
  error,
  onClearError,
  dark = false,
}: Props) {
  const t = useT();
  const [value, setValue] = useState("");

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const n = parseInt(value.trim(), 10);
    if (!Number.isFinite(n)) return;
    onGo(n);
  }

  const inputCls = dark
    ? "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm tabular-nums text-white outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
    : "w-24 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm tabular-nums text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  const btnCls = dark
    ? "rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
    : "rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:opacity-40";

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <input
          id="booth-goto"
          type="number"
          inputMode="numeric"
          min={1}
          max={boothCount}
          placeholder={t("goto.placeholder", { n: boothCount })}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onClearError?.();
          }}
          className={inputCls}
        />
        <button type="submit" className={btnCls} disabled={!value.trim()}>
          {t("goto.go")}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {!error && (
        <p className={`text-[10px] ${dark ? "text-zinc-400" : "text-zinc-400"}`}>
          {t("goto.hint")}
        </p>
      )}
    </form>
  );
}
