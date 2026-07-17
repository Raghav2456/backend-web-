import { PrismaClient, Role, FeedbackStatus, FeedbackSentiment } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load environment variables from .env.local or .env
for (const fileName of [".env.local", ".env"]) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    continue;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const prisma = new PrismaClient();

const users = [
  { name: "Aarav Admin", email: "admin@zidio.dev", password: "Admin@123", globalRole: Role.ADMIN },
  { name: "Anika Analyst", email: "analyst@zidio.dev", password: "Analyst@123", globalRole: Role.ANALYST },
  { name: "Vivaan Viewer", email: "viewer@zidio.dev", password: "Viewer@123", globalRole: Role.VIEWER }
] as const;

const categories = ["Video quality", "AI summary", "Action items", "Chat", "Workspace", "Analytics"];
const sources = ["Meeting survey", "In-app widget", "Support ticket", "Customer interview"];
const statuses = [FeedbackStatus.NEW, FeedbackStatus.TRIAGED, FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED];
const sentiments = [FeedbackSentiment.POSITIVE, FeedbackSentiment.NEUTRAL, FeedbackSentiment.NEGATIVE];

async function main() {
  console.log("Cleaning database...");
  await prisma.feedbackItem.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding users...");
  const seededUsers = [];
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        passwordHash
      }
    });
    seededUsers.push(createdUser);
  }

  const [admin, analyst, viewer] = seededUsers;

  console.log("Seeding workspaces...");
  const primaryWorkspace = await prisma.workspace.create({
    data: {
      name: "Zidio Enterprise",
      slug: "zidio-enterprise",
      description: "Primary workspace for IntellMeet enterprise collaboration data."
    }
  });

  const clientWorkspace = await prisma.workspace.create({
    data: {
      name: "LogicVeda Client",
      slug: "logicveda-client",
      description: "Separate tenant used to prove workspace isolation."
    }
  });

  console.log("Seeding memberships...");
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: primaryWorkspace.id, userId: admin.id, role: Role.ADMIN },
      { workspaceId: primaryWorkspace.id, userId: analyst.id, role: Role.ANALYST },
      { workspaceId: primaryWorkspace.id, userId: viewer.id, role: Role.VIEWER }
    ]
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: clientWorkspace.id, userId: admin.id, role: Role.ADMIN },
      { workspaceId: clientWorkspace.id, userId: analyst.id, role: Role.VIEWER }
    ]
  });

  console.log("Seeding feedback items...");
  const feedbackData = Array.from({ length: 128 }, (_, index) => {
    const itemNumber = index + 1;
    const workspace = index % 5 === 0 ? clientWorkspace : primaryWorkspace;
    const category = categories[index % categories.length];

    return {
      workspaceId: workspace.id,
      title: `${category} feedback ${itemNumber}`,
      content: `Seeded feedback ${itemNumber} for IntellMeet. Users reported ${category.toLowerCase()} behavior during meetings, giving the team realistic data for RBAC and workspace-scoped dashboards.`,
      category,
      source: sources[index % sources.length],
      status: statuses[index % statuses.length],
      sentiment: sentiments[index % sentiments.length],
      priority: (index % 4) + 1,
      customer: `Customer ${String(itemNumber).padStart(3, "0")}`,
      createdById: index % 2 === 0 ? admin.id : analyst.id,
      assigneeId: index % 3 === 0 ? analyst.id : null
    };
  });

  await prisma.feedbackItem.createMany({
    data: feedbackData
  });

  console.log("PostgreSQL seed complete.");
  console.table(users.map(({ email, password, globalRole }) => ({ email, password, role: globalRole })));
  console.log(`Created ${feedbackData.length} feedback items across 2 workspaces.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
