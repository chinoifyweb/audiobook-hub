import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Author routes
    if (
      pathname.startsWith("/author") &&
      token?.role !== "author" &&
      token?.role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Customer dashboard routes
    if (pathname.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes - always allow
        if (
          pathname === "/" ||
          pathname.startsWith("/books") ||
          pathname.startsWith("/pricing") ||
          pathname.startsWith("/about") ||
          pathname.startsWith("/contact") ||
          pathname.startsWith("/terms") ||
          pathname.startsWith("/privacy") ||
          pathname.startsWith("/faq") ||
          pathname.startsWith("/authors") ||
          pathname.startsWith("/api/webhooks") ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") ||
          pathname.startsWith("/forgot-password") ||
          pathname.startsWith("/verify-email")
        ) {
          return true;
        }

        // Protected routes require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
