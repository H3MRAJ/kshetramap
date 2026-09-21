/**
 * Personal booth pin previews — this browser only.
 * Never writes authentic/public geometry. Future admin reviews drag *requests*.
 */

export type BoothOverride = {
  lat: number;
  lng: number;
  updated_at: string;
  /** Client-only; not authentic coord store */
  location_source: "personal_preview";
  /** Queued for future admin review (local copy of request) */
  status: "personal_only" | "request_queued";
  original_lat?: number;
  original_lng?: number;
};

export type DragRequest = {
  id: string;
  ac_no: number;
  booth_no: number;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  created_at: string;
  /** Always pending until admin panel exists */
  admin_status: "pending_review";
  client: {
    hostname?: string;
    userAgent?: string;
  };
};

const overrideKey = (acNo: number) => `kshetramap-booth-overrides-${acNo}`;
const requestKey = (acNo: number) => `kshetramap-drag-requests-${acNo}`;

/** GitHub Pages / pure static hosts — no POST API available. */
export function isStaticHosting(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h.endsWith("github.io") ||
    h.endsWith("gitlab.io") ||
    h.endsWith("pages.dev")
  );
}

/** Next basePath for asset/API URLs (e.g. "/kshetramap" on GH Pages). */
export function appBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "kshetramap") return "/kshetramap";
  }
  return "";
}

export function loadOverrides(acNo: number): Record<number, BoothOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(overrideKey(acNo));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BoothOverride & { location_source?: string }>;
    const out: Record<number, BoothOverride> = {};
    for (const [k, v] of Object.entries(parsed)) {
      // Migrate legacy user_drag local saves → personal_preview
      out[Number(k)] = {
        lat: v.lat,
        lng: v.lng,
        updated_at: v.updated_at,
        location_source: "personal_preview",
        status: v.status === "request_queued" ? "request_queued" : "personal_only",
        original_lat: v.original_lat,
        original_lng: v.original_lng,
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function saveOverrides(
  acNo: number,
  overrides: Record<number, BoothOverride>
): void {
  if (typeof window === "undefined") return;
  const serializable: Record<string, BoothOverride> = {};
  for (const [k, v] of Object.entries(overrides)) {
    serializable[k] = v;
  }
  localStorage.setItem(overrideKey(acNo), JSON.stringify(serializable));
}

export function setOverride(
  acNo: number,
  boothNo: number,
  lat: number,
  lng: number,
  opts?: {
    original_lat?: number;
    original_lng?: number;
    status?: BoothOverride["status"];
  }
): Record<number, BoothOverride> {
  const all = loadOverrides(acNo);
  all[boothNo] = {
    lat,
    lng,
    updated_at: new Date().toISOString(),
    location_source: "personal_preview",
    status: opts?.status ?? "personal_only",
    original_lat: opts?.original_lat ?? all[boothNo]?.original_lat,
    original_lng: opts?.original_lng ?? all[boothNo]?.original_lng,
  };
  saveOverrides(acNo, all);
  return all;
}

export function clearOverride(
  acNo: number,
  boothNo: number
): Record<number, BoothOverride> {
  const all = loadOverrides(acNo);
  delete all[boothNo];
  saveOverrides(acNo, all);
  return all;
}

/** Local queue of drag requests (future: admin panel reads server queue). */
export function loadDragRequests(acNo: number): DragRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(requestKey(acNo));
    if (!raw) return [];
    return JSON.parse(raw) as DragRequest[];
  } catch {
    return [];
  }
}

export function enqueueDragRequest(
  acNo: number,
  req: Omit<DragRequest, "id" | "ac_no" | "created_at" | "admin_status" | "client">
): DragRequest {
  const full: DragRequest = {
    id: `${acNo}-${req.booth_no}-${Date.now()}`,
    ac_no: acNo,
    booth_no: req.booth_no,
    from_lat: req.from_lat,
    from_lng: req.from_lng,
    to_lat: req.to_lat,
    to_lng: req.to_lng,
    created_at: new Date().toISOString(),
    admin_status: "pending_review",
    client: {
      hostname: typeof window !== "undefined" ? window.location.hostname : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : undefined,
    },
  };
  if (typeof window !== "undefined") {
    const list = loadDragRequests(acNo);
    list.push(full);
    // keep last 200 per AC on device
    localStorage.setItem(requestKey(acNo), JSON.stringify(list.slice(-200)));
  }
  return full;
}
