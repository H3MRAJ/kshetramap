import React, { useState, useEffect } from "react";
import { EvidenceBadge } from "./EvidenceBadge";

interface LeftRailTocProps {
  blocks?: string[];
  activeId?: string;
  onNavigate?: (id: string) => void;
}

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "service", label: "Service timeline" },
  { id: "works", label: "Works & delivery" },
  { id: "agenda", label: "Agenda" },
  { id: "plan", label: "Plan" },
  { id: "local", label: "Local base" },
  { id: "scoreline", label: "2025 win scoreline" },
  { id: "sources", label: "Sources" },
];

export function LeftRailToc({
  blocks = ["Mokama", "Ghoswari", "Pandarak"],
  activeId = "summary",
  onNavigate,
}: LeftRailTocProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentActive, setCurrentActive] = useState(activeId);

  useEffect(() => {
    setCurrentActive(activeId);
  }, [activeId]);

  // Scroll spy effect to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setCurrentActive(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentActive(id);
    setMobileOpen(false);

    if (onNavigate) {
      onNavigate(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offset = 120; // banner + strip height
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);
      }
    }
  };

  const navContent = (
    <nav className="flex flex-col space-y-1">
      <p className="px-3 pb-2 text-xs font-semibold text-[var(--km-slate)] tracking-wider">
        CV TOC
      </p>
      {SECTIONS.map((sec) => {
        const isActive = currentActive === sec.id;
        return (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            onClick={(e) => handleClick(sec.id, e)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-all ${
              isActive
                ? "bg-[var(--km-navy-muted)] text-[var(--km-text-on-ink)] border-l-2 border-[var(--km-accent)] pl-2.5 font-semibold"
                : "text-[var(--km-text-muted-on-ink)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--km-text-on-ink)]"
            }`}
          >
            <span>{sec.label}</span>
          </a>
        );
      })}
    </nav>
  );

  const mapStub = (
    <div className="mt-6 rounded-md border border-[rgba(244,239,230,0.12)] bg-[var(--km-navy)] p-3 text-[var(--km-text-on-ink)]">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-xs font-semibold text-[var(--km-text-on-ink)]">
          Map stub
        </span>
        <EvidenceBadge grade="SOURCED" />
      </div>
      <p className="text-[11px] text-[var(--km-slate-soft)] mb-2.5">
        SOURCED geography names only
      </p>
      <div className="rounded bg-[var(--km-ink)] p-2.5 border border-[rgba(244,239,230,0.08)] space-y-1.5">
        {blocks.map((b) => (
          <div
            key={b}
            className="flex items-center gap-1.5 text-xs text-[var(--km-text-on-ink)] font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--km-accent)]" />
            <span>{b}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-[var(--km-slate-soft)] italic pt-1 border-t border-[rgba(244,239,230,0.08)]">
          <span>[taal floodlands]</span>
        </div>
      </div>
    </div>
  );

  const favorabilityStub = (
    <div className="mt-5 px-3 py-2 rounded border border-[rgba(244,239,230,0.06)] bg-[rgba(255,255,255,0.02)]">
      <span className="text-[11px] text-[var(--km-slate)] font-medium">
        Favorability · later
      </span>
      <p className="text-[10px] text-[var(--km-slate-soft)] mt-0.5">
        Verified ground poll stub
      </p>
    </div>
  );

  return (
    <>
      {/* Desktop Left Rail (sticky) */}
      <aside className="hidden lg:block w-[240px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-130px)] overflow-y-auto pr-2 select-none">
        {navContent}
        {mapStub}
        {favorabilityStub}
      </aside>

      {/* Mobile Floating Action Button / Bar */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[var(--km-navy)] px-4 py-2.5 text-xs font-semibold text-[var(--km-text-on-ink)] shadow-lg border border-[var(--km-accent)] hover:bg-[var(--km-navy-muted)] focus:outline-none"
        >
          <span>CV sections</span>
          <span className="text-[var(--km-accent)]">▴</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-xl bg-[var(--km-ink-elevated)] p-5 border-t border-[rgba(244,239,230,0.2)] text-[var(--km-text-on-ink)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[rgba(244,239,230,0.12)]">
              <span className="text-sm font-semibold">CV sections</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-1 text-xs text-[var(--km-text-muted-on-ink)] hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            {navContent}
            {mapStub}
          </div>
        </div>
      )}
    </>
  );
}
