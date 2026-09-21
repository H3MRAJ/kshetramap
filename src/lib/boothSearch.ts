import type { BoothProps, PlaceProps } from "./types";

export type BoothSearchHit = {
  booth: BoothProps;
  score: number;
  matchedOn: string[];
  /** Short human reason for ranking */
  why?: string;
};

export type PlaceSearchHit = {
  place: PlaceProps & { lat: number; lng: number };
  score: number;
};

/** Common Hindi/ITRANS OCR noise → search-friendly Latin. */
const ALIASES: Record<string, string[]> = {
  school: ["vidyalaya", "vidhalaya", "pathshala", "primary", "middle", "high"],
  primary: ["prathmik", "prathamik", "prathimaka", "praathamika"],
  middle: ["madhya", "utkramita", "utkranita", "utkaramita"],
  panchayat: ["panchayat", "paMchayata", "panchayati"],
  anganwadi: ["anganwadi", "aanganbadi", "anganbadi"],
  mokama: ["mokameh", "mokamah", "mokama"],
  raili: ["raili", "reli", "rail"],
  pandarak: ["pandarak", "pandarakh", "pundarak"],
  hathidah: ["hathidah", "hathida", "htz"],
  maranchi: ["maranchi", "marachi", "maraNchi"],
  lemuabad: ["lemuabad", "lemuabada", "lemuaba"],
  ghoswari: ["ghoswari", "ghosavari", "goswari"],
  ntpc: ["ntpc", "n.t.p.c", "en tee pee see"],
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    // keep Devanagari for partial HI search
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Expand query tokens with known aliases (one hop). */
function expandToken(t: string): string[] {
  const out = new Set<string>([t]);
  for (const [canon, alts] of Object.entries(ALIASES)) {
    if (t === canon || alts.includes(t)) {
      out.add(canon);
      for (const a of alts) out.add(a);
    }
  }
  return [...out];
}

/** Cheap fuzzy: edit distance ≤1 for short tokens, prefix for longer. */
function tokenInText(token: string, text: string): boolean {
  if (!token || !text) return false;
  if (text.includes(token)) return true;
  if (token.length >= 4) {
    // prefix of a word in text
    const words = text.split(" ");
    if (words.some((w) => w.startsWith(token) || token.startsWith(w) && w.length >= 4)) {
      return true;
    }
  }
  // single-char typo for tokens 5+
  if (token.length >= 5) {
    const words = text.split(" ");
    for (const w of words) {
      if (Math.abs(w.length - token.length) > 1) continue;
      if (editDistanceAtMost1(token, w)) return true;
    }
  }
  return false;
}

function editDistanceAtMost1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
}

/** Fields used for location search (English + roll OCR). */
export function boothSearchBlob(b: BoothProps): { field: string; text: string; weight: number }[] {
  const pairs: { field: string; text: string; weight: number }[] = [];
  const add = (field: string, v?: string | number | null, weight = 1) => {
    if (v != null && String(v).trim()) {
      pairs.push({ field, text: String(v).trim(), weight });
    }
  };
  add("booth", String(b.booth_no), 3);
  add("station", b.ps_name, 4); // roll PS name — deepest identity
  add("address", b.ps_address, 3);
  add("village", b.village, 3);
  add("place", b.nearest_place, 3);
  add("map_ps", b.nearest_ps, 2);
  add("tehsil", b.tehsil, 2);
  add("pin", b.pin, 4);
  add("post", b.post_office, 2);
  add("police", b.police_station_roll, 2);
  add("name", b.name, 1);
  add("winner", b.winner_name, 1);
  add("party", b.winner_party, 1);
  if (b.district) add("district", b.district, 1);
  return pairs;
}

/**
 * Search booths by location / PS / village / PIN / free text.
 * Empty query → no filter (caller treats as "all").
 */
