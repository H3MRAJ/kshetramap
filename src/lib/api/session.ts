import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleAllowed, hasAcScope, type Role } from "@/lib/auth/roles";
import type { Session } from "next-auth";

export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Checks session + role, and — when `acNo` is provided — AC-scope too.
 * `acNo` is the numeric AC a route is acting on; when given, a session must
 * (in addition to passing the role check) either be `super_admin` or have
 * `acNo` in its `ac_scope` to proceed. `super_admin` bypasses this the same
 * way it bypasses `roleAllowed`'s allow-list — the "super_admin always
 * passes every check" principle established for role checks extends
 * identically to AC scope. Existing call sites that never pass `acNo` are
 * unaffected: the scope check only runs when `acNo !== undefined`.
 */
export async function requireApiSession(
  allowed?: Role[],
  acNo?: number
): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return { error: apiError(401, "unauthenticated", "Login required") };
  }
  if (allowed && !roleAllowed(session.user.role, allowed)) {
    return { error: apiError(403, "forbidden", "Insufficient role for this action") };
  }
  if (
    acNo !== undefined &&
    session.user.role !== "super_admin" &&
    !hasAcScope(session.user.ac_scope, acNo)
  ) {
    return { error: apiError(403, "forbidden", "This AC is outside your assigned scope") };
  }
  return { session };
}

/**
 * Scope-only half of `requireApiSession`'s AC check, split out so a caller
 * can authenticate (session + role, via `requireApiSession(allowed)` with NO
 * `acNo`) FIRST — before it even knows whether its `ac` URL param parses to
 * a valid number — and only apply the AC-scope check once `acNo` is known to
 * be a valid number. Exists so a route whose `ac` param needs its own 400
 * validation can still guarantee "auth first": an unauthenticated (or
 * wrong-role) caller always gets 401/403, never a 400 that leaks ahead of
 * the auth check just because their `ac` param happened not to parse
 * (finding 9, Phase B final-review fix wave — see `acs/[ac]/profile/route.ts`
 * and `acs/[ac]/dossier/route.ts`). Same "super_admin bypasses" rule as
 * `requireApiSession`'s inline scope check.
 */
export function checkAcScope(session: Session, acNo: number): NextResponse | null {
  if (session.user.role !== "super_admin" && !hasAcScope(session.user.ac_scope, acNo)) {
    return apiError(403, "forbidden", "This AC is outside your assigned scope");
  }
  return null;
}

/**
 * Page-level counterpart to `requireApiSession`. Either returns a valid,
 * authorized session, or redirects (throwing) and never returns:
 * no session at all -> `/login`; a session with a role not in `allowed`,
 * or (when `acNo` is given) a non-`super_admin` session whose `ac_scope`
 * doesn't include `acNo`, -> `/app`. Mirrors `requireApiSession`'s AC-scope
 * extension exactly: the scope check only runs when `acNo !== undefined`,
 * so existing callers that never pass it are unaffected.
 */
export async function requirePageSession(allowed?: Role[], acNo?: number): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (allowed && !roleAllowed(session.user.role, allowed)) {
    redirect("/app");
  }
  if (
    acNo !== undefined &&
    session.user.role !== "super_admin" &&
    !hasAcScope(session.user.ac_scope, acNo)
  ) {
    redirect("/app");
  }
  return session;
}
