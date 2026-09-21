import { requirePageSession } from "@/lib/api/session";
import { listUsers } from "@/lib/users/usersRepo";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  await requirePageSession(["super_admin"]);

  const users = await listUsers();
  return (
    <UsersClient
      initialUsers={users.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        role: u.role,
        ac_scope: u.ac_scope,
        active: u.active,
      }))}
    />
  );
}