export function searchBoothsByLocation(
  booths: BoothProps[],
  query: string,
  limit = 80
): BoothSearchHit[] {
  const raw = query.trim();
  const q = norm(raw);
  if (!q) return [];

  const tokens = q.split(" ").filter(Boolean);
  const expanded = tokens.flatMap(expandToken);
  const hits: BoothSearchHit[] = [];

  // Pure PIN: full 6-digit or first 3+
  const pinFull = /^\d{6}$/.test(q);
  const pinPrefix = /^\d{3,6}$/.test(q);

  for (const booth of booths) {
    const fields = boothSearchBlob(booth);
    const fieldNorm = fields.map((f) => ({
      ...f,
      nt: norm(f.text),
    }));
    const blob = fieldNorm.map((f) => f.nt).join(" ");
    const withNo = `${blob} booth ${booth.booth_no}`;

    let score = 0;
    const matchedOn: string[] = [];
    const whyParts: string[] = [];

    // Exact booth number
    if (/^\d{1,3}$/.test(q) && booth.booth_no === Number(q)) {
      score += 120;
      matchedOn.push("booth_no");
      whyParts.push(`booth #${booth.booth_no}`);
    }

    // PIN exact / prefix
    if (booth.pin) {
      const pin = String(booth.pin);
      if (pinFull && pin === q) {
        score += 90;
        matchedOn.push("pin");
        whyParts.push(`PIN ${pin}`);
      } else if (pinPrefix && pin.startsWith(q)) {
        score += 55;
        matchedOn.push("pin");
        whyParts.push(`PIN ${pin}`);
      }
    }

    // Per-field scoring
    for (const { field, nt, weight } of fieldNorm) {
      if (!nt) continue;
      if (nt === q) {
        score += 55 * weight;
        if (!matchedOn.includes(field)) matchedOn.push(field);
        whyParts.push(field);
      } else if (nt.startsWith(q)) {
        score += 30 * weight;
        if (!matchedOn.includes(field)) matchedOn.push(field);
      } else if (nt.includes(q) || ` ${nt} `.includes(` ${q} `)) {
        score += 18 * weight;
        if (!matchedOn.includes(field)) matchedOn.push(field);
      }
    }

    // Multi-token: all tokens (or alias) must appear somewhere
    let tokenHits = 0;
    for (const t of tokens) {
      const alts = expandToken(t);
      const ok = alts.some((a) => tokenInText(a, withNo));
      if (ok) {
        tokenHits++;
        score += 8;
      }
    }
    if (tokens.length > 1 && tokenHits === tokens.length) {
      score += 25; // phrase bonus
      whyParts.push("all words");
    } else if (tokens.length > 1 && tokenHits < tokens.length && score < 40) {
      // require majority for multi-word weak matches
      if (tokenHits < Math.ceil(tokens.length * 0.6)) {
        continue;
      }
    }

    // Expanded alias soft match when base score low
    if (score < 15) {
      let aliasHits = 0;
      for (const t of expanded) {
        if (tokenInText(t, withNo)) aliasHits++;
      }
      if (aliasHits >= Math.min(2, expanded.length) && aliasHits > 0) {
        score += aliasHits * 4;
        matchedOn.push("alias");
      }
    }

    if (score <= 0) continue;

    // Prefer roll-enriched booths slightly
    if (booth.ps_name) score += 2;

    hits.push({
      booth,
      score,
      matchedOn: matchedOn.slice(0, 6),
      why: whyParts.slice(0, 3).join(" · ") || matchedOn.slice(0, 2).join(", "),
    });
  }

  hits.sort((a, b) => b.score - a.score || a.booth.booth_no - b.booth.booth_no);
  return hits.slice(0, limit);
}

