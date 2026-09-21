"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/types";

type Props = {
  /** Compact pill for header; default is small segmented control */
  className?: string;
};

export function LanguageSwitch({ className = "" }: Props) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      role="group"
      aria-label={t("lang.label")}
    >
      {LOCALES.map((l: Locale) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            title={l === "hi" ? t("lang.hi") : t("lang.en")}
            className={`min-w-[2.25rem] rounded-md px-2 py-1 text-xs font-semibold transition ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
