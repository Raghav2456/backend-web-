import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { roles } from "@/lib/constants";
import { requireWorkspaceRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const createMemberSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(roles)
});

export async function GET(_: Request, context: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await context.params;
    await requireWorkspaceRole(workspaceId, "VIEWER");

    const memberships = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: true
      }
    });

    const members = memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      user: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        image: membership.user.image,
        globalRole: membership.user.globalRole
      }
    }));

    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await context.params;
    await requireWorkspaceRole(workspaceId, "ADMIN");
    const body = createMemberSchema.parse(await request.json());
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : undefined;

    const user = await prisma.user.upsert({
      where: { email: body.email.toLowerCase() },
      update: {
        name: body.name,
        globalRole: body.role as Role,
        ...(passwordHash ? { passwordHash } : {})
      },
      create: {
        name: body.name,
        email: body.email.toLowerCase(),
        globalRole: body.role as Role,
        passwordHash: passwordHash ?? ""
      }
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const membership = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id
        }
      },
      update: {
        role: body.role as Role
      },
      create: {
        workspaceId,
        userId: user.id,
        role: body.role as Role
      }
    });

    return NextResponse.json({
      member: {
        id: membership.id,
        user: { id: user.id, name: user.name, email: user.email },
        role: body.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
