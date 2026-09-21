import { readdir, readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { DashboardConstituencies } from "./DashboardConstituencies";

/**
 * All AC numbers that actually exist (mirrors `/api/acs/route.ts`'s own
 * `public/data/ac-*` discovery). `super_admin` bypasses `ac_scope` checks
 * everywhere else in the app, but an empty `ac_scope` array (the seed
 * script never populates one) meant the dashboard had no AC list to show
 * a super_admin at all — this discovers every real AC instead of relying
 * on a scope field that's intentionally irrelevant for this role.
 */
async function discoverAllAcNumbers(): Promise<number[]> {
  const dataRoot = path.join(process.cwd(), "public", "data");
  let dirs: string[] = [];
  try {
    dirs = (await readdir(dataRoot)).filter((d) => d.startsWith("ac-"));
  } catch {
    return [];
  }
  const acNos: number[] = [];
  for (const d of dirs) {
    try {
      const raw = await readFile(path.join(dataRoot, d, "meta.json"), "utf-8");
      const meta = JSON.parse(raw);
      const acNo = meta?.constituency?.ac_no;
      if (typeof acNo === "number") acNos.push(acNo);
    } catch {
      // skip incomplete AC folders
    }
  }
  return acNos.sort((a, b) => a - b);
}

export default async function AppDashboardPage() {
  const session = await auth();
  const user = session!.user;

  const constituencyAcNos =
    user.role === "super_admin" ? await discoverAllAcNumbers() : user.ac_scope;
  const showConstituencies =
    (user.role === "admin" || user.role === "super_admin") &&
    constituencyAcNos.length > 0;

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Welcome, {user.name} — role: {user.role}
        {user.ac_scope.length > 0 && ` — AC scope: ${user.ac_scope.join(", ")}`}
      </p>
      {showConstituencies && <DashboardConstituencies acScope={constituencyAcNos} />}
    </div>
  );
}
