"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn("credentials", { phone, password, redirect: false });
      if (result?.error) {
        setError(t("auth.invalidCredentials"));
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-xl border border-zinc-700 bg-black p-6 shadow-2xl"
    >
      <h1 className="text-lg font-semibold text-white">{t("auth.loginTitle")}</h1>

      <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
        {t("auth.phone")}
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium text-zinc-300">
        {t("auth.password")}
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy || !phone || !password}
        className="mt-5 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {busy ? t("auth.submitting") : t("auth.submit")}
      </button>
    </form>
  );
}
