"use client";

import type { BoothProps } from "@/lib/types";
import { boothPctOfAcPolled, boothTotalVotes } from "@/lib/boothStats";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  displayPlaceName,
  displayPsName,
  displayVillageName,
} from "@/lib/i18n/displayNames";

type Props = {
  booth: BoothProps;
  acGrandTotal: number;
  /** Compact for popup; full for mobile sheet */
  variant?: "compact" | "full";
};

export function BoothIntelligence({
  booth,
  acGrandTotal,
  variant = "full",
}: Props) {
  const { locale, t } = useLanguage();
  const totalVotes = boothTotalVotes(booth);
  const pctPolled = boothPctOfAcPolled(booth, acGrandTotal);
  const hasRoll =
    booth.showcase ||
    (booth.electors_total != null && booth.electors_total > 0);

  const turnout =
    booth.turnout_pct ??
    (booth.electors_total
      ? Math.round((10000 * totalVotes) / booth.electors_total) / 100
      : null);

  const psName = displayPsName(locale, booth.ps_name, booth.booth_no);
  const villageName = displayVillageName(
    locale,
    booth.village,
    booth.booth_no
  );

  return (
    <div className="space-y-2">
      {booth.showcase && (
        <div className="rounded-lg border border-amber-300/80 bg-gradient-to-r from-amber-50 to-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-950 dark:border-amber-700 dark:from-amber-950/50 dark:to-emerald-950/40 dark:text-amber-100">
          {t("booth.intelligence")}
        </div>
      )}

      {/* Identity */}
      {hasRoll && (psName || booth.ps_name) && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("booth.pollingStation")}
          </div>
          <div className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {psName || booth.ps_name}
          </div>
          {booth.ps_address && booth.ps_address !== booth.ps_name && (
            <div className="mt-0.5 text-xs text-zinc-500">{booth.ps_address}</div>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
            {villageName && (
              <span className="rounded-full bg-white px-2 py-0.5 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                {villageName}
              </span>
            )}
            {booth.tehsil && (
              <span className="rounded-full bg-white px-2 py-0.5 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                {t("booth.tehsil", { name: booth.tehsil })}
              </span>
            )}
            {booth.pin && (
              <span className="rounded-full bg-white px-2 py-0.5 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                {t("booth.pin", { pin: booth.pin })}
              </span>
            )}
            {booth.special_status && (
              <span className="rounded-full bg-white px-2 py-0.5 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                {booth.special_status}
              </span>
            )}
          </div>
          {booth.police_station_roll && (
            <div className="mt-1.5 text-[11px] text-zinc-500">
              {t("booth.police")}{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {booth.police_station_roll}
              </span>
              {booth.nearest_ps &&
                booth.nearest_ps !== booth.police_station_roll && (
                  <span className="text-zinc-400">
                    {" "}
                    · {t("booth.area")} {displayPlaceName(locale, booth.nearest_ps)}
                  </span>
                )}
            </div>
          )}
        </div>
      )}

      {/* Votes + turnout */}
      <div
        className={`grid gap-2 ${hasRoll && turnout != null ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
      >
        <div className="rounded-lg bg-emerald-50 px-2.5 py-2 dark:bg-emerald-950/40">
          <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/70 dark:text-emerald-300/70">
            {t("booth.totalVotes")}
          </div>
          <div className="text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
            {totalVotes.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-800/50 dark:text-emerald-400/50">
            {t("booth.validNota")}
          </div>
        </div>
        <div className="rounded-lg bg-sky-50 px-2.5 py-2 dark:bg-sky-950/40">
          <div className="text-[10px] font-medium uppercase tracking-wide text-sky-800/70 dark:text-sky-300/70">
            {t("booth.pctAc")}
          </div>
          <div className="text-lg font-bold tabular-nums text-sky-900 dark:text-sky-100">
            {pctPolled.toFixed(2)}%
          </div>
          <div className="text-[10px] text-sky-800/50 dark:text-sky-400/50">
            {t("booth.ofAc", { n: acGrandTotal.toLocaleString() })}
          </div>
        </div>
        {hasRoll && turnout != null && (
          <div className="col-span-2 rounded-lg bg-violet-50 px-2.5 py-2 sm:col-span-1 dark:bg-violet-950/40">
            <div className="text-[10px] font-medium uppercase tracking-wide text-violet-800/70 dark:text-violet-300/70">
              {t("booth.turnout")}
            </div>
            <div className="text-lg font-bold tabular-nums text-violet-900 dark:text-violet-100">
              {turnout.toFixed(1)}%
            </div>
            <div className="text-[10px] text-violet-800/50 dark:text-violet-400/50">
              {totalVotes.toLocaleString()} /{" "}
              {booth.electors_total?.toLocaleString()} electors
            </div>
          </div>
        )}
      </div>

      {/* Electors gender split — showcase */}
      {hasRoll && booth.electors_total != null && variant === "full" && (
        <div className="rounded-lg border border-zinc-100 px-2.5 py-2 dark:border-zinc-800">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {t("booth.electors")}
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div>
              <div className="text-[10px] text-zinc-400">{t("booth.total")}</div>
              <div className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {booth.electors_total.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">{t("booth.male")}</div>
              <div className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {booth.electors_male?.toLocaleString() ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">{t("booth.female")}</div>
              <div className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {booth.electors_female?.toLocaleString() ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">{t("booth.third")}</div>
              <div className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {booth.electors_third_gender?.toLocaleString() ?? "—"}
              </div>
            </div>
          </div>
          {booth.revision_type && (
            <div className="mt-2 text-[10px] text-zinc-400">
              {booth.revision_type}
              {booth.pc_name ? ` · LS ${booth.pc_no} ${booth.pc_name}` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
