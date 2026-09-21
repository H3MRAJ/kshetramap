import { NextResponse } from "next/server";
import { requireApiSession, apiError } from "@/lib/api/session";
import { updateUserSchema } from "@/lib/api/validation";
import { updateUser } from "@/lib/users/usersRepo";
import { logAudit, diffFields } from "@/lib/audit/logAudit";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession(["super_admin"]);
  if ("error" in result) return result.error;
  const { session } = result;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid_input", parsed.error.issues.map((i) => i.message).join("; "));
  }

  if (
    id === session.user.id &&
    ((parsed.data.role !== undefined && parsed.data.role !== "super_admin") ||
      parsed.data.active === false)
  ) {
    return apiError(
      400,
      "cannot_self_lockout",
      "You cannot change your own role away from super_admin or deactivate your own account"
    );
  }

  const updated = await updateUser(id, parsed.data);
  if (!updated) return apiError(404, "not_found", "User not found");

  // Never let a plaintext password value flow into the audit diff: diffFields'
  // ALWAYS_OMIT list only strips the stored `password_hash` field, not this
  // API's raw `password` input field, so it must be excluded here explicitly.
  const { password: _password, ...diffInput } = parsed.data;
  const diff = diffFields(updated.before, diffInput);

  await logAudit({
    actorId: session.user.id,
    actorRole: session.user.role,
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
    action: "user.update",
    entity: "users",
    entityId: id,
    summary: `Updated user '${updated.after.name}'`,
    diff,
  });

  const { password_hash: _password_hash, ...publicUser } = updated.after;
  return NextResponse.json({ user: publicUser });
}
