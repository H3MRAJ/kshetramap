import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import {
  parseSeatAc,
  isCandidateCvOwner,
  mergeCandidateCv,
  getCandidateCv,
  updateCandidateCv,
  toPlainCandidateCv,
} from "./candidateCvRepo";
import type { CandidateCvDoc } from "./types";

const mockCv: CandidateCvDoc = {
  meta: {
    demoLabel: "DEMO/FAKE",
    banner: "DEMO banner",
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
    oneLiner: "Five-term Mokama MLA",
    tags: ["Flood", "Taal"],
    channels: { x: "@anant" },
  },
  serviceTimeline: [
    { year: 2025, title: "Wins Mokama", detail: "91416 votes", evidenceGrade: "SOURCED" },
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
      title: "Embankment",
      years: [2024],
      status: "In progress",
      summary: "Flood protection",
      evidenceGrade: "DEMO",
    },
  ],
  agenda: {
    demoLabel: "DEMO/FAKE",
    pillars: [{ id: "a1", title: "Flood-ready", detail: "Bunds" }],
  },
  plan: {
    demoLabel: "DEMO/FAKE",
    phases: [{ id: "p1", window: "0–6 mo", goal: "Secure packages" }],
  },
  localBase: {
    evidenceGrade: "SOURCED",
    blocks: ["Mokama"],
    ecology: "Taal",
    note: "Ground network",
  },
  sources: [{ label: "ECI", url: "https://eci.gov.in", evidenceGrade: "SOURCED" }],
};

