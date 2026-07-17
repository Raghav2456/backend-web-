import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3
};

export function canAccessRole(actual: Role, required: Role) {
  return roleRank[actual] >= roleRank[required];
}

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }

  return session.user;
}

export async function requireGlobalRole(requiredRole: Role) {
  const user = await requireUser();

  if (!canAccessRole(user.role, requiredRole)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function requireWorkspaceRole(workspaceId: string, requiredRole: Role) {
  const user = await requireUser();

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id
      }
    }
  });

  if (!membership || !canAccessRole(membership.role as Role, requiredRole)) {
    throw new Error("FORBIDDEN");
  }

  return { user, membership };
}

export async function getAccessibleWorkspaceIds(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true }
  });

  return memberships.map((m) => m.workspaceId);
}
