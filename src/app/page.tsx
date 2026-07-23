import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10">
      <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <h1 className="mt-0 max-w-3xl text-5xl font-bold leading-tight text-ink md:text-6xl">
            LOOP – Auth, RBAC & Workspace Foundation
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Member 1 scope is ready for the rest of the LOOP platform: PostgreSQL + Prisma,
            NextAuth credentials login, Admin/Analyst/Viewer roles, workspace isolation, and seeded feedback.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Seed accounts</h2>
          <div className="mt-5 space-y-4 text-sm">
            {[
              ["Admin", "admin@zidio.dev", "Admin@123"],
              ["Analyst", "analyst@zidio.dev", "Analyst@123"],
              ["Viewer", "viewer@zidio.dev", "Viewer@123"]
            ].map(([role, email, password]) => (
              <div key={email} className="rounded-md border border-slate-200 p-4">
                <div className="font-semibold text-slate-900">{role}</div>
                <div className="mt-1 text-slate-600">{email}</div>
                <div className="mt-1 font-mono text-xs text-slate-500">{password}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