/** Search real places / landmarks (OSM, GCPs, place centroids). */
export function searchPlaces(
  places: (PlaceProps & { lat: number; lng: number })[],
  query: string,
  limit = 16
): PlaceSearchHit[] {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  const hits: PlaceSearchHit[] = [];

  for (const place of places) {
    const nt = norm(place.name);
    if (!nt) continue;
    let score = 0;
    if (nt === q) score = 100;
    else if (nt.startsWith(q) || nt.includes(` ${q}`) || nt.includes(q)) score = 45;
    else if (q.length >= 4 && nt.includes(q)) score = 38;
    else if (q.includes(nt) && nt.length >= 5) score = 28;
    else {
      // multi-token place
      const th = tokens.filter((t) => tokenInText(t, nt)).length;
      if (tokens.length && th === tokens.length) score = 40;
      else if (th >= 1 && tokens.length === 1) score = 20;
    }
    if (score === 0) continue;
    if (place.kind !== "booth_place") score += 15;
    if (place.kind === "railway" || place.kind === "town") score += 10;
    if (place.booth_count && place.booth_count >= 5) score += 5;
    hits.push({ place, score });
  }

  hits.sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name));
  return hits.slice(0, limit);
}

/**
 * Resolve location query → booth numbers, preferring real-place radius
 * when a landmark matches (e.g. "Mokama" → booths near Mokama Jn / town).
 */
export function resolveLocationFilter(
  booths: BoothProps[],
  places: (PlaceProps & { lat: number; lng: number })[],
  query: string,
  limit = 250
): { boothNos: number[]; placeHits: PlaceSearchHit[]; boothHits: BoothSearchHit[] } {
  const q = query.trim();
  if (!q) return { boothNos: [], placeHits: [], boothHits: [] };

  const placeHits = searchPlaces(places, q, 12);
  const boothHits = searchBoothsByLocation(booths, q, limit);
  const nos = new Set<number>();

  const realPlaceHits = placeHits.filter((h) => h.place.kind !== "booth_place");
  if (realPlaceHits.length > 0) {
    for (const { place } of realPlaceHits) {
      for (const n of place.booth_nos ?? []) nos.add(n);
    }
  }

  for (const h of boothHits) nos.add(h.booth.booth_no);

  if (nos.size === 0 && placeHits.length > 0) {
    for (const { place } of placeHits) {
      for (const n of place.booth_nos ?? []) nos.add(n);
    }
  }

  // Spatial: if a strong place hit exists but few booth_nos, collect booths within ~2.5 km
  if (realPlaceHits.length > 0 && nos.size < 3) {
    const top = realPlaceHits[0].place;
    const R = 2500; // metres
    for (const b of booths) {
      if (haversineM(top.lat, top.lng, b.lat, b.lng) <= R) nos.add(b.booth_no);
    }
  }

  return {
    boothNos: [...nos].sort((a, b) => a - b),
    placeHits,
    boothHits,
  };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Unique place suggestions for autocomplete chips. */
export function locationSuggestions(
  booths: BoothProps[],
  places?: (PlaceProps & { lat: number; lng: number })[],
  max = 28
): string[] {
  const counts = new Map<string, number>();

  if (places) {
    for (const p of places) {
      if (p.kind === "booth_place") continue;
      const k = p.name.replace(/\s*\(MKA\)|\s*\(HTZ\)/gi, "").trim();
      counts.set(k, (counts.get(k) || 0) + 50 + (p.booth_count || 0));
    }
  }

  for (const b of booths) {
    for (const key of [
      b.nearest_place,
      b.village,
      b.nearest_ps,
      b.tehsil,
      b.pin,
    ] as const) {
      if (!key?.trim()) continue;
      const k = key.trim();
      // skip weak OCR garbage
      if (k.length < 3) continue;
      if (/^2\s*-/.test(k)) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    // school keywords from PS name (first meaningful chunk)
    if (b.ps_name && b.ps_name.length > 12 && !/^school$/i.test(b.ps_name.trim())) {
      const short = b.ps_name.replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (short.length >= 8 && short.length <= 40) {
        counts.set(short, (counts.get(short) || 0) + 0.5);
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([k]) => k);
}
