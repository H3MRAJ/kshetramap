/**
 * Locale-aware display names for AC-178 (candidates, places, geo labels).
 * English fallback when Hindi catalog missing.
 */
import type { Locale } from "./types";
import namesHi from "./names-hi-ac178.json";

type NamesHi = {
  ac_no: number;
  geo: Record<string, string>;
  candidates: Record<string, string>;
  places: Record<string, string>;
  villages: Record<string, string>;
  booth_ps_hi: Record<string, string>;
  booth_village_hi: Record<string, string>;
};

const HI = namesHi as NamesHi;

export function displayCandidateName(
  locale: Locale,
  key: string | null | undefined,
  englishName: string | null | undefined
): string {
  const en = (englishName || key || "").trim();
  if (locale !== "hi" || !key) return en;
  return HI.candidates[key] || en;
}

export function displayPlaceName(
  locale: Locale,
  englishName: string | null | undefined
): string {
  const en = (englishName || "").trim();
  if (!en) return en;
  if (locale !== "hi") return en;
  if (HI.places[en]) return HI.places[en];
  // case-insensitive / partial
  const lower = en.toLowerCase();
  for (const [k, v] of Object.entries(HI.places)) {
    if (k.toLowerCase() === lower) return v;
  }
  if (HI.villages[en]) return HI.villages[en];
  return en;
}

export function displayVillageName(
  locale: Locale,
  englishVillage: string | null | undefined,
  boothNo?: number | null
): string {
  const en = (englishVillage || "").trim();
  if (locale !== "hi") return en;
  if (boothNo != null) {
    const byBooth = HI.booth_village_hi[String(boothNo)];
    if (byBooth) return byBooth;
  }
  if (en && HI.villages[en]) return HI.villages[en];
  return displayPlaceName(locale, en);
}

export function displayPsName(
  locale: Locale,
  englishPs: string | null | undefined,
  boothNo?: number | null
): string {
  const en = (englishPs || "").trim();
  if (locale !== "hi") return en;
  if (boothNo != null) {
    const hi = HI.booth_ps_hi[String(boothNo)];
    if (hi) return hi;
  }
  return en;
}

export function displayAcName(locale: Locale, english: string): string {
  if (locale === "hi") return HI.geo.ac_name || english;
  return english;
}

export function displayDistrict(locale: Locale, english: string): string {
  if (locale === "hi") return HI.geo.district || english;
  return english;
}

export function displayState(locale: Locale, english: string): string {
  if (locale === "hi") return HI.geo.state || english;
  return english;
}

export function displayElectionName(
  locale: Locale,
  year: number,
  englishFallback: string
): string {
  if (locale !== "hi") return englishFallback;
  const key = `election_${year}`;
  return HI.geo[key] || englishFallback;
}

export function displayBoothLabel(
  locale: Locale,
  boothNo: number,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  return t("booth.booth", { n: boothNo });
}
