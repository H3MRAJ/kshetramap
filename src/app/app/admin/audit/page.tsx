import { requirePageSession } from "@/lib/api/session";
import { getDb } from "@/lib/db/mongo";
import { AuditClient } from "./AuditClient";

export default async function AdminAuditPage() {
  await requirePageSession(["super_admin"]);

  const db = await getDb();
  const entries = await db.collection("audit_log").find({}).sort({ ts: -1 }).limit(200).toArray();

  return (
    <AuditClient
      initialEntries={entries.map((e) => ({
        _id: e._id.toString(),
        ts: (e.ts as Date).toISOString(),
        actor_id: e.actor_id ?? null,
        actor_role: e.actor_role,
        action: e.action,
        entity: e.entity,
        entity_id: e.entity_id,
        summary: e.summary,
        // diff.before/after can hold any entity's fields (and future phases add
        // more entity types), so its shape isn't fixed like the fields above —
        // a JSON round-trip is the reliable way to strip any Mongo-native types
        // (ObjectId, Date) a stored diff snapshot might contain before it
        // crosses the server/client boundary.
        diff: e.diff ? (JSON.parse(JSON.stringify(e.diff)) as { before: Record<string, unknown>; after: Record<string, unknown> }) : undefined,
      }))}
    />
  );
}
