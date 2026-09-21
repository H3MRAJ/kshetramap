"use client";

/** HTML legend under the plot — avoids Recharts legend colliding with bars/axes. */
export function ChartLegend({
  items,
}: {
  items: { key: string; label: string; color: string }[];
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
      {items.map((it) => (
        <li
          key={it.key}
          className="inline-flex max-w-full items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: it.color }}
            aria-hidden
          />
          <span className="truncate" title={it.label}>
            {shortCandidateLabel(it.label)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Short label for chart series (keeps full name for tooltips). */
export function shortCandidateLabel(name: string, maxWords = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return name;
  // Prefer last 2 tokens: "Rajeev Lochan Narayan Singh" → "Narayan Singh"
  return parts.slice(-maxWords).join(" ");
}
