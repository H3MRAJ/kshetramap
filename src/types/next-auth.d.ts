import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    phone: string;
    role: Role;
    ac_scope: number[];
    candidate_id: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      phone: string;
      role: Role;
      ac_scope: number[];
      candidate_id: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    ac_scope: number[];
    candidate_id: string | null;
    phone: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    ac_scope: number[];
    candidate_id: string | null;
    phone: string;
  }
}
