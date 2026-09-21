import { getClient } from "../src/lib/db/mongo";
import { ensureUserIndexes, upsertSuperAdmin } from "../src/lib/users/usersRepo";

async function main() {
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!phone || !password) {
    console.error("SEED_ADMIN_PHONE and SEED_ADMIN_PASSWORD must be set (see web/.env.local)");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("SEED_ADMIN_PASSWORD must be at least 8 characters");
    process.exit(1);
  }

  await ensureUserIndexes();

  const audit = (await import("../src/lib/db/mongo")).getDb();
  const db = await audit;
  await db.collection("audit_log").createIndex({ ts: -1 });
  await db.collection("audit_log").createIndex({ actor_id: 1, ts: -1 });
  await db.collection("audit_log").createIndex({ entity: 1, entity_id: 1 });

  const user = await upsertSuperAdmin({ name: "Super Admin", phone, password });
  console.log(`OK — super_admin ready: ${user.name} (${user.phone}), _id=${user._id.toString()}`);

  const client = await getClient();
  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
