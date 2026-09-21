"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { displayAcName } from "@/lib/i18n/displayNames";
import { ShareLinkButton } from "./ShareLinkButton";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeSwitch } from "./ThemeSwitch";

type Props = {
  acNo: string | number;
  acName: string;
};

/** Carry shareable query keys across Map ↔ History. */
const KEEP = [
  "year",
  "mode",
  "member",
  "focus",
  "booth",
  "place",
  "tab",
  "lang",
] as const;

export function AcWorkspaceNav({ acNo, acName }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();

  const qsParts: string[] = [];
  for (const k of KEEP) {
    const v = searchParams.get(k);
    if (v) qsParts.push(`${k}=${encodeURIComponent(v)}`);
  }
  // Prefer live locale over stale URL
  const withoutLang = qsParts.filter((p) => !p.startsWith("lang="));
  if (locale === "hi") withoutLang.push("lang=hi");
  // Map uses member; history uses focus — mirror both when one set
  if (searchParams.get("member") && !searchParams.get("focus")) {
    withoutLang.push(`focus=${encodeURIComponent(searchParams.get("member")!)}`);
  }
  if (searchParams.get("focus") && !searchParams.get("member")) {
    withoutLang.push(`member=${encodeURIComponent(searchParams.get("focus")!)}`);
  }
  const qs = withoutLang.length
    ? `?${[...new Set(withoutLang)].join("&")}`
    : "";

  const base = `/ac/${acNo}`;
  const isHistory =
    pathname.includes(`${base}/history`) || pathname.endsWith("/history/");
  const isDossier =
    pathname.includes(`${base}/dossier`) || pathname.endsWith("/dossier/");
  const isMap = !isHistory && !isDossier;

  const tabCls = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-semibold transition sm:text-sm ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <header className="flex shrink-0 items-center gap-1.5 border-b border-zinc-200 bg-white px-2 py-1.5 text-sm sm:gap-3 sm:px-3 sm:py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <Link
        href={locale === "hi" ? "/?lang=hi" : "/"}
        className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900"
      >
        ← <span className="hidden sm:inline">{t("nav.allAcs")}</span>
        <span className="sm:hidden">{t("nav.acsShort")}</span>
      </Link>

      <span className="hidden text-zinc-300 sm:inline">|</span>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">
          <span className="sm:hidden">
            AC {acNo} {displayAcName(locale, acName)}
          </span>
          <span className="hidden sm:inline">
            AC {acNo} — {displayAcName(locale, acName)}
          </span>
        </div>
      </div>

      <ThemeSwitch />
      <LanguageSwitch />

      <ShareLinkButton compact label={t("nav.share")} />

      <nav
        className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900"
        aria-label={t("nav.workspace")}
      >
        <Link href={`${base}${qs}`} className={tabCls(isMap)} scroll={false}>
          {t("nav.map")}
        </Link>
        <Link
          href={`${base}/history${qs}`}
          className={tabCls(isHistory)}
          scroll={false}
        >
          {t("nav.history")}
        </Link>
        {/*
          The dossier resolves its own locale purely from `?lang=` at the
          server (default Hindi — see dossier/page.tsx), independently of
          this app's stored/URL locale preference (which defaults English).
          So its link can't reuse `qs` (built to OMIT `lang` when the current
          locale equals THIS app's default, `en`) — that would silently drop
          `lang` for an English-mode viewer and land them on the dossier's
          own default, Hindi. Instead this link explicitly appends
          `?lang=en` only when the current locale is English, and omits it
          (falling through to the dossier's own Hindi default) otherwise —
          keeping a same-session click language-continuous without changing
          what a bare/shared dossier URL defaults to.
        */}
        {!process.env.NEXT_PUBLIC_BASE_PATH && (
          <Link
            href={`${base}/dossier${locale === "en" ? "?lang=en" : ""}`}
            className={tabCls(isDossier)}
            scroll={false}
          >
            {t("nav.dossier")}
          </Link>
        )}
      </nav>
    </header>
  );
}
