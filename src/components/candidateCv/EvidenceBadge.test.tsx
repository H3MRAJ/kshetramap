import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidenceBadge } from "./EvidenceBadge";

describe("EvidenceBadge", () => {
  it("renders DEMO/FAKE badge when demoLabel is DEMO/FAKE", () => {
    const html = renderToStaticMarkup(<EvidenceBadge demoLabel="DEMO/FAKE" />);
    expect(html).toContain("DEMO/FAKE");
    expect(html).toContain("km-badge-demo");
  });

  it("renders DEMO/FAKE badge when grade is DEMO", () => {
    const html = renderToStaticMarkup(<EvidenceBadge grade="DEMO" />);
    expect(html).toContain("DEMO/FAKE");
    expect(html).toContain("km-badge-demo");
  });

  it("renders SOURCED badge when grade is SOURCED", () => {
    const html = renderToStaticMarkup(<EvidenceBadge grade="SOURCED" />);
    expect(html).toContain("SOURCED");
    expect(html).toContain("km-badge-sourced");
  });

  it("renders SOURCED · claim badge when grade is SOURCED-claim", () => {
    const html = renderToStaticMarkup(<EvidenceBadge grade="SOURCED-claim" />);
    expect(html).toContain("SOURCED · claim");
    expect(html).toContain("km-badge-sourced");
  });

  it("renders SOURCED · cited badge when grade is SOURCED-cited", () => {
    const html = renderToStaticMarkup(<EvidenceBadge grade="SOURCED-cited" />);
    expect(html).toContain("SOURCED · cited");
    expect(html).toContain("km-badge-sourced");
  });

  describe("Nameplate Law (CV-03 / Hema lock)", () => {
    it("strictly collapses MIXED to DEMO/FAKE on nameplate", () => {
      const html = renderToStaticMarkup(
        <EvidenceBadge grade="MIXED" isNameplate={true} />
      );
      expect(html).toContain("DEMO/FAKE");
      expect(html).not.toContain("MIXED");
    });

    it("renders LIVE on nameplate when demoLabel is LIVE", () => {
      const html = renderToStaticMarkup(
        <EvidenceBadge demoLabel="LIVE" isNameplate={true} />
      );
      expect(html).toContain("LIVE");
      expect(html).toContain("km-badge-sourced");
    });

    it("renders DEMO/FAKE on nameplate when demoLabel is DEMO/FAKE", () => {
      const html = renderToStaticMarkup(
        <EvidenceBadge demoLabel="DEMO/FAKE" isNameplate={true} />
      );
      expect(html).toContain("DEMO/FAKE");
      expect(html).toContain("km-badge-demo");
    });
  });
});
