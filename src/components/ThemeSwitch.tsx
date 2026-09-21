"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  useTheme,
  type ThemePreference,
} from "@/lib/theme/ThemeProvider";

type Props = {
  className?: string;
};

const OPTIONS: { id: ThemePreference; icon: string; titleKey: string }[] = [
  { id: "light", icon: "☀", titleKey: "theme.light" },
  { id: "dark", icon: "☾", titleKey: "theme.dark" },
  { id: "system", icon: "◐", titleKey: "theme.system" },
];

export function ThemeSwitch({ className = "" }: Props) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      role="group"
      aria-label={t("theme.label")}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            title={t(opt.titleKey)}
            aria-label={t(opt.titleKey)}
            aria-pressed={active}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition sm:h-8 sm:w-8 ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
