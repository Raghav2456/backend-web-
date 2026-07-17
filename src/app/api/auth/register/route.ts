import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(2).max(80).optional()
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const workspaceName = body.workspaceName ?? `${body.name}'s Workspace`;
    const baseSlug = slugify(workspaceName);
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await bcrypt.hash(body.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          passwordHash,
          globalRole: Role.ADMIN
        }
      });

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          description: "Workspace created during registration."
        }
      });

      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: Role.ADMIN
        }
      });

      return { user, workspace, membership };
    });

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          globalRole: result.user.globalRole,
          workspaces: [{
            id: result.workspace.id,
            name: result.workspace.name,
            slug: result.workspace.slug,
            role: "ADMIN"
          }]
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to register user." }, { status: 500 });
  }
}