describe("candidateCvRepo", () => {
  describe("parseSeatAc", () => {
    it("extracts AC number correctly from various formats", () => {
      expect(parseSeatAc("Mokama (AC-178)")).toBe(178);
      expect(parseSeatAc("Mokama AC-178")).toBe(178);
      expect(parseSeatAc("AC-178")).toBe(178);
      expect(parseSeatAc("AC178")).toBe(178);
      expect(parseSeatAc("No AC here")).toBeNull();
      expect(parseSeatAc(undefined)).toBeNull();
    });
  });

  describe("isCandidateCvOwner", () => {
    it("super_admin is always owner", () => {
      expect(isCandidateCvOwner({ role: "super_admin" }, mockCv)).toBe(true);
      expect(
        isCandidateCvOwner({ role: "super_admin", ac_scope: [100] }, mockCv)
      ).toBe(true);
    });

    it("admin with AC in scope is owner", () => {
      expect(
        isCandidateCvOwner({ role: "admin", ac_scope: [178, 179] }, mockCv)
      ).toBe(true);
    });

    it("unscoped admin is owner", () => {
      expect(isCandidateCvOwner({ role: "admin", ac_scope: [] }, mockCv)).toBe(
        true
      );
      expect(isCandidateCvOwner({ role: "admin" }, mockCv)).toBe(true);
    });

    it("admin without AC in scope is NOT owner", () => {
      expect(
        isCandidateCvOwner({ role: "admin", ac_scope: [101, 102] }, mockCv)
      ).toBe(false);
    });

    it("candidate with matching candidate_id is owner", () => {
      expect(
        isCandidateCvOwner(
          {
            role: "candidate",
            candidate_id: "demo-mokama-anant-kumar-singh",
          },
          mockCv
        )
      ).toBe(true);
    });

    it("candidate with different candidate_id is NOT owner", () => {
      expect(
        isCandidateCvOwner(
          {
            role: "candidate",
            candidate_id: "other-candidate-id",
          },
          mockCv
        )
      ).toBe(false);
    });

    it("worker and viewer are never owners", () => {
      expect(isCandidateCvOwner({ role: "worker", ac_scope: [178] }, mockCv)).toBe(
        false
      );
      expect(isCandidateCvOwner({ role: "viewer", ac_scope: [178] }, mockCv)).toBe(
        false
      );
    });
  });

  describe("mergeCandidateCv", () => {
    it("merges candidate summary and agenda correctly", () => {
      const patch = {
        candidate: {
          oneLiner: "Updated one-liner for Anant Singh",
        },
        agenda: {
          pillars: [
            { id: "a1", title: "Flood-ready", detail: "Upgraded bunds" },
            { id: "a2", title: "Farmer wealth", detail: "Lentils" },
          ],
        },
      };

      const merged = mergeCandidateCv(mockCv, patch, "user-123");

      expect(merged.candidate.oneLiner).toBe("Updated one-liner for Anant Singh");
      expect(merged.candidate.name).toBe("Anant Kumar Singh"); // preserved
      expect(merged.agenda.pillars).toHaveLength(2);
      expect(merged.agenda.pillars[0].detail).toBe("Upgraded bunds");
      expect(merged.agenda.demoLabel).toBe("DEMO/FAKE"); // preserved
      expect(merged.updated_by).toBe("user-123");
      expect(merged.updated_at).toBeDefined();
    });

    it("updates plan and worksPortfolio without dropping other sections", () => {
      const patch = {
        plan: {
          phases: [{ id: "p1", window: "0–3 mo", goal: "Fast start" }],
        },
      };

      const merged = mergeCandidateCv(mockCv, patch, "admin-1");
      expect(merged.plan.phases[0].window).toBe("0–3 mo");
      expect(merged.electionScoreline2025.winner.votes).toBe(91416); // preserved
      expect(merged.serviceTimeline).toHaveLength(1); // preserved
    });
  });

  describe("getCandidateCv & updateCandidateCv", () => {
    let originalFixtureContent: string;
    let originalRameshwarFixtureContent: string;
    const fixturePath = path.join(
      process.cwd(),
      "data",
      "demo",
      "candidate-cv-mokama-showcase.json"
    );
    const rameshwarFixturePath = path.join(
      process.cwd(),
      "data",
      "demo",
      "candidate-cv-mokama-rameshwar-prasad.json"
    );

    beforeAll(async () => {
      originalFixtureContent = await readFile(fixturePath, "utf-8");
      originalRameshwarFixtureContent = await readFile(rameshwarFixturePath, "utf-8");
    });

    afterAll(async () => {
      if (originalFixtureContent) {
        await writeFile(fixturePath, originalFixtureContent, "utf-8");
      }
      if (originalRameshwarFixtureContent) {
        await writeFile(rameshwarFixturePath, originalRameshwarFixtureContent, "utf-8");
      }
    });

    it("loads candidate CV from fixture for demo id", async () => {
      const cv = await getCandidateCv("demo-mokama-anant-kumar-singh");
      expect(cv).not.toBeNull();
      expect(cv?.candidate.name).toBe("Anant Kumar Singh");
      expect(cv?.serviceTimeline.length).toBeGreaterThan(0);
      expect(cv?.worksPortfolio.length).toBeGreaterThan(0);
      expect(cv?.agenda.pillars.length).toBeGreaterThan(0);
      expect(cv?.plan.phases.length).toBeGreaterThan(0);
    });

    it("loads candidate CV from fixture for second demo id (Rameshwar Prasad)", async () => {
      const cv = await getCandidateCv("demo-mokama-rameshwar-prasad");
      expect(cv).not.toBeNull();
      expect(cv?.candidate.name).toBe("Rameshwar Prasad");
      expect(cv?.candidate.seat).toContain("Mokama");
      expect(cv?.serviceTimeline.length).toBeGreaterThan(0);
      expect(cv?.worksPortfolio.length).toBeGreaterThan(0);
      expect(cv?.agenda.pillars.length).toBeGreaterThan(0);
      expect(cv?.plan.phases.length).toBeGreaterThan(0);
      expect(cv?.candidate.demoLabel).toBe("DEMO/FAKE");
    });

    it("ensures duplicate fixture file does not exist and single canonical fixture is used", async () => {
      const duplicatePath = path.join(
        process.cwd(),
        "data",
        "demo",
        "candidate-cv-demo-mokama-rameshwar-prasad.json"
      );
      let duplicateExists = false;
      try {
        await readFile(duplicatePath);
        duplicateExists = true;
      } catch {
        duplicateExists = false;
      }
      expect(duplicateExists).toBe(false);

      const cv = await getCandidateCv("demo-mokama-rameshwar-prasad");
      expect(cv?.candidate.name).toBe("Rameshwar Prasad");
    });

    it("returns null for non-existent candidate id", async () => {
      const cv = await getCandidateCv("non-existent-candidate-id-xyz");
      expect(cv).toBeNull();
    });

    it("updates candidate CV and persists updates across reloads", async () => {
      const original = await getCandidateCv("demo-mokama-anant-kumar-singh");
      expect(original).not.toBeNull();

      const updated = await updateCandidateCv(
        "demo-mokama-anant-kumar-singh",
        {
          agenda: {
            demoLabel: "DEMO/FAKE",
            pillars: [
              {
                id: "a1",
                title: "Flood-ready Mokama (Test Verified)",
                detail: "Upgraded test bunds",
              },
            ],
          },
        },
        "test-super-admin"
      );

      expect(updated.agenda.pillars[0].title).toBe(
        "Flood-ready Mokama (Test Verified)"
      );

      // Verify that reloading sees the update
      const reloaded = await getCandidateCv("demo-mokama-anant-kumar-singh");
      expect(reloaded?.agenda.pillars[0].title).toBe(
        "Flood-ready Mokama (Test Verified)"
      );
    });
  });
});

describe("toPlainCandidateCv", () => {
  it("strips Mongo _id ObjectId/buffer and leaves string candidate.id", () => {
    const mongoLike = {
      ...mockCv,
      _id: {
        toJSON() {
          return "507f1f77bcf86cd799439011";
        },
        buffer: { type: "Buffer", data: [1, 2, 3] },
      },
      updated_at: {
        toJSON() {
          return "2026-09-30T00:00:00.000Z";
        },
      },
    };

    const plain = toPlainCandidateCv(mongoLike);

    expect(plain).not.toHaveProperty("_id");
    expect(typeof plain.candidate.id).toBe("string");
    expect(plain.candidate.id).toBe("demo-mokama-anant-kumar-singh");
    expect(typeof plain.updated_at).toBe("string");
    expect(plain.updated_at).toBe("2026-09-30T00:00:00.000Z");
    // No Buffer / nested buffer props remain anywhere at top level
    const json = JSON.stringify(plain);
    expect(json).not.toMatch(/"buffer"/);
    expect(json).not.toMatch(/ObjectId/);
  });
});
