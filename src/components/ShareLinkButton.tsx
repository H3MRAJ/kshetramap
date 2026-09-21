"use client";

import { useCallback, useState } from "react";
import { copyToClipboard, currentShareUrl } from "@/lib/shareUrl";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  /** Extra query overrides when building the link */
  params?: Record<string, string | number | null | undefined>;
  label?: string;
  className?: string;
  compact?: boolean;
};

export function ShareLinkButton({
  params,
  label,
  className = "",
  compact = false,
}: Props) {
  const { t, locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const displayLabel = label ?? t("nav.share");

  const onShare = useCallback(async () => {
    const url = currentShareUrl({
      ...params,
      lang: locale === "hi" ? "hi" : null,
    });
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: t("brand"), url });
        setStatus("ok");
        window.setTimeout(() => setStatus("idle"), 2000);
        return;
      }
    } catch {
      /* user cancelled or unsupported — fall back to copy */
    }
    const ok = await copyToClipboard(url);
    setStatus(ok ? "ok" : "err");
    window.setTimeout(() => setStatus("idle"), 2500);
  }, [params, locale, t]);

  return (
    <button
      type="button"
      onClick={onShare}
      title={t("nav.copyShareTitle")}
      className={
        className ||
        (compact
          ? "rounded-lg border border-zinc-300 bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          : "rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800")
      }
    >
      {status === "ok"
        ? t("nav.linkCopied")
        : status === "err"
          ? t("nav.copyFailed")
          : displayLabel}
    </button>
  );
}
