import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateCvClient } from "./CandidateCvClient";
import { IdentityStrip } from "./IdentityStrip";
import { WorksGazette } from "./WorksGazette";
import { AgendaPillars } from "./AgendaPillars";
import { LeftRailToc } from "./LeftRailToc";
import type { CandidateCvDoc } from "@/lib/candidateCv/types";

const mockCv: CandidateCvDoc = {
  meta: {
    demoLabel: "DEMO/FAKE",
    banner: "DEMO/FAKE SHOWCASE — works, agenda & plan synthetic where noted; elections SOURCED.",
    asOf: "2026-09-30",
    constituency: "Mokama AC-178",
    purpose: "Testing",
  },
  candidate: {
    id: "demo-mokama-anant-kumar-singh",
    demoLabel: "DEMO/FAKE",
    name: "Anant Kumar Singh",
    aliases: ["Chhote Sarkar"],
    party: "JD(U)",
    seat: "Mokama (AC-178)",
    status: "MLA",
    oneLiner: "Five-term Mokama MLA; delivery focus on flood protection and schools.",
    tags: ["Flood & embankment", "Taal stewardship"],
    channels: { x: "@anantsingh" },
  },
  serviceTimeline: [
    { year: 2025, title: "Wins Mokama", detail: "91,416 votes", evidenceGrade: "SOURCED" },
  ],
  electionScoreline2025: {
    evidenceGrade: "SOURCED",
    winner: { name: "Anant Kumar Singh", party: "JD(U)", votes: 91416 },
    runnerUp: { name: "Veena Devi", party: "RJD", votes: 63210 },
    third: { name: "Piyush", party: "Jan Suraaj", votes: 19365 },
    margin: 28206,
  },
  worksPortfolio: [
    {
      id: "w1",
      demoLabel: "DEMO/FAKE",
      title: "Barhpur embankment package",
      years: [2024, 2025, 2026],
      status: "In progress",
      summary: "Flood-ready bunds for Mokama villages.",
      evidenceGrade: "DEMO",
    },
    {
      id: "w2",
      demoLabel: "DEMO/FAKE",
      title: "Pulse cold-store",
      years: [2018, 2019],
      status: "Delivered",
      summary: "Farmer storage hub for taal harvest.",
      evidenceGrade: "DEMO",
    },
  ],
  agenda: {
    demoLabel: "DEMO/FAKE",
    pillars: [
      { id: "a1", title: "Flood-ready Mokama", detail: "Embankments, cuts, early-warning" },
      { id: "a2", title: "Taal & farmer wealth", detail: "Cold-store, MSP linkage, seeds" },
      { id: "a3", title: "Schools that stay open", detail: "Rooms, teachers, mid-day reliability" },
      { id: "a4", title: "Roads & last-mile access", detail: "Ghoswari–Pandarak link works" },
    ],
  },
  plan: {
    demoLabel: "DEMO/FAKE",
    phases: [
      { id: "p1", window: "0–6 mo", goal: "Secure embankment packages" },
    ],
  },
  localBase: {
    evidenceGrade: "SOURCED",
    blocks: ["Mokama", "Ghoswari", "Pandarak"],
    ecology: "Taal / lentil bowl",
    note: "Multi-term ground network",
  },
  sources: [
    { label: "ECI 2025 results", url: "https://eci.gov.in", evidenceGrade: "SOURCED" },
  ],
};

