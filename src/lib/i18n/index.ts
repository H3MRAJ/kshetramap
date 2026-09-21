import { en, type Messages } from "./en";
import { hi } from "./hi";
import type { Locale } from "./types";

export type { Locale, Messages };
export { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY } from "./types";
export { en, hi };

const DICTS: Record<Locale, Messages> = { en, hi };

/** Dot-path into nested message object, e.g. "nav.map" */
export type MessagePath = string;

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function messagesFor(locale: Locale): Messages {
  return DICTS[locale] ?? en;
}

/**
 * Translate a key. Supports `{name}` interpolation.
 * Falls back to English, then the key itself.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const primary = getByPath(DICTS[locale], key);
  const fallback = getByPath(en, key);
  let s =
    typeof primary === "string"
      ? primary
      : typeof fallback === "string"
        ? fallback
        : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return s;
}

export function yearJoinBannerText(
  locale: Locale,
  year: number
): string | null {
  if (year === 2015) return translate(locale, "yearBanner.y2015");
  if (year === 2020) return translate(locale, "yearBanner.y2020");
  return null;
}
