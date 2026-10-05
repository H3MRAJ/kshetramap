"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  acScope: number[];
};

/**
 * "Your constituencies" section on the /app dashboard — the only in-UI entry
 * point to the per-AC profile editor (`/app/profile/[ac]`) and a shortcut to
 * the public dossier for admins/super_admins scoped to one or more ACs.
 */
export function DashboardConstituencies({ acScope }: Props) {
  const { t } = useLanguage();

  if (acScope.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {t("app.myConstituencies")}
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
        {acScope.map((ac) => (
          <li key={ac}>
            {t("app.acLabel", { n: ac })} —{" "}
            <Link href={`/app/profile/${ac}`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              {t("app.editProfile")}
            </Link>
            {" · "}
            <Link href={`/ac/${ac}/dossier`} className="text-emerald-700 hover:underline dark:text-emerald-400">
              {t("app.viewDossier")}
            </Link>
            {ac === 178 && (
              <>
                {" · "}
                <Link
                  href="/app/candidates/demo-mokama-anant-kumar-singh"
                  className="text-emerald-700 hover:underline dark:text-emerald-400 font-medium"
                >
                  {t("app.candidateCv")} (Anant)
                </Link>
                {" · "}
                <Link
                  href="/app/candidates/demo-mokama-rameshwar-prasad"
                  className="text-emerald-700 hover:underline dark:text-emerald-400 font-medium"
                >
                  {t("app.candidateCv")} (Rameshwar)
                </Link>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
