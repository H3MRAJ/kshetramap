import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvAgenda, CandidateCvAgendaPillar } from "@/lib/candidateCv/types";

interface AgendaPillarsProps {
  agenda: CandidateCvAgenda;
  isEditing?: boolean;
  maxPillars?: number;
  onAgendaChange?: (agenda: CandidateCvAgenda) => void;
}

export function AgendaPillars({
  agenda,
  isEditing = false,
  maxPillars,
  onAgendaChange,
}: AgendaPillarsProps) {
  const allPillars = agenda.pillars || [];
  const pillars = maxPillars ? allPillars.slice(0, maxPillars) : allPillars;

  const handleUpdatePillar = (
    index: number,
    field: keyof CandidateCvAgendaPillar,
    value: string
  ) => {
    if (!onAgendaChange) return;
    const next = [...allPillars];
    next[index] = { ...next[index], [field]: value };
    onAgendaChange({ ...agenda, pillars: next });
  };

  const handleAddPillar = () => {
    if (!onAgendaChange) return;
    const newPillar: CandidateCvAgendaPillar = {
      id: `a-${Date.now()}`,
      title: "New Manifesto Priority",
      detail: "Commitment and delivery strategy for the constituency.",
    };
    onAgendaChange({ ...agenda, pillars: [...allPillars, newPillar] });
  };

  const handleDeletePillar = (index: number) => {
    if (!onAgendaChange) return;
    const next = allPillars.filter((_, i) => i !== index);
    onAgendaChange({ ...agenda, pillars: next });
  };

  const getGridColsClass = () => {
    if (pillars.length === 3) return "lg:grid-cols-3";
    if (pillars.length >= 5) return "lg:grid-cols-5";
    return "lg:grid-cols-4";
  };

  return (
    <section id="agenda" aria-labelledby="agenda-heading" className="scroll-mt-44">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[var(--km-paper-line)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="agenda-heading"
            className="text-lg md:text-xl font-bold text-[var(--km-text)]"
            style={{ fontFamily: "var(--km-font-display)" }}
          >
            Agenda
          </h2>
          <EvidenceBadge demoLabel={agenda.demoLabel || "DEMO/FAKE"} />
          <span className="text-xs text-[var(--km-slate)] hidden sm:inline">
            • First-term manifesto pillars &amp; commitments
          </span>
        </div>
        <span className="text-xs text-[var(--km-slate)] ml-auto font-medium">
          Priority Manifesto Pillars
        </span>
      </div>

      {isEditing && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleAddPillar}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--km-paper-raised)] border border-[var(--km-accent)] text-[var(--km-accent-ink)] hover:bg-[var(--km-accent-soft)] transition"
          >
            + Add Agenda Pillar
          </button>
        </div>
      )}

      {/* 3-5 Pillar Cards in a Row on Desktop / Stack on Mobile */}
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${getGridColsClass()}`}>
        {pillars.map((pillar, i) => (
          <div
            key={pillar.id || i}
            className="rounded-md border border-[var(--km-paper-line)] border-t-2 border-t-[var(--km-accent)] bg-[var(--km-paper-raised)] p-5 shadow-none transition hover:border-[var(--km-navy)] flex flex-col justify-between"
          >
            <div>
              {/* Numbered saffron mark + per-card synthetic chip */}
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--km-accent-soft)] text-xs font-bold text-[var(--km-accent-ink)] tabular-nums border border-[var(--km-accent-soft)]">
                  0{i + 1}
                </span>
                <EvidenceBadge
                  demoLabel={agenda.demoLabel || "DEMO/FAKE"}
                  className="text-[10px] py-0 px-1.5"
                />
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) =>
                      handleUpdatePillar(i, "title", e.target.value)
                    }
                    className="w-full text-xs font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
                  />
                  <textarea
                    rows={2}
                    value={pillar.detail}
                    onChange={(e) =>
                      handleUpdatePillar(i, "detail", e.target.value)
                    }
                    className="w-full text-xs rounded border border-[var(--km-paper-line)] bg-white p-2 text-[var(--km-text)]"
                  />
                </div>
              ) : (
                <>
                  <h3
                    className="text-base font-bold text-[var(--km-text)] leading-snug"
                    style={{ fontFamily: "var(--km-font-display)" }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--km-text-muted)] mt-2 leading-relaxed">
                    {pillar.detail}
                  </p>
                </>
              )}
            </div>

            {isEditing && (
              <div className="mt-3 pt-2 border-t border-[var(--km-paper-line)] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeletePillar(i)}
                  className="text-xs text-red-700 hover:underline font-medium"
                >
                  Delete pillar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
