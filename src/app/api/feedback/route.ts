import { NextResponse } from "next/server";
import { z } from "zod";

import { feedbackSentiments, feedbackStatuses } from "@/lib/constants";
import { getAccessibleWorkspaceIds, requireUser, requireWorkspaceRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { FeedbackStatus, FeedbackSentiment } from "@prisma/client";

const createFeedbackSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(3).max(120),
  content: z.string().min(10),
  category: z.string().min(2).max(60),
  source: z.string().min(2).max(60),
  sentiment: z.enum(feedbackSentiments).default("NEUTRAL"),
  status: z.enum(feedbackStatuses).default("NEW"),
  priority: z.number().int().min(1).max(4).default(2),
  customer: z.string().max(80).optional()
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = searchParams.get("workspaceId") ?? undefined;
    const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(user.id);
    const scopedWorkspaceIds = requestedWorkspaceId
      ? accessibleWorkspaceIds.filter((workspaceId) => workspaceId === requestedWorkspaceId)
      : accessibleWorkspaceIds;

    if (scopedWorkspaceIds.length === 0) {
      return NextResponse.json({ feedback: [] });
    }

    const feedback = await prisma.feedbackItem.findMany({
      where: {
        workspaceId: {
          in: scopedWorkspaceIds
        }
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      take: 50
    });

    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const body = createFeedbackSchema.parse(await request.json());
    const { user } = await requireWorkspaceRole(body.workspaceId, "ANALYST");

    const feedback = await prisma.feedbackItem.create({
      data: {
        workspaceId: body.workspaceId,
        title: body.title,
        content: body.content,
        category: body.category,
        source: body.source,
        sentiment: body.sentiment as FeedbackSentiment,
        status: body.status as FeedbackStatus,
        priority: body.priority,
        customer: body.customer ?? null,
        createdById: user.id
      }
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
