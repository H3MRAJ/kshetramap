import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/session";

export async function GET() {
  const result = await requireApiSession();
  if ("error" in result) return result.error;
  return NextResponse.json({ user: result.session.user });
}
