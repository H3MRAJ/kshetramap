import { appBasePath } from "./boothOverrides";

export type PartyMeta = {
  /** Canonical short label shown in UI */
  label: string;
  /** Path under /public (no basePath) */
  logoFile: string;
  color: string;
};

/** Normalize any party string from data → registry key */
export function normalizePartyKey(party: string | null | undefined): string {
  if (!party) return "unknown";
  const p = party
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.]/g, "");

  if (!p || p === "—" || p === "-" || p === "n/a" || p === "na") return "unknown";
  if (p === "ind" || p === "independent" || p === "independents") return "independent";
  if (
    p === "jd(u)" ||
    p === "jdu" ||
    p === "jd u" ||
    p.includes("janata dal (united)") ||
    p.includes("janata dal united")
  )
    return "jdu";
  if (p === "rjd" || p.includes("rashtriya janata dal")) return "rjd";
  if (
    p === "inc" ||
    p === "congress" ||
    p.includes("indian national congress")
  )
    return "inc";
  if (p === "ljp" || p.includes("lok janshakti")) return "ljp";
  if (
    p === "jap(l)" ||
    p === "japl" ||
    p === "jap" ||
    p.includes("jan adhikar")
  )
    return "japl";
  if (p === "sp" || p.includes("samajwadi")) return "sp";
  if (p === "cpi" || p.includes("communist party of india")) return "cpi";
  if (p === "rlsp" || p.includes("rashtriya lok samta")) return "rlsp";
  if (p === "blrp" || p.includes("lokmat")) return "blrp";
  if (p === "bjp" || p.includes("bharatiya janata")) return "bjp";
  if (p === "nota") return "unknown";

  return "unknown";
}

/** Logos from Wikimedia Commons ECI election symbols (see public/parties/SOURCES.md). */
const REGISTRY: Record<string, PartyMeta> = {
  jdu: {
    label: "JD(U)",
    logoFile: "jdu.svg", // Arrow
    color: "#1a6b3c",
  },
  rjd: {
    label: "RJD",
    logoFile: "rjd.png", // Hurricane lamp
    color: "#16a34a",
  },
  inc: {
    label: "INC",
    logoFile: "inc.svg", // Hand
    color: "#2563eb",
  },
  independent: {
    label: "Independent",
    logoFile: "independent.svg",
    color: "#6b7280",
  },
  ljp: {
    label: "LJP",
    logoFile: "ljp.png", // Hut (Commons); official LJP = bungalow
    color: "#7c3aed",
  },
  japl: {
    label: "JAP(L)",
    logoFile: "japl.svg",
    color: "#ea580c",
  },
  sp: {
    label: "SP",
    logoFile: "sp.png", // Cycle / bicycle
    color: "#dc2626",
  },
  cpi: {
    label: "CPI",
    logoFile: "cpi.png", // Ears of corn and sickle
    color: "#b91c1c",
  },
  rlsp: {
    label: "RLSP",
    logoFile: "rlsp.svg",
    color: "#0891b2",
  },
  blrp: {
    label: "BLRP",
    logoFile: "blrp.svg",
    color: "#ca8a04",
  },
  bjp: {
    label: "BJP",
    logoFile: "unknown.svg",
    color: "#f97316",
  },
  unknown: {
    label: "—",
    logoFile: "unknown.svg",
    color: "#52525b",
  },
};

export function getPartyMeta(party: string | null | undefined): PartyMeta {
  const key = normalizePartyKey(party);
  const meta = REGISTRY[key] || REGISTRY.unknown;
  // Prefer original display string when unknown but non-empty
  if (key === "unknown" && party && party.trim() && party.trim() !== "—") {
    return { ...meta, label: party.trim() };
  }
  // Keep "Independent" full word; keep known short codes from registry
  if (key === "independent") return meta;
  // If data says Independent already handled; if data has custom short code matching registry label use registry
  return meta;
}

export function partyLogoUrl(party: string | null | undefined): string {
  const meta = getPartyMeta(party);
  const base = appBasePath();
  return `${base}/parties/${meta.logoFile}`.replace(/\/{2,}/g, "/");
}

export function partyDisplayLabel(party: string | null | undefined): string {
  return getPartyMeta(party).label;
}
