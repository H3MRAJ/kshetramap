"use client";

import { Fragment, FormEvent, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type AuditEntry = {
  _id: string;
  ts: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  diff?: { before: Record<string, unknown>; after: Record<string, unknown> };
};

export function AuditClient({ initialEntries }: { initialEntries: AuditEntry[] }) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState(initialEntries);
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function applyFilters(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (actor) params.set("actor", actor);
    if (entity) params.set("entity", entity);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    const res = await fetch(`/api/v1/admin/audit?${params.toString()}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t("admin.audit.title")}
      </h1>

      <form onSubmit={applyFilters} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          {t("admin.audit.filterActor")}
          <input value={actor} onChange={(e) => setActor(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1">
          {t("admin.audit.filterEntity")}
          <input value={entity} onChange={(e) => setEntity(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1">
          {t("admin.audit.filterFrom")}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1">
          {t("admin.audit.filterTo")}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1">
          {t("admin.audit.search")}
          <input value={q} onChange={(e) => setQ(e.target.value)} className="rounded-lg border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500">
          {t("admin.audit.apply")}
        </button>
      </form>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <th className="py-1">{t("admin.audit.time")}</th>
            <th className="py-1">{t("admin.audit.action")}</th>
            <th className="py-1">{t("admin.audit.summary")}</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-zinc-500">
                {t("admin.audit.empty")}
              </td>
            </tr>
          )}
          {entries.map((entry) => (
            <Fragment key={entry._id}>
              <tr className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-1 align-top">{new Date(entry.ts).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}</td>
                <td className="py-1 align-top">{entry.action}</td>
                <td className="py-1 align-top">{entry.summary}</td>
                <td className="py-1 align-top">
                  {entry.diff && (
                    <button
                      onClick={() => setOpenId(openId === entry._id ? null : entry._id)}
                      className="text-emerald-600 hover:underline"
                    >
                      {openId === entry._id ? t("admin.audit.hideDiff") : t("admin.audit.viewDiff")}
                    </button>
                  )}
                </td>
              </tr>
              {openId === entry._id && entry.diff && (
                <tr>
                  <td colSpan={4} className="bg-zinc-50 p-3 dark:bg-zinc-900">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-zinc-500">{t("admin.audit.before")}</div>
                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(entry.diff.before, null, 2)}</pre>
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-500">{t("admin.audit.after")}</div>
                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(entry.diff.after, null, 2)}</pre>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
