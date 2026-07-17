export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/workspaces/:path*", "/api/feedback/:path*"]
};
