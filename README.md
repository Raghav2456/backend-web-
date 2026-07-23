Backend scope for the Zidio IntellMeet project:

- Next.js App Router with TypeScript and Tailwind CSS
- PostgreSQL database managed with **Prisma** (shared schema, aligned with Mandar's backend)
- NextAuth credentials login with JWT sessions
- Admin, Analyst, and Viewer RBAC enforced at the API and session layer
- Workspace isolation for tenant-safe data access
- Seed data with 128 feedback items across two workspaces

The UI pages are a lightweight demo layer. The main deliverable is the backend foundation:
database schema, authentication, authorization, workspace scoping, API routes, and seed data.

> **Note**: The `/api/feedback` module is owned by **Mandar**. This repository does not implement
> a conflicting feedback endpoint. The `FeedbackItem` model is kept in the shared Prisma schema
> so Mandar's service can reference the same tables.

## Tech Stack

- Next.js App Router
- React + TypeScript
- **PostgreSQL** (via [Neon](https://neon.tech)) + **Prisma ORM**
- NextAuth (credentials + JWT strategy)
- Tailwind CSS

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy environment variables.

```bash
copy .env.example .env
```

3. Update `DATABASE_URL` in `.env` with your PostgreSQL (Neon) connection string.

4. Push the Prisma schema and generate the client.

```bash
npx prisma generate
npx prisma db push
```

5. Seed users, workspaces, and feedback.

```bash
npm run db:seed
```

6. Start the app.

```bash
npm run dev
```

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@loop.dev` | `Admin@123` |
| Analyst | `analyst@loop.dev` | `Analyst@123` |
| Viewer | `viewer@loop.dev` | `Viewer@123` |

## RBAC Rules

- `ADMIN`: full access inside assigned workspaces (manage members, read/write all data).
- `ANALYST`: can read workspace data and create feedback.
- `VIEWER`: can only read data in assigned workspaces.

Workspace isolation is enforced by membership checks in `src/lib/rbac.ts` and by API filters in:

- `src/app/api/workspaces/route.ts`
- `src/app/api/workspaces/[workspaceId]/members/route.ts`

## Session Shape

After login, `session.user` contains:

```ts
{
  id: string;           // UUID from the User table
  role: "ADMIN" | "ANALYST" | "VIEWER";  // global (platform) role
  workspaceId: string | null;            // user's primary workspace (first membership)
  workspaces: Array<{ id, name, slug, role }>;  // all workspace memberships
}
```

## Backend API Endpoints

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a user and first workspace. |
| `GET` | `/api/workspaces` | Signed in | Return only workspaces where the user is a member. |
| `GET` | `/api/workspaces/:workspaceId/members` | Workspace member | List members in one workspace. |
| `POST` | `/api/workspaces/:workspaceId/members` | Workspace Admin | Add or invite a member with a role. |
| `PATCH` | `/api/workspaces/:workspaceId/members/:memberId` | Workspace Admin | Update a member role. |
| `DELETE` | `/api/workspaces/:workspaceId/members/:memberId` | Workspace Admin | Remove a member from a workspace. |

> `/api/feedback` is **Mandar's module** — not implemented here.

## Prisma Schema Summary

The shared `prisma/schema.prisma` defines:

- **User** – platform accounts with `globalRole`
- **Workspace** – multi-tenant isolation unit
- **WorkspaceMember** – join table with per-workspace `role` (unique on `[workspaceId, userId]`)
- **FeedbackItem** – owned by Mandar; model retained in schema for referential integrity

## Member 1 Task Mapping

| Assigned task | Implemented in |
| --- | --- |
| Next.js setup | `package.json`, `src/app`, `next.config.ts`, `tsconfig.json` |
| PostgreSQL + Prisma schema | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| NextAuth | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Admin / Analyst / Viewer roles | `src/lib/constants.ts`, `src/lib/rbac.ts` |
| Session with id, workspaceId, role | `src/lib/auth.ts` (JWT + session callbacks), `src/types/next-auth.d.ts` |
| Workspace isolation | `WorkspaceMember` join table, scoped API filters |
| Seed data: 128 feedback items | `scripts/seed.ts` |

## Useful Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run db:seed      # seed PostgreSQL with test data
npx prisma studio    # visual database browser
```

## Backend Handoff

The rest of the team can safely build meetings, AI summaries, chat, analytics, and dashboards on top of:

- `User` for authentication and session identity
- `Workspace` + `WorkspaceMember` for multi-tenant access control
- `FeedbackItem` (Mandar's module) for seeded dashboard and analytics data

Every future feature must include a `workspaceId` field and validate membership before reading or writing records.
