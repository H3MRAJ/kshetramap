import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvCandidate, CandidateCvMeta } from "@/lib/candidateCv/types";

interface IdentityStripProps {
  candidate: CandidateCvCandidate;
  meta: CandidateCvMeta;
  isOwner: boolean;
  isEditing: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  onToggleEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onPdfClick?: () => void;
}

export function IdentityStrip({
  candidate,
  meta,
  isOwner,
  isEditing,
  isSaving = false,
  hasUnsavedChanges = false,
  onToggleEdit,
  onSave,
  onCancel,
  onPdfClick,
}: IdentityStripProps) {
  // Initials from name
  const initials = candidate.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Party chip color (small party pill tint only — locked decision)
  const getPartyClass = (party: string) => {
    switch (party.toUpperCase()) {
      case "JD(U)":
      case "JDU":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/80";
      case "RJD":
        return "bg-green-950/80 text-green-300 border-green-700/80";
      case "BJP":
        return "bg-amber-950/80 text-amber-300 border-amber-700/80";
      case "INC":
        return "bg-blue-950/80 text-blue-300 border-blue-700/80";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <header
      className="sticky z-40 w-full border-b border-[rgba(244,239,230,0.15)] bg-[var(--km-ink)] px-4 py-4 md:py-6 md:min-h-[150px] text-[var(--km-paper)] shadow-md transition-all flex flex-col justify-center"
      style={{ top: meta.demoLabel === "DEMO/FAKE" ? "36px" : "0px" }}
      aria-label="Candidate identity masthead"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
        {/* Left: Rally Masthead Nameplate with Saffron Tick & Poster Serif Name */}
        <div className="flex items-center gap-3.5 md:gap-4 min-w-0">
          {/* Avatar / Monogram */}
          <div className="flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded border border-[rgba(244,239,230,0.2)] bg-[var(--km-navy)] text-base md:text-lg font-serif font-bold text-[var(--km-paper)] shadow-sm">
            {initials}
          </div>

          {/* Saffron Left Tick Accent + Identity Column */}
          <div className="border-l-4 border-[var(--km-accent)] pl-3.5 md:pl-4 flex flex-col justify-center min-w-0">
            {/* Display serif name large (poster-scale) */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-[var(--km-paper)] leading-tight truncate"
              style={{ fontFamily: "var(--km-font-display)" }}
            >
              {candidate.name}
            </h1>

            {/* Badges and Seat metadata line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--km-text-muted-on-ink)] mt-1">
              <span className="font-semibold text-[var(--km-paper)]">
                seat: {candidate.seat}
              </span>

              <span className="text-[rgba(244,239,230,0.4)]">•</span>

              {/* Party chip */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getPartyClass(
                  candidate.party
                )}`}
              >
                {candidate.party}
              </span>

              {/* Status chip */}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--km-navy-muted)] text-[var(--km-paper)] border border-[rgba(244,239,230,0.15)]">
                {candidate.status}
              </span>

              {/* Evidence mode badge: strictly DEMO/FAKE or LIVE on nameplate */}
              <EvidenceBadge
                demoLabel={candidate.demoLabel}
                isNameplate={true}
              />

              {candidate.aliases?.length > 0 && (
                <>
                  <span className="text-[rgba(244,239,230,0.4)] hidden sm:inline">•</span>
                  <span className="hidden sm:inline">aka {candidate.aliases.join(" · ")}</span>
                </>
              )}

              <span className="text-[rgba(244,239,230,0.4)] hidden md:inline">•</span>
              <span className="tabular-nums hidden md:inline">
                refreshed {meta.asOf} IST
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Owner edit controls + PDF affordance) */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto md:ml-0">
          {/* Owner edit controls */}
          {isOwner && (
            <>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--km-navy)] text-[var(--km-paper)] border border-[rgba(244,239,230,0.2)] hover:bg-[var(--km-navy-muted)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[var(--km-accent)] text-white hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onToggleEdit}
                  className="px-3 py-1.5 rounded text-xs font-semibold border border-[var(--km-accent)] text-[var(--km-accent-soft)] hover:bg-[var(--km-navy-muted)] transition flex items-center gap-1.5"
                >
                  <span className="text-[var(--km-accent)]">✎</span> Edit Portfolio
                </button>
              )}
            </>
          )}

          {/* PDF affordance */}
          <button
            type="button"
            onClick={onPdfClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold border border-[var(--km-accent)] text-[var(--km-paper)] hover:bg-[var(--km-navy-muted)] transition focus:outline-none focus:ring-2 focus:ring-[var(--km-accent)]"
            title="Download PDF campaign portfolio (affordance)"
          >
            <span>PDF</span>
            <span className="text-[var(--km-accent)]">↓</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export { IdentityStrip as RallyMasthead };
