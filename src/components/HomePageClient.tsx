"use client";

import Link from "next/link";
import type { Meta } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayAcName,
  displayCandidateName,
  displayDistrict,
  displayElectionName,
} from "@/lib/i18n/displayNames";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeSwitch } from "./ThemeSwitch";

export function HomePageClient({ meta }: { meta: Meta | null }) {
  const { locale, t } = useLanguage();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            {t("brand")}
          </p>
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <LanguageSwitch />
          </div>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("home.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {t("home.blurb")}
        </p>

        {meta?.showcase && (
          <Link
            href={`/ac/${meta.constituency.ac_no}`}
            className="mt-6 block rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-4 shadow-sm transition hover:shadow-md dark:border-amber-700 dark:from-amber-950/40 dark:via-zinc-900 dark:to-emerald-950/40"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
              ★ {t("home.spotlight")}
            </div>
            <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {meta.showcase.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("home.spotlightBlurb")}
            </p>
            <div className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t("home.openMapBooth", { n: meta.showcase.booth_no })}
            </div>
          </Link>
        )}

        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {t("home.constituencies")}
          </h2>
          <ul className="mt-3 space-y-3">
            {meta ? (
              <li>
                <Link
                  href={`/ac/${meta.constituency.ac_no}`}
                  className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700"
                >
                  <div>
                    <div className="font-semibold text-zinc-900 group-hover:text-emerald-800 dark:text-zinc-50 dark:group-hover:text-emerald-300">
                      AC {meta.constituency.ac_no} —{" "}
                      {displayAcName(locale, meta.constituency.name)}
                    </div>
                    <div className="mt-0.5 text-sm text-zinc-500">
                      {displayDistrict(locale, meta.constituency.district)} ·{" "}
                      {meta.constituency.booth_count} {t("home.booths")} ·{" "}
                      {displayElectionName(
                        locale,
                        meta.election.year,
                        meta.election.name
                      )}
                      {meta.elections_available &&
                        meta.elections_available.length > 1 && (
                          <span>
                            {" "}
                            · {t("home.history")}{" "}
                            {meta.elections_available.join(" · ")}
                          </span>
                        )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {meta.candidates
                        .filter((c) => c.booths_won > 0)
                        .sort((a, b) => b.booths_won - a.booths_won)
                        .slice(0, 3)
                        .map((c) => (
                          <span
                            key={c.key}
                            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                            {displayCandidateName(locale, c.key, c.name)
                              .split(" ")
                              .slice(-1)[0]}{" "}
                            {c.booths_won}
                          </span>
                        ))}
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t("home.openMap")}
                  </span>
                </Link>
              </li>
            ) : (
              <li className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
                {t("home.noData")}
              </li>
            )}
          </ul>
        </div>

        <footer className="mt-16 border-t border-zinc-200 pt-6 text-xs text-zinc-400 dark:border-zinc-800">
          {t("home.footer")}
        </footer>
      </div>
    </div>
  );
}
