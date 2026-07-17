import { NextResponse } from "next/server";
import { z } from "zod";

import { roles } from "@/lib/constants";
import { requireWorkspaceRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const updateMemberSchema = z.object({
  role: z.enum(roles)
});

export async function PATCH(request: Request, context: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  try {
    const { workspaceId, memberId } = await context.params;
    await requireWorkspaceRole(workspaceId, "ADMIN");
    const body = updateMemberSchema.parse(await request.json());

    const member = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: body.role as Role
      }
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ workspaceId: string; memberId: string }> }) {
  try {
    const { workspaceId, memberId } = await context.params;
    await requireWorkspaceRole(workspaceId, "ADMIN");

    const member = await prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId
      }
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
