"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  /** Server-resolved label (`t("dossier.downloadPdf")`) — see doc comment below. */
  label: string;
};

/**
 * The dossier's SECOND and final deliberate client-boundary exception (see
 * `VoteShareChart.tsx`'s doc comment for the first, and `page.tsx`'s
 * ARCHITECTURE comment for why this route tree is otherwise a plain server
 * component). Renders one button that:
 *
 *  1. On click, navigates to the current dossier URL with `?print=1` added,
 *     preserving every existing query param (e.g. `lang`) via
 *     `URLSearchParams` — the same preserve-params-across-navigation pattern
 *     `AcWorkspaceNav.tsx` already uses elsewhere in this app.
 *  2. An effect watches `print=1` on the URL (not just this click — so a
 *     shared/bookmarked `?print=1` link, or a back/forward navigation that
 *     lands on one, also triggers print). When present, it waits for
 *     `document.fonts.ready` to resolve, then one more
 *     `requestAnimationFrame` tick (letting any final layout/paint settle —
 *     this matters for the rest of the page's fonts/layout even though
 *     `VoteShareChart` itself ends up hidden in print by the
 *     `.dossier-chart-no-print` rule in `globals.css`), then calls
 *     `window.print()`.
 *
 * Deliberately takes only a plain `label` string prop — resolved server-side
 * via the page's `t()`, the same props-in pattern `VoteShareChart` uses for
 * its own strings — rather than calling `useLanguage()` itself, so this
 * component introduces no client-side locale dependency.
 *
 * `dossier-print-hide` (defined in `globals.css`'s `@media print` block)
 * hides this button in the actual print/PDF output, same as the shared nav —
 * nobody wants a "Download PDF" button rendered on the PDF it produced.
 */
export function DownloadPdfButton({ label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const printRequested = searchParams.get("print") === "1";

  useEffect(() => {
    if (!printRequested) return;
    let cancelled = false;

    const triggerPrint = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        window.print();
        // Strip `print` back out of the URL so a subsequent click produces a
        // fresh no-param → `print=1` transition (and thus re-fires this
        // effect) instead of pushing the same URL a second time, which
        // Next.js treats as a no-op and never re-triggers the print.
        const params = new URLSearchParams(searchParams.toString());
        params.delete("print");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    };

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(triggerPrint);
    } else {
      triggerPrint();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printRequested]);

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("print", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="dossier-print-hide inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}
