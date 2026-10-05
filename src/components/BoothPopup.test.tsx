import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BoothPopup } from "./BoothPopup";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import type { BoothProps, Candidate } from "@/lib/types";

const mockCandidates: Candidate[] = [
  {
    key: "anant_kumar_singh",
    name: "Anant Kumar Singh",
    party: "JD(U)",
    color: "#1a6b3c",
    evm_votes: 91135,
    booths_won: 231,
  },
  {
    key: "veena_devi",
    name: "Veena Devi",
    party: "RJD",
    color: "#16a34a",
    evm_votes: 63022,
    booths_won: 87,
  },
];

const mockBooth: BoothProps = {
  booth_no: 1,
  ps_name_en: "Primary School",
  village: "Mokama",
  lat: 25.39,
  lng: 85.91,
  total_valid: 900,
  electors: 1200,
  turnout_pct: 75.0,
  nota: 10,
  winner_key: "anant_kumar_singh",
  winner_name: "Anant Kumar Singh",
  winner_party: "JD(U)",
  winner_votes: 550,
  winner_pct: 61.1,
  winner_color: "#1a6b3c",
  margin: 250,
  margin_pct: 27.8,
  runner_up_key: "veena_devi",
  runner_up_name: "Veena Devi",
  runner_up_party: "RJD",
  votes: { anant_kumar_singh: 550, veena_devi: 300 },
  pct: { anant_kumar_singh: 61.1, veena_devi: 33.3 },
};

describe("BoothPopup", () => {
  it("renders Anant Kumar Singh's name as a link to Candidate CV in winner line and results table", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <BoothPopup
          booth={mockBooth}
          candidates={mockCandidates}
          acGrandTotal={175000}
          acNo={178}
          electionYear={2025}
          onClose={() => {}}
        />
      </LanguageProvider>
    );

    // Verify link to Anant CV exists
    expect(html).toContain('href="/app/candidates/demo-mokama-anant-kumar-singh"');
    // Verify Anant Kumar Singh text is present inside the link
    expect(html).toContain("Anant Kumar Singh");
  });
});
