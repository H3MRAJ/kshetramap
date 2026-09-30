import React, { useState, useMemo } from "react";
import { EvidenceBadge } from "./EvidenceBadge";
import type { CandidateCvWork } from "@/lib/candidateCv/types";

interface WorksGazetteProps {
  works: CandidateCvWork[];
  isEditing?: boolean;
  onWorksChange?: (works: CandidateCvWork[]) => void;
}

export function WorksGazette({
  works,
  isEditing = false,
  onWorksChange,
}: WorksGazetteProps) {
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
      return yearRange === selectedYear || w.years?.includes(Number(selectedYear));
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

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-900/10 text-emerald-800 border-emerald-300";
      case "in progress":
        return "bg-amber-900/10 text-amber-800 border-amber-300";
      case "priority":
        return "bg-[var(--km-accent-soft)] text-[var(--km-accent-ink)] border-[var(--km-accent-soft)]";
      default:
        return "bg-[var(--km-paper)] text-[var(--km-text)] border-[var(--km-paper-line)]";
    }
  };

  return (
    <section id="works" aria-labelledby="works-heading" className="scroll-mt-44">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-[var(--km-paper-line)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id="works-heading"
            className="text-lg md:text-xl font-bold text-[var(--km-text)]"
            style={{ fontFamily: "var(--km-font-display)" }}
          >
            Works &amp; delivery
          </h2>
          <EvidenceBadge demoLabel="DEMO/FAKE" />
          <span className="text-xs text-[var(--km-slate)] hidden sm:inline">
            • Gazette ledger &amp; delivery receipts
          </span>
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
        <div className="mb-3">
          <button
            type="button"
            onClick={handleAddWork}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[var(--km-paper-raised)] border border-[var(--km-accent)] text-[var(--km-accent-ink)] hover:bg-[var(--km-accent-soft)] transition"
          >
            + Add Delivery Work
          </button>
        </div>
      )}

      {/* Gazette Ledger Container: Hairline borders, warm paper shell, dense layout */}
      <div className="rounded-md border border-[var(--km-paper-line)] bg-[var(--km-paper-raised)] shadow-none overflow-hidden">
        {/* Desktop View: Dense Editorial Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--km-paper-line)] bg-[var(--km-paper)] text-[11px] font-semibold text-[var(--km-slate)] uppercase tracking-wider">
                <th className="py-2.5 px-3.5 font-semibold w-1/4">Initiative / Scheme</th>
                <th className="py-2.5 px-3 font-semibold w-24">Timeline</th>
                <th className="py-2.5 px-3 font-semibold w-28">Status</th>
                <th className="py-2.5 px-3.5 font-semibold">Delivery &amp; Impact</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">Evidence</th>
                {isEditing && (
                  <th className="py-2.5 px-3 font-semibold text-right w-16">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--km-paper-line)]">
              {filteredWorks.map((work, idx) => {
                const originalIdx = works.findIndex((w) => w.id === work.id);
                const yearsStr =
                  work.years?.length > 1
                    ? `${work.years[0]}–${work.years[work.years.length - 1]}`
                    : String(work.years?.[0] ?? "");

                return (
                  <tr
                    key={work.id || idx}
                    className="hover:bg-[var(--km-paper)]/60 transition-colors align-top"
                  >
                    {/* Initiative */}
                    <td className="py-3 px-3.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={work.title}
                          onChange={(e) =>
                            handleUpdateWork(originalIdx, "title", e.target.value)
                          }
                          className="w-full text-xs font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
                        />
                      ) : (
                        <span className="font-semibold text-[var(--km-text)] leading-snug">
                          {work.title}
                        </span>
                      )}
                    </td>

                    {/* Timeline */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="2024, 2025"
                          value={work.years?.join(", ") || ""}
                          onChange={(e) => {
                            const parsed = e.target.value
                              .split(",")
                              .map((s) => Number(s.trim()))
                              .filter((n) => !Number.isNaN(n));
                            handleUpdateWork(originalIdx, "years", parsed);
                          }}
                          className="w-20 text-xs rounded border border-[var(--km-paper-line)] bg-white px-1.5 py-1"
                        />
                      ) : (
                        <span className="tabular-nums font-semibold text-[var(--km-accent-ink)]">
                          {yearsStr}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="Status"
                          value={work.status}
                          onChange={(e) =>
                            handleUpdateWork(originalIdx, "status", e.target.value)
                          }
                          className="w-24 text-xs rounded border border-[var(--km-paper-line)] bg-white px-1.5 py-1"
                        />
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusClass(
                            work.status
                          )}`}
                        >
                          {work.status}
                        </span>
                      )}
                    </td>

                    {/* Delivery & Impact */}
                    <td className="py-3 px-3.5">
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
                        <p className="text-xs text-[var(--km-text-muted)] leading-relaxed">
                          {work.summary}
                        </p>
                      )}
                    </td>

                    {/* Verification */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <EvidenceBadge
                        demoLabel={work.demoLabel}
                        grade={work.evidenceGrade}
                      />
                    </td>

                    {/* Actions if editing */}
                    {isEditing && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteWork(originalIdx)}
                          className="text-xs text-red-700 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Dense Stacked Ledger Receipts */}
        <div className="md:hidden divide-y divide-[var(--km-paper-line)]">
          {filteredWorks.map((work, idx) => {
            const originalIdx = works.findIndex((w) => w.id === work.id);
            const yearsStr =
              work.years?.length > 1
                ? `${work.years[0]}–${work.years[work.years.length - 1]}`
                : String(work.years?.[0] ?? "");

            return (
              <div key={work.id || idx} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={work.title}
                      onChange={(e) =>
                        handleUpdateWork(originalIdx, "title", e.target.value)
                      }
                      className="w-full text-xs font-semibold rounded border border-[var(--km-paper-line)] bg-white px-2 py-1 text-[var(--km-text)]"
                    />
                  ) : (
                    <h3 className="font-semibold text-sm text-[var(--km-text)] leading-snug">
                      {work.title}
                    </h3>
                  )}
                  <EvidenceBadge
                    demoLabel={work.demoLabel}
                    grade={work.evidenceGrade}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Years"
                        value={work.years?.join(", ") || ""}
                        onChange={(e) => {
                          const parsed = e.target.value
                            .split(",")
                            .map((s) => Number(s.trim()))
                            .filter((n) => !Number.isNaN(n));
                          handleUpdateWork(originalIdx, "years", parsed);
                        }}
                        className="w-20 text-xs rounded border border-[var(--km-paper-line)] bg-white px-1.5 py-0.5"
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
                      <span className="text-[var(--km-slate)]">•</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium border ${getStatusClass(
                          work.status
                        )}`}
                      >
                        {work.status}
                      </span>
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
                  <p className="text-xs text-[var(--km-text-muted)] leading-relaxed">
                    {work.summary}
                  </p>
                )}

                {isEditing && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteWork(originalIdx)}
                      className="text-xs text-red-700 hover:underline"
                    >
                      Delete receipt
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
