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
      /** Database UUID of the authenticated user */
      id: string;
      /** Global (platform-level) role */
      role: Role;
      /**
       * The user's primary (first) workspace ID.
       * Set to the first membership returned at login.
       * Use session.user.workspaces for the full list.
       */
      workspaceId: string | null;
      /** All workspaces the user belongs to with their per-workspace role */
      workspaces: SessionWorkspace[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    workspaceId?: string | null;
    workspaces?: SessionWorkspace[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    workspaceId?: string | null;
    workspaces?: SessionWorkspace[];
  }
}
