import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/lib/auth/roles";

export type UserDoc = {
  _id: ObjectId;
  name: string;
  phone: string;
  email?: string;
  password_hash: string;
  role: Role;
  ac_scope: number[];
  candidate_id: ObjectId | null;
  active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: ObjectId | null;
};

export type PublicUser = Omit<UserDoc, "password_hash">;

export function toPublicUser(u: UserDoc): PublicUser {
  const { password_hash: _password_hash, ...rest } = u;
  return rest;
}

export async function ensureUserIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection("users").createIndex({ phone: 1 }, { unique: true });
}

export async function listUsers(): Promise<PublicUser[]> {
  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({})
    .sort({ created_at: -1 })
    .toArray();
  return users.map(toPublicUser);
}

export async function findUserByPhone(phone: string): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ phone });
}

export async function findUserById(id: string): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ _id: new ObjectId(id) });
}

export async function createUser(input: {
  name: string;
  phone: string;
  password: string;
  role: Role;
  ac_scope: number[];
  email?: string;
  createdBy: string | null;
}): Promise<UserDoc> {
  const db = await getDb();
  const now = new Date();
  const doc: UserDoc = {
    _id: new ObjectId(),
    name: input.name,
    phone: input.phone,
    email: input.email,
    password_hash: await hashPassword(input.password),
    role: input.role,
    ac_scope: input.ac_scope,
    candidate_id: null,
    active: true,
    last_login_at: null,
    created_at: now,
    updated_at: now,
    created_by: input.createdBy ? new ObjectId(input.createdBy) : null,
  };
  await db.collection<UserDoc>("users").insertOne(doc);
  return doc;
}

export async function updateUser(
  id: string,
  patch: Partial<{
    name: string;
    role: Role;
    ac_scope: number[];
    active: boolean;
    password: string;
  }>
): Promise<{ before: UserDoc; after: UserDoc } | null> {
  const db = await getDb();
  const _id = new ObjectId(id);
  const before = await db.collection<UserDoc>("users").findOne({ _id });
  if (!before) return null;

  const set: Record<string, unknown> = { updated_at: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.role !== undefined) set.role = patch.role;
  if (patch.ac_scope !== undefined) set.ac_scope = patch.ac_scope;
  if (patch.active !== undefined) set.active = patch.active;
  if (patch.password !== undefined) set.password_hash = await hashPassword(patch.password);

  await db.collection<UserDoc>("users").updateOne({ _id }, { $set: set });
  const after = await db.collection<UserDoc>("users").findOne({ _id });
  return { before, after: after as UserDoc };
}

export async function upsertSuperAdmin(input: {
  name: string;
  phone: string;
  password: string;
}): Promise<UserDoc> {
  const db = await getDb();
  const now = new Date();
  const existing = await db.collection<UserDoc>("users").findOne({ phone: input.phone });
  const password_hash = await hashPassword(input.password);

  if (existing) {
    await db.collection<UserDoc>("users").updateOne(
      { _id: existing._id },
      { $set: { name: input.name, password_hash, role: "super_admin", active: true, updated_at: now } }
    );
    return { ...existing, name: input.name, password_hash, role: "super_admin", active: true, updated_at: now };
  }

  const doc: UserDoc = {
    _id: new ObjectId(),
    name: input.name,
    phone: input.phone,
    password_hash,
    role: "super_admin",
    ac_scope: [],
    candidate_id: null,
    active: true,
    last_login_at: null,
    created_at: now,
    updated_at: now,
    created_by: null,
  };
  await db.collection<UserDoc>("users").insertOne(doc);
  return doc;
}
