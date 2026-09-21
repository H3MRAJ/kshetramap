import { appBasePath } from "./boothOverrides";
import type {
  AcSeries,
  BoothMatches,
  ElectionPackage,
  PlaceSeries,
} from "./historyTypes";

function dataUrl(acNo: number, rel: string): string {
  const base = appBasePath();
  return `${base}/data/ac-${acNo}/${rel}`.replace(/\/{2,}/g, "/").replace(
    ":/",
    "://"
  );
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadAcSeries(acNo: number): Promise<AcSeries | null> {
  return fetchJson<AcSeries>(dataUrl(acNo, "history/ac-series.json"));
}

export async function loadBoothMatches(
  acNo: number
): Promise<BoothMatches | null> {
  return fetchJson<BoothMatches>(dataUrl(acNo, "history/booth-matches.json"));
}

export async function loadPlaceSeries(
  acNo: number
): Promise<PlaceSeries | null> {
  return fetchJson<PlaceSeries>(dataUrl(acNo, "history/place-series.json"));
}

export async function loadElection(
  acNo: number,
  year: number
): Promise<ElectionPackage | null> {
  return fetchJson<ElectionPackage>(
    dataUrl(acNo, `elections/${year}.json`)
  );
}

export async function loadElections(
  acNo: number,
  years: number[]
): Promise<Record<number, ElectionPackage>> {
  const entries = await Promise.all(
    years.map(async (y) => {
      const pkg = await loadElection(acNo, y);
      return [y, pkg] as const;
    })
  );
  const out: Record<number, ElectionPackage> = {};
  for (const [y, pkg] of entries) {
    if (pkg) out[y] = pkg;
  }
  return out;
}
