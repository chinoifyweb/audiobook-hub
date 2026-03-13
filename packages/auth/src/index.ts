import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";

export interface AuthAppConfig {
  /** Login page path for this app */
  signInPage: string;
  /** Signup page path for this app (optional) */
  signUpPage?: string;
  /** Error page path */
  errorPage?: string;
  /** Cookie domain for cross-subdomain auth (e.g., '.bba.org.ng') */
  cookieDomain?: string;
}

export function createAuthOptions(config: AuthAppConfig): NextAuthOptions {
  const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

  return {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: config.signInPage,
      newUser: config.signUpPage,
      error: config.errorPage || config.signInPage,
    },
    cookies: config.cookieDomain
      ? {
          sessionToken: {
            name: useSecureCookies
              ? "__Secure-next-auth.session-token"
              : "next-auth.session-token",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: useSecureCookies,
              domain: config.cookieDomain,
            },
          },
          callbackUrl: {
            name: useSecureCookies
              ? "__Secure-next-auth.callback-url"
              : "next-auth.callback-url",
            options: {
              sameSite: "lax",
              path: "/",
              secure: useSecureCookies,
              domain: config.cookieDomain,
            },
          },
          csrfToken: {
            name: useSecureCookies
              ? "__Host-next-auth.csrf-token"
              : "next-auth.csrf-token",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: useSecureCookies,
            },
          },
        }
      : undefined,
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatarUrl,
            role: user.role,
          };
        },
      }),
      ...(process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID.length > 0 &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_SECRET.length > 0
        ? [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            }),
          ]
        : []),
    ],
    callbacks: {
      async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }

        if (trigger === "update" && session) {
          token.name = session.name;
          token.role = session.role;
        }

        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id;
          session.user.role = token.role;
        }
        return session;
      },
    },
  };
}
