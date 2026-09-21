import { getDb } from "@/lib/db/mongo";
import type { Role } from "@/lib/auth/roles";

export async function logAudit(entry: {
  actorId: string | null;
  actorRole: Role | "unknown";
  ip: string;
  action: string;
  entity: string;
  entityId: string;
  acNo?: number;
  summary: string;
  diff?: { before: Record<string, unknown>; after: Record<string, unknown> };
}): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("audit_log").insertOne({
      ts: new Date(),
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      ip: entry.ip,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      ac_no: entry.acNo,
      summary: entry.summary,
      diff: entry.diff,
    });
  } catch (err) {
    // A failed audit write must never turn an already-successful mutation
    // into a client-visible 500 — log loudly and swallow instead of
    // rethrowing. Include enough identifiers to trace the missing entry.
    console.error(
      `[AUDIT LOG WRITE FAILED] action=${entry.action} entity=${entry.entity} entityId=${entry.entityId} actorId=${entry.actorId ?? "null"}`,
      err
    );
  }
}

const ALWAYS_OMIT = ["password_hash"];

export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): { before: Record<string, unknown>; after: Record<string, unknown> } | undefined {
  const beforeOut: Record<string, unknown> = {};
  const afterOut: Record<string, unknown> = {};
  let changed = false;

  for (const key of Object.keys(after)) {
    if (ALWAYS_OMIT.includes(key)) continue;
    const beforeVal = before[key];
    const afterVal = after[key as keyof T];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      beforeOut[key] = beforeVal;
      afterOut[key] = afterVal;
      changed = true;
    }
  }

  return changed ? { before: beforeOut, after: afterOut } : undefined;
}
