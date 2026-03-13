import { getServerSession } from "next-auth";
import { createAuthOptions } from "@repo/auth";
import { prisma } from "@repo/db";

export const authOptions = createAuthOptions({
  signInPage: "/login",
  signUpPage: "/signup",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
});

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireStudent() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "student") {
    throw new Error("Forbidden: Student role required");
  }

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, email: true, avatarUrl: true } },
      program: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!studentProfile) {
    throw new Error("Student profile not found");
  }

  return { session, studentProfile };
}