describe("Candidate CV - MIX Rally Masthead + Gazette Ledger Acceptance", () => {
  it("enforces canonical section ordering: Agenda before Works, and Works before Service", () => {
    const html = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} />
    );

    const summaryPos = html.indexOf('id="summary"');
    const agendaPos = html.indexOf('id="agenda"');
    const worksPos = html.indexOf('id="works"');
    const servicePos = html.indexOf('id="service"');
    const planPos = html.indexOf('id="plan"');
    const localPos = html.indexOf('id="local"');
    const scorelinePos = html.indexOf('id="scoreline"');
    const sourcesPos = html.indexOf('id="sources"');

    expect(summaryPos).toBeGreaterThan(-1);
    expect(agendaPos).toBeGreaterThan(-1);
    expect(worksPos).toBeGreaterThan(-1);
    expect(servicePos).toBeGreaterThan(-1);
    expect(planPos).toBeGreaterThan(-1);
    expect(localPos).toBeGreaterThan(-1);
    expect(scorelinePos).toBeGreaterThan(-1);
    expect(sourcesPos).toBeGreaterThan(-1);

    // Canonical order check
    expect(summaryPos).toBeLessThan(agendaPos);
    expect(agendaPos).toBeLessThan(worksPos);
    expect(worksPos).toBeLessThan(servicePos);
    expect(servicePos).toBeLessThan(planPos);
    expect(planPos).toBeLessThan(localPos);
    expect(localPos).toBeLessThan(scorelinePos);
    expect(scorelinePos).toBeLessThan(sourcesPos);
  });

  it("LeftRailToc links match canonical anchor order", () => {
    const html = renderToStaticMarkup(<LeftRailToc />);

    const hrefSummary = html.indexOf('href="#summary"');
    const hrefAgenda = html.indexOf('href="#agenda"');
    const hrefWorks = html.indexOf('href="#works"');
    const hrefService = html.indexOf('href="#service"');
    const hrefPlan = html.indexOf('href="#plan"');
    const hrefLocal = html.indexOf('href="#local"');
    const hrefScoreline = html.indexOf('href="#scoreline"');
    const hrefSources = html.indexOf('href="#sources"');

    expect(hrefSummary).toBeLessThan(hrefAgenda);
    expect(hrefAgenda).toBeLessThan(hrefWorks);
    expect(hrefWorks).toBeLessThan(hrefService);
    expect(hrefService).toBeLessThan(hrefPlan);
    expect(hrefPlan).toBeLessThan(hrefLocal);
    expect(hrefLocal).toBeLessThan(hrefScoreline);
    expect(hrefScoreline).toBeLessThan(hrefSources);
  });

  it("Zero Cases/FIR/affidavit UI on Candidate CV", () => {
    const html = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} />
    );

    // Forbidden terminology on sell surface
    expect(html).not.toMatch(/cases/i);
    expect(html).not.toMatch(/\bfir\b/i);
    expect(html).not.toMatch(/affidavit/i);
    expect(html).not.toMatch(/allegation/i);
    expect(html).not.toMatch(/controversy/i);
  });

  it("Rally Masthead displays poster-scale serif name, sticky ink header, and saffron accent", () => {
    const html = renderToStaticMarkup(
      <IdentityStrip
        candidate={mockCv.candidate}
        meta={mockCv.meta}
        isOwner={true}
        isEditing={false}
      />
    );

    // Header element with sticky positioning and ink background
    expect(html).toContain("sticky");
    expect(html).toContain("var(--km-ink)");
    expect(html).toMatch(/top:\s*36px/); // Under DEMO banner

    // Display serif name
    expect(html).toContain("Anant Kumar Singh");
    expect(html).toContain("var(--km-font-display)");

    // Saffron accent left tick
    expect(html).toContain("border-l-4");
    expect(html).toContain("var(--km-accent)");

    // Nameplate evidence badge is strictly DEMO/FAKE or LIVE (never MIXED)
    expect(html).toContain("DEMO/FAKE");
    expect(html).not.toContain("MIXED");

    // PDF affordance button
    expect(html).toContain("PDF");
    expect(html).toContain("↓");

    // Owner edit affordance
    expect(html).toContain("Edit Portfolio");
  });

  it("WorksGazette renders dense editorial table on desktop and receipts on mobile", () => {
    const html = renderToStaticMarkup(
      <WorksGazette works={mockCv.worksPortfolio} />
    );

    // Section title
    expect(html).toContain("Works &amp; delivery");

    // Table elements for desktop
    expect(html).toContain("<table");
    expect(html).toContain("Initiative / Scheme");
    expect(html).toContain("Delivery &amp; Impact");
    expect(html).toContain("Timeline");

    // Delivery items
    expect(html).toContain("Barhpur embankment package");
    expect(html).toContain("Pulse cold-store");
    expect(html).toContain("2024–2026");
    expect(html).toContain("2018–2019");

    // Evidence badges on synthetic works
    expect(html).toContain("DEMO/FAKE");

    // Year filter select
    expect(html).toContain('id="works-year-filter"');
  });

  it("AgendaPillars renders manifesto pillars in a row on desktop with numbered saffron marks", () => {
    const html = renderToStaticMarkup(
      <AgendaPillars agenda={mockCv.agenda} />
    );

    expect(html).toContain("Agenda");
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("03");
    expect(html).toContain("04");
    expect(html).toContain("Flood-ready Mokama");
    expect(html).toContain("Taal &amp; farmer wealth");
    expect(html).toContain("lg:grid-cols-4"); // 4 pillars in a row
  });
});
