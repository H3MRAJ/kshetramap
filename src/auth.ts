import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db/mongo";
import { verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit/logAudit";
import type { Role } from "@/lib/auth/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const phone = typeof credentials?.phone === "string" ? credentials.phone.trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        // NOTE: x-forwarded-for is attacker-controlled in this dev/no-Docker Phase A setup —
        // any unproxied client can set it directly. Not authoritative until a reverse proxy
        // (deploy day / RUNBOOK, later phase) strips and re-sets it before it reaches this app.
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";

        if (!phone || !password) return null;

        const db = await getDb();
        const user = await db.collection("users").findOne({ phone });

        if (!user || user.active === false) {
          await logAudit({
            actorId: null,
            actorRole: "unknown",
            ip,
            action: "auth.fail",
            entity: "auth",
            entityId: phone,
            summary: `Failed login attempt for phone ${phone} (no such active user)`,
          });
          return null;
        }

        const ok = await verifyPassword(password, user.password_hash as string);
        if (!ok) {
          await logAudit({
            actorId: user._id.toString(),
            actorRole: user.role as Role,
            ip,
            action: "auth.fail",
            entity: "auth",
            entityId: phone,
            summary: `Failed login attempt for phone ${phone} (bad password)`,
          });
          return null;
        }

        await db
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });

        await logAudit({
          actorId: user._id.toString(),
          actorRole: user.role as Role,
          ip,
          action: "auth.login",
          entity: "auth",
          entityId: user._id.toString(),
          summary: `${user.name} (${user.role}) logged in`,
        });

        return {
          id: user._id.toString(),
          name: user.name as string,
          phone: user.phone as string,
          role: user.role as Role,
          ac_scope: (user.ac_scope as number[] | undefined) ?? [],
          candidate_id: user.candidate_id ? String(user.candidate_id) : null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.ac_scope = user.ac_scope;
        token.candidate_id = user.candidate_id;
        token.phone = user.phone;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.role = token.role;
      session.user.ac_scope = token.ac_scope;
      session.user.candidate_id = token.candidate_id;
      session.user.phone = token.phone;
      return session;
    },
  },
});
