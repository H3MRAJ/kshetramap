import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";

// Mock dependencies
vi.mock("@/lib/api/session", () => ({
  requireApiSession: vi.fn(),
  apiError: (status: number, code: string, message: string) =>
    new Response(JSON.stringify({ error: { code, message } }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
}));

vi.mock("@/lib/audit/logAudit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/candidateCv/candidateCvRepo", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/candidateCv/candidateCvRepo")
  >("@/lib/candidateCv/candidateCvRepo");
  return {
    ...actual,
    updateCandidateCv: vi
      .fn()
      .mockImplementation(async (id: string, patch: any, userId: string) => {
        const existing = await actual.getCandidateCv(id);
        return actual.mergeCandidateCv(existing!, patch, userId);
      }),
  };
});

import { requireApiSession } from "@/lib/api/session";

describe("Candidate CV API (/api/v1/candidates/[id])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        error: new Response(
          JSON.stringify({ error: { code: "unauthenticated", message: "Login required" } }),
          { status: 401 }
        ) as any,
      });

      const res = await GET(new Request("http://localhost/api/v1/candidates/demo-mokama-anant-kumar-singh"), {
        params: Promise.resolve({ id: "demo-mokama-anant-kumar-singh" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("unauthenticated");
    });

    it("returns 404 when candidate CV not found", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "user-1",
            name: "Viewer User",
            phone: "9999999999",
            role: "viewer",
            ac_scope: [],
            candidate_id: null,
          },
        } as any,
      });

      const res = await GET(new Request("http://localhost/api/v1/candidates/unknown-id"), {
        params: Promise.resolve({ id: "unknown-id" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("not_found");
    });

    it("returns candidate CV and isOwner: false for viewer", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "user-1",
            name: "Viewer User",
            phone: "9999999999",
            role: "viewer",
            ac_scope: [],
            candidate_id: null,
          },
        } as any,
      });

      const res = await GET(new Request("http://localhost/api/v1/candidates/demo-mokama-anant-kumar-singh"), {
        params: Promise.resolve({ id: "demo-mokama-anant-kumar-singh" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.candidateCv.candidate.name).toBe("Anant Kumar Singh");
      expect(json.isOwner).toBe(false);
    });

    it("returns candidate CV and isOwner: true for super_admin", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "admin-1",
            name: "Super Admin",
            phone: "9999999999",
            role: "super_admin",
            ac_scope: [],
            candidate_id: null,
          },
        } as any,
      });

      const res = await GET(new Request("http://localhost/api/v1/candidates/demo-mokama-anant-kumar-singh"), {
        params: Promise.resolve({ id: "demo-mokama-anant-kumar-singh" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.candidateCv.candidate.name).toBe("Anant Kumar Singh");
      expect(json.isOwner).toBe(true);
    });

    it("returns second demo candidate CV (Rameshwar Prasad)", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "viewer-2",
            name: "Viewer",
            phone: "9999999999",
            role: "viewer",
            ac_scope: [],
            candidate_id: null,
          },
        } as any,
      });

      const res = await GET(
        new Request("http://localhost/api/v1/candidates/demo-mokama-rameshwar-prasad"),
        {
          params: Promise.resolve({ id: "demo-mokama-rameshwar-prasad" }),
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.candidateCv.candidate.id).toBe("demo-mokama-rameshwar-prasad");
      expect(json.candidateCv.candidate.name).toBe("Rameshwar Prasad");
      expect(json.candidateCv.candidate.demoLabel).toBe("DEMO/FAKE");
    });
  });

  describe("PATCH", () => {
    it("returns 403 forbidden when a viewer attempts to save edits", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "user-viewer",
            name: "Viewer User",
            phone: "9999999999",
            role: "viewer",
            ac_scope: [178],
            candidate_id: null,
          },
        } as any,
      });

      const res = await PATCH(
        new Request("http://localhost/api/v1/candidates/demo-mokama-anant-kumar-singh", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate: { oneLiner: "Unauthorized change" },
          }),
        }),
        {
          params: Promise.resolve({ id: "demo-mokama-anant-kumar-singh" }),
        }
      );

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("forbidden");
    });

    it("allows OWNER (super_admin) to save edits", async () => {
      vi.mocked(requireApiSession).mockResolvedValueOnce({
        session: {
          user: {
            id: "super-admin-id",
            name: "Super Admin",
            phone: "9999999999",
            role: "super_admin",
            ac_scope: [],
            candidate_id: null,
          },
        } as any,
      });

      const res = await PATCH(
        new Request("http://localhost/api/v1/candidates/demo-mokama-anant-kumar-singh", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate: {
              oneLiner: "Updated campaign summary for Mokama 2026",
            },
          }),
        }),
        {
          params: Promise.resolve({ id: "demo-mokama-anant-kumar-singh" }),
        }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.candidateCv.candidate.oneLiner).toBe(
        "Updated campaign summary for Mokama 2026"
      );
      expect(json.isOwner).toBe(true);
    });
  });
});
