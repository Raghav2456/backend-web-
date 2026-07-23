import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          feedbackItems: {
            orderBy: [
              { priority: "desc" },
              { createdAt: "desc" }
            ],
            take: 8
          },
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

  const workspaceCards = memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    slug: membership.workspace.slug,
    description: membership.workspace.description,
    role: membership.role,
    feedbackItems: membership.workspace.feedbackItems,
    feedbackCount: membership.workspace._count.feedbackItems
  }));

  const visibleFeedbackCount = workspaceCards.reduce((total, workspace) => total + workspace.feedbackCount, 0);
  const canAnalyze = session.user.role === "ADMIN" || session.user.role === "ANALYST";

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">LOOP – Workspace Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as {session.user.email} &nbsp;·&nbsp; global role: <strong>{session.user.role}</strong>.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="Accessible workspaces" value={workspaceCards.length.toString()} />
          <Metric label="Visible feedback items" value={visibleFeedbackCount.toString()} />
          <Metric label="Create feedback" value={canAnalyze ? "Allowed" : "Viewer only"} />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {workspaceCards.map((workspace) => {
            return (
              <article key={workspace.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{workspace.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{workspace.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {workspace.role}
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Feedback</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {workspace.feedbackItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-900">{item.title}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.category}</div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{item.status.replace("_", " ")}</td>
                          <td className="px-3 py-3 font-semibold text-amber">{item.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}
