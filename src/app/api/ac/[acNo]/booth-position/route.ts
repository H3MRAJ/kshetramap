import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Drag is NOT permanent.
 * This endpoint only appends a *request* for future admin review.
 * It does NOT patch booths.geojson, manual fixes, or Mongo authentic coords.
 */

type Body = {
  booth_no: number;
  lat: number;
  lng: number;
  from_lat?: number;
  from_lng?: number;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ acNo: string }> }
) {
  const { acNo } = await params;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const boothNo = Number(body.booth_no);
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const fromLat =
    body.from_lat != null ? Number(body.from_lat) : undefined;
  const fromLng =
    body.from_lng != null ? Number(body.from_lng) : undefined;

  if (
    !Number.isFinite(boothNo) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return NextResponse.json(
      { error: "Invalid booth/lat/lng" },
      { status: 400 }
    );
  }

  const request = {
    id: `${acNo}-${boothNo}-${Date.now()}`,
    ac_no: Number(acNo),
    booth_no: boothNo,
    from_lat: fromLat ?? null,
    from_lng: fromLng ?? null,
    to_lat: lat,
    to_lng: lng,
    created_at: new Date().toISOString(),
    admin_status: "pending_review" as const,
    note: "Personal map drag — not applied to authentic geometry",
  };

  // Append-only request queue (dev/server only; never touches public geojson)
  const dataDir = path.join(process.cwd(), "data");
  const queuePath = path.join(dataDir, `drag-requests-ac-${acNo}.json`);
  try {
    await mkdir(dataDir, { recursive: true });
    let list: unknown[] = [];
    try {
      list = JSON.parse(await readFile(queuePath, "utf-8")) as unknown[];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
    list.push(request);
    // Cap file growth
    if (list.length > 2000) list = list.slice(-2000);
    await writeFile(queuePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write drag request queue", e);
    return NextResponse.json(
      {
        ok: false,
        permanent: false,
        error: "Could not queue request (map data unchanged)",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    permanent: false,
    applied_to_geojson: false,
    applied_to_mongo: false,
    admin_status: "pending_review",
    request,
    message:
      "Queued for admin review only. Public map / authentic coords not modified.",
  });
}
