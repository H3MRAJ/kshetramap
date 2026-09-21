"use client";

import { signOut } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function SignOutButton() {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {t("app.signOut")}
    </button>
  );
}
