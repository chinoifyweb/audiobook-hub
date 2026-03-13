import NextAuth from "next-auth";
import { createAuthOptions } from "@repo/auth";

const authOptions = createAuthOptions({
  signInPage: "/login",
  signUpPage: "/signup",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
});

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
