"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
