export type Role = "super_admin" | "admin" | "candidate" | "worker" | "viewer";

export const ROLES: Role[] = ["super_admin", "admin", "candidate", "worker", "viewer"];

/** super_admin always passes; otherwise the role must be in the route's explicit allow-list. */
export function roleAllowed(userRole: Role, allowed: Role[]): boolean {
  if (userRole === "super_admin") return true;
  return allowed.includes(userRole);
}

export function hasAcScope(acScope: number[] | undefined, acNo: number): boolean {
  return !!acScope && acScope.includes(acNo);
}
