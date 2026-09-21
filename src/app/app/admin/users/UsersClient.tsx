"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Role } from "@/lib/auth/roles";

type PublicUser = {
  _id: string;
  name: string;
  phone: string;
  role: Role;
  ac_scope: number[];
  active: boolean;
};

const ROLE_OPTIONS: Role[] = ["super_admin", "admin", "candidate", "worker", "viewer"];

export function UsersClient({ initialUsers }: { initialUsers: PublicUser[] }) {
  const { t } = useLanguage();
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [acScope, setAcScope] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          password,
          role,
          ac_scope: acScope
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map(Number),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data?.error?.message ?? t("admin.users.error") });
        return;
      }
      setUsers((prev) => [{ ...data.user }, ...prev]);
      setMessage({ kind: "ok", text: t("admin.users.created") });
      setName("");
      setPhone("");
      setPassword("");
      setAcScope("");
    } catch {
      setMessage({ kind: "error", text: t("admin.users.error") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("admin.users.createTitle")}
        </h2>
        <form onSubmit={submit} className="mt-3 flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            {t("admin.users.name")}
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("admin.users.phone")}
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("admin.users.password")}
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1">
            {t("admin.users.role")}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            {t("admin.users.acScope")}
            <input
              value={acScope}
              onChange={(e) => setAcScope(e.target.value)}
              placeholder="178"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          {message && (
            <p className={message.kind === "ok" ? "text-emerald-600" : "text-red-500"}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {busy ? t("admin.users.creating") : t("admin.users.create")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {t("admin.users.title")}
        </h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="py-1">{t("admin.users.name")}</th>
              <th className="py-1">{t("admin.users.phone")}</th>
              <th className="py-1">{t("admin.users.role")}</th>
              <th className="py-1">{t("admin.users.active")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-1">{u.name}</td>
                <td className="py-1">{u.phone}</td>
                <td className="py-1">{u.role}</td>
                <td className="py-1">{u.active ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
