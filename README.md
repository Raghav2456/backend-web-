# IntellMeet - Member 1 Backend Foundation

This repository contains the Member 1 backend scope for the Zidio IntellMeet project:

- Next.js app setup with TypeScript and Tailwind CSS
- MongoDB Atlas schema managed with Mongoose
- NextAuth credentials login
- Admin, Analyst, and Viewer RBAC
- Workspace isolation for tenant-safe data access
- Seed data with 128 feedback items across two workspaces

The UI pages are only a lightweight demo layer. The main deliverable is the backend foundation:
database schema, authentication, authorization, workspace scoping, API routes, and seed data.

## Tech Stack

- Next.js App Router
- React + TypeScript
- MongoDB Atlas + Mongoose
- NextAuth
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

3. Update `MONGODB_URI` in `.env` with your MongoDB Atlas connection string.

4. Seed users, workspaces, and feedback.

```bash
npm run db:seed
```

5. Start the app.

```bash
npm run dev
```

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@zidio.dev` | `Admin@123` |
| Analyst | `analyst@zidio.dev` | `Analyst@123` |
| Viewer | `viewer@zidio.dev` | `Viewer@123` |

## RBAC Rules

- `ADMIN`: full access inside assigned workspaces.
- `ANALYST`: can read workspace data and create feedback.
- `VIEWER`: can only read data in assigned workspaces.

Workspace isolation is enforced by membership checks in `src/lib/rbac.ts` and by API filters in:

- `src/app/api/workspaces/route.ts`
- `src/app/api/feedback/route.ts`

## Backend API Endpoints

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a user and first workspace. |
| `GET` | `/api/workspaces` | Signed in | Return only workspaces where the user is a member. |
| `GET` | `/api/feedback` | Signed in | Return feedback scoped to accessible workspaces. |
| `POST` | `/api/feedback` | Analyst or Admin | Create feedback inside a workspace. |
| `GET` | `/api/workspaces/:workspaceId/members` | Workspace member | List members in one workspace. |
| `POST` | `/api/workspaces/:workspaceId/members` | Workspace Admin | Add or invite a member with a role. |
| `PATCH` | `/api/workspaces/:workspaceId/members/:memberId` | Workspace Admin | Update a member role. |
| `DELETE` | `/api/workspaces/:workspaceId/members/:memberId` | Workspace Admin | Remove a member from a workspace. |

## Member 1 Task Mapping

| Assigned task | Implemented in |
| --- | --- |
| Next.js setup | `package.json`, `src/app`, `next.config.ts`, `tsconfig.json` |
| MongoDB + Mongoose schema | `src/models/user.ts`, `src/models/workspace.ts`, `src/models/feedback-item.ts` |
| NextAuth | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Admin / Analyst / Viewer roles | `roles` constants, workspace `members.role`, `src/lib/rbac.ts` |
| Workspace isolation | `Workspace.members`, scoped API filters |
| Seed data: 120+ feedback items | `scripts/seed-mongo.ts` creates 128 feedback items |

## Useful Commands

```bash
npm run dev
npm run build
npm run db:seed
```

## Backend Handoff

The rest of the team can safely build meetings, AI summaries, chat, analytics, and dashboards on top of:

- `User` for authentication
- `Workspace.members` for multi-tenant access control
- `FeedbackItem` for seeded dashboard and analytics data

Every future feature should include a `workspaceId` and validate membership before reading or writing records.
