import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvAgenda, CandidateCvAgendaPillar } from "@/lib/candidateCv/types";

interface AgendaPillarsProps {
  agenda: CandidateCvAgenda;
  isEditing?: boolean;
  onAgendaChange?: (agenda: CandidateCvAgenda) => void;
}

export function AgendaPillars({
  agenda,
  isEditing = false,
  onAgendaChange,
}: AgendaPillarsProps) {
  const pillars = agenda.pillars || [];

  const handleUpdatePillar = (
    index: number,
    field: keyof CandidateCvAgendaPillar,
    value: string
  ) => {
    if (!onAgendaChange) return;
    const next = [...pillars];
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
    onAgendaChange({ ...agenda, pillars: [...pillars, newPillar] });
  };

  const handleDeletePillar = (index: number) => {
    if (!onAgendaChange) return;
    const next = pillars.filter((_, i) => i !== index);
    onAgendaChange({ ...agenda, pillars: next });
  };

  return (
    <section id="agenda" aria-labelledby="agenda-heading" className="scroll-mt-32">
      <div className="flex items-center gap-2 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="agenda-heading"
          className="text-lg md:text-xl font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          Agenda
        </h2>
        <EvidenceBadge demoLabel={agenda.demoLabel || "DEMO/FAKE"} />
        <span className="text-xs text-[var(--km-slate)] ml-auto">
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

      <div className="grid gap-4 md:grid-cols-2">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.id || i}
            className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-4 shadow-none transition hover:border-[var(--km-navy)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[var(--km-accent-soft)] text-xs font-bold text-[var(--km-accent-ink)] tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[11px] text-[var(--km-slate)] font-medium uppercase tracking-wider">
                  Pillar
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) =>
                      handleUpdatePillar(i, "title", e.target.value)
                    }
                    className="w-full text-sm font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
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
                  <h3 className="text-sm md:text-base font-semibold text-[var(--km-text)]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--km-text-muted)] mt-1 leading-relaxed">
                    {pillar.detail}
                  </p>
                </>
              )}
            </div>

            {isEditing && (
              <div className="mt-2.5 pt-2 border-t border-[var(--km-paper-line)] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeletePillar(i)}
                  className="text-xs text-red-700 hover:underline"
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
