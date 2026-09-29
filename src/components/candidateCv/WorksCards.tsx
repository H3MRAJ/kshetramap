import React, { useState, useMemo } from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvWork } from "@/lib/candidateCv/types";

interface WorksCardsProps {
  works: CandidateCvWork[];
  isEditing?: boolean;
  onWorksChange?: (works: CandidateCvWork[]) => void;
}

export function WorksCards({
  works,
  isEditing = false,
  onWorksChange,
}: WorksCardsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("All");

  // Generate unique filter options from work years
  const filterOptions = useMemo(() => {
    const options = new Set<string>();
    for (const w of works) {
      if (w.years?.length > 1) {
        options.add(`${w.years[0]}–${w.years[w.years.length - 1]}`);
      } else if (w.years?.length === 1) {
        options.add(String(w.years[0]));
      }
    }
    return ["All", ...Array.from(options)];
  }, [works]);

  const filteredWorks = useMemo(() => {
    if (selectedYear === "All") return works;
    return works.filter((w) => {
      const yearRange =
        w.years?.length > 1
          ? `${w.years[0]}–${w.years[w.years.length - 1]}`
          : String(w.years?.[0]);
      return yearRange === selectedYear || w.years.includes(Number(selectedYear));
    });
  }, [works, selectedYear]);

  const handleUpdateWork = (
    index: number,
    field: keyof CandidateCvWork,
    val: unknown
  ) => {
    if (!onWorksChange) return;
    const next = [...works];
    next[index] = { ...next[index], [field]: val };
    onWorksChange(next);
  };

  const handleAddWork = () => {
    if (!onWorksChange) return;
    const newWork: CandidateCvWork = {
      id: `work-${Date.now()}`,
      demoLabel: "DEMO/FAKE",
      title: "New Constituency Initiative",
      years: [2026],
      status: "In progress",
      summary: "Delivery description for constituency development.",
      evidenceGrade: "DEMO",
    };
    onWorksChange([...works, newWork]);
  };

  const handleDeleteWork = (index: number) => {
    if (!onWorksChange) return;
    const next = works.filter((_, i) => i !== index);
    onWorksChange(next);
  };

  return (
    <section id="works" aria-labelledby="works-heading" className="scroll-mt-32">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-1 border-b border-[var(--km-paper-line)]">
        <div className="flex items-center gap-2">
          <h2
            id="works-heading"
            className="text-lg md:text-xl font-bold text-[var(--km-text)]"
            style={{ fontFamily: "var(--km-font-display)" }}
          >
            Works &amp; delivery
          </h2>
          <EvidenceBadge demoLabel="DEMO/FAKE" />
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="works-year-filter" className="text-[var(--km-slate)] font-medium">
            Filter:
          </label>
          <select
            id="works-year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] px-2.5 py-1 text-xs font-medium text-[var(--km-text)] focus:outline-none focus:ring-1 focus:ring-[var(--km-accent)]"
          >
            {filterOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEditing && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleAddWork}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--km-paper-raised)] border border-[var(--km-accent)] text-[var(--km-accent-ink)] hover:bg-[var(--km-accent-soft)] transition"
          >
            + Add Delivery Work
          </button>
        </div>
      )}

      {/* Grid of works cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredWorks.map((work, idx) => {
          const originalIdx = works.findIndex((w) => w.id === work.id);
          const yearsStr =
            work.years?.length > 1
              ? `${work.years[0]}–${work.years[work.years.length - 1]}`
              : String(work.years?.[0] ?? "");

          return (
            <div
              key={work.id || idx}
              className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] p-4 shadow-none flex flex-col justify-between transition hover:border-[var(--km-navy)]"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={work.title}
                      onChange={(e) =>
                        handleUpdateWork(originalIdx, "title", e.target.value)
                      }
                      className="w-full text-sm font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
                    />
                  ) : (
                    <h3 className="text-sm md:text-base font-semibold text-[var(--km-text)] leading-snug">
                      {work.title}
                    </h3>
                  )}
                  <EvidenceBadge
                    demoLabel={work.demoLabel}
                    grade={work.evidenceGrade}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--km-slate)] mb-2 font-medium">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 2024, 2025"
                        value={work.years.join(", ")}
                        onChange={(e) => {
                          const parsed = e.target.value
                            .split(",")
                            .map((s) => Number(s.trim()))
                            .filter((n) => !Number.isNaN(n));
                          handleUpdateWork(originalIdx, "years", parsed);
                        }}
                        className="w-24 text-xs rounded border border-[var(--km-paper-line)] bg-white px-1.5 py-0.5"
                      />
                      <input
                        type="text"
                        placeholder="Status"
                        value={work.status}
                        onChange={(e) =>
                          handleUpdateWork(originalIdx, "status", e.target.value)
                        }
                        className="w-24 text-xs rounded border border-[var(--km-paper-line)] bg-white px-1.5 py-0.5"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="tabular-nums font-semibold text-[var(--km-accent-ink)]">
                        {yearsStr}
                      </span>
                      <span>•</span>
                      <span className="font-medium">{work.status}</span>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <textarea
                    rows={2}
                    value={work.summary}
                    onChange={(e) =>
                      handleUpdateWork(originalIdx, "summary", e.target.value)
                    }
                    className="w-full text-xs rounded border border-[var(--km-paper-line)] bg-white p-2 text-[var(--km-text)]"
                  />
                ) : (
                  <p className="text-xs md:text-sm text-[var(--km-text-muted)] leading-relaxed">
                    {work.summary}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="mt-2.5 pt-2 border-t border-[var(--km-paper-line)] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteWork(originalIdx)}
                    className="text-xs text-red-700 hover:underline"
                  >
                    Delete card
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
