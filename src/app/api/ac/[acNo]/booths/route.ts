import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ acNo: string }> }
) {
  const { acNo } = await params;
  const dir = path.join(process.cwd(), "public", "data", `ac-${acNo}`);
  try {
    const [booths, meta] = await Promise.all([
      readFile(path.join(dir, "booths.geojson"), "utf-8"),
      readFile(path.join(dir, "meta.json"), "utf-8"),
    ]);
    return NextResponse.json(
      {
        meta: JSON.parse(meta),
        booths: JSON.parse(booths),
      },
      {
        headers: {
          // Election data is immutable
          "Cache-Control": "public, max-age=86400, immutable",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "AC not found" }, { status: 404 });
  }
}
