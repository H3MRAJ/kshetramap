import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * Wraps a dossier section in a `.dossier-page`-classed `<section>` —
 * every section (this task's Cover/Snapshot, and B-Task 8/9's
 * Social/Economic/Political/Sources) should render through this component
 * rather than a bare `<section>`, so the DOM structure is uniform before
 * B-Task 10 adds the real `@media print` rules (`.dossier-page {
 * break-after: page }` etc — see the B4 spec excerpt in task-7-brief.md).
 * No print styling lands here yet; this is purely the structural contract.
 */
export function DossierSection({ children, className, "aria-label": ariaLabel }: Props) {
  const classes = ["dossier-page", className].filter(Boolean).join(" ");
  return (
    <section className={classes} aria-label={ariaLabel}>
      {children}
    </section>
  );
}
