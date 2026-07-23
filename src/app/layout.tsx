import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "LOOP – Auth, RBAC & Workspace Foundation",
  description: "Member 1 implementation for LOOP: PostgreSQL/Prisma auth, RBAC, and workspace isolation."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
