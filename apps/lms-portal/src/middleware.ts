import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/signup"];
const applicationRoutes = ["/application"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes and webhook routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public routes — allow unauthenticated access
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      // Already authenticated — redirect to dashboard or application
      const role = token.role as string;
      if (role === "student") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.redirect(new URL("/application", request.url));
    }
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Application routes — allow any authenticated user
  if (applicationRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Dashboard routes — require student role
  const role = token.role as string;
  if (role !== "student") {
    // Non-student users are redirected to the application page
    return NextResponse.redirect(new URL("/application", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};
