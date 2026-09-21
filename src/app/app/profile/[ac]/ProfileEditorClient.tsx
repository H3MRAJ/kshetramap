"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type {
  ProfileEconomic,
  ProfilePatch,
  ProfilePolitical,
  ProfileSnapshot,
  ProfileSocial,
} from "@/lib/profile/profileRepo";
import { SnapshotTab } from "./SnapshotTab";
import { SocialTab } from "./SocialTab";
import { EconomicTab } from "./EconomicTab";
import { PoliticalTab } from "./PoliticalTab";
import { BriefTab } from "./BriefTab";
import type { ClientProfile, SaveResult } from "./types";

const TABS = ["snapshot", "social", "economic", "political", "brief"] as const;
type Tab = (typeof TABS)[number];

function isTab(v: string | null): v is Tab {
  return !!v && (TABS as readonly string[]).includes(v);
}

export function ProfileEditorClient({
  acNo,
  initialProfile,
  currentUser,
  initialUpdatedByName,
  narrativeSeed,
}: {
  acNo: number;
  initialProfile: ClientProfile;
  currentUser: { id: string; name: string };
  /** Server-resolved display name for `initialProfile.updated_by` (falls back to the raw id). */
  initialUpdatedByName: string;
  /** `getPoliticalBlock(acNo)`'s `narrative_seed` (server-resolved once, in `page.tsx`),
   * used by the Brief tab's "Seed from data" button. `null` when unavailable. */
  narrativeSeed: string | null;
}) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tab, setTab] = useState<Tab>(() => {
    const fromUrl = searchParams.get("tab");
    return isTab(fromUrl) ? fromUrl : "snapshot";
  });

  // URL -> state (back/forward nav, or a shared link landing on a specific tab).
  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (isTab(fromUrl) && fromUrl !== tab) setTab(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // state -> URL (shareable), mirroring the `?tab=` convention used by
  // HistoryWorkspace/AcWorkspaceNav elsewhere in this app.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current === tab) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const [profile, setProfile] = useState(initialProfile);
  const [updatedByName, setUpdatedByName] = useState(initialUpdatedByName);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Finding 7: each tab mounts conditionally and holds its own local draft
  // state — switching tabs unmounts the outgoing one, discarding any unsaved
  // edits with no warning. Rather than lifting every tab's (quite different-
  // shaped) draft state up into this component — a much larger structural
  // change across all five tabs — each tab now reports whether ITS OWN local
  // state has diverged from its last-loaded-or-saved state via
  // `onDirtyChange`. Only one tab is ever mounted at a time, so a single
  // flag here is enough; `requestTabChange` gates any tab switch on it with
  // a `confirm()`, matching how this kind of "leave with unsaved changes"
  // warning is conventionally done outside of a full page-navigation (where
  // `beforeunload` would apply instead — not applicable here, since this is
  // in-page SPA tab switching, not a navigation/reload).
  const [dirty, setDirty] = useState(false);

  function requestTabChange(next: Tab) {
    if (next === tab) return;
    if (dirty && !window.confirm(t("profile.unsavedConfirm"))) return;
    setTab(next);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(next: { kind: "ok" | "error"; text: string }) {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  /** Every tab's save action PUTs only its own section — never the whole profile. */
  async function saveSection(patch: ProfilePatch): Promise<SaveResult> {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/acs/${acNo}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.error?.message ?? t("profile.saveError");
        showToast({ kind: "error", text: message });
        return { ok: false, message };
      }
      setProfile((prev) => ({
        ...prev,
        snapshot: data.profile.snapshot,
        social: data.profile.social,
        economic: data.profile.economic,
        political: data.profile.political,
        brief_en: data.profile.brief_en,
        brief_hi: data.profile.brief_hi,
        updated_by: currentUser.id,
        updated_at: data.profile.updated_at,
      }));
      setUpdatedByName(currentUser.name);
      showToast({ kind: "ok", text: t("profile.saved") });
      return { ok: true };
    } catch {
      const message = t("profile.saveError");
      showToast({ kind: "error", text: message });
      return { ok: false, message };
    } finally {
      setSaving(false);
    }
  }

  const tabCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-emerald-600 text-white"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  const lastUpdatedText =
    profile.updated_by && updatedByName
      ? t("profile.lastUpdated", {
          name: updatedByName,
          // Plain `toLocaleString` with an explicit `timeZone` (no
          // dateStyle/timeStyle preset), mirroring AuditClient.tsx's exact
          // pattern — `dateStyle`/`timeStyle` presets format `en-IN`/`hi-IN`
          // differently between Node's server-side ICU and the browser's,
          // which caused a real hydration mismatch ("4 Aug 2026" vs
          // "04-Aug-2026") when this used `Intl.DateTimeFormat` directly.
          time: new Date(profile.updated_at).toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          }),
        })
      : t("profile.neverUpdated");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("profile.heading", { ac: String(acNo) })}
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{lastUpdatedText}</p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {TABS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            className={tabCls(tab === tabId)}
            onClick={() => requestTabChange(tabId)}
          >
            {t(`profile.tabs.${tabId}`)}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {tab === "snapshot" && (
          <SnapshotTab
            initialSnapshot={profile.snapshot}
            saving={saving}
            onSave={(snapshot: ProfileSnapshot) => saveSection({ snapshot })}
            onDirtyChange={setDirty}
          />
        )}
        {tab === "social" && (
          <SocialTab
            initialSocial={profile.social}
            saving={saving}
            onSave={(social: ProfileSocial) => saveSection({ social })}
            onDirtyChange={setDirty}
          />
        )}
        {tab === "economic" && (
          <EconomicTab
            initialEconomic={profile.economic}
            saving={saving}
            onSave={(economic: ProfileEconomic) => saveSection({ economic })}
            onDirtyChange={setDirty}
          />
        )}
        {tab === "political" && (
          <PoliticalTab
            initialPolitical={profile.political}
            saving={saving}
            onSave={(political: ProfilePolitical) => saveSection({ political })}
            onDirtyChange={setDirty}
          />
        )}
        {tab === "brief" && (
          <BriefTab
            initialBriefEn={profile.brief_en}
            initialBriefHi={profile.brief_hi}
            narrativeSeed={narrativeSeed}
            saving={saving}
            onSave={(patch: { brief_en?: string; brief_hi?: string }) => saveSection(patch)}
            onDirtyChange={setDirty}
          />
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
            toast.kind === "ok" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
