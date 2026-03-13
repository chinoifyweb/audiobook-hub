import { getServerSession } from "next-auth";
import { createAuthOptions } from "@repo/auth";

export const authOptions = createAuthOptions({
  signInPage: "/login",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
});

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "admin" && session.user.role !== "rector") {
    throw new Error("Forbidden");
  }
  return session;
}
