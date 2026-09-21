export type Locale = "en" | "hi";

export const LOCALES: Locale[] = ["en", "hi"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  hi: "हिं",
};

export const LOCALE_STORAGE_KEY = "kshetramap-lang";
