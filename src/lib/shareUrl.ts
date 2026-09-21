import type { MapMode } from "./types";

const MAP_MODES: MapMode[] = ["winner", "heat", "margin", "strength"];

export type MapShareState = {
  year?: number;
  mode?: MapMode;
  member?: string;
  booth?: number;
  place?: string;
};

export type HistoryShareState = {
  tab?: "overview" | "booth" | "place";
  focus?: string;
  booth?: number;
  place?: string;
};

export function parseMapShare(
  params: URLSearchParams,
  opts?: { years?: number[]; members?: string[] }
): MapShareState {
  const out: MapShareState = {};
  const year = Number(params.get("year"));
  if (
    Number.isFinite(year) &&
    (!opts?.years?.length || opts.years.includes(year))
  ) {
    out.year = year;
  }
  const mode = params.get("mode") as MapMode | null;
  if (mode && MAP_MODES.includes(mode)) out.mode = mode;
  const member = params.get("member") || params.get("focus");
  if (member && (!opts?.members?.length || opts.members.includes(member))) {
    out.member = member;
  }
  const booth = Number(params.get("booth"));
  if (Number.isFinite(booth) && booth >= 1) out.booth = booth;
  const place = params.get("place");
  if (place?.trim()) out.place = place.trim();
  return out;
}

export function parseHistoryShare(params: URLSearchParams): HistoryShareState {
  const tab = params.get("tab");
  const out: HistoryShareState = {};
  if (tab === "overview" || tab === "booth" || tab === "place") out.tab = tab;
  const focus = params.get("focus") || params.get("member");
  if (focus?.trim()) out.focus = focus.trim();
  const booth = Number(params.get("booth"));
  if (Number.isFinite(booth) && booth >= 1) out.booth = booth;
  const place = params.get("place");
  if (place?.trim()) out.place = place.trim();
  return out;
}

export function buildQuery(parts: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(parts)) {
    if (v == null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Full shareable URL for current page (includes origin + basePath path). */
export function currentShareUrl(extra?: Record<string, string | number | null | undefined>): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v == null || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
