import React from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvPlan, CandidateCvPlanPhase } from "@/lib/candidateCv/types";

interface PlanRoadmapProps {
  plan: CandidateCvPlan;
  isEditing?: boolean;
  onPlanChange?: (plan: CandidateCvPlan) => void;
}

export function PlanRoadmap({
  plan,
  isEditing = false,
  onPlanChange,
}: PlanRoadmapProps) {
  const phases = plan.phases || [];

  const handleUpdatePhase = (
    index: number,
    field: keyof CandidateCvPlanPhase,
    value: string
  ) => {
    if (!onPlanChange) return;
    const next = [...phases];
    next[index] = { ...next[index], [field]: value };
    onPlanChange({ ...plan, phases: next });
  };

  const handleAddPhase = () => {
    if (!onPlanChange) return;
    const nextIndex = phases.length + 1;
    const newPhase: CandidateCvPlanPhase = {
      id: `p-${Date.now()}`,
      window: `${(nextIndex - 1) * 12}–${nextIndex * 12} mo`,
      goal: "Constituency development milestone",
    };
    onPlanChange({ ...plan, phases: [...phases, newPhase] });
  };

  const handleDeletePhase = (index: number) => {
    if (!onPlanChange) return;
    const next = phases.filter((_, i) => i !== index);
    onPlanChange({ ...plan, phases: next });
  };

  return (
    <section id="plan" aria-labelledby="plan-heading" className="scroll-mt-44">
      <div className="flex items-center gap-2 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <h2
          id="plan-heading"
          className="text-lg md:text-xl font-bold text-[var(--km-text)]"
          style={{ fontFamily: "var(--km-font-display)" }}
        >
          Plan (next term)
        </h2>
        <EvidenceBadge demoLabel={plan.demoLabel || "DEMO/FAKE"} />
        <span className="text-xs text-[var(--km-slate)] ml-auto">
          Phased Delivery Roadmap
        </span>
      </div>

      {isEditing && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleAddPhase}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--km-paper-raised)] border border-[var(--km-accent)] text-[var(--km-accent-ink)] hover:bg-[var(--km-accent-soft)] transition"
          >
            + Add Roadmap Phase
          </button>
        </div>
      )}

      <ol className="space-y-3">
        {phases.map((phase, idx) => (
          <li
            key={phase.id || idx}
            className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-4 shadow-none transition hover:border-[var(--km-navy)]"
          >
            <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold km-badge-soft-accent">
                Phase {idx + 1}
              </span>
              <span>•</span>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g. 0–6 mo"
                  value={phase.window}
                  onChange={(e) =>
                    handleUpdatePhase(idx, "window", e.target.value)
                  }
                  className="text-xs rounded border border-[var(--km-paper-line)] bg-white px-2 py-0.5 font-medium"
                />
              ) : (
                <span className="tabular-nums text-xs font-semibold text-[var(--km-slate)]">
                  {phase.window}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-1">
                <input
                  type="text"
                  placeholder="Goal"
                  value={phase.goal}
                  onChange={(e) =>
                    handleUpdatePhase(idx, "goal", e.target.value)
                  }
                  className="w-full text-sm font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
                />
                <textarea
                  rows={2}
                  placeholder="Optional detail"
                  value={phase.detail || ""}
                  onChange={(e) =>
                    handleUpdatePhase(idx, "detail", e.target.value)
                  }
                  className="w-full text-xs rounded border border-[var(--km-paper-line)] bg-white p-2 text-[var(--km-text)]"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeletePhase(idx)}
                    className="text-xs text-red-700 hover:underline"
                  >
                    Delete phase
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm md:text-base font-semibold text-[var(--km-text)]">
                  {phase.goal}
                </p>
                {phase.detail && (
                  <p className="text-xs md:text-sm text-[var(--km-text-muted)] mt-1">
                    {phase.detail}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
