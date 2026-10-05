import { describe, it, expect } from "vitest";
import {
  isAnantCandidate,
  getCandidateCvHref,
  ANANT_CANDIDATE_ID,
  ANANT_CANDIDATE_CV_HREF,
  RAMESHWAR_CANDIDATE_ID,
  RAMESHWAR_CANDIDATE_CV_HREF,
} from "./candidateLink";

describe("candidateLink", () => {
  describe("isAnantCandidate", () => {
    it("recognizes Anant by candidate key", () => {
      expect(isAnantCandidate("anant_kumar_singh", null)).toBe(true);
      expect(isAnantCandidate("anant", null)).toBe(true);
      expect(isAnantCandidate("anant_singh", null)).toBe(true);
    });

    it("recognizes Anant by English name", () => {
      expect(isAnantCandidate(null, "Anant Kumar Singh")).toBe(true);
      expect(isAnantCandidate(null, "Anant Singh")).toBe(true);
      expect(isAnantCandidate("other_key", "Anant Kumar Singh")).toBe(true);
    });

    it("recognizes Anant by Hindi name", () => {
      expect(isAnantCandidate(null, "अनंत कुमार सिंह")).toBe(true);
      expect(isAnantCandidate(null, "अनंत सिंह")).toBe(true);
    });

    it("returns false for non-Anant candidates", () => {
      expect(isAnantCandidate("veena_devi", "Veena Devi")).toBe(false);
      expect(isAnantCandidate("priyadarshi_piyush", "Priyadarshi Piyush")).toBe(false);
      expect(isAnantCandidate("rameshwar_prasad", "Rameshwar Prasad")).toBe(false);
      expect(isAnantCandidate(null, null)).toBe(false);
      expect(isAnantCandidate(undefined, undefined)).toBe(false);
    });
  });

  describe("getCandidateCvHref", () => {
    it("resolves Anant CV route", () => {
      expect(getCandidateCvHref("anant_kumar_singh", "Anant Kumar Singh")).toBe(
        "/app/candidates/demo-mokama-anant-kumar-singh"
      );
      expect(getCandidateCvHref(null, "अनंत कुमार सिंह")).toBe(
        "/app/candidates/demo-mokama-anant-kumar-singh"
      );
    });

    it("returns null for candidates without a dedicated demo CV link on map", () => {
      expect(getCandidateCvHref("veena_devi", "Veena Devi")).toBeNull();
    });
  });

  describe("constants", () => {
    it("exports valid IDs and URLs for both demo fixtures", () => {
      expect(ANANT_CANDIDATE_ID).toBe("demo-mokama-anant-kumar-singh");
      expect(ANANT_CANDIDATE_CV_HREF).toBe(
        "/app/candidates/demo-mokama-anant-kumar-singh"
      );
      expect(RAMESHWAR_CANDIDATE_ID).toBe("demo-mokama-rameshwar-prasad");
      expect(RAMESHWAR_CANDIDATE_CV_HREF).toBe(
        "/app/candidates/demo-mokama-rameshwar-prasad"
      );
    });
  });
});
