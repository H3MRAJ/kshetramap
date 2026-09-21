/**
 * Mappls Web JS SDK loader + in-browser geocoder (static web-app key).
 * Loud logging so failures are visible in devtools.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const L = (...a: any[]) => console.log("[mappls]", ...a);

let sdkPromise: Promise<any> | null = null;

function addScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    // reuse if already added
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      L("script loaded:", src);
      resolve(true);
    };
    s.onerror = () => {
      L("script FAILED:", src);
      resolve(false);
    };
    document.body.appendChild(s);
  });
}

function getGlobal(): any {
  const w = window as any;
  return w.mappls || w.Mappls || w.MapmyIndia || null;
}

/** Load map_sdk + plugins; resolve with the mappls global (or null). */
export function loadMapplsSdk(key: string): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = getGlobal();
  if (existing?.geocode || existing?.search) return Promise.resolve(existing);
  if (sdkPromise) return sdkPromise;

  sdkPromise = (async () => {
    const base = `https://apis.mappls.com/advancedmaps/api/${key}`;
    L("loading SDK for key ending", key.slice(-4));
    await addScript(`${base}/map_sdk?layer=vector&v=3.0`);
    await addScript(`${base}/map_sdk_plugins?v=3.0`);
    // plugins may attach a tick after onload
    await new Promise((r) => setTimeout(r, 400));
    const g = getGlobal();
    L("global present:", !!g, g ? "methods:" : "", g ? Object.keys(g).slice(0, 40) : "");
    return g;
  })();
  return sdkPromise;
}

export type GeoResult =
  | { lat: number; lng: number }
  | { error: string };

function readLatLng(r: any): { lat: number; lng: number } | null {
  if (!r || typeof r !== "object") return null;
  const lat = Number(r.latitude ?? r.lat ?? r.y);
  const lng = Number(r.longitude ?? r.lng ?? r.x);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Geocode an address in-browser. Returns {lat,lng} or {error}. */
export async function geocodeMappls(key: string, address: string): Promise<GeoResult> {
  L("geocode request:", address);
  if (!key) return { error: "no key (NEXT_PUBLIC_MAPPLS_KEY)" };
  const mappls = await loadMapplsSdk(key);
  if (!mappls) return { error: "SDK did not load — check network/CSP/key" };
  if (typeof mappls.geocode !== "function") {
    L("no geocode(); available:", Object.keys(mappls));
    return { error: "SDK loaded but no geocode() — see console for methods" };
  }

  return new Promise<GeoResult>((resolve) => {
    let settled = false;
    const done = (v: GeoResult) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    setTimeout(() => done({ error: "timeout (no callback in 10s)" }), 10000);

    try {
      mappls.geocode({ address, region: "IND", itemCount: 1 }, (data: any) => {
        L("geocode response:", data);
        const cop = data?.copResults ?? data?.results ?? data;
        const r = Array.isArray(cop) ? cop[0] : cop;
        const direct = readLatLng(r);
        if (direct) return done(direct);

        const eloc = r?.eLoc ?? r?.eloc;
        if (eloc && typeof mappls.getPinDetails === "function") {
          mappls.getPinDetails({ pin: eloc }, (pd: any) => {
            L("getPinDetails response:", pd);
            const p = Array.isArray(pd) ? pd[0] : pd?.results?.[0] ?? pd?.data ?? pd;
            const c = readLatLng(p);
            done(c ?? { error: "eLoc found but no coords in getPinDetails" });
          });
        } else {
          done({ error: eloc ? "eLoc found but no getPinDetails()" : "no result for address" });
        }
      });
    } catch (e: any) {
      done({ error: `geocode threw: ${e?.message ?? e}` });
    }
  });
}
