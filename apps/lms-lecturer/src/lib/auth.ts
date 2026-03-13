import { getServerSession } from "next-auth";
import { createAuthOptions } from "@repo/auth";
import { prisma } from "@repo/db";

export const authOptions = createAuthOptions({
  signInPage: "/login",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
});

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireLecturer() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "lecturer") {
    throw new Error("Forbidden: Lecturer role required");
  }

  const lecturerProfile = await prisma.lecturerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      department: {
        include: {
          faculty: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!lecturerProfile) {
    throw new Error("Lecturer profile not found");
  }

  if (!lecturerProfile.isActive) {
    throw new Error("Lecturer account is deactivated");
  }

  return lecturerProfile;
}

/** Get the active semester */
export async function getActiveSemester() {
  return prisma.semester.findFirst({
    where: { isActive: true },
    include: {
      session: true,
    },
  });
}

/** Get course assignments for a lecturer in the active semester */
export async function getLecturerCourseAssignments(lecturerId: string) {
  const activeSemester = await getActiveSemester();
  if (!activeSemester) return [];

  return prisma.courseAssignment.findMany({
    where: {
      lecturerId,
      semesterId: activeSemester.id,
      isActive: true,
    },
    include: {
      course: true,
      semester: { include: { session: true } },
      enrollments: {
        where: { status: "enrolled" },
      },
      materials: true,
      assignments: true,
      testExams: true,
    },
    orderBy: {
      course: { code: "asc" },
    },
  });
}

/** Verify a lecturer owns a specific course assignment */
export async function verifyLecturerCourseAccess(
  lecturerId: string,
  courseAssignmentId: string
) {
  const assignment = await prisma.courseAssignment.findFirst({
    where: {
      id: courseAssignmentId,
      lecturerId,
    },
  });

  if (!assignment) {
    throw new Error("Course not found or access denied");
  }

  return assignment;
}
