import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateCvClient } from "./CandidateCvClient";
import { IdentityStrip } from "./IdentityStrip";
import { WorksGazette } from "./WorksGazette";
import { WorksTeaser } from "./WorksTeaser";
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
    {
      id: "w3",
      demoLabel: "DEMO/FAKE",
      title: "Community wedding support",
      years: [2010, 2020],
      status: "Ongoing",
      summary: "Social stewardship across the seat.",
      evidenceGrade: "DEMO",
    },
    {
      id: "w4",
      demoLabel: "DEMO/FAKE",
      title: "Ghoswari school-room upgrade",
      years: [2021, 2022],
      status: "Delivered",
      summary: "Extra classrooms and sanitation.",
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

describe("Candidate CV - SEPARATE Rally Overview + Gazette Ledger Acceptance", () => {
  it("Rally Overview (default) enforces ordering: Summary -> Agenda -> Works Teaser -> Scoreline, and omits full Gazette bands", () => {
    const html = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} initialView="overview" />
    );

    const summaryPos = html.indexOf('id="summary"');
    const agendaPos = html.indexOf('id="agenda"');
    const worksPos = html.indexOf('id="works"');
    const scorelinePos = html.indexOf('id="scoreline"');

    expect(summaryPos).toBeGreaterThan(-1);
    expect(agendaPos).toBeGreaterThan(-1);
    expect(worksPos).toBeGreaterThan(-1);
    expect(scorelinePos).toBeGreaterThan(-1);

    // Overview section order check
    expect(summaryPos).toBeLessThan(agendaPos);
    expect(agendaPos).toBeLessThan(worksPos);
    expect(worksPos).toBeLessThan(scorelinePos);

    // Omit long Service, full Plan, heavy Local map on Overview content main
    expect(html).not.toContain('id="service"');
    expect(html).not.toContain('id="plan"');

    // Contains CTA to open full Gazette
    expect(html).toContain("Open full Gazette");
  });

  it("Gazette view (?view=gazette) renders order: Works -> Service -> Plan -> Local -> Scoreline -> Sources", () => {
    const html = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} initialView="gazette" />
    );

    const worksPos = html.indexOf('id="works"');
    const servicePos = html.indexOf('id="service"');
    const planPos = html.indexOf('id="plan"');
    const localPos = html.indexOf('id="local"');
    const scorelinePos = html.indexOf('id="scoreline"');
    const sourcesPos = html.indexOf('id="sources"');

    expect(worksPos).toBeGreaterThan(-1);
    expect(servicePos).toBeGreaterThan(-1);
    expect(planPos).toBeGreaterThan(-1);
    expect(localPos).toBeGreaterThan(-1);
    expect(scorelinePos).toBeGreaterThan(-1);
    expect(sourcesPos).toBeGreaterThan(-1);

    // Gazette section order check
    expect(worksPos).toBeLessThan(servicePos);
    expect(servicePos).toBeLessThan(planPos);
    expect(planPos).toBeLessThan(localPos);
    expect(localPos).toBeLessThan(scorelinePos);
    expect(scorelinePos).toBeLessThan(sourcesPos);
  });

  it("LeftRailToc renders view-specific navigation links", () => {
    const overviewHtml = renderToStaticMarkup(<LeftRailToc view="overview" />);
    expect(overviewHtml).toContain('href="#summary"');
    expect(overviewHtml).toContain('href="#agenda"');
    expect(overviewHtml).toContain('href="#works"');
    expect(overviewHtml).toContain('href="#scoreline"');

    const gazetteHtml = renderToStaticMarkup(<LeftRailToc view="gazette" />);
    expect(gazetteHtml).toContain('href="#works"');
    expect(gazetteHtml).toContain('href="#service"');
    expect(gazetteHtml).toContain('href="#plan"');
    expect(gazetteHtml).toContain('href="#local"');
    expect(gazetteHtml).toContain('href="#scoreline"');
    expect(gazetteHtml).toContain('href="#sources"');
  });

  it("Zero Cases/FIR/affidavit UI on Candidate CV on both views", () => {
    const overviewHtml = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} initialView="overview" />
    );
    const gazetteHtml = renderToStaticMarkup(
      <CandidateCvClient initialCv={mockCv} isOwner={false} initialView="gazette" />
    );

    for (const html of [overviewHtml, gazetteHtml]) {
      expect(html).not.toMatch(/cases/i);
      expect(html).not.toMatch(/\bfir\b/i);
      expect(html).not.toMatch(/affidavit/i);
      expect(html).not.toMatch(/allegation/i);
      expect(html).not.toMatch(/controversy/i);
    }
  });

  it("IdentityStrip renders poster masthead on Overview and compressed bar on Gazette with chrome view toggle", () => {
    const overviewHtml = renderToStaticMarkup(
      <IdentityStrip
        candidate={mockCv.candidate}
        meta={mockCv.meta}
        isOwner={true}
        isEditing={false}
        view="overview"
      />
    );

    // Chrome toggle buttons
    expect(overviewHtml).toContain("Overview");
    expect(overviewHtml).toContain("Gazette");

    // Display poster serif name
    expect(overviewHtml).toContain("Anant Kumar Singh");
    expect(overviewHtml).toContain("var(--km-font-display)");
    expect(overviewHtml).toContain("border-l-4");
    expect(overviewHtml).toContain("var(--km-accent)");

    // Nameplate evidence badge is strictly DEMO/FAKE or LIVE
    expect(overviewHtml).toContain("DEMO/FAKE");
    expect(overviewHtml).not.toContain("MIXED");

    // Compressed Gazette header test
    const gazetteHtml = renderToStaticMarkup(
      <IdentityStrip
        candidate={mockCv.candidate}
        meta={mockCv.meta}
        isOwner={true}
        isEditing={false}
        view="gazette"
      />
    );
    expect(gazetteHtml).toContain("py-2.5 md:py-3");
    expect(gazetteHtml).toContain("Print");
  });

  it("WorksTeaser renders ≤3 rows and Open full Gazette CTA", () => {
    let clicked = false;
    const html = renderToStaticMarkup(
      <WorksTeaser
        works={mockCv.worksPortfolio}
        onOpenGazette={() => {
          clicked = true;
        }}
      />
    );

    expect(html).toContain("Works &amp; delivery");
    expect(html).toContain("Barhpur embankment package");
    expect(html).toContain("Pulse cold-store");
    expect(html).toContain("Community wedding support");
    // 4th work should not be in teaser (sliced to ≤3)
    expect(html).not.toContain("Ghoswari school-room upgrade");

    expect(html).toContain("Open full Gazette");
  });

  it("WorksGazette renders full dense editorial table on desktop and receipts on mobile", () => {
    const html = renderToStaticMarkup(
      <WorksGazette works={mockCv.worksPortfolio} />
    );

    expect(html).toContain("Works &amp; delivery");
    expect(html).toContain("<table");
    expect(html).toContain("Initiative / Scheme");
    expect(html).toContain("Barhpur embankment package");
    expect(html).toContain("Ghoswari school-room upgrade");
  });

  it("AgendaPillars supports maxPillars prop for Overview view", () => {
    const html = renderToStaticMarkup(
      <AgendaPillars agenda={mockCv.agenda} maxPillars={3} />
    );

    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("03");
    expect(html).not.toContain("04");
    expect(html).toContain("Flood-ready Mokama");
    expect(html).toContain("lg:grid-cols-3");
  });
});
