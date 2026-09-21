"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messagesFor, translate } from "./index";
import type { Messages } from "./en";
import {
  LOCALES,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./types";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: Messages;
};

const LanguageContext = createContext<Ctx | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = sp.get("lang");
    if (fromUrl === "hi" || fromUrl === "en") return fromUrl;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "hi" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    html.lang = locale === "hi" ? "hi" : "en";
    html.classList.toggle("lang-hi", locale === "hi");
    html.classList.toggle("lang-en", locale === "en");
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    // Keep shareable URL in sync without full navigation
    try {
      const url = new URL(window.location.href);
      if (locale === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", locale);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  }, [locale, ready]);

  const setLocale = useCallback((l: Locale) => {
    if (LOCALES.includes(l)) setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      messages: messagesFor(locale),
    }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // SSR / outside provider: English fallback
    return {
      locale: "en",
      setLocale: () => {},
      t: (key, vars) => translate("en", key, vars),
      messages: messagesFor("en"),
    };
  }
  return ctx;
}

/** Shorthand */
export function useT() {
  return useLanguage().t;
}
