import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET() {
  try {
    const { studentProfile } = await requireStudent();

    // Get active semester
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    if (!activeSemester) {
      return NextResponse.json({ courses: [] });
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: studentProfile.id,
        semesterId: activeSemester.id,
      },
      include: {
        courseAssignment: {
          include: {
            course: true,
            lecturer: {
              include: {
                user: { select: { fullName: true } },
              },
            },
            materials: {
              where: { isPublished: true },
              orderBy: { sortOrder: "asc" },
            },
            assignments: {
              where: { isPublished: true },
              orderBy: { dueDate: "asc" },
            },
            testExams: {
              where: { isPublished: true },
              orderBy: { startTime: "asc" },
            },
          },
        },
        grade: true,
      },
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Courses GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
