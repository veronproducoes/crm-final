import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // Gestão de usuários/colunas é restrita a Administrador
    const adminOnlyPaths = ["/settings", "/api/users", "/api/columns"];
    if (adminOnlyPaths.some((p) => path.startsWith(p)) && role !== "ADMIN") {
      if (path.startsWith("/api")) {
        return NextResponse.json({ error: "Acesso restrito ao Administrador." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kanban/:path*",
    "/clients/:path*",
    "/emails/:path*",
    "/reports/:path*",
    "/ai/:path*",
    "/settings/:path*",
    "/tasks/:path*",
    "/agenda/:path*",
    "/api/clients/:path*",
    "/api/columns/:path*",
    "/api/subscriptions/:path*",
    "/api/reports/:path*",
    "/api/ai/:path*",
    "/api/tasks/:path*",
    "/api/users/:path*",
  ],
};
