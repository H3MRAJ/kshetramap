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

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "kshetramap-theme";

type Ctx = {
  /** User choice */
  theme: ThemePreference;
  /** Actual applied theme */
  resolved: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
  /** Toggle light ↔ dark (skips system) */
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

function applyDom(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
}

function readStored(): ThemePreference {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pref = readStored();
    const r = resolve(pref);
    setThemeState(pref);
    setResolved(r);
    applyDom(r);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const r = resolve(theme);
    setResolved(r);
    applyDom(r);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, ready]);

  // Follow OS when preference is "system"
  useEffect(() => {
    if (!ready || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = resolve("system");
      setResolved(r);
      applyDom(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, ready]);

  const setTheme = useCallback((t: ThemePreference) => {
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const cur = resolve(prev);
      return cur === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "light",
      resolved: "light",
      setTheme: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
