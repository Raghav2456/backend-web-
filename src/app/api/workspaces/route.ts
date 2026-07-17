import { NextResponse } from "next/server";

import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: { feedbackItems: true }
            }
          }
        }
      },
      orderBy: {
        workspace: {
          name: "asc"
        }
      }
    });

    const payload = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      description: membership.workspace.description,
      role: membership.role,
      feedbackItems: membership.workspace._count.feedbackItems
    }));

    return NextResponse.json({ workspaces: payload });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
