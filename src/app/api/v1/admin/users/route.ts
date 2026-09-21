import { NextResponse } from "next/server";
import { requireApiSession, apiError } from "@/lib/api/session";
import { createUserSchema } from "@/lib/api/validation";
import { createUser, findUserByPhone, listUsers, toPublicUser } from "@/lib/users/usersRepo";
import { logAudit } from "@/lib/audit/logAudit";

export async function GET() {
  const result = await requireApiSession(["super_admin"]);
  if ("error" in result) return result.error;
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const result = await requireApiSession(["super_admin"]);
  if ("error" in result) return result.error;
  const { session } = result;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid_input", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const existing = await findUserByPhone(parsed.data.phone);
  if (existing) {
    return apiError(409, "phone_taken", "A user with this phone number already exists");
  }

  const user = await createUser({ ...parsed.data, createdBy: session.user.id });

  // toPublicUser already strips password_hash; that's also what backs the
  // create audit entry's `after` diff, so a created user's diff can never
  // contain the hash (or the raw plaintext password, which was never part
  // of the stored/returned user document to begin with).
  const publicUser = toPublicUser(user);

  await logAudit({
    actorId: session.user.id,
    actorRole: session.user.role,
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
    action: "user.create",
    entity: "users",
    entityId: user._id.toString(),
    summary: `Created user '${user.name}' (${user.phone}, role ${user.role})`,
    diff: { before: {}, after: publicUser },
  });

  return NextResponse.json({ user: publicUser }, { status: 201 });
}
