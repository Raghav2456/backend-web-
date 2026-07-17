import type { DefaultSession } from "next-auth";

import type { Role } from "@/lib/constants";

type SessionWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: Role;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      workspaces: SessionWorkspace[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    workspaces?: SessionWorkspace[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    workspaces?: SessionWorkspace[];
  }
}
