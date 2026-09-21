import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/session";
import { getDb } from "@/lib/db/mongo";

export async function GET(request: Request) {
  const result = await requireApiSession(["super_admin"]);
  if ("error" in result) return result.error;

  const url = new URL(request.url);
  const actor = url.searchParams.get("actor");
  const entity = url.searchParams.get("entity");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const q = url.searchParams.get("q");

  const filter: Record<string, unknown> = {};
  if (actor) filter.actor_id = actor;
  if (entity) filter.entity = entity;
  if (from || to) {
    const ts: Record<string, Date> = {};
    if (from) ts.$gte = new Date(from);
    if (to) ts.$lte = new Date(to);
    filter.ts = ts;
  }
  if (q) filter.summary = { $regex: q, $options: "i" };

  const db = await getDb();
  const entries = await db
    .collection("audit_log")
    .find(filter)
    .sort({ ts: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    entries: entries.map((e) => ({ ...e, _id: e._id.toString() })),
  });
}
