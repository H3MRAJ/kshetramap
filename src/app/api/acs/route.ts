import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const dataRoot = path.join(process.cwd(), "public", "data");
  let dirs: string[] = [];
  try {
    dirs = (await readdir(dataRoot)).filter((d) => d.startsWith("ac-"));
  } catch {
    return NextResponse.json({ constituencies: [] });
  }

  const constituencies = [];
  for (const d of dirs) {
    try {
      const raw = await readFile(path.join(dataRoot, d, "meta.json"), "utf-8");
      const meta = JSON.parse(raw);
      constituencies.push({
        ac_no: meta.constituency.ac_no,
        name: meta.constituency.name,
        district: meta.constituency.district,
        booth_count: meta.constituency.booth_count,
        election: meta.election.name,
      });
    } catch {
      // skip incomplete AC folders
    }
  }

  constituencies.sort((a, b) => a.ac_no - b.ac_no);
  return NextResponse.json(
    { constituencies },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, immutable",
      },
    }
  );
}
